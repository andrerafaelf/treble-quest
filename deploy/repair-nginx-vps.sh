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

patch_container_proxy_pass() {
  local file="$1"

  $SUDO docker exec "$EDGE_CID" sh -c '
    set -e
    file="$1"
    api_port="$2"
    api_domain="$3"
    gateway="$4"
    tmp="$(mktemp)"

    sed -E "s#proxy_pass[[:space:]]+https?://[^;]*(:${api_port}|${api_domain}|127[.]0[.]0[.]1|localhost)[^;]*;#proxy_pass http://${gateway}:${api_port};#g" "$file" > "$tmp"
    cat "$tmp" > "$file"
    rm -f "$tmp"
  ' sh "$file" "$API_PORT" "$API_DOMAIN" "$GATEWAY"
}

patch_host_proxy_pass() {
  local host_file="$1"
  local tmp
  local backup

  tmp="$(mktemp)"
  if ! $SUDO sed -E "s#proxy_pass[[:space:]]+https?://[^;]*(:${API_PORT}|${API_DOMAIN}|127[.]0[.]0[.]1|localhost)[^;]*;#proxy_pass http://${GATEWAY}:${API_PORT};#g" "$host_file" > "$tmp"; then
    rm -f "$tmp"
    fail "could not read and patch host file $host_file"
  fi

  if $SUDO cmp -s "$tmp" "$host_file"; then
    rm -f "$tmp"
    return 1
  fi

  backup="$host_file.treble-backup-$(date +%Y%m%d%H%M%S)"
  if ! $SUDO cp "$host_file" "$backup"; then
    rm -f "$tmp"
    fail "could not back up host file $host_file"
  fi
  if ! $SUDO sh -c 'cat "$1" > "$2"' sh "$tmp" "$host_file"; then
    rm -f "$tmp"
    fail "could not write patched host file $host_file"
  fi
  rm -f "$tmp"

  log "patched host file $host_file (backup: $backup)"
  return 0
}

host_path_for_container_path() {
  local file="$1"
  local best_dest=""
  local best_host=""
  local source
  local dest
  local rw
  local rel

  while IFS="$(printf '\t')" read -r source dest rw; do
    [ -n "$source" ] || continue

    if [ "$file" = "$dest" ]; then
      printf '%s\n' "$source"
      return 0
    fi

    case "$file" in
      "$dest"/*)
        if [ "${#dest}" -gt "${#best_dest}" ]; then
          rel="${file#"$dest"/}"
          best_dest="$dest"
          best_host="$source/$rel"
        fi
        ;;
    esac
  done <<EOF
$MOUNT_TABLE
EOF

  [ -n "$best_host" ] || return 1
  printf '%s\n' "$best_host"
}

container_fetch() {
  local url="$1"
  $SUDO docker exec "$EDGE_CID" sh -c '
    url="$1"

    if command -v curl >/dev/null 2>&1; then
      curl -fsS --connect-timeout 2 --max-time 5 "$url"
      exit $?
    fi

    if command -v wget >/dev/null 2>&1; then
      wget -q -O - -T 5 "$url"
      exit $?
    fi

    if command -v nc >/dev/null 2>&1; then
      target="${url#http://}"
      path="/${target#*/}"
      if [ "$path" = "/$target" ]; then
        path="/"
      fi
      hostport="${target%%/*}"
      host="${hostport%%:*}"
      port="${hostport##*:}"
      printf "GET %s HTTP/1.1\r\nHost: %s\r\nConnection: close\r\n\r\n" "$path" "$hostport" |
        nc -w 5 "$host" "$port" |
        grep -q "200 OK"
      exit $?
    fi

    echo "no curl, wget, or nc available inside edge container" >&2
    exit 127
  ' sh "$url"
}

allow_edge_subnet_to_api() {
  [ -n "${EDGE_SUBNET:-}" ] || return 0

  log "allowing $EDGE_SUBNET to reach $GATEWAY:$API_PORT on the host"

  if command -v ufw >/dev/null 2>&1 && $SUDO ufw status 2>/dev/null | grep -qi '^Status: active'; then
    $SUDO ufw allow proto tcp from "$EDGE_SUBNET" to "$GATEWAY" port "$API_PORT" >/dev/null
  fi

  if command -v iptables >/dev/null 2>&1; then
    $SUDO iptables -C INPUT -p tcp -s "$EDGE_SUBNET" -d "$GATEWAY" --dport "$API_PORT" -j ACCEPT 2>/dev/null ||
      $SUDO iptables -I INPUT 1 -p tcp -s "$EDGE_SUBNET" -d "$GATEWAY" --dport "$API_PORT" -j ACCEPT
  fi
}

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

EDGE_NETWORK="$(
  $SUDO docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$EDGE_CID" |
    awk 'NF { print; exit }'
)"

[ -n "$EDGE_NETWORK" ] || fail "could not determine Docker network for $EDGE_NAME"
log "edge Docker network: $EDGE_NETWORK"

GATEWAY="$(
  $SUDO docker inspect -f '{{range .NetworkSettings.Networks}}{{if .Gateway}}{{println .Gateway}}{{end}}{{end}}' "$EDGE_CID" |
    awk 'NF { print; exit }'
)"

[ -n "$GATEWAY" ] || fail "could not determine Docker gateway for $EDGE_NAME"
log "using Docker gateway $GATEWAY for host API access"

EDGE_SUBNET="$(
  $SUDO docker network inspect -f '{{range .IPAM.Config}}{{if .Subnet}}{{println .Subnet}}{{end}}{{end}}' "$EDGE_NETWORK" |
    awk 'NF { print; exit }'
)"

if [ -n "$EDGE_SUBNET" ]; then
  log "edge Docker subnet: $EDGE_SUBNET"
else
  log "could not determine edge Docker subnet; skipping firewall auto-allow"
fi

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

allow_edge_subnet_to_api

if ! EDGE_HEALTH_OUTPUT="$(container_fetch "http://$GATEWAY:$API_PORT/health" 2>&1)"; then
  log "edge container health probe failed:"
  echo "$EDGE_HEALTH_OUTPUT"
  fail "$EDGE_NAME cannot reach host API at http://$GATEWAY:$API_PORT/health"
fi
log "edge container can reach host API"

CONFIG_FILES="$(
  $SUDO docker exec "$EDGE_CID" sh -c \
    "grep -RslE '($API_DOMAIN|$DOMAIN|127[.]0[.]0[.]1:$API_PORT|localhost:$API_PORT|:$API_PORT)' /etc/nginx 2>/dev/null | grep -v '[.]treble-backup-' || true"
)"

[ -n "$CONFIG_FILES" ] || fail "could not find Treble Quest nginx config inside $EDGE_NAME"

log "nginx config mounts:"
MOUNT_TABLE="$($SUDO docker inspect -f '{{range .Mounts}}{{printf "%s\t%s\t%v\n" .Source .Destination .RW}}{{end}}' "$EDGE_CID")"
printf '%s\n' "$MOUNT_TABLE" | awk -F '\t' '{ print $1 " -> " $2 " (rw=" $3 ")" }'

PATCHED=0
while IFS= read -r file; do
  [ -n "$file" ] || continue
  log "checking $file"
  if ! $SUDO docker exec "$EDGE_CID" sh -c "grep -Eq '($API_DOMAIN|$DOMAIN|:$API_PORT)' '$file'"; then
    continue
  fi

  if host_file="$(host_path_for_container_path "$file")"; then
    if patch_host_proxy_pass "$host_file"; then
      PATCHED=1
    else
      log "no Treble proxy target needed changing in $host_file"
    fi
    continue
  fi

  backup="$file.treble-backup-$(date +%Y%m%d%H%M%S)"
  $SUDO docker exec "$EDGE_CID" sh -c "cp '$file' '$backup'"
  if ! patch_container_proxy_pass "$file"; then
    fail "could not patch $file inside $EDGE_NAME and no host bind mount source was found"
  fi

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

if [ "$PATCHED" -eq 0 ]; then
  log "no Treble proxy target changed; continuing to public health check"
fi

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
