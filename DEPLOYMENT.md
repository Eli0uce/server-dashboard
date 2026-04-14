# 🚀 Guide de Déploiement

Guide complet pour déployer le Server Monitoring Dashboard en production.

## 📋 Table des matières

1. [Déploiement Local](#déploiement-local)
2. [Déploiement Docker](#déploiement-docker)
3. [Déploiement Cloud](#déploiement-cloud)
4. [Déploiement avec Reverse Proxy](#déploiement-avec-reverse-proxy)
5. [Optimisations](#optimisations)
6. [Troubleshooting](#troubleshooting)

## 🏠 Déploiement Local

### Prérequis

```bash
node --version  # v14 ou plus
npm --version   # v6 ou plus
```

### Installation

```bash
cd server-dashboard
npm install
npm start
```

Le dashboard est accessible sur `http://localhost:3000`

### Accès externe

Pour accéder depuis d'autres machines du réseau:

```bash
# Obtenir votre IP locale
ipconfig getifaddr en0  # macOS
ifconfig              # Linux
ipconfig             # Windows

# Accéder via http://<YOUR_IP>:3000
# Exemple: http://192.168.1.100:3000
```

## 🐳 Déploiement Docker

### Construire l'image

```bash
cd server-dashboard
docker build -t server-dashboard:latest .
```

### Lancer le conteneur

```bash
docker run -d \
  --name server-dashboard \
  -p 3000:3000 \
  --restart unless-stopped \
  server-dashboard:latest
```

### Avec docker-compose (recommandé)

```bash
cd server-dashboard
docker-compose up -d
```

### Vérifier le statut

```bash
docker ps | grep server-dashboard
docker-compose logs -f
```

### Arrêter le service

```bash
docker-compose down
```

### Nettoyer les données

```bash
docker-compose down -v  # Supprime aussi les volumes
```

## ☁️ Déploiement Cloud

### Heroku

```bash
# Installation de Heroku CLI
brew tap heroku/brew && brew install heroku

# Se connecter à Heroku
heroku login

# Créer une app
heroku create server-dashboard

# Configurer les variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set PORT=3000

# Déployer
git push heroku main
```

Accès: `https://server-dashboard.herokuapp.com`

### Google Cloud Run

```bash
# Configuration
gcloud config set project YOUR_PROJECT_ID

# Build et push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/server-dashboard

# Déployer
gcloud run deploy server-dashboard \
  --image gcr.io/YOUR_PROJECT_ID/server-dashboard \
  --platform managed \
  --region us-central1 \
  --port 3000
```

### AWS ECS

```bash
# Créer un ECR repository
aws ecr create-repository --repository-name server-dashboard

# Build et push
docker build -t server-dashboard:latest .
docker tag server-dashboard:latest \
  <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/server-dashboard:latest
docker push <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/server-dashboard:latest

# Créer une tâche ECS et un service
# (Via AWS Console ou CLI)
```

### DigitalOcean App Platform

```bash
# Connecter votre repo GitHub et DigitalOcean déploiera automatiquement
# https://cloud.digitalocean.com/apps
```

## 🔀 Déploiement avec Reverse Proxy

### Nginx

```nginx
# /etc/nginx/sites-available/server-dashboard
upstream dashboard {
    server localhost:3000;
}

server {
    listen 80;
    server_name monitoring.example.com;

    location / {
        proxy_pass http://dashboard;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Pour les graphiques en temps réel
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activation:

```bash
sudo ln -s /etc/nginx/sites-available/server-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Apache

```apache
# /etc/apache2/sites-available/server-dashboard.conf
<VirtualHost *:80>
    ServerName monitoring.example.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    <Proxy *>
        Order allow,deny
        Allow from all
    </Proxy>
</VirtualHost>
```

Activation:

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2ensite server-dashboard
sudo apache2ctl restart
```

### SSL/TLS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d monitoring.example.com

# Renouvellement automatique
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 🔒 SSL via Nginx + Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name monitoring.example.com;

    ssl_certificate /etc/letsencrypt/live/monitoring.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}

# Redirection HTTP -> HTTPS
server {
    listen 80;
    server_name monitoring.example.com;
    return 301 https://$server_name$request_uri;
}
```

## 📈 Optimisations

### 1. Compression Gzip

Nginx:

```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

Express (server.js):

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Mise en cache

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. Load Balancing

```nginx
upstream dashboard_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    
    least_conn;  # Algorithme de répartition
}

server {
    listen 80;
    server_name monitoring.example.com;
    
    location / {
        proxy_pass http://dashboard_backend;
    }
}
```

Lancer plusieurs instances:

```bash
PORT=3000 npm start &
PORT=3001 npm start &
PORT=3002 npm start &
```

### 4. Caching côté client

```javascript
// server.js
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600');
    next();
});
```

## 🚨 Troubleshooting

### Le port 3000 est déjà utilisé

```bash
# Tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser un autre port
PORT=8080 npm start
```

### Problèmes de CORS

```javascript
// server.js
const cors = require('cors');
app.use(cors({
    origin: ['http://localhost:3000', 'https://monitoring.example.com'],
    credentials: true
}));
```

### Connexion refused sur réseau

1. Vérifier le firewall:
```bash
sudo ufw allow 3000
```

2. Vérifier la configuration Nginx:
```bash
sudo nginx -t
```

3. Vérifier les logs:
```bash
sudo journalctl -u nginx -f
docker-compose logs -f
```

### Mémoire insuffisante

```bash
# Augmenter la limite Node.js
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

### Performances lentes

1. Activer le monitoring:
```bash
npm install clinic
clinic doctor -- npm start
```

2. Vérifier les connexions:
```bash
netstat -an | grep :3000
```

3. Augmenter les workers:
```bash
# Avec PM2
pm2 start server.js -i max
```

## 📊 Monitoring en Production

### PM2

```bash
npm install -g pm2

# Démarrer
pm2 start server.js --name "dashboard"

# Monitoring
pm2 monit

# Logs
pm2 logs dashboard

# Auto-restart
pm2 startup
pm2 save
```

### Logs avec Syslog

```javascript
const winston = require('winston');
const Syslog = require('winston-syslog').Syslog;

const logger = winston.createLogger({
    transports: [
        new Syslog({
            host: 'localhost',
            facility: 'local0',
            app_name: 'server-dashboard'
        })
    ]
});
```

### Health checks

```bash
curl http://localhost:3000/  # OK = 200
curl http://localhost:3000/api/health  # API check
```

## 🔄 Mise à Jour

### Mise à jour des dépendances

```bash
npm outdated
npm update
npm audit fix
```

### Déploiement avec zéro downtime

```bash
# Avec PM2
pm2 reload all

# Avec Docker
docker pull server-dashboard:latest
docker-compose up -d  # Récréé les conteneurs
```

## 📋 Checklist de Déploiement

- [ ] Tests en local
- [ ] Variables d'environnement configurées
- [ ] SSL/TLS activé
- [ ] Monitoring configuré
- [ ] Backups planifiés
- [ ] Alertes configurées
- [ ] Documentation mise à jour
- [ ] Accès restreint si nécessaire
- [ ] Firewall configuré
- [ ] Reverse proxy testé

---

**Déploiement réussi! 🎉**

