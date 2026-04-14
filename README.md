# 🖥️ Server Monitoring Dashboard

Un tableau de bord de monitoring en temps réel conçu pour afficher sur une TV les métriques de vos serveurs, bases de données et logs.

## 🎯 Caractéristiques

✅ **Interface moderne et futuriste** - Design sombre optimisé pour TV
✅ **Graphiques en temps réel** - CPU, Mémoire, Réseau, Requêtes DB
✅ **Données fakes générées** - Parfait pour les tests et démos
✅ **Responsive** - S'adapte à toutes les résolutions d'écran
✅ **Mise à jour automatique** - Rafraîchissement toutes les 5 secondes
✅ **État de santé** - Indicateurs visuels du statut des services

## 📊 Sections du Dashboard

### 1. **Serveurs** 🗄️
- État de chaque serveur (Online/Warning/Offline)
- CPU, Mémoire, Network
- Région et IP
- Uptime

### 2. **Base de Données** 💾
- Nombre de connexions actives
- Temps de réponse des requêtes
- Débit (Ops/sec)
- Ratio de Cache Hit
- Graphique en temps réel des requêtes/sec

### 3. **Performance** 📊
- Graphique CPU (24h)
- Graphique Mémoire (24h)

### 4. **Réseau** 🌐
- Trafic Inbound/Outbound
- Graphique des performances réseau

### 5. **Logs** 📝
- Logs en temps réel
- Codes couleur par type (info, warning, error, success)
- Timestamps précis

### 6. **État de Santé** ✅
- Statut global du CPU
- Statut global de la Mémoire
- Utilisation du Disque
- Performances Réseau

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 14+ 
- npm ou yarn

### Installation

```bash
cd server-dashboard
npm install
```

### Lancer le serveur

```bash
npm start
```

Le dashboard sera accessible sur: **http://localhost:3000**

### Mode développement

```bash
npm run dev
```

## 🔧 Configuration

### Port personnalisé

```bash
PORT=8080 npm start
```

### Intervalle de mise à jour

Modifiez dans `app.js`:
```javascript
this.updateInterval = 5000; // en millisecondes
```

## 📁 Structure du Projet

```
server-dashboard/
├── index.html          # Page HTML principale
├── styles.css          # Styles du dashboard
├── app.js             # Logique principale du dashboard
├── data-generator.js   # Générateur de données fake
├── server.js          # Serveur Express
└── package.json       # Dépendances
```

## 🎨 Personnalisation

### Changer les couleurs

Modifiez dans `styles.css`:
```css
--primary: #00d4ff;    /* Cyan */
--accent: #ffd700;     /* Or */
--success: #00ff00;    /* Vert */
```

### Ajouter des serveurs

Dans `data-generator.js`, modifiez le tableau `serverNames`:
```javascript
const serverNames = ['WEB-01', 'WEB-02', 'API-01', 'DB-MASTER', 'CACHE-01'];
```

## 📈 Données Générées

Toutes les données sont **100% générées aléatoirement** et mises à jour en temps réel:

- **CPU**: 10-90% avec variation naturelle
- **Mémoire**: 20-90% avec variation naturelle
- **Réseau**: 500-5500 Mbps
- **Requêtes DB**: 1000-11000 ops/sec
- **Logs**: Messages variés (info, warning, error, success)

## 🌐 Affichage TV

Pour un affichage optimal sur TV:

1. **Plein écran**: F11 ou Cmd+Ctrl+F sur Mac
2. **Résolution**: Testée jusqu'à 4K
3. **Zoom navigateur**: Réglez à 100%
4. **Rafraîchissement**: Automatique toutes les 5 secondes

## 🔄 Auto-refresh

Le dashboard se met à jour automatiquement:
- Métriques: Toutes les 5 secondes
- Horloge: Chaque seconde
- Graphiques: Glissement de fenêtre 24h

## ⚡ Performance

- Léger et rapide (~2MB total)
- Pas de dépendances lourdes
- Compatible avec tous les navigateurs modernes
- Optimisé pour les écrans de grande taille

## 📋 Logs Exemple

```
17:45:32 [INFO]    Backup completed successfully
17:44:18 [WARNING] Cache cleared
17:43:05 [SUCCESS] Database optimization started
17:42:44 [ERROR]   Connection timeout - retrying
```

## 🎯 Cas d'Usage

- ✅ Salle de monitoring
- ✅ Affichage sur TV de contrôle
- ✅ Démo pour clients
- ✅ Formation et tests
- ✅ Développement et debugging

## 📝 Notes

- Les données sont **100% fictives** et régénérées à chaque rafraîchissement
- Aucune vraie donnée de serveur n'est collectée
- Idéal pour les démos et le testing
- Facile d'intégrer avec de vraies API

## 🔗 API Endpoints (optionnels)

```
GET  /api/servers   - Retourne la liste des serveurs
GET  /api/health    - Retourne l'état de santé
GET  /api/logs      - Retourne les logs récents
```

## 📱 Responsive

Testé et optimisé pour:
- 📺 TV (1920x1080 et plus)
- 💻 Desktop
- 📱 Tablette

## 🤝 Contribution

N'hésitez pas à améliorer le dashboard!

## 📄 Licence

ISC

---

**Happy Monitoring! 🚀**

