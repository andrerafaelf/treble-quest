#!/usr/bin/env bash
# Add /r/ proxy block to the treble-quest nginx site if it's missing.
# Run on the VPS as a user with sudo access:
#
#   sudo bash deploy/fix-nginx-r-proxy.sh
#
# Safe to re-run — exits early if the block is already present.

set -euo pipefail

NGINX_SITE=/etc/nginx/sites-available/treble-quest

if [ "$(id -u)" -ne 0 ]; then
  echo "Re-running with sudo..."
  exec sudo bash "$0" "$@"
fi

if [ ! -f "$NGINX_SITE" ]; then
  echo "ERROR: $NGINX_SITE not found. Run bootstrap-vps.sh first." >&2
  exit 1
fi

if grep -q 'location /r/' "$NGINX_SITE"; then
  echo "OK: /r/ proxy block already present in $NGINX_SITE — nothing to do."
  exit 0
fi

echo "Adding /r/ proxy block to $NGINX_SITE..."

# Back up the current config
cp "$NGINX_SITE" "$NGINX_SITE.bak-$(date +%Y%m%d%H%M%S)"

# Insert the /r/ proxy location block before the first plain "location /" block
python3 - "$NGINX_SITE" <<'PYEOF'
import sys, re

path = sys.argv[1]
with open(path) as f:
    content = f.read()

proxy_block = """
    # Proxy share-result pages to the API server
    location /r/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 10s;
    }

"""

# Insert before the first bare "location /" (not location /r/ etc.)
new_content = re.sub(
    r'(\n\s+location\s+/\s*\{)',
    proxy_block + r'\1',
    content,
    count=1
)

with open(path, 'w') as f:
    f.write(new_content)

print("Done.")
PYEOF

echo "Testing nginx config..."
nginx -t

echo "Reloading nginx..."
systemctl reload nginx

echo ""
echo "SUCCESS: /r/ proxy is now active. Test with:"
echo "  curl -I https://treble.quest/r/test123"
echo "(expect 404 from API server, not the SvelteKit 200 shell)"
