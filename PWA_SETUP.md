# PWA Setup Guide

Progressive Web App (PWA) telah diimplementasikan di aplikasi SiBubur. Berikut adalah informasi penting:

## ✅ Yang Sudah Diimplementasikan

1. **next-pwa package** - Installed dan dikonfigurasi
2. **manifest.json** - File manifest untuk PWA
3. **Service Worker** - Otomatis di-generate oleh next-pwa
4. **Install Button** - Tombol install di halaman Settings
5. **Meta Tags** - Konfigurasi di layout.tsx

## 📱 Icon PWA

Untuk menyelesaikan setup PWA, Anda perlu menambahkan icon berikut di folder `public/`:

- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

### Cara Membuat Icon:

1. **Menggunakan Online Tool:**
   - Kunjungi https://realfavicongenerator.net/
   - Atau https://www.pwabuilder.com/imageGenerator
   - Upload logo/icon aplikasi Anda
   - Download icon dalam ukuran yang diperlukan

2. **Menggunakan Design Tool:**
   - Buat icon 512x512 di Figma/Photoshop
   - Export sebagai PNG
   - Resize ke 192x192 untuk icon kecil

3. **Menggunakan SVG Placeholder:**
   - File SVG placeholder sudah dibuat di `public/icon-192x192.svg` dan `public/icon-512x512.svg`
   - Convert ke PNG menggunakan tool online atau ImageMagick:
     ```bash
     # Jika punya ImageMagick
     convert public/icon-192x192.svg public/icon-192x192.png
     convert public/icon-512x512.svg public/icon-512x512.png
     ```

## 🚀 Testing PWA

1. **Development:**
   - PWA di-disable di development mode (lihat `next.config.ts`)
   - Untuk test di development, ubah `disable: false` di next.config.ts

2. **Production:**
   - Build aplikasi: `npm run build`
   - Start production server: `npm start`
   - Buka di browser (Chrome/Edge recommended)
   - Install button akan muncul di halaman Settings jika browser mendukung

## 📋 Fitur PWA

- ✅ Install sebagai aplikasi
- ✅ Offline support (dengan service worker)
- ✅ Fast loading dengan caching
- ✅ Standalone mode (tanpa browser UI)

## 🔧 Konfigurasi

File konfigurasi utama:
- `next.config.ts` - Konfigurasi next-pwa
- `public/manifest.json` - Manifest PWA
- `app/layout.tsx` - Meta tags dan manifest link
- `app/settings/page.tsx` - Install button

## ⚠️ Catatan Penting

1. **HTTPS Required:** PWA memerlukan HTTPS di production (kecuali localhost)
2. **Browser Support:** 
   - Chrome/Edge: Full support
   - Safari iOS: Support dengan beberapa limitasi
   - Firefox: Limited support
3. **Service Worker:** Otomatis di-generate saat build production

## 🐛 Troubleshooting

Jika install button tidak muncul:
1. Pastikan menggunakan HTTPS atau localhost
2. Pastikan browser mendukung PWA (Chrome/Edge recommended)
3. Check console untuk error
4. Pastikan manifest.json dapat diakses
5. Pastikan icon files ada dan dapat diakses

