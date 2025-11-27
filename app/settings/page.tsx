'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { printerService, PrinterConnection } from '@/lib/printer-service';
import { bluetoothPrinterService, BrowserCompatibility } from '@/lib/bluetooth-printer';
import { getPrintSettings, savePrintSettings, type PrintSettings } from '@/lib/print-settings';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [connection, setConnection] = useState<PrinterConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'bluetooth' | 'serial'>('bluetooth');
  const [browserCompatibility, setBrowserCompatibility] = useState<BrowserCompatibility | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(getPrintSettings());

  useEffect(() => {
    // Load print settings
    setPrintSettings(getPrintSettings());

    // Check available methods
    const methods = printerService.getAvailableMethods();
    setAvailableMethods(methods);

    // Check browser compatibility
    const compatibility = bluetoothPrinterService.getBrowserCompatibility();
    setBrowserCompatibility(compatibility);

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

    // Check if PWA is already installed
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        showToast('Aplikasi berhasil diinstall!', 'success');
      });

      return () => {
        clearInterval(interval);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => clearInterval(interval);
  }, [showToast]);

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

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      showToast('Aplikasi sudah terinstall atau tidak dapat diinstall di browser ini', 'info');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        showToast('Aplikasi sedang diinstall...', 'success');
      } else {
        showToast('Installasi dibatalkan', 'info');
      }
      
      setDeferredPrompt(null);
    } catch (error: any) {
      showToast('Gagal menginstall aplikasi', 'error');
    }
  };

  const handleToggleAutoPrintKitchen = (enabled: boolean) => {
    const newSettings = { ...printSettings, autoPrintKitchen: enabled };
    savePrintSettings({ autoPrintKitchen: enabled });
    setPrintSettings(newSettings);
    showToast(
      enabled 
        ? 'Auto print struk dapur diaktifkan' 
        : 'Auto print struk dapur dinonaktifkan',
      'success'
    );
  };

  const handleToggleAutoPrintCustomer = (enabled: boolean) => {
    const newSettings = { ...printSettings, autoPrintCustomer: enabled };
    savePrintSettings({ autoPrintCustomer: enabled });
    setPrintSettings(newSettings);
    showToast(
      enabled 
        ? 'Auto print struk pelanggan diaktifkan' 
        : 'Auto print struk pelanggan dinonaktifkan',
      'success'
    );
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
          {browserCompatibility && (
            <div className={`mb-6 p-4 border rounded-lg ${
              browserCompatibility.supported && !browserCompatibility.requiresHttps
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start">
                <svg
                  className={`w-5 h-5 mt-0.5 mr-3 ${
                    browserCompatibility.supported && !browserCompatibility.requiresHttps
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {browserCompatibility.supported && !browserCompatibility.requiresHttps ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <div className="flex-1">
                  <h3 className={`text-sm font-medium ${
                    browserCompatibility.supported && !browserCompatibility.requiresHttps
                      ? 'text-green-800'
                      : 'text-yellow-800'
                  }`}>
                    {browserCompatibility.supported && !browserCompatibility.requiresHttps
                      ? 'Browser Mendukung Web Bluetooth'
                      : 'Peringatan Kompatibilitas Browser'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className={browserCompatibility.supported && !browserCompatibility.requiresHttps
                      ? 'text-green-700'
                      : 'text-yellow-700'
                    }>
                      {browserCompatibility.message}
                    </p>
                    <div className="text-xs text-slate-600 mt-2">
                      <p><strong>Browser:</strong> {browserCompatibility.browser}</p>
                      <p><strong>Platform:</strong> {browserCompatibility.platform}</p>
                      {browserCompatibility.requiresHttps && (
                        <p className="text-yellow-700 font-medium mt-1">
                          ⚠️ Web Bluetooth memerlukan HTTPS (kecuali localhost)
                        </p>
                      )}
                    </div>
                    {!browserCompatibility.supported && (
                      <div className="mt-3 p-2 bg-white rounded border border-yellow-300">
                        <p className="text-xs font-semibold text-slate-800 mb-1">Browser yang Didukung:</p>
                        <ul className="text-xs text-slate-700 list-disc list-inside space-y-0.5">
                          <li>Chrome (Windows, Android, Chrome OS)</li>
                          <li>Microsoft Edge</li>
                          <li>Opera</li>
                        </ul>
                        <p className="text-xs text-slate-600 mt-2">
                          <strong>Catatan:</strong> Firefox dan Safari tidak mendukung Web Bluetooth API.
                          Alternatif: gunakan print browser standar atau aplikasi mobile.
                        </p>
                      </div>
                    )}
                  </div>
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

          {/* Print Settings */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Pengaturan Print Struk
            </h2>
            <div className="space-y-4">
              {/* Auto Print Kitchen Receipt */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Auto Print Struk Dapur
                    </h3>
                    <p className="text-sm text-slate-600">
                      {printSettings.autoPrintKitchen
                        ? 'Struk dapur akan otomatis dicetak setelah pesanan dibuat'
                        : 'Tombol dan modal print struk dapur akan disembunyikan'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAutoPrintKitchen(!printSettings.autoPrintKitchen)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      printSettings.autoPrintKitchen ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        printSettings.autoPrintKitchen ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Auto Print Customer Receipt */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Auto Print Struk Pelanggan
                    </h3>
                    <p className="text-sm text-slate-600">
                      {printSettings.autoPrintCustomer
                        ? 'Struk pelanggan akan otomatis dicetak setelah pembayaran'
                        : 'Tombol dan modal print struk pelanggan akan disembunyikan'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAutoPrintCustomer(!printSettings.autoPrintCustomer)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      printSettings.autoPrintCustomer ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        printSettings.autoPrintCustomer ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PWA Install */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Install Aplikasi
            </h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {isInstalled ? 'Aplikasi Terinstall' : 'Install Aplikasi SiBubur'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {isInstalled
                        ? 'Aplikasi sudah terinstall di perangkat Anda'
                        : 'Install aplikasi untuk akses lebih cepat dan dapat digunakan offline'}
                    </p>
                  </div>
                </div>
                {!isInstalled && deferredPrompt && (
                  <button
                    onClick={handleInstallPWA}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Install App
                  </button>
                )}
                {isInstalled && (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    ✓ Terinstall
                  </span>
                )}
                {!isInstalled && !deferredPrompt && (
                  <span className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm">
                    Tidak Tersedia
                  </span>
                )}
              </div>
              {!isInstalled && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    <strong>Catatan:</strong> Fitur install aplikasi tersedia di browser yang mendukung PWA 
                    (Chrome, Edge, Safari iOS). Pastikan Anda menggunakan HTTPS atau localhost.
                  </p>
                </div>
              )}
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

