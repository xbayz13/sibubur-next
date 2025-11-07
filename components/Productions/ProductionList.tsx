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
      sunny: 'bg-yellow-100 text-yellow-800',
      cloudy: 'bg-slate-100 text-slate-800',
      rainy: 'bg-blue-100 text-blue-800',
      stormy: 'bg-rose-100 text-rose-800',
    };
    return condition ? colors[condition] || 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-slate-800';
  };

  if (productions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <p className="text-slate-500">Belum ada data produksi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Toko
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Jumlah Bubur (kg)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Cuaca
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Persediaan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Dicatat Oleh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {productions.map((production) => (
              <tr key={production.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
                    {new Date(production.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{production.store.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
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
                    <span className="text-sm text-slate-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900">
                    {production.productionSupplies && production.productionSupplies.length > 0 ? (
                      <div className="space-y-1">
                        {production.productionSupplies.map((ps, idx) => (
                          <div key={idx} className="text-xs">
                            {ps.supply.name}: {ps.quantity} {ps.supply.unit}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-500">
                    {production.author?.username || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onDelete(production.id)}
                    className="text-rose-600 hover:text-rose-900"
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

