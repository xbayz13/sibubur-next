# SiBubur Frontend

Frontend aplikasi Point of Sale (POS) untuk SiBubur yang dibangun menggunakan Next.js 16 dengan TypeScript dan Tailwind CSS.

## Fitur Utama

- Autentikasi pengguna dengan JWT
- Dashboard ringkasan operasional
- Pencatatan produksi harian dengan data cuaca
- Sistem kasir dan pesanan
- Manajemen transaksi dan pembayaran
- Pengelolaan persediaan dan pengeluaran
- Manajemen karyawan dan absensi
- Laporan harian, bulanan, dan tahunan
- Pengelolaan data master (produk, toko, kategori, dll)

## Teknologi

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Axios

## Prasyarat

- Node.js 18 atau lebih baru
- npm atau yarn
- Backend API harus berjalan

## Instalasi

1. Clone repository dan masuk ke folder `frontend`

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env.local` di root project (sesuaikan dengan port backend yang Anda pakai; backend `.env.example` menggunakan 3030):
   ```env
NEXT_PUBLIC_API_URL=http://localhost:3030
   ```

4. Jalankan development server:
   ```bash
   npm run dev
   ```

   Aplikasi akan berjalan di `http://localhost:3031`

## Scripts

| Perintah           | Deskripsi                          |
|--------------------|------------------------------------|
| `npm run dev`      | Menjalankan development server     |
| `npm run build`    | Build untuk production             |
| `npm run start`    | Menjalankan production server      |
| `npm run lint`     | Menjalankan ESLint                 |

## Catatan Penting

- Port development menggunakan **3031** (bukan 3001)
- Semua halaman kecuali `/login` memerlukan autentikasi
- Token JWT disimpan di `localStorage` dan otomatis dihapus saat menerima response 401
- Pastikan backend sudah berjalan sebelum menjalankan frontend

## Struktur Project

```
frontend/
├── app/                    # Halaman Next.js (App Router)
├── components/             # Komponen React
├── contexts/               # React Context (Auth, Theme, dll)
├── lib/                    # Utility & API client
└── types/                  # TypeScript type definitions
```
