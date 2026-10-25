'use client';

import { ReactNode, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import BulkActionsBar from '@/components/ui/BulkActionsBar';
import Skeleton from '@/components/ui/Skeleton';
import EditableCell from '@/components/ui/EditableCell';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  editable?: boolean;
  validator?: (value: string) => string | null;
  onCellEdit?: (item: T, newValue: string) => Promise<void> | void;
  editType?: 'text' | 'number';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onBulkDelete?: (items: T[]) => Promise<void>;
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
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

export default function DataTable<T extends object>({
  data,
  columns,
  onEdit,
  onDelete,
  onBulkDelete,
  keyExtractor,
  loading = false,
  virtualized = true,
  maxHeight = DEFAULT_MAX_HEIGHT,
  virtualizationThreshold = DEFAULT_VIRTUALIZATION_THRESHOLD,
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ item: T; isOpen: boolean } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(data.map(item => keyExtractor(item))));
    } else {
      setSelectedRows(new Set());
    }
  }, [data, keyExtractor]);

  const handleSelectRow = useCallback((id: string | number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  }, [selectedRows]);

  const handleBulkExport = useCallback(() => {
    const selectedData = data.filter(item => selectedRows.has(keyExtractor(item)));
    
    if (selectedData.length === 0) return;
    
    // Convert to CSV
    const headers = Object.keys(selectedData[0]);
    const csv = [
      headers.join(','),
      ...selectedData.map(row =>
        headers.map(header => JSON.stringify((row as Record<string, unknown>)[header])).join(',')
      )
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [data, selectedRows, keyExtractor]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!onBulkDelete) return;
    
    const selectedData = data.filter(item => selectedRows.has(keyExtractor(item)));
    
    setIsBulkDeleting(true);
    try {
      await onBulkDelete(selectedData);
      setSelectedRows(new Set());
    } finally {
      setIsBulkDeleting(false);
    }
  }, [data, selectedRows, keyExtractor, onBulkDelete]);

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
      {onBulkDelete && (
        <td className="px-4 sm:px-6 py-3 sm:py-4 w-12">
          <input
            type="checkbox"
            checked={selectedRows.has(keyExtractor(item))}
            onChange={() => handleSelectRow(keyExtractor(item))}
            className="cursor-pointer"
          />
        </td>
      )}
      {columns.map((column, idx) => {
        const value = typeof column.accessor !== 'function' ? String(item[column.accessor] ?? '') : '';
        const isEditable = column.editable && typeof column.accessor !== 'function' && column.onCellEdit;

        return (
          <td key={idx} className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-900">
            <div className="whitespace-nowrap sm:whitespace-normal">
              {isEditable ? (
                <EditableCell
                  value={value}
                  onSave={(newValue) => column.onCellEdit!(item, newValue)}
                  validator={column.validator}
                  type={column.editType}
                />
              ) : typeof column.accessor === 'function' ? (
                column.accessor(item)
              ) : (
                (item[column.accessor] as ReactNode)
              )}
            </div>
          </td>
        );
      })}
      {(onEdit || onDelete) && (
        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
              >
                Ubah
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setDeleteConfirm({ item, isOpen: true })}
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
                  {onBulkDelete && (
                    <th className="px-4 sm:px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map((column, idx) => (
                    <th
                      key={idx}
                      className={`px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${
                        column.className || ''
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
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
        <ConfirmationModal
          isOpen={!!deleteConfirm}
          title="Hapus Data?"
          message="Data akan dihapus permanen. Yakin?"
          confirmText="Ya, Hapus"
          cancelText="Batal"
          onConfirm={() => {
            if (deleteConfirm && onDelete) {
              onDelete(deleteConfirm.item);
            }
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
          variant="danger"
        />
          <BulkActionsBar
            selectedCount={selectedRows.size}
            onExport={handleBulkExport}
            onBulkDelete={onBulkDelete ? () => {} : undefined}
            onConfirmBulkDelete={handleConfirmBulkDelete}
          />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden pb-20">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {onBulkDelete && (
                    <th className="px-4 sm:px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map((column, idx) => (
                    <th
                      key={idx}
                      className={`px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${
                        column.className || ''
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  // Skeleton loading rows
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {onBulkDelete && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4 w-12">
                          <Skeleton variant="text" width="20px" />
                        </td>
                      )}
                      {columns.map((_, colIdx) => (
                        <td key={colIdx} className="px-4 sm:px-6 py-3 sm:py-4">
                          <Skeleton variant="text" width={colIdx === 0 ? "80%" : "60%"} />
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex gap-2">
                            {onEdit && <Skeleton variant="rectangular" width="40px" height="24px" />}
                            {onDelete && <Skeleton variant="rectangular" width="50px" height="24px" />}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  // Normal data rows
                  data.map((item) => (
                    <tr key={keyExtractor(item)} className="hover:bg-slate-50">
                      {renderRow(item)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
           </div>
         </div>
         <ConfirmationModal
           isOpen={!!deleteConfirm}
           title="Hapus Data?"
           message="Data akan dihapus permanen. Yakin?"
           confirmText="Ya, Hapus"
           cancelText="Batal"
           onConfirm={() => {
             if (deleteConfirm && onDelete) {
               onDelete(deleteConfirm.item);
             }
             setDeleteConfirm(null);
           }}
           onCancel={() => setDeleteConfirm(null)}
           variant="danger"
         />
          <BulkActionsBar
            selectedCount={selectedRows.size}
            onExport={handleBulkExport}
            onBulkDelete={onBulkDelete ? () => {} : undefined}
            onConfirmBulkDelete={handleConfirmBulkDelete}
          />
       </div>
     </div>
   );
 }
