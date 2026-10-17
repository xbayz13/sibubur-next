'use client';

import { useState } from 'react';
import { Production } from '@/types';

interface ProductionEditModalProps {
  production: Production;
  onSave: (
    id: number,
    data: { portionsSold: number; remainingPortions: number }
  ) => Promise<void>;
  onClose: () => void;
}

export default function ProductionEditModal({
  production,
  onSave,
  onClose,
}: ProductionEditModalProps) {
  const [portionsSold, setPortionsSold] = useState(
    production.portionsSold?.toString() || '0'
  );
  const [remainingPortions, setRemainingPortions] = useState(
    production.remainingPortions?.toString() || '0'
  );
  const [loading, setLoading] = useState(false);

  const porridgeAmount =
    parseInt(portionsSold || '0') + parseInt(remainingPortions || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(production.id, {
        portionsSold: parseInt(portionsSold),
        remainingPortions: parseInt(remainingPortions),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Edit Produksi {production.date}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jumlah Porsi Terjual
            </label>
            <input
              type="number"
              value={portionsSold}
              onChange={(e) => setPortionsSold(e.target.value)}
              min="0"
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sisa Porsi (default: 0)
            </label>
            <input
              type="number"
              value={remainingPortions}
              onChange={(e) => setRemainingPortions(e.target.value)}
              min="0"
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total Produksi (otomatis)
            </label>
            <div className="text-2xl font-semibold text-indigo-600">
              {porridgeAmount} porsi
            </div>
          </div>

          {production.productionKgBeras && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Input Awal (kg beras)
              </label>
              <div className="text-slate-600">{production.productionKgBeras} kg</div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
