'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { reportsService } from '@/lib/services/reports';
import { storesService } from '@/lib/services/stores';
import { DailyReport, MonthlyReport, YearlyReport, Store } from '@/types';
import DailyReportView from '@/components/Reports/DailyReportView';
import MonthlyReportView from '@/components/Reports/MonthlyReportView';
import YearlyReportView from '@/components/Reports/YearlyReportView';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';

type ReportType = 'daily' | 'monthly' | 'yearly';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  // Daily report state
  const [dailyDate, setDailyDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  // Monthly report state
  const [monthlyYear, setMonthlyYear] = useState<number>(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState<number>(new Date().getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  // Yearly report state
  const [yearlyYear, setYearlyYear] = useState<number>(new Date().getFullYear());
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);

  const loadStores = useCallback(async () => {
    try {
      const storesData = await storesService.getAll();
      setStores(storesData);
      // Default to "all stores" (selectedStoreId remains undefined)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data toko', 'error');
    }
  }, [showToast]);

  const loadDailyReport = useCallback(async () => {
    if (!dailyDate) return;

    try {
      setLoading(true);
      const report = await reportsService.getDailyReport(dailyDate, selectedStoreId);
      setDailyReport(report as any);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat laporan harian', 'error');
      setDailyReport(null);
    } finally {
      setLoading(false);
    }
  }, [dailyDate, selectedStoreId, showToast]);

  const loadMonthlyReport = useCallback(async () => {
    try {
      setLoading(true);
      const report = await reportsService.getMonthlyReport(
        monthlyYear,
        monthlyMonth,
        selectedStoreId
      );
      setMonthlyReport(report);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat laporan bulanan', 'error');
      setMonthlyReport(null);
    } finally {
      setLoading(false);
    }
  }, [monthlyYear, monthlyMonth, selectedStoreId, showToast]);

  const loadYearlyReport = useCallback(async () => {
    try {
      setLoading(true);
      const report = await reportsService.getYearlyReport(yearlyYear, selectedStoreId);
      setYearlyReport(report);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat laporan tahunan', 'error');
      setYearlyReport(null);
    } finally {
      setLoading(false);
    }
  }, [yearlyYear, selectedStoreId, showToast]);

  // Load stores on mount
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Track previous reportType to detect tab switches
  const prevReportTypeRef = useRef<ReportType>(reportType);
  const loadingRef = useRef<boolean>(false);
  const lastLoadParamsRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load report when dependencies change (with debounce)
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Prevent loading if already loading
    if (loadingRef.current) {
      return;
    }

    // Create a unique key for current load parameters
    const loadKey = `${reportType}-${selectedStoreId}-${dailyDate}-${monthlyYear}-${monthlyMonth}-${yearlyYear}`;
    
    // Skip if we're already loading/loaded with the same parameters
    if (lastLoadParamsRef.current === loadKey) {
      return;
    }

    // Clear previous report data only when switching tabs
    const isTabSwitch = prevReportTypeRef.current !== reportType;
    if (isTabSwitch) {
      setDailyReport(null);
      setMonthlyReport(null);
      setYearlyReport(null);
      prevReportTypeRef.current = reportType;
      // Reset last load params when switching tabs
      lastLoadParamsRef.current = '';
    }
    
    // Debounce the API call to avoid rapid successive calls
    debounceTimerRef.current = setTimeout(() => {
      // Mark as loading and update last load params
      loadingRef.current = true;
      lastLoadParamsRef.current = loadKey;
      
      // Load the appropriate report
      const loadReport = async () => {
        try {
          if (reportType === 'daily') {
            await loadDailyReport();
          } else if (reportType === 'monthly') {
            await loadMonthlyReport();
          } else if (reportType === 'yearly') {
            await loadYearlyReport();
          }
        } finally {
          loadingRef.current = false;
        }
      };
      
      loadReport();
    }, 300); // 300ms debounce

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, selectedStoreId, dailyDate, monthlyYear, monthlyMonth, yearlyYear]);

  const handleLoadReport = () => {
    if (reportType === 'daily') {
      loadDailyReport();
    } else if (reportType === 'monthly') {
      loadMonthlyReport();
    } else if (reportType === 'yearly') {
      loadYearlyReport();
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <BackButton href="/" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Laporan</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Laporan harian, bulanan, dan tahunan dengan rekomendasi produksi
            </p>
          </div>

          {/* Report Type Selection */}
          <Card>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setReportType('daily')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'daily'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Laporan Harian
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Laporan Bulanan
              </button>
              <button
                onClick={() => setReportType('yearly')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'yearly'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Laporan Tahunan
              </button>
            </div>

            {/* Store Filter */}
            {stores.length > 0 && (
              <div className="mb-4">
                <Label htmlFor="storeFilter">Filter berdasarkan Toko:</Label>
                <Select
                  id="storeFilter"
                  options={stores.map((store) => ({
                    value: store.id.toString(),
                    label: store.name,
                  }))}
                  placeholder="Semua Toko"
                  value={selectedStoreId?.toString() || ''}
                  onChange={(value) =>
                    setSelectedStoreId(value ? Number(value) : undefined)
                  }
                  className="w-full max-w-xs"
                />
              </div>
            )}

            {/* Date/Period Selection */}
            <div className="flex gap-4 items-end flex-wrap">
              {reportType === 'daily' && (
                <div>
                  <Label htmlFor="dailyDate">Pilih Tanggal:</Label>
                  <Input
                    id="dailyDate"
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                  />
                </div>
              )}

              {reportType === 'monthly' && (
                <div className="flex gap-4">
                  <div>
                    <Label htmlFor="monthlyYear">Tahun:</Label>
                    <Input
                      id="monthlyYear"
                      type="number"
                      value={monthlyYear.toString()}
                      onChange={(e) => setMonthlyYear(Number(e.target.value))}
                      min="2020"
                      max="2100"
                      className="w-32"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyMonth">Bulan:</Label>
                    <Select
                      id="monthlyMonth"
                      options={Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        return {
                          value: month.toString(),
                          label: new Date(2000, month - 1).toLocaleString('id-ID', {
                            month: 'long',
                          }),
                        };
                      })}
                      value={monthlyMonth.toString()}
                      onChange={(value) => setMonthlyMonth(Number(value))}
                    />
                  </div>
                </div>
              )}

              {reportType === 'yearly' && (
                <div>
                  <Label htmlFor="yearlyYear">Pilih Tahun:</Label>
                  <Input
                    id="yearlyYear"
                    type="number"
                    value={yearlyYear.toString()}
                    onChange={(e) => setYearlyYear(Number(e.target.value))}
                    min="2020"
                    max="2100"
                    className="w-32"
                  />
                </div>
              )}

              <Button
                onClick={handleLoadReport}
                disabled={loading}
                size="sm"
              >
                {loading ? 'Memuat...' : 'Muat Laporan'}
              </Button>
            </div>
          </Card>

          {/* Report Content */}
          {loading && (
            <Card>
              <div className="p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400">Memuat laporan...</div>
              </div>
            </Card>
          )}

          {!loading && reportType === 'daily' && dailyReport && (
            <DailyReportView report={dailyReport} />
          )}

          {!loading && reportType === 'monthly' && monthlyReport && (
            <MonthlyReportView report={monthlyReport} />
          )}

          {!loading && reportType === 'yearly' && yearlyReport && (
            <YearlyReportView report={yearlyReport} />
          )}

          {!loading &&
            reportType === 'daily' &&
            !dailyReport &&
            dailyDate && (
              <Card>
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Tidak ada data untuk tanggal yang dipilih</p>
                </div>
              </Card>
            )}

          {!loading &&
            reportType === 'monthly' &&
            !monthlyReport && (
              <Card>
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Tidak ada data untuk periode yang dipilih</p>
                </div>
              </Card>
            )}

          {!loading &&
            reportType === 'yearly' &&
            !yearlyReport && (
              <Card>
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Tidak ada data untuk tahun yang dipilih</p>
                </div>
              </Card>
            )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
