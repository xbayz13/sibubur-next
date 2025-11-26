# Bluetooth Thermal Printer Implementation

## 📋 Overview

Implementasi Bluetooth thermal printer untuk Next.js menggunakan Web Bluetooth API. Fitur ini memungkinkan aplikasi web untuk terhubung langsung ke printer thermal Bluetooth dan mencetak struk tanpa perlu aplikasi tambahan.

## 🔧 Packages yang Digunakan

1. **escpos-buffer** (v4.1.0)
   - Library untuk generate buffer ESC/POS commands
   - Memudahkan pembuatan perintah thermal printer
   - Support berbagai format dan encoding

2. **escpos-printer-bt** (v1.2.0)
   - Library alternatif untuk koneksi Bluetooth thermal printer
   - Menggunakan Web Bluetooth API
   - Tersedia sebagai opsi tambahan

## 🌐 Browser Compatibility

### ✅ Browser yang Didukung
- **Chrome** (Windows, Android, Chrome OS) - Full support
- **Microsoft Edge** - Full support
- **Opera** - Full support

### ❌ Browser yang Tidak Didukung
- **Firefox** - Tidak mendukung Web Bluetooth API
- **Safari** - Tidak mendukung Web Bluetooth API

### ⚠️ Persyaratan
- **HTTPS Required**: Web Bluetooth API memerlukan koneksi HTTPS (kecuali localhost)
- **User Permission**: Browser akan meminta izin akses Bluetooth dari user
- **Paired Device**: Printer harus sudah dipasangkan (paired) dengan perangkat

## 📁 File Structure

```
frontend/
├── lib/
│   ├── bluetooth-printer.ts      # Service utama untuk Bluetooth printer
│   └── printer-service.ts        # Universal printer service (wrapper)
├── app/
│   └── settings/
│       └── page.tsx              # Halaman pengaturan printer
└── components/
    └── Orders/
        └── ReceiptPrint.tsx      # Komponen untuk print receipt
```

## 🚀 Cara Menggunakan

### 1. Koneksi ke Printer Bluetooth

```typescript
import { bluetoothPrinterService } from '@/lib/bluetooth-printer';

// Check browser compatibility
const compatibility = bluetoothPrinterService.getBrowserCompatibility();
if (!compatibility.supported) {
  console.error(compatibility.message);
}

// Connect to printer
try {
  await bluetoothPrinterService.connect();
  console.log('Printer connected!');
} catch (error) {
  console.error('Failed to connect:', error.message);
}
```

### 2. Print Receipt

```typescript
import { printerService } from '@/lib/printer-service';

// Print formatted receipt
await printerService.printReceipt(
  order,           // Order object
  'customer',      // Type: 'kitchen' | 'customer'
  transaction      // Transaction object (optional)
);
```

### 3. Check Connection Status

```typescript
const connection = printerService.getConnectionStatus();
if (connection && connection.connected) {
  console.log(`Connected to ${connection.name} via ${connection.method}`);
} else {
  console.log('Printer not connected');
}
```

## 🔌 Service UUIDs yang Didukung

Implementasi mencoba beberapa Service UUID untuk kompatibilitas dengan berbagai model printer:

- `0xffe0` - Serial Port Profile (SPP) - Paling umum
- `0xff00` - Generic service
- `0xffe5` - Custom service
- `0xfff0` - Additional service

## 📝 ESC/POS Commands

Service menggunakan ESC/POS commands untuk thermal printer:

- **Initialize**: `ESC @`
- **Text Formatting**: Bold, Underline, Font size
- **Alignment**: Left, Center, Right
- **Paper Cut**: Full cut, Partial cut
- **Line Feed**: Feed lines, Feed n lines

## 🛠️ Fitur Utama

### 1. Auto Reconnection
- Printer yang pernah terhubung akan disimpan di localStorage
- Sistem akan mencoba reconnect otomatis saat koneksi terputus

### 2. Chunked Writing
- Data dikirim dalam chunks (20 bytes) untuk menghindari buffer overflow
- Delay antar chunks untuk stabilitas koneksi

### 3. Fallback Mechanism
- Jika `escpos-buffer` gagal, sistem akan fallback ke manual ESC/POS commands
- Error handling yang robust dengan pesan error yang jelas

### 4. Browser Compatibility Detection
- Deteksi otomatis browser dan platform
- Pesan error yang informatif untuk browser yang tidak didukung

## ⚙️ Konfigurasi

### Paper Size
- Default: 80mm (48 karakter per baris)
- Support: 58mm, 80mm

### Chunk Size
- Default: 20 bytes (BLE characteristic limit)
- Dapat disesuaikan berdasarkan printer

### Delay Between Chunks
- Default: 20ms
- Dapat disesuaikan untuk printer yang lebih lambat

## 🐛 Troubleshooting

### Printer tidak ditemukan
1. Pastikan printer dalam keadaan menyala
2. Pastikan printer sudah dipasangkan (paired) dengan perangkat
3. Pastikan printer dalam jangkauan Bluetooth
4. Coba restart Bluetooth pada perangkat

### Koneksi gagal
1. Pastikan menggunakan browser yang didukung (Chrome/Edge/Opera)
2. Pastikan menggunakan HTTPS (kecuali localhost)
3. Pastikan izin Bluetooth sudah diberikan
4. Cek apakah printer terhubung ke perangkat lain

### Print tidak muncul
1. Pastikan printer terhubung (`getConnectionStatus()`)
2. Cek koneksi Bluetooth masih aktif
3. Coba test print terlebih dahulu
4. Pastikan kertas printer tidak habis

### Browser tidak didukung
- Gunakan Chrome, Edge, atau Opera
- Alternatif: Gunakan print browser standar (window.print())
- Untuk production, pertimbangkan aplikasi mobile (React Native/Flutter)

## 📚 Referensi

- [Web Bluetooth API Specification](https://webbluetoothcg.github.io/web-bluetooth/)
- [ESC/POS Command Reference](https://reference.epson-biz.com/modules/ref_escpos/)
- [escpos-buffer Documentation](https://github.com/grandchef/escpos-buffer)
- [escpos-printer-bt GitHub](https://github.com/TheKings294/ESCPOS-printer-BT)

## 🔒 Security Notes

1. **HTTPS Required**: Web Bluetooth API hanya bekerja dengan HTTPS (kecuali localhost)
2. **User Permission**: Setiap koneksi memerlukan izin dari user
3. **Paired Devices**: Printer harus sudah dipasangkan sebelum digunakan
4. **No Auto-Connect**: Browser tidak akan auto-connect tanpa user action

## 🎯 Best Practices

1. **Always Check Compatibility**: Selalu cek `getBrowserCompatibility()` sebelum menggunakan
2. **Handle Errors**: Selalu wrap koneksi dan print dalam try-catch
3. **User Feedback**: Berikan feedback yang jelas ke user tentang status koneksi
4. **Fallback**: Selalu sediakan fallback ke browser print jika Bluetooth tidak tersedia
5. **Test Print**: Gunakan test print untuk memastikan printer berfungsi sebelum print receipt

## 📞 Support

Jika mengalami masalah:
1. Cek browser compatibility di halaman Settings
2. Lihat console untuk error messages
3. Pastikan printer model didukung
4. Coba dengan printer lain untuk isolasi masalah

