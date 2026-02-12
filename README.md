# OpenClaw Bookmark Manager Backend

Een moderne RESTful API backend voor OpenClaw, een bookmark manager applicatie. Deze backend biedt een krachtig systeem voor het beheren van bookmarks met mappen en tags.

## ✨ Features

- 📚 Volledige bookmark management (CRUD)
- 📁 Hiërarchische mappen structuur
- 🏷️ Tagsysteem voor categorisering
- ⭐ Favorieten functionaliteit
- 🔍 Geavanceerd zoeken en filteren
- 📊 Bezoek tracking statistieken
- 🌲 Folder tree structuur endpoint
- 💾 SQLite database (geen setup nodig)
- 🚀 Snelle en efficiënte API

## 🛠️ Technologie Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite** - Database (via better-sqlite3)
- **CORS** - Cross-origin resource sharing

## 📦 Installatie

### Vereisten

- Node.js (v18 of hoger)
- npm of pnpm

### Stappen

1. Clone of download dit project naar `c:\Users\marc\Downloads\VScode`

2. Installeer dependencies:
   ```bash
   npm install
   ```
   
   *Als je een PowerShell script error krijgt, gebruik dan:*
   ```bash
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   npm install
   ```

3. Start de server:
   ```bash
   npm start
   ```
   
   Of voor development met auto-reload:
   ```bash
   npm run dev
   ```

4. De server draait op `http://localhost:3000`

## 📚 API Endpoints

### Bookmarks

| Methode | Endpoint | Beschrijving |
|---------|----------|-------------|
| GET | `/api/bookmarks` | Haal alle bookmarks op (met filters) |
| GET | `/api/bookmarks/:id` | Haal een specifieke bookmark op |
| POST | `/api/bookmarks` | Maak een nieuwe bookmark |
| PUT | `/api/bookmarks/:id` | Update een bookmark |
| DELETE | `/api/bookmarks/:id` | Verwijder een bookmark |
| POST | `/api/bookmarks/:id/visit` | Registreer een bezoek |

**Query Parameters voor GET `/api/bookmarks`:**
- `folder_id` - Filter op folder ID
- `is_favorite` - Toon alleen favorieten (true/false)
- `search` - Zoek in titel, beschrijving en URL
- `tags` - Filter op tags (komma gescheiden)

### Folders

| Methode | Endpoint | Beschrijving |
|---------|----------|-------------|
| GET | `/api/folders` | Haal alle folders op |
| GET | `/api/folders/tree` | Haal folder hiërarchie op |
| GET | `/api/folders/:id` | Haal folder met bookmarks op |
| POST | `/api/folders` | Maak een nieuwe folder |
| PUT | `/api/folders/:id` | Update een folder |
| DELETE | `/api/folders/:id` | Verwijder een folder |

### Tags

| Methode | Endpoint | Beschrijving |
|---------|----------|-------------|
| GET | `/api/tags` | Haal alle tags op |
| GET | `/api/tags/popular` | Haal populaire tags op |
| GET | `/api/tags/:id` | Haal tag met bookmarks op |
| POST | `/api/tags` | Maak een nieuwe tag |
| PUT | `/api/tags/:id` | Update een tag |
| DELETE | `/api/tags/:id` | Verwijder een tag |

## 💡 Gebruik Voorbeelden

### Een bookmark maken

```bash
curl -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "OpenClaw",
    "url": "https://openclaw.io",
    "description": "Mijn bookmark manager",
    "tags": ["productivity", "tools"]
  }'
```

### Bookmarks zoeken

```bash
curl "http://localhost:3000/api/bookmarks?search=productivity"
```

### Een folder maken

```bash
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development",
    "description": "Dev resources"
  }'
```

### Favorieten ophalen

```bash
curl "http://localhost:3000/api/bookmarks?is_favorite=true"
```

## 📁 Project Structuur

```
openclaw-backend/
├── src/
│   ├── controllers/
│   │   ├── bookmarkController.js
│   │   ├── folderController.js
│   │   └── tagController.js
│   ├── routes/
│   │   ├── bookmarkRoutes.js
│   │   ├── folderRoutes.js
│   │   └── tagRoutes.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── database/
│   │   └── db.js
│   └── server.js
├── data/
│   └── bookmarks.db (wordt automatisch aangemaakt)
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Bookmarks
- `id` - Primary key
- `title` - Bookmark titel
- `url` - Bookmark URL
- `description` - Optionele beschrijving
- `folder_id` - Foreign key naar folders
- `favicon_url` - Favicon URL
- `is_favorite` - Favoriet status
- `visit_count` - Aantal bezoeken
- `last_visited` - Laatste bezoek datum
- `created_at`, `updated_at` - Timestamps

### Folders
- `id` - Primary key
- `name` - Folder naam
- `description` - Optionele beschrijving
- `parent_id` - Foreign key naar parent folder
- `created_at`, `updated_at` - Timestamps

### Tags
- `id` - Primary key
- `name` - Unieke tag naam
- `color` - Hex kleur code
- `created_at` - Aanmaak datum

### Bookmark_Tags (Junction Table)
- `bookmark_id` - Foreign key naar bookmarks
- `tag_id` - Foreign key naar tags

## 🧪 Testing

Je kunt de API testen met:
- Postman / Insomnia
- `curl` commando's
- Browser (voor GET requests)
- Of een frontend applicatie

## 🔧 Configuratie

De server port kan ingesteld worden via environment variable:
```bash
PORT=8080 npm start
```

## 🏠 Homelab Deployment

Deze backend kan eenvoudig gedeployed worden op een VM in je homelab. Er zijn drie opties beschikbaar:

### Optie 1: Docker (Aanbevolen)

De eenvoudigste manier om te deployen is met Docker.

**Stappen:**
1. Upload alle bestanden naar je VM (via SCP, SFTP of git)
2. Navigeer naar de project map op de VM
3. Start de containers:
   ```bash
   docker compose up -d
   ```
4. Controleer de status:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

**Met Nginx reverse proxy (optioneel):**
Uncomment de nginx sectie in `docker-compose.yml` en start opnieuw:
```bash
docker compose up -d
```

### Optie 2: Systemd Service (Native Node.js)

Deploy als een native service op Linux.

**Stappen:**
1. Upload alle bestanden naar je VM
2. Maak de deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```
3. Draai het deployment script (als root of met sudo):
   ```bash
   sudo ./deploy.sh
   ```
4. Kies optie 2 (systemd) in het script

**Handmatige setup:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create user and directory
sudo useradd -r -s /bin/false -d /opt/openclaw-backend openclaw
sudo mkdir -p /opt/openclaw-backend

# Copy files and set permissions
sudo cp -r ./* /opt/openclaw-backend/
sudo chown -R openclaw:openclaw /opt/openclaw-backend
cd /opt/openclaw-backend
sudo -u openclaw npm ci --production

# Install systemd service
sudo cp openclaw-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable openclaw-backend
sudo systemctl start openclaw-backend

# Check status
sudo systemctl status openclaw-backend
```

### Optie 3: PM2 (Process Manager)

PM2 biedt extra features zoals monitoring en clustering.

**Stappen:**
1. Gebruik het deployment script en kies optie 3, of handmatig:

```bash
# Install Node.js en PM2
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Deploy applicatie
git clone <repository-url> /opt/openclaw-backend
cd /opt/openclaw-backend
npm ci --production

# Start met PM2
pm2 start src/server.js --name openclaw-backend
pm2 save
pm2 startup systemd

# Bekijk status en logs
pm2 status
pm2 logs openclaw-backend
```

### Firewall Configuratie

Zorg dat de firewall port 3000 toestaat:

```bash
# Voor UFW (Ubuntu/Debian)
sudo ufw allow 3000/tcp

# Voor firewalld (RHEL/CentOS/Fedora)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Voor iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

### Reverse Proxy (Nginx)

Voor productie gebruik wordt een reverse proxy aanbevolen. Voorbeeld Nginx config:

```nginx
server {
    listen 80;
    server_name bookmarks.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Installeer Nginx:
```bash
sudo apt-get install -y nginx
sudo cp nginx.conf /etc/nginx/sites-available/openclaw
sudo ln -s /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Monitoring en Logs

**Systemd:**
```bash
# View logs
sudo journalctl -u openclaw-backend -f

# View service status
sudo systemctl status openclaw-backend
```

**Docker:**
```bash
# View logs
docker compose logs -f openclaw-backend

# View container status
docker compose ps
```

**PM2:**
```bash
# View logs
pm2 logs openclaw-backend

# View status
pm2 status

# Monitor
pm2 monit
```

### Backups

Backup de database en bestanden regelmatig:

```bash
# Database backup (systemd/pm2)
tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz /opt/openclaw-backend/data

# Docker volume backup
docker run --rm -v openclaw-data:/data -v $(pwd):/backup ubuntu tar czf /backup/openclaw-backup-$(date +%Y%m%d).tar.gz /data
```

### Updates

Om de backend te updaten:

```bash
# Stop de service
sudo systemctl stop openclaw-backend  # systemd
# of
docker compose down                    # docker
# of
pm2 stop openclaw-backend             # pm2

# Update code
cd /opt/openclaw-backend
git pull  # of kopieer nieuwe bestanden

# Update dependencies
sudo -u openclaw npm ci --production

# Start de service weer
sudo systemctl start openclaw-backend  # systemd
# of
docker compose up -d                   # docker
# of
pm2 restart openclaw-backend           # pm2
```

## 📝 License

MIT License

## 🤝 Bijdragen

Bijdragen zijn welkom! Maak een pull request of open een issue.

---

**Built with ❤️ for OpenClaw**