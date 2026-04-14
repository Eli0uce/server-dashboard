// Data Generator - Generates fake data for the dashboard
class DataGenerator {
    constructor() {
        this.servers = this.generateServers();
        this.cpuHistory = [];
        this.memoryHistory = [];
        this.networkHistory = [];
        this.dbQueryHistory = [];
        this.timestamps = [];
        this.initializeHistories();
    }

    generateServers() {
        const servers = [];
        const serverNames = ['WEB-01', 'WEB-02', 'API-01', 'DB-MASTER', 'DB-SLAVE', 'CACHE-01'];
        const regions = ['US-EAST-1', 'EU-WEST-1', 'AP-SOUTH-1', 'US-WEST-2'];
        
        for (let i = 0; i < serverNames.length; i++) {
            servers.push({
                id: i + 1,
                name: serverNames[i],
                region: regions[Math.floor(Math.random() * regions.length)],
                ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                status: Math.random() > 0.15 ? 'online' : (Math.random() > 0.5 ? 'warning' : 'offline'),
                uptime: `${Math.floor(Math.random() * 120)}d ${Math.floor(Math.random() * 24)}h`,
                cpu: Math.floor(Math.random() * 100),
                memory: Math.floor(Math.random() * 100),
                network: Math.floor(Math.random() * 1000)
            });
        }
        return servers;
    }

    initializeHistories() {
        for (let i = 0; i < 24; i++) {
            const date = new Date();
            date.setHours(date.getHours() - (23 - i));
            const hour = date.getHours().toString().padStart(2, '0');
            this.timestamps.push(`${hour}:00`);
            
            this.cpuHistory.push(Math.floor(Math.random() * 80 + 10));
            this.memoryHistory.push(Math.floor(Math.random() * 70 + 20));
            this.networkHistory.push(Math.floor(Math.random() * 5000 + 500));
            this.dbQueryHistory.push(Math.floor(Math.random() * 10000 + 1000));
        }
    }

    updateData() {
        // Update server metrics
        this.servers.forEach(server => {
            server.cpu = Math.max(0, server.cpu + (Math.random() - 0.5) * 20);
            server.cpu = Math.min(100, server.cpu);
            
            server.memory = Math.max(0, server.memory + (Math.random() - 0.5) * 15);
            server.memory = Math.min(100, server.memory);
            
            server.network = Math.floor(Math.random() * 1000);
            
            // Random status changes
            if (Math.random() < 0.02) {
                const statuses = ['online', 'warning'];
                server.status = statuses[Math.floor(Math.random() * statuses.length)];
            }
        });

        // Update history (sliding window)
        this.cpuHistory.shift();
        this.cpuHistory.push(Math.floor(Math.random() * 80 + 10));
        
        this.memoryHistory.shift();
        this.memoryHistory.push(Math.floor(Math.random() * 70 + 20));
        
        this.networkHistory.shift();
        this.networkHistory.push(Math.floor(Math.random() * 5000 + 500));
        
        this.dbQueryHistory.shift();
        this.dbQueryHistory.push(Math.floor(Math.random() * 10000 + 1000));

        // Update timestamps
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        this.timestamps.shift();
        this.timestamps.push(`${hour}:00`);
    }

    getDbMetrics() {
        return {
            connections: Math.floor(Math.random() * 500 + 50),
            queryTime: Math.floor(Math.random() * 200 + 10),
            throughput: Math.floor(Math.random() * 10000 + 1000),
            cacheHit: Math.floor(Math.random() * 100 * 100) / 100
        };
    }

    getNetworkMetrics() {
        return {
            inbound: Math.floor(Math.random() * 10000 + 1000),
            outbound: Math.floor(Math.random() * 8000 + 500),
            packetLoss: (Math.random() * 0.5).toFixed(2),
            latency: Math.floor(Math.random() * 50 + 5)
        };
    }

    getHealthStatus() {
        return [
            {
                name: 'CPU',
                status: this.cpuHistory[this.cpuHistory.length - 1] > 80 ? 'critical' : 
                        this.cpuHistory[this.cpuHistory.length - 1] > 60 ? 'warning' : 'healthy',
                value: this.cpuHistory[this.cpuHistory.length - 1] + '%'
            },
            {
                name: 'Mémoire',
                status: this.memoryHistory[this.memoryHistory.length - 1] > 85 ? 'critical' : 
                        this.memoryHistory[this.memoryHistory.length - 1] > 70 ? 'warning' : 'healthy',
                value: this.memoryHistory[this.memoryHistory.length - 1] + '%'
            },
            {
                name: 'Disque',
                status: Math.random() > 0.8 ? 'warning' : 'healthy',
                value: Math.floor(Math.random() * 70 + 20) + '%'
            },
            {
                name: 'Réseau',
                status: this.networkHistory[this.networkHistory.length - 1] > 8000 ? 'warning' : 'healthy',
                value: this.networkHistory[this.networkHistory.length - 1] + ' Mbps'
            }
        ];
    }

    generateLogs() {
        const logTypes = ['info', 'warning', 'error', 'success'];
        const logMessages = [
            'Backup completed successfully',
            'Cache cleared',
            'Database optimization started',
            'Connection timeout - retrying',
            'New deployment released',
            'Health check passed',
            'High memory usage detected',
            'API response time: 125ms',
            'SSL certificate renewal scheduled',
            'Load balancer status: OK',
            'Database replication lag: 2ms',
            'Disk space running low (82%)',
            'Scheduled maintenance completed',
            'Alert threshold exceeded',
            'Service instance started'
        ];

        const logs = [];
        for (let i = 0; i < 8; i++) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60));
            const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            logs.push({
                time,
                type: logTypes[Math.floor(Math.random() * logTypes.length)],
                message: logMessages[Math.floor(Math.random() * logMessages.length)]
            });
        }
        return logs;
    }
}

// Create global instance
const dataGenerator = new DataGenerator();

