# 🗺️ Roadmap d'évolutions — `server-dashboard`

Ce document formalise les évolutions proposées pour faire passer `server-dashboard` d'un dashboard TV pilotable à un **poste de supervision léger, fiable et exploitable**.

---

## 🎯 Vision produit

L'objectif est de faire évoluer le projet vers une solution capable de :

- afficher une vue claire et lisible sur une TV reliée à un Shuttle
- être pilotée depuis un téléphone via `/remote`
- remonter des alertes utiles et actionnables
- fonctionner en local, sur réseau privé, et à distance via VPN
- s'alimenter en vraies données de supervision
- être simple à maintenir et à redéployer

---

## ✅ État actuel

Le projet dispose déjà de briques solides :

- dashboard TV sur `/`
- télécommande mobile sur `/remote`
- synchronisation en temps réel via `Socket.IO`
- support d'accès LAN
- usage possible via `Tailscale`
- déploiement sur Shuttle avec `pm2`
- mode kiosque TV

---

## 1. Quick wins — priorité immédiate

Ces évolutions apportent beaucoup de valeur rapidement sans refonte lourde.

### 1.1 Remote mobile plus fiable
**Priorité : Haute**

#### Objectif
Améliorer l'interface mobile pour en faire une vraie télécommande d'exploitation.

#### Évolutions
- bouton **retour vue par défaut**
- bouton **reconnecter**
- état plus clair :
  - TV connectée / non connectée
  - dernière synchro
  - dernière alerte reçue
- affichage de l'URL ou IP active
- mode portrait/paysage optimisé
- verrouillage des actions sensibles

#### Impact
- meilleure robustesse en usage réel
- moins d'ambiguïté pour l'utilisateur mobile
- réduction des erreurs de manipulation

---

### 1.2 TV plus lisible à distance
**Priorité : Haute**

#### Objectif
Rendre le dashboard plus lisible dans un contexte salle / écran mural.

#### Évolutions
- mode **ultra-lisible**
- tailles de police plus grandes
- cartes plus espacées
- vue simplifiée pour distance de lecture 2–4 m
- bandeau d'alerte haute visibilité
- rotation automatique des vues

#### Impact
- meilleure lisibilité opérationnelle
- usage plus crédible en supervision continue

---

### 1.3 Alertes mobiles plus utiles
**Priorité : Haute**

#### Objectif
Transformer les alertes en outil de suivi concret.

#### Évolutions
- différencier `warning`, `critical`, `healthy`
- historique local des alertes
- notification “retour à la normale”
- accusé de réception depuis le téléphone
- meilleure vibration / notification navigateur
- cooldown configurable

#### Impact
- meilleure réactivité
- suivi plus propre des incidents

---

### 1.4 Script de diagnostic d'exploitation
**Priorité : Haute**

#### Objectif
Avoir une commande simple pour diagnostiquer rapidement le Shuttle.

#### Évolutions
Créer un script `doctor.sh` qui vérifie :
- process `pm2`
- port `3000`
- routes `/`, `/remote`, `/socket.io/socket.io.js`
- IP LAN
- IP Tailscale
- statut kiosque
- logs récents

#### Impact
- gain énorme en exploitation
- réduction du temps de debug

---

## 2. Moyen terme — valeur produit réelle

### 2.1 Brancher de vraies données
**Priorité : Très haute**

#### Objectif
Sortir du mode démonstration et alimenter le dashboard avec des données utiles.

#### Évolutions
- mode `fake`
- mode `hybrid`
- mode `live`
- connecteurs vers :
  - Prometheus
  - Grafana API
  - Zabbix
  - Centreon
  - Datadog
  - API internes
  - healthchecks applicatifs

#### Impact
- passage d'une démo à un outil réellement exploitable
- alignement avec des usages métiers / ops

---

### 2.2 Seuils et profils de supervision configurables
**Priorité : Haute**

#### Objectif
Adapter le comportement du dashboard selon le contexte.

#### Évolutions
- seuils d'alerte configurables
- profils de supervision :
  - Ops
  - Réseau
  - DB
  - Direction
- thèmes / cadence / sections par profil

#### Impact
- plus grande flexibilité
- meilleure adaptation au public cible

---

### 2.3 Historique et timeline d'événements
**Priorité : Moyenne à haute**

#### Objectif
Ajouter une mémoire du système au-delà de l'instantané.

#### Évolutions
- timeline des alertes
- dernière action opérateur
- incidents récents
- retour à la normale
- journal local minimal

#### Impact
- meilleur suivi d'incident
- meilleure compréhension des événements

---

### 2.4 Sécurisation de `/remote`
**Priorité : Très haute**

#### Objectif
Empêcher qu'un accès non autorisé pilote l'écran.

#### Évolutions
- auth simple sur `/remote`
- token de session
- pairing code affiché sur la TV
- rôles `viewer` / `controller`
- restriction LAN / Tailscale

#### Impact
- réduction du risque de prise de contrôle non désirée
- base pour une utilisation plus professionnelle

---

## 3. Long terme — industrialisation

### 3.1 Multi-TV / multi-site
**Priorité : Moyenne**

#### Objectif
Piloter plusieurs écrans ou plusieurs sites depuis une même logique.

#### Évolutions
- `screenId`
- `siteId`
- remote ciblée
- rooms `Socket.IO` par écran
- profils d'affichage par site

#### Impact
- usage scalable
- ouverture vers une architecture multi-écrans

---

### 3.2 Reverse proxy + accès sécurisé public
**Priorité : Moyenne**

#### Objectif
Permettre un accès externe plus robuste qu'un simple LAN.

#### Évolutions
- `nginx` ou `caddy`
- HTTPS
- auth basique ou renforcée
- logs d'accès
- limitation IP selon le contexte

#### Impact
- accès distant plus structuré
- meilleure sécurité si le projet s'ouvre hors LAN

> À court terme, `Tailscale` reste la solution recommandée.

---

### 3.3 Qualité, tests et pipeline de déploiement
**Priorité : Moyenne**

#### Objectif
Stabiliser le projet à mesure qu'il grossit.

#### Évolutions
- `ESLint`
- `Prettier`
- smoke tests HTTP
- tests de flux `remote -> TV`
- pipeline de déploiement
- validation automatique avant mise à jour Shuttle

#### Impact
- meilleure maintenabilité
- réduction des régressions

---

## 4. Sécurité et exploitation

## 4.1 Accès réseau
**Priorité : Haute**

### Recommandation
- accès LAN local pour usage interne
- accès hors LAN via **Tailscale**
- éviter l'exposition publique brute du port `3000`

---

### 4.2 Journalisation minimale
**Priorité : Haute**

#### À tracer
- connexion d'une TV
- connexion d'une remote
- action envoyée depuis la remote
- alerte émise
- changement de thème ou de focus

#### Impact
- aide au diagnostic
- base pour audit léger

---

## 5. Roadmap priorisée

## Sprint 1 — robustesse d'usage

### Contenu
- sécuriser `/remote`
- améliorer la remote mobile
- améliorer les alertes
- ajouter `doctor.sh`
- journaliser les actions principales

### Résultat attendu
Un produit plus fiable et exploitable au quotidien.

---

## Sprint 2 — passage à l'usage réel

### Contenu
- brancher de vraies données
- ajouter les seuils configurables
- créer les profils d'affichage
- ajouter historique / timeline d'alertes

### Résultat attendu
Passage du mode démo à un vrai dashboard de supervision.

---

## Sprint 3 — industrialisation

### Contenu
- multi-TV / multi-site
- pipeline de déploiement
- tests automatiques
- reverse proxy / auth avancée

### Résultat attendu
Produit plus scalable et plus propre à exploiter dans la durée.

---

## 6. Top 5 des prochaines évolutions recommandées

Si l'on doit choisir seulement 5 évolutions à lancer en premier :

1. **authentification de `/remote`**
2. **historique + alertes mobiles améliorées**
3. **mode ultra-lisible TV**
4. **intégration de vraies données**
5. **script `doctor.sh` de diagnostic**

---

## 7. Proposition de prochain plan concret

### Option A — rendre le projet exploitable vite
- auth `/remote`
- alertes plus propres
- doctor script
- logs d'actions

### Option B — rendre le projet utile métier
- vraies données
- seuils configurables
- presets / scénarios

### Option C — rendre le projet scalable
- multi-TV
- multi-site
- télécommande ciblée

---

## 8. Fichiers les plus concernés par les prochaines évolutions

- `server.js`
- `app.js`
- `remote.js`
- `index.html`
- `remote.html`
- `styles.css`
- `remote.css`
- `config.js`
- `api-integration.js`
- `README.md`
-
---

## 9. Conclusion

Le projet a déjà une bonne base technique. La suite logique n'est pas de le complexifier au hasard, mais de le faire progresser dans cet ordre :

1. **fiabilité d'usage**
2. **sécurité d'accès**
3. **intégration de vraies données**
4. **industrialisation**

C'est ce chemin qui donnera le plus de valeur avec le moins de dette inutile.

