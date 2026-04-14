// Advanced Features and Shortcuts
class AdvancedFeatures {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.initKeyboardShortcuts();
        this.initDevTools();
    }

    /**
     * Initialiser les raccourcis clavier
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F11 - Plein écran (géré par le navigateur)
            // P - Pause la mise à jour
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }

            // R - Rafraîchir immédiatement
            if (e.key === 'r' || e.key === 'R') {
                this.forceRefresh();
            }

            // D - Basculer mode debug
            if (e.key === 'd' || e.key === 'D' && e.ctrlKey) {
                this.toggleDebugMode();
            }

            // T - Test des données
            if (e.key === 't' || e.key === 'T' && e.ctrlKey) {
                this.testData();
            }

            // ? - Afficher l'aide
            if (e.key === '?') {
                this.showHelp();
            }
        });
    }

    /**
     * Pause/reprendre les mises à jour
     */
    togglePause() {
        if (this.dashboard.updateInterval) {
            clearInterval(this.dashboard.updateInterval);
            this.dashboard.updateInterval = null;
            this.showNotification('⏸ Dashboard en pause');
        } else {
            this.dashboard.init();
            this.showNotification('▶ Dashboard redémarré');
        }
    }

    /**
     * Forcer le rafraîchissement immédiat
     */
    forceRefresh() {
        dataGenerator.updateData();
        this.dashboard.updateCharts();
        this.dashboard.render();
        this.showNotification('🔄 Données rafraîchies');
    }

    /**
     * Mode debug
     */
    toggleDebugMode() {
        window.DEBUG = !window.DEBUG;
        if (window.DEBUG) {
            console.log('🐛 Mode debug activé');
            this.showNotification('🐛 Debug ON');
        } else {
            console.log('✓ Mode debug désactivé');
            this.showNotification('✓ Debug OFF');
        }
    }

    /**
     * Tester les données
     */
    testData() {
        const testData = {
            servers: dataGenerator.servers,
            cpuAvg: (dataGenerator.cpuHistory.reduce((a, b) => a + b) / dataGenerator.cpuHistory.length).toFixed(2),
            memAvg: (dataGenerator.memoryHistory.reduce((a, b) => a + b) / dataGenerator.memoryHistory.length).toFixed(2),
            health: dataGenerator.getHealthStatus(),
            timestamp: new Date().toISOString()
        };
        console.table(testData);
        this.showNotification('📊 Données de test affichées en console');
    }

    /**
     * Afficher l'aide
     */
    showHelp() {
        const help = `
╔══════════════════════════════════════════════════════════════════════╗
║              🎮 RACCOURCIS CLAVIER DU DASHBOARD                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  F11              Plein écran / Quitter plein écran                   ║
║  P                Pause / Reprendre les mises à jour                  ║
║  R                Rafraîchir immédiatement les données                ║
║  Ctrl+D           Mode debug (affiche les logs dans la console)       ║
║  Ctrl+T           Tester les données (affiche dans console)           ║
║  ?                Afficher cette aide                                 ║
║  Ctrl+E           Exporter les métriques en JSON                      ║
║  Ctrl+S           Prendre une capture d'écran                         ║
║  Ctrl+L           Effacer les logs                                    ║
║  +/-              Augmenter/Diminuer la vitesse de mise à jour        ║
╠══════════════════════════════════════════════════════════════════════╣
║  CONSOLE                                                              ║
║  apiIntegration.toggleFakeData(false) - Utiliser vraies données       ║
║  dataGenerator.servers               - Voir tous les serveurs        ║
║  dashboard.charts                   - Voir tous les graphiques       ║
║  CONFIG                             - Voir la configuration          ║
╚══════════════════════════════════════════════════════════════════════╝
        `;
        alert(help);
    }

    /**
     * Afficher une notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 212, 255, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Exporter les métriques en JSON
     */
    exportMetrics() {
        const data = {
            timestamp: new Date().toISOString(),
            servers: dataGenerator.servers,
            health: dataGenerator.getHealthStatus(),
            database: dataGenerator.getDbMetrics(),
            network: dataGenerator.getNetworkMetrics(),
            cpuHistory: dataGenerator.cpuHistory,
            memoryHistory: dataGenerator.memoryHistory
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metrics-${Date.now()}.json`;
        a.click();

        this.showNotification('📥 Métriques exportées');
    }

    /**
     * Prendre une capture d'écran
     */
    takeScreenshot() {
        // Utiliser html2canvas si disponible
        if (typeof html2canvas !== 'undefined') {
            html2canvas(document.body).then(canvas => {
                const link = document.createElement('a');
                link.href = canvas.toDataURL();
                link.download = `dashboard-${Date.now()}.png`;
                link.click();
                this.showNotification('📸 Screenshot pris');
            });
        } else {
            console.log('Note: Installer html2canvas pour les screenshots');
        }
    }

    /**
     * Effacer les logs
     */
    clearLogs() {
        const logsContainer = document.getElementById('logsContainer');
        logsContainer.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">Aucun log</div>';
        this.showNotification('🗑 Logs effacés');
    }

    /**
     * Ajuster la vitesse de mise à jour
     */
    adjustUpdateSpeed(increase = true) {
        const current = this.dashboard.updateInterval;
        const newInterval = increase ? current + 1000 : Math.max(1000, current - 1000);

        if (this.dashboard.updateInterval) {
            clearInterval(this.dashboard.updateInterval);
            this.dashboard.updateInterval = setInterval(() => {
                dataGenerator.updateData();
                this.dashboard.updateCharts();
                this.dashboard.render();
            }, newInterval);
        }

        const speed = Math.round(newInterval / 1000);
        this.showNotification(`⏱ Vitesse: ${speed}s`);
    }

    /**
     * Afficher les statistiques du système
     */
    showStats() {
        const stats = {
            'Serveurs': dataGenerator.servers.length,
            'CPU Moyen': (dataGenerator.cpuHistory.reduce((a, b) => a + b) / dataGenerator.cpuHistory.length).toFixed(2) + '%',
            'Mémoire Moyenne': (dataGenerator.memoryHistory.reduce((a, b) => a + b) / dataGenerator.memoryHistory.length).toFixed(2) + '%',
            'Serveurs Online': dataGenerator.servers.filter(s => s.status === 'online').length,
            'Serveurs Warning': dataGenerator.servers.filter(s => s.status === 'warning').length,
            'Uptime Browser': (performance.now() / 1000).toFixed(0) + 's'
        };

        console.table(stats);
        this.showNotification('📊 Stats affichées en console');
    }

    /**
     * Initialiser les outils de développement
     */
    initDevTools() {
        // Rendre les outils disponibles globalement
        window.advancedFeatures = this;

        // Ajouter un panneau de contrôle en bas à droite
        this.createControlPanel();
    }

    /**
     * Créer un panneau de contrôle
     */
    createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'control-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(15, 32, 39, 0.9);
            border: 2px solid #00d4ff;
            border-radius: 8px;
            padding: 10px;
            z-index: 9999;
            font-size: 12px;
            color: #00d4ff;
            font-family: monospace;
            max-width: 200px;
        `;

        panel.innerHTML = `
            <div style="margin-bottom: 8px; border-bottom: 1px solid #00d4ff; padding-bottom: 5px;">
                <strong>🎮 Panel de Contrôle</strong>
            </div>
            <button onclick="advancedFeatures.togglePause()" style="width: 100%; margin: 5px 0; padding: 5px; background: #00d4ff; color: #000; border: none; border-radius: 3px; cursor: pointer;">⏸ Pause</button>
            <button onclick="advancedFeatures.forceRefresh()" style="width: 100%; margin: 5px 0; padding: 5px; background: #00d4ff; color: #000; border: none; border-radius: 3px; cursor: pointer;">🔄 Refresh</button>
            <button onclick="advancedFeatures.showStats()" style="width: 100%; margin: 5px 0; padding: 5px; background: #00d4ff; color: #000; border: none; border-radius: 3px; cursor: pointer;">📊 Stats</button>
            <button onclick="advancedFeatures.exportMetrics()" style="width: 100%; margin: 5px 0; padding: 5px; background: #00d4ff; color: #000; border: none; border-radius: 3px; cursor: pointer;">📥 Export</button>
            <button onclick="document.getElementById('control-panel').style.display = 'none'" style="width: 100%; margin: 5px 0; padding: 5px; background: #666; color: #fff; border: none; border-radius: 3px; cursor: pointer;">✕ Fermer</button>
        `;

        document.body.appendChild(panel);
    }
}

// Initialiser les fonctionnalités avancées
document.addEventListener('DOMContentLoaded', () => {
    // Sera appelé après que Dashboard soit initialisé
    setTimeout(() => {
        if (typeof dashboard !== 'undefined') {
            window.advancedFeatures = new AdvancedFeatures(dashboard);
        }
    }, 500);
});

