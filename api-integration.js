// API Integration Layer - Pour connecter avec de vraies données
class APIIntegration {
    constructor() {
        this.baseUrl = CONFIG.api.baseUrl || 'http://localhost:3000/api';
        this.useFakeData = true;  // Basculer à false pour utiliser des vraies données
    }

    /**
     * Récupérer les données des serveurs
     */
    async getServers() {
        if (this.useFakeData) {
            return dataGenerator.servers;
        }

        try {
            const response = await fetch(`${this.baseUrl}/servers`);
            const data = await response.json();
            return data.servers || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des serveurs:', error);
            return dataGenerator.servers;
        }
    }

    /**
     * Récupérer les métriques de santé
     */
    async getHealth() {
        if (this.useFakeData) {
            return dataGenerator.getHealthStatus();
        }

        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            return data.health || {};
        } catch (error) {
            console.error('Erreur lors de la récupération de la santé:', error);
            return dataGenerator.getHealthStatus();
        }
    }

    /**
     * Récupérer les logs récents
     */
    async getLogs() {
        if (this.useFakeData) {
            return dataGenerator.generateLogs();
        }

        try {
            const response = await fetch(`${this.baseUrl}/logs`);
            const data = await response.json();
            return data.logs || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des logs:', error);
            return dataGenerator.generateLogs();
        }
    }

    /**
     * Récupérer les métriques de la base de données
     */
    async getDatabaseMetrics() {
        if (this.useFakeData) {
            return dataGenerator.getDbMetrics();
        }

        try {
            const response = await fetch(`${this.baseUrl}/database/metrics`);
            const data = await response.json();
            return data.metrics || {};
        } catch (error) {
            console.error('Erreur lors de la récupération des métriques DB:', error);
            return dataGenerator.getDbMetrics();
        }
    }

    /**
     * Récupérer les métriques réseau
     */
    async getNetworkMetrics() {
        if (this.useFakeData) {
            return dataGenerator.getNetworkMetrics();
        }

        try {
            const response = await fetch(`${this.baseUrl}/network/metrics`);
            const data = await response.json();
            return data.metrics || {};
        } catch (error) {
            console.error('Erreur lors de la récupération des métriques réseau:', error);
            return dataGenerator.getNetworkMetrics();
        }
    }

    /**
     * Basculer entre données fakes et vraies données
     */
    toggleFakeData(useFake) {
        this.useFakeData = useFake;
        console.log(this.useFakeData ? '✓ Utilisation des données fakes' : '✓ Utilisation des vraies données');
    }

    /**
     * Vérifier la connexion à l'API
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Créer une instance globale
const apiIntegration = new APIIntegration();

