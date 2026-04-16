#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
APP_NAME="dashboard"
BASE_URL="http://localhost:${PORT}"

GREEN="\033[1;32m"
YELLOW="\033[1;33m"
BLUE="\033[1;34m"
RED="\033[1;31m"
RESET="\033[0m"

step() { echo -e "\n${BLUE}==>${RESET} $1"; }
ok() { echo -e "  ${GREEN}✓${RESET} $1"; }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; }
err() { echo -e "  ${RED}✗${RESET} $1"; }

check_url() {
  local label="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "TIMEOUT")
  if [[ "$code" == "200" ]]; then
    ok "$label → $code"
  else
    err "$label → $code"
  fi
}

step "Environnement"
echo "  Hostname        : $(hostname)"
echo "  Date            : $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Port            : ${PORT}"
echo "  Node            : $(node --version 2>/dev/null || echo 'non trouvé')"
echo "  npm             : $(npm --version 2>/dev/null || echo 'non trouvé')"
echo "  PM2             : $(pm2 --version 2>/dev/null || echo 'non trouvé')"

step "PM2"
if command -v pm2 >/dev/null 2>&1; then
  pm2 status || true
  if pm2 status 2>/dev/null | grep -q "$APP_NAME"; then
    ok "Processus PM2 '$APP_NAME' détecté"
  else
    warn "Processus PM2 '$APP_NAME' non détecté"
  fi
else
  err "PM2 non installé"
fi

step "Port ${PORT}"
if ss -ltn 2>/dev/null | awk 'NR>1{print $4}' | grep -Eq "(:|\.)${PORT}$"; then
  ok "Port ${PORT} en écoute"
  ss -lptn "sport = :${PORT}" 2>/dev/null || true
else
  err "Port ${PORT} non ouvert"
fi

step "Routes HTTP"
check_url "/" "${BASE_URL}/"
check_url "/remote" "${BASE_URL}/remote"
check_url "/socket.io/socket.io.js" "${BASE_URL}/socket.io/socket.io.js"
check_url "/api/servers" "${BASE_URL}/api/servers"

step "Signature v2"
if curl -s --max-time 5 "${BASE_URL}/" | grep -q 'openRemoteBtn'; then
  ok "Signature v2 détectée (openRemoteBtn)"
else
  warn "Signature v2 non détectée"
fi

step "IP réseau"
LAN_IPS=$(hostname -I 2>/dev/null | xargs || true)
if [[ -n "$LAN_IPS" ]]; then
  ok "IP LAN : $LAN_IPS"
else
  warn "Impossible de déterminer l'IP LAN"
fi

step "Tailscale"
if command -v tailscale >/dev/null 2>&1; then
  TS_IP=$(tailscale ip -4 2>/dev/null || true)
  if [[ -n "$TS_IP" ]]; then
    ok "IP Tailscale : $TS_IP"
  else
    warn "Tailscale installé mais IP non disponible"
  fi
  tailscale status 2>/dev/null | head -20 || true
else
  warn "Tailscale non installé"
fi

step "Kiosque"
if [[ -x "/opt/server-dashboard/kiosk.sh" ]]; then
  ok "Script kiosque présent : /opt/server-dashboard/kiosk.sh"
else
  warn "Script kiosque absent : /opt/server-dashboard/kiosk.sh"
fi

if [[ -f "$HOME/.config/autostart/dashboard-kiosk.desktop" ]]; then
  ok "Autostart GNOME kiosque présent"
else
  warn "Autostart GNOME kiosque absent"
fi

step "Logs récents"
if command -v pm2 >/dev/null 2>&1; then
  pm2 logs "$APP_NAME" --lines 20 --nostream 2>/dev/null || warn "Impossible de lire les logs PM2"
fi

step "Résumé URLs"
echo "  TV locale        : ${BASE_URL}/"
echo "  Remote locale    : ${BASE_URL}/remote"
if [[ -n "${LAN_IPS:-}" ]]; then
  echo "  TV LAN           : http://$(echo "$LAN_IPS" | awk '{print $1}'):${PORT}/"
  echo "  Remote LAN       : http://$(echo "$LAN_IPS" | awk '{print $1}'):${PORT}/remote"
fi
if [[ -n "${TS_IP:-}" ]]; then
  echo "  Remote Tailscale : http://${TS_IP}:${PORT}/remote"
fi

