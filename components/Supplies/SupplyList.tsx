'use client';

import { Supply } from '@/types';
import Card from '@/components/ui/Card';

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
      return { label: 'Habis', color: 'bg-error-100 text-error-800 dark:bg-error-500/20 dark:text-error-400' };
    } else if (supply.stock <= supply.minStock) {
      return { label: 'Rendah', color: 'bg-warning-100 text-warning-800 dark:bg-warning-500/20 dark:text-warning-400' };
    } else {
      return { label: 'Aman', color: 'bg-success-100 text-success-800 dark:bg-success-500/20 dark:text-success-400' };
    }
  };

  if (supplies.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Belum ada data persediaan</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nama Persediaan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stok Saat Ini
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stok Minimum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {supplies.map((supply) => {
              const status = getStockStatus(supply);
              return (
                <tr key={supply.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800 dark:text-white/90">{supply.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800 dark:text-white/90">{supply.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {Number(supply.stock).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800 dark:text-white/90">
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
                    <div className="text-sm text-gray-800 dark:text-white/90">
                      {supply.price
                        ? `Rp ${Number(supply.price).toLocaleString('id-ID')}`
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRestock(supply)}
                        className="text-success-600 hover:text-success-700 dark:text-success-400 dark:hover:text-success-300"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => onDelete(supply.id)}
                        className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
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
    </Card>
  );
}
