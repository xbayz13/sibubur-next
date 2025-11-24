'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { printerService, PrinterConnection } from '@/lib/printer-service';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [connection, setConnection] = useState<PrinterConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'bluetooth' | 'serial'>('bluetooth');

  useEffect(() => {
    // Check available methods
    const methods = printerService.getAvailableMethods();
    setAvailableMethods(methods);

    // Check current connection
    const currentConnection = printerService.getConnectionStatus();
    setConnection(currentConnection);
    if (currentConnection) {
      setSelectedMethod(currentConnection.method as 'bluetooth' | 'serial');
    }

    // Poll for connection status
    const interval = setInterval(() => {
      const status = printerService.getConnectionStatus();
      setConnection(status);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (selectedMethod === 'bluetooth') {
        await printerService.connectBluetooth();
        showToast('Berhasil terhubung ke printer Bluetooth', 'success');
      } else if (selectedMethod === 'serial') {
        await printerService.connectSerial();
        showToast('Berhasil terhubung ke printer Serial/USB', 'success');
      }
      const status = printerService.getConnectionStatus();
      setConnection(status);
    } catch (error: any) {
      showToast(error.message || 'Gagal terhubung ke printer', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      if (connection?.method === 'bluetooth') {
        await printerService.disconnectBluetooth();
      } else if (connection?.method === 'serial') {
        await printerService.disconnectSerial();
      }
      setConnection(null);
      showToast('Berhasil memutuskan koneksi printer', 'success');
    } catch (error: any) {
      showToast(error.message || 'Gagal memutuskan koneksi', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleTestPrint = async () => {
    if (!connection || !connection.connected) {
      showToast('Printer tidak terhubung', 'error');
      return;
    }

    try {
      await printerService.testPrint();
      showToast('Test print berhasil dikirim ke printer', 'success');
    } catch (error: any) {
      showToast(error.message || 'Gagal mengirim test print', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Pengaturan Printer
          </h1>

          {/* Method Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Pilih Metode Koneksi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMethod('bluetooth')}
                disabled={!availableMethods.includes('bluetooth')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === 'bluetooth'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                } ${
                  !availableMethods.includes('bluetooth')
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Bluetooth</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Untuk printer Bluetooth wireless
                    </p>
                  </div>
                  {availableMethods.includes('bluetooth') ? (
                    <span className="text-green-600 text-sm">✓ Tersedia</span>
                  ) : (
                    <span className="text-slate-400 text-sm">✗ Tidak didukung</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('serial')}
                disabled={!availableMethods.includes('serial')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === 'serial'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                } ${
                  !availableMethods.includes('serial')
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Serial/USB</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Untuk printer USB atau Serial
                    </p>
                  </div>
                  {availableMethods.includes('serial') ? (
                    <span className="text-green-600 text-sm">✓ Tersedia</span>
                  ) : (
                    <span className="text-slate-400 text-sm">✗ Tidak didukung</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Browser Support Info */}
          {!availableMethods.includes('bluetooth') && !availableMethods.includes('serial') && (
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
                    Browser tidak mendukung Web Bluetooth/Serial API
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Browser Anda tidak mendukung Web Bluetooth atau Web Serial API. 
                    Silakan gunakan Chrome, Edge, atau Opera untuk fitur ini. 
                    Alternatif: gunakan print browser standar.
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
                      connection && connection.connected
                        ? 'bg-green-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      {connection && connection.connected
                        ? 'Terhubung'
                        : 'Tidak Terhubung'}
                    </p>
                    {connection && (
                      <p className="text-sm text-slate-600">
                        {connection.name} ({connection.method})
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {connection && connection.connected ? (
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
                      disabled={
                        (!availableMethods.includes(selectedMethod) || isConnecting)
                      }
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting
                        ? 'Menghubungkan...'
                        : `Hubungkan ${selectedMethod === 'bluetooth' ? 'Bluetooth' : 'Serial/USB'}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Instructions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Petunjuk Penggunaan
            </h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">
                    Untuk Printer Bluetooth:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 ml-2">
                    <li>Pastikan printer Bluetooth dalam keadaan menyala</li>
                    <li>Pastikan printer sudah dipasangkan (paired) dengan perangkat</li>
                    <li>Pilih metode "Bluetooth" dan klik "Hubungkan Bluetooth"</li>
                    <li>Pilih printer dari daftar yang muncul (browser akan meminta izin)</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">
                    Untuk Printer USB/Serial:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 ml-2">
                    <li>Hubungkan printer ke komputer via USB</li>
                    <li>Pastikan printer dalam keadaan menyala</li>
                    <li>Pilih metode "Serial/USB" dan klik "Hubungkan Serial/USB"</li>
                    <li>Pilih port printer dari daftar yang muncul</li>
                  </ol>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-sm text-slate-700">
                    <strong>Catatan:</strong> Setelah terhubung, printer akan otomatis digunakan untuk mencetak struk. 
                    Gunakan tombol "Test Print" untuk menguji koneksi printer.
                  </p>
                </div>
              </div>
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
                  {availableMethods.includes('bluetooth') ? 'Didukung' : 'Tidak Didukung'}
                </p>
                <p>
                  <span className="font-medium">Web Serial:</span>{' '}
                  {availableMethods.includes('serial') ? 'Didukung' : 'Tidak Didukung'}
                </p>
                <p>
                  <span className="font-medium">Status Koneksi:</span>{' '}
                  {connection && connection.connected ? 'Aktif' : 'Tidak Aktif'}
                </p>
                {connection && (
                  <>
                    <p>
                      <span className="font-medium">Nama Printer:</span>{' '}
                      {connection.name}
                    </p>
                    <p>
                      <span className="font-medium">Metode:</span>{' '}
                      {connection.method}
                    </p>
                    <p>
                      <span className="font-medium">ID:</span> {connection.id}
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

