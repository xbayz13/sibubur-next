# SiBubur Frontend

Frontend aplikasi SiBubur Point of Sale System yang dibangun dengan Next.js, TypeScript, dan Tailwind CSS.

## Fitur

- **Autentikasi**: Sistem login dengan JWT token
- **Dashboard**: Ringkasan data penjualan, pesanan, dan produksi
- **Produksi Harian**: Pencatatan produksi bubur per toko dengan data cuaca
- **Pesanan**: Sistem pencatatan pesanan dengan nomor order yang dapat dicetak
- **Transaksi**: Pencatatan pembayaran pelanggan
- **Persediaan**: Manajemen stok bahan baku
- **Pengeluaran**: Pencatatan pengeluaran operasional
- **Karyawan**: Manajemen data karyawan dan absensi
- **Laporan**: Laporan harian, bulanan, dan tahunan dengan rekomendasi produksi
- **Data Master**: Pengelolaan produk, addon, toko, kategori, dll.

## Teknologi

- **Next.js 16**: React framework dengan App Router
- **TypeScript**: Type safety untuk kode yang lebih robust
- **Tailwind CSS**: Utility-first CSS framework untuk styling
- **Axios**: HTTP client untuk komunikasi dengan backend API

## Prasyarat

- Node.js 18+ 
- npm atau yarn
- Backend API berjalan di `http://localhost:3000`

## Instalasi

1. Clone repository atau navigasi ke folder frontend
2. Install dependencies:

```bash
npm install
```

3. Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Jalankan development server:

```bash
npm run dev
```

5. Buka browser di `http://localhost:3001` (atau port yang ditampilkan di terminal)

## Struktur Project

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── login/             # Halaman login
│   ├── layout.tsx         # Root layout dengan AuthProvider
│   └── page.tsx           # Dashboard
├── components/            # React components
│   ├── Auth/             # Komponen autentikasi
│   └── Layout/           # Komponen layout (Sidebar, Header)
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Context untuk autentikasi
├── lib/                   # Utility functions
│   ├── api.ts            # Axios client configuration
│   └── auth.ts           # Auth service functions
└── types/                 # TypeScript type definitions
    └── index.ts          # Semua type definitions
```

## API Integration

Backend API tersedia di:
- **Development**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api`

Frontend menggunakan Axios untuk komunikasi dengan backend. Token JWT disimpan di localStorage dan otomatis ditambahkan ke setiap request.

## Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run start` - Jalankan production server
- `npm run lint` - Lint kode

## Alur Aplikasi

1. **Persiapan Data**: Setup produk, addon, karyawan, toko, persediaan, kategori pengeluaran
2. **Produksi Harian**: Record produksi bubur per toko dengan data cuaca
3. **Pesanan**: Cashier mencatat pesanan dan generate nomor order (print 2x: dapur & customer)
4. **Pembayaran**: Customer membayar setelah selesai makan, data transaksi dicatat
5. **Restock**: Owner restock persediaan yang rendah dan input pengeluaran
6. **Absensi**: Owner mencatat absensi karyawan
7. **Laporan Harian**: Generate laporan dari data produksi, cuaca, pengeluaran, dan transaksi
8. **Rekomendasi**: Laporan harian digunakan untuk rekomendasi produksi ke depan
9. **Laporan Akumulasi**: Dari laporan harian, bisa dibuat laporan bulanan dan tahunan

## Development

### Menambah Halaman Baru

1. Buat file di `app/[nama-halaman]/page.tsx`
2. Gunakan `ProtectedRoute` untuk halaman yang memerlukan autentikasi
3. Gunakan `MainLayout` untuk layout dengan sidebar dan header

Contoh:

```tsx
'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div>Konten halaman</div>
      </MainLayout>
    </ProtectedRoute>
  );
}
```

### Menggunakan API

```tsx
import apiClient from '@/lib/api';
import { Product } from '@/types';

// GET request
const products = await apiClient.get<Product[]>('/products');

// POST request
const newProduct = await apiClient.post<Product>('/products', productData);
```

## Catatan

- Pastikan backend API sudah berjalan sebelum menggunakan frontend
- Token JWT akan otomatis dihapus jika mendapat response 401 (Unauthorized)
- Semua halaman kecuali `/login` memerlukan autentikasi
