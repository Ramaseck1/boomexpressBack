# Base Node image
FROM node:20

# Créer un répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste de l'application
COPY . .

# Exposer le port (ex: 3000)
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
