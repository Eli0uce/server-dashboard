# 📺 Guide d'Utilisation pour TV

Guide complet pour optimiser l'affichage du dashboard sur un écran de télévision.

## 🎬 Préparation de la TV

### 1. Vérifier la résolution

Le dashboard supporte:
- **1920x1080** (Full HD) ✓
- **2560x1440** (QHD) ✓
- **3840x2160** (4K) ✓

### 2. Préparation du Navigateur

**Chrome/Chromium (recommandé):**
```
- Appuyer sur F11 pour le plein écran
- Utiliser Chromebook ou un mini PC
- Configurer pour auto-refresh
```

**Firefox:**
```
- F11 pour le plein écran
- Configurer une fenêtre de kiosque
```

**Edge/Safari:**
```
- F11 pour le plein écran
- Assurez-vous que le zoom est à 100%
```

---

## 🖥️ Configuration TV

### Connecter l'ordinateur

1. **Câble HDMI**
   - Connecter le PC/Mac à la TV
   - Sélectionner l'entrée HDMI correcte

2. **Sans fil (miracast/airplay)**
   - Pour Mac: AirPlay
   - Pour Windows: Miracast
   - Pour Android: Chromecast

### Paramètres TV

| Paramètre | Valeur |
|-----------|--------|
| Mode image | Dynamique ou Vivant |
| Luminosité | 80-90% |
| Contraste | 85-95% |
| Couleur | Normal |
| Netteté | Normal |
| Mode Veille | OFF |
| Minuteur | OFF |

---

## 🌐 Accès au Dashboard

### Depuis un Chromebook

```
1. Ouvrir Chrome
2. Aller à http://localhost:3000
3. Appuyer sur F11
4. Placer la TV à proximité
```

### Depuis un RaspberryPi

```bash
# Installation sur RaspberryPi
cd /home/pi
git clone <votre-repo> server-dashboard
cd server-dashboard
npm install
npm start
```

Puis accéder à: `http://raspberrypi.local:3000`

### Depuis un Mini PC (Windows/Linux)

```bash
# Démarrer le dashboard
npm start

# Ouvrir le navigateur en plein écran
```

---

## 🎨 Optimisations d'Affichage

### Pour une TV 55"+ de distance 2-3m

#### Ajuster la taille de police

Modifier dans `styles.css`:

```css
.dashboard-header h1 {
    font-size: 3.5em;  /* Augmenter pour TV */
}

.dashboard-section h2 {
    font-size: 2em;    /* Plus lisible de loin */
}

.metric-value {
    font-size: 2.5em;  /* Les métriques plus grandes */
}
```

#### Ajuster l'espacement

```css
.dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
    gap: 30px;         /* Plus d'espace */
    padding: 20px;
}

.dashboard-section {
    padding: 30px;     /* Plus de padding */
}
```

### Supprimer les éléments trop petits

Modifier dans `index.html`:

```html
<!-- Cacher certaines sections sur TV -->
<section class="dashboard-section logs-section" style="display: none;">
    <!-- Les logs sont trop petits pour TV -->
</section>
```

---

## ⚙️ Configuration pour Kiosque/Affichage Permanent

### ChromeOS Kiosque Mode

```
1. Aller dans Paramètres > Gestion des appareils
2. Activer le mode kiosque
3. Ajouter: http://localhost:3000
4. L'écran verrouille et affiche le dashboard
```

### Windows Kiosk Mode

```powershell
# Créer un compte utilisateur kiosque
# Puis utiliser une app kiosque
# Ou utiliser Windows 10/11 Pro Kiosk Mode
```

### Linux Kiosk

```bash
# Fullscreen kiosk avec Firefox
firefox --kiosk http://localhost:3000 &

# Ou avec Chromium
chromium-browser --kiosk http://localhost:3000 &
```

---

## 🔄 Auto-Refresh et Auto-Start

### Redémarrage automatique après crash

#### Avec PM2 (Linux/Mac)

```bash
npm install -g pm2
pm2 start npm --name "dashboard" -- start
pm2 save
pm2 startup
```

#### Avec Cron (Linux)

```bash
# Redémarrer le serveur chaque jour à 2h du matin
0 2 * * * cd /home/user/server-dashboard && npm start > /dev/null 2>&1
```

#### Avec Task Scheduler (Windows)

1. Ouvrir Task Scheduler
2. Créer une tâche: "Dashboard"
3. Trigger: Au démarrage
4. Action: Lancer `npm start` dans le dossier

### Rechargement du navigateur

Ajouter dans `server.js`:

```javascript
// Rechargement du navigateur toutes les 24h
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="86400">
        </head>
        <body>
            <iframe src="/dashboard" style="width:100%; height:100%; border:none;"></iframe>
        </body>
        </html>
    `);
});
```

---

## 📊 Layouts Recommandés pour TV

### Pour TV 40-50"

```
┌─────────────────────────────────────┐
│    🖥️ Server Monitoring              │
├─────────────────────────────────────┤
│  🗄️ Serveurs  │  💾 Database         │
├───────────────┼───────────────────────┤
│ 📊 Performance │  🌐 Réseau            │
├───────────────┴───────────────────────┤
│      ✅ État de Santé                 │
└─────────────────────────────────────┘
```

### Pour TV 55"+ (pour salle)

```
┌──────────────────────────────────────────────┐
│     🖥️ Server Monitoring Dashboard            │
├──────────────────────────────────────────────┤
│  🗄️ Serveurs    │   💾 Database     │ 🌐 NET │
├─────────────────┼───────────────────┼────────┤
│   📊 CPU        │  📊 Memory        │ 📊 Disk│
├─────────────────┴───────────────────┴────────┤
│        ✅ État de Santé  │  📝 Logs Recent   │
└──────────────────────────────────────────────┘
```

---

## 🎛️ Contrôle à Distance

### Avec Telecommande

Pour un contrôle sans clavier visible:

```javascript
// Dans app.js, ajouter support IR Remote
document.addEventListener('keydown', (e) => {
    // Les touches IR se mappent comme des touches clavier
    // Pause (Play/Pause sur la télécommande) = P
    // Refresh (Select) = R
    // Full screen déjà géré par la TV
});
```

### Via Smartphone

Créer une API pour contrôler depuis un téléphone:

```javascript
// Dans server.js
app.post('/api/remote/pause', (req, res) => {
    // Envoyer un signal au frontend
    io.emit('pause');
    res.json({ status: 'ok' });
});
```

---

## 🔔 Alertes Visuelles

### Notifications sur anomalies

Modifier `advanced-features.js`:

```javascript
// Alerte fullscreen pour critiques
if (healthStatus.cpu === 'critical') {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 0, 0, 0.3);
        z-index: 9999;
        animation: blink 0.5s infinite;
    `;
    document.body.appendChild(alert);
}
```

---

## 🌙 Mode Nuit (Optionnel)

Pour les salles sombres:

Ajouter dans `styles.css`:

```css
/* Mode nuit - luminosité réduite */
body.night-mode {
    background: linear-gradient(135deg, #0a1415 0%, #0f1820 50%, #1a2530 100%);
}

.night-mode .dashboard-section {
    opacity: 0.85;
    background: rgba(10, 20, 21, 0.95);
}
```

Activer avec raccourci:

```javascript
// Ajouter dans advanced-features.js
document.addEventListener('keydown', (e) => {
    if (e.key === 'n' || e.key === 'N') {
        document.body.classList.toggle('night-mode');
    }
});
```

---

## 📏 Distances Recommandées

| Taille | Distance | Résolution |
|--------|----------|------------|
| 32" | 1-1.5m | 1080p |
| 42" | 1.5-2m | 1080p/QHD |
| 55" | 2-2.5m | 1080p/4K |
| 65"+ | 2.5-3m | 4K |

---

## ✅ Checklist Installation TV

- [ ] TV connectée au PC/Mac
- [ ] Résolution correcte (1080p minimum)
- [ ] Navigateur lancé en plein écran
- [ ] Dashboard accessible (http://IP:3000)
- [ ] Rafraîchissement en temps réel
- [ ] Graphiques visibles et lisibles
- [ ] Tous les indicateurs affichés
- [ ] Pas de barre de recherche/onglets visibles
- [ ] Mode kiosque activé (si permanent)
- [ ] Auto-restart configuré

---

## 🎯 Optimisations Pour 24/7

### Refroidissement

- Ventilateur pour le PC
- Passage d'air dégagé
- Écran de TV avec ventilation

### Consommation électrique

- Utiliser un multi-prise avec minuteur
- Éteindre l'écran à 22h (programmé)
- Redémarrer le PC la nuit

### Maintenance

- Nettoyer le dust filter mensuellement
- Mettre à jour le système
- Vérifier les connexions câbles
- Redémarrer le serveur 1x par semaine

---

## 🔧 Troubleshooting TV

### L'écran s'éteint

```
1. Vérifier les paramètres de veille
2. Désactiver l'économie d'énergie
3. Augmenter le timeout inactivité
```

### Les couleurs ne sont pas bonnes

```
1. Vérifier le mode image
2. Calibrer la TV (menu Image)
3. Vérifier le câble HDMI
```

### Le texte est flou

```
1. Vérifier la résolution
2. Ajuster le zoom du navigateur (100%)
3. Redémarrer le navigateur
```

### Pas de connexion

```
1. Vérifier l'IP/DNS
2. Ping http://localhost:3000
3. Vérifier le pare-feu
4. Redémarrer le routeur
```

---

## 🎬 Exemple: Salle de Monitoring 24/7

**Setup recommandé:**

1. TV 55-65" en mode kiosque
2. Mini PC (NUC) connecté via HDMI
3. Routeur avec IP statique
4. Auto-restart PM2 configuré
5. Mise à jour des données réelles
6. Alertes visuelles pour anomalies
7. Redémarrage automatique nuit 2h-3h du matin

**Coût estimé:**
- TV: 300-500€
- Mini PC: 200-400€
- Cabling: 50€
- **Total: 550-950€** pour une salle complète

---

**Bon monitoring sur votre TV! 📺✨**

