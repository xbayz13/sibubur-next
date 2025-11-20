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
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Laporan</h1>
            <p className="text-slate-600">
              Laporan harian, bulanan, dan tahunan dengan rekomendasi produksi
            </p>
          </div>

          {/* Report Type Selection */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setReportType('daily')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'daily'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Laporan Harian
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Laporan Bulanan
              </button>
              <button
                onClick={() => setReportType('yearly')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'yearly'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Laporan Tahunan
              </button>
            </div>

            {/* Store Filter */}
            {stores.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter berdasarkan Toko:
                </label>
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) =>
                    setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="border border-slate-300 rounded-lg px-4 py-2 w-full max-w-xs text-slate-900 bg-white"
                >
                  <option value="">Semua Toko</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date/Period Selection */}
            <div className="flex gap-4 items-end">
              {reportType === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Tanggal:
                  </label>
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="border border-slate-300 rounded-lg px-4 py-2 text-slate-900 bg-white"
                  />
                </div>
              )}

              {reportType === 'monthly' && (
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tahun:
                    </label>
                    <input
                      type="number"
                      value={monthlyYear}
                      onChange={(e) => setMonthlyYear(Number(e.target.value))}
                      min="2020"
                      max="2100"
                      className="border border-slate-300 rounded-lg px-4 py-2 w-32 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bulan:
                    </label>
                    <select
                      value={monthlyMonth}
                      onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                      className="border border-slate-300 rounded-lg px-4 py-2 text-slate-900 bg-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {new Date(2000, month - 1).toLocaleString('id-ID', {
                            month: 'long',
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {reportType === 'yearly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Tahun:
                  </label>
                  <input
                    type="number"
                    value={yearlyYear}
                    onChange={(e) => setYearlyYear(Number(e.target.value))}
                    min="2020"
                    max="2100"
                    className="border border-slate-300 rounded-lg px-4 py-2 w-32 text-slate-900 bg-white"
                  />
                </div>
              )}

              <button
                onClick={handleLoadReport}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Memuat...' : 'Muat Laporan'}
              </button>
            </div>
          </div>

          {/* Report Content */}
          {loading && (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
              <div className="text-slate-500">Memuat laporan...</div>
            </div>
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
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Tidak ada data untuk tanggal yang dipilih</p>
              </div>
            )}

          {!loading &&
            reportType === 'monthly' &&
            !monthlyReport && (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Tidak ada data untuk periode yang dipilih</p>
              </div>
            )}

          {!loading &&
            reportType === 'yearly' &&
            !yearlyReport && (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Tidak ada data untuk tahun yang dipilih</p>
              </div>
            )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
