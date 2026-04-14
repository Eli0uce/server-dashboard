# 🖥️ Déploiement sur Shuttle Ubuntu 24.04 (écran TV)

Ce guide couvre l'installation complète du dashboard en mode kiosque sur un Shuttle
sous Ubuntu 24.04 branché à une télévision.

---

## 1. Prérequis sur le Shuttle

### Connexion SSH depuis ton Mac

```bash
ssh elias@<IP_DU_SHUTTLE>
```

> **Trouver l'IP du Shuttle :**
> ```bash
> # Depuis le Shuttle lui-même
> ip addr show | grep "inet " | grep -v 127.0.0.1
> # Exemple : 192.168.1.50
> ```

---

## 2. Déploiement rapide (script automatique)

Depuis ton **Mac**, copie le projet puis lance le script :

```bash
# Depuis ton Mac — copier le projet sur le Shuttle
rsync -avz --exclude node_modules \
  /Users/elias/bblogs/server-dashboard/ \
  elias@<IP_DU_SHUTTLE>:/opt/server-dashboard/

# Lancer le script de setup sur le Shuttle
ssh elias@<IP_DU_SHUTTLE> 'bash /opt/server-dashboard/deploy-ubuntu.sh'
```

---

## 3. Déploiement manuel (étape par étape)

### 3.1 Installer Node.js 20 LTS

```bash
# Sur le Shuttle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # doit afficher v20.x.x
npm  --version   # doit afficher 10.x.x
```

### 3.2 Installer PM2 (gestionnaire de processus)

```bash
sudo npm install -g pm2
```

### 3.3 Copier et préparer le projet

```bash
sudo mkdir -p /opt/server-dashboard
sudo chown $USER:$USER /opt/server-dashboard

# Copier les fichiers depuis le Mac (exécuté sur le Mac)
rsync -avz --exclude node_modules \
  /Users/elias/bblogs/server-dashboard/ \
  elias@<IP_DU_SHUTTLE>:/opt/server-dashboard/

# Sur le Shuttle
cd /opt/server-dashboard
npm install --production
```

### 3.4 Démarrer avec PM2

```bash
cd /opt/server-dashboard
pm2 start server.js --name "dashboard"
pm2 save

# Activer le démarrage automatique au boot
pm2 startup systemd -u $USER --hp $HOME
# → Copier-coller la commande sudo que PM2 affiche
```

### 3.5 Vérifier que le serveur répond

```bash
curl http://localhost:3000
# doit retourner le HTML du dashboard
```

---

## 4. Mode kiosque (affichage TV plein écran)

### 4.1 Installer Chromium et xdotool

```bash
sudo apt-get install -y chromium-browser xdotool unclutter
```

### 4.2 Désactiver le verrouillage d'écran et la mise en veille

```bash
# Via gsettings (GNOME)
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.desktop.session idle-delay 0

# Via xset (X11)
xset s off
xset -dpms
xset s noblank
```

### 4.3 Créer le script de lancement du kiosque

```bash
cat > /opt/server-dashboard/kiosk.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Attendre que le serveur soit disponible
until curl -s http://localhost:3000 > /dev/null 2>&1; do
  sleep 1
done

# Masquer le curseur après 3s d'inactivité
unclutter -idle 3 &

# Lancer Chromium en mode kiosque
chromium-browser \
  --kiosk \
  --no-first-run \
  --disable-translate \
  --disable-infobars \
  --noerrdialogs \
  --check-for-update-interval=604800 \
  --disable-features=TranslateUI \
  --overscroll-history-navigation=0 \
  "http://localhost:3000"
EOF
chmod +x /opt/server-dashboard/kiosk.sh
```

### 4.4 Lancer le kiosque au démarrage de session (GNOME Autostart)

```bash
mkdir -p ~/.config/autostart

cat > ~/.config/autostart/dashboard-kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Dashboard Kiosk
Exec=/opt/server-dashboard/kiosk.sh
X-GNOME-Autostart-enabled=true
EOF
```

---

## 5. Variables d'environnement (optionnel)

```bash
cat > /opt/server-dashboard/.env << 'EOF'
PORT=3000
NODE_ENV=production
EOF
```

Relancer PM2 pour prendre en compte :

```bash
pm2 restart dashboard
```

---

## 6. Mise à jour du dashboard

Depuis ton **Mac**, après avoir modifié les fichiers :

```bash
rsync -avz --exclude node_modules \
  /Users/elias/bblogs/server-dashboard/ \
  elias@<IP_DU_SHUTTLE>:/opt/server-dashboard/

ssh elias@<IP_DU_SHUTTLE> 'cd /opt/server-dashboard && npm install --production && pm2 restart dashboard'
```

---

## 7. Commandes utiles sur le Shuttle

```bash
# Statut du serveur
pm2 status

# Logs en temps réel
pm2 logs dashboard

# Redémarrer le serveur
pm2 restart dashboard

# Arrêter le serveur
pm2 stop dashboard

# Relancer le kiosque manuellement (si fermé)
/opt/server-dashboard/kiosk.sh
```

---

## 8. Accès depuis le réseau local

Une fois installé, n'importe quelle machine du réseau peut accéder au dashboard :

```
http://<IP_DU_SHUTTLE>:3000
```

---

## 9. Troubleshooting

### Le dashboard ne s'affiche pas au démarrage

```bash
# Vérifier que PM2 tourne
pm2 status

# Vérifier les logs
pm2 logs dashboard --lines 50

# Tester le curl local
curl http://localhost:3000
```

### Chromium ne s'ouvre pas au boot

```bash
# Vérifier que le fichier autostart est en place
cat ~/.config/autostart/dashboard-kiosk.desktop

# Tester manuellement
/opt/server-dashboard/kiosk.sh
```

### Écran qui se met en veille quand même

```bash
# Désactiver via gsettings (GNOME)
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.desktop.session idle-delay 0
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing'
```

### Port 3000 déjà utilisé

```bash
sudo lsof -i :3000
pm2 restart dashboard
```

