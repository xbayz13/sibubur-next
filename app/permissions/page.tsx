'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { permissionsService, CreatePermissionDto, UpdatePermissionDto } from '@/lib/services/permissions';
import { Permission } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';

export default function PermissionsPage() {
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Permission | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const prevModuleFilterRef = useRef<string | null>(null);
  const skipNextPageLoadRef = useRef(false);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) return response.data.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  useEffect(() => {
    setPage(1);
  }, [moduleFilter]);

  const loadData = useCallback(async (pageOverride?: number) => {
    try {
      setLoading(true);
      // When transitioning from module filter to no filter, use page 1 to avoid stale pagination state
      const hadModuleFilter = prevModuleFilterRef.current !== null;
      if (moduleFilter) prevModuleFilterRef.current = moduleFilter;
      else prevModuleFilterRef.current = null;
      const pageToLoad = pageOverride ?? (moduleFilter ? 1 : (hadModuleFilter ? 1 : page));
      if (pageOverride !== undefined) {
        setPage(pageOverride);
        skipNextPageLoadRef.current = true;
      }
      const res = await permissionsService.getAll(
        moduleFilter ? { module: moduleFilter } : { page: pageToLoad, limit }
      );
      if (Array.isArray(res)) {
        setPermissions(res);
        setTotal(res.length);
        setTotalPages(1);
      } else {
        setPermissions(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal memuat data permission'), 'error');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, page, limit, showToast]);

  useEffect(() => {
    if (skipNextPageLoadRef.current) {
      skipNextPageLoadRef.current = false;
      return;
    }
    loadData();
  }, [moduleFilter, page, loadData]);

  const handleCreate = () => {
    setSelectedPermission(null);
    setShowForm(true);
  };

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowForm(true);
  };

  const handleDelete = async (permission: Permission) => {
    setDeleteConfirm(permission);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await permissionsService.delete(deleteConfirm.id);
      showToast('Permission berhasil dihapus', 'success');
      await loadData(1);
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal menghapus permission'), 'error');
    } finally {
      setDeleteConfirm(null);
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
      await loadData(1);
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal menyimpan permission'), 'error');
    }
  };

  // Get unique modules
  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Memuat data...</div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <BackButton href="/" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Permission</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen izin akses sistem</p>
            </div>
            <Button onClick={handleCreate} size="md">
              Tambah Permission
            </Button>
          </div>

          {/* Module Filter */}
          <Card>
            <Label htmlFor="moduleFilter">Filter Module</Label>
            <Select
              id="moduleFilter"
              options={modules.map((module) => ({
                value: module,
                label: module,
              }))}
              placeholder="Semua Module"
              value={moduleFilter}
              onChange={(value) => setModuleFilter(value)}
              className="w-full md:w-64"
            />
          </Card>

          {/* Permissions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
            {!moduleFilter && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
              />
            )}
          </div>

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

          <ConfirmationModal
            isOpen={!!deleteConfirm}
            title="Hapus Permission?"
            message={`Hapus permission "${deleteConfirm?.slug}"?`}
            confirmText="Ya, Hapus"
            cancelText="Batal"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm(null)}
            variant="danger"
          />
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
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {permission ? 'Edit Permission' : 'Tambah Permission'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="module">
              Module <span className="text-error-500">*</span>
            </Label>
            <Input
              id="module"
              type="text"
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              required
              placeholder="e.g., products"
            />
          </div>

          <div>
            <Label htmlFor="action">
              Action <span className="text-error-500">*</span>
            </Label>
            <Input
              id="action"
              type="text"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              required
              placeholder="e.g., create"
            />
          </div>

          <div>
            <Label htmlFor="slug">
              Slug <span className="text-error-500">*</span>
            </Label>
            <Input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="e.g., products.create"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Simpan
            </Button>
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
