#!/usr/bin/env bash
# =============================================================================
# update-shuttle.sh — Déploie la v2 (avec télécommande mobile) sur le Shuttle
#
# Usage depuis le Mac :
#   chmod +x update-shuttle.sh
#   ./update-shuttle.sh lbiret@192.168.88.74
#
# Remplacer 192.168.1.XX par l'IP de votre Shuttle
# =============================================================================
set -euo pipefail

TARGET="${1:-}"
REMOTE_DIR="/opt/server-dashboard"

# ── Couleurs ─────────────────────────────────────────────────────────────────
BOLD="\033[1m"; GREEN="\033[1;32m"; YELLOW="\033[1;33m"; BLUE="\033[1;34m"
RED="\033[1;31m"; CYAN="\033[1;36m"; RESET="\033[0m"
step()  { echo -e "\n${BLUE}==>${RESET} ${BOLD}$1${RESET}"; }
ok()    { echo -e "  ${GREEN}✓${RESET}  $1"; }
warn()  { echo -e "  ${YELLOW}!${RESET}  $1"; }
dbg()   { echo -e "  ${CYAN}›${RESET}  $1"; }
err()   { echo -e "  ${RED}✗${RESET}  $1"; }

if [[ -z "${TARGET}" ]]; then
  echo -e "${BOLD}Usage :${RESET}  ./update-shuttle.sh lbiret@192.168.88.74"
  echo -e "Exemple: ./update-shuttle.sh lbiret@192.168.88.74"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHUTTLE_IP="${TARGET#*@}"
SHUTTLE_USER="${TARGET%%@*}"

echo ""
echo -e "${BOLD}════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  🚀  Déploiement v2 → Shuttle${RESET}"
echo -e "${BOLD}════════════════════════════════════════════════════${RESET}"
dbg "Cible    : ${TARGET}"
dbg "IP       : ${SHUTTLE_IP}"
dbg "User     : ${SHUTTLE_USER}"
dbg "Source   : ${SCRIPT_DIR}"
dbg "Dest.    : ${REMOTE_DIR}"
dbg "Date Mac : $(date '+%Y-%m-%d %H:%M:%S')"

# ── 0. Pré-checks côté Mac ────────────────────────────────────────────────────
step "0/4 — Pré-checks côté Mac"

dbg "Node local   : $(node --version 2>/dev/null || echo 'non trouvé')"
dbg "npm local    : $(npm --version 2>/dev/null || echo 'non trouvé')"
dbg "rsync        : $(rsync --version 2>/dev/null | head -1 || echo 'non trouvé')"

dbg "Test SSH vers ${TARGET}…"
if ssh -o ConnectTimeout=5 -o BatchMode=yes "${TARGET}" 'echo OK' 2>/dev/null | grep -q OK; then
  ok "SSH OK"
else
  err "Impossible de joindre ${TARGET} en SSH"
  warn "Vérifiez que vous avez ajouté votre clé SSH : ssh-copy-id ${TARGET}"
  warn "Ou lancez d'abord : ssh ${TARGET}"
  exit 1
fi

dbg "Test ping vers ${SHUTTLE_IP}…"
if ping -c 1 -W 2 "${SHUTTLE_IP}" &>/dev/null; then
  ok "Ping OK"
else
  warn "Ping échoué (peut être bloqué par firewall, on continue)"
fi

# ── 1. Synchronisation des fichiers ──────────────────────────────────────────
step "1/4 — Copie des fichiers vers ${TARGET}:${REMOTE_DIR}"

dbg "Fichiers source à synchroniser :"
find "${SCRIPT_DIR}" -maxdepth 1 -type f | sort | while read -r f; do
  dbg "  $(basename "$f")  ($(wc -c < "$f") octets)"
done

dbg "Lancement rsync…"
rsync -avz --progress \
  --exclude node_modules \
  --exclude .git \
  --exclude "*.log" \
  "${SCRIPT_DIR}/" \
  "${TARGET}:${REMOTE_DIR}/"

ok "Fichiers synchronisés"

# ── 1b. Correction permissions node_modules (TTY interactif pour sudo) ───────
step "1b/4 — Correction des permissions node_modules si nécessaire"

ssh -t "${TARGET}" 'bash -s' <<'REMOTE_FIX_PERMS'
set -euo pipefail
NM_OWNER=$(stat -c "%U" /opt/server-dashboard/node_modules 2>/dev/null || echo "absent")
CURRENT_USER=$(whoami)
echo "  node_modules owner : ${NM_OWNER}  /  user courant : ${CURRENT_USER}"
if [ "${NM_OWNER}" != "${CURRENT_USER}" ] && [ "${NM_OWNER}" != "absent" ]; then
  echo "  ⚠ Correction avec sudo (saisir le mot de passe si demandé)…"
  sudo chown -R "${CURRENT_USER}:${CURRENT_USER}" /opt/server-dashboard/node_modules
  echo "  ✓ Permissions corrigées"
else
  echo "  ✓ Permissions OK"
fi
REMOTE_FIX_PERMS

# ── 2. Installation des dépendances + redémarrage PM2 ────────────────────────
step "2/4 — Installation des dépendances et redémarrage sur le Shuttle"

ssh "${TARGET}" bash <<'REMOTE'
set -euo pipefail

echo ""
echo "── Environnement Shuttle ──────────────────────────────"
echo "  Hostname  : $(hostname)"
echo "  Date      : $(date '+%Y-%m-%d %H:%M:%S')"
echo "  OS        : $(lsb_release -ds 2>/dev/null || uname -sr)"
echo "  Node      : $(node --version 2>/dev/null || echo 'NON INSTALLÉ')"
echo "  npm       : $(npm --version 2>/dev/null || echo 'NON INSTALLÉ')"
echo "  PM2       : $(pm2 --version 2>/dev/null || echo 'NON INSTALLÉ')"
echo "  Disk /opt : $(df -h /opt | awk 'NR==2{print $4" libre sur "$2}')"
echo "───────────────────────────────────────────────────────"
echo ""

cd /opt/server-dashboard

echo "→ Contenu actuel de /opt/server-dashboard :"
ls -lah --color=never
echo ""


echo "→ npm install (dépendances incluant socket.io)…"
npm install --production 2>&1

echo ""
echo "→ Vérification socket.io installé :"
if [ -d node_modules/socket.io ]; then
  SIOV=$(node -e "console.log(require('./node_modules/socket.io/package.json').version)" 2>/dev/null)
  echo "  ✓ socket.io v${SIOV}"
else
  echo "  ✗ socket.io ABSENT — problème d'installation !"
  exit 1
fi

echo ""
echo "→ Test syntaxe server.js :"
node --check server.js && echo "  ✓ server.js OK" || { echo "  ✗ ERREUR syntaxe server.js"; exit 1; }

echo ""
echo "→ PM2 — état avant redémarrage :"
pm2 list 2>/dev/null || echo "  (aucune instance)"

echo ""
echo "→ Libération du port 3000 (services/processus concurrents)…"

port_3000_is_busy() {
  ss -ltn | awk 'NR>1{print $4}' | grep -Eq '(:|\.)3000$'
}

get_port_3000_pids() {
  {
    ss -lptn 'sport = :3000' 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p'
    lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true
    fuser -n tcp 3000 2>/dev/null | tr ' ' '\n'
  } | sed '/^$/d' | sort -u
}

# 1) Tenter arrêt PM2 propre d'abord
pm2 stop dashboard 2>/dev/null || true

# 2) Tenter arrêt de services systemd connus (v1/v2)
for svc in dashboard server-dashboard; do
  if systemctl list-unit-files --type=service 2>/dev/null | awk '{print $1}' | grep -qx "${svc}.service"; then
    echo "  › systemd: arrêt ${svc}.service"
    sudo -n systemctl stop "${svc}" 2>/dev/null || true
  fi
done

# 3) Si toujours occupé, tuer les PIDs listeners
if port_3000_is_busy; then
  echo "  ⚠ Port 3000 occupé, diagnostic…"
  PIDS_3000="$(get_port_3000_pids || true)"
  if [ -n "${PIDS_3000}" ]; then
    echo "  › PIDs trouvés: ${PIDS_3000}"
    for p in ${PIDS_3000}; do
      ps -o pid,user,comm,args -p "${p}" 2>/dev/null | tail -n +2 || true
      kill -TERM "${p}" 2>/dev/null || sudo -n kill -TERM "${p}" 2>/dev/null || true
    done
    sleep 1
    for p in ${PIDS_3000}; do
      kill -0 "${p}" 2>/dev/null && (kill -KILL "${p}" 2>/dev/null || sudo -n kill -KILL "${p}" 2>/dev/null || true)
    done
  else
    echo "  ✗ Port 3000 occupé mais PID non résolu sans privilèges"
    echo "  → Exécuter manuellement: sudo ss -lptn 'sport = :3000'"
    echo "  → Puis: sudo systemctl stop <service>  ou sudo kill -9 <pid>"
    exit 1
  fi
fi

if port_3000_is_busy; then
  echo "  ✗ Port 3000 encore occupé après tentative de libération"
  ss -lptn 'sport = :3000' 2>/dev/null || true
  exit 1
else
  echo "  ✓ Port 3000 libre"
fi

echo ""
echo "→ PM2 relaunch (forcé sur /opt/server-dashboard/server.js)…"

# Important: on supprime l'ancien process pour éviter qu'il pointe vers un ancien script (v1)
pm2 delete dashboard 2>/dev/null || true

PORT=3000 pm2 start /opt/server-dashboard/server.js \
  --name dashboard \
  --cwd /opt/server-dashboard \
  --update-env

pm2 save --force
echo "  ✓ Service 'dashboard' recréé"

echo ""
echo "→ PM2 — état après relance :"
pm2 list

echo ""
echo "→ PM2 — description (script/cwd) :"
pm2 describe dashboard | sed -n '1,80p'

echo ""
echo "→ Attente démarrage (3s)…"
sleep 3

echo "→ Test HTTP local sur le Shuttle :"
HTTP_ROOT=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 || echo "ERREUR")
HTTP_REMOTE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/remote || echo "ERREUR")
HTTP_SOCKET=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/socket.io/socket.io.js || echo "ERREUR")
HAS_V2_SIGNATURE=$(curl -s --max-time 5 http://localhost:3000 | grep -c 'openRemoteBtn' || true)

echo "  /                        → ${HTTP_ROOT}"
echo "  /remote                  → ${HTTP_REMOTE}"
echo "  /socket.io/socket.io.js  → ${HTTP_SOCKET}"
echo "  signature v2 (openRemoteBtn) → ${HAS_V2_SIGNATURE}"

if [[ "$HTTP_ROOT" == "200" && "$HTTP_REMOTE" == "200" && "$HTTP_SOCKET" == "200" && "$HAS_V2_SIGNATURE" -gt 0 ]]; then
  echo "  ✓ Endpoints OK + signature v2 détectée"
else
  echo "  ✗ Validation post-démarrage échouée"
  echo ""
  echo "→ Diagnostic listener port 3000 :"
  ss -lptn 'sport = :3000' 2>/dev/null || true
  echo ""
  echo "→ Dernières lignes de logs PM2 :"
  pm2 logs dashboard --lines 40 --nostream 2>/dev/null || true
  exit 1
fi

echo ""
echo "→ Dernières lignes de logs PM2 (post-démarrage) :"
pm2 logs dashboard --lines 15 --nostream 2>/dev/null || true
REMOTE

ok "Shuttle mis à jour"

# ── 3. Vérification depuis le Mac ─────────────────────────────────────────────
step "3/4 — Vérification réseau depuis le Mac"

sleep 2

check_url() {
  local url="$1"
  local label="$2"
  local code
  code=$(curl -s --max-time 6 -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null || echo "TIMEOUT")
  if [[ "${code}" == "200" ]]; then
    ok "${label} → ${code}"
  else
    err "${label} → ${code}"
    return 1
  fi
}

ALL_OK=true
check_url "http://${SHUTTLE_IP}:3000"                          "Dashboard TV          " || ALL_OK=false
check_url "http://${SHUTTLE_IP}:3000/remote"                   "Télécommande mobile   " || ALL_OK=false
check_url "http://${SHUTTLE_IP}:3000/socket.io/socket.io.js"   "socket.io client JS   " || ALL_OK=false
check_url "http://${SHUTTLE_IP}:3000/api/servers"              "API /api/servers      " || ALL_OK=false

if [[ "${ALL_OK}" == "false" ]]; then
  warn "Un ou plusieurs endpoints inaccessibles depuis le Mac."
  warn "Vérifiez le firewall : ssh ${TARGET} 'sudo ufw allow 3000'"
fi

# ── 4. Résumé ─────────────────────────────────────────────────────────────────
step "4/4 — Résumé"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  ✅  Déploiement v2 terminé !${RESET}"
echo -e "${GREEN}════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  📺  Dashboard TV     :  ${BOLD}http://${SHUTTLE_IP}:3000${RESET}"
echo -e "  📱  Télécommande     :  ${BOLD}http://${SHUTTLE_IP}:3000/remote${RESET}"
echo ""
echo -e "  Commandes utiles :"
echo -e "  ${CYAN}ssh ${TARGET} 'pm2 status'${RESET}"
echo -e "  ${CYAN}ssh ${TARGET} 'pm2 logs dashboard --lines 50'${RESET}"
echo -e "  ${CYAN}ssh ${TARGET} 'pm2 restart dashboard'${RESET}"
echo ""

