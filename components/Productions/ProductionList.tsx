'use client';

import { Production } from '@/types';

interface ProductionListProps {
  productions: Production[];
  onDelete: (id: number) => void;
}

export default function ProductionList({
  productions,
  onDelete,
}: ProductionListProps) {
  const getWeatherLabel = (condition?: string) => {
    const labels: { [key: string]: string } = {
      sunny: 'Cerah',
      cloudy: 'Berawan',
      rainy: 'Hujan',
      stormy: 'Badai',
    };
    return condition ? labels[condition] || condition : '-';
  };

  const getWeatherColor = (condition?: string) => {
    const colors: { [key: string]: string } = {
      sunny: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
      cloudy: 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100',
      rainy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100',
      stormy: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-100',
    };
    return condition ? colors[condition] || 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100' : 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100';
  };

  if (productions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-gray-800 text-center">
        <p className="text-slate-500 dark:text-gray-300">Belum ada data produksi</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-gray-900/70">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                Toko
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                Jumlah Bubur (kg)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                Cuaca
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                Persediaan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                Dicatat Oleh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-gray-800">
            {productions.map((production) => (
              <tr key={production.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/60">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900 dark:text-gray-50">
                    {new Date(production.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900 dark:text-gray-100">{production.store.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900 dark:text-gray-100">
                    {production.porridgeAmount
                      ? `${Number(production.porridgeAmount).toLocaleString('id-ID')} kg`
                      : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {production.weather ? (
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getWeatherColor(
                        production.weather.condition
                      )}`}
                    >
                      {getWeatherLabel(production.weather.condition)}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 dark:text-gray-100">
                    {production.productionSupplies && production.productionSupplies.length > 0 ? (
                      <div className="space-y-1">
                        {production.productionSupplies.map((ps, idx) => (
                          <div key={idx} className="text-xs">
                            {ps.supply.name}: {ps.quantity} {ps.supply.unit}
                          </div>
                        ))}
                      </div>
                    ) : (
                       <span className="text-slate-500 dark:text-gray-400">-</span>
                     )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-500 dark:text-gray-400">
                    {production.author?.username || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onDelete(production.id)}
                    className="text-rose-600 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-200"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
