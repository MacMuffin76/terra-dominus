# Mise à jour du VPS

## 1. Se connecter au VPS et aller dans le dossier du projet
```bash
cd /path/to/terra-dominus
```

## 2. Arrêter les services en cours
```bash
pm2 stop all
# ou si vous utilisez des processus Node directement :
pkill -f node
```

## 3. Récupérer les dernières modifications depuis GitHub
```bash
git pull origin main
```

## 4. Mettre à jour les dépendances (si nécessaire)
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ..
```

## 5. Ajouter la variable d'environnement pour les mises à jour toutes les secondes
```bash
# Éditer le fichier .env du backend
nano backend/.env
# ou
vi backend/.env
```

Ajoutez cette ligne dans le fichier `.env` :
```
PRODUCTION_TICK_MS=1000
```

## 6. Rebuild le frontend (production)
```bash
cd frontend
npm run build
cd ..
```

## 7. Redémarrer les services
```bash
# Si vous utilisez PM2 :
pm2 restart all

# Ou redémarrez manuellement votre backend :
cd backend
NODE_ENV=production npm start &
```

## 8. Vérifier que tout fonctionne
```bash
pm2 logs
# ou
pm2 status
```

## Note importante
Assurez-vous que votre fichier `backend/.env` sur le VPS contient bien :
- `PRODUCTION_TICK_MS=1000` (nouvellement ajouté)
- Toutes vos autres variables d'environnement existantes (DB, JWT_SECRET, etc.)
