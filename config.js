// Configuration du Dashboard
const CONFIG = {
    // Intervalles de mise à jour (en millisecondes)
    updateInterval: 5000,              // Mise à jour des données
    chartUpdateInterval: 5000,         // Mise à jour des graphiques
    clockUpdateInterval: 1000,         // Mise à jour de l'horloge

    // Paramètres de graphiques
    charts: {
        maxDataPoints: 24,             // Nombre de points dans l'historique
        tension: 0.4,                  // Tension de la courbe
        pointRadius: 3                 // Taille des points
    },

    // Paramètres de serveurs
    servers: {
        count: 6,
        cpuMin: 10,
        cpuMax: 100,
        memoryMin: 20,
        memoryMax: 100,
        cpuVariation: 20,              // Variation max CPU par update
        memoryVariation: 15            // Variation max RAM par update
    },

    // Paramètres réseau
    network: {
        inboundMin: 500,
        inboundMax: 5500,
        outboundRatio: 0.7             // Outbound = inbound * ratio
    },

    // Paramètres base de données
    database: {
        connectionsMin: 50,
        connectionsMax: 500,
        queryTimeMin: 10,
        queryTimeMax: 200,
        throughputMin: 1000,
        throughputMax: 11000,
        cacheHitMin: 70,
        cacheHitMax: 99.9
    },

    // Paramètres de santé
    health: {
        cpuWarningThreshold: 60,
        cpuCriticalThreshold: 80,
        memoryWarningThreshold: 70,
        memoryCriticalThreshold: 85,
        networkWarningThreshold: 8000,
        remoteBroadcastCooldown: {
            warning: 30000,
            critical: 12000,
            healthy: 0
        }
    },

    // Logs
    logs: {
        maxEntries: 8
    },

    // Couleurs
    colors: {
        primary: '#00d4ff',
        accent: '#ffd700',
        success: '#00ff00',
        warning: '#ffd700',
        error: '#ff6b6b',
        background: 'rgba(15, 32, 39, 0.95)'
    },

    // API
    api: {
        baseUrl: 'http://localhost:3000/api'
    },

    // Télécommande mobile
    remote: {
        alertHistoryLimit: 20,
        sensitiveActions: ['fullscreen', 'toggle_sound', 'speed'],
        notificationCooldownMs: {
            warning: 30000,
            critical: 12000,
            healthy: 0
        }
    },

    // Modes d'affichage TV
    tv: {
        rotationSections: ['servers', 'database', 'charts', 'health'],
        defaultRotationIntervalMs: 20000,
        ultraReadableZoom: 2
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

