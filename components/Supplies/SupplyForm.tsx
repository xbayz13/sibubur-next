'use client';

import { useState } from 'react';

interface SupplyFormProps {
  onSubmit: (supply: {
    name: string;
    unit: string;
    stock: number;
    minStock: number;
    price?: number;
  }) => void;
  onCancel: () => void;
}

export default function SupplyForm({ onSubmit, onCancel }: SupplyFormProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('');
  const [price, setPrice] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !unit || !stock || !minStock) {
      alert('Harap lengkapi semua field yang wajib');
      return;
    }

    onSubmit({
      name,
      unit,
      stock: Number(stock),
      minStock: Number(minStock),
      price: price ? Number(price) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Tambah Persediaan Baru</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nama Persediaan *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Contoh: Beras, Gula, dll"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unit *
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Contoh: kg, liter, pcs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stok Awal *
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stok Minimum *
                </label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Harga per Unit (Opsional)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="100"
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="0"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

