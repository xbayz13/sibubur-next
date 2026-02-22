'use client';

import { ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  /** Enable virtualization for large datasets (default: true when data > 30) */
  virtualized?: boolean;
  /** Max height of scroll container when virtualized (default: 400) */
  maxHeight?: number;
  /** Use virtualization when data length exceeds this (default: 30) */
  virtualizationThreshold?: number;
}

const DEFAULT_ROW_HEIGHT = 52;
const DEFAULT_MAX_HEIGHT = 400;
const DEFAULT_VIRTUALIZATION_THRESHOLD = 30;

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  keyExtractor,
  virtualized = true,
  maxHeight = DEFAULT_MAX_HEIGHT,
  virtualizationThreshold = DEFAULT_VIRTUALIZATION_THRESHOLD,
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const shouldVirtualize =
    virtualized && data.length > virtualizationThreshold;

  // Must call useVirtualizer unconditionally (Rules of Hooks). Result is only used when shouldVirtualize.
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: 5,
  });

  const virtualItems = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = shouldVirtualize ? rowVirtualizer.getTotalSize() : 0;

  if (data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <p className="text-slate-500">Belum ada data</p>
      </div>
    );
  }

  const renderRow = (item: T) => (
    <>
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
    </>
  );

  if (shouldVirtualize) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div
          ref={parentRef}
          className="overflow-auto -mx-4 sm:mx-0"
          style={{ maxHeight }}
        >
          <div style={{ height: `${totalSize}px` }}>
            <table className="min-w-full divide-y divide-slate-200 border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
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
                {virtualItems.map((virtualRow, index) => {
                  const item = data[virtualRow.index];
                  return (
                    <tr
                      key={keyExtractor(item)}
                      className="hover:bg-slate-50"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
                      }}
                    >
                      {renderRow(item)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
                    {renderRow(item)}
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
