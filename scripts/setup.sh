#!/usr/bin/env bash
# =============================================================================
#  DinLink — First-time VPS Setup
#  Run once on a fresh Ubuntu 22.04 / 24.04 server as root.
#
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/rozenblatnoam/beit-din/main/scripts/setup.sh | bash
#  Or after cloning:
#    bash scripts/setup.sh
# =============================================================================
set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()  { echo -e "${GREEN}  ✓ $*${NC}"; }
info(){ echo -e "${CYAN}  → $*${NC}"; }
warn(){ echo -e "${YELLOW}  ⚠ $*${NC}"; }
die() { echo -e "${RED}  ✗ $*${NC}"; exit 1; }

APP_DIR="/opt/dinlink"
REPO="https://github.com/rozenblatnoam/beit-din.git"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      DinLink — VPS Setup Script      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Must run as root ─────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || die "Run as root: sudo bash scripts/setup.sh"

# ── Ask for domain ───────────────────────────────────────────────────────────
if [[ -z "${DOMAIN:-}" ]]; then
    read -rp "  Enter your domain (e.g. dinlink.co.il): " DOMAIN
fi
[[ -n "$DOMAIN" ]] || die "Domain cannot be empty"
echo ""

# =============================================================================
# STEP 1 — System packages
# =============================================================================
echo -e "${YELLOW}[1/7] Installing system packages...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    git curl wget gnupg ca-certificates \
    python3 python3-pip python3-venv \
    debian-keyring debian-archive-keyring apt-transport-https \
    ufw fail2ban

ok "System packages installed"

# ── Node.js 22 ───────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    info "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - &>/dev/null
    apt-get install -y -qq nodejs
fi
ok "Node.js $(node -v)"

# ── Docker ───────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh &>/dev/null
    systemctl enable docker --quiet
    systemctl start docker
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ── Caddy ────────────────────────────────────────────────────────────────────
if ! command -v caddy &>/dev/null; then
    info "Installing Caddy..."
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        | tee /etc/apt/sources.list.d/caddy-stable.list &>/dev/null
    apt-get update -qq
    apt-get install -y -qq caddy
fi
ok "Caddy $(caddy version | head -1)"

# =============================================================================
# STEP 2 — Clone / update repository
# =============================================================================
echo ""
echo -e "${YELLOW}[2/7] Setting up repository...${NC}"

if [[ -d "$APP_DIR/.git" ]]; then
    info "Repo already exists — pulling latest..."
    git -C "$APP_DIR" pull --ff-only origin main
else
    info "Cloning repository..."
    git clone "$REPO" "$APP_DIR"
fi
ok "Repository ready at $APP_DIR"

# =============================================================================
# STEP 3 — Environment file
# =============================================================================
echo ""
echo -e "${YELLOW}[3/7] Configuring environment...${NC}"

ENV_FILE="$APP_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
    DB_PASS=$(python3 -c "import secrets; print(secrets.token_hex(16))")

    cat > "$ENV_FILE" << EOF
# ─── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://beitdin_user:${DB_PASS}@localhost:5433/beitdin_db

# ─── JWT ─────────────────────────────────────────────────────────────────────
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# ─── Google OAuth ────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://${DOMAIN}/auth/google/callback
GOOGLE_REDIRECT_URI_DAYAN=https://${DOMAIN}/auth/dayan/google/callback
GOOGLE_REDIRECT_URI_LAWYER=https://${DOMAIN}/auth/lawyer/google/callback

# ─── Google Drive ────────────────────────────────────────────────────────────
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_JSON={}

# ─── Hyp Payment ─────────────────────────────────────────────────────────────
HYP_API_URL=https://api.hyp.co.il
HYP_MERCHANT_ID=
HYP_API_KEY=
HYP_SECRET_KEY=

# ─── Email (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@${DOMAIN}
EMAIL_FROM_NAME=DinLink

# ─── App ─────────────────────────────────────────────────────────────────────
APP_ENV=production
FRONTEND_URL=https://${DOMAIN}
BACKEND_URL=https://${DOMAIN}
EOF
    # Update docker-compose postgres password to match
    sed -i "s/POSTGRES_PASSWORD: strongpassword/POSTGRES_PASSWORD: ${DB_PASS}/" "$APP_DIR/docker-compose.yml" 2>/dev/null || true
    ok ".env created with auto-generated SECRET_KEY and DB password"
else
    ok ".env already exists — skipping"
fi

# =============================================================================
# STEP 4 — Python virtual environment + dependencies
# =============================================================================
echo ""
echo -e "${YELLOW}[4/7] Installing Python dependencies...${NC}"

VENV="$APP_DIR/venv"
if [[ ! -d "$VENV" ]]; then
    python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet --prefer-binary -r "$APP_DIR/backend/requirements.txt"
ok "Python venv ready"

# =============================================================================
# STEP 5 — systemd service for backend
# =============================================================================
echo ""
echo -e "${YELLOW}[5/7] Configuring systemd service...${NC}"

cat > /etc/systemd/system/dinlink.service << EOF
[Unit]
Description=DinLink Backend (FastAPI)
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/backend
ExecStart=${VENV}/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
EnvironmentFile=${APP_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable dinlink --quiet
ok "systemd service configured"

# =============================================================================
# STEP 6 — Caddy (HTTPS reverse proxy)
# =============================================================================
echo ""
echo -e "${YELLOW}[6/7] Configuring Caddy...${NC}"

cat > /etc/caddy/Caddyfile << EOF
${DOMAIN}, www.${DOMAIN} {
    # ── API routes → FastAPI backend ────────────────────────────────────────
    handle /auth/*          { reverse_proxy 127.0.0.1:8000 }
    handle /cases/*         { reverse_proxy 127.0.0.1:8000 }
    handle /payments/*      { reverse_proxy 127.0.0.1:8000 }
    handle /documents/*     { reverse_proxy 127.0.0.1:8000 }
    handle /schedule/*      { reverse_proxy 127.0.0.1:8000 }
    handle /admin/*         { reverse_proxy 127.0.0.1:8000 }
    handle /dayan/*         { reverse_proxy 127.0.0.1:8000 }
    handle /lawyer/*        { reverse_proxy 127.0.0.1:8000 }
    handle /notifications/* { reverse_proxy 127.0.0.1:8000 }
    handle /events/*        { reverse_proxy 127.0.0.1:8000 }
    handle /search/*        { reverse_proxy 127.0.0.1:8000 }
    handle /inbox/*         { reverse_proxy 127.0.0.1:8000 }
    handle /health          { reverse_proxy 127.0.0.1:8000 }

    # ── React SPA (static files) ─────────────────────────────────────────────
    handle {
        root * ${APP_DIR}/frontend/dist
        try_files {path} /index.html
        file_server
    }

    encode gzip

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(self)"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
EOF

caddy fmt --overwrite /etc/caddy/Caddyfile 2>/dev/null || true
systemctl reload caddy 2>/dev/null || systemctl start caddy
ok "Caddy configured for https://${DOMAIN}"

# =============================================================================
# STEP 7 — Firewall
# =============================================================================
echo ""
echo -e "${YELLOW}[7/7] Configuring firewall...${NC}"

ufw --force reset &>/dev/null
ufw default deny incoming &>/dev/null
ufw default allow outgoing &>/dev/null
ufw allow ssh &>/dev/null
ufw allow http &>/dev/null
ufw allow https &>/dev/null
ufw --force enable &>/dev/null
ok "Firewall: SSH + HTTP + HTTPS only"

# =============================================================================
# Done — prompt to complete .env and run first deploy
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               Setup complete!                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
warn "Before launching the site, fill in the secrets in .env:"
echo ""
echo "    nano $ENV_FILE"
echo ""
echo "  Required for full functionality:"
echo "    GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  (Google OAuth)"
echo "    HYP_MERCHANT_ID / HYP_SECRET_KEY          (Payments)"
echo "    SMTP_USER / SMTP_PASSWORD                 (Email)"
echo ""
echo "  (Google Drive and OAuth fields are optional for first launch)"
echo ""
echo -e "${CYAN}When ready, run the first deploy:${NC}"
echo ""
echo "    bash $APP_DIR/scripts/deploy.sh"
echo ""
