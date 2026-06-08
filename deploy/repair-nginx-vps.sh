#!/usr/bin/env bash
# Repair Treble Quest when the public 80/443 edge is a shared Dockerized nginx.
#
# The API systemd service runs on the host. A Dockerized nginx container cannot
# reach that service at 127.0.0.1, because that address points back to the
# container. This script binds the API to the Docker network gateway and rewrites
# only Treble Quest nginx proxy_pass targets to that gateway.

set -euo pipefail

APP_ENV=/etc/treble-quest.env
SERVICE=treble-quest-api
API_PORT="${API_PORT:-8787}"
DOMAIN="${DOMAIN:-treble.quest}"
API_DOMAIN="${API_DOMAIN:-api.treble.quest}"

if [ "$(id -u)" -eq 0 ]; then
  SUDO=
else
  SUDO=sudo
fi

log() {
  echo "[repair-shared-edge] $*"
}

fail() {
  echo "[repair-shared-edge] FATAL: $*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

need docker
need awk
need grep
need sed
need curl

[ -f "$APP_ENV" ] || fail "$APP_ENV does not exist; run deploy first"

EDGE_CID="$(
  $SUDO docker ps --format '{{.ID}} {{.Ports}}' |
    awk '/0\.0\.0\.0:443->|:::443->/ { print $1; exit }'
)"

[ -n "$EDGE_CID" ] || fail "could not find a Docker container publishing 443"

EDGE_NAME="$($SUDO docker inspect -f '{{.Name}}' "$EDGE_CID" | sed 's#^/##')"
EDGE_IMAGE="$($SUDO docker inspect -f '{{.Config.Image}}' "$EDGE_CID")"
log "public edge container: $EDGE_NAME ($EDGE_IMAGE, $EDGE_CID)"

if ! $SUDO docker exec "$EDGE_CID" sh -c 'command -v nginx >/dev/null 2>&1'; then
  $SUDO docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}'
  fail "the container publishing 443 is not an nginx container; configure the shared edge to proxy $API_DOMAIN to the host API"
fi

GATEWAY="$(
  $SUDO docker inspect -f '{{range .NetworkSettings.Networks}}{{if .Gateway}}{{println .Gateway}}{{end}}{{end}}' "$EDGE_CID" |
    awk 'NF { print; exit }'
)"

[ -n "$GATEWAY" ] || fail "could not determine Docker gateway for $EDGE_NAME"
log "using Docker gateway $GATEWAY for host API access"

TMP_ENV="$(mktemp)"
cp "$APP_ENV" "$TMP_ENV"
if grep -q '^HOST=' "$TMP_ENV"; then
  sed -i -E "s#^HOST=.*#HOST=$GATEWAY#" "$TMP_ENV"
else
  printf '\nHOST=%s\n' "$GATEWAY" >> "$TMP_ENV"
fi
if grep -q '^PORT=' "$TMP_ENV"; then
  sed -i -E "s#^PORT=.*#PORT=$API_PORT#" "$TMP_ENV"
else
  printf 'PORT=%s\n' "$API_PORT" >> "$TMP_ENV"
fi
$SUDO install -m 0640 -o root -g trebleq "$TMP_ENV" "$APP_ENV"
rm -f "$TMP_ENV"

log "restarting $SERVICE on $GATEWAY:$API_PORT"
$SUDO systemctl restart "$SERVICE"

for i in $(seq 1 12); do
  if curl -fsS --connect-timeout 2 --max-time 5 "http://$GATEWAY:$API_PORT/health" >/dev/null; then
    log "host API healthy on Docker gateway"
    break
  fi
  sleep 2
  if [ "$i" -eq 12 ]; then
    $SUDO journalctl -u "$SERVICE" --no-pager -n 80 || true
    fail "API did not become healthy on $GATEWAY:$API_PORT"
  fi
done

if ! $SUDO docker exec "$EDGE_CID" sh -c "curl -fsS --connect-timeout 2 --max-time 5 http://$GATEWAY:$API_PORT/health >/dev/null 2>&1 || wget -qO- --timeout=5 http://$GATEWAY:$API_PORT/health >/dev/null 2>&1"; then
  fail "$EDGE_NAME cannot reach host API at http://$GATEWAY:$API_PORT/health"
fi
log "edge container can reach host API"

CONFIG_FILES="$(
  $SUDO docker exec "$EDGE_CID" sh -c \
    "grep -RslE '($API_DOMAIN|$DOMAIN|127[.]0[.]0[.]1:$API_PORT|localhost:$API_PORT|:$API_PORT)' /etc/nginx 2>/dev/null || true"
)"

[ -n "$CONFIG_FILES" ] || fail "could not find Treble Quest nginx config inside $EDGE_NAME"

log "nginx config mounts:"
$SUDO docker inspect -f '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}' "$EDGE_CID" || true

PATCHED=0
while IFS= read -r file; do
  [ -n "$file" ] || continue
  log "checking $file"
  if ! $SUDO docker exec "$EDGE_CID" sh -c "grep -Eq '($API_DOMAIN|$DOMAIN|:$API_PORT)' '$file'"; then
    continue
  fi

  backup="$file.treble-backup-$(date +%Y%m%d%H%M%S)"
  $SUDO docker exec "$EDGE_CID" sh -c "cp '$file' '$backup'"
  $SUDO docker exec "$EDGE_CID" sh -c \
    "sed -i -E 's#proxy_pass[[:space:]]+https?://[^;]*(:$API_PORT|$API_DOMAIN|127[.]0[.]0[.]1|localhost)[^;]*;#proxy_pass http://$GATEWAY:$API_PORT;#g' '$file'"

  if $SUDO docker exec "$EDGE_CID" sh -c "cmp -s '$file' '$backup'"; then
    $SUDO docker exec "$EDGE_CID" sh -c "rm -f '$backup'"
    log "no Treble proxy target needed changing in $file"
    continue
  fi

  PATCHED=1
  log "patched $file (backup: $backup)"
done <<EOF
$CONFIG_FILES
EOF

[ "$PATCHED" -eq 1 ] || fail "found nginx config but did not patch any Treble proxy_pass target"

if ! $SUDO docker exec "$EDGE_CID" nginx -t; then
  fail "nginx config failed validation after patch; backups remain next to patched files"
fi

$SUDO docker exec "$EDGE_CID" nginx -s reload
log "reloaded shared nginx edge"

for i in $(seq 1 6); do
  if curl -fsS --connect-timeout 5 --max-time 10 "https://$API_DOMAIN/health" >/dev/null; then
    log "public API healthy through shared edge"
    exit 0
  fi
  sleep 3
done

fail "public API still unhealthy after shared-edge repair"
