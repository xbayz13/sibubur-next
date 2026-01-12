'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

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
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">Tambah Persediaan Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">
              Nama Persediaan <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Beras, Gula, dll"
            />
          </div>

          <div>
            <Label htmlFor="unit">
              Unit <span className="text-error-500">*</span>
            </Label>
            <Input
              id="unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              placeholder="Contoh: kg, liter, pcs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">
                Stok Awal <span className="text-error-500">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                step="0.01"
                required
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="minStock">
                Stok Minimum <span className="text-error-500">*</span>
              </Label>
              <Input
                id="minStock"
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                min="0"
                step="0.01"
                required
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="price">Harga per Unit (Opsional)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="100"
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
