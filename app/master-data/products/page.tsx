'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { productsService } from '@/lib/services/products';
import { productCategoriesService } from '@/lib/services/product-categories';
import { Product, ProductCategory } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import ProductForm from '@/components/MasterData/ProductForm';

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productsService.getAll(),
        productCategoriesService.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (productData: any) => {
    try {
      if (editingProduct) {
        await productsService.update(editingProduct.id, productData);
        showToast('Produk berhasil diperbarui', 'success');
      } else {
        await productsService.create(productData);
        showToast('Produk berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingProduct(null);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan produk', 'error');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) return;

    try {
      await productsService.delete(product.id);
      showToast('Produk berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus produk', 'error');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Memuat data...</div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Produk</h1>
              <p className="text-slate-600">Manajemen data produk</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Tambah Produk
            </button>
          </div>

          <DataTable
            data={products}
            columns={[
              { header: 'Nama', accessor: 'name' },
              {
                header: 'Kategori',
                accessor: (item) => item.category?.name || '-',
              },
              {
                header: 'Harga',
                accessor: (item) => `Rp ${Number(item.price).toLocaleString('id-ID')}`,
              },
              {
                header: 'Deskripsi',
                accessor: (item) => item.description || '-',
                className: 'max-w-xs truncate',
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            keyExtractor={(item) => item.id}
          />

          {showForm && (
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

