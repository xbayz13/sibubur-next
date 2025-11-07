'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { permissionsService, CreatePermissionDto, UpdatePermissionDto } from '@/lib/services/permissions';
import { Permission } from '@/types';
import DataTable from '@/components/MasterData/DataTable';

export default function PermissionsPage() {
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [moduleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const permissionsData = await permissionsService.getAll(
        moduleFilter || undefined
      );
      setPermissions(permissionsData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data permission', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPermission(null);
    setShowForm(true);
  };

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowForm(true);
  };

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permission ${permission.slug}?`)) {
      return;
    }

    try {
      await permissionsService.delete(permission.id);
      showToast('Permission berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus permission', 'error');
    }
  };

  const handleSubmit = async (data: CreatePermissionDto | UpdatePermissionDto) => {
    try {
      if (selectedPermission) {
        await permissionsService.update(selectedPermission.id, data as UpdatePermissionDto);
        showToast('Permission berhasil diperbarui', 'success');
      } else {
        await permissionsService.create(data as CreatePermissionDto);
        showToast('Permission berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setSelectedPermission(null);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan permission', 'error');
    }
  };

  // Get unique modules
  const modules = Array.from(new Set(permissions.map((p) => p.module)));

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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Permission</h1>
              <p className="text-slate-600">Manajemen izin akses sistem</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              Tambah Permission
            </button>
          </div>

          {/* Module Filter */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter Module
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Module</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions Table */}
          <DataTable
            data={permissions}
            columns={[
              {
                header: 'Module',
                accessor: 'module',
              },
              {
                header: 'Action',
                accessor: 'action',
              },
              {
                header: 'Slug',
                accessor: 'slug',
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            keyExtractor={(permission) => permission.id}
          />

          {/* Form Modal */}
          {showForm && (
            <PermissionForm
              permission={selectedPermission}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setSelectedPermission(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

interface PermissionFormProps {
  permission: Permission | null;
  onSubmit: (data: CreatePermissionDto | UpdatePermissionDto) => void;
  onCancel: () => void;
}

function PermissionForm({ permission, onSubmit, onCancel }: PermissionFormProps) {
  const [formData, setFormData] = useState<CreatePermissionDto>({
    module: permission?.module || '',
    action: permission?.action || '',
    slug: permission?.slug || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.module || !formData.action || !formData.slug) {
      alert('Harap lengkapi semua field');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-slate-800">
          {permission ? 'Edit Permission' : 'Tambah Permission'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Module *
            </label>
            <input
              type="text"
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
              placeholder="e.g., products"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Action *
            </label>
            <input
              type="text"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
              placeholder="e.g., create"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
              placeholder="e.g., products.create"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

