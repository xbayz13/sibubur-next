'use client';

import React from 'react';
import Button from '@/components/ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass = variant === 'danger' 
    ? 'bg-error-500 hover:bg-error-600' 
    : 'bg-orange-500 hover:bg-orange-600';

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={onCancel}
            size="md"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm}
            className={confirmButtonClass}
            size="md"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
