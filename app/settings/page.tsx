'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import {
  bluetoothPrinterService,
  BluetoothPrinter,
} from '@/lib/bluetooth-printer';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [printer, setPrinter] = useState<BluetoothPrinter | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [storedPrinter, setStoredPrinter] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    // Check if Web Bluetooth is supported
    setIsSupported(bluetoothPrinterService.isSupported());

    // Check for stored printer
    const stored = bluetoothPrinterService.getStoredPrinter();
    setStoredPrinter(stored);

    // Check if already connected
    if (bluetoothPrinterService.isConnected()) {
      setPrinter(bluetoothPrinterService.getPrinter());
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const connectedPrinter = await bluetoothPrinterService.connect();
      setPrinter(connectedPrinter);
      setStoredPrinter({ id: connectedPrinter.id, name: connectedPrinter.name });
      showToast('Berhasil terhubung ke printer Bluetooth', 'success');
    } catch (error: any) {
      showToast(error.message || 'Gagal terhubung ke printer', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await bluetoothPrinterService.disconnect();
      setPrinter(null);
      showToast('Berhasil memutuskan koneksi printer', 'success');
    } catch (error: any) {
      showToast(error.message || 'Gagal memutuskan koneksi', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleTestPrint = async () => {
    if (!printer) {
      showToast('Printer tidak terhubung', 'error');
      return;
    }

    try {
      await bluetoothPrinterService.printText(
        '\x1B@' + // Initialize
        '\x1Ba\x01' + // Center align
        '\x1B!\x30' + // Double size
        'TEST PRINT\n' +
        '\x1B!\x00' + // Normal size
        '\x1Ba\x00' + // Left align
        'Printer Bluetooth Test\n' +
        `Waktu: ${new Date().toLocaleString('id-ID')}\n` +
        `Printer: ${printer.name}\n` +
        '\n\n\n' +
        '\x1DVA\x00' // Cut
      );
      showToast('Test print berhasil dikirim ke printer', 'success');
    } catch (error: any) {
      showToast(error.message || 'Gagal mengirim test print', 'error');
    }
  };

  const handleClearStored = () => {
    bluetoothPrinterService.clearStoredPrinter();
    setStoredPrinter(null);
    showToast('Data printer tersimpan telah dihapus', 'success');
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Pengaturan Printer Bluetooth
          </h1>

          {/* Browser Support Check */}
          {!isSupported && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Web Bluetooth tidak didukung
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Browser Anda tidak mendukung Web Bluetooth API. Silakan
                    gunakan Chrome, Edge, atau Opera untuk fitur ini.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Status Koneksi
            </h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      printer && bluetoothPrinterService.isConnected()
                        ? 'bg-green-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      {printer && bluetoothPrinterService.isConnected()
                        ? 'Terhubung'
                        : 'Tidak Terhubung'}
                    </p>
                    {printer && (
                      <p className="text-sm text-slate-600">{printer.name}</p>
                    )}
                    {!printer && storedPrinter && (
                      <p className="text-sm text-slate-600">
                        Printer tersimpan: {storedPrinter.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {printer && bluetoothPrinterService.isConnected() ? (
                    <>
                      <button
                        onClick={handleTestPrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Test Print
                      </button>
                      <button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDisconnecting ? 'Memutuskan...' : 'Putuskan'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={!isSupported || isConnecting}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? 'Menghubungkan...' : 'Hubungkan Printer'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stored Printer Info */}
          {storedPrinter && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Printer Tersimpan
              </h2>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {storedPrinter.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      ID: {storedPrinter.id}
                    </p>
                  </div>
                  <button
                    onClick={handleClearStored}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Petunjuk Penggunaan
            </h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                <li>Pastikan printer Bluetooth dalam keadaan menyala</li>
                <li>
                  Pastikan printer sudah dipasangkan (paired) dengan perangkat
                  Anda
                </li>
                <li>Klik tombol "Hubungkan Printer"</li>
                <li>
                  Pilih printer dari daftar yang muncul (browser akan meminta
                  izin)
                </li>
                <li>
                  Setelah terhubung, printer akan otomatis digunakan untuk
                  mencetak struk
                </li>
                <li>
                  Gunakan tombol "Test Print" untuk menguji koneksi printer
                </li>
              </ol>
            </div>
          </div>

          {/* Technical Info */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Informasi Teknis
            </h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium">Browser:</span>{' '}
                  {typeof navigator !== 'undefined'
                    ? navigator.userAgent.split(' ')[0]
                    : 'Unknown'}
                </p>
                <p>
                  <span className="font-medium">Web Bluetooth:</span>{' '}
                  {isSupported ? 'Didukung' : 'Tidak Didukung'}
                </p>
                <p>
                  <span className="font-medium">Status Koneksi:</span>{' '}
                  {printer && bluetoothPrinterService.isConnected()
                    ? 'Aktif'
                    : 'Tidak Aktif'}
                </p>
                {printer && (
                  <>
                    <p>
                      <span className="font-medium">Nama Printer:</span>{' '}
                      {printer.name}
                    </p>
                    <p>
                      <span className="font-medium">ID Printer:</span>{' '}
                      {printer.id}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

