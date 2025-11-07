'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { usersService, CreateUserDto, UpdateUserDto } from '@/lib/services/users';
import { rolesService } from '@/lib/services/roles';
import { User, Role } from '@/types';
import DataTable from '@/components/MasterData/DataTable';

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        usersService.getAll(),
        rolesService.getAll(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data pengguna', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.username}?`)) {
      return;
    }

    try {
      await usersService.delete(user.id);
      showToast('Pengguna berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus pengguna', 'error');
    }
  };

  const handleSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    try {
      if (selectedUser) {
        await usersService.update(selectedUser.id, data as UpdateUserDto);
        showToast('Pengguna berhasil diperbarui', 'success');
      } else {
        await usersService.create(data as CreateUserDto);
        showToast('Pengguna berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setSelectedUser(null);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan pengguna', 'error');
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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Pengguna</h1>
              <p className="text-slate-600">Manajemen pengguna sistem</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              Tambah Pengguna
            </button>
          </div>

          {/* Users Table */}
          <DataTable
            data={users}
            columns={[
              {
                header: 'Username',
                accessor: 'username',
              },
              {
                header: 'Nama',
                accessor: 'name',
              },
              {
                header: 'Role',
                accessor: (user) => user.role?.name || '-',
              },
              {
                header: 'Tanggal Dibuat',
                accessor: (user) =>
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('id-ID')
                    : '-',
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            keyExtractor={(user) => user.id}
          />

          {/* Form Modal */}
          {showForm && (
            <UserForm
              user={selectedUser}
              roles={roles}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setSelectedUser(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

interface UserFormProps {
  user: User | null;
  roles: Role[];
  onSubmit: (data: CreateUserDto | UpdateUserDto) => void;
  onCancel: () => void;
}

function UserForm({ user, roles, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    username: user?.username || '',
    password: '',
    name: user?.name || '',
    roleId: user?.roleId || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name || !formData.roleId) {
      alert('Harap lengkapi semua field yang wajib');
      return;
    }
    if (!user && !formData.password) {
      alert('Password wajib diisi untuk pengguna baru');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-slate-800">
          {user ? 'Edit Pengguna' : 'Tambah Pengguna'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
              disabled={!!user}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {!user && '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required={!user}
              placeholder={user ? 'Kosongkan jika tidak ingin mengubah' : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role *
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
            >
              <option value="">Pilih Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
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

