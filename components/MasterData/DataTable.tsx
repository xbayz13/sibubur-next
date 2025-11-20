'use client';

import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  keyExtractor,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <p className="text-slate-500">Belum ada data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((column, idx) => (
                    <th
                      key={idx}
                      className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${
                        column.className || ''
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.map((item) => (
                  <tr key={keyExtractor(item)} className="hover:bg-slate-50">
                    {columns.map((column, idx) => (
                      <td key={idx} className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-900">
                        <div className="whitespace-nowrap sm:whitespace-normal">
                          {typeof column.accessor === 'function'
                            ? column.accessor(item)
                            : item[column.accessor]}
                        </div>
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="text-rose-600 hover:text-rose-900 text-xs sm:text-sm"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

