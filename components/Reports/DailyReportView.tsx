'use client';

import { DailyReport } from '@/types';
import { ProductionRecommendation } from '@/lib/services/reports';

interface DailyReportViewProps {
  report: DailyReport & { recommendations?: ProductionRecommendation };
}

export default function DailyReportView({ report }: DailyReportViewProps) {
  const getWeatherLabel = (condition?: string) => {
    const labels: { [key: string]: string } = {
      sunny: 'Cerah',
      cloudy: 'Berawan',
      rainy: 'Hujan',
      stormy: 'Badai',
    };
    return condition ? labels[condition] || condition : '-';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-emerald-700 font-medium">Total Pendapatan</div>
          <div className="text-2xl font-bold text-emerald-900">
            Rp {Number(report.revenue?.total || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            {report.revenue?.transactions || 0} transaksi
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-rose-700 font-medium">Total Pengeluaran</div>
          <div className="text-2xl font-bold text-rose-900">
            Rp {Number(report.expenses?.total || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-rose-600 mt-1">
            {report.expenses?.expensesDetail?.length || 0} item
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-indigo-700 font-medium">Laba Bersih</div>
          <div className={`text-2xl font-bold ${
            (report.netProfit || 0) >= 0 ? 'text-indigo-900' : 'text-rose-600'
          }`}>
            Rp {Number(report.netProfit || 0).toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-violet-700 font-medium">Total Pesanan</div>
          <div className="text-2xl font-bold text-violet-900">
            {report.orders?.total || 0}
          </div>
          <div className="text-xs text-violet-600 mt-1">
            {report.orders?.items || 0} item
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-indigo-900 mb-3">
            Rekomendasi Produksi untuk{' '}
            {new Date(
              new Date(report.date).getTime() + 24 * 60 * 60 * 1000
            ).toLocaleDateString('id-ID')}
          </h3>
          <div className="space-y-2">
            {report.recommendations.recommendations.map((rec: string, idx: number) => (
              <p key={idx} className="text-sm text-indigo-800">
                • {rec}
              </p>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-700">Jumlah yang Direkomendasikan:</span>
              <span className="text-xl font-bold text-indigo-900">
                {report.recommendations.recommendedAmount} porsi
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Production Information */}
      {report.production && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Informasi Produksi</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600">Jumlah Bubur</div>
              <div className="text-lg font-semibold text-slate-900">
                {report.production.porridgeAmount
                  ? `${Number(report.production.porridgeAmount).toLocaleString('id-ID')} porsi`
                  : '-'}
              </div>
            </div>
            {report.production.weather && (
              <div>
                <div className="text-sm text-slate-600">Cuaca</div>
                <div className="text-lg font-semibold text-slate-900">
                  {getWeatherLabel(report.production.weather.condition)}
                </div>
              </div>
            )}
          </div>
          {report.production.productionSupplies &&
            report.production.productionSupplies.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-slate-600 mb-2">Persediaan yang Digunakan:</div>
                <div className="space-y-1">
                  {report.production.productionSupplies.map((ps, idx) => (
                    <div key={idx} className="text-sm text-slate-900">
                      {ps.supply.name}: {ps.quantity} {ps.supply.unit}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Weather Information */}
      {report.weather && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Informasi Cuaca</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600">Kondisi</div>
              <div className="text-lg font-semibold text-slate-900">
                {getWeatherLabel(report.weather.condition)}
              </div>
            </div>
            {report.weather.temperature && (
              <div>
                <div className="text-sm text-slate-600">Suhu</div>
                <div className="text-lg font-semibold text-slate-900">{report.weather.temperature}°C</div>
              </div>
            )}
          </div>
          {report.weather.description && (
            <div className="mt-4">
              <div className="text-sm text-slate-600">Deskripsi</div>
              <div className="text-sm text-slate-900">{report.weather.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Information */}
      {report.attendance && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Kehadiran Karyawan</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-600">Hadir</div>
              <div className="text-2xl font-bold text-emerald-600">
                {report.attendance.present || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Tidak Hadir</div>
              <div className="text-2xl font-bold text-rose-600">
                {report.attendance.absent || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Total</div>
              <div className="text-2xl font-bold text-slate-800">
                {report.attendance.total || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Detail */}
      {report.revenue?.transactionsDetail &&
        report.revenue.transactionsDetail.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Transaksi</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-900 font-semibold">No. Transaksi</th>
                    <th className="px-4 py-2 text-left text-slate-900 font-semibold">Metode Pembayaran</th>
                    <th className="px-4 py-2 text-right text-slate-900 font-semibold">Jumlah</th>
                    <th className="px-4 py-2 text-left text-slate-900 font-semibold">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.revenue.transactionsDetail.map((txn: any) => (
                    <tr key={txn.id}>
                      <td className="px-4 py-2 text-slate-900">{txn.transactionNumber}</td>
                      <td className="px-4 py-2 text-slate-900">{txn.paymentMethod?.name || '-'}</td>
                      <td className="px-4 py-2 text-right text-slate-900">
                        Rp {Number(txn.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-2 text-slate-900">
                        {new Date(txn.createdAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Expenses Detail */}
      {report.expenses?.expensesDetail &&
        report.expenses.expensesDetail.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Pengeluaran</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-900 font-semibold">Kategori</th>
                    <th className="px-4 py-2 text-left text-slate-900 font-semibold">Deskripsi</th>
                    <th className="px-4 py-2 text-right text-slate-900 font-semibold">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.expenses.expensesDetail.map((exp: any) => (
                    <tr key={exp.id}>
                      <td className="px-4 py-2 text-slate-900">{exp.category?.name || '-'}</td>
                      <td className="px-4 py-2 text-slate-900">{exp.description || '-'}</td>
                      <td className="px-4 py-2 text-right text-slate-900">
                        Rp {Number(exp.totalAmount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}

