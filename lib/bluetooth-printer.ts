/**
 * Bluetooth Printer Service
 * Handles connection and printing to Bluetooth thermal printers
 * 
 * Browser Compatibility:
 * - Chrome/Edge (Windows, Android, Chrome OS): Full support
 * - Opera: Full support
 * - Firefox: Not supported
 * - Safari: Not supported
 * 
 * Note: Web Bluetooth API requires HTTPS (except localhost)
 * 
 * Packages used:
 * - escpos-buffer: For generating ESC/POS command buffers
 * - escpos-printer-bt: Alternative implementation (optional)
 */

import { Order, Transaction } from '@/types';

type EscposPrinterCtor = new () => { encode: () => Uint8Array };
let EscposPrinter: EscposPrinterCtor | null = null;

import('escpos-buffer')
  .then((escposBuffer) => {
    const maybePrinter = (escposBuffer as unknown as { Printer?: EscposPrinterCtor; default?: EscposPrinterCtor }).Printer
      || (escposBuffer as unknown as { default?: EscposPrinterCtor }).default;
    EscposPrinter = maybePrinter || null;
  })
  .catch(() => {
    console.warn('escpos-buffer not available, using manual ESC/POS commands');
  });

export interface BluetoothPrinter {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  characteristic: BluetoothRemoteGATTCharacteristic;
  name: string;
  id: string;
}

export interface BrowserCompatibility {
  supported: boolean;
  browser: string;
  platform: string;
  requiresHttps: boolean;
  message: string;
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
   * Get detailed browser compatibility information
   */
  getBrowserCompatibility(): BrowserCompatibility {
    if (typeof navigator === 'undefined') {
      return {
        supported: false,
        browser: 'Unknown',
        platform: 'Unknown',
        requiresHttps: true,
        message: 'Tidak dapat mendeteksi browser (Server-side rendering)',
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
    const isEdge = userAgent.includes('edg');
    const isOpera = userAgent.includes('opr') || userAgent.includes('opera');
    const isFirefox = userAgent.includes('firefox');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    
    const isHttps = typeof window !== 'undefined' && 
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const supported = this.isSupported() && (isChrome || isEdge || isOpera);
    
    let browser = 'Unknown';
    if (isChrome) browser = 'Chrome';
    else if (isEdge) browser = 'Edge';
    else if (isOpera) browser = 'Opera';
    else if (isFirefox) browser = 'Firefox';
    else if (isSafari) browser = 'Safari';

    let message = '';
    if (!supported) {
      if (isFirefox) {
        message = 'Firefox tidak mendukung Web Bluetooth API. Gunakan Chrome, Edge, atau Opera.';
      } else if (isSafari) {
        message = 'Safari tidak mendukung Web Bluetooth API. Gunakan Chrome, Edge, atau Opera.';
      } else {
        message = 'Browser ini tidak mendukung Web Bluetooth API. Gunakan Chrome, Edge, atau Opera.';
      }
    } else if (!isHttps) {
      message = 'Web Bluetooth API memerlukan koneksi HTTPS (kecuali localhost).';
    } else {
      message = 'Browser mendukung Web Bluetooth API.';
    }

    return {
      supported,
      browser,
      platform: navigator.platform || 'Unknown',
      requiresHttps: !isHttps,
      message,
    };
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
   * Supports multiple service UUIDs for different printer models
   */
  async requestDevice(): Promise<BluetoothDevice> {
    const compatibility = this.getBrowserCompatibility();
    
    if (!this.isSupported() || !navigator.bluetooth) {
      throw new Error(compatibility.message || 'Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome atau Edge.');
    }

    if (compatibility.requiresHttps) {
      throw new Error('Web Bluetooth API memerlukan koneksi HTTPS. Pastikan Anda menggunakan HTTPS atau localhost.');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          // Common thermal printer service UUIDs
          { services: [0xff00] }, // Generic service
          { services: [0xffe0] }, // Serial Port Profile (SPP) - Most common
          { services: [0xffe5] }, // Custom service
        ],
        optionalServices: [
          0xff00, // Generic service
          0xffe0, // Serial Port Profile
          0xffe5, // Custom service
          0xfff0, // Additional service
        ],
      });

      return device;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error) {
        const errName = (error as { name?: string }).name;
        if (errName === 'NotFoundError') {
          throw new Error('Tidak ada printer Bluetooth yang ditemukan. Pastikan printer dalam keadaan menyala dan dapat ditemukan.');
        }
        if (errName === 'SecurityError') {
          throw new Error('Akses Bluetooth ditolak. Pastikan browser memiliki izin dan printer sudah dipasangkan (paired).');
        }
        if (errName === 'InvalidStateError') {
          throw new Error('Bluetooth sedang digunakan. Tutup koneksi lain terlebih dahulu.');
        }
        if (errName === 'NetworkError') {
          throw new Error('Gagal terhubung ke printer. Pastikan printer dalam jangkauan dan tidak terhubung ke perangkat lain.');
        }
      }
      const message = error instanceof Error ? error.message : 'Gagal mencari printer';
      throw new Error(`Gagal mencari printer: ${message}`);
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
            if (!navigator.bluetooth) {
              throw new Error('Web Bluetooth tidak tersedia');
            }
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
      // Try multiple service UUIDs to support different printer models
      let service: BluetoothRemoteGATTService | null = null;
      const serviceUUIDs = [
        0xffe0, // Serial Port Profile (SPP) - Most common for thermal printers
        0xff00, // Generic service
        0xffe5, // Custom service
        0xfff0, // Additional service
      ];

      for (const uuid of serviceUUIDs) {
        try {
          service = await server.getPrimaryService(uuid);
          if (service) {
            console.log(`Found service: ${uuid.toString(16)}`);
            break;
          }
        } catch (error) {
          // Try next service
          console.log(`Service ${uuid.toString(16)} not found, trying next...`, error);
        }
      }

      if (!service) {
        // Try to get all services as fallback
        try {
          const services = await server.getPrimaryServices();
          if (services.length > 0) {
            service = services[0];
            console.log(`Using first available service: ${service.uuid}`);
          }
        } catch (error) {
          console.error('Service Bluetooth tidak ditemukan pada printer. Pastikan printer mendukung BLE dan sudah dipasangkan.', error);
          throw new Error('Service Bluetooth tidak ditemukan pada printer. Pastikan printer mendukung BLE dan sudah dipasangkan.');
        }
      }

      if (!service) {
        throw new Error('Service Bluetooth tidak ditemukan pada printer. Pastikan printer mendukung BLE.');
      }

      // Find the characteristic (usually 0xffe1 for write)
      // Try multiple characteristic UUIDs to support different printer models
      let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
      const charUUIDs = [
        0xffe1, // Write characteristic - Most common
        0xff01, // Alternative write characteristic
        0xffe6, // Custom characteristic
        0xfff1, // Additional characteristic
      ];

      for (const uuid of charUUIDs) {
        try {
          const characteristics = await service.getCharacteristics(uuid);
          if (characteristics.length > 0) {
            characteristic = characteristics[0];
            console.log(`Found characteristic: ${uuid.toString(16)}`);
            break;
          }
        } catch (error) {
          // Try next characteristic
          console.log(`Characteristic ${uuid.toString(16)} not found, trying next...`, error);
        }
      }

      if (!characteristic) {
        // Try to get all characteristics as fallback
        try {
          const characteristics = await service.getCharacteristics();
          // Find write characteristic (has write property)
          characteristic = characteristics.find(
            (char) => char.properties.write || char.properties.writeWithoutResponse
          ) || null;
          if (characteristic) {
            console.log(`Using first writable characteristic: ${characteristic.uuid}`);
          }
        } catch (error) {
          console.error('Karakteristik Bluetooth tidak ditemukan pada printer.', error);
          throw new Error('Karakteristik Bluetooth tidak ditemukan pada printer.');
        }
      }

      if (!characteristic) {
        throw new Error('Karakteristik Bluetooth tidak ditemukan pada printer. Pastikan printer mendukung BLE write.');
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
    } catch (error: unknown) {
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
      // BLE characteristic write limit is typically 20 bytes, but some support up to 512
      const chunkSize = this.printer.characteristic.properties.writeWithoutResponse ? 20 : 20;
      const writeMethod = this.printer.characteristic.properties.writeWithoutResponse
        ? 'writeValueWithoutResponse'
        : 'writeValue';

      for (let i = 0; i < dataToWrite.length; i += chunkSize) {
        const chunk = dataToWrite.slice(i, i + chunkSize);
        
        if (writeMethod === 'writeValueWithoutResponse') {
          await this.printer.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.printer.characteristic.writeValue(chunk);
        }
        
        // Small delay between chunks to prevent buffer overflow
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        const msg = (error as { message?: string }).message;
        if (msg?.includes('not connected')) {
          this.printer = null;
          throw new Error('Printer terputus. Silakan hubungkan kembali.');
        }
        throw new Error(`Gagal mengirim data ke printer: ${msg}`);
      }
      throw new Error('Gagal mengirim data ke printer.');
    }
  }

  /**
   * Print text
   */
  async printText(text: string): Promise<void> {
    await this.write(text);
  }

  /**
   * Generate ESC/POS buffer using escpos-buffer package (if available)
   * Falls back to manual commands if package is not available
   */
  private generateEscPosBuffer(commands: (printer: InstanceType<EscposPrinterCtor>) => void): Uint8Array | null {
    if (!EscposPrinter) {
      return null; // Will use fallback method
    }
    
    try {
      const printer = new EscposPrinter();
      commands(printer);
      return printer.encode();
    } catch (error) {
      console.warn('Error using escpos-buffer, will use fallback:', error);
      return null;
    }
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal mencetak';
      throw new Error(`Gagal mencetak: ${message}`);
    }
  }

  /**
   * Convert HTML content to plain text for thermal printer
   */
  private convertHtmlToPlainText(html: string): string {
    // Remove HTML tags and convert to plain text
    const text = html
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
   * Uses escpos-buffer for better command generation
   */
  async printFormattedReceipt(
    order: Order,
    type: 'kitchen' | 'customer',
    transaction?: Transaction
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer tidak terhubung.');
    }

    try {
      // Try to use escpos-buffer for better command generation
      const buffer = this.generateEscPosBuffer((printer) => {
        // Note: escpos-buffer API may vary, so we'll use fallback for now
        // This is a placeholder for future enhancement
        return printer;
      });

      if (buffer) {
        // Send the buffer to printer if escpos-buffer is available
        await this.write(buffer);
        return;
      }

      // Fallback to manual ESC/POS commands (current implementation)
      await this.printFormattedReceiptFallback(order, type, transaction);
    } catch (error: unknown) {
      // Fallback to original method if escpos-buffer fails
      console.warn('Error using escpos-buffer, falling back to manual commands:', error);
      await this.printFormattedReceiptFallback(order, type, transaction);
    }
  }

  /**
   * Fallback method using manual ESC/POS commands
   */
  private async printFormattedReceiptFallback(
    order: Order,
    type: 'kitchen' | 'customer',
    transaction?: Transaction
  ): Promise<void> {
    let receipt = '';

    // Initialize
    await this.write(ESCPOS_COMMANDS.INIT);
    await this.write(ESCPOS_COMMANDS.ALIGN_CENTER);
    await this.write(ESCPOS_COMMANDS.FONT_DOUBLE);
    receipt += 'Bubur Ayam\n';
    receipt += 'Lembur Kuring\n';
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
  }
}

// Export singleton instance
export const bluetoothPrinterService = new BluetoothPrinterService();
