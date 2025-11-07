'use client';

import { useState, useEffect } from 'react';
import { Employee, Store } from '@/types';

interface EmployeeFormProps {
  employee?: Employee | null;
  stores: Store[];
  onSubmit: (employee: {
    name: string;
    storeId?: number;
    status?: 'active' | 'inactive';
    dailySalary?: number;
  }) => void;
  onCancel: () => void;
}

export default function EmployeeForm({
  employee,
  stores,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [name, setName] = useState(employee?.name || '');
  const [storeId, setStoreId] = useState<number | undefined>(employee?.store?.id);
  const [status, setStatus] = useState<'active' | 'inactive'>(
    (employee as any)?.status || 'active'
  );
  const [dailySalary, setDailySalary] = useState<string>(
    (employee as any)?.dailySalary?.toString() || ''
  );

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setStoreId(employee.store?.id);
      setStatus((employee as any)?.status || 'active');
      setDailySalary((employee as any)?.dailySalary?.toString() || '');
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Nama karyawan wajib diisi');
      return;
    }

    onSubmit({
      name,
      storeId: storeId,
      status,
      dailySalary: dailySalary ? Number(dailySalary) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            {employee ? 'Edit Karyawan' : 'Tambah Karyawan'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nama Karyawan *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Contoh: John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gaji Harian
              </label>
              <input
                type="number"
                value={dailySalary}
                onChange={(e) => setDailySalary(e.target.value)}
                min="0"
                step="1000"
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="0 (opsional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Toko
              </label>
              <select
                value={storeId || ''}
                onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              >
                <option value="">Pilih Toko</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
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
                {employee ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

