/**
 * Universal Printer Service
 * Supports multiple printing methods:
 * 1. Web Bluetooth API (Chrome/Edge/Opera only)
 * 2. Web Serial API (Chrome/Edge/Opera - for USB/Serial printers)
 * 3. Server-side printing (via backend API)
 */

import { bluetoothPrinterService } from './bluetooth-printer';

export type PrinterMethod = 'bluetooth' | 'serial' | 'server' | 'browser';

export interface PrinterConnection {
  method: PrinterMethod;
  name: string;
  id: string;
  connected: boolean;
}

// ESC/POS commands for thermal printers
const ESC = '\x1B';
const GS = '\x1D';

export const ESCPOS_COMMANDS = {
  INIT: ESC + '@',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  FONT_NORMAL: ESC + '!' + '\x00',
  FONT_DOUBLE: ESC + '!' + '\x30',
  FEED: '\n',
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
  CUT: GS + 'V' + '\x41' + '\x00',
};

class UniversalPrinterService {
  private serialPort: SerialPort | null = null;
  private serialWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private currentMethod: PrinterMethod = 'browser';

  /**
   * Check available printing methods
   */
  getAvailableMethods(): PrinterMethod[] {
    const methods: PrinterMethod[] = ['browser']; // Always available

    if (this.isBluetoothSupported()) {
      methods.push('bluetooth');
    }

    if (this.isSerialSupported()) {
      methods.push('serial');
    }

    // Server-side printing is always available (requires backend setup)
    methods.push('server');

    return methods;
  }

  /**
   * Check if Web Bluetooth is supported
   */
  isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Check if Web Serial API is supported
   */
  isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): PrinterConnection | null {
    if (this.currentMethod === 'bluetooth' && bluetoothPrinterService.isConnected()) {
      const printer = bluetoothPrinterService.getPrinter();
      if (printer) {
        return {
          method: 'bluetooth',
          name: printer.name,
          id: printer.id,
          connected: true,
        };
      }
    }

    if (this.currentMethod === 'serial' && this.serialPort) {
      return {
        method: 'serial',
        name: 'Serial Printer',
        id: 'serial',
        connected: this.serialPort.readable !== null,
      };
    }

    return null;
  }

  /**
   * Connect to printer via Web Serial API
   */
  async connectSerial(): Promise<void> {
    if (!this.isSerialSupported()) {
      throw new Error('Web Serial API tidak didukung. Gunakan Chrome, Edge, atau Opera.');
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 }); // Common baud rate for thermal printers

      this.serialPort = port;
      const writer = port.writable.getWriter();
      this.serialWriter = writer;
      this.currentMethod = 'serial';

      // Listen for disconnection
      port.addEventListener('disconnect', () => {
        this.serialPort = null;
        this.serialWriter = null;
      });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error('Tidak ada printer Serial yang ditemukan.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Akses Serial ditolak. Pastikan browser memiliki izin.');
      }
      throw new Error(`Gagal menghubungkan ke printer Serial: ${error.message}`);
    }
  }

  /**
   * Disconnect from serial printer
   */
  async disconnectSerial(): Promise<void> {
    if (this.serialWriter) {
      try {
        await this.serialWriter.close();
      } catch (error) {
        console.error('Error closing serial writer:', error);
      }
      this.serialWriter = null;
    }

    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch (error) {
        console.error('Error closing serial port:', error);
      }
      this.serialPort = null;
    }

    this.currentMethod = 'browser';
  }

  /**
   * Write data to serial port
   */
  private async writeSerial(data: Uint8Array): Promise<void> {
    if (!this.serialWriter) {
      throw new Error('Printer Serial tidak terhubung.');
    }

    try {
      await this.serialWriter.write(data);
    } catch (error: any) {
      if (error.message?.includes('closed')) {
        this.serialPort = null;
        this.serialWriter = null;
        throw new Error('Printer Serial terputus. Silakan hubungkan kembali.');
      }
      throw new Error(`Gagal mengirim data ke printer: ${error.message}`);
    }
  }

  /**
   * Connect to Bluetooth printer (delegate to bluetooth service)
   */
  async connectBluetooth(device?: BluetoothDevice): Promise<void> {
    await bluetoothPrinterService.connect(device);
    this.currentMethod = 'bluetooth';
  }

  /**
   * Disconnect from Bluetooth printer
   */
  async disconnectBluetooth(): Promise<void> {
    await bluetoothPrinterService.disconnect();
    if (this.currentMethod === 'bluetooth') {
      this.currentMethod = 'browser';
    }
  }

  /**
   * Print formatted receipt
   */
  async printReceipt(
    order: any,
    type: 'kitchen' | 'customer',
    transaction?: any
  ): Promise<void> {
    const connection = this.getConnectionStatus();

    if (!connection || !connection.connected) {
      // Fallback to browser print
      throw new Error('Printer tidak terhubung. Gunakan browser print atau hubungkan printer terlebih dahulu.');
    }

    switch (connection.method) {
      case 'bluetooth':
        await bluetoothPrinterService.printFormattedReceipt(order, type, transaction);
        break;
      case 'serial':
        await this.printReceiptSerial(order, type, transaction);
        break;
      case 'server':
        await this.printReceiptServer(order, type, transaction);
        break;
      default:
        throw new Error('Metode printing tidak didukung.');
    }
  }

  /**
   * Print receipt via Serial
   */
  private async printReceiptSerial(
    order: any,
    type: 'kitchen' | 'customer',
    transaction?: any
  ): Promise<void> {
    if (!this.serialWriter) {
      throw new Error('Printer Serial tidak terhubung.');
    }

    const encoder = new TextEncoder();
    let data = '';

    // Initialize
    data += ESCPOS_COMMANDS.INIT;
    data += ESCPOS_COMMANDS.ALIGN_CENTER;
    data += ESCPOS_COMMANDS.FONT_DOUBLE;
    data += 'Bubur Ayam Lembur Kuring\n';
    data += ESCPOS_COMMANDS.FONT_NORMAL;
    data += ESCPOS_COMMANDS.FEED;
    data += ESCPOS_COMMANDS.BOLD_ON;
    data += type === 'kitchen' ? 'STRUK DAPUR\n' : 'STRUK PELANGGAN\n';
    data += ESCPOS_COMMANDS.BOLD_OFF;

    // Order info
    data += ESCPOS_COMMANDS.ALIGN_LEFT;
    data += ESCPOS_COMMANDS.FEED;
    data += `No. Order: ${order.orderNumber}\n`;
    data += `Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}\n`;
    if (order.customerName) {
      data += `Pelanggan: ${order.customerName}\n`;
    }
    data += `Toko: ${order.store.name}\n`;
    if (type === 'kitchen') {
      const statusText =
        order.status === 'open' ? 'Belum Bayar' : order.status === 'paid' ? 'Lunas' : 'Dibatalkan';
      data += `Status: ${statusText}\n`;
    }

    // Items
    data += ESCPOS_COMMANDS.FEED;
    data += ESCPOS_COMMANDS.BOLD_ON;
    data += type === 'kitchen' ? 'DAFTAR PESANAN\n' : 'ITEM PESANAN\n';
    data += ESCPOS_COMMANDS.BOLD_OFF;

    for (const item of order.orderItems) {
      data += `${item.quantity}x ${item.product.name}\n`;
      if (type === 'customer') {
        data += `  @ Rp ${Number(item.unitPrice).toLocaleString('id-ID')}\n`;
      }
      if (item.orderItemAddons && item.orderItemAddons.length > 0) {
        for (const addon of item.orderItemAddons) {
          data += `  ${type === 'kitchen' ? '•' : '+'} ${addon.quantity}x ${addon.addon.name}`;
          if (type === 'customer') {
            data += ` @ Rp ${Number(addon.addonPrice).toLocaleString('id-ID')}`;
          }
          data += '\n';
        }
      }
      if (type === 'customer') {
        data += `  Subtotal: Rp ${Number(item.lineTotal).toLocaleString('id-ID')}\n`;
      }
    }

    // Total (customer only)
    if (type === 'customer') {
      data += ESCPOS_COMMANDS.FEED;
      data += '--------------------------------\n';
      data += `Subtotal: Rp ${Number(order.subtotalAmount || order.totalAmount).toLocaleString('id-ID')}\n`;
      if (order.taxAmount > 0) {
        data += `Pajak: Rp ${Number(order.taxAmount).toLocaleString('id-ID')}\n`;
      }
      data += ESCPOS_COMMANDS.BOLD_ON;
      data += `TOTAL: Rp ${Number(order.totalAmount).toLocaleString('id-ID')}\n`;
      data += ESCPOS_COMMANDS.BOLD_OFF;
    }

    // Payment info (customer only)
    if (type === 'customer' && transaction) {
      data += ESCPOS_COMMANDS.FEED;
      data += '--------------------------------\n';
      data += `Metode: ${transaction.paymentMethod?.name || 'Tunai'}\n`;
      data += `Bayar: Rp ${Number(transaction.amount).toLocaleString('id-ID')}\n`;
      if (transaction.change !== undefined && transaction.change > 0) {
        data += `Kembalian: Rp ${Number(transaction.change).toLocaleString('id-ID')}\n`;
      }
    }

    // Footer
    data += ESCPOS_COMMANDS.FEED;
    data += ESCPOS_COMMANDS.ALIGN_CENTER;
    if (type === 'kitchen') {
      data += ESCPOS_COMMANDS.BOLD_ON;
      data += 'PERHATIAN:\n';
      data += 'Siapkan pesanan sesuai item di atas\n';
      data += ESCPOS_COMMANDS.BOLD_OFF;
    } else {
      data += 'Terima kasih atas kunjungan Anda!\n';
      data += 'Semoga Anda puas dengan pelayanan kami\n';
    }
    data += `Dicetak: ${new Date().toLocaleString('id-ID')}\n`;

    // Feed and cut
    data += ESCPOS_COMMANDS.FEED_LINES(3);
    data += ESCPOS_COMMANDS.CUT;

    await this.writeSerial(encoder.encode(data));
  }

  /**
   * Print receipt via server (requires backend API)
   */
  private async printReceiptServer(
    order: any,
    type: 'kitchen' | 'customer',
    transaction?: any
  ): Promise<void> {
    // This would call a backend API endpoint to print
    // For now, we'll throw an error indicating it needs backend implementation
    throw new Error(
      'Server-side printing belum diimplementasikan. Silakan hubungkan printer via Bluetooth atau Serial.'
    );
  }

  /**
   * Test print
   */
  async testPrint(): Promise<void> {
    const connection = this.getConnectionStatus();
    if (!connection || !connection.connected) {
      throw new Error('Printer tidak terhubung.');
    }

    const encoder = new TextEncoder();
    let data = '';

    data += ESCPOS_COMMANDS.INIT;
    data += ESCPOS_COMMANDS.ALIGN_CENTER;
    data += ESCPOS_COMMANDS.FONT_DOUBLE;
    data += 'TEST PRINT\n';
    data += ESCPOS_COMMANDS.FONT_NORMAL;
    data += ESCPOS_COMMANDS.ALIGN_LEFT;
    data += `Waktu: ${new Date().toLocaleString('id-ID')}\n`;
    data += `Metode: ${connection.method}\n`;
    data += ESCPOS_COMMANDS.FEED_LINES(3);
    data += ESCPOS_COMMANDS.CUT;

    if (connection.method === 'bluetooth') {
      await bluetoothPrinterService.printText(data);
    } else if (connection.method === 'serial') {
      await this.writeSerial(encoder.encode(data));
    } else {
      throw new Error('Metode printing tidak didukung untuk test print.');
    }
  }
}

// Export singleton instance
export const printerService = new UniversalPrinterService();





