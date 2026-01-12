'use client';

import { useState, useEffect } from 'react';
import { ProductCategory, ExpenseCategory } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

interface CategoryFormProps {
  category?: ProductCategory | ExpenseCategory | null;
  onSubmit: (category: { name: string; description?: string }) => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Nama wajib diisi');
      return;
    }

    onSubmit({
      name,
      description: description || undefined,
    });
  };

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">
          {category ? 'Edit Kategori' : 'Tambah Kategori'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">
              Nama Kategori <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Makanan Utama"
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi kategori (opsional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {category ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

