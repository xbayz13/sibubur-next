'use client';

import { useState } from 'react';
import { Employee, Store } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

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
  const [status, setStatus] = useState<'active' | 'inactive'>(employee?.status || 'active');
  const [dailySalary, setDailySalary] = useState<string>(employee?.dailySalary?.toString() || '');

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
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">
          {employee ? 'Edit Karyawan' : 'Tambah Karyawan'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">
              Nama Karyawan <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: John Doe"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              options={[
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Tidak Aktif' },
              ]}
              value={status}
              onChange={(value) => setStatus(value as 'active' | 'inactive')}
            />
          </div>

          <div>
            <Label htmlFor="dailySalary">Gaji Harian</Label>
            <Input
              id="dailySalary"
              type="number"
              value={dailySalary}
              onChange={(e) => setDailySalary(e.target.value)}
              min="0"
              step="1000"
              placeholder="0 (opsional)"
            />
          </div>

          <div>
            <Label htmlFor="store">Toko</Label>
            <Select
              id="store"
              options={stores.map((store) => ({
                value: store.id.toString(),
                label: store.name,
              }))}
              placeholder="Pilih Toko"
              value={storeId?.toString() || ''}
              onChange={(value) => setStoreId(value ? Number(value) : undefined)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {employee ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
