# 🖥️ Server Monitoring Dashboard

Dashboard de monitoring conçu pour être affiché sur une **TV branchée à un Shuttle** et piloté depuis un **téléphone** via une interface de télécommande mobile.

Le projet embarque :

- un dashboard principal : `/`
- une télécommande mobile : `/remote`
- un serveur Node.js + Express + Socket.IO
- des données de démonstration générées localement
- un mode d'accès distant possible via **Tailscale**

---

## ✅ Ce que fait le projet

- affichage plein écran sur TV
- pilotage de l'affichage depuis un téléphone
- focus par section (`Serveurs`, `Logs`, `Santé`, etc.)
- changement de thème / zoom / cadence de rafraîchissement
- remontée d'alertes vers la télécommande mobile
- exécution simple sur un Shuttle Ubuntu avec `pm2`

---

## 🗂️ Sommaire

1. [Architecture et URLs](#-architecture-et-urls)
2. [Prérequis](#-prérequis)
3. [Installation locale](#-installation-locale)
4. [Lancement local](#-lancement-local)
5. [Accès depuis le réseau local](#-accès-depuis-le-réseau-local)
6. [Installation sur Shuttle Ubuntu](#-installation-sur-shuttle-ubuntu)
7. [Démarrage propre sur le Shuttle](#-démarrage-propre-sur-le-shuttle)
8. [Accès TV et téléphone](#-accès-tv-et-téléphone)
9. [Accès hors réseau local avec Tailscale](#-accès-hors-réseau-local-avec-tailscale)
10. [Mode kiosque TV](#-mode-kiosque-tv)
11. [Mise à jour du Shuttle depuis le Mac](#-mise-à-jour-du-shuttle-depuis-le-mac)
12. [Dépannage rapide](#-dépannage-rapide)
13. [Fichiers utiles](#-fichiers-utiles)

---

## 🌐 Architecture et URLs

Une fois le serveur lancé sur le Shuttle :

- **Dashboard TV** : `http://<IP_DU_SHUTTLE>:3000/`
- **Télécommande mobile** : `http://<IP_DU_SHUTTLE>:3000/remote`
- **Socket.IO client** : `http://<IP_DU_SHUTTLE>:3000/socket.io/socket.io.js`

En local sur la machine qui héberge le projet :

- `http://localhost:3000/`
- `http://localhost:3000/remote`

> Important : pour le téléphone, **n'utilisez pas `localhost`**. Il faut utiliser l'IP du Shuttle ou une IP/VPN accessible depuis le téléphone.

---

## 📦 Prérequis

### Développement local

- Node.js 18+ recommandé
- npm

### Shuttle Ubuntu

- Ubuntu 24.04
- accès SSH
- `sudo`
- Node.js installé
- `pm2` installé

### Accès distant hors LAN

- Tailscale installé sur le Shuttle
- Tailscale installé sur le téléphone
- même compte Tailscale / même tailnet

---

## 💻 Installation locale

```bash
cd server-dashboard
npm install
```

Le projet utilise notamment :

- `express`
- `socket.io`
- `chart.js`

---

## ▶️ Lancement local

### Lancement standard

```bash
npm start
```

### Lancement équivalent en développement

```bash
npm run dev
```

### Port personnalisé

```bash
PORT=8080 npm start
```

Après démarrage, ouvrez :

```text
http://localhost:3000/
http://localhost:3000/remote
```

---

## 🏠 Accès depuis le réseau local

Si le projet tourne sur une machine du réseau, récupérez son IP locale.

### Sur Linux / Shuttle

```bash
hostname -I
```

### Sur macOS

```bash
ipconfig getifaddr en0
```

Ensuite utilisez :

```text
http://<IP_LOCALE>:3000/
http://<IP_LOCALE>:3000/remote
```

Exemple :

```text
http://192.168.88.74:3000/
http://192.168.88.74:3000/remote
```

---

## 🖥️ Installation sur Shuttle Ubuntu

### 1. Connexion SSH

Depuis le Mac :

```bash
ssh lbiret@192.168.88.74
```

### 2. Copier les fichiers sur le Shuttle

Depuis le Mac :

```bash
rsync -avz --exclude node_modules \
  /Users/elias/bblogs/server-dashboard/ \
  lbiret@192.168.88.74:/opt/server-dashboard/
```

### 3. Installer les dépendances sur le Shuttle

Depuis le Shuttle :

```bash
cd /opt/server-dashboard
npm install --omit=dev
```

---

## 🚀 Démarrage propre sur le Shuttle

Cette séquence est la base recommandée quand on veut repartir proprement.

### 1. Aller dans le dossier

```bash
cd /opt/server-dashboard
```

### 2. Installer / mettre à jour les dépendances

```bash
npm install --omit=dev
```

### 3. Lancer le dashboard avec `pm2`

```bash
pm2 delete dashboard 2>/dev/null || true
PORT=3000 pm2 start /opt/server-dashboard/server.js --name dashboard --cwd /opt/server-dashboard
pm2 save --force
```

### 4. Vérifier que le process est bien celui attendu

```bash
pm2 status
pm2 describe dashboard | sed -n '1,120p'
```

Vous devez voir :

- `script path       │ /opt/server-dashboard/server.js`
- `exec cwd          │ /opt/server-dashboard`

### 5. Vérifier les routes critiques

```bash
curl -s -o /dev/null -w "/ => %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "/remote => %{http_code}\n" http://localhost:3000/remote
curl -s -o /dev/null -w "/socket.io/socket.io.js => %{http_code}\n" http://localhost:3000/socket.io/socket.io.js
curl -s http://localhost:3000/ | grep -o 'openRemoteBtn' | head -1
```

Attendu :

- `/ => 200`
- `/remote => 200`
- `/socket.io/socket.io.js => 200`
- `openRemoteBtn`

---

## 📺 Accès TV et téléphone

### TV

Sur le Shuttle ou sur le navigateur affiché sur la TV :

```text
http://localhost:3000/
```

ou, si vous passez par l'IP locale :

```text
http://192.168.88.74:3000/
```

### Téléphone sur le même réseau local

```text
http://192.168.88.74:3000/remote
```

### Vérification côté téléphone

Une fois la télécommande ouverte :

- le badge doit afficher `1 TV` ou plus
- les boutons `Logs`, `Réseau`, `Santé`, etc. doivent modifier l'affichage TV
- les alertes critiques/warning doivent remonter sur le téléphone

### Si le téléphone n'accède pas au Shuttle

Vérifiez le firewall Ubuntu :

```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

---

## 🔐 Accès hors réseau local avec Tailscale

Si le téléphone n'est **pas sur le même réseau** que le Shuttle, utilisez Tailscale.

### 1. Installer Tailscale sur le Shuttle

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### 2. Récupérer l'IP Tailscale du Shuttle

```bash
tailscale ip -4
```

Exemple de résultat :

```text
100.x.y.z
```

### 3. Installer Tailscale sur le téléphone

- iPhone : App Store → **Tailscale**
- Android : Play Store → **Tailscale**

Connectez-vous avec le **même compte Tailscale** que celui utilisé sur le Shuttle.

### 4. URL à utiliser sur le téléphone

```text
http://100.x.y.z:3000/remote
```

ou, si MagicDNS est activé :

```text
http://sh24.tailnet-xxx.ts.net:3000/remote
```

### 5. Vérification côté téléphone

- l'application Tailscale doit être **connectée**
- le Shuttle doit apparaître **online**
- l'URL `/remote` doit s'ouvrir dans le navigateur du téléphone

---

## 📺 Mode kiosque TV

Le projet est pensé pour une TV branchée au Shuttle.

### Recommandation simple

- ouvrir Chromium sur le Shuttle
- afficher `http://localhost:3000/`
- passer en plein écran

### Lancer manuellement le kiosque

Si `kiosk.sh` est présent :

```bash
/opt/server-dashboard/kiosk.sh
```

### Fichier d'autostart GNOME

Le fichier généralement attendu est :

```text
~/.config/autostart/dashboard-kiosk.desktop
```

---

## 🔄 Mise à jour du Shuttle depuis le Mac

Le projet contient un script de mise à jour : `update-shuttle.sh`.

### Utilisation

```bash
cd /Users/elias/bblogs/server-dashboard
./update-shuttle.sh lbiret@192.168.88.74
```

### Ce que fait le script

- copie les fichiers vers `/opt/server-dashboard`
- installe les dépendances npm
- vérifie `socket.io`
- vérifie la syntaxe de `server.js`
- relance `pm2`
- teste `/`, `/remote` et `socket.io`

### Si un ancien process bloque encore le port 3000

Sur le Shuttle :

```bash
sudo ss -lptn 'sport = :3000'
sudo fuser -k 3000/tcp
```

Puis relancez :

```bash
pm2 delete dashboard 2>/dev/null || true
PORT=3000 pm2 start /opt/server-dashboard/server.js --name dashboard --cwd /opt/server-dashboard
pm2 save --force
```

---

## 🆘 Dépannage rapide

### Voir les logs du dashboard

```bash
pm2 logs dashboard --lines 50
```

### Vérifier le statut

```bash
pm2 status
```

### Vérifier quel process écoute sur 3000

```bash
sudo ss -lptn 'sport = :3000'
```

### Tuer un process qui bloque 3000

```bash
sudo fuser -k 3000/tcp
```

### Vérifier la route mobile

```bash
curl -I http://localhost:3000/remote
```

### Vérifier le client Socket.IO

```bash
curl -I http://localhost:3000/socket.io/socket.io.js
```

### Ouvrir le port 3000 dans le firewall

```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

### Si le téléphone ne se connecte pas

Vérifiez dans l'ordre :

1. la bonne URL (`http://IP:3000/remote`)
2. que le Shuttle répond sur `3000`
3. que le téléphone est sur le même réseau **ou** connecté à Tailscale
4. que `ufw` ne bloque pas le port

---

## 📡 Endpoints utiles

```text
GET /                     dashboard TV
GET /remote               télécommande mobile
GET /socket.io/socket.io.js  client Socket.IO
GET /api/servers
GET /api/health
GET /api/logs
```

---

## 📁 Fichiers utiles

- `server.js` : serveur Express + Socket.IO
- `app.js` : logique du dashboard TV
- `remote.js` : logique de la télécommande mobile
- `index.html` : dashboard principal
- `remote.html` : interface mobile
- `styles.css` : styles TV/dashboard
- `remote.css` : styles mobile
- `deploy-ubuntu.sh` : installation initiale Ubuntu/Shuttle
- `update-shuttle.sh` : mise à jour depuis le Mac
- `UBUNTU_SETUP.md` : guide Ubuntu détaillé
- `TV_GUIDE.md` : conseils d'affichage TV

---

## 📝 Notes importantes

- Les données affichées sont actuellement **générées localement** pour démonstration.
- Le téléphone ne pilote la TV que si les deux clients sont reliés au **même serveur Shuttle**.
- Hors réseau local, utilisez **Tailscale** pour accéder à `/remote` en sécurité sans exposer le Shuttle publiquement.

---

## 📄 Licence

ISC


