#!/usr/bin/env bash
# One-time VPS setup for treble-quest. Run as root (or via sudo) on the VPS:
#
#   curl -fsSL https://raw.githubusercontent.com/andrerafaelff/treble-quest/main/deploy/bootstrap-vps.sh | sudo bash
#
# Idempotent — safe to re-run. After bootstrap, every push to main on GitHub
# triggers the CI workflow which SSHes back in to install the new build.
#
# Requirements:
#   - The SSH user used by GitHub Actions (VPS_USER secret) must have
#     passwordless sudo. The CI script uses sudo to write to /etc, /var/www,
#     and /opt, and to manage systemd.

set -euo pipefail

APP_DIR=/opt/treble-quest
SITE_DIR=/var/www/treble-quest
DOMAIN=treble.quest
NGINX_SITE=/etc/nginx/sites-available/treble-quest

echo "[bootstrap] creating service user 'trebleq'"
if ! id trebleq >/dev/null 2>&1; then
  useradd --system --create-home --shell /usr/sbin/nologin trebleq
fi

echo "[bootstrap] installing Node 22 if needed"
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs build-essential
fi

echo "[bootstrap] installing nginx + certbot if needed"
apt-get install -y nginx certbot python3-certbot-nginx rsync

echo "[bootstrap] making app + site directories"
mkdir -p "$APP_DIR/server/data" "$SITE_DIR"
chown -R trebleq:trebleq "$APP_DIR"
chmod 755 "$SITE_DIR"

echo "[bootstrap] configuring nginx site"
if [ ! -f "$NGINX_SITE" ]; then
  cat > "$NGINX_SITE" <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name treble.quest www.treble.quest;

    root /var/www/treble-quest;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    location ~* \.(?:css|js|svg|png|jpg|jpeg|webp|avif|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files $uri =404;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name api.treble.quest;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
NGINX
  ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/treble-quest
  nginx -t && systemctl reload nginx
fi

echo ""
echo "[bootstrap] done."
echo ""
echo "Next steps:"
echo "  1. Point DNS:"
echo "       A    $DOMAIN          → <VPS IP>"
echo "       A    www.$DOMAIN      → <VPS IP>"
echo "       A    api.$DOMAIN      → <VPS IP>"
echo ""
echo "  2. Issue HTTPS certs (after DNS has propagated):"
echo "       sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "       sudo certbot --nginx -d api.$DOMAIN"
echo ""
echo "  3. Ensure the deploy user has passwordless sudo. Edit /etc/sudoers.d/deploy:"
echo "       <your-deploy-user> ALL=(ALL) NOPASSWD: ALL"
echo ""
echo "  4. Add the VPS_SSH_KEY public key to that user's ~/.ssh/authorized_keys."
echo ""
echo "  5. Push to main on GitHub — CI will deploy automatically."
