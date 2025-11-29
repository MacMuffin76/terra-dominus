# 🚀 Guide de Déploiement Production - Terra Dominus

**Version** : 1.0.0  
**Date** : 29 novembre 2025  
**Environnement cible** : Production / Staging

---

## 📋 Prérequis

### Infrastructure Minimum

- **Serveur Node.js** : CPU 2 cores, RAM 4GB, SSD 20GB
- **PostgreSQL** : Version 12+ (recommandé 14+)
- **Redis** : Version 6+ (recommandé 7+)
- **Reverse Proxy** : Nginx ou Apache (optionnel mais recommandé)
- **DNS** : Domaine configuré avec certificat SSL

### Logiciels Requis

```bash
Node.js: v18.x ou v20.x LTS
PostgreSQL: 12+
Redis: 6+
PM2: Latest (gestionnaire de processus)
Git: 2.x+
```

---

## 🔧 Configuration Pré-déploiement

### 1. Variables d'Environnement Backend

Créer `/backend/.env` avec :

```env
# === APPLICATION ===
NODE_ENV=production
PORT=5000
TRUST_PROXY=1

# === BASE DE DONNÉES ===
DB_HOST=localhost
DB_PORT=5432
DB_NAME=terra_dominus_prod
DB_USER=terra_admin
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE_ICI
DB_DIALECT=postgres
DB_LOGGING=false

# === JWT / SÉCURITÉ ===
JWT_SECRET=GENERER_UNE_CLE_ALEATOIRE_64_CHARS_ICI
ACCESS_TOKEN_TTL=2h
REFRESH_TOKEN_TTL_MS=604800000  # 7 jours

# === REDIS ===
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX=100

# === CORS ===
CORS_ORIGIN=https://votre-domaine.com
CORS_CREDENTIALS=true

# === LOGS ===
LOG_LEVEL=info
LOG_DIR=./logs

# === WORKERS (BullMQ) ===
WORKER_CONCURRENCY=5
```

**⚠️ IMPORTANT** : Générer des secrets forts :

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# REDIS_PASSWORD
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Variables d'Environnement Frontend

Créer `/frontend/.env.production` :

```env
REACT_APP_API_URL=https://api.votre-domaine.com/api/v1
REACT_APP_WS_URL=https://api.votre-domaine.com
REACT_APP_ENV=production
```

### 3. Configuration PostgreSQL

```sql
-- Créer l'utilisateur et la base
CREATE USER terra_admin WITH PASSWORD 'VOTRE_MOT_DE_PASSE';
CREATE DATABASE terra_dominus_prod OWNER terra_admin;

-- Connexion à la base
\c terra_dominus_prod

-- Appliquer le schéma initial
\i /chemin/vers/init_terra_dominus.sql

-- Vérifier les tables
\dt
```

### 4. Configuration Redis

Éditer `/etc/redis/redis.conf` :

```conf
# Activer la persistance
appendonly yes
appendfsync everysec

# Sécurité
requirepass VOTRE_MOT_DE_PASSE_REDIS
bind 127.0.0.1

# Performance
maxmemory 512mb
maxmemory-policy allkeys-lru
```

Redémarrer Redis :

```bash
sudo systemctl restart redis
sudo systemctl enable redis
```

---

## 📦 Déploiement Backend

### Étape 1 : Cloner et Installer

```bash
# Cloner le repository
cd /var/www
git clone https://github.com/MacMuffin76/terra-dominus.git
cd terra-dominus/backend

# Installer les dépendances PRODUCTION uniquement
npm ci --only=production

# Copier le fichier .env
cp .env.example .env
# Éditer .env avec vos valeurs de production
nano .env
```

### Étape 2 : Migrations Base de Données

```bash
# Appliquer toutes les migrations
npm run migrate

# Initialiser la carte du monde (si première installation)
npm run init-world

# Vérifier l'état des migrations
npx sequelize-cli db:migrate:status
```

### Étape 3 : Tests Pre-Production

```bash
# Tester la connexion à la base de données
node -e "const db = require('./db'); db.authenticate().then(() => console.log('✅ DB OK')).catch(e => console.error('❌ DB Error:', e))"

# Tester la connexion Redis
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(() => console.log('✅ Redis OK')).catch(e => console.error('❌ Redis Error:', e))"

# Test de syntaxe complet
node -e "const app = require('./app'); const container = require('./container'); const c = container(); console.log('✅ App loads successfully')"
```

### Étape 4 : Configuration PM2

Créer `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [
    {
      name: 'terra-backend',
      script: './server.js',
      cwd: '/var/www/terra-dominus/backend',
      instances: 2,  // Mode cluster (2x CPU)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false
    },
    {
      name: 'terra-workers',
      script: './jobs/startWorkers.js',
      cwd: '/var/www/terra-dominus/backend',
      instances: 1,  // Un seul worker
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/workers-error.log',
      out_file: './logs/workers-out.log',
      autorestart: true,
      max_memory_restart: '512M'
    }
  ]
};
```

Démarrer avec PM2 :

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer les services
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status
pm2 logs

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

---

## 🎨 Déploiement Frontend

### Étape 1 : Build Production

```bash
cd /var/www/terra-dominus/frontend

# Installer les dépendances
npm ci --only=production

# Build optimisé
npm run build

# Le dossier build/ contient les fichiers statiques
ls -lh build/
```

### Étape 2 : Configuration Nginx

Créer `/etc/nginx/sites-available/terra-dominus` :

```nginx
# Backend API
upstream terra_backend {
    server localhost:5000;
    keepalive 64;
}

# Frontend
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Certificats SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Frontend statique
    root /var/www/terra-dominus/frontend/build;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/terra-access.log;
    error_log /var/log/nginx/terra-error.log;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache statique
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://terra_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://terra_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Swagger UI
    location /api-docs {
        proxy_pass http://terra_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # React Router (toutes les routes vers index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Activer et redémarrer Nginx :

```bash
# Tester la configuration
sudo nginx -t

# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/terra-dominus /etc/nginx/sites-enabled/

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Étape 3 : Certificat SSL (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

---

## 🔍 Vérification Post-Déploiement

### Checklist Complète

```bash
# ✅ Backend accessible
curl -I https://api.votre-domaine.com/health

# ✅ Frontend charge
curl -I https://votre-domaine.com

# ✅ API fonctionne
curl https://api.votre-domaine.com/api/v1/health

# ✅ Swagger accessible
curl -I https://api.votre-domaine.com/api-docs

# ✅ WebSocket connecte
# Tester depuis le frontend dans le navigateur

# ✅ Redis fonctionne
redis-cli -a VOTRE_MOT_DE_PASSE ping

# ✅ PostgreSQL accessible
psql -h localhost -U terra_admin -d terra_dominus_prod -c "SELECT COUNT(*) FROM users;"

# ✅ PM2 processus actifs
pm2 status

# ✅ Logs sans erreur critique
pm2 logs --lines 50
tail -f /var/log/nginx/terra-error.log
```

### Tests Fonctionnels

1. **Inscription** : Créer un compte
2. **Login** : Se connecter
3. **Dashboard** : Accéder au tableau de bord
4. **Logout** : Se déconnecter
5. **Token révoqué** : Vérifier que le token ne fonctionne plus

---

## 📊 Monitoring & Alertes

### Prometheus (Métriques)

Le backend expose `/metrics` :

```bash
# Vérifier les métriques
curl https://api.votre-domaine.com/metrics
```

Configuration Prometheus (`prometheus.yml`) :

```yaml
scrape_configs:
  - job_name: 'terra-backend'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:5000']
```

### Grafana (Dashboards)

Importer les dashboards recommandés :
- **Node.js Application** : Dashboard ID 11159
- **Redis** : Dashboard ID 763
- **PostgreSQL** : Dashboard ID 9628

### Alerting (exemple avec PM2)

```bash
# Installer pm2-logrotate
pm2 install pm2-logrotate

# Configurer les alertes email
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🛡️ Sécurité Production

### Firewall (UFW)

```bash
# Autoriser SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquer l'accès direct au backend (seulement via Nginx)
sudo ufw deny 5000/tcp

# Activer le firewall
sudo ufw enable
```

### Fail2Ban (Protection brute-force)

```bash
# Installer Fail2Ban
sudo apt install fail2ban

# Créer /etc/fail2ban/jail.local
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/terra-error.log
findtime = 600
bantime = 7200
maxretry = 10
```

### Sauvegarde Automatique

Script `/usr/local/bin/backup-terra.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/terra-dominus

# Base de données
pg_dump -U terra_admin terra_dominus_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Fichiers applicatifs
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/terra-dominus

# Nettoyer les backups > 7 jours
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

Cron job :

```bash
# Backup quotidien à 3h du matin
0 3 * * * /usr/local/bin/backup-terra.sh >> /var/log/terra-backup.log 2>&1
```

---

## 🔄 Mises à Jour (Zero-Downtime)

```bash
# 1. Récupérer la nouvelle version
cd /var/www/terra-dominus
git pull origin main

# 2. Backend - Mise à jour
cd backend
npm ci --only=production
npm run migrate  # Appliquer migrations

# 3. Redémarrage progressif (zero-downtime)
pm2 reload terra-backend
pm2 restart terra-workers

# 4. Frontend - Rebuild
cd ../frontend
npm ci --only=production
npm run build

# 5. Vérifier
pm2 status
curl -I https://votre-domaine.com
```

---

## 📞 Troubleshooting

### Backend ne démarre pas

```bash
# Vérifier les logs
pm2 logs terra-backend --lines 100

# Variables d'environnement chargées ?
pm2 env terra-backend

# Test manuel
cd /var/www/terra-dominus/backend
node server.js
```

### Erreurs Base de Données

```bash
# Connexion PostgreSQL
psql -h localhost -U terra_admin -d terra_dominus_prod

# Vérifier les migrations
npx sequelize-cli db:migrate:status

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Rate Limiting trop agressif

Ajuster dans `.env` :

```env
RATE_LIMIT_MAX=200  # Augmenter la limite
RATE_LIMIT_WINDOW_MS=900000
```

### Redis erreurs de connexion

```bash
# Redis actif ?
sudo systemctl status redis

# Test connexion
redis-cli -a VOTRE_MOT_DE_PASSE ping

# Logs Redis
sudo tail -f /var/log/redis/redis-server.log
```

---

## 📚 Ressources

- **Documentation API** : https://votre-domaine.com/api-docs
- **Repo GitHub** : https://github.com/MacMuffin76/terra-dominus
- **PM2 Docs** : https://pm2.keymetrics.io/docs/
- **Nginx Docs** : https://nginx.org/en/docs/

---

## ✅ Checklist Finale

- [ ] PostgreSQL configuré et migrations appliquées
- [ ] Redis sécurisé avec mot de passe
- [ ] Variables .env définies (secrets forts)
- [ ] Backend démarré avec PM2 (mode cluster)
- [ ] Workers BullMQ actifs
- [ ] Frontend buildé et servi par Nginx
- [ ] Certificat SSL actif (HTTPS)
- [ ] Firewall configuré
- [ ] Monitoring Prometheus/Grafana
- [ ] Backups automatiques configurés
- [ ] Tests post-déploiement passés
- [ ] Documentation accessible (/api-docs)

---

**Déploiement réussi ! Terra Dominus est en production.** 🚀

*Pour tout problème, consultez les logs PM2 et Nginx, ou créez une issue sur GitHub.*
