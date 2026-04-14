#!/usr/bin/env bash

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                                                                          ║
# ║        🖥️  SERVER MONITORING DASHBOARD - GUIDE COMPLET                  ║
# ║                                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝

echo "
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║      🖥️  SERVER MONITORING DASHBOARD                                       ║
║                                                                            ║
║      ✓ Dashboard web modern pour monitoring 24/7 sur TV                   ║
║      ✓ Graphiques en temps réel (CPU, Mémoire, Réseau, DB)               ║
║      ✓ Données fakes générées automatiquement                             ║
║      ✓ Intégration facile avec vraies données                             ║
║      ✓ Déploiement simple (Docker/Cloud)                                  ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📁 STRUCTURE DU PROJET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server-dashboard/
├── 🖥️  Interface (Frontend)
│   ├── index.html              Page HTML
│   ├── styles.css              Design moderne dark-theme
│   ├── app.js                  Logique du dashboard
│   ├── data-generator.js       Génération données fake
│   └── advanced-features.js    Raccourcis & fonctionnalités
│
├── 🔧 Serveur (Backend)
│   ├── server.js               Serveur Express
│   └── api-integration.js      Couche API
│
├── ⚙️  Configuration
│   ├── package.json            Dépendances
│   ├── config.js               Configuration globale
│   ├── .env.example            Variables d'environnement
│   ├── Dockerfile              Image Docker
│   └── docker-compose.yml      Orchestration Docker
│
└── 📚 Documentation
    ├── README.md               Documentation principale
    ├── QUICKSTART.md           Démarrage rapide
    ├── INTEGRATION_GUIDE.md     Intégration vraies données
    ├── DEPLOYMENT.md           Déploiement production
    ├── TV_GUIDE.md            Affichage sur TV
    └── FILES_INDEX.md         Index des fichiers

🚀 DÉMARRAGE RAPIDE (30 sec)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Installation
    $ cd server-dashboard
    $ npm install

2️⃣  Démarrage
    $ npm start

    Ou avec le script:
    $ ./start.sh

3️⃣  Accès
    Ouvrir: http://localhost:3000

✅ BOOM! Votre dashboard est en ligne!

📊 SECTIONS DU DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗄️  Serveurs                   Statut de vos 6 serveurs
💾 Base de Données             Connexions, requêtes, cache hit
📊 Performance                 Graphiques CPU/Mémoire 24h
🌐 Réseau                      Trafic inbound/outbound
📝 Logs Récents                Les 8 derniers logs
✅ État de Santé               Indicateurs visuels globaux

🎮 RACCOURCIS CLAVIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F11                Plein écran (parfait pour TV)
P                  Pause/Reprendre les mises à jour
R                  Rafraîchir immédiatement
Ctrl+D             Mode debug (logs console)
Ctrl+T             Test des données
?                  Afficher l'aide complète
Ctrl+E             Exporter les métriques (JSON)
Ctrl+S             Prendre une capture d'écran

⚡ PERFORMANCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Léger: ~2MB total
✓ Rapide: 60fps animations
✓ Responsive: Mobile → 4K
✓ Moderne: Dark theme optimisé
✓ Compatible: Tous les navigateurs récents

🔌 INTÉGRATION VRAIES DONNÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Le dashboard peut se connecter à:

✓ Prometheus                  Métriques système
✓ Grafana                     Dashboards
✓ Elasticsearch               Logs en temps réel
✓ MySQL/PostgreSQL            Stats base de données
✓ N'importe quelle API REST   Vos propres données

Guide complet: INTEGRATION_GUIDE.md

🐳 DOCKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lancer avec Docker Compose:

    $ docker-compose up -d

Accès: http://localhost:3000

Arrêter:

    $ docker-compose down

☁️  DÉPLOIEMENT CLOUD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Déployable sur:
  ✓ Heroku
  ✓ Google Cloud Run
  ✓ AWS ECS
  ✓ DigitalOcean
  ✓ N'importe quel serveur Linux

Guide: DEPLOYMENT.md

📺 AFFICHAGE TV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Affichage optimal sur TV:

1. Ouvrir http://IP:3000 sur le navigateur
2. Appuyer F11 pour le plein écran
3. Placer la TV en face
4. Configurer le mode kiosque pour 24/7

Guide complet: TV_GUIDE.md

💻 MODES DE DÉPLOIEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Local
    $ npm start
    → http://localhost:3000

Docker
    $ docker-compose up -d
    → http://localhost:3000

Avec PM2 (production)
    $ pm2 start server.js
    $ pm2 startup
    → Auto-restart après reboot

Nginx Reverse Proxy
    → Accès via https://monitoring.example.com

📋 DONNÉES GÉNÉRÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Le dashboard génère des données réalistes:

  📈 CPU           10-90% avec variation naturelle
  📈 Mémoire       20-90% avec variation naturelle
  📈 Réseau        500-5500 Mbps
  📈 Requêtes DB   1000-11000 ops/sec
  📝 Logs          Messages variés (info/warning/error/success)
  ⏱️  Uptime        Simulée pour chaque serveur
  🌍 Géolocalisation Régions variées (US/EU/AP)

🔐 SÉCURITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommandations:

✓ Mettre .env en privé (secrets)
✓ Utiliser HTTPS en production
✓ Activer l'authentification JWT
✓ Limiter l'accès par IP
✓ Configurer CORS correctement
✓ Utiliser des variables d'environnement
✓ Mettre à jour les dépendances régulièrement

ℹ️  FICHIERS IMPORTANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pour COMMENCER:          → QUICKSTART.md
Pour COMPRENDRE:         → README.md
Pour INTÉGRER:           → INTEGRATION_GUIDE.md
Pour DÉPLOYER:           → DEPLOYMENT.md
Pour TV:                 → TV_GUIDE.md
Pour STRUCTURE:          → FILES_INDEX.md

🎯 PROCHAINES ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Démarrer le dashboard
    $ npm start

2️⃣  Explorer l'interface
    Appuyer sur ? pour voir les raccourcis

3️⃣  Tester les données
    Appuyer sur Ctrl+T pour voir les métriques en console

4️⃣  Personnaliser (optionnel)
    Modifier config.js pour ajuster les paramètres

5️⃣  Intégrer vraies données (optionnel)
    Suivre INTEGRATION_GUIDE.md

6️⃣  Déployer en production (si besoin)
    Suivre DEPLOYMENT.md

🆘 AIDE & SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Le port 3000 est déjà utilisé?
    $ PORT=8080 npm start

Problème de npm?
    $ rm -rf node_modules package-lock.json
    $ npm install

Voir les logs?
    $ npm start          (les logs s'affichent)
    $ docker-compose logs -f  (si Docker)

Besoin de reset complet?
    $ npm run clean      (à ajouter dans package.json)

💡 ASTUCES UTILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Utiliser Ctrl+P dans VS Code pour accéder rapidement aux fichiers
✓ Chercher 'TODO' dans le code pour les points à améliorer
✓ Les données se mettent à jour automatiquement toutes les 5 secondes
✓ Le panel de contrôle (bas gauche) peut être fermé et réouvert
✓ L'export JSON permet de sauvegarder les métriques
✓ Le mode debug (Ctrl+D) active les logs console

🎁 BONUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Animations fluides
✨ Graphiques interactifs
✨ Notifications en temps réel
✨ Panel de contrôle intégré
✨ Export de métriques
✨ Mode responsive
✨ Dark theme optimisé pour TV
✨ Données générées réalistes
✨ 100% sans backend requis (mode demo)

═══════════════════════════════════════════════════════════════════════════════

👉 Commencez maintenant: $ npm start
👉 Accédez à: http://localhost:3000
👉 Appuyez sur ?: Aide complète

Bon monitoring! 📺✨

═══════════════════════════════════════════════════════════════════════════════
" | cat

