'use client';

import { useState, useEffect } from 'react';
import { ProductAddon } from '@/types';

interface AddonFormProps {
  addon?: ProductAddon | null;
  onSubmit: (addon: { name: string; price: number; description?: string }) => void;
  onCancel: () => void;
}

export default function AddonForm({ addon, onSubmit, onCancel }: AddonFormProps) {
  const [name, setName] = useState(addon?.name || '');
  const [price, setPrice] = useState<string>(addon?.price?.toString() || '');
  const [description, setDescription] = useState(addon?.description || '');

  useEffect(() => {
    if (addon) {
      setName(addon.name || '');
      setPrice(addon.price?.toString() || '');
      setDescription(addon.description || '');
    }
  }, [addon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Nama dan harga wajib diisi');
      return;
    }

    onSubmit({
      name,
      price: Number(price),
      description: description || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            {addon ? 'Edit Addon' : 'Tambah Addon'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nama Addon *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Contoh: Telur, Kerupuk"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Harga *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="100"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Deskripsi addon (opsional)"
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
                {addon ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

