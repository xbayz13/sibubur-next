'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { rolesService, CreateRoleDto, UpdateRoleDto } from '@/lib/services/roles';
import { permissionsService } from '@/lib/services/permissions';
import { rolePermissionsService } from '@/lib/services/role-permissions';
import { Role, Permission } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Pagination from '@/components/ui/Pagination';

export default function RolesPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadData();
  }, [page, showToast]);

  const loadData = async (pageOverride?: number) => {
    try {
      setLoading(true);
      const pageToLoad = pageOverride ?? page;
      if (pageOverride !== undefined) setPage(pageOverride);
      const res = await rolesService.getAll({ page: pageToLoad, limit });
      setRoles(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setShowForm(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus role ${role.name}?`)) {
      return;
    }

    try {
      await rolesService.delete(role.id);
      showToast('Role berhasil dihapus', 'success');
      await loadData(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus role', 'error');
    }
  };

  const handleSubmit = async (data: CreateRoleDto | UpdateRoleDto) => {
    try {
      if (selectedRole) {
        await rolesService.update(selectedRole.id, data as UpdateRoleDto);
        showToast('Role berhasil diperbarui', 'success');
      } else {
        await rolesService.create(data as CreateRoleDto);
        showToast('Role berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setSelectedRole(null);
      await loadData(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan role', 'error');
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Role</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen role dan izin akses</p>
            </div>
            <Button onClick={handleCreate} size="md">
              Tambah Role
            </Button>
          </div>

          {/* Roles Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <DataTable
              data={roles}
              columns={[
              {
                header: 'Nama Role',
                accessor: 'name',
              },
              {
                header: 'Jumlah Permission',
                accessor: (role) => {
                  if (role.rolePermissions) {
                    return role.rolePermissions.length;
                  }
                  if (role.permissions) {
                    return role.permissions.length;
                  }
                  return '0';
                },
              },
              {
                header: 'Aksi',
                accessor: (role) => (
                  <Link
                    href={`/roles/${role.id}/permissions`}
                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 text-sm"
                  >
                    Kelola Permission
                  </Link>
                ),
              },
            ]}
            onEdit={handleEdit}
              onDelete={handleDelete}
              keyExtractor={(role) => role.id}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>

          {/* Form Modal */}
          {showForm && (
            <RoleForm
              role={selectedRole}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setSelectedRole(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

interface RoleFormProps {
  role: Role | null;
  onSubmit: (data: CreateRoleDto | UpdateRoleDto) => void;
  onCancel: () => void;
}

function RoleForm({ role, onSubmit, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: role?.name || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Harap isi nama role');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white/90">{role ? 'Edit Role' : 'Tambah Role'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">
              Nama Role <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
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

