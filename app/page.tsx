'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { reportsService } from '@/lib/services/reports';
import { transactionsService } from '@/lib/services/transactions';
import { ordersService } from '@/lib/services/orders';
import { suppliesService } from '@/lib/services/supplies';
import { productionsService } from '@/lib/services/productions';
import { bmkgService, BMKGWeatherForecast } from '@/lib/services/bmkg';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
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

export default function Home() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyStats>({
    revenue: 0,
    orders: 0,
    productions: 0,
    lowStock: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentWeather, setCurrentWeather] = useState<BMKGWeatherForecast['current']>(null);
  const [tomorrowMorningForecast, setTomorrowMorningForecast] = useState<BMKGWeatherForecast['forecasts']['tomorrow']>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadWeatherData();
    
    // Update weather every 4 hours
    const weatherInterval = setInterval(() => {
      loadWeatherData();
    }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds

    return () => clearInterval(weatherInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Prepare dates for last 7 days
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      // Parallelize all API calls
      const [todayReport, lowStockSupplies, ...chartReports] = await Promise.all([
        reportsService.getDailyReport(today),
        suppliesService.getLowStock(),
        ...dates.map(date => 
          reportsService.getDailyReport(date).catch(() => null)
        ),
      ]);

      // Process chart data - ensure all values are numbers
      const chartDataArray: ChartData[] = dates.map((date, index) => {
        const report = chartReports[index];
        return {
          date,
          revenue: Number(report?.revenue?.total || 0),
          orders: Number(report?.orders?.total || 0),
        };
      });

      setStats({
        revenue: Number(todayReport.revenue?.total || 0),
        orders: Number(todayReport.orders?.total || 0),
        productions: todayReport.production ? 1 : 0,
        lowStock: lowStockSupplies.length,
      });
      
      setChartData(chartDataArray);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  // Prepare chart data for Chart.js
  const revenueChartData = {
    labels: chartData.length > 0
      ? chartData.map((d) => {
          const date = new Date(d.date);
          const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
          return `${dayName}\n${date.getDate()}`;
        })
      : [],
    datasets: [
      {
        label: 'Pendapatan (Rp)',
        data: chartData.length > 0 ? chartData.map((d) => Number(d.revenue) || 0) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(16, 185, 129, 0.95)',
        hoverBorderColor: 'rgba(16, 185, 129, 1)',
      },
    ],
  };

  const ordersChartData = {
    labels: chartData.length > 0
      ? chartData.map((d) => {
          const date = new Date(d.date);
          const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
          return `${dayName}\n${date.getDate()}`;
        })
      : [],
    datasets: [
      {
        label: 'Jumlah Pesanan',
        data: chartData.length > 0 ? chartData.map((d) => Number(d.orders) || 0) : [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.95)',
        hoverBorderColor: 'rgba(99, 102, 241, 1)',
      },
    ],
  };

  const revenueChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'Pendapatan (Rp)') {
              return `Rp ${Number(context.parsed.y).toLocaleString('id-ID')}`;
            }
            return `${context.parsed.y} pesanan`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number' && value >= 1000000) {
              return `Rp ${(value / 1000000).toFixed(1)}M`;
            } else if (typeof value === 'number' && value >= 1000) {
              return `Rp ${(value / 1000).toFixed(0)}K`;
            }
            return value;
          },
          color: '#64748b',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const ordersChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} pesanan`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#64748b',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Memuat dashboard...</div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-600">Selamat datang di sistem SiBubur POS</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-emerald-700 font-medium">Total Penjualan Hari Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-900 mt-1 sm:mt-2 truncate">
                    Rp {Number(stats.revenue).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">💰</div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-indigo-700 font-medium">Pesanan Hari Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-900 mt-1 sm:mt-2">{stats.orders}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">📝</div>
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-200 p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-violet-700 font-medium">Produksi Hari Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-violet-900 mt-1 sm:mt-2">{stats.productions}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">🍲</div>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-rose-700 font-medium">Persediaan Rendah</p>
                  <p className="text-xl sm:text-2xl font-bold text-rose-900 mt-1 sm:mt-2">{stats.lowStock}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">⚠️</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Revenue Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">Pendapatan 7 Hari Terakhir</h2>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  Tidak ada data untuk ditampilkan
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <Bar data={revenueChartData} options={revenueChartOptions} />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <div className="text-sm text-slate-600">
                      Total: Rp {chartData.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Orders Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">Pesanan 7 Hari Terakhir</h2>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  Tidak ada data untuk ditampilkan
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <Bar data={ordersChartData} options={ordersChartOptions} />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <div className="text-sm text-slate-600">
                      Total: {chartData.reduce((sum, d) => sum + (Number(d.orders) || 0), 0)} pesanan
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Weather Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Weather */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Cuaca Saat Ini</h2>
                {lastWeatherUpdate && (
                  <span className="text-xs text-slate-500">
                    Update: {lastWeatherUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              {weatherLoading ? (
                <div className="text-slate-500 text-center py-4">Memuat data cuaca...</div>
              ) : currentWeather ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {currentWeather.image && (
                      <img 
                        src={currentWeather.image} 
                        alt={currentWeather.condition}
                        className="w-16 h-16"
                      />
                    )}
                    <div>
                      <div className="text-3xl font-bold text-slate-800">
                        {currentWeather.temperature}°C
                      </div>
                      <div className="text-lg text-slate-600">{currentWeather.condition}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-600">
                      <span className="font-medium">Kelembaban:</span> {currentWeather.humidity}%
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">Angin:</span> {currentWeather.windSpeed} m/s {currentWeather.windDirection}
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">Visibilitas:</span> {currentWeather.visibility}
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">Curah Hujan:</span> {currentWeather.precipitation} mm
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-center py-4">Data cuaca tidak tersedia</div>
              )}
            </div>

            {/* Tomorrow Morning Forecast */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 sm:p-6 rounded-lg shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3">Prakiraan Cuaca Besok Pagi</h2>
              <p className="text-xs text-slate-600 mb-3">Jam 05:00 - 10:00 (Waktu Berjualan)</p>
              {weatherLoading ? (
                <div className="text-slate-500 text-center py-4">Memuat prakiraan cuaca...</div>
              ) : tomorrowMorningForecast.length > 0 ? (
                <div className="space-y-2">
                  {tomorrowMorningForecast.map((forecast, index) => {
                    const time = new Date(forecast.datetime);
                    const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-slate-700 w-16">{timeStr}</div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{forecast.condition}</div>
                            <div className="text-xs text-slate-600">
                              {forecast.temperature}°C • {forecast.humidity}% • {forecast.windSpeed} m/s
                            </div>
                          </div>
                        </div>
                        {forecast.precipitation > 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            {forecast.precipitation}mm
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-4">Prakiraan cuaca tidak tersedia</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">Ringkasan Hari Ini</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Rata-rata per Pesanan</div>
                <div className="text-2xl font-bold text-slate-800">
                  {stats.orders > 0
                    ? `Rp ${Math.round(stats.revenue / stats.orders).toLocaleString('id-ID')}`
                    : 'Rp 0'}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Total Item Terjual</div>
                <div className="text-2xl font-bold text-slate-800">
                  {Number(chartData[chartData.length - 1]?.orders || 0)}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Tren Pendapatan</div>
                <div className="text-2xl font-bold text-slate-800">
                  {chartData.length >= 2
                    ? Number(chartData[chartData.length - 1]?.revenue || 0) >= Number(chartData[chartData.length - 2]?.revenue || 0)
                      ? '📈 Naik'
                      : '📉 Turun'
                    : '➡️ Stabil'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
