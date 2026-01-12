'use client';

import { useState, useEffect } from 'react';
import { ProductAddon } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

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
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">
          {addon ? 'Edit Addon' : 'Tambah Addon'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">
              Nama Addon <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Telur, Kerupuk"
            />
          </div>

          <div>
            <Label htmlFor="price">
              Harga <span className="text-error-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="100"
              required
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi addon (opsional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {addon ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

