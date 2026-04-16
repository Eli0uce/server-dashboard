#!/usr/bin/env bash
# =============================================================================
# update-shuttle.sh — Déploiement paramétrable de server-dashboard vers Shuttle
# =============================================================================
set -Eeuo pipefail

SCRIPT_VERSION="2.0.0"

# Defaults
TARGET=""
PORT="3000"
APP_NAME="dashboard"
REMOTE_DIR="/opt/server-dashboard"
SSH_EXTRA_OPTS=""
DRY_RUN=0
VERBOSE=0
FORCE_KILL_PORT=0
NON_INTERACTIVE=0
ENABLE_BACKUP=1
ENABLE_ROLLBACK=1
ASSUME_YES=0
NO_COLOR=0

SKIP_PRECHECK=0
SKIP_BACKUP=0
SKIP_SYNC=0
SKIP_INSTALL=0
SKIP_RESTART=0
SKIP_VALIDATE=0

# Runtime
RUN_STARTED_AT="$(date +%s)"
TMP_LOG=""
REMOTE_BACKUP_PATH=""
ROLLED_BACK=0

# Colors
BOLD="\033[1m"
BLUE="\033[1;34m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
CYAN="\033[1;36m"
RESET="\033[0m"

STEP_STATUSES=()

use_no_color() {
  if [[ "$NO_COLOR" -eq 1 ]]; then
    BOLD=""; BLUE=""; GREEN=""; YELLOW=""; RED=""; CYAN=""; RESET=""
  fi
}

log_step() { echo -e "\n${BLUE}==>${RESET} ${BOLD}$1${RESET}"; }
log_ok() { echo -e "  ${GREEN}✓${RESET} $1"; }
log_warn() { echo -e "  ${YELLOW}!${RESET} $1"; }
log_err() { echo -e "  ${RED}✗${RESET} $1" >&2; }
log_dbg() {
  if [[ "$VERBOSE" -eq 1 ]]; then
    echo -e "  ${CYAN}›${RESET} $1"
  fi
  return 0
}

usage() {
  cat <<'EOF'
Usage:
  ./update-shuttle.sh [target] [options]

Cible:
  target                    Format: user@host (compatible argument positionnel)

Options principales:
  -t, --target VALUE        Cible SSH (ex: lbiret@192.168.88.74)
  -p, --port VALUE          Port de l'application (defaut: 3000)
  -a, --app-name VALUE      Nom PM2 de l'application (defaut: dashboard)
  -d, --remote-dir VALUE    Dossier distant (defaut: /opt/server-dashboard)
      --ssh-opts VALUE      Options SSH supplementaires (chaine brute)

Comportement:
      --dry-run             Affiche les actions sans les executer
  -v, --verbose             Logs detailles
      --force-kill-port     Tue les processus sur le port cible si necessaire
      --non-interactive     N'utilise pas de prompt sudo interactif
  -y, --yes                 Confirme automatiquement les prompts
      --no-backup           Desactive la sauvegarde distante
      --no-rollback         Desactive le rollback automatique
      --no-color            Sortie sans couleur

Ignorer des etapes:
      --skip-precheck
      --skip-backup
      --skip-sync
      --skip-install
      --skip-restart
      --skip-validate

Aide:
  -h, --help

Exemples:
  ./update-shuttle.sh lbiret@192.168.88.74
  ./update-shuttle.sh -t lbiret@sh24 -p 3000 --force-kill-port
  ./update-shuttle.sh -t lbiret@192.168.88.74 --dry-run --verbose
  ./update-shuttle.sh -t lbiret@192.168.88.74 --skip-backup --skip-validate
EOF
}

add_step_status() {
  STEP_STATUSES+=("$1:$2")
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_err "Commande requise absente: $1"
    exit 1
  fi
}

run_local() {
  local desc="$1"
  local cmd="$2"
  log_dbg "$desc"
  log_dbg "$cmd"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "  [dry-run] $cmd"
    return 0
  fi
  eval "$cmd"
}

build_ssh_cmd_prefix() {
  local opts="-o ConnectTimeout=8"
  [[ -n "$SSH_EXTRA_OPTS" ]] && opts="$opts $SSH_EXTRA_OPTS"
  if [[ "$NON_INTERACTIVE" -eq 1 ]]; then
    opts="$opts -o BatchMode=yes"
  fi
  echo "ssh $opts"
}

run_remote() {
  local desc="$1"
  local cmd="$2"
  local ssh_prefix
  ssh_prefix="$(build_ssh_cmd_prefix)"
  log_dbg "$desc"
  log_dbg "$cmd"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "  [dry-run] $ssh_prefix $TARGET \"$cmd\""
    return 0
  fi
  $ssh_prefix "$TARGET" "$cmd"
}

confirm_or_abort() {
  local prompt="$1"
  if [[ "$ASSUME_YES" -eq 1 ]]; then
    return 0
  fi
  read -r -p "$prompt [y/N] " ans
  case "$ans" in
    y|Y|yes|YES) return 0 ;;
    *) log_warn "Operation annulee"; exit 1 ;;
  esac
}

cleanup() {
  if [[ -n "$TMP_LOG" && -f "$TMP_LOG" ]]; then
    rm -f "$TMP_LOG"
  fi
}

rollback_if_needed() {
  [[ "$ENABLE_ROLLBACK" -eq 0 ]] && return 0
  [[ -z "$REMOTE_BACKUP_PATH" ]] && return 0
  [[ "$ROLLED_BACK" -eq 1 ]] && return 0

  log_warn "Tentative de rollback depuis: $REMOTE_BACKUP_PATH"
  local cmd="set -euo pipefail; \
if [[ -f '$REMOTE_BACKUP_PATH' ]]; then \
  mkdir -p '$REMOTE_DIR'; \
  tar -xzf '$REMOTE_BACKUP_PATH' -C '$REMOTE_DIR'; \
  if command -v pm2 >/dev/null 2>&1; then \
    pm2 delete '$APP_NAME' 2>/dev/null || true; \
    PORT='$PORT' pm2 start '$REMOTE_DIR/server.js' --name '$APP_NAME' --cwd '$REMOTE_DIR' --update-env; \
    pm2 save --force; \
  fi; \
fi"

  if run_remote "Rollback" "$cmd"; then
    ROLLED_BACK=1
    log_warn "Rollback applique"
  else
    log_err "Rollback echoue"
  fi
}

on_error() {
  local line="$1"
  log_err "Erreur a la ligne $line"
  rollback_if_needed
}
trap 'on_error $LINENO' ERR
trap cleanup EXIT

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -t|--target) TARGET="$2"; shift 2 ;;
      -p|--port) PORT="$2"; shift 2 ;;
      -a|--app-name) APP_NAME="$2"; shift 2 ;;
      -d|--remote-dir) REMOTE_DIR="$2"; shift 2 ;;
      --ssh-opts) SSH_EXTRA_OPTS="$2"; shift 2 ;;
      --dry-run) DRY_RUN=1; shift ;;
      -v|--verbose) VERBOSE=1; shift ;;
      --force-kill-port) FORCE_KILL_PORT=1; shift ;;
      --non-interactive) NON_INTERACTIVE=1; shift ;;
      -y|--yes) ASSUME_YES=1; shift ;;
      --no-backup) ENABLE_BACKUP=0; shift ;;
      --no-rollback) ENABLE_ROLLBACK=0; shift ;;
      --no-color) NO_COLOR=1; shift ;;
      --skip-precheck) SKIP_PRECHECK=1; shift ;;
      --skip-backup) SKIP_BACKUP=1; shift ;;
      --skip-sync) SKIP_SYNC=1; shift ;;
      --skip-install) SKIP_INSTALL=1; shift ;;
      --skip-restart) SKIP_RESTART=1; shift ;;
      --skip-validate) SKIP_VALIDATE=1; shift ;;
      -h|--help) usage; exit 0 ;;
      --)
        shift
        break
        ;;
      -*)
        log_err "Option inconnue: $1"
        usage
        exit 1
        ;;
      *)
        if [[ -z "$TARGET" ]]; then
          TARGET="$1"
          shift
        else
          log_err "Argument inattendu: $1"
          usage
          exit 1
        fi
        ;;
    esac
  done
}

print_header() {
  echo -e "${BOLD}============================================================${RESET}"
  echo -e "${BOLD} update-shuttle.sh v${SCRIPT_VERSION}${RESET}"
  echo -e "${BOLD}============================================================${RESET}"
  echo "Target        : $TARGET"
  echo "Remote dir    : $REMOTE_DIR"
  echo "Port          : $PORT"
  echo "App name      : $APP_NAME"
  echo "Dry-run       : $DRY_RUN"
  echo "Verbose       : $VERBOSE"
  echo "Force kill    : $FORCE_KILL_PORT"
  echo "Backup        : $ENABLE_BACKUP"
  echo "Rollback      : $ENABLE_ROLLBACK"
}

precheck() {
  log_step "0/6 Pre-checks"

  require_cmd rsync
  require_cmd ssh
  require_cmd curl
  require_cmd awk

  log_ok "Commandes locales OK"
  log_dbg "Node local: $(node --version 2>/dev/null || echo non-trouve)"
  log_dbg "npm local : $(npm --version 2>/dev/null || echo non-trouve)"

  local ssh_prefix
  ssh_prefix="$(build_ssh_cmd_prefix)"
  local check_cmd="$ssh_prefix $TARGET 'echo SSH_OK'"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "  [dry-run] $check_cmd"
  else
    if eval "$check_cmd" | grep -q SSH_OK; then
      log_ok "SSH OK"
    else
      log_err "SSH KO"
      exit 1
    fi
  fi

  add_step_status "precheck" "ok"
}

create_backup() {
  log_step "1/6 Backup distant"

  local ts
  ts="$(date +%Y%m%d_%H%M%S)"
  REMOTE_BACKUP_PATH="/tmp/${APP_NAME}_backup_${ts}.tar.gz"

  local cmd="set -euo pipefail; \
if [[ -d '$REMOTE_DIR' ]]; then \
  tar --exclude='node_modules' --exclude='.git' -czf '$REMOTE_BACKUP_PATH' -C '$REMOTE_DIR' .; \
  echo '$REMOTE_BACKUP_PATH'; \
fi"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    run_remote "Backup distant" "$cmd"
    add_step_status "backup" "dry-run"
    return 0
  fi

  local out
  out="$(run_remote "Backup distant" "$cmd" || true)"
  if [[ -n "$out" ]]; then
    REMOTE_BACKUP_PATH="$(echo "$out" | tail -n 1 | tr -d '\r')"
    log_ok "Backup cree: $REMOTE_BACKUP_PATH"
  else
    log_warn "Aucun backup cree (dossier absent ?)"
    REMOTE_BACKUP_PATH=""
  fi

  add_step_status "backup" "ok"
}

sync_files() {
  log_step "2/6 Synchronisation"

  local src_dir
  src_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  local cmd
  cmd="rsync -az --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude '*.log' \
    '$src_dir/' '$TARGET:$REMOTE_DIR/'"

  run_local "Rsync" "$cmd"
  log_ok "Synchronisation terminee"
  add_step_status "sync" "ok"
}

install_remote() {
  log_step "3/6 Installation distante"

  local cmd="set -euo pipefail; \
mkdir -p '$REMOTE_DIR'; \
cd '$REMOTE_DIR'; \
if [[ -d node_modules ]]; then \
  OWNER=\$(stat -c '%U' node_modules 2>/dev/null || echo 'unknown'); \
  USERNAME=\$(whoami); \
  if [[ \"\$OWNER\" != \"\$USERNAME\" ]]; then \
    if [[ '$NON_INTERACTIVE' == '1' ]]; then \
      sudo -n chown -R \"\$USERNAME:\$USERNAME\" node_modules || true; \
    else \
      sudo chown -R \"\$USERNAME:\$USERNAME\" node_modules || true; \
    fi; \
  fi; \
fi; \
npm install --omit=dev; \
node --check server.js; \
if [[ -d node_modules/socket.io ]]; then \
  node -e \"console.log('socket.io', require('./node_modules/socket.io/package.json').version)\"; \
fi"

  run_remote "Install" "$cmd"
  log_ok "Installation distante OK"
  add_step_status "install" "ok"
}

restart_remote() {
  log_step "4/6 Relance PM2"

  local kill_cmd="set -euo pipefail; \
port_busy() { ss -ltn | awk 'NR>1{print \$4}' | grep -Eq '(:|\\.)$PORT$'; }; \
if port_busy; then \
  if [[ '$FORCE_KILL_PORT' == '1' ]]; then \
    PIDS=\$(ss -lptn 'sport = :$PORT' 2>/dev/null | sed -n 's/.*pid=\\([0-9][0-9]*\\).*/\\1/p' | sort -u); \
    for p in \$PIDS; do kill -TERM \$p 2>/dev/null || sudo -n kill -TERM \$p 2>/dev/null || true; done; \
    sleep 1; \
    for p in \$PIDS; do kill -0 \$p 2>/dev/null && (kill -KILL \$p 2>/dev/null || sudo -n kill -KILL \$p 2>/dev/null || true); done; \
  else \
    echo 'PORT_BUSY'; \
    ss -lptn 'sport = :$PORT' 2>/dev/null || true; \
    exit 12; \
  fi; \
fi"

  if ! run_remote "Liberation port" "$kill_cmd"; then
    log_err "Port $PORT occupe et non liberable automatiquement"
    log_warn "Relancer avec --force-kill-port ou liberer manuellement"
    exit 1
  fi

  local cmd="set -euo pipefail; \
cd '$REMOTE_DIR'; \
pm2 delete '$APP_NAME' 2>/dev/null || true; \
PORT='$PORT' pm2 start '$REMOTE_DIR/server.js' --name '$APP_NAME' --cwd '$REMOTE_DIR' --update-env; \
pm2 save --force; \
pm2 describe '$APP_NAME' | sed -n '1,80p'"

  run_remote "PM2 start" "$cmd"
  log_ok "PM2 relance terminee"
  add_step_status "restart" "ok"
}

validate_remote() {
  log_step "5/6 Validation"

  local host_part
  host_part="${TARGET#*@}"

  local remote_cmd="set -euo pipefail; \
check() { URL=\"\$1\"; CODE=\$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 \"\$URL\" || echo TIMEOUT); echo \"\$URL => \$CODE\"; [[ \"\$CODE\" == '200' ]]; }; \
check 'http://localhost:$PORT/' && check 'http://localhost:$PORT/remote' && check 'http://localhost:$PORT/socket.io/socket.io.js'"

  run_remote "Validation remote" "$remote_cmd"

  if [[ "$DRY_RUN" -eq 0 ]]; then
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 6 "http://$host_part:$PORT/remote" || echo TIMEOUT)"
    if [[ "$code" == "200" ]]; then
      log_ok "Validation depuis poste local OK (/remote=200)"
    else
      log_warn "Validation locale partielle (/remote=$code)"
      log_warn "Verifier firewall: sudo ufw allow $PORT/tcp"
    fi
  fi

  add_step_status "validate" "ok"
}

print_summary() {
  local ended_at duration
  ended_at="$(date +%s)"
  duration=$((ended_at - RUN_STARTED_AT))
  local host_part
  host_part="${TARGET#*@}"

  log_step "Resume"
  for item in "${STEP_STATUSES[@]}"; do
    local name status
    name="${item%%:*}"
    status="${item##*:}"
    echo "  - $name : $status"
  done

  echo "  Duree        : ${duration}s"
  echo "  TV URL       : http://$host_part:$PORT/"
  echo "  Remote URL   : http://$host_part:$PORT/remote"
  if [[ -n "$REMOTE_BACKUP_PATH" ]]; then
    echo "  Backup       : $REMOTE_BACKUP_PATH"
  fi
  if [[ "$ROLLED_BACK" -eq 1 ]]; then
    echo "  Rollback     : applique"
  fi
}

main() {
  parse_args "$@"
  use_no_color

  if [[ -z "$TARGET" ]]; then
    log_err "Target manquant"
    usage
    exit 1
  fi

  print_header

  if [[ "$DRY_RUN" -eq 0 ]]; then
    confirm_or_abort "Confirmer le deploiement vers $TARGET ?"
  fi

  [[ "$SKIP_PRECHECK" -eq 1 ]] || precheck
  [[ "$SKIP_BACKUP" -eq 1 || "$ENABLE_BACKUP" -eq 0 ]] || create_backup
  [[ "$SKIP_SYNC" -eq 1 ]] || sync_files
  [[ "$SKIP_INSTALL" -eq 1 ]] || install_remote
  [[ "$SKIP_RESTART" -eq 1 ]] || restart_remote
  [[ "$SKIP_VALIDATE" -eq 1 ]] || validate_remote

  print_summary
  log_ok "Deploiement termine"
}

main "$@"
