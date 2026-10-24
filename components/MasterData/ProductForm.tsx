'use client';

import { useState } from 'react';
import { Product, ProductCategory } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';
import { validateRequired, validatePrice } from '@/lib/validators';

interface ProductFormProps {
  product?: Product | null;
  categories: ProductCategory[];
  onSubmit: (product: {
    name: string;
    description?: string;
    price: number;
    productCategoryId?: number;
  }) => void;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  categories,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState<string>(product?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(
    product?.category?.id || undefined
  );

  // Derive form validity from state - no setState in effect needed
  const nameValid = validateRequired(name) === null;
  const priceValid = validatePrice(price) === null;
  const isFormValid = nameValid && priceValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check validation
    if (!isFormValid) {
      return;
    }

    onSubmit({
      name,
      description: description || undefined,
      price: Number(price),
      productCategoryId: categoryId,
    });
  };

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">
          {product ? 'Edit Produk' : 'Tambah Produk'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" required>
              Nama Produk
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              validator={validateRequired}
              placeholder="Contoh: Bubur Ayam"
              hint="Nama produk wajib diisi"
            />
          </div>

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select
              id="category"
              options={categories.map((cat) => ({
                value: cat.id.toString(),
                label: cat.name,
              }))}
              placeholder="Pilih Kategori"
              value={categoryId?.toString() || ''}
              onChange={(value) => setCategoryId(value ? Number(value) : undefined)}
            />
          </div>

          <div>
            <Label htmlFor="price" required>
              Harga
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              validator={validatePrice}
              min="0"
              step="100"
              placeholder="0"
              hint="Harga dalam Rupiah"
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi produk (opsional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!isFormValid}
            >
              {product ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
