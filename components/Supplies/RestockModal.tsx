'use client';

import { useState } from 'react';
import { Supply } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

interface RestockModalProps {
  supply: Supply;
  onSubmit: (quantity: number) => void;
  onClose: () => void;
}

export default function RestockModal({
  supply,
  onSubmit,
  onClose,
}: RestockModalProps) {
  const [quantity, setQuantity] = useState<string>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseFloat(quantity);
    if (!quantity || qty <= 0) {
      setError('Masukkan jumlah yang valid');
      return;
    }

    onSubmit(qty);
  };

  const currentStock = Number(supply.stock);
  const newStock = currentStock + (parseFloat(quantity) || 0);

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">Restock Persediaan</h2>

        <div className="space-y-5 mb-6">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nama Persediaan</div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white/90">{supply.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stok Saat Ini</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white/90">
                {currentStock.toLocaleString('id-ID')} {supply.unit}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stok Minimum</div>
              <div className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {Number(supply.minStock).toLocaleString('id-ID')} {supply.unit}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="quantity">
                Jumlah yang Ditambahkan <span className="text-error-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                min="0"
                step="0.01"
                placeholder="0"
                required
                error={!!error}
              />
              {quantity && parseFloat(quantity) > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Stok setelah restock: <span className="font-semibold text-success-600 dark:text-success-400">
                      {newStock.toLocaleString('id-ID')} {supply.unit}
                    </span>
                  </div>
                  {newStock >= supply.minStock && (
                    <div className="text-xs text-success-600 dark:text-success-400">
                      ✓ Stok akan mencapai level aman
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-success-600 hover:bg-success-700">
                Tambah Stok
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
