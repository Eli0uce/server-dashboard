# 🔌 Guide d'Intégration - Connecter avec de Vraies Données

Ce guide explique comment connecter le dashboard avec vos vraies données de serveurs, bases de données et logs.

## 📋 Vue d'ensemble

Le dashboard peut fonctionner de deux manières:

1. **Mode Demo** (par défaut) - Utilise des données générées aléatoirement
2. **Mode Production** - Connecte à vos vraies API et sources de données

## 🔄 Architecture d'Intégration

```
┌─────────────────────┐
│   Dashboard (UI)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ APIIntegration      │
│ (Abstraction Layer) │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │          │
┌─────▼──┐  ┌───▼────┐
│ Fake   │  │ Vraies │
│ Data   │  │ APIs   │
└────────┘  └────────┘
```

## 🚀 Basculer vers les Vraies Données

### Option 1: Via le fichier `app.js`

Modifiez la classe `Dashboard` pour utiliser l'API:

```javascript
// Dans app.js
class Dashboard {
    constructor() {
        // ... existing code ...
        
        // Basculer vers vraies données
        apiIntegration.toggleFakeData(false);
        
        this.init();
    }
}
```

### Option 2: Dynamiquement via la console

```javascript
// Dans la console du navigateur (F12)
apiIntegration.toggleFakeData(false);
```

### Option 3: Via Query Parameter

Modifiez `server.js`:

```javascript
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ajouter une variable globale
app.get('/config', (req, res) => {
    res.json({ useFakeData: req.query.fake !== 'false' });
});
```

Puis accédez à: `http://localhost:3000?fake=false`

## 🔌 Endpoints API Requis

Voici les endpoints que votre API doit fournir:

### 1. **GET /api/servers**
Retourne la liste des serveurs

```json
{
  "status": "success",
  "servers": [
    {
      "id": 1,
      "name": "WEB-01",
      "region": "US-EAST-1",
      "ip": "192.168.1.1",
      "status": "online",
      "uptime": "45d 12h",
      "cpu": 45.2,
      "memory": 62.8,
      "network": 1024
    }
  ]
}
```

### 2. **GET /api/health**
Retourne l'état de santé général

```json
{
  "status": "success",
  "health": {
    "cpu": 45,
    "memory": 62,
    "disk": 78,
    "network": 5000
  }
}
```

### 3. **GET /api/logs**
Retourne les logs récents

```json
{
  "status": "success",
  "logs": [
    {
      "timestamp": "2024-04-14T17:45:32Z",
      "level": "info",
      "message": "Backup completed successfully"
    }
  ]
}
```

### 4. **GET /api/database/metrics**
Retourne les métriques de la base de données

```json
{
  "status": "success",
  "metrics": {
    "connections": 250,
    "queryTime": 125,
    "throughput": 5000,
    "cacheHit": 95.5
  }
}
```

### 5. **GET /api/network/metrics**
Retourne les métriques réseau

```json
{
  "status": "success",
  "metrics": {
    "inbound": 2500,
    "outbound": 1750,
    "packetLoss": "0.02",
    "latency": 15
  }
}
```

## 🛠️ Exemple d'Intégration - Prometheus

### Installation du collecteur Prometheus

```bash
npm install prom-client
```

### Modifier `server.js`:

```javascript
const prometheus = require('prom-client');

// Endpoint pour Prometheus metrics
app.get('/metrics', (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(prometheus.register.metrics());
});

// Endpoint pour le dashboard
app.get('/api/servers', (req, res) => {
    // Récupérer les métriques de Prometheus
    const metrics = prometheus.register.getSingleMetricAsString('node_cpu_usage');
    
    res.json({
        status: 'success',
        servers: parsePrometheusMetrics(metrics)
    });
});
```

## 🌐 Exemple d'Intégration - Grafana

### Utiliser l'API Grafana

```javascript
// Dans api-integration.js
async getServersFromGrafana() {
    try {
        const response = await fetch('http://grafana:3000/api/datasources/proxy/uid/prometheus', {
            headers: {
                'Authorization': 'Bearer YOUR_API_TOKEN'
            }
        });
        const data = await response.json();
        return this.transformGrafanaData(data);
    } catch (error) {
        console.error('Erreur Grafana:', error);
        return [];
    }
}
```

## 📊 Exemple d'Intégration - Elasticsearch/Logs

```javascript
// Récupérer les logs d'Elasticsearch
async getLogsFromElasticsearch() {
    try {
        const response = await fetch('http://elasticsearch:9200/logs-*/_search', {
            method: 'POST',
            body: JSON.stringify({
                size: 8,
                sort: [{ '@timestamp': 'desc' }],
                query: { match_all: {} }
            })
        });
        const data = await response.json();
        return data.hits.hits.map(hit => ({
            timestamp: hit._source['@timestamp'],
            level: hit._source.level,
            message: hit._source.message
        }));
    } catch (error) {
        console.error('Erreur Elasticsearch:', error);
        return [];
    }
}
```

## 🗄️ Exemple d'Intégration - Base de Données

```javascript
// Dans server.js
const mysql = require('mysql2/promise');

app.get('/api/database/metrics', async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [connections] = await connection.query(
            'SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.PROCESSLIST'
        );
        
        const [queryTime] = await connection.query(
            'SELECT AVG(TIMER_WAIT)/1000000000 as avg_ms FROM performance_schema.events_statements_summary_by_digest LIMIT 1'
        );

        await connection.end();

        res.json({
            status: 'success',
            metrics: {
                connections: connections[0].count,
                queryTime: Math.round(queryTime[0].avg_ms),
                throughput: 5000,
                cacheHit: 95.5
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});
```

## 🔐 Sécurité

### Ajouter l'authentification

```javascript
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'Token required' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

app.get('/api/servers', verifyToken, (req, res) => {
    // ... code sécurisé ...
});
```

### Variables d'environnement

```bash
# .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
JWT_SECRET=your_jwt_secret
GRAFANA_API_TOKEN=your_token
```

```javascript
// Dans server.js
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};
```

## 📈 Mise en Cache

Pour améliorer les performances:

```javascript
const cache = {};
const CACHE_DURATION = 5000; // 5 secondes

app.get('/api/servers', (req, res) => {
    if (cache.servers && Date.now() - cache.serversTime < CACHE_DURATION) {
        return res.json(cache.servers);
    }
    
    // Récupérer les données...
    const data = { status: 'success', servers: [] };
    
    cache.servers = data;
    cache.serversTime = Date.now();
    
    res.json(data);
});
```

## 🧪 Tester l'Intégration

### Via cURL

```bash
# Tester les serveurs
curl http://localhost:3000/api/servers

# Tester la santé
curl http://localhost:3000/api/health

# Tester les logs
curl http://localhost:3000/api/logs
```

### Via Postman

1. Créer une collection
2. Ajouter les endpoints
3. Configurer les variables d'environnement
4. Tester chaque endpoint

### Vérifier dans la console du navigateur

```javascript
// Ouvrir F12, aller dans la console
apiIntegration.getServers().then(servers => console.log(servers));
apiIntegration.getHealth().then(health => console.log(health));
apiIntegration.getLogs().then(logs => console.log(logs));
```

## 🔄 Bascule Progressive

Vous pouvez tester graduellement:

```javascript
// Phase 1: Gardez les données fakes
apiIntegration.useFakeData = true;

// Phase 2: Testez les servers réels
apiIntegration.useFakeData = false;
// ... testez ...

// Phase 3: Testez les autres endpoints
// ... etc ...
```

## 📞 Support & Debugging

### Voir les requêtes en temps réel

```javascript
// Dans app.js
const originalRender = Dashboard.prototype.render;
Dashboard.prototype.render = function() {
    console.log('[Dashboard] Mise à jour rendu');
    originalRender.call(this);
};
```

### Logger les erreurs API

```javascript
// Dans api-integration.js
async getServers() {
    try {
        console.log('Récupération des serveurs...');
        const servers = await fetch(`${this.baseUrl}/servers`);
        console.log('✓ Serveurs récupérés:', servers);
        return servers;
    } catch (error) {
        console.error('✗ Erreur serveurs:', error);
        return [];
    }
}
```

## 🎯 Prochaines Étapes

1. ✅ Comprendre l'architecture d'intégration
2. ✅ Configurer vos endpoints API
3. ✅ Tester chaque endpoint
4. ✅ Basculer vers les vraies données
5. ✅ Monitorer et optimiser
6. ✅ Ajouter la sécurité

---

**Happy Integration! 🚀**

