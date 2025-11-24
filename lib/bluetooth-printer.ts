/**
 * Bluetooth Printer Service
 * Handles connection and printing to Bluetooth thermal printers
 */

export interface BluetoothPrinter {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  characteristic: BluetoothRemoteGATTCharacteristic;
  name: string;
  id: string;
}

// ESC/POS commands for thermal printers
const ESC = '\x1B';
const GS = '\x1D';

export const ESCPOS_COMMANDS = {
  // Initialize printer
  INIT: ESC + '@',
  
  // Text formatting
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',
  
  // Alignment
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  
  // Font size
  FONT_NORMAL: ESC + '!' + '\x00',
  FONT_LARGE: ESC + '!' + '\x10',
  FONT_DOUBLE_WIDTH: ESC + '!' + '\x20',
  FONT_DOUBLE_HEIGHT: ESC + '!' + '\x10',
  FONT_DOUBLE: ESC + '!' + '\x30',
  
  // Line spacing
  LINE_SPACING_DEFAULT: ESC + '2',
  LINE_SPACING_24: ESC + '2' + '\x18',
  LINE_SPACING_30: ESC + '2' + '\x1E',
  
  // Cut paper
  CUT: GS + 'V' + '\x41' + '\x00',
  CUT_PARTIAL: GS + 'V' + '\x42' + '\x00',
  
  // Feed lines
  FEED: '\n',
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
  
  // QR Code (if supported)
  QR_CODE_SIZE: (size: number) => GS + '(k' + '\x03\x00\x31\x43' + String.fromCharCode(size),
  QR_CODE_ERROR: (level: number) => GS + '(k' + '\x03\x00\x31\x45' + String.fromCharCode(level),
  QR_CODE_STORE: (data: string) => {
    const len = data.length + 3;
    return GS + '(k' + String.fromCharCode(len % 256) + String.fromCharCode(Math.floor(len / 256)) + '\x31\x50\x30' + data;
  },
  QR_CODE_PRINT: GS + '(k' + '\x03\x00\x31\x51\x30',
};

class BluetoothPrinterService {
  private printer: BluetoothPrinter | null = null;
  private isConnecting = false;

  /**
   * Check if Web Bluetooth API is supported
   */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Get stored printer from localStorage
   */
  getStoredPrinter(): { id: string; name: string } | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('bluetooth_printer');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Store printer info to localStorage
   */
  private storePrinter(id: string, name: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('bluetooth_printer', JSON.stringify({ id, name }));
  }

  /**
   * Clear stored printer
   */
  clearStoredPrinter(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('bluetooth_printer');
  }

  /**
   * Request Bluetooth device (printer)
   */
  async requestDevice(): Promise<BluetoothDevice> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome atau Edge.');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          // Common thermal printer service UUIDs
          { services: [0xff00] }, // Generic service
          { services: [0xffe0] }, // Serial Port Profile
        ],
        optionalServices: [
          0xff00, // Generic service
          0xffe0, // Serial Port Profile
          0xffe5, // Custom service
        ],
      });

      return device;
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error('Tidak ada printer Bluetooth yang ditemukan.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Akses Bluetooth ditolak. Pastikan browser memiliki izin.');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Bluetooth sedang digunakan. Tutup koneksi lain terlebih dahulu.');
      }
      throw new Error(`Gagal mencari printer: ${error.message}`);
    }
  }

  /**
   * Connect to Bluetooth printer
   */
  async connect(device?: BluetoothDevice): Promise<BluetoothPrinter> {
    if (this.isConnecting) {
      throw new Error('Sedang menghubungkan ke printer...');
    }

    if (this.printer && this.printer.server.connected) {
      return this.printer;
    }

    this.isConnecting = true;

    try {
      let targetDevice = device;

      // If no device provided, try to reconnect to stored device
      if (!targetDevice) {
        const stored = this.getStoredPrinter();
        if (stored) {
          try {
            // Try to reconnect to stored device
            const devices = await navigator.bluetooth.getDevices();
            targetDevice = devices.find((d) => d.id === stored.id) || undefined;
          } catch {
            // If reconnection fails, request new device
            targetDevice = await this.requestDevice();
          }
        } else {
          targetDevice = await this.requestDevice();
        }
      }

      if (!targetDevice) {
        throw new Error('Tidak ada printer yang dipilih.');
      }

      // Connect to GATT server
      const server = await targetDevice.gatt?.connect();
      if (!server) {
        throw new Error('Gagal terhubung ke printer.');
      }

      // Find the service (usually 0xffe0 for thermal printers)
      let service: BluetoothRemoteGATTService | null = null;
      const serviceUUIDs = [0xffe0, 0xff00, 0xffe5];

      for (const uuid of serviceUUIDs) {
        try {
          service = await server.getPrimaryService(uuid);
          if (service) break;
        } catch {
          // Try next service
        }
      }

      if (!service) {
        throw new Error('Service Bluetooth tidak ditemukan pada printer.');
      }

      // Find the characteristic (usually 0xffe1 for write)
      let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
      const charUUIDs = [0xffe1, 0xff01, 0xffe6];

      for (const uuid of charUUIDs) {
        try {
          const characteristics = await service.getCharacteristics(uuid);
          if (characteristics.length > 0) {
            characteristic = characteristics[0];
            break;
          }
        } catch {
          // Try next characteristic
        }
      }

      if (!characteristic) {
        throw new Error('Karakteristik Bluetooth tidak ditemukan pada printer.');
      }

      // Store printer info
      const printerName = targetDevice.name || 'Bluetooth Printer';
      this.storePrinter(targetDevice.id, printerName);

      this.printer = {
        device: targetDevice,
        server,
        characteristic,
        name: printerName,
        id: targetDevice.id,
      };

      // Listen for disconnection
      targetDevice.addEventListener('gattserverdisconnected', () => {
        this.printer = null;
      });

      return this.printer;
    } catch (error: any) {
      this.printer = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.printer) {
      try {
        if (this.printer.server.connected) {
          this.printer.server.disconnect();
        }
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.printer = null;
    }
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.printer !== null && this.printer.server.connected;
  }

  /**
   * Get current printer
   */
  getPrinter(): BluetoothPrinter | null {
    return this.printer;
  }

  /**
   * Write data to printer
   */
  private async write(data: string | Uint8Array): Promise<void> {
    if (!this.printer || !this.printer.server.connected) {
      throw new Error('Printer tidak terhubung. Silakan hubungkan terlebih dahulu.');
    }

    try {
      let dataToWrite: Uint8Array;

      if (typeof data === 'string') {
        // Convert string to Uint8Array (UTF-8 encoding)
        const encoder = new TextEncoder();
        dataToWrite = encoder.encode(data);
      } else {
        dataToWrite = data;
      }

      // Write in chunks if data is too large
      const chunkSize = 20; // BLE characteristic write limit
      for (let i = 0; i < dataToWrite.length; i += chunkSize) {
        const chunk = dataToWrite.slice(i, i + chunkSize);
        await this.printer.characteristic.writeValue(chunk);
        // Small delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } catch (error: any) {
      if (error.message?.includes('not connected')) {
        this.printer = null;
        throw new Error('Printer terputus. Silakan hubungkan kembali.');
      }
      throw new Error(`Gagal mengirim data ke printer: ${error.message}`);
    }
  }

  /**
   * Print text
   */
  async printText(text: string): Promise<void> {
    await this.write(text);
  }

  /**
   * Print receipt with formatting
   */
  async printReceipt(content: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer tidak terhubung.');
    }

    try {
      // Initialize printer
      await this.write(ESCPOS_COMMANDS.INIT);
      
      // Set alignment to center for header
      await this.write(ESCPOS_COMMANDS.ALIGN_CENTER);
      await this.write(ESCPOS_COMMANDS.FONT_DOUBLE);
      
      // Print content (convert HTML-like content to plain text)
      const plainText = this.convertHtmlToPlainText(content);
      await this.write(plainText);
      
      // Feed lines
      await this.write(ESCPOS_COMMANDS.FEED_LINES(3));
      
      // Cut paper
      await this.write(ESCPOS_COMMANDS.CUT);
    } catch (error: any) {
      throw new Error(`Gagal mencetak: ${error.message}`);
    }
  }

  /**
   * Convert HTML content to plain text for thermal printer
   */
  private convertHtmlToPlainText(html: string): string {
    // Remove HTML tags and convert to plain text
    let text = html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Format text for thermal printer (80mm width, ~48 chars)
    const maxWidth = 48;
    const lines = text.split('\n');
    const formattedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= maxWidth) {
        formattedLines.push(line);
      } else {
        // Word wrap
        const words = line.split(' ');
        let currentLine = '';
        for (const word of words) {
          if ((currentLine + word).length <= maxWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) formattedLines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) formattedLines.push(currentLine);
      }
    }

    return formattedLines.join('\n');
  }

  /**
   * Print formatted receipt from order data
   */
  async printFormattedReceipt(
    order: any,
    type: 'kitchen' | 'customer',
    transaction?: any
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer tidak terhubung.');
    }

    try {
      let receipt = '';

      // Initialize
      await this.write(ESCPOS_COMMANDS.INIT);
      await this.write(ESCPOS_COMMANDS.ALIGN_CENTER);
      await this.write(ESCPOS_COMMANDS.FONT_DOUBLE);
      receipt += 'SiBubur\n';
      receipt += 'Sistem Point of Sale\n';
      await this.write(receipt);
      receipt = '';

      // Receipt type
      await this.write(ESCPOS_COMMANDS.FEED);
      await this.write(ESCPOS_COMMANDS.FONT_NORMAL);
      await this.write(ESCPOS_COMMANDS.BOLD_ON);
      receipt += type === 'kitchen' ? 'STRUK DAPUR\n' : 'STRUK PELANGGAN\n';
      await this.write(receipt);
      receipt = '';
      await this.write(ESCPOS_COMMANDS.BOLD_OFF);

      // Order info
      await this.write(ESCPOS_COMMANDS.ALIGN_LEFT);
      await this.write(ESCPOS_COMMANDS.FEED);
      receipt += `No. Order: ${order.orderNumber}\n`;
      receipt += `Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}\n`;
      if (order.customerName) {
        receipt += `Pelanggan: ${order.customerName}\n`;
      }
      receipt += `Toko: ${order.store.name}\n`;
      if (type === 'kitchen') {
        const statusText =
          order.status === 'open'
            ? 'Belum Bayar'
            : order.status === 'paid'
            ? 'Lunas'
            : 'Dibatalkan';
        receipt += `Status: ${statusText}\n`;
      }
      await this.write(receipt);
      receipt = '';

      // Items
      await this.write(ESCPOS_COMMANDS.FEED);
      await this.write(ESCPOS_COMMANDS.BOLD_ON);
      receipt += type === 'kitchen' ? 'DAFTAR PESANAN\n' : 'ITEM PESANAN\n';
      await this.write(receipt);
      receipt = '';
      await this.write(ESCPOS_COMMANDS.BOLD_OFF);

      for (const item of order.orderItems) {
        receipt += `${item.quantity}x ${item.product.name}\n`;
        if (type === 'customer') {
          receipt += `  @ Rp ${Number(item.unitPrice).toLocaleString('id-ID')}\n`;
        }
        if (item.orderItemAddons && item.orderItemAddons.length > 0) {
          for (const addon of item.orderItemAddons) {
            receipt += `  ${type === 'kitchen' ? '•' : '+'} ${addon.quantity}x ${addon.addon.name}`;
            if (type === 'customer') {
              receipt += ` @ Rp ${Number(addon.addonPrice).toLocaleString('id-ID')}`;
            }
            receipt += '\n';
          }
        }
        if (type === 'customer') {
          receipt += `  Subtotal: Rp ${Number(item.lineTotal).toLocaleString('id-ID')}\n`;
        }
        await this.write(receipt);
        receipt = '';
      }

      // Total (customer only)
      if (type === 'customer') {
        await this.write(ESCPOS_COMMANDS.FEED);
        receipt += '--------------------------------\n';
        receipt += `Subtotal: Rp ${Number(order.subtotalAmount || order.totalAmount).toLocaleString('id-ID')}\n`;
        if (order.taxAmount > 0) {
          receipt += `Pajak: Rp ${Number(order.taxAmount).toLocaleString('id-ID')}\n`;
        }
        await this.write(ESCPOS_COMMANDS.BOLD_ON);
        receipt += `TOTAL: Rp ${Number(order.totalAmount).toLocaleString('id-ID')}\n`;
        await this.write(receipt);
        receipt = '';
        await this.write(ESCPOS_COMMANDS.BOLD_OFF);
      }

      // Payment info (customer only)
      if (type === 'customer' && transaction) {
        await this.write(ESCPOS_COMMANDS.FEED);
        receipt += '--------------------------------\n';
        receipt += `Metode: ${transaction.paymentMethod?.name || 'Tunai'}\n`;
        receipt += `Bayar: Rp ${Number(transaction.amount).toLocaleString('id-ID')}\n`;
        if (transaction.change !== undefined && transaction.change > 0) {
          receipt += `Kembalian: Rp ${Number(transaction.change).toLocaleString('id-ID')}\n`;
        }
        await this.write(receipt);
        receipt = '';
      }

      // Footer
      await this.write(ESCPOS_COMMANDS.FEED);
      await this.write(ESCPOS_COMMANDS.ALIGN_CENTER);
      if (type === 'kitchen') {
        await this.write(ESCPOS_COMMANDS.BOLD_ON);
        receipt += 'PERHATIAN:\n';
        receipt += 'Siapkan pesanan sesuai item di atas\n';
        await this.write(receipt);
        receipt = '';
        await this.write(ESCPOS_COMMANDS.BOLD_OFF);
      } else {
        receipt += 'Terima kasih atas kunjungan Anda!\n';
        receipt += 'Semoga Anda puas dengan pelayanan kami\n';
        await this.write(receipt);
        receipt = '';
      }
      receipt += `Dicetak: ${new Date().toLocaleString('id-ID')}\n`;
      await this.write(receipt);

      // Feed and cut
      await this.write(ESCPOS_COMMANDS.FEED_LINES(3));
      await this.write(ESCPOS_COMMANDS.CUT);
    } catch (error: any) {
      throw new Error(`Gagal mencetak struk: ${error.message}`);
    }
  }
}

// Export singleton instance
export const bluetoothPrinterService = new BluetoothPrinterService();

