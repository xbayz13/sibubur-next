'use client';

import { useState } from 'react';
import { Supply } from '@/types';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Restock Persediaan</h2>

          <div className="space-y-4 mb-6">
            <div>
              <div className="text-sm text-slate-600">Nama Persediaan</div>
              <div className="text-lg font-semibold">{supply.name}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600">Stok Saat Ini</div>
                <div className="text-xl font-bold text-slate-800">
                  {currentStock.toLocaleString('id-ID')} {supply.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Stok Minimum</div>
                <div className="text-xl font-semibold text-slate-800">
                  {Number(supply.minStock).toLocaleString('id-ID')} {supply.unit}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Jumlah yang Ditambahkan *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                min="0"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-lg"
                placeholder="0"
                required
              />
              {quantity && parseFloat(quantity) > 0 && (
                <div className="mt-2">
                  <div className="text-sm text-slate-600">
                    Stok setelah restock: <span className="font-semibold text-emerald-600">
                      {newStock.toLocaleString('id-ID')} {supply.unit}
                    </span>
                  </div>
                  {newStock >= supply.minStock && (
                    <div className="text-xs text-emerald-600 mt-1">
                      ✓ Stok akan mencapai level aman
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Tambah Stok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

