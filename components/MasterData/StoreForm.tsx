'use client';

import { useState, useEffect } from 'react';
import { Store } from '@/types';

interface StoreFormProps {
  store?: Store | null;
  onSubmit: (store: { name: string }) => void;
  onCancel: () => void;
}

export default function StoreForm({ store, onSubmit, onCancel }: StoreFormProps) {
  const [name, setName] = useState(store?.name || '');

  useEffect(() => {
    if (store) {
      setName(store.name || '');
    }
  }, [store]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Nama toko wajib diisi');
      return;
    }

    onSubmit({ name });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            {store ? 'Edit Toko' : 'Tambah Toko'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nama Toko *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Contoh: Toko Cabang Pusat"
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
                {store ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

