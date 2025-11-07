'use client';

import { Supply } from '@/types';

interface SupplyListProps {
  supplies: Supply[];
  onRestock: (supply: Supply) => void;
  onUpdate: (id: number, supply: any) => void;
  onDelete: (id: number) => void;
}

export default function SupplyList({
  supplies,
  onRestock,
  onUpdate,
  onDelete,
}: SupplyListProps) {
  const getStockStatus = (supply: Supply) => {
    if (supply.stock <= 0) {
      return { label: 'Habis', color: 'bg-rose-100 text-rose-800' };
    } else if (supply.stock <= supply.minStock) {
      return { label: 'Rendah', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Aman', color: 'bg-emerald-100 text-emerald-800' };
    }
  };

  if (supplies.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <p className="text-slate-500">Belum ada data persediaan</p>
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
                Nama Persediaan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Stok Saat Ini
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Stok Minimum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {supplies.map((supply) => {
              const status = getStockStatus(supply);
              return (
                <tr key={supply.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{supply.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{supply.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {Number(supply.stock).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {Number(supply.minStock).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {supply.price
                        ? `Rp ${Number(supply.price).toLocaleString('id-ID')}`
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRestock(supply)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => onDelete(supply.id)}
                        className="text-rose-600 hover:text-rose-900"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

