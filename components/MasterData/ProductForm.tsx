'use client';

import { useState, useEffect } from 'react';
import { Product, ProductCategory } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

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

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price?.toString() || '');
      setCategoryId(product.category?.id);
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Nama dan harga wajib diisi');
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
            <Label htmlFor="name">
              Nama Produk <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Bubur Ayam"
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
            <Button type="submit" className="flex-1">
              {product ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

