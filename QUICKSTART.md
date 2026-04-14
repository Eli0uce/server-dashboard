# 🚀 Démarrage Rapide

## 📱 Pour Commencer en 30 secondes

### 1️⃣ Installation

```bash
cd server-dashboard
npm install
```

### 2️⃣ Démarrage

```bash
npm start
```

### 3️⃣ Accès

Ouvrez votre navigateur:
```
http://localhost:3000
```

**Voilà! Votre dashboard est en ligne! 🎉**

---

## 🎯 Premiers Pas

### Affichage sur TV

1. Ouvrir le dashboard sur votre navigateur
2. Appuyer sur **F11** pour le plein écran
3. Placer le navigateur sur votre TV

### Explorer les Fonctionnalités

| Raccourci | Action |
|-----------|--------|
| **F11** | 📺 Plein écran |
| **P** | ⏸ Pause/Reprendre |
| **R** | 🔄 Rafraîchir immédiatement |
| **?** | 🆘 Aide |

### Console JavaScript

Appuyer sur **F12** pour ouvrir la console et tester:

```javascript
// Voir tous les serveurs
console.log(dataGenerator.servers);

// Voir la configuration
console.log(CONFIG);

// Voir l'état de santé
console.log(dataGenerator.getHealthStatus());
```

---

## 📊 Sections du Dashboard

### 🗄️ Serveurs
Affiche l'état de tous vos serveurs:
- CPU/Mémoire en temps réel
- IP et région
- Uptime
- Statut (Online/Warning/Offline)

### 💾 Base de Données
Métriques principales de votre DB:
- Nombre de connexions
- Temps de requête moyen
- Débit (ops/sec)
- Ratio Cache Hit

### 📊 Performance
Graphiques 24h:
- **Cyan** = CPU
- **Or** = Mémoire

### 🌐 Réseau
Inbound et Outbound en temps réel

### 📝 Logs
Les 8 derniers logs avec:
- Timestamps
- Types (Info, Warning, Error, Success)

### ✅ État de Santé
Indicateurs visuels:
- ✓ Sain (vert)
- ⚠ Avertissement (orange)
- ✕ Critique (rouge)

---

## 🔧 Configuration Rapide

### Changer l'intervalle de mise à jour

Dans `config.js`:

```javascript
CONFIG.updateInterval = 10000;  // 10 secondes au lieu de 5
```

### Ajouter des serveurs

Dans `data-generator.js`:

```javascript
const serverNames = [
    'WEB-01', 'WEB-02', 'API-01', 
    'DB-MASTER', 'DB-SLAVE', 'CACHE-01',
    'VOTRE-NOUVEAU-SERVEUR'  // Ajouter ici
];
```

### Changer les couleurs

Dans `styles.css`:

```css
.dashboard-header h1 {
    color: #00ff00;  /* Changer en vert */
}
```

---

## 🐳 Avec Docker

### Lancer rapidement

```bash
docker-compose up -d
```

Accédez à: `http://localhost:3000`

### Arrêter

```bash
docker-compose down
```

---

## 💻 Accès depuis d'autres machines

### 1. Obtenir votre IP locale

**macOS:**
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I
```

**Windows:**
```cmd
ipconfig
```

### 2. Accédez depuis autre machine

```
http://<VOTRE_IP>:3000
```

Exemple: `http://192.168.1.100:3000`

---

## 📈 Panel de Contrôle

En bas à gauche du dashboard, vous verrez un panel avec:

🎮 **Pause** - Arrête les mises à jour
🔄 **Refresh** - Force le rafraîchissement
📊 **Stats** - Affiche les statistiques
📥 **Export** - Télécharge les métriques en JSON

---

## 🆘 Aide & Raccourcis

Appuyez sur **?** dans le dashboard pour voir tous les raccourcis clavier.

---

## 📝 Logs en Temps Réel

Le dashboard affiche les 8 derniers logs:
- **Bleu** (info) - Informations générales
- **Orange** (warning) - Avertissements
- **Rouge** (error) - Erreurs
- **Vert** (success) - Actions réussies

---

## 🌍 Intégration Réelle

### Utiliser vos vraies données

1. Lire: **INTEGRATION_GUIDE.md**
2. Configurer vos API endpoints
3. Basculer: `apiIntegration.toggleFakeData(false)`

---

## 🚀 Prochaines Étapes

1. ✅ Exploration du dashboard
2. ✅ Configuration basique
3. ✅ Test avec données réelles (optionnel)
4. ✅ Déploiement en production
5. ✅ Affichage permanent sur TV

---

## 📞 Besoin d'aide?

- 📖 Lire **README.md** pour plus de détails
- 🔌 Lire **INTEGRATION_GUIDE.md** pour l'intégration
- 🚀 Lire **DEPLOYMENT.md** pour le déploiement
- 🐛 Ouvrir la console F12 pour déboguer

---

## 🎯 Prochaine Session?

Relancer le dashboard:

```bash
npm start

# Ou avec le script
./start.sh
```

---

**Bon monitoring! 📺✨**

