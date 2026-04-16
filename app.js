// Main Application - Dashboard Logic
class Dashboard {
    constructor() {
        this.charts = {};
        this.updateInterval = 5000; // Update every 5 seconds
        this.intervalId = null;
        this.audioContext = null;
        this.audioEnabled = true;
        this.lastAlertAt = { warning: 0, critical: 0 };
        this.lastHealthSeverity = 'healthy';
        this.init();
    }

    init() {
        // Remote control state
        this.currentSection  = 'all';
        this.currentTheme    = 'dark';
        this.currentZoom     = 1;
        this.remoteCount     = 0;
        this.lastBroadcastSeverity = 'healthy';
        this.readableMode = false;
        this.simplifiedView = false;
        this.rotationEnabled = false;
        this.rotationIntervalMs = (typeof CONFIG !== 'undefined' && CONFIG.tv?.defaultRotationIntervalMs) || 20000;
        this.rotationIndex = 0;
        this.rotationTimerId = null;
        this.lastAlert = null;
        this.lastAlertAck = null;
        this.activeUrl = window.location.origin;

        this.initAudioControls();
        this.bindAudioUnlock();
        this.initializeCharts();
        this.render();
        this.updateClock();
        this._updateAlertBanner();

        // Update data and UI every N seconds
        this.intervalId = setInterval(() => {
            dataGenerator.updateData();
            this.updateCharts();
            this.render();
            this.updateClock();
        }, this.updateInterval);

        // Update clock every second
        setInterval(() => this.updateClock(), 1000);

        // StreamDeck remote control via Socket.io
        this.initRemoteControl();
    }

    initAudioControls() {
        const audioToggle = document.getElementById('audioToggle');
        if (!audioToggle) {
            return;
        }

        try {
            this.audioEnabled = localStorage.getItem('dashboard_audio_muted') !== '1';
        } catch (error) {
            this.audioEnabled = true;
        }

        this.updateAudioToggleUI();

        audioToggle.addEventListener('click', () => {
            this.audioEnabled = !this.audioEnabled;

            try {
                localStorage.setItem('dashboard_audio_muted', this.audioEnabled ? '0' : '1');
            } catch (error) {
                // Storage may be unavailable in private modes; keep runtime toggle only.
            }

            if (this.audioEnabled) {
                this.ensureAudioContext();
                this.resumeAudioContext();
            }

            this.updateAudioToggleUI();
        });
    }

    updateAudioToggleUI() {
        const audioToggle = document.getElementById('audioToggle');
        if (!audioToggle) {
            return;
        }

        audioToggle.textContent = this.audioEnabled ? 'Son: ON' : 'Son: OFF';
        audioToggle.classList.toggle('muted', !this.audioEnabled);
        audioToggle.setAttribute('aria-pressed', String(!this.audioEnabled));
    }

    bindAudioUnlock() {
        const unlockHandler = () => {
            this.ensureAudioContext();
            this.resumeAudioContext();
        };

        window.addEventListener('click', unlockHandler, { once: true, passive: true });
        window.addEventListener('keydown', unlockHandler, { once: true });
        window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
    }

    ensureAudioContext() {
        if (this.audioContext) {
            return this.audioContext;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return null;
        }

        this.audioContext = new AudioContextClass();
        return this.audioContext;
    }

    resumeAudioContext() {
        if (!this.audioContext || this.audioContext.state !== 'suspended') {
            return;
        }

        this.audioContext.resume().catch(() => {
            // Ignore resume errors; next user interaction can try again.
        });
    }

    getSeverityRank(severity) {
        const ranks = { healthy: 0, warning: 1, critical: 2 };
        return ranks[severity] || 0;
    }

    getHealthSeverity(healthItems) {
        const statuses = healthItems.map(item => item.status);

        if (statuses.includes('critical')) {
            return 'critical';
        }

        if (statuses.includes('warning')) {
            return 'warning';
        }

        return 'healthy';
    }

    handleHealthAlertSound(healthItems) {
        const severity = this.getHealthSeverity(healthItems);
        const now = Date.now();
        const configuredCooldowns = (typeof CONFIG !== 'undefined' && CONFIG.health?.remoteBroadcastCooldown) || {};
        const cooldownMs = configuredCooldowns[severity] ?? (severity === 'critical' ? 12000 : severity === 'warning' ? 30000 : 0);
        const escalated = this.getSeverityRank(severity) > this.getSeverityRank(this.lastHealthSeverity);
        const lastPlayed = this.lastAlertAt[severity] || 0;
        const cooldownPassed = severity !== 'healthy' && now - lastPlayed >= cooldownMs;

        if (severity !== 'healthy' && (escalated || cooldownPassed)) {
            this.playAlertTone(severity);
            this.lastAlertAt[severity] = now;
            this._emitRemoteAlert(severity, healthItems);
        }

        // Envoyer une notification de retour a la normale une seule fois.
        if (severity === 'healthy' && this.lastBroadcastSeverity !== 'healthy') {
            this._emitRemoteAlert('healthy', healthItems);
        }

        this.lastHealthSeverity = severity;
    }

    playAlertTone(severity) {
        if (!this.audioEnabled) {
            return;
        }

        const ctx = this.ensureAudioContext();
        if (!ctx) {
            return;
        }

        if (ctx.state === 'suspended') {
            return;
        }

        const start = ctx.currentTime;

        if (severity === 'critical') {
            this.scheduleTone(start, 740, 0.15, 0.07);
            this.scheduleTone(start + 0.19, 620, 0.17, 0.08);
            return;
        }

        this.scheduleTone(start, 520, 0.14, 0.06);
    }

    scheduleTone(start, frequency, duration, peakGain) {
        if (!this.audioContext) {
            return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);

        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(peakGain, start + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }

    initializeCharts() {
        const chartTheme = {
            text: '#c6d3e8',
            axis: '#8fa3c2',
            grid: 'rgba(143, 163, 194, 0.16)'
        };

        // CPU Chart
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        this.charts.cpu = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: dataGenerator.timestamps,
                datasets: [{
                    label: 'CPU Usage (%)',
                    data: dataGenerator.cpuHistory,
                    borderColor: '#7dd3fc',
                    backgroundColor: 'rgba(125, 211, 252, 0.14)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointBackgroundColor: '#7dd3fc',
                    pointBorderColor: '#7dd3fc'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: chartTheme.text, font: { size: 12 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    },
                    x: {
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    }
                }
            }
        });

        // Memory Chart
        const memoryCtx = document.getElementById('memoryChart').getContext('2d');
        this.charts.memory = new Chart(memoryCtx, {
            type: 'line',
            data: {
                labels: dataGenerator.timestamps,
                datasets: [{
                    label: 'Memory Usage (%)',
                    data: dataGenerator.memoryHistory,
                    borderColor: '#a7f3d0',
                    backgroundColor: 'rgba(167, 243, 208, 0.14)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointBackgroundColor: '#a7f3d0',
                    pointBorderColor: '#a7f3d0'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: chartTheme.text, font: { size: 12 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    },
                    x: {
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    }
                }
            }
        });

        // Network Chart
        const networkCtx = document.getElementById('networkChart').getContext('2d');
        this.charts.network = new Chart(networkCtx, {
            type: 'bar',
            data: {
                labels: dataGenerator.timestamps,
                datasets: [{
                    label: 'Inbound (Mbps)',
                    data: dataGenerator.networkHistory,
                    backgroundColor: 'rgba(125, 211, 252, 0.45)',
                    borderColor: '#7dd3fc',
                    borderWidth: 1
                }, {
                    label: 'Outbound (Mbps)',
                    data: dataGenerator.networkHistory.map(v => v * 0.7),
                    backgroundColor: 'rgba(148, 163, 184, 0.45)',
                    borderColor: '#94a3b8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: chartTheme.text, font: { size: 12 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    },
                    x: {
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    }
                }
            }
        });

        // Database Queries Chart
        const dbCtx = document.getElementById('dbChart').getContext('2d');
        this.charts.db = new Chart(dbCtx, {
            type: 'line',
            data: {
                labels: dataGenerator.timestamps,
                datasets: [{
                    label: 'Queries/sec',
                    data: dataGenerator.dbQueryHistory,
                    borderColor: '#93c5fd',
                    backgroundColor: 'rgba(147, 197, 253, 0.12)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointBackgroundColor: '#93c5fd',
                    pointBorderColor: '#93c5fd'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: chartTheme.text, font: { size: 12 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    },
                    x: {
                        ticks: { color: chartTheme.axis },
                        grid: { color: chartTheme.grid }
                    }
                }
            }
        });
    }

    updateCharts() {
        // Update CPU Chart
        this.charts.cpu.data.labels = dataGenerator.timestamps;
        this.charts.cpu.data.datasets[0].data = dataGenerator.cpuHistory;
        this.charts.cpu.update();

        // Update Memory Chart
        this.charts.memory.data.labels = dataGenerator.timestamps;
        this.charts.memory.data.datasets[0].data = dataGenerator.memoryHistory;
        this.charts.memory.update();

        // Update Network Chart
        this.charts.network.data.labels = dataGenerator.timestamps;
        this.charts.network.data.datasets[0].data = dataGenerator.networkHistory;
        this.charts.network.data.datasets[1].data = dataGenerator.networkHistory.map(v => v * 0.7);
        this.charts.network.update();

        // Update Database Chart
        this.charts.db.data.labels = dataGenerator.timestamps;
        this.charts.db.data.datasets[0].data = dataGenerator.dbQueryHistory;
        this.charts.db.update();
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fr-FR');
        document.getElementById('timestamp').textContent = timeString;
    }

    render() {
        this.renderServers();
        this.renderDbMetrics();
        this.renderLogs();
        this.renderHealth();
    }

    renderServers() {
        const container = document.getElementById('serversContainer');
        container.innerHTML = dataGenerator.servers.map(server => `
            <div class="server-card">
                <h3>${server.name}</h3>
                ${this.simplifiedView ? '' : `
                <div class="server-stat">
                    <span class="server-stat-label">Région:</span>
                    <span class="server-stat-value">${server.region}</span>
                </div>
                <div class="server-stat">
                    <span class="server-stat-label">IP:</span>
                    <span class="server-stat-value">${server.ip}</span>
                </div>`}
                <div class="server-stat">
                    <span class="server-stat-label">CPU:</span>
                    <span class="server-stat-value">${server.cpu.toFixed(1)}%</span>
                </div>
                <div class="server-stat">
                    <span class="server-stat-label">RAM:</span>
                    <span class="server-stat-value">${server.memory.toFixed(1)}%</span>
                </div>
                <div class="server-stat">
                    <span class="server-stat-label">Uptime:</span>
                    <span class="server-stat-value">${server.uptime}</span>
                </div>
                <span class="status-badge ${server.status}">● ${server.status.toUpperCase()}</span>
            </div>
        `).join('');
    }

    renderDbMetrics() {
        const metrics = dataGenerator.getDbMetrics();
        const container = document.getElementById('dbMetricsContainer');
        container.innerHTML = `
            <div class="metric-card">
                <h3>Connexions</h3>
                <div class="metric-value">${metrics.connections}</div>
                <div class="metric-unit">actives</div>
            </div>
            <div class="metric-card">
                <h3>Temps Requête</h3>
                <div class="metric-value">${metrics.queryTime}</div>
                <div class="metric-unit">ms</div>
            </div>
            <div class="metric-card">
                <h3>Débit</h3>
                <div class="metric-value">${metrics.throughput}</div>
                <div class="metric-unit">ops/s</div>
            </div>
            ${this.simplifiedView ? '' : `
            <div class="metric-card">
                <h3>Cache Hit</h3>
                <div class="metric-value">${metrics.cacheHit}%</div>
                <div class="metric-unit">ratio</div>
            </div>`}
        `;
    }

    renderLogs() {
        const logs = dataGenerator.generateLogs().slice(0, this.simplifiedView ? 4 : 8);
        const container = document.getElementById('logsContainer');
        container.innerHTML = logs.map(log => `
            <div class="log-entry ${log.type}">
                <span class="log-timestamp">${log.time}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }

    renderHealth() {
        const health = dataGenerator.getHealthStatus();
        this.handleHealthAlertSound(health);
        const container = document.getElementById('healthContainer');
        container.innerHTML = health.map(item => `
            <div class="health-item">
                <h3>${item.name}</h3>
                <div class="health-status ${item.status}">${item.status === 'healthy' ? '✓' : item.status === 'warning' ? '⚠' : '✕'}</div>
                <div class="health-detail">${item.value}</div>
            </div>
        `).join('');
    }
}

// Initialize dashboard when DOM is ready
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});


// ═══════════════════════════════════════════════════════════════════
//  StreamDeck Remote Control Methods (ajoutés à Dashboard.prototype)
// ═══════════════════════════════════════════════════════════════════

Dashboard.prototype.initRemoteControl = function () {
    if (typeof io === 'undefined') return;

    this._socket = io({ transports: ['websocket', 'polling'] });

    this._socket.on('connect', () => {
        this._socket.emit('join', { role: 'tv' });
    });

    this._socket.on('request_state', () => {
        this._socket.emit('tv_state', this._getTVState());
    });

    this._socket.on('remote_count', (count) => {
        this.remoteCount = count;
        this._updateRemoteIndicator(count);
    });

    this._socket.on('command', (cmd) => {
        this._handleRemoteCommand(cmd);
        // Renvoyer le nouvel état après chaque commande
        this._socket.emit('tv_state', this._getTVState());
    });

    this._socket.on('alert_ack', (payload) => {
        this._handleAlertAck(payload);
        this._socket.emit('tv_state', this._getTVState());
    });
};

Dashboard.prototype._getTVState = function () {
    return {
        section:      this.currentSection,
        theme:        this.currentTheme,
        zoom:         this.currentZoom,
        speed:        this.updateInterval,
        audioEnabled: this.audioEnabled,
        readableMode: this.readableMode,
        simplifiedView: this.simplifiedView,
        rotationEnabled: this.rotationEnabled,
        rotationIntervalMs: this.rotationIntervalMs,
        activeUrl: this.activeUrl,
        lastAlert: this.lastAlert,
        lastAlertAck: this.lastAlertAck
    };
};

Dashboard.prototype._handleRemoteCommand = function (cmd) {
    if (!cmd || typeof cmd.action !== 'string') {
        return;
    }

    switch (cmd.action) {
        case 'focus':
            this._focusSection(cmd.section);
            break;
        case 'refresh':
            dataGenerator.updateData();
            this.updateCharts();
            this.render();
            this._showToast('Donnees rafraichies');
            break;
        case 'fullscreen':
            this._toggleFullscreen();
            break;
        case 'zoom':
            this._setZoom(this.currentZoom + (cmd.delta || 0));
            break;
        case 'toggle_sound':
            this.audioEnabled = !this.audioEnabled;
            try { localStorage.setItem('dashboard_audio_muted', this.audioEnabled ? '0' : '1'); } catch(e) {}
            if (this.audioEnabled) { this.ensureAudioContext(); this.resumeAudioContext(); }
            this.updateAudioToggleUI();
            this._showToast(this.audioEnabled ? 'Son active' : 'Son desactive');
            break;
        case 'highlight':
            this._highlightSection(this.currentSection !== 'all' ? this.currentSection : 'servers');
            break;
        case 'speed':
            this._setUpdateSpeed(cmd.value);
            break;
        case 'theme':
            this._setTheme(cmd.value);
            break;
        case 'readable_mode':
            this._setReadableMode(typeof cmd.enabled === 'boolean' ? cmd.enabled : !this.readableMode, true);
            break;
        case 'simplified_view':
            this._setSimplifiedView(typeof cmd.enabled === 'boolean' ? cmd.enabled : !this.simplifiedView, true);
            break;
        case 'rotation':
            this._setRotation(typeof cmd.enabled === 'boolean' ? cmd.enabled : !this.rotationEnabled, cmd.intervalMs);
            break;
        default:
            break;
    }
};

Dashboard.prototype._setUpdateSpeed = function (ms) {
    const next = Number(ms);
    if (!Number.isFinite(next) || next < 1000 || next > 60000) {
        return;
    }

    clearInterval(this.intervalId);
    this.updateInterval = next;
    this.intervalId = setInterval(() => {
        dataGenerator.updateData();
        this.updateCharts();
        this.render();
        this.updateClock();
    }, next);
    const label = next < 2000 ? 'Rapide' : next > 10000 ? 'Lent' : 'Normal';
    this._showToast(`${label} - ${next / 1000}s`);
};

Dashboard.prototype._emitRemoteAlert = function (severity, healthItems) {
    if (!this._socket || !this._socket.connected) {
        return;
    }

    const alert = {
        severity,
        timestamp: Date.now(),
        message: severity === 'critical'
            ? 'Alerte critique detectee sur la TV'
            : severity === 'warning'
                ? 'Alerte warning detectee sur la TV'
                : 'Retour a la normale',
        items: (healthItems || []).map(item => ({
            name: item.name,
            status: item.status,
            value: item.value
        }))
    };

    this.lastBroadcastSeverity = severity;
    this.lastAlert = alert;
    this.lastAlertAck = null;
    this._updateAlertBanner();
    this._socket.emit('tv_alert', alert);
};

Dashboard.prototype._handleAlertAck = function (payload = {}) {
    if (!this.lastAlert) {
        return;
    }

    if (payload.timestamp && this.lastAlert.timestamp !== payload.timestamp) {
        return;
    }

    this.lastAlertAck = payload.acknowledgedAt || Date.now();
    this.lastAlert = {
        ...this.lastAlert,
        acknowledgedAt: this.lastAlertAck
    };
    this._updateAlertBanner();
    this._showToast('Alerte acquittee');
};

Dashboard.prototype._setReadableMode = function (enabled, autoZoom = false) {
    const next = typeof enabled === 'boolean'
        ? (enabled === this.readableMode ? !this.readableMode : enabled)
        : !this.readableMode;
    this.readableMode = next;
    document.body.classList.toggle('readable-mode', this.readableMode);
    if (this.readableMode && autoZoom && this.currentZoom < ((typeof CONFIG !== 'undefined' && CONFIG.tv?.ultraReadableZoom) || 2)) {
        this._setZoom((typeof CONFIG !== 'undefined' && CONFIG.tv?.ultraReadableZoom) || 2);
    }
    if (!this.readableMode && autoZoom && this.currentZoom > 2) {
        this._setZoom(2);
    }
    setTimeout(() => Object.values(this.charts).forEach(c => c.resize()), 60);
    this._showToast(this.readableMode ? 'Mode ultra lisible active' : 'Mode ultra lisible desactive');
};

Dashboard.prototype._setSimplifiedView = function (enabled) {
    const next = typeof enabled === 'boolean'
        ? (enabled === this.simplifiedView ? !this.simplifiedView : enabled)
        : !this.simplifiedView;
    this.simplifiedView = next;
    document.body.classList.toggle('simplified-view', this.simplifiedView);
    this.render();
    setTimeout(() => Object.values(this.charts).forEach(c => c.resize()), 60);
    this._showToast(this.simplifiedView ? 'Vue simplifiee active' : 'Vue simplifiee desactivee');
};

Dashboard.prototype._setRotation = function (enabled, intervalMs) {
    const nextEnabled = typeof enabled === 'boolean'
        ? (enabled === this.rotationEnabled ? !this.rotationEnabled : enabled)
        : !this.rotationEnabled;
    this.rotationIntervalMs = Number(intervalMs) || this.rotationIntervalMs || 20000;

    if (this.rotationTimerId) {
        clearInterval(this.rotationTimerId);
        this.rotationTimerId = null;
    }

    this.rotationEnabled = nextEnabled;

    if (this.rotationEnabled) {
        const sections = (typeof CONFIG !== 'undefined' && CONFIG.tv?.rotationSections) || ['servers', 'database', 'charts', 'health'];
        this.rotationIndex = Math.max(0, sections.indexOf(this.currentSection));
        this._focusSection(sections[this.rotationIndex], { silent: true });
        this.rotationTimerId = setInterval(() => {
            this.rotationIndex = (this.rotationIndex + 1) % sections.length;
            this._focusSection(sections[this.rotationIndex], { silent: true });
            if (this._socket?.connected) {
                this._socket.emit('tv_state', this._getTVState());
            }
        }, this.rotationIntervalMs);
    }

    this._showToast(this.rotationEnabled ? `Rotation active (${Math.round(this.rotationIntervalMs / 1000)}s)` : 'Rotation desactivee');
};

Dashboard.prototype._updateAlertBanner = function () {
    let banner = document.getElementById('tvAlertBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'tvAlertBanner';
        banner.className = 'tv-alert-banner hidden';
        banner.innerHTML = '<strong class="tv-alert-title"></strong><span class="tv-alert-message"></span><span class="tv-alert-meta"></span>';
        document.body.appendChild(banner);
    }

    const titleEl = banner.querySelector('.tv-alert-title');
    const messageEl = banner.querySelector('.tv-alert-message');
    const metaEl = banner.querySelector('.tv-alert-meta');
    const alert = this.lastAlert;

    if (!alert) {
        banner.className = 'tv-alert-banner hidden';
        return;
    }

    const severity = alert.severity || 'healthy';
    banner.className = `tv-alert-banner ${severity}`;
    titleEl.textContent = severity === 'critical' ? 'Alerte critique' : severity === 'warning' ? 'Alerte warning' : 'Retour a la normale';
    messageEl.textContent = alert.message || 'Alerte dashboard';
    metaEl.textContent = alert.acknowledgedAt
        ? `Acquittee a ${new Date(alert.acknowledgedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        : `Recue a ${new Date(alert.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
};

Dashboard.prototype._focusSection = function (section, options = {}) {
    this.currentSection = section;
    const body = document.body;
    const SELECTORS = {
        servers: '#section-servers', database: '#section-database',
        charts: '#section-charts', network: '#section-network',
        logs: '#section-logs', health: '#section-health'
    };

    document.querySelectorAll('.dashboard-section').forEach(el => el.classList.remove('section-focused'));

    if (section === 'all') {
        body.classList.remove('focus-mode');
    } else {
        body.classList.add('focus-mode');
        const el = document.querySelector(SELECTORS[section]);
        if (el) {
            el.classList.add('section-focused');
            this._highlightSection(section);
        }
    }

    setTimeout(() => Object.values(this.charts).forEach(c => c.resize()), 60);
    if (!options.silent) {
        this._showToast(section === 'all' ? 'Vue complete' : `Focalise: ${section}`);
    }
};

Dashboard.prototype._highlightSection = function (section) {
    const SELECTORS = {
        servers: '#section-servers', database: '#section-database',
        charts: '#section-charts', network: '#section-network',
        logs: '#section-logs', health: '#section-health'
    };

    const el = document.querySelector(SELECTORS[section]);
    if (!el) {
        return;
    }

    el.classList.remove('section-highlighted');
    void el.offsetWidth;
    el.classList.add('section-highlighted');
    setTimeout(() => el.classList.remove('section-highlighted'), 900);
};

Dashboard.prototype._setZoom = function (level) {
    this.currentZoom = Math.max(1, Math.min(3, Math.round(level)));
    document.body.classList.remove('zoom-2', 'zoom-3');
    if (this.currentZoom === 2) document.body.classList.add('zoom-2');
    if (this.currentZoom === 3) document.body.classList.add('zoom-3');
    setTimeout(() => Object.values(this.charts).forEach(c => c.resize()), 60);
    this._showToast(`Zoom x${this.currentZoom}`);
};

Dashboard.prototype._setTheme = function (theme) {
    this.currentTheme = theme;
    document.body.classList.remove('theme-neon', 'theme-minimal');
    if (theme === 'neon') document.body.classList.add('theme-neon');
    if (theme === 'minimal') document.body.classList.add('theme-minimal');
    const labels = { dark: 'Theme dark', neon: 'Theme neon', minimal: 'Theme minimal' };
    this._showToast(labels[theme] || theme);
};

Dashboard.prototype._toggleFullscreen = function () {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        return;
    }

    document.documentElement.requestFullscreen().catch(() => {
        this._showToast('Autorisez le plein ecran puis reessayez');
    });
};

Dashboard.prototype._updateRemoteIndicator = function (count) {
    const indicator = document.getElementById('remoteIndicator');
    const text = document.getElementById('remoteIndicatorText');
    if (!indicator || !text) {
        return;
    }

    if (count > 0) {
        indicator.style.display = 'flex';
        text.textContent = `${count} telecommande${count > 1 ? 's' : ''}`;
        return;
    }

    indicator.style.display = 'none';
};

Dashboard.prototype._showToast = function (msg) {
    let toast = document.getElementById('_tvToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = '_tvToast';
        toast.className = 'tv-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
};

