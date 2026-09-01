# SiBubur Frontend

Frontend aplikasi Point of Sale (POS) untuk SiBubur yang dibangun menggunakan Next.js 16 dengan TypeScript dan Tailwind CSS.

## Fitur Utama

- Autentikasi pengguna dengan JWT
- Dashboard ringkasan operasional
- Pencatatan produksi harian dengan data cuaca
- Sistem kasir dan pesanan
- Pengelolaan transaksi dan pembayaran
- Manajemen persediaan dan pengeluaran
- Manajemen karyawan dan absensi
- Laporan harian, bulanan, dan tahunan
- Pengelolaan data master (produk, toko, kategori, dll)
- PWA (Progressive Web App) support

## Tech Stack

| Teknologi | Fungsi |
|---|---|
| Next.js 16 | App Router, SSR |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Axios | HTTP client |

## Prasyarat

- Node.js ≥ 18
- Backend API harus berjalan

## Instalasi

```bash
npm install
```

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_API_URL=http://localhost:3030
```

Jalankan development server:

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3031`.

## Scripts

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Development server (port 3031) |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | ESLint |

## Catatan Penting

- Port development menggunakan **3031** (bukan 3001)
- Semua halaman kecuali `/login` memerlukan autentikasi
- Token JWT disimpan di `localStorage` dan otomatis dihapus saat menerima response 401
- Pastikan backend sudah berjalan sebelum menjalankan frontend

## Struktur Proyek

```
frontend/
├── app/                    # Halaman Next.js (App Router)
│   ├── cashier/            # Modul kasir
│   ├── employees/          # Manajemen karyawan
│   ├── expenses/           # Pengeluaran
│   ├── login/              # Halaman login
│   ├── master-data/        # Data master
│   ├── open-orders/        # Pesanan aktif
│   ├── orders/             # Pesanan
│   ├── permissions/        # Permission management
│   ├── productions/        # Pencatatan produksi
│   ├── reports/            # Laporan
│   ├── roles/              # Role management
│   ├── settings/           # Pengaturan
│   ├── supplies/           # Persediaan
│   ├── transactions/       # Transaksi
│   └── users/              # Manajemen user
├── components/             # Komponen React
│   ├── Auth/               # Komponen autentikasi
│   ├── Dashboard/          # Dashboard
│   ├── MasterData/         # Komponen data master
│   ├── Orders/             # Komponen pesanan
│   ├── Productions/        # Komponen produksi
│   ├── Reports/            # Komponen laporan
│   ├── Supplies/           # Komponen persediaan
│   ├── Layout/             # Layout utama
│   └── ui/                 # UI components
├── contexts/               # React Context (Auth, Theme, dll)
├── lib/                    # Utility & API client
├── types/                  # TypeScript type definitions
└── public/                 # Static assets & PWA icons
```

## PWA

Aplikasi sudah diimplementasikan sebagai PWA dengan `next-pwa`. Lihat `Projects/sibubur-pwa-setup.md` di vault untuk detail konfigurasi.
