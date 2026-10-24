'use client';

import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useState } from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onExport: () => void;
  onBulkDelete?: () => void;
  onConfirmBulkDelete: () => Promise<void>;
}

export default function BulkActionsBar({
  selectedCount,
  onExport,
  onBulkDelete,
  onConfirmBulkDelete,
}: BulkActionsBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleConfirmDelete = async () => {
    await onConfirmBulkDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 shadow-theme-lg p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onExport}>
              Export CSV
            </Button>
            {onBulkDelete && (
              <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                Delete ({selectedCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Confirm Bulk Delete"
        message={`Delete ${selectedCount} items? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}