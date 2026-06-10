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
need python3
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

patch_r_proxy_file() {
  local file="$1"
  local backup

  backup="$file.treble-backup-$(date +%Y%m%d%H%M%S)"
  if ! $SUDO cp "$file" "$backup"; then
    fail "could not back up $file before adding /r/ proxy"
  fi

  if $SUDO python3 - "$file" "$DOMAIN" "$GATEWAY" "$API_PORT" <<'PY'
import re
import sys

path, domain, gateway, api_port = sys.argv[1:]
with open(path, encoding='utf-8') as fh:
    content = fh.read()

proxy_block = f"""

    # Proxy share-result pages to the API server
    location /r/ {{
        proxy_pass http://{gateway}:{api_port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 10s;
    }}
"""

def server_blocks(text):
    for match in re.finditer(r'\bserver\s*\{', text):
        depth = 0
        for index in range(match.end() - 1, len(text)):
            char = text[index]
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    yield match.start(), index + 1, text[match.start():index + 1]
                    break

pieces = []
cursor = 0
matched = 0
changed = 0
has_r = 0

for start, end, block in server_blocks(content):
    server_name = re.search(r'^\s*server_name\s+([^;]*);', block, re.M)
    if not server_name:
        continue
    names = server_name.group(1).split()
    if domain not in names and f'www.{domain}' not in names:
        continue
    matched += 1
    if 'location /r/' in block:
        has_r += 1
        continue
    updated, count = re.subn(r'(\n\s+location\s+/\s*\{)', proxy_block + r'\1', block, count=1)
    if count == 0:
        continue
    pieces.append(content[cursor:start])
    pieces.append(updated)
    cursor = end
    changed += 1

if changed:
    pieces.append(content[cursor:])
    content = ''.join(pieces)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(content)
    sys.exit(0)

if has_r:
    sys.exit(2)
sys.exit(3)
PY
  then
    :
  else
    local code=$?
    if [ "$code" -eq 2 ]; then
      $SUDO rm -f "$backup"
      log "/r/ proxy already present in $file"
      return 1
    fi
    if [ "$code" -eq 3 ]; then
      $SUDO rm -f "$backup"
      log "no main-site /r/ insertion point found in $file"
      return 1
    fi
    fail "could not add /r/ proxy to $file"
  fi

  log "added /r/ proxy to $file (backup: $backup)"
  return 0
}

patch_container_r_proxy() {
  local file="$1"
  local tmp
  local backup

  tmp="$(mktemp)"
  if ! $SUDO docker cp "$EDGE_CID:$file" "$tmp"; then
    rm -f "$tmp"
    fail "could not copy $file out of $EDGE_NAME before adding /r/ proxy"
  fi

  if DOMAIN="$DOMAIN" GATEWAY="$GATEWAY" API_PORT="$API_PORT" python3 - "$tmp" <<'PY'
import os
import re
import sys

path = sys.argv[1]
domain = os.environ['DOMAIN']
gateway = os.environ['GATEWAY']
api_port = os.environ['API_PORT']

with open(path, encoding='utf-8') as fh:
    content = fh.read()

proxy_block = f"""

    # Proxy share-result pages to the API server
    location /r/ {{
        proxy_pass http://{gateway}:{api_port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 10s;
    }}
"""

def server_blocks(text):
    for match in re.finditer(r'\bserver\s*\{', text):
        depth = 0
        for index in range(match.end() - 1, len(text)):
            char = text[index]
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    yield match.start(), index + 1, text[match.start():index + 1]
                    break

pieces = []
cursor = 0
matched = 0
changed = 0
has_r = 0

for start, end, block in server_blocks(content):
    server_name = re.search(r'^\s*server_name\s+([^;]*);', block, re.M)
    if not server_name:
        continue
    names = server_name.group(1).split()
    if domain not in names and f'www.{domain}' not in names:
        continue
    matched += 1
    if 'location /r/' in block:
        has_r += 1
        continue
    updated, count = re.subn(r'(\n\s+location\s+/\s*\{)', proxy_block + r'\1', block, count=1)
    if count == 0:
        continue
    pieces.append(content[cursor:start])
    pieces.append(updated)
    cursor = end
    changed += 1

if changed:
    pieces.append(content[cursor:])
    content = ''.join(pieces)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(content)
    sys.exit(0)

if has_r:
    sys.exit(2)
sys.exit(3)
PY
  then
    :
  else
    local code=$?
    rm -f "$tmp"
    if [ "$code" -eq 2 ]; then
      log "/r/ proxy already present in $file"
      return 1
    fi
    if [ "$code" -eq 3 ]; then
      log "no main-site /r/ insertion point found in $file"
      return 1
    fi
    fail "could not add /r/ proxy to copied $file"
  fi

  backup="$file.treble-backup-$(date +%Y%m%d%H%M%S)"
  $SUDO docker exec "$EDGE_CID" sh -c "cp '$file' '$backup'"
  if ! $SUDO docker cp "$tmp" "$EDGE_CID:$file"; then
    rm -f "$tmp"
    fail "could not copy patched /r/ proxy config back to $EDGE_NAME:$file"
  fi
  rm -f "$tmp"

  log "added /r/ proxy to $file inside $EDGE_NAME (backup: $backup)"
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
    if patch_r_proxy_file "$host_file"; then
      PATCHED=1
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
  else
    PATCHED=1
    log "patched $file (backup: $backup)"
  fi

  if patch_container_r_proxy "$file"; then
    PATCHED=1
  fi
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
    break
  fi
  sleep 3
  if [ "$i" -eq 6 ]; then
    fail "public API still unhealthy after shared-edge repair"
  fi
done

PROBE_BODY="$(mktemp)"
if ! PROBE_STATUS="$(
  curl -sS --connect-timeout 5 --max-time 10 \
    -o "$PROBE_BODY" \
    -w '%{http_code}' \
    "https://$DOMAIN/r/__treble_probe_$(date +%s)__"
)"; then
  rm -f "$PROBE_BODY"
  fail "could not reach public /r/ probe"
fi

if [ "$PROBE_STATUS" = "404" ] && grep -q 'Result not found' "$PROBE_BODY"; then
  rm -f "$PROBE_BODY"
  log "public /r/ share route reaches the API"
  exit 0
fi

log "public /r/ probe returned HTTP $PROBE_STATUS; first response lines:"
sed -n '1,20p' "$PROBE_BODY" || true
rm -f "$PROBE_BODY"
fail "public /r/ share route still falls through instead of returning API 404"
