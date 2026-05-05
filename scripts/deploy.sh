#!/usr/bin/env bash
# =============================================================================
#  DinLink — Deploy / Redeploy Script
#  Runs after setup.sh for first deploy, and on every subsequent update.
#  Also called automatically by GitHub Actions on every push to main.
#
#  Usage:
#    bash /opt/dinlink/scripts/deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="/opt/dinlink"
VENV="$APP_DIR/venv"
COMPOSE="docker compose -f $APP_DIR/docker-compose.yml"

# ── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
info() { echo -e "${CYAN}  → $*${NC}"; }
die()  { echo -e "${RED}  ✗ $*${NC}"; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root"
[[ -d "$APP_DIR/.git" ]] || die "Run setup.sh first: $APP_DIR not found"
[[ -f "$APP_DIR/.env" ]] || die ".env not found — fill it in and retry"

DEPLOY_START=$(date +%s)

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       DinLink — Deploy              ║${NC}"
echo -e "${CYAN}║  $(date '+%Y-%m-%d %H:%M:%S')               ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# 1. Pull latest code
# =============================================================================
echo -e "${YELLOW}[1/6] Pulling latest code from GitHub...${NC}"
git -C "$APP_DIR" fetch origin main
LOCAL=$(git -C "$APP_DIR" rev-parse HEAD)
REMOTE=$(git -C "$APP_DIR" rev-parse origin/main)

if [[ "$LOCAL" == "$REMOTE" ]]; then
    info "Already up to date ($(git -C "$APP_DIR" log -1 --format='%h %s'))"
else
    git -C "$APP_DIR" pull --ff-only origin main
    ok "Updated to $(git -C "$APP_DIR" log -1 --format='%h %s')"
fi

# =============================================================================
# 2. Database — start container and run migrations
# =============================================================================
echo ""
echo -e "${YELLOW}[2/6] Starting database...${NC}"

$COMPOSE up -d db

# Wait for postgres to be ready
info "Waiting for PostgreSQL..."
MAX=30
for i in $(seq 1 $MAX); do
    if $COMPOSE exec -T db pg_isready -U beitdin_user &>/dev/null; then
        ok "Database ready"
        break
    fi
    if [[ $i -eq $MAX ]]; then
        die "Database did not become ready after ${MAX}s"
    fi
    sleep 1
done

echo ""
echo -e "${YELLOW}[3/6] Running Alembic migrations...${NC}"
cd "$APP_DIR/backend"
RESULT=$("$VENV/bin/alembic" upgrade head 2>&1)
if echo "$RESULT" | grep -q "Running upgrade\|Running migration"; then
    echo "$RESULT" | grep "Running"
    ok "Migrations applied"
else
    ok "Already up to date"
fi

# =============================================================================
# 4. Python dependencies (in case requirements.txt changed)
# =============================================================================
echo ""
echo -e "${YELLOW}[4/6] Updating Python dependencies...${NC}"
cd "$APP_DIR"
"$VENV/bin/pip" install --quiet --prefer-binary -r backend/requirements.txt
ok "Python dependencies up to date"

# =============================================================================
# 5. Build React frontend
# =============================================================================
echo ""
echo -e "${YELLOW}[5/6] Building frontend...${NC}"
cd "$APP_DIR/frontend"
npm ci --prefer-offline --silent 2>/dev/null || npm install --silent
npm run build 2>&1 | tail -3
ok "Frontend built → frontend/dist/"

# =============================================================================
# 6. Restart backend + health check
# =============================================================================
echo ""
echo -e "${YELLOW}[6/6] Restarting backend...${NC}"
systemctl restart dinlink
sleep 3

# Health check
MAX_RETRIES=10
for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf http://127.0.0.1:8000/health &>/dev/null; then
        ok "Backend is healthy"
        break
    fi
    if [[ $i -eq $MAX_RETRIES ]]; then
        echo -e "${RED}  ✗ Backend health check failed — check logs:${NC}"
        echo "    journalctl -u dinlink -n 30 --no-pager"
        exit 1
    fi
    sleep 1
done

# Reload Caddy config (in case Caddyfile was updated)
systemctl reload caddy 2>/dev/null || true

# =============================================================================
# Summary
# =============================================================================
DEPLOY_END=$(date +%s)
DURATION=$((DEPLOY_END - DEPLOY_START))
COMMIT=$(git -C "$APP_DIR" log -1 --format='%h — %s')

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               Deploy successful!                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Commit:   ${COMMIT}"
echo -e "  Duration: ${DURATION}s"
echo -e "  Logs:     journalctl -u dinlink -f"
echo ""
