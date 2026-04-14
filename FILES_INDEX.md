# 📚 Index des Fichiers - Server Dashboard

Guide complet de la structure et du contenu du projet.

## 📁 Structure du Projet

```
server-dashboard/
├── 📄 Fichiers de Configuration
│   ├── package.json              - Dépendances npm
│   ├── .env.example              - Variables d'environnement exemple
│   ├── .gitignore               - Fichiers à ignorer git
│   ├── config.js                - Configuration globale
│   ├── docker-compose.yml       - Configuration Docker Compose
│   └── Dockerfile               - Configuration Docker
│
├── 📄 Fichiers Frontend (Interface Web)
│   ├── index.html               - Page HTML principale
│   ├── styles.css               - Styles CSS (responsif, animations)
│   ├── app.js                   - Application principale du dashboard
│   ├── data-generator.js        - Générateur de données fake
│   ├── api-integration.js       - Couche d'intégration API
│   └── advanced-features.js     - Fonctionnalités avancées et raccourcis
│
├── 📄 Fichiers Backend (Serveur)
│   ├── server.js                - Serveur Express
│   └── start.sh                 - Script de démarrage bash
│
├── 📄 Fichiers de Documentation
│   ├── README.md                - Documentation principale
│   ├── QUICKSTART.md            - Démarrage rapide (30 secondes)
│   ├── INTEGRATION_GUIDE.md     - Guide d'intégration avec vraies données
│   ├── DEPLOYMENT.md            - Guide de déploiement en production
│   ├── TV_GUIDE.md              - Guide d'utilisation sur TV
│   └── FILES_INDEX.md           - Ce fichier
│
└── 📁 node_modules/             - Dépendances npm (auto-généré)
    ├── chart.js
    ├── express
    ├── cors
    └── ...

```

---

## 📄 Description Détaillée des Fichiers

### Configuration

#### `package.json`
- **Rôle**: Gère les dépendances npm
- **Contenu**:
  - Scripts: `start`, `dev`
  - Dépendances: express, cors, chart.js, axios, vue
  - Métadonnées du projet
- **Modifier pour**: Ajouter de nouvelles dépendances

#### `.env.example`
- **Rôle**: Template des variables d'environnement
- **Contenu**:
  - Port du serveur
  - Configs API (DB, Grafana, Elasticsearch)
  - Clés de sécurité
- **À faire**: Dupliquer en `.env` et remplir vos valeurs

#### `config.js`
- **Rôle**: Configuration centralisée
- **Contenu**:
  - Intervalles de mise à jour
  - Seuils de santé (warning/critical)
  - Plages de données (min/max)
  - Palettes de couleurs
- **Modifier pour**: Ajuster les paramètres de comportement

#### `Dockerfile` + `docker-compose.yml`
- **Rôle**: Containerization Docker
- **Contenu**:
  - Image Node.js Alpine
  - Configuration du port
  - Variables d'environnement
- **Utiliser pour**: Déploiement standardisé

---

### Frontend - Interface Utilisateur

#### `index.html`
- **Rôle**: Structure HTML du dashboard
- **Contenu**:
  - Layout responsif
  - 6 sections principales
  - Références aux fichiers CSS et JS
- **Modifier pour**: Ajouter/retirer des sections

#### `styles.css` (6.3 KB)
- **Rôle**: Styling complet du dashboard
- **Contenu**:
  - Design moderne dark-theme
  - Animations et transitions
  - Responsive grid layout
  - Couleurs: Cyan (#00d4ff), Or (#ffd700), Vert (#00ff00)
- **Modifier pour**: Personnaliser l'apparence

#### `app.js` (11 KB)
- **Rôle**: Logique principale du dashboard
- **Contient**:
  - Classe `Dashboard` - Gère l'interface
  - Initialisation des graphiques Chart.js
  - Rendu dynamique des sections
  - Mise à jour automatique
- **Fonctions clés**:
  - `initializeCharts()` - Crée les graphiques
  - `updateCharts()` - Met à jour les données
  - `render()` - Redessine l'interface
  - `renderServers()` - Affiche les serveurs
  - `renderDbMetrics()` - Affiche les métriques DB

#### `data-generator.js` (6.4 KB)
- **Rôle**: Génère des données fakes réalistes
- **Contient**:
  - Classe `DataGenerator` - Crée les données
  - 6 serveurs pré-configurés
  - Historique 24h de CPU/Mémoire/Réseau
  - Génération de logs
- **Données générées**:
  - CPU: 10-90% avec variation
  - Mémoire: 20-90% avec variation
  - Réseau: 500-5500 Mbps
  - Logs: Messages variés

#### `api-integration.js` (3.6 KB)
- **Rôle**: Abstraction de couche API
- **Contient**:
  - Classe `APIIntegration` - Gère les appels API
  - Bascule Fake Data ↔ Vraies Données
  - Gestion des erreurs
  - Fallback automatique
- **Endpoints supportés**:
  - `/api/servers` - Liste des serveurs
  - `/api/health` - État de santé
  - `/api/logs` - Logs récents
  - `/api/database/metrics` - Métriques DB
  - `/api/network/metrics` - Métriques réseau

#### `advanced-features.js` (11 KB)
- **Rôle**: Fonctionnalités avancées et raccourcis
- **Contient**:
  - Classe `AdvancedFeatures` - Gère les raccourcis
  - Panel de contrôle en bas à gauche
  - Systèmes de notifications
  - Export de données
- **Raccourcis clavier**:
  - `P` - Pause/Reprendre
  - `R` - Rafraîchir
  - `Ctrl+D` - Debug mode
  - `Ctrl+T` - Test données
  - `?` - Aide

---

### Backend - Serveur

#### `server.js` (2 KB)
- **Rôle**: Serveur Express
- **Contenu**:
  - Setup CORS
  - Static file serving
  - 5 endpoints API
  - Auto-génération de données
- **Endpoints**:
  - `GET /` - Serve index.html
  - `GET /api/servers` - Données serveurs
  - `GET /api/health` - État de santé
  - `GET /api/logs` - Logs récents

#### `start.sh` (530 bytes)
- **Rôle**: Script de démarrage facile
- **Utilisation**: `./start.sh`
- **Affiche**: Instructions et démarre le serveur

---

### Documentation

#### `README.md` (4.5 KB)
- **Pour qui**: Tous les utilisateurs
- **Contient**:
  - Vue d'ensemble du projet
  - Features principales
  - Installation rapide
  - Configuration basique
  - Cas d'usage

#### `QUICKSTART.md` (3.9 KB)
- **Pour qui**: Nouveaux utilisateurs
- **Contient**:
  - Démarrage en 30 secondes
  - Premiers pas
  - Exploration basique
  - Raccourcis essentiels

#### `INTEGRATION_GUIDE.md` (9.6 KB)
- **Pour qui**: Développeurs
- **Contient**:
  - Architecture d'intégration
  - Format des endpoints API requis
  - Exemples: Prometheus, Grafana, Elasticsearch, MySQL
  - Sécurité et authentification
  - Mise en cache

#### `DEPLOYMENT.md` (8.4 KB)
- **Pour qui**: DevOps/Administrateurs
- **Contient**:
  - Déploiement local
  - Docker & Docker Compose
  - Cloud: Heroku, GCP, AWS
  - Nginx/Apache Reverse Proxy
  - SSL/TLS Let's Encrypt
  - Load balancing
  - Troubleshooting

#### `TV_GUIDE.md` (En cours de création)
- **Pour qui**: Utilisateurs TV
- **Contient**:
  - Configuration TV
  - Optimisations d'affichage
  - Mode kiosque
  - Auto-refresh et auto-start
  - Layouts pour différentes tailles
  - Troubleshooting TV

---

## 🔄 Flux de Données

```
┌─────────────────────────────────────────────────────┐
│              Index.html (Client)                    │
│  - Charge tous les scripts                          │
│  - Initialise le DOM                                │
└──────────────┬──────────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌────────────────┐ ┌──────────────────┐
│ app.js         │ │ data-generator.js│
│ (Dashboard)    │ │ (Données Fake)   │
└────────┬───────┘ └────────┬─────────┘
         │                  │
         └──────┬───────────┘
                │
                ▼
         ┌──────────────────┐
         │ api-integration  │
         │ (Abstraction API)│
         └────────┬─────────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
     ┌────────────┐   ┌──────────────┐
     │ Fake Data  │   │ Server.js    │
     │ (Local)    │   │ (Real API)   │
     └────────────┘   └──────────────┘
```

---

## 🔄 Cycle de Vie de l'Application

1. **Chargement** (index.html)
   - Charge Chart.js depuis CDN
   - Charge les fichiers CSS et JS

2. **Initialisation** (DOMContentLoaded)
   - `config.js` - Configure les paramètres
   - `data-generator.js` - Crée l'instance du générateur
   - `api-integration.js` - Crée l'instance API
   - `app.js` - Crée l'instance Dashboard
   - `advanced-features.js` - Active les features avancées

3. **Rendu Initial**
   - `Dashboard.init()` - Initialise les graphiques
   - `Dashboard.render()` - Affiche l'interface

4. **Boucle de Mise à Jour** (toutes les 5 secondes)
   - `dataGenerator.updateData()` - Met à jour les données
   - `Dashboard.updateCharts()` - Redessine les graphiques
   - `Dashboard.render()` - Recrée les sections
   - `Dashboard.updateClock()` - Met à jour l'horloge

---

## 📊 Dépendances Externes

| Dépendance | Version | Rôle |
|------------|---------|------|
| **chart.js** | 4.5.1 | Graphiques interactifs |
| **express** | 4.22.1 | Serveur web |
| **cors** | 2.8.6 | Gestion CORS |
| **axios** | 1.15.0 | Client HTTP (optionnel) |
| **vue** | 3.5.32 | Framework (optionnel) |

---

## 🔧 Modifications Courantes

### Ajouter une nouvelle métrique
1. Modifier `data-generator.js` - Ajouter la génération
2. Modifier `app.js` - Ajouter le rendu
3. Modifier `index.html` - Ajouter la section

### Ajouter une vraie source de données
1. Modifier `server.js` - Ajouter l'endpoint
2. Modifier `api-integration.js` - Ajouter la méthode
3. Basculer `useFakeData = false`

### Changer les couleurs
1. Modifier `config.js` - Palettes
2. Modifier `styles.css` - Classes CSS

### Ajouter des raccourcis clavier
1. Modifier `advanced-features.js` - Ajouter dans `initKeyboardShortcuts()`

---

## 📈 Croissance Possible

```
Phase 1 (Actuel)
├─ Dashboard statique
├─ Données fake
└─ 1 utilisateur local

Phase 2 (Améliorations)
├─ Vraies données via API
├─ Multi-utilisateurs
├─ Authentification
└─ Persistance DB

Phase 3 (Production)
├─ Docker/Kubernetes
├─ Load balancing
├─ Monitoring avancé
├─ Alertes temps réel
└─ Haute disponibilité
```

---

## 🎯 Fichiers à Connaître par Rôle

### 👨‍💻 **Développeur Frontend**
1. `index.html` - Structure
2. `styles.css` - Styling
3. `app.js` - Logique UI
4. `advanced-features.js` - Interactivité

### 🔌 **Développeur Backend**
1. `server.js` - Serveur
2. `api-integration.js` - API layer
3. `data-generator.js` - Sources de données

### 📊 **DevOps/Infra**
1. `Dockerfile` + `docker-compose.yml` - Containerization
2. `DEPLOYMENT.md` - Guide déploiement
3. `.env.example` - Configuration

### 👁️ **Utilisateur Final**
1. `QUICKSTART.md` - Pour démarrer
2. `TV_GUIDE.md` - Pour la TV
3. `README.md` - Pour comprendre

---

## 💾 Hiérarchie des Configurations

```
.env (variables sécurité)
    ↓
config.js (params globaux)
    ↓
index.html (settings HTML)
    ↓
CSS (styles.css)
    ↓
JavaScript (app.js, data-generator.js)
```

---

## 📞 Support par Fichier

| Problème | Fichier | Solution |
|----------|---------|----------|
| Design moche | `styles.css` | Modifier les couleurs/fonts |
| Données manquantes | `data-generator.js` | Ajouter des propriétés |
| API ne marche pas | `server.js` + `api-integration.js` | Déboguer les endpoints |
| Performance lente | `app.js` | Optimiser les rendus |
| Pas de raccourcis | `advanced-features.js` | Ajouter les handlers |

---

## 🚀 Pour Commencer

1. **Lire**: `QUICKSTART.md` (5 min)
2. **Explorer**: `README.md` (10 min)
3. **Installer**: `npm install` (2 min)
4. **Démarrer**: `npm start` (1 min)
5. **Accéder**: http://localhost:3000 (1 sec)

---

**Bon codage! 🎉**

