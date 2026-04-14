#!/usr/bin/env bash
# =============================================================================
# deploy-ubuntu.sh — Setup complet du Server Dashboard sur Ubuntu 24.04
#
# Usage (depuis le Mac) :
#   rsync -avz --exclude node_modules \
#     /Users/elias/bblogs/server-dashboard/ \
#     elias@<IP_DU_SHUTTLE>:/opt/server-dashboard/
#
#   ssh elias@<IP_DU_SHUTTLE> 'bash /opt/server-dashboard/deploy-ubuntu.sh'
# =============================================================================
set -euo pipefail

INSTALL_DIR="/opt/server-dashboard"
SERVICE_NAME="dashboard"
KIOSK_SCRIPT="${INSTALL_DIR}/kiosk.sh"
AUTOSTART_DIR="${HOME}/.config/autostart"
DASHBOARD_PORT="${PORT:-3000}"

print_step() { echo -e "\n\033[1;34m==>\033[0m \033[1m$1\033[0m"; }
print_ok()   { echo -e "  \033[1;32m✓\033[0m  $1"; }
print_warn() { echo -e "  \033[1;33m!\033[0m  $1"; }

# ---------------------------------------------------------------------------
print_step "1/7 — Mise à jour des paquets et installation des dépendances"
# ---------------------------------------------------------------------------
sudo apt-get update -qq
sudo apt-get install -y -qq curl rsync unclutter

# Node.js 20 LTS via NodeSource (si pas déjà présent)
if ! command -v node &>/dev/null || [[ "$(node --version | cut -d. -f1 | tr -d v)" -lt 18 ]]; then
  print_step "Installation de Node.js 20 LTS"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -qq
  sudo apt-get install -y -qq nodejs
fi
print_ok "Node $(node --version) — npm $(npm --version)"

# ---------------------------------------------------------------------------
print_step "2/7 — Installation de PM2"
# ---------------------------------------------------------------------------
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2 --silent
fi
print_ok "PM2 $(pm2 --version)"

# ---------------------------------------------------------------------------
print_step "3/7 — Installation de Chromium"
# ---------------------------------------------------------------------------
if ! command -v chromium-browser &>/dev/null && ! command -v chromium &>/dev/null; then
  sudo apt-get install -y -qq chromium-browser 2>/dev/null || \
  sudo apt-get install -y -qq chromium
fi
CHROMIUM_BIN=$(command -v chromium-browser 2>/dev/null || command -v chromium 2>/dev/null)
print_ok "Chromium : $CHROMIUM_BIN"

# ---------------------------------------------------------------------------
print_step "4/7 — Installation des dépendances npm"
# ---------------------------------------------------------------------------
cd "${INSTALL_DIR}"
npm install --production --silent
print_ok "Dépendances npm OK"

# ---------------------------------------------------------------------------
print_step "5/7 — Démarrage du serveur avec PM2"
# ---------------------------------------------------------------------------
# Arrêter une instance éventuellement existante
pm2 delete "${SERVICE_NAME}" 2>/dev/null || true

pm2 start "${INSTALL_DIR}/server.js" \
  --name "${SERVICE_NAME}" \
  --env production \
  -- PORT="${DASHBOARD_PORT}"

pm2 save --force

# Activer le démarrage au boot et afficher la commande à copier-coller
print_warn "Copier-coller la commande sudo ci-dessous pour activer le démarrage au boot :"
pm2 startup systemd -u "${USER}" --hp "${HOME}"

# ---------------------------------------------------------------------------
print_step "6/7 — Script kiosque Chromium"
# ---------------------------------------------------------------------------
cat > "${KIOSK_SCRIPT}" << KIOSK
#!/usr/bin/env bash
# Kiosk launcher — attend que le dashboard soit prêt puis lance Chromium
set -euo pipefail

until curl -s "http://localhost:${DASHBOARD_PORT}" > /dev/null 2>&1; do
  sleep 1
done

# Désactiver l'écran de veille en X11
xset s off
xset -dpms
xset s noblank

# Masquer le curseur
unclutter -idle 3 &

# Chromium en plein écran
exec "${CHROMIUM_BIN}" \\
  --kiosk \\
  --no-first-run \\
  --disable-translate \\
  --disable-infobars \\
  --noerrdialogs \\
  --check-for-update-interval=604800 \\
  --disable-features=TranslateUI,PasswordManagerEnabled \\
  --overscroll-history-navigation=0 \\
  "http://localhost:${DASHBOARD_PORT}"
KIOSK

chmod +x "${KIOSK_SCRIPT}"
print_ok "Script kiosque : ${KIOSK_SCRIPT}"

# ---------------------------------------------------------------------------
print_step "7/7 — Autostart GNOME au démarrage de session"
# ---------------------------------------------------------------------------
mkdir -p "${AUTOSTART_DIR}"

cat > "${AUTOSTART_DIR}/dashboard-kiosk.desktop" << DESKTOP
[Desktop Entry]
Type=Application
Name=Dashboard Kiosk
Comment=Lance le dashboard en plein ecran sur la TV
Exec=${KIOSK_SCRIPT}
X-GNOME-Autostart-enabled=true
DESKTOP

# Désactiver la mise en veille GNOME
if command -v gsettings &>/dev/null; then
  gsettings set org.gnome.desktop.screensaver lock-enabled false      2>/dev/null || true
  gsettings set org.gnome.desktop.session idle-delay 0                 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.power \
    sleep-inactive-ac-type 'nothing'                                   2>/dev/null || true
fi

print_ok "Autostart créé : ${AUTOSTART_DIR}/dashboard-kiosk.desktop"

# ---------------------------------------------------------------------------
echo ""
echo -e "\033[1;32m════════════════════════════════════════════════════════════\033[0m"
echo -e "\033[1;32m  ✅  Déploiement terminé !\033[0m"
echo -e "\033[1;32m════════════════════════════════════════════════════════════\033[0m"
echo ""
echo "  Dashboard local  :  http://localhost:${DASHBOARD_PORT}"
IP=$(hostname -I | awk '{print $1}')
echo "  Depuis le réseau :  http://${IP}:${DASHBOARD_PORT}"
echo ""
echo "  pm2 status                   # état du serveur"
echo "  pm2 logs ${SERVICE_NAME}     # logs temps réel"
echo "  pm2 restart ${SERVICE_NAME}  # redémarrer"
echo ""
echo -e "\033[1;33m  ⚠  Pour le démarrage auto au boot, copier-coller\033[0m"
echo -e "\033[1;33m     la commande 'sudo env...' affichée par PM2 ci-dessus.\033[0m"
echo ""

