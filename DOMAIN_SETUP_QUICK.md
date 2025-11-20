# Quick Setup Domain - sibubur.xbayz13.xyz

Panduan cepat setup domain untuk aplikasi frontend yang berjalan di port 3001.

## 📋 Informasi
- **Domain**: xbayz13.xyz
- **Subdomain**: sibubur.xbayz13.xyz
- **VPS IP**: 72.61.208.109
- **Port Aplikasi**: 3001

---

## 🚀 Step 1: Setup DNS di hPanel (5 menit)

1. Login ke https://hpanel.hostinger.com
2. Pilih domain **xbayz13.xyz**
3. Masuk ke **DNS Zone Editor** atau **Advanced DNS**
4. Klik **"Add Record"**
5. Isi:
   - **Type**: A
   - **Name/Host**: `sibubur`
   - **Points to/Target**: `72.61.208.109`
   - **TTL**: `3600`
6. Klik **"Save"**
7. Tunggu 5-15 menit untuk DNS propagation

**Verifikasi DNS:**
```bash
dig sibubur.xbayz13.xyz
# Harus return: 72.61.208.109
```

---

## 🔧 Step 2: Setup Nginx di VPS (10 menit)

### 2.1 Login ke VPS
```bash
ssh root@72.61.208.109
```

### 2.2 Install Nginx
```bash
apt update
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### 2.3 Buat Config Nginx
```bash
nano /etc/nginx/sites-available/sibubur.xbayz13.xyz
```

**Copy-paste config berikut:**
```nginx
server {
    listen 80;
    server_name sibubur.xbayz13.xyz;

    access_log /var/log/nginx/sibubur-access.log;
    error_log /var/log/nginx/sibubur-error.log;
    client_max_body_size 10M;

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
```

**Simpan**: `Ctrl + X`, lalu `Y`, lalu `Enter`

### 2.4 Enable Site
```bash
ln -s /etc/nginx/sites-available/sibubur.xbayz13.xyz /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔒 Step 3: Setup SSL (5 menit)

### 3.1 Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 3.2 Generate SSL Certificate
```bash
certbot --nginx -d sibubur.xbayz13.xyz
```

**Ikuti instruksi:**
- Enter email address
- Agree to terms (A)
- Share email? (Y atau N)
- Redirect HTTP to HTTPS? (2 - Recommended)

### 3.3 Test Auto-Renewal
```bash
certbot renew --dry-run
```

---

## 🔥 Step 4: Setup Firewall (2 menit)

```bash
apt install ufw -y
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## ✅ Step 5: Verifikasi

### Test dari Browser
1. Buka: `http://sibubur.xbayz13.xyz` (harus redirect ke HTTPS)
2. Buka: `https://sibubur.xbayz13.xyz`
3. Pastikan aplikasi berjalan

### Test dari Terminal
```bash
curl -I https://sibubur.xbayz13.xyz
```

### Cek Logs
```bash
# Nginx logs
tail -f /var/log/nginx/sibubur-error.log

# Application logs (jika menggunakan PM2)
pm2 logs
```

---

## 🔧 Step 6: Update Konfigurasi Aplikasi

### Update CORS di Backend

Edit `backend/src/main.ts`:
```typescript
const corsOptions = {
  origin: [
    'https://sibubur.xbayz13.xyz',
    'http://sibubur.xbayz13.xyz',
    // ... origins lainnya
  ],
  credentials: true,
};
```

### Update API URL di Frontend (jika perlu)

Rebuild frontend dengan environment variable baru:
```bash
cd frontend
export NEXT_PUBLIC_API_URL=https://api.xbayz13.xyz  # atau sesuai backend URL
npm run build
pm2 restart sibubur-frontend
```

---

## 🐛 Troubleshooting

### DNS tidak resolve
- Tunggu lebih lama (bisa sampai 24 jam)
- Cek DNS record di hPanel
- Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)

### Nginx 502 Bad Gateway
```bash
# Cek aplikasi berjalan
pm2 status
netstat -tulpn | grep 3001

# Test aplikasi
curl http://localhost:3001

# Cek error log
tail -f /var/log/nginx/sibubur-error.log
```

### SSL tidak terpasang
```bash
# Cek DNS
dig sibubur.xbayz13.xyz

# Cek firewall
ufw status

# Generate ulang
certbot --nginx -d sibubur.xbayz13.xyz --force-renewal
```

---

## 📝 Checklist

- [ ] DNS A Record sudah ditambahkan di hPanel
- [ ] DNS sudah propagate (cek dengan `dig`)
- [ ] Nginx sudah terinstall dan running
- [ ] Nginx config sudah dibuat dan di-enable
- [ ] SSL certificate sudah di-generate
- [ ] Firewall sudah dikonfigurasi
- [ ] Aplikasi bisa diakses via `https://sibubur.xbayz13.xyz`
- [ ] CORS di backend sudah di-update
- [ ] API URL di frontend sudah di-update (jika perlu)

---

**Selesai!** 🎉 Aplikasi sekarang bisa diakses via `https://sibubur.xbayz13.xyz`

Untuk panduan lengkap, lihat [DOMAIN_SETUP_HOSTINGER.md](./DOMAIN_SETUP_HOSTINGER.md)
