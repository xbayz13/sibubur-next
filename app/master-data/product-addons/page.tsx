'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { productAddonsService } from '@/lib/services/product-addons';
import { ProductAddon } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import AddonForm from '@/components/MasterData/AddonForm';

export default function ProductAddonsPage() {
  const { showToast } = useToast();
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await productAddonsService.getAll();
      setAddons(data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data addon', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAddon(null);
    setShowForm(true);
  };

  const handleEdit = (addon: ProductAddon) => {
    setEditingAddon(addon);
    setShowForm(true);
  };

  const handleSubmit = async (addonData: { name: string; price: number; description?: string }) => {
    try {
      if (editingAddon) {
        await productAddonsService.update(editingAddon.id, addonData);
        showToast('Addon berhasil diperbarui', 'success');
      } else {
        await productAddonsService.create(addonData);
        showToast('Addon berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingAddon(null);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan addon', 'error');
    }
  };

  const handleDelete = async (addon: ProductAddon) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus addon "${addon.name}"?`)) return;

    try {
      await productAddonsService.delete(addon.id);
      showToast('Addon berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus addon', 'error');
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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Addon Produk</h1>
              <p className="text-slate-600">Manajemen addon produk</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Tambah Addon
            </button>
          </div>

          <DataTable
            data={addons}
            columns={[
              { header: 'Nama', accessor: 'name' },
              {
                header: 'Harga',
                accessor: (item) => `Rp ${Number(item.price).toLocaleString('id-ID')}`,
              },
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
            <AddonForm
              addon={editingAddon}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingAddon(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

