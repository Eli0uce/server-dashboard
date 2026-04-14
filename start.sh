#!/bin/bash

# Script de démarrage du Server Monitoring Dashboard

echo "🚀 Démarrage du Server Monitoring Dashboard..."
echo ""
echo "📺 Dashboard disponible sur: http://localhost:3000"
echo ""
echo "Pour ouvrir automatiquement le navigateur:"
echo "- Mac: open http://localhost:3000"
echo "- Linux: xdg-open http://localhost:3000"
echo "- Windows: start http://localhost:3000"
echo ""
echo "Pour plein écran sur TV: Appuyez sur F11"
echo ""
echo "Ctrl+C pour arrêter le serveur"
echo ""

cd "$(dirname "$0")"
npm start

