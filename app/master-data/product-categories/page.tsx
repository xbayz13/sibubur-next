'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { productCategoriesService } from '@/lib/services/product-categories';
import { ProductCategory } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import CategoryForm from '@/components/MasterData/CategoryForm';

export default function ProductCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await productCategoriesService.getAll();
      setCategories(data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data kategori', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSubmit = async (categoryData: { name: string; description?: string }) => {
    try {
      if (editingCategory) {
        await productCategoriesService.update(editingCategory.id, categoryData);
        showToast('Kategori berhasil diperbarui', 'success');
      } else {
        await productCategoriesService.create(categoryData);
        showToast('Kategori berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingCategory(null);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan kategori', 'error');
    }
  };

  const handleDelete = async (category: ProductCategory) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) return;

    try {
      await productCategoriesService.delete(category.id);
      showToast('Kategori berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus kategori', 'error');
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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Kategori Produk</h1>
              <p className="text-slate-600">Manajemen kategori produk</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Tambah Kategori
            </button>
          </div>

          <DataTable
            data={categories}
            columns={[
              { header: 'Nama', accessor: 'name' },
              {
                header: 'Deskripsi',
                accessor: (item) => item.description || '-',
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            keyExtractor={(item) => item.id}
          />

          {showForm && (
            <CategoryForm
              category={editingCategory}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCategory(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

