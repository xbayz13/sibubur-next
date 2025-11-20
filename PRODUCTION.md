# Production Deployment Guide - SiBubur Frontend

Panduan lengkap untuk deploy frontend SiBubur POS ke production menggunakan PM2.

## 📋 Prasyarat

- Node.js 18+ terinstall
- PM2 terinstall secara global: `npm install -g pm2`
- Backend API sudah berjalan dan accessible
- Domain atau IP server sudah tersedia
- SSL certificate (optional, tapi recommended untuk HTTPS)

## 🔧 Setup Environment Variables

### 1. Buat File `.env.production`

Buat file `.env.production` di root project:

```env
# API Base URL (Production)
# Pastikan value ini sesuai dengan production backend URL
NEXT_PUBLIC_API_URL=http://72.61.208.109:3000

# Node Environment
NODE_ENV=production

# Next.js Port (optional, default: 3001)
PORT=3001
```

**Catatan:** 
- File `.env.production` digunakan saat build time untuk production
- Pastikan `NEXT_PUBLIC_API_URL` mengarah ke production backend API
- Untuk development, gunakan file `.env.local` dengan value `http://localhost:3000`

### 2. Environment Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` | `http://72.61.208.109:3000` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PORT` | Next.js server port | `3001` | `3001` |

**Catatan:** 
- `NEXT_PUBLIC_*` variables harus di-set saat build time
- Pastikan backend API sudah berjalan dan accessible dari server frontend

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
# Install production dependencies only
npm ci --production=false  # Include devDependencies untuk build
```

### Step 2: Build Application

**Opsi A: Menggunakan file `.env.production`**

Buat file `.env.production` dengan content:
```env
NEXT_PUBLIC_API_URL=http://72.61.208.109:3000
NODE_ENV=production
```

Kemudian build:
```bash
npm run build
```

**Opsi B: Menggunakan environment variables**

```bash
# Set environment untuk production
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=http://72.61.208.109:3000

# Build aplikasi
npm run build
```

**Catatan:** Next.js akan otomatis membaca `.env.production` saat build dengan `NODE_ENV=production`

**Output:** Folder `.next/` akan dibuat dengan production build.

### Step 3: Setup PM2 Configuration

Buat file `ecosystem.config.js` di root project:

```javascript
module.exports = {
  apps: [{
    name: 'sibubur-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    cwd: '/path/to/frontend', // Ganti dengan path absolut ke folder frontend
    instances: 1, // Atau 'max' untuk cluster mode
    exec_mode: 'fork', // atau 'cluster' untuk load balancing
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      // NEXT_PUBLIC_API_URL sudah di-set saat build time
      // Tidak perlu di-set lagi di runtime untuk Next.js
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
  }]
};
```

**Catatan:** 
- `NEXT_PUBLIC_API_URL` harus di-set saat **build time**, bukan runtime
- Next.js akan embed value `NEXT_PUBLIC_API_URL` ke dalam bundle saat build
- Jika perlu mengubah API URL, harus rebuild aplikasi dengan environment variable baru

**Atau gunakan PM2 dengan command langsung:**

```bash
pm2 start npm --name "sibubur-frontend" -- start
```

### Step 4: Start dengan PM2

**Opsi A: Menggunakan ecosystem.config.js**

```bash
# Start aplikasi
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 untuk auto-start saat reboot
pm2 startup
# Jalankan command yang ditampilkan (biasanya sudo ...)
```

**Opsi B: Menggunakan command langsung**

```bash
# Start aplikasi
# Catatan: NEXT_PUBLIC_API_URL sudah di-set saat build time
# Tidak perlu di-set lagi di runtime
NODE_ENV=production \
PORT=3001 \
pm2 start npm --name "sibubur-frontend" -- start

# Save configuration
pm2 save

# Setup auto-start
pm2 startup
```

**Penting:** 
- `NEXT_PUBLIC_API_URL` adalah build-time variable untuk Next.js
- Value sudah di-embed ke dalam bundle saat `npm run build`
- Untuk mengubah API URL, harus rebuild dengan environment variable baru

### Step 5: Verify Deployment

```bash
# Check status
pm2 status

# Check logs
pm2 logs sibubur-frontend

# Monitor real-time
pm2 monit
```

Aplikasi seharusnya berjalan di `http://your-server-ip:3001`

---

## 🔄 Update Deployment

### Update Aplikasi

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (jika ada perubahan)
npm ci --production=false

# 3. Rebuild aplikasi
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=http://72.61.208.109:3000
npm run build

# 4. Restart PM2
pm2 restart sibubur-frontend

# Atau reload (zero-downtime)
pm2 reload sibubur-frontend
```

### Update Environment Variables

```bash
# Edit ecosystem.config.js atau gunakan:
pm2 restart sibubur-frontend --update-env

# Atau set ulang dengan env variables
NEXT_PUBLIC_API_URL=http://new-api-url:3000 pm2 restart sibubur-frontend
```

---

## 🌐 Setup Reverse Proxy (Nginx)

Untuk production, disarankan menggunakan Nginx sebagai reverse proxy.

### Nginx Configuration

Buat file `/etc/nginx/sites-available/sibubur-frontend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Ganti dengan domain Anda

    # Redirect HTTP to HTTPS (optional)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS Configuration (jika menggunakan SSL)
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com;
#
#     ssl_certificate /path/to/certificate.crt;
#     ssl_certificate_key /path/to/private.key;
#
#     location / {
#         proxy_pass http://localhost:3001;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#     }
# }
```

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/sibubur-frontend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## 📊 PM2 Management Commands

### Basic Commands

```bash
# Start aplikasi
pm2 start sibubur-frontend

# Stop aplikasi
pm2 stop sibubur-frontend

# Restart aplikasi
pm2 restart sibubur-frontend

# Reload aplikasi (zero-downtime)
pm2 reload sibubur-frontend

# Delete dari PM2
pm2 delete sibubur-frontend

# List semua aplikasi
pm2 list

# Show details
pm2 show sibubur-frontend
```

### Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs sibubur-frontend

# View last 100 lines
pm2 logs sibubur-frontend --lines 100

# Clear logs
pm2 flush
```

### Advanced Commands

```bash
# Save current process list
pm2 save

# Resurrect saved processes
pm2 resurrect

# Update PM2
pm2 update

# Show process info
pm2 info sibubur-frontend

# Show process tree
pm2 prettylist
```

---

## 🔍 Troubleshooting

### Problem: Application tidak start

**Check logs:**
```bash
pm2 logs sibubur-frontend --err
```

**Common issues:**
1. **Port sudah digunakan**: 
   ```bash
   # Check port
   lsof -i :3001
   # Kill process atau ubah port
   ```

2. **NEXT_PUBLIC_API_URL tidak ter-set**:
   ```bash
   # Pastikan sudah di-set saat build time
   # Check dengan melihat source code yang di-build
   # Atau rebuild dengan environment variable yang benar
   export NEXT_PUBLIC_API_URL=http://72.61.208.109:3000
   npm run build
   ```

3. **Build failed**:
   ```bash
   # Rebuild dengan environment variables yang benar
   export NEXT_PUBLIC_API_URL=http://72.61.208.109:3000
   npm run build
   ```

### Problem: API connection error

**Check:**
1. Backend API sudah berjalan dan accessible
2. `NEXT_PUBLIC_API_URL` sudah benar
3. Firewall tidak block connection
4. CORS sudah dikonfigurasi di backend

**Test connection:**
```bash
curl http://72.61.208.109:3000/health
# atau
curl http://localhost:3000/health
```

### Problem: PM2 tidak auto-start setelah reboot

```bash
# Setup startup script
pm2 startup

# Jalankan command yang ditampilkan (biasanya sudo ...)
# Kemudian save
pm2 save
```

### Problem: High memory usage

```bash
# Set memory limit di ecosystem.config.js
max_memory_restart: '1G'

# Atau restart secara manual
pm2 restart sibubur-frontend
```

---

## 📋 Production Checklist

Sebelum deploy ke production:

- [ ] Environment variables sudah dikonfigurasi dengan benar
- [ ] `NEXT_PUBLIC_API_URL` mengarah ke production backend
- [ ] Build berhasil tanpa error
- [ ] PM2 sudah terinstall dan dikonfigurasi
- [ ] Aplikasi bisa diakses dari browser
- [ ] API connection berfungsi
- [ ] Logs sudah dikonfigurasi
- [ ] Auto-start setelah reboot sudah setup
- [ ] Reverse proxy (Nginx) sudah dikonfigurasi (optional)
- [ ] SSL certificate sudah diinstall (optional, tapi recommended)
- [ ] Firewall rules sudah dikonfigurasi
- [ ] Monitoring sudah di-setup

---

## 🔒 Security Best Practices

1. **Jangan commit `.env.production`** - Gunakan environment variables atau secrets management
2. **Gunakan HTTPS** - Setup SSL certificate untuk production
3. **Firewall Configuration** - Hanya buka port yang diperlukan
4. **Regular Updates** - Update dependencies secara berkala
5. **Monitor Logs** - Setup log rotation dan monitoring
6. **Backup** - Backup konfigurasi dan data penting

---

## 📝 Example: Complete Deployment Script

Buat file `deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# 3. Build application
echo "🔨 Building application..."
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=http://72.61.208.109:3000
# NEXT_PUBLIC_API_URL harus di-set saat build time
npm run build

# 4. Restart PM2
echo "🔄 Restarting application..."
pm2 restart sibubur-frontend

# 5. Check status
echo "✅ Deployment complete!"
pm2 status

echo "📊 Application logs:"
pm2 logs sibubur-frontend --lines 20
```

**Make executable:**
```bash
chmod +x deploy.sh
```

**Run:**
```bash
./deploy.sh
```

---

## 🔗 Related Documentation

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

---

## 📞 Support

Jika mengalami masalah:
1. Check logs: `pm2 logs sibubur-frontend`
2. Check status: `pm2 status`
3. Review environment variables
4. Verify backend API connection
5. Check firewall and network configuration

---

**Last Updated:** 2025-01-XX

