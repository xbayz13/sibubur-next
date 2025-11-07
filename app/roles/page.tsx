'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { rolesService, CreateRoleDto, UpdateRoleDto } from '@/lib/services/roles';
import { permissionsService } from '@/lib/services/permissions';
import { rolePermissionsService } from '@/lib/services/role-permissions';
import { Role, Permission } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import Link from 'next/link';

export default function RolesPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const rolesData = await rolesService.getAll();
      setRoles(rolesData);
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
      await loadData();
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
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan role', 'error');
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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Role</h1>
              <p className="text-slate-600">Manajemen role dan izin akses</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              Tambah Role
            </button>
          </div>

          {/* Roles Table */}
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
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-slate-800">{role ? 'Edit Role' : 'Tambah Role'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Role *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
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

