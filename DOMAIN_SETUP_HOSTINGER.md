# Panduan Setup Domain untuk SiBubur di VPS Hostinger

## 📋 Informasi yang Dibutuhkan

- **Domain**: xbayz13.xyz
- **Subdomain**: sibubur.xbayz13.xyz
- **VPS IP**: 72.61.208.109
- **Port Aplikasi**: 3001
- **Panel**: hPanel (Hostinger)

---

## 🚀 Step 1: Setup DNS Records di hPanel Hostinger

### 1.1 Login ke hPanel Hostinger

1. Buka https://hpanel.hostinger.com
2. Login dengan akun Hostinger Anda
3. Pilih domain **xbayz13.xyz**

### 1.2 Tambahkan DNS Records

Masuk ke **DNS Zone Editor** atau **Advanced DNS**:

#### A. Tambahkan A Record untuk Subdomain

1. Klik **"Add Record"** atau **"Tambah Record"**
2. Pilih tipe: **A**
3. Isi:
   - **Name/Host**: `sibubur` (atau `sibubur.xbayz13.xyz`)
   - **Points to/Target**: `72.61.208.109`
   - **TTL**: `3600` (default)
4. Klik **"Add Record"** atau **"Save"**

**Catatan**: 
- Jika hanya isi `sibubur`, akan menjadi `sibubur.xbayz13.xyz`
- Jika isi `sibubur.xbayz13.xyz`, akan tetap menjadi `sibubur.xbayz13.xyz`

#### B. (Opsional) Tambahkan A Record untuk Domain Utama

Jika ingin domain utama juga mengarah ke VPS:

1. Klik **"Add Record"**
2. Pilih tipe: **A**
3. Isi:
   - **Name/Host**: `@` atau `xbayz13.xyz`
   - **Points to/Target**: `72.61.208.109`
   - **TTL**: `3600`
4. Klik **"Save"**

### 1.3 Verifikasi DNS Records

Setelah menambahkan record, tunggu beberapa menit (biasanya 5-15 menit) untuk propagasi DNS.

**Cek DNS propagation:**
```bash
# Dari terminal lokal
dig sibubur.xbayz13.xyz
# atau
nslookup sibubur.xbayz13.xyz

# Harus return: 72.61.208.109
```

**Atau gunakan tool online:**
- https://dnschecker.org
- https://www.whatsmydns.net

---

## 🔧 Step 2: Setup Nginx Reverse Proxy di VPS

### 2.1 Login ke VPS

```bash
ssh root@72.61.208.109
# atau jika sudah setup SSH key
ssh root@72.61.208.109
```

### 2.2 Install Nginx

```bash
# Update package list
apt update

# Install Nginx
apt install nginx -y

# Start dan enable Nginx
systemctl start nginx
systemctl enable nginx

# Cek status
systemctl status nginx
```

### 2.3 Buat Nginx Configuration untuk Subdomain

Buat file konfigurasi baru:

```bash
nano /etc/nginx/sites-available/sibubur.xbayz13.xyz
```

Tambahkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name sibubur.xbayz13.xyz;

    # Log files
    access_log /var/log/nginx/sibubur-access.log;
    error_log /var/log/nginx/sibubur-error.log;

    # Increase body size for file uploads (adjust as needed)
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache control
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (optional)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Simpan file**: Tekan `Ctrl + X`, lalu `Y`, lalu `Enter`

### 2.4 Enable Site Configuration

```bash
# Buat symbolic link
ln -s /etc/nginx/sites-available/sibubur.xbayz13.xyz /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Jika test berhasil, reload Nginx
systemctl reload nginx
```

### 2.5 Verifikasi Nginx

```bash
# Cek status
systemctl status nginx

# Cek apakah site sudah aktif
nginx -T | grep sibubur.xbayz13.xyz
```

---

## 🔒 Step 3: Setup SSL Certificate (Let's Encrypt)

### 3.1 Install Certbot

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y
```

### 3.2 Generate SSL Certificate

```bash
# Generate certificate untuk subdomain
certbot --nginx -d sibubur.xbayz13.xyz

# Ikuti instruksi:
# - Enter email address (untuk notifikasi)
# - Agree to terms (A)
# - Share email dengan EFF? (Y atau N)
# - Redirect HTTP to HTTPS? (2 - Recommended)
```

Certbot akan otomatis:
- Generate SSL certificate
- Update Nginx configuration
- Setup auto-renewal

### 3.3 Test Auto-Renewal

```bash
# Test renewal (dry run)
certbot renew --dry-run

# Jika berhasil, certificate akan auto-renew setiap 90 hari
```

### 3.4 Verifikasi SSL

Setelah SSL terpasang, akses:
- https://sibubur.xbayz13.xyz

**Cek SSL certificate:**
```bash
# Dari terminal lokal
openssl s_client -connect sibubur.xbayz13.xyz:443 -servername sibubur.xbayz13.xyz
```

---

## 🔥 Step 4: Konfigurasi Firewall (UFW)

### 4.1 Setup UFW (jika belum ada)

```bash
# Install UFW
apt install ufw -y

# Allow SSH (PENTING! Jangan skip ini!)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Enable UFW
ufw enable

# Cek status
ufw status
```

### 4.2 (Opsional) Block Port 3001 dari Public

Karena aplikasi sudah diakses via Nginx, kita bisa block port 3001 dari public:

```bash
# Block port 3001 dari external (tapi tetap bisa diakses dari localhost)
# Port 3001 hanya perlu diakses dari localhost (Nginx)
# Tidak perlu rule khusus karena default UFW sudah block semua incoming

# Verifikasi: Port 3001 hanya bisa diakses dari localhost
```

---

## ✅ Step 5: Verifikasi Setup

### 5.1 Test dari Browser

1. Buka browser
2. Akses: `http://sibubur.xbayz13.xyz` (harus redirect ke HTTPS)
3. Akses: `https://sibubur.xbayz13.xyz`
4. Pastikan aplikasi berjalan dengan baik

### 5.2 Test dari Terminal

```bash
# Test HTTP (harus redirect ke HTTPS)
curl -I http://sibubur.xbayz13.xyz

# Test HTTPS
curl -I https://sibubur.xbayz13.xyz

# Test dengan domain
curl https://sibubur.xbayz13.xyz
```

### 5.3 Cek Logs

```bash
# Cek Nginx access log
tail -f /var/log/nginx/sibubur-access.log

# Cek Nginx error log
tail -f /var/log/nginx/sibubur-error.log

# Cek application logs (sesuai dengan setup aplikasi Anda)
# Misalnya jika menggunakan PM2:
pm2 logs
```

---

## 🔧 Step 6: Konfigurasi Aplikasi (Jika Diperlukan)

### 6.1 Update CORS di Backend

Pastikan backend mengizinkan request dari domain baru:

**File**: `backend/src/main.ts` atau config CORS

```typescript
// Update CORS origin
const corsOptions = {
  origin: [
    'https://sibubur.xbayz13.xyz',
    'http://sibubur.xbayz13.xyz', // untuk development
    // ... origins lainnya
  ],
  credentials: true,
};
```

### 6.2 Update API Base URL di Frontend

**File**: `frontend/lib/api.ts` atau environment variables

```typescript
// Update API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sibubur.xbayz13.xyz/api';
```

**Atau via environment variable:**
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://sibubur.xbayz13.xyz/api
```

---

## 📝 Checklist Setup

- [ ] DNS A Record untuk `sibubur.xbayz13.xyz` sudah ditambahkan di hPanel
- [ ] DNS sudah propagate (cek dengan `dig` atau `nslookup`)
- [ ] Nginx sudah terinstall
- [ ] Nginx configuration untuk subdomain sudah dibuat
- [ ] Nginx site sudah di-enable
- [ ] Nginx configuration test berhasil (`nginx -t`)
- [ ] Nginx sudah di-reload
- [ ] SSL certificate sudah di-generate dengan Certbot
- [ ] SSL auto-renewal sudah di-test
- [ ] Firewall (UFW) sudah dikonfigurasi
- [ ] Port 22, 80, 443 sudah di-allow
- [ ] Aplikasi bisa diakses via `https://sibubur.xbayz13.xyz`
- [ ] CORS di backend sudah di-update (jika perlu)
- [ ] API base URL di frontend sudah di-update (jika perlu)

---

## 🐛 Troubleshooting

### Problem: DNS tidak resolve

**Solusi:**
1. Tunggu lebih lama (DNS propagation bisa sampai 24-48 jam)
2. Cek DNS record di hPanel sudah benar
3. Clear DNS cache:
   ```bash
   # Di Mac/Linux
   sudo dscacheutil -flushcache
   
   # Atau gunakan DNS lain (Google DNS: 8.8.8.8)
   ```

### Problem: Nginx 502 Bad Gateway

**Kemungkinan penyebab:**
- Aplikasi tidak berjalan di port 3001
- Firewall block port 3001
- Aplikasi crash

**Solusi:**
```bash
# Cek apakah aplikasi berjalan
netstat -tulpn | grep 3001
# atau
ss -tulpn | grep 3001

# Cek aplikasi status (jika menggunakan PM2)
pm2 status

# Test aplikasi dari localhost
curl http://localhost:3001

# Cek error log
tail -f /var/log/nginx/sibubur-error.log
```

### Problem: SSL Certificate tidak terpasang

**Solusi:**
```bash
# Cek apakah domain sudah resolve ke IP yang benar
dig sibubur.xbayz13.xyz

# Cek apakah port 80 dan 443 terbuka
ufw status

# Coba generate ulang certificate
certbot --nginx -d sibubur.xbayz13.xyz --force-renewal
```

### Problem: Aplikasi tidak bisa diakses setelah setup

**Solusi:**
1. Cek apakah aplikasi berjalan:
   ```bash
   pm2 status
   # atau
   systemctl status your-app-service
   ```

2. Cek Nginx logs:
   ```bash
   tail -f /var/log/nginx/sibubur-error.log
   ```

3. Cek apakah port 3001 listening:
   ```bash
   netstat -tulpn | grep 3001
   ```

4. Test aplikasi langsung:
   ```bash
   curl http://localhost:3001
   ```

### Problem: CORS Error di Browser

**Solusi:**
1. Update CORS di backend untuk mengizinkan domain baru
2. Pastikan `Access-Control-Allow-Origin` header sudah benar
3. Cek browser console untuk error detail

---

## 🔄 Maintenance

### Update Nginx Configuration

```bash
# Edit config
nano /etc/nginx/sites-available/sibubur.xbayz13.xyz

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Renew SSL Certificate

```bash
# Manual renewal
certbot renew

# Test renewal
certbot renew --dry-run
```

### Monitor Logs

```bash
# Nginx access log
tail -f /var/log/nginx/sibubur-access.log

# Nginx error log
tail -f /var/log/nginx/sibubur-error.log

# Application logs (PM2)
pm2 logs
```

---

## 📞 Support

Jika mengalami masalah:
1. Cek logs terlebih dahulu
2. Verifikasi setiap step di checklist
3. Hubungi support Hostinger jika masalah terkait DNS/hPanel
4. Cek dokumentasi Nginx: https://nginx.org/en/docs/

---

## 🎯 Next Steps (Opsional)

### 1. Setup Monitoring

- Setup Uptime Robot untuk monitoring
- Setup error tracking (Sentry, dll)

### 2. Optimasi Nginx

- Enable gzip compression
- Setup caching untuk static files
- Optimasi buffer sizes

### 3. Setup Backup

- Automated database backup
- Backup configuration files

### 4. Setup Multiple Subdomains

Jika ingin menambahkan subdomain lain (misal: `api.xbayz13.xyz`):

1. Tambahkan DNS A Record baru
2. Buat Nginx config baru
3. Generate SSL certificate baru
4. Enable site

---

**Status**: ✅ Setup selesai! Aplikasi sekarang bisa diakses via `https://sibubur.xbayz13.xyz`

