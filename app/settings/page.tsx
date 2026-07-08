'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { printerService, PrinterConnection } from '@/lib/printer-service';
import { bluetoothPrinterService, BrowserCompatibility } from '@/lib/bluetooth-printer';
import { getPrintSettings, savePrintSettings, type PrintSettings } from '@/lib/print-settings';
import { getInstantPaymentSettings, saveInstantPaymentSettings, type InstantPaymentSettings } from '@/lib/instant-payment-settings';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function SettingsPage() {
  const { showToast } = useToast();
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [connection, setConnection] = useState<PrinterConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'bluetooth' | 'serial'>('bluetooth');
  const [browserCompatibility, setBrowserCompatibility] = useState<BrowserCompatibility | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(getPrintSettings());
  const [instantPaymentSettings, setInstantPaymentSettings] = useState<InstantPaymentSettings>(getInstantPaymentSettings());

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: string }).message;
      if (message) return message;
    }
    return fallback;
  };

  useEffect(() => {
    // Load print settings
    setPrintSettings(getPrintSettings());
    // Load instant payment settings
    setInstantPaymentSettings(getInstantPaymentSettings());

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

    // Poll for connection status (3s to reduce CPU usage from frequent re-renders)
    const interval = setInterval(() => {
      const status = printerService.getConnectionStatus();
      setConnection(status);
    }, 3000);

    // Check if PWA is already installed
    if (typeof window !== 'undefined') {
      const navWithStandalone = window.navigator as Navigator & { standalone?: boolean };
      if (window.matchMedia('(display-mode: standalone)').matches || navWithStandalone.standalone) {
        setIsInstalled(true);
      }

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        showToast('Aplikasi berhasil diinstall!', 'success');
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        clearInterval(interval);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
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
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal terhubung ke printer'), 'error');
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
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal memutuskan koneksi'), 'error');
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
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal mengirim test print'), 'error');
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
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal menginstall aplikasi'), 'error');
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

  const handleToggleInstantPayment = (enabled: boolean) => {
    const newSettings = { ...instantPaymentSettings, enabled };
    saveInstantPaymentSettings({ enabled });
    setInstantPaymentSettings(newSettings);
    showToast(
      enabled 
        ? 'Instant payment diaktifkan - Form pembayaran akan muncul langsung setelah pesanan dibuat' 
        : 'Instant payment dinonaktifkan',
      'success'
    );
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">
            Pengaturan
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Pengaturan printer dan aplikasi
          </p>
        </div>

        <Card title="Pengaturan Printer">

          {/* Method Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Pilih Metode Koneksi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMethod('bluetooth')}
                disabled={!availableMethods.includes('bluetooth')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === 'bluetooth'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-500'
                } ${
                  !availableMethods.includes('bluetooth')
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white/90">Bluetooth</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Untuk printer Bluetooth wireless
                    </p>
                  </div>
                  {availableMethods.includes('bluetooth') ? (
                    <span className="text-green-600 dark:text-green-300 text-sm">✓ Tersedia</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">✗ Tidak didukung</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('serial')}
                disabled={!availableMethods.includes('serial')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === 'serial'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-500'
                } ${
                  !availableMethods.includes('serial')
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white/90">Serial/USB</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Untuk printer USB atau Serial
                    </p>
                  </div>
                  {availableMethods.includes('serial') ? (
                    <span className="text-green-600 dark:text-green-300 text-sm">✓ Tersedia</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">✗ Tidak didukung</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Browser Support Info */}
          {browserCompatibility && (
            <div className={`mb-6 p-4 border rounded-lg ${
              browserCompatibility.supported && !browserCompatibility.requiresHttps
                ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700'
            }`}>
              <div className="flex items-start">
                <svg
                  className={`w-5 h-5 mt-0.5 mr-3 ${
                    browserCompatibility.supported && !browserCompatibility.requiresHttps
                      ? 'text-green-600 dark:text-green-300'
                      : 'text-amber-600 dark:text-amber-300'
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
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    {browserCompatibility.supported && !browserCompatibility.requiresHttps
                      ? 'Browser Mendukung Web Bluetooth'
                      : 'Peringatan Kompatibilitas Browser'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className={browserCompatibility.supported && !browserCompatibility.requiresHttps
                      ? 'text-green-700 dark:text-green-200'
                      : 'text-amber-700 dark:text-amber-200'
                    }>
                      {browserCompatibility.message}
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-200 mt-2">
                      <p><strong>Browser:</strong> {browserCompatibility.browser}</p>
                      <p><strong>Platform:</strong> {browserCompatibility.platform}</p>
                      {browserCompatibility.requiresHttps && (
                        <p className="text-amber-700 dark:text-amber-200 font-medium mt-1">
                          ⚠️ Web Bluetooth memerlukan HTTPS (kecuali localhost)
                        </p>
                      )}
                    </div>
                    {!browserCompatibility.supported && (
                      <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded border border-amber-300 dark:border-amber-700/80">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-1">Browser yang Didukung:</p>
                        <ul className="text-xs text-gray-700 dark:text-gray-200 list-disc list-inside space-y-0.5">
                          <li>Chrome (Windows, Android, Chrome OS)</li>
                          <li>Microsoft Edge</li>
                          <li>Opera</li>
                        </ul>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
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
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Status Koneksi
            </h2>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      connection && connection.connected
                        ? 'bg-success-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white/90">
                      {connection && connection.connected
                        ? 'Terhubung'
                        : 'Tidak Terhubung'}
                    </p>
                    {connection && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {connection.name} ({connection.method})
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {connection && connection.connected ? (
                    <>
                      <Button
                        onClick={handleTestPrint}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Test Print
                      </Button>
                      <Button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        size="sm"
                        className="bg-error-600 hover:bg-error-700"
                      >
                        {isDisconnecting ? 'Memutuskan...' : 'Putuskan'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      disabled={
                        (!availableMethods.includes(selectedMethod) || isConnecting)
                      }
                      size="sm"
                    >
                      {isConnecting
                        ? 'Menghubungkan...'
                        : `Hubungkan ${selectedMethod === 'bluetooth' ? 'Bluetooth' : 'Serial/USB'}`}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Print Settings */}
            <Card title="Pengaturan Print Struk">
              <div className="space-y-4">
                {/* Auto Print Kitchen Receipt */}
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white/90 mb-1">
                      Auto Print Struk Dapur
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {printSettings.autoPrintKitchen
                        ? 'Struk dapur akan otomatis dicetak setelah pesanan dibuat'
                        : 'Tombol dan modal print struk dapur akan disembunyikan'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAutoPrintKitchen(!printSettings.autoPrintKitchen)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      printSettings.autoPrintKitchen ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
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
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white/90 mb-1">
                      Auto Print Struk Pelanggan
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {printSettings.autoPrintCustomer
                        ? 'Struk pelanggan akan otomatis dicetak setelah pembayaran'
                        : 'Tombol dan modal print struk pelanggan akan disembunyikan'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAutoPrintCustomer(!printSettings.autoPrintCustomer)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      printSettings.autoPrintCustomer ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
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
          </Card>

          {/* Instant Payment Settings */}
            <Card title="Pengaturan Pembayaran">
              <div className="space-y-4">
                {/* Instant Payment */}
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white/90 mb-1">
                      Instant Payment
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {instantPaymentSettings.enabled
                        ? 'Form pembayaran akan muncul langsung setelah pesanan berhasil dibuat di halaman kasir'
                        : 'Form pembayaran hanya muncul saat tombol "Bayar" diklik'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleInstantPayment(!instantPaymentSettings.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      instantPaymentSettings.enabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        instantPaymentSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* PWA Install */}
          <Card title="Install Aplikasi">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-brand-100 dark:bg-brand-500/20 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-6 h-6 text-brand-600 dark:text-brand-400"
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
                  <p className="font-medium text-gray-900 dark:text-white/90">
                    {isInstalled ? 'Aplikasi Terinstall' : 'Install Aplikasi SiBubur'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isInstalled
                      ? 'Aplikasi sudah terinstall di perangkat Anda'
                      : 'Install aplikasi untuk akses lebih cepat dan dapat digunakan offline'}
                  </p>
                </div>
              </div>
              {!isInstalled && deferredPrompt && (
                <Button
                  onClick={handleInstallPWA}
                  size="sm"
                >
                  Install App
                </Button>
              )}
              {isInstalled && (
                <span className="px-4 py-2 bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400 rounded-lg text-sm font-medium">
                  ✓ Terinstall
                </span>
              )}
              {!isInstalled && !deferredPrompt && (
                <span className="px-4 py-2 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg text-sm">
                  Tidak Tersedia
                </span>
              )}
            </div>
            {!isInstalled && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Catatan:</strong> Fitur install aplikasi tersedia di browser yang mendukung PWA 
                  (Chrome, Edge, Safari iOS). Pastikan Anda menggunakan HTTPS atau localhost.
                </p>
              </div>
            )}
          </Card>

        </Card>

        {/* Instructions */}
        <div className="mb-6">
             <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Petunjuk Penggunaan
            </h2>
            <div className="bg-blue-50 dark:bg-gray-900/60 rounded-lg p-4 border border-blue-100 dark:border-gray-800">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Untuk Printer Bluetooth:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-200 ml-2">
                    <li>Pastikan printer Bluetooth dalam keadaan menyala</li>
                    <li>Pastikan printer sudah dipasangkan (paired) dengan perangkat</li>
                    <li>Pilih metode &quot;Bluetooth&quot; dan klik &quot;Hubungkan Bluetooth&quot;</li>
                    <li>Pilih printer dari daftar yang muncul (browser akan meminta izin)</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Untuk Printer USB/Serial:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-200 ml-2">
                    <li>Hubungkan printer ke komputer via USB</li>
                    <li>Pastikan printer dalam keadaan menyala</li>
                    <li>Pilih metode &quot;Serial/USB&quot; dan klik &quot;Hubungkan Serial/USB&quot;</li>
                    <li>Pilih port printer dari daftar yang muncul</li>
                  </ol>
                </div>
                <div className="pt-2 border-t border-blue-200 dark:border-gray-800">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Catatan:</strong> Setelah terhubung, printer akan otomatis digunakan untuk mencetak struk. 
                    Gunakan tombol &quot;Test Print&quot; untuk menguji koneksi printer.
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* Technical Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Informasi Teknis
          </h2>
          <Card>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
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
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
