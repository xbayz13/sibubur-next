'use client';

import { useState } from 'react';
import { Store } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

interface StoreFormProps {
  store?: Store | null;
  onSubmit: (store: { name: string }) => void;
  onCancel: () => void;
}

export default function StoreForm({ store, onSubmit, onCancel }: StoreFormProps) {
  const [name, setName] = useState(store?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Nama toko wajib diisi');
      return;
    }

    onSubmit({ name });
  };

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">
          {store ? 'Edit Toko' : 'Tambah Toko'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">
              Nama Toko <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Toko Cabang Pusat"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {store ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
