/* ═══════════════════════════════════════════════════
   StreamDeck Remote — Logique client
   ═══════════════════════════════════════════════════ */

class StreamDeck {
    constructor() {
        this.socket     = null;
        this.tvCount    = 0;
        this.tvState    = {
            section:       'all',
            theme:         'dark',
            zoom:          1,
            speed:         5000,
            audioEnabled:  true
        };

        // Définition de tous les boutons
        this.GROUPS = [
            {
                label: 'Vues',
                buttons: [
                    { emoji: '🖥️', label: 'Tout afficher',   cat: 'views', data: { section: 'all' },      cmd: { action: 'focus', section: 'all' } },
                    { emoji: '📊', label: 'Serveurs',         cat: 'views', data: { section: 'servers' },   cmd: { action: 'focus', section: 'servers' } },
                    { emoji: '🗄️', label: 'Base de données', cat: 'views', data: { section: 'database' },  cmd: { action: 'focus', section: 'database' } },
                    { emoji: '⚡', label: 'Performance',      cat: 'views', data: { section: 'charts' },    cmd: { action: 'focus', section: 'charts' } },
                    { emoji: '🌐', label: 'Réseau',           cat: 'views', data: { section: 'network' },   cmd: { action: 'focus', section: 'network' } },
                    { emoji: '📋', label: 'Logs',             cat: 'views', data: { section: 'logs' },      cmd: { action: 'focus', section: 'logs' } },
                    { emoji: '❤️', label: 'Santé',            cat: 'views', data: { section: 'health' },    cmd: { action: 'focus', section: 'health' } },
                ]
            },
            {
                label: 'Contrôles',
                buttons: [
                    { emoji: '🔄', label: 'Rafraîchir',   cat: 'ctrl', cmd: { action: 'refresh' } },
                    { emoji: '📺', label: 'Plein écran',   cat: 'ctrl', cmd: { action: 'fullscreen' } },
                    { emoji: '💡', label: 'Flash section', cat: 'ctrl', cmd: { action: 'highlight' } },
                    { emoji: '🔍', label: 'Zoom  +',       cat: 'ctrl', data: { zoom: 'up' },   cmd: { action: 'zoom', delta: 1 } },
                    { emoji: '🔎', label: 'Zoom  −',       cat: 'ctrl', data: { zoom: 'down' }, cmd: { action: 'zoom', delta: -1 } },
                    { emoji: '🔔', label: 'Son  ON',       cat: 'ctrl', data: { toggle: 'sound' }, cmd: { action: 'toggle_sound' } },
                ]
            },
            {
                label: 'Vitesse de mise à jour',
                buttons: [
                    { emoji: '⚡', label: 'Rapide  1s', cat: 'speed', data: { speed: '1000' },  cmd: { action: 'speed', value: 1000 } },
                    { emoji: '🚶', label: 'Normal  5s', cat: 'speed', data: { speed: '5000' },  cmd: { action: 'speed', value: 5000 } },
                    { emoji: '🐌', label: 'Lent  15s',  cat: 'speed', data: { speed: '15000' }, cmd: { action: 'speed', value: 15000 } },
                ]
            },
            {
                label: 'Thème TV',
                buttons: [
                    { emoji: '🌑', label: 'Dark',    cat: 'theme', data: { theme: 'dark' },    cmd: { action: 'theme', value: 'dark' } },
                    { emoji: '💫', label: 'Néon',    cat: 'theme', data: { theme: 'neon' },    cmd: { action: 'theme', value: 'neon' } },
                    { emoji: '☀️', label: 'Minimal', cat: 'theme', data: { theme: 'minimal' }, cmd: { action: 'theme', value: 'minimal' } },
                ]
            }
        ];

        this.init();
    }

    // ─── Init ────────────────────────────────────────────────────────────────

    init() {
        this.setupSocket();
        this.renderButtons();
        this.bindShareModal();
        this.setUrls();
        this.initNotifications();
        this.updateStateBar();
    }

    // ─── Socket ──────────────────────────────────────────────────────────────

    setupSocket() {
        this.socket = io({ transports: ['websocket', 'polling'] });

        this.socket.on('connect', () => {
            this.socket.emit('join', { role: 'remote' });
            this.updateStatusUI();
        });

        this.socket.on('disconnect', () => {
            this.tvCount = 0;
            this.updateStatusUI();
        });

        this.socket.on('tv_count', (count) => {
            this.tvCount = count;
            this.updateStatusUI();
        });

        this.socket.on('tv_state', (state) => {
            this.tvState = { ...this.tvState, ...state };
            this.updateStateBar();
            this.updateActiveButtons();
        });

        this.socket.on('tv_alert', (alert) => {
            this.handleTvAlert(alert);
        });
    }

    send(cmd) {
        if (!this.socket?.connected) {
            this.showToast('Non connecte au serveur');
            return;
        }

        if (this.tvCount === 0) {
            this.showToast('Aucune TV connectee');
            return;
        }

        if (navigator.vibrate) navigator.vibrate(28);
        this.socket.emit('command', cmd);
    }

    initNotifications() {
        if (!('Notification' in window)) {
            return;
        }

        const askPermissionOnce = () => {
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
            window.removeEventListener('click', askPermissionOnce);
            window.removeEventListener('touchstart', askPermissionOnce);
        };

        window.addEventListener('click', askPermissionOnce, { once: true, passive: true });
        window.addEventListener('touchstart', askPermissionOnce, { once: true, passive: true });
    }

    handleTvAlert(alert = {}) {
        const severity = alert.severity || 'warning';
        const labels = {
            critical: 'Alerte critique sur la TV',
            warning: 'Alerte warning sur la TV',
            healthy: 'Retour a la normale'
        };

        const msg = alert.message || labels[severity] || 'Nouvelle alerte TV';
        this.showToast(msg, severity === 'critical' ? 4500 : 2800);

        if (navigator.vibrate) {
            if (severity === 'critical') {
                navigator.vibrate([180, 80, 180]);
            } else if (severity === 'warning') {
                navigator.vibrate([120]);
            }
        }

        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            const title = severity === 'critical' ? 'Dashboard: critique' : severity === 'warning' ? 'Dashboard: warning' : 'Dashboard: normal';
            try {
                new Notification(title, {
                    body: msg,
                    tag: 'dashboard-tv-alert',
                    renotify: true
                });
            } catch (error) {
                // Ignore notification failures on restricted browsers.
            }
        }
    }

    // ─── UI helpers ──────────────────────────────────────────────────────────

    updateStatusUI() {
        const el  = document.getElementById('tvStatus');
        const txt = document.getElementById('statusText');

        if (!this.socket?.connected) {
            el.className = 'remote-status disconnected';
            txt.textContent = '🔴 Déconnecté';
            return;
        }
        if (this.tvCount === 0) {
            el.className = 'remote-status no-tv';
            txt.textContent = '🟡 Aucune TV';
        } else {
            el.className = 'remote-status connected';
            txt.textContent = `🟢 ${this.tvCount} TV${this.tvCount > 1 ? 's' : ''}`;
        }
    }

    updateStateBar() {
        const SECTION_LABELS = {
            all: '🖥️ Vue complète', servers: '📊 Serveurs', database: '🗄️ Base de données',
            charts: '⚡ Performance', network: '🌐 Réseau', logs: '📋 Logs', health: '❤️ Santé'
        };
        const THEME_LABELS = { dark: '🌑 Dark', neon: '💫 Néon', minimal: '☀️ Minimal' };
        const SPEED_LABELS = { 1000: '⚡ 1s', 3000: '🚶 3s', 5000: '🚶 5s', 15000: '🐌 15s' };

        const s = this.tvState;
        document.getElementById('stateSection').textContent = SECTION_LABELS[s.section] ?? '🖥️ Vue complète';
        document.getElementById('stateTheme').textContent   = THEME_LABELS[s.theme]     ?? '🌑 Dark';
        document.getElementById('stateZoom').textContent    = `🔍 Zoom ×${s.zoom ?? 1}`;
        document.getElementById('stateSpeed').textContent   = SPEED_LABELS[s.speed]    ?? '⏱ 5s';
    }

    updateActiveButtons() {
        const s = this.tvState;

        document.querySelectorAll('[data-section]').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.section === s.section)
        );
        document.querySelectorAll('[data-theme]').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.theme === s.theme)
        );
        document.querySelectorAll('[data-speed]').forEach(btn =>
            btn.classList.toggle('active', parseInt(btn.dataset.speed) === s.speed)
        );

        const soundBtn = document.querySelector('[data-toggle="sound"]');
        if (soundBtn) {
            const on = s.audioEnabled !== false;
            soundBtn.classList.toggle('active', on);
            soundBtn.querySelector('.sd-emoji').textContent = on ? '🔔' : '🔕';
            soundBtn.querySelector('.sd-label').textContent  = on ? 'Son  ON' : 'Son  OFF';
        }
    }

    showToast(msg, ms = 2200) {
        const el = document.getElementById('remoteToast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => el.classList.remove('show'), ms);
    }

    // ─── Button rendering ─────────────────────────────────────────────────────

    renderButtons() {
        const main = document.getElementById('remoteMain');
        main.innerHTML = '';

        const catClass = { views: 'sd-views', ctrl: 'sd-ctrl', speed: 'sd-speed', theme: 'sd-theme' };

        this.GROUPS.forEach(group => {
            const groupEl = document.createElement('div');
            groupEl.className = 'btn-group';

            const labelEl = document.createElement('div');
            labelEl.className = 'btn-group-label';
            labelEl.textContent = group.label;
            groupEl.appendChild(labelEl);

            const gridEl = document.createElement('div');
            gridEl.className = 'btn-grid';

            group.buttons.forEach(def => {
                const btn = document.createElement('button');
                btn.className = `sd-btn ${catClass[def.cat] || ''}`;
                btn.setAttribute('type', 'button');

                // dataset attributes for active-state tracking
                if (def.data) {
                    Object.entries(def.data).forEach(([k, v]) => { btn.dataset[k] = v; });
                }

                btn.innerHTML = `
                    <span class="sd-emoji">${def.emoji}</span>
                    <span class="sd-label">${def.label}</span>
                `;

                btn.addEventListener('click', () => this.send(def.cmd));
                gridEl.appendChild(btn);
            });

            groupEl.appendChild(gridEl);
            main.appendChild(groupEl);
        });

        this.updateActiveButtons();
    }

    // ─── Share Modal ──────────────────────────────────────────────────────────

    bindShareModal() {
        const shareBtn = document.getElementById('shareBtn');
        const modal    = document.getElementById('shareModal');
        const closeBtn = document.getElementById('closeShareModal');

        shareBtn.addEventListener('click', () => modal.classList.add('open'));
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

        const copyEl = (elId, text) => {
            document.getElementById(elId).addEventListener('click', () => {
                navigator.clipboard?.writeText(text)
                    .then(() => this.showToast('✅ URL copiée !'))
                    .catch(() => this.showToast('⚠️ Copie manuelle nécessaire'));
                if (navigator.vibrate) navigator.vibrate(30);
            });
        };

        const origin = window.location.origin;
        copyEl('tvUrl', origin);
        copyEl('remoteUrl', origin + '/remote');
    }

    setUrls() {
        const origin = window.location.origin;
        document.getElementById('tvUrl').textContent     = origin;
        document.getElementById('remoteUrl').textContent = origin + '/remote';
    }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.streamDeck = new StreamDeck();
});

