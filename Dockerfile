FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tous les fichiers
COPY . .

# Port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]

