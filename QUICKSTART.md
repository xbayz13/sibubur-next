# Quick Start Guide

## Setup Awal

1. **Install dependencies** (jika belum):
```bash
npm install
```

2. **Buat file `.env.local`** di root project:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. **Pastikan backend API berjalan** di `http://localhost:3000`

4. **Jalankan development server**:
```bash
npm run dev
```

5. **Buka browser** di `http://localhost:3001` (atau port yang ditampilkan)

## Login

- Gunakan credentials dari backend untuk login
- Setelah login, Anda akan diarahkan ke dashboard

## Struktur Halaman

- `/` - Dashboard
- `/login` - Halaman login
- `/productions` - Produksi harian
- `/orders` - Pesanan
- `/transactions` - Transaksi
- `/supplies` - Persediaan
- `/expenses` - Pengeluaran
- `/employees` - Karyawan
- `/reports` - Laporan
- `/master-data` - Data master

## Next Steps

1. Implementasi halaman-halaman yang masih placeholder
2. Integrasi dengan API endpoints dari backend
3. Tambahkan fitur print untuk order
4. Implementasi dashboard dengan data real-time
5. Tambahkan validasi form dan error handling

