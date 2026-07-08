'use client';

import { MonthlyReport } from '@/types';

interface MonthlyReportViewProps {
  report: MonthlyReport;
}

export default function MonthlyReportView({ report }: MonthlyReportViewProps) {
  const monthName = new Date(2000, (report.month || 1) - 1).toLocaleString('id-ID', {
    month: 'long',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Laporan Bulanan - {monthName} {report.year}
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
           <div className="text-sm text-emerald-700 font-medium">Total Pendapatan</div>
           <div className="text-3xl font-bold text-emerald-900">
             Rp {Number(report.revenue?.total || 0).toLocaleString('id-ID')}
           </div>
           <div className="text-sm text-emerald-600 mt-1">
            {report.revenue?.transactions || 0} transaksi
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-sm">
           <div className="text-sm text-rose-700 font-medium">Total Pengeluaran</div>
           <div className="text-3xl font-bold text-rose-900">
             Rp {Number(report.expenses?.total || 0).toLocaleString('id-ID')}
           </div>
           <div className="text-sm text-rose-600 mt-1">
            {report.expenses?.count || 0} item
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
           <div className="text-sm text-indigo-700 font-medium">Laba Bersih</div>
           <div className={`text-3xl font-bold ${
             (report.netProfit || 0) >= 0 ? 'text-indigo-900' : 'text-rose-600'
           }`}>
             Rp {Number(report.netProfit || 0).toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 shadow-sm">
           <div className="text-sm text-violet-700 font-medium">Total Pesanan</div>
           <div className="text-3xl font-bold text-violet-900">
             {report.orders?.total || 0}
           </div>
         </div>
      </div>

      {/* Statistics */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Statistik Detail</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Rata-rata Pendapatan per Hari Aktif</div>
            <div className="text-xl font-bold text-emerald-700">
              Rp {Number(report.averageDailyRevenue || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </div>
            {report.daysWithData && report.daysWithData > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                dari {report.daysWithData} hari aktif
              </div>
            )}
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Rata-rata Pengeluaran per Hari Aktif</div>
            <div className="text-xl font-bold text-rose-700">
              Rp {Number(report.averageDailyExpenses || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </div>
            {report.daysWithData && report.daysWithData > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                dari {report.daysWithData} hari aktif
              </div>
            )}
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Hari dengan Aktivitas</div>
            <div className="text-xl font-bold text-indigo-700">
              {report.daysWithData || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">hari dari {new Date(report.year, report.month, 0).getDate()} hari</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Total Produksi</div>
            <div className="text-xl font-bold text-violet-700">
              {report.productions?.total || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">catatan produksi</div>
          </div>
        </div>
        
        {/* Additional Metrics */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Rata-rata per Transaksi</div>
              <div className="text-lg font-semibold text-slate-800">
                Rp {report.revenue?.transactions && report.revenue.transactions > 0
                  ? (Number(report.revenue.total) / report.revenue.transactions).toLocaleString('id-ID', { maximumFractionDigits: 0 })
                  : '0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Rata-rata per Pesanan</div>
              <div className="text-lg font-semibold text-slate-800">
                Rp {report.orders?.total && report.orders.total > 0
                  ? (Number(report.revenue?.total || 0) / report.orders.total).toLocaleString('id-ID', { maximumFractionDigits: 0 })
                  : '0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Margin Laba</div>
              <div className={`text-lg font-semibold ${
                report.revenue?.total && report.revenue.total > 0
                  ? (Number(report.netProfit) / Number(report.revenue.total) * 100) >= 0
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                  : 'text-slate-800'
              }`}>
                {report.revenue?.total && report.revenue.total > 0
                  ? `${(Number(report.netProfit) / Number(report.revenue.total) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

