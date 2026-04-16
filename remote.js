/* ═══════════════════════════════════════════════════
   StreamDeck Remote — Logique client
   ═══════════════════════════════════════════════════ */

class StreamDeck {
    constructor() {
        this.socket = null;
        this.tvCount = 0;
        this.lastSyncAt = null;
        this.sensitiveUnlocked = false;
        this.currentAlert = null;
        this.alertHistory = this.loadAlertHistory();
        this.lastNotificationAt = { warning: 0, critical: 0, healthy: 0 };
        this.tvState = {
            section: 'all',
            theme: 'dark',
            zoom: 1,
            speed: 5000,
            audioEnabled: true,
            readableMode: false,
            simplifiedView: false,
            rotationEnabled: false,
            rotationIntervalMs: 0,
            activeUrl: window.location.origin.replace(/\/remote$/, ''),
            lastAlert: null
        };

        this.remoteConfig = (typeof CONFIG !== 'undefined' && CONFIG.remote) || {
            alertHistoryLimit: 20,
            sensitiveActions: ['fullscreen', 'toggle_sound', 'speed'],
            notificationCooldownMs: { warning: 30000, critical: 12000, healthy: 0 }
        };
        this.tvConfig = (typeof CONFIG !== 'undefined' && CONFIG.tv) || {
            defaultRotationIntervalMs: 20000
        };

        this.GROUPS = [
            {
                label: 'Vues',
                buttons: [
                    { emoji: '🖥️', label: 'Tout afficher', cat: 'views', data: { section: 'all' }, cmd: { action: 'focus', section: 'all' } },
                    { emoji: '📊', label: 'Serveurs', cat: 'views', data: { section: 'servers' }, cmd: { action: 'focus', section: 'servers' } },
                    { emoji: '🗄️', label: 'Base de données', cat: 'views', data: { section: 'database' }, cmd: { action: 'focus', section: 'database' } },
                    { emoji: '⚡', label: 'Performance', cat: 'views', data: { section: 'charts' }, cmd: { action: 'focus', section: 'charts' } },
                    { emoji: '🌐', label: 'Réseau', cat: 'views', data: { section: 'network' }, cmd: { action: 'focus', section: 'network' } },
                    { emoji: '📋', label: 'Logs', cat: 'views', data: { section: 'logs' }, cmd: { action: 'focus', section: 'logs' } },
                    { emoji: '❤️', label: 'Santé', cat: 'views', data: { section: 'health' }, cmd: { action: 'focus', section: 'health' } }
                ]
            },
            {
                label: 'Contrôles',
                buttons: [
                    { emoji: '🔄', label: 'Rafraîchir', cat: 'ctrl', cmd: { action: 'refresh' } },
                    { emoji: '📺', label: 'Plein écran', cat: 'ctrl', sensitive: true, cmd: { action: 'fullscreen' } },
                    { emoji: '💡', label: 'Flash section', cat: 'ctrl', cmd: { action: 'highlight' } },
                    { emoji: '🔍', label: 'Zoom +', cat: 'ctrl', cmd: { action: 'zoom', delta: 1 } },
                    { emoji: '🔎', label: 'Zoom -', cat: 'ctrl', cmd: { action: 'zoom', delta: -1 } },
                    { emoji: '🔔', label: 'Son ON', cat: 'ctrl', sensitive: true, data: { toggle: 'sound' }, cmd: { action: 'toggle_sound' } }
                ]
            },
            {
                label: 'Affichage TV',
                buttons: [
                    { emoji: '👀', label: 'Ultra lisible', cat: 'theme', data: { readable: '1' }, cmd: { action: 'readable_mode', enabled: true } },
                    { emoji: '🧩', label: 'Vue simple', cat: 'theme', data: { simplified: '1' }, cmd: { action: 'simplified_view', enabled: true } },
                    { emoji: '🔁', label: 'Rotation 20s', cat: 'theme', data: { rotation: '1' }, cmd: { action: 'rotation', enabled: true, intervalMs: this.tvConfig.defaultRotationIntervalMs } }
                ]
            },
            {
                label: 'Vitesse de mise à jour',
                buttons: [
                    { emoji: '⚡', label: 'Rapide 1s', cat: 'speed', sensitive: true, data: { speed: '1000' }, cmd: { action: 'speed', value: 1000 } },
                    { emoji: '🚶', label: 'Normal 5s', cat: 'speed', data: { speed: '5000' }, cmd: { action: 'speed', value: 5000 } },
                    { emoji: '🐌', label: 'Lent 15s', cat: 'speed', data: { speed: '15000' }, cmd: { action: 'speed', value: 15000 } }
                ]
            },
            {
                label: 'Thème TV',
                buttons: [
                    { emoji: '🌑', label: 'Dark', cat: 'theme', data: { theme: 'dark' }, cmd: { action: 'theme', value: 'dark' } },
                    { emoji: '💫', label: 'Néon', cat: 'theme', data: { theme: 'neon' }, cmd: { action: 'theme', value: 'neon' } },
                    { emoji: '☀️', label: 'Minimal', cat: 'theme', data: { theme: 'minimal' }, cmd: { action: 'theme', value: 'minimal' } }
                ]
            }
        ];

        this.init();
    }

    init() {
        this.setupSocket();
        this.renderButtons();
        this.bindShareModal();
        this.setUrls();
        this.initNotifications();
        this.bindQuickActions();
        this.updateStateBar();
        this.updateOverview();
        this.renderAlertHistory();
        this.updateSafetyLockUI();
        this.updateCurrentAlertPanel();
    }

    setupSocket() {
        this.socket = io({ transports: ['websocket', 'polling'] });

        this.socket.on('connect', () => {
            this.socket.emit('join', { role: 'remote' });
            this.updateStatusUI();
            this.markSync();
        });

        this.socket.on('disconnect', () => {
            this.tvCount = 0;
            this.updateStatusUI();
            this.updateOverview();
        });

        this.socket.on('tv_count', (count) => {
            this.tvCount = count;
            this.updateStatusUI();
            this.updateOverview();
        });

        this.socket.on('tv_state', (state) => {
            this.tvState = { ...this.tvState, ...state };
            this.markSync();
            this.updateStateBar();
            this.updateActiveButtons();
            this.updateOverview();
            this.setUrls();
            if (state.lastAlert) {
                this.applyAlertState(state.lastAlert, { persist: false, notify: false });
            }
        });

        this.socket.on('tv_alert', (alert) => {
            this.handleTvAlert(alert);
        });

        this.socket.on('alert_ack', (payload) => {
            this.handleAlertAck(payload);
        });
    }

    bindQuickActions() {
        document.getElementById('defaultViewBtn')?.addEventListener('click', () => {
            this.send({ action: 'focus', section: 'all' });
        });

        document.getElementById('reconnectBtn')?.addEventListener('click', () => {
            this.reconnect();
        });

        document.getElementById('safetyLockBtn')?.addEventListener('click', () => {
            this.sensitiveUnlocked = !this.sensitiveUnlocked;
            this.updateSafetyLockUI();
            this.showToast(this.sensitiveUnlocked ? 'Actions sensibles déverrouillées' : 'Actions sensibles verrouillées');
            if (navigator.vibrate) navigator.vibrate(this.sensitiveUnlocked ? [40, 20, 40] : [30]);
        });

        document.getElementById('ackAlertBtn')?.addEventListener('click', () => {
            this.acknowledgeCurrentAlert();
        });

        document.getElementById('clearAlertHistoryBtn')?.addEventListener('click', () => {
            this.alertHistory = [];
            this.persistAlertHistory();
            this.renderAlertHistory();
            this.showToast('Historique effacé');
        });
    }

    reconnect() {
        if (!this.socket) {
            this.setupSocket();
            return;
        }

        this.showToast('Reconnexion en cours...');
        try {
            if (this.socket.connected) {
                this.socket.disconnect();
            }
            this.socket.connect();
        } catch (error) {
            this.showToast('Échec de reconnexion');
        }
    }

    send(cmd) {
        if (!this.socket?.connected) {
            this.showToast('Non connecté au serveur');
            return;
        }

        if (this.tvCount === 0) {
            this.showToast('Aucune TV connectée');
            return;
        }

        if (this.isSensitiveAction(cmd) && !this.sensitiveUnlocked) {
            this.showToast('Déverrouillez les actions sensibles');
            if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
            return;
        }

        if (navigator.vibrate) navigator.vibrate(28);
        this.socket.emit('command', cmd);
    }

    isSensitiveAction(cmd = {}) {
        return this.remoteConfig.sensitiveActions.includes(cmd.action);
    }

    initNotifications() {
        if (!('Notification' in window)) {
            return;
        }

        const askPermissionOnce = () => {
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
        };

        window.addEventListener('click', askPermissionOnce, { once: true, passive: true });
        window.addEventListener('touchstart', askPermissionOnce, { once: true, passive: true });
    }

    handleTvAlert(alert = {}) {
        this.applyAlertState(alert, { persist: true, notify: true });
    }

    applyAlertState(alert = {}, options = {}) {
        const severity = alert.severity || 'warning';
        const defaults = {
            critical: 'Alerte critique sur la TV',
            warning: 'Alerte warning sur la TV',
            healthy: 'Retour à la normale'
        };

        const normalizedAlert = {
            severity,
            timestamp: alert.timestamp || Date.now(),
            message: alert.message || defaults[severity] || 'Nouvelle alerte TV',
            items: Array.isArray(alert.items) ? alert.items : [],
            acknowledgedAt: alert.acknowledgedAt || null
        };

        this.currentAlert = normalizedAlert;
        this.tvState.lastAlert = normalizedAlert;
        this.updateCurrentAlertPanel();

        if (options.persist) {
            this.alertHistory.unshift(normalizedAlert);
            this.alertHistory = this.alertHistory.slice(0, this.remoteConfig.alertHistoryLimit);
            this.persistAlertHistory();
            this.renderAlertHistory();
        }

        if (options.notify) {
            const cooldown = this.remoteConfig.notificationCooldownMs[severity] || 0;
            const now = Date.now();
            const withinCooldown = cooldown > 0 && now - (this.lastNotificationAt[severity] || 0) < cooldown;
            if (!withinCooldown) {
                this.lastNotificationAt[severity] = now;
                this.showToast(normalizedAlert.message, severity === 'critical' ? 4500 : 2800);
                this.triggerHaptics(severity);
                this.triggerBrowserNotification(normalizedAlert);
            }
        }
    }

    handleAlertAck(payload = {}) {
        const ackTimestamp = payload.acknowledgedAt || Date.now();

        if (this.currentAlert && (!payload.timestamp || this.currentAlert.timestamp === payload.timestamp)) {
            this.currentAlert.acknowledgedAt = ackTimestamp;
            this.updateCurrentAlertPanel();
        }

        this.alertHistory = this.alertHistory.map(alert => {
            if (!payload.timestamp || alert.timestamp === payload.timestamp) {
                return { ...alert, acknowledgedAt: ackTimestamp };
            }
            return alert;
        });
        this.persistAlertHistory();
        this.renderAlertHistory();
        this.showToast('Alerte acquittée');
    }

    acknowledgeCurrentAlert() {
        if (!this.currentAlert || this.currentAlert.severity === 'healthy') {
            this.showToast('Aucune alerte à acquitter');
            return;
        }

        const payload = {
            timestamp: this.currentAlert.timestamp,
            acknowledgedAt: Date.now()
        };

        this.handleAlertAck(payload);
        if (this.socket?.connected) {
            this.socket.emit('alert_ack', payload);
        }
    }

    triggerHaptics(severity) {
        if (!navigator.vibrate) {
            return;
        }
        if (severity === 'critical') {
            navigator.vibrate([180, 80, 180]);
        } else if (severity === 'warning') {
            navigator.vibrate([120]);
        } else {
            navigator.vibrate([60, 30, 60]);
        }
    }

    triggerBrowserNotification(alert) {
        if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) {
            return;
        }

        const severity = alert.severity || 'warning';
        const title = severity === 'critical'
            ? 'Dashboard : critique'
            : severity === 'warning'
                ? 'Dashboard : warning'
                : 'Dashboard : retour normal';
        try {
            new Notification(title, {
                body: alert.message,
                tag: 'dashboard-tv-alert',
                renotify: true
            });
        } catch (error) {
            // Ignore notification failures on restricted browsers.
        }
    }

    markSync() {
        this.lastSyncAt = Date.now();
    }

    updateStatusUI() {
        const el = document.getElementById('tvStatus');
        const txt = document.getElementById('statusText');
        if (!el || !txt) {
            return;
        }

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

    updateOverview() {
        const connectionEl = document.getElementById('overviewTvConnection');
        const lastSyncEl = document.getElementById('overviewLastSync');
        const activeUrlEl = document.getElementById('overviewActiveUrl');

        if (connectionEl) {
            connectionEl.textContent = this.tvCount > 0 ? `Connectée (${this.tvCount})` : 'Non connectée';
        }
        if (lastSyncEl) {
            lastSyncEl.textContent = this.lastSyncAt ? this.formatDateTime(this.lastSyncAt) : 'Jamais';
        }
        if (activeUrlEl) {
            activeUrlEl.textContent = this.tvState.activeUrl || window.location.origin.replace(/\/remote$/, '');
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
        document.getElementById('stateTheme').textContent = THEME_LABELS[s.theme] ?? '🌑 Dark';
        document.getElementById('stateZoom').textContent = `🔍 Zoom ×${s.zoom ?? 1}`;
        document.getElementById('stateSpeed').textContent = SPEED_LABELS[s.speed] ?? `⏱ ${Math.round((s.speed || 5000) / 1000)}s`;
        document.getElementById('stateReadable').textContent = s.readableMode ? '👀 Ultra lisible' : '👀 Standard';
        document.getElementById('stateRotation').textContent = s.rotationEnabled ? `🔁 ${Math.round((s.rotationIntervalMs || 0) / 1000)}s` : '🔁 Rotation OFF';
    }

    updateCurrentAlertPanel() {
        const panel = document.getElementById('currentAlertPanel');
        const severityEl = document.getElementById('currentAlertSeverity');
        const messageEl = document.getElementById('currentAlertMessage');
        const timeEl = document.getElementById('currentAlertTime');
        const ackEl = document.getElementById('currentAlertAck');
        const ackBtn = document.getElementById('ackAlertBtn');
        if (!panel || !severityEl || !messageEl || !timeEl || !ackEl || !ackBtn) {
            return;
        }

        const alert = this.currentAlert;
        const severity = alert?.severity || 'healthy';
        severityEl.textContent = severity;
        severityEl.className = `current-alert-badge ${severity}`;
        panel.classList.remove('warning', 'critical', 'healthy');
        panel.classList.add(severity);
        messageEl.textContent = alert?.message || 'Aucune alerte reçue pour le moment.';
        timeEl.textContent = alert?.timestamp ? this.formatDateTime(alert.timestamp) : '--';
        ackEl.textContent = alert?.acknowledgedAt ? `Acquittée à ${this.formatTime(alert.acknowledgedAt)}` : 'Non acquittée';
        ackBtn.disabled = !alert || severity === 'healthy' || Boolean(alert.acknowledgedAt);
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
            btn.classList.toggle('active', parseInt(btn.dataset.speed, 10) === s.speed)
        );
        document.querySelectorAll('[data-readable]').forEach(btn =>
            btn.classList.toggle('active', Boolean(s.readableMode))
        );
        document.querySelectorAll('[data-simplified]').forEach(btn =>
            btn.classList.toggle('active', Boolean(s.simplifiedView))
        );
        document.querySelectorAll('[data-rotation]').forEach(btn =>
            btn.classList.toggle('active', Boolean(s.rotationEnabled))
        );

        const soundBtn = document.querySelector('[data-toggle="sound"]');
        if (soundBtn) {
            const on = s.audioEnabled !== false;
            soundBtn.classList.toggle('active', on);
            soundBtn.querySelector('.sd-emoji').textContent = on ? '🔔' : '🔕';
            soundBtn.querySelector('.sd-label').textContent = on ? 'Son ON' : 'Son OFF';
        }
    }

    updateSafetyLockUI() {
        const btn = document.getElementById('safetyLockBtn');
        if (!btn) {
            return;
        }

        btn.classList.toggle('locked', !this.sensitiveUnlocked);
        btn.classList.toggle('unlocked', this.sensitiveUnlocked);
        btn.textContent = this.sensitiveUnlocked ? '🔓' : '🔒';
        btn.title = this.sensitiveUnlocked ? 'Verrouiller les actions sensibles' : 'Déverrouiller les actions sensibles';
    }

    showToast(msg, ms = 2200) {
        const el = document.getElementById('remoteToast');
        if (!el) {
            return;
        }
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => el.classList.remove('show'), ms);
    }

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

                if (def.data) {
                    Object.entries(def.data).forEach(([k, v]) => { btn.dataset[k] = v; });
                }
                if (def.sensitive) {
                    btn.dataset.sensitive = '1';
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

    renderAlertHistory() {
        const container = document.getElementById('alertHistoryList');
        if (!container) {
            return;
        }

        if (!this.alertHistory.length) {
            container.innerHTML = '<div class="empty-state">Aucune alerte enregistrée.</div>';
            return;
        }

        container.innerHTML = this.alertHistory.map(alert => `
            <article class="alert-history-item ${alert.severity}">
                <div class="alert-history-top">
                    <span class="current-alert-badge ${alert.severity}">${alert.severity}</span>
                    <span class="alert-history-time">${this.formatDateTime(alert.timestamp)}</span>
                </div>
                <p class="alert-history-message">${this.escapeHtml(alert.message)}</p>
                <div class="alert-history-meta">
                    ${alert.acknowledgedAt ? `<span>Acquittée ${this.formatTime(alert.acknowledgedAt)}</span>` : '<span>En attente</span>'}
                </div>
            </article>
        `).join('');
    }

    bindShareModal() {
        const shareBtn = document.getElementById('shareBtn');
        const modal = document.getElementById('shareModal');
        const closeBtn = document.getElementById('closeShareModal');
        if (!shareBtn || !modal || !closeBtn) {
            return;
        }

        shareBtn.addEventListener('click', () => modal.classList.add('open'));
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

        const copyEl = (elId, getText) => {
            document.getElementById(elId)?.addEventListener('click', () => {
                const text = typeof getText === 'function' ? getText() : getText;
                navigator.clipboard?.writeText(text)
                    .then(() => this.showToast('URL copiée'))
                    .catch(() => this.showToast('Copie manuelle nécessaire'));
                if (navigator.vibrate) navigator.vibrate(30);
            });
        };

        copyEl('tvUrl', () => this.tvState.activeUrl || window.location.origin.replace(/\/remote$/, ''));
        copyEl('remoteUrl', () => `${window.location.origin.replace(/\/$/, '')}/remote`);
    }

    setUrls() {
        const origin = window.location.origin.replace(/\/$/, '');
        document.getElementById('tvUrl').textContent = this.tvState.activeUrl || origin.replace(/\/remote$/, '');
        document.getElementById('remoteUrl').textContent = `${origin}/remote`;
    }

    loadAlertHistory() {
        try {
            const raw = localStorage.getItem('dashboard_remote_alert_history');
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    persistAlertHistory() {
        try {
            localStorage.setItem('dashboard_remote_alert_history', JSON.stringify(this.alertHistory));
        } catch (error) {
            // Ignore storage errors on private browsing.
        }
    }

    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.streamDeck = new StreamDeck();
});

