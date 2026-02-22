'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import useSWR from 'swr';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import Card from '@/components/ui/Card';
import { reportsService } from '@/lib/services/reports';
import { suppliesService } from '@/lib/services/supplies';
import { bmkgService, BMKGWeatherForecast } from '@/lib/services/bmkg';

// Lazy load Chart.js to reduce initial bundle size
const DashboardCharts = dynamic(
  () => import('@/components/Dashboard/DashboardCharts'),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500">Memuat chart...</div> }
);

interface DailyStats {
  revenue: number;
  orders: number;
  productions: number;
  lowStock: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

const DASHBOARD_STALE_TIME = 60 * 1000; // 1 minute - cache dashboard data

async function fetchDashboardData(): Promise<{ stats: DailyStats; chartData: ChartData[] }> {
  const today = new Date().toISOString().split('T')[0];
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const [todayReport, lowStockSupplies, ...chartReports] = await Promise.all([
    reportsService.getDailyReport(today).catch(() => null),
    suppliesService.getLowStock().catch(() => []),
    ...dates.map((date) => reportsService.getDailyReport(date).catch(() => null)),
  ]);

  // Propagate error to SWR when primary data (today report) failed, so error toast is shown
  if (todayReport === null) {
    throw new Error('Gagal memuat data dashboard');
  }

  const chartDataArray: ChartData[] = dates.map((date, index) => {
    const report = chartReports[index];
    return {
      date,
      revenue: Number(report?.revenue?.total || 0),
      orders: Number(report?.orders?.total || 0),
    };
  });

  return {
    stats: {
      revenue: Number(todayReport?.revenue?.total || 0),
      orders: Number(todayReport?.orders?.total || 0),
      productions: todayReport?.production ? 1 : 0,
      lowStock: lowStockSupplies?.length ?? 0,
    },
    chartData: chartDataArray,
  };
}

export default function Home() {
  const { showToast } = useToast();
  const [currentWeather, setCurrentWeather] = useState<BMKGWeatherForecast['current']>(null);
  const [tomorrowMorningForecast, setTomorrowMorningForecast] = useState<BMKGWeatherForecast['forecasts']['tomorrow']>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState<Date | null>(null);

  // SWR: cache dashboard data, revalidate after 1 min, show stale data while revalidating
  const { data, error, isLoading, mutate } = useSWR(
    'dashboard',
    fetchDashboardData,
    {
      revalidateOnFocus: false,
      dedupingInterval: DASHBOARD_STALE_TIME,
      revalidateIfStale: true,
    }
  );

  const stats = data?.stats ?? { revenue: 0, orders: 0, productions: 0, lowStock: 0 };
  const chartData = data?.chartData ?? [];

  useEffect(() => {
    if (error) {
      showToast(error?.response?.data?.message || 'Gagal memuat data dashboard', 'error');
    }
  }, [error, showToast]);

  useEffect(() => {
    loadWeatherData();
    const weatherInterval = setInterval(loadWeatherData, 4 * 60 * 60 * 1000);
    return () => clearInterval(weatherInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWeatherData = async () => {
    try {
      setWeatherLoading(true);
      const [current, tomorrowMorning] = await Promise.all([
        bmkgService.getCurrentWeather(),
        bmkgService.getTomorrowMorningForecast(),
      ]);
      setCurrentWeather(current);
      setTomorrowMorningForecast(tomorrowMorning);
      setLastWeatherUpdate(new Date());
    } catch (error: any) {
      console.error('Failed to load weather data:', error);
      // Don't show toast for weather errors to avoid spam
    } finally {
      setWeatherLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Memuat dashboard...</div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Selamat datang di sistem SiBubur POS</p>
          </div>

          {/* Weather Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white/90">Prakiraan Cuaca</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Sumber: <span className="font-medium">BMKG</span> (Badan Meteorologi, Klimatologi, dan Geofisika)
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Current Weather */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 dark:border-blue-500/20">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90">Cuaca Saat Ini</h3>
                  {lastWeatherUpdate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Update: {lastWeatherUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {weatherLoading ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-4">Memuat data cuaca...</div>
                ) : currentWeather ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      {currentWeather.image && (
                        <Image
                          src={currentWeather.image}
                          alt={currentWeather.condition}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-contain"
                          unoptimized
                        />
                      )}
                      <div>
                        <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
                          {currentWeather.temperature}°C
                        </div>
                        <div className="text-lg text-gray-600 dark:text-gray-400">{currentWeather.condition}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Kelembaban:</span> {currentWeather.humidity}%
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Angin:</span> {currentWeather.windSpeed} m/s {currentWeather.windDirection}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Visibilitas:</span> {currentWeather.visibility}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Curah Hujan:</span> {currentWeather.precipitation} mm
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-4">Data cuaca tidak tersedia</div>
                )}
              </Card>

              {/* Tomorrow Morning Forecast */}
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-500/20">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">Prakiraan Cuaca Besok Pagi</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Jam 05:00 - 10:00 (Waktu Berjualan)</p>
                {weatherLoading ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-4">Memuat prakiraan cuaca...</div>
                ) : tomorrowMorningForecast.length > 0 ? (
                  <div className="space-y-2">
                    {tomorrowMorningForecast.map((forecast, index) => {
                      const time = new Date(forecast.datetime);
                      const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">{timeStr}</div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{forecast.condition}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {forecast.temperature}°C • {forecast.humidity}% • {forecast.windSpeed} m/s
                              </div>
                            </div>
                          </div>
                          {forecast.precipitation > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {forecast.precipitation}mm
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-4">Prakiraan cuaca tidak tersedia</div>
                )}
              </Card>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-success-200 bg-success-50 dark:bg-success-500/10 dark:border-success-500/20">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-success-700 dark:text-success-400 font-medium">Total Penjualan Hari Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-success-900 dark:text-success-300 mt-1 sm:mt-2 truncate">
                    Rp {Number(stats.revenue).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">💰</div>
              </div>
            </Card>

            <Card className="border-brand-200 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-brand-700 dark:text-brand-400 font-medium">Pesanan Hari Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-brand-900 dark:text-brand-300 mt-1 sm:mt-2">{stats.orders}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">📝</div>
              </div>
            </Card>

            <Card className="border-theme-purple-500/30 bg-theme-purple-500/10 dark:bg-theme-purple-500/20 dark:border-theme-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">Produksi Hari Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white/90 mt-1 sm:mt-2">{stats.productions}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">🍲</div>
              </div>
            </Card>

            <Card className="border-error-200 bg-error-50 dark:bg-error-500/10 dark:border-error-500/20">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-error-700 dark:text-error-400 font-medium">Persediaan Rendah</p>
                  <p className="text-xl sm:text-2xl font-bold text-error-900 dark:text-error-300 mt-1 sm:mt-2">{stats.lowStock}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">⚠️</div>
              </div>
            </Card>
          </div>

          {/* Charts - lazy loaded to reduce initial bundle */}
          <DashboardCharts chartData={chartData} />

          {/* Recent Activity */}
          <Card title="Ringkasan Hari Ini">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rata-rata per Pesanan</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {stats.orders > 0
                    ? `Rp ${Math.round(stats.revenue / stats.orders).toLocaleString('id-ID')}`
                    : 'Rp 0'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Item Terjual</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {Number(chartData[chartData.length - 1]?.orders || 0)}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tren Pendapatan</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {chartData.length >= 2
                    ? Number(chartData[chartData.length - 1]?.revenue || 0) >= Number(chartData[chartData.length - 2]?.revenue || 0)
                      ? '📈 Naik'
                      : '📉 Turun'
                    : '➡️ Stabil'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
