'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { usersService, CreateUserDto, UpdateUserDto } from '@/lib/services/users';
import { rolesService } from '@/lib/services/roles';
import { storesService } from '@/lib/services/stores';
import { User, Role, Store } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Pagination from '@/components/ui/Pagination';

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadData();
  }, [page, showToast]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, storesRes] = await Promise.all([
        usersService.getAll({ page, limit }),
        roles.length === 0 ? rolesService.getAll({ limit: 100 }) : Promise.resolve(null),
        stores.length === 0 ? storesService.getAll({ limit: 100 }) : Promise.resolve(null),
      ]);
      setUsers(usersRes.data);
      setTotal(usersRes.total);
      setTotalPages(usersRes.totalPages);
      if (rolesRes) setRoles(rolesRes.data);
      if (storesRes) setStores(storesRes.data);
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
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Pengguna</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen pengguna sistem</p>
            </div>
            <Button onClick={handleCreate} size="md">
              Tambah Pengguna
            </Button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
                header: 'Toko',
                accessor: (user) => user.store?.name || '-',
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
            <UserForm
              user={selectedUser}
              roles={roles}
              stores={stores}
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
  stores: Store[];
  onSubmit: (data: CreateUserDto | UpdateUserDto) => void;
  onCancel: () => void;
}

function UserForm({ user, roles, stores, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserDto & { storeId?: number | null }>({
    username: user?.username || '',
    password: '',
    name: user?.name || '',
    roleId: user?.roleId || 0,
    storeId: user?.storeId || null,
  });

  // Check if selected role is Cashier
  const selectedRole = roles.find((r) => r.id === formData.roleId);
  const isCashierRole = selectedRole?.name?.toLowerCase().includes('cashier') || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name || !formData.roleId) {
      alert('Harap lengkapi semua field yang wajib');
      return;
    }
    if (isCashierRole && !formData.storeId) {
      alert('Toko wajib dipilih untuk cashier');
      return;
    }
    if (!user && !formData.password) {
      alert('Password wajib diisi untuk pengguna baru');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {user ? 'Edit Pengguna' : 'Tambah Pengguna'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="username">
              Username <span className="text-error-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!user}
            />
          </div>

          <div>
            <Label htmlFor="name">
              Nama <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">
              Password {!user && <span className="text-error-500">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              placeholder={user ? 'Kosongkan jika tidak ingin mengubah' : ''}
            />
          </div>

          <div>
            <Label htmlFor="role">
              Role <span className="text-error-500">*</span>
            </Label>
            <Select
              id="role"
              options={roles.map((role) => ({
                value: role.id.toString(),
                label: role.name,
              }))}
              placeholder="Pilih Role"
              value={formData.roleId.toString()}
              onChange={(value) => {
                const newRoleId = Number(value);
                const newRole = roles.find((r) => r.id === newRoleId);
                const isCashier = newRole?.name?.toLowerCase().includes('cashier') || false;
                setFormData({
                  ...formData,
                  roleId: newRoleId,
                  storeId: isCashier ? formData.storeId : null,
                });
              }}
            />
          </div>

          {isCashierRole && (
            <div>
              <Label htmlFor="store">
                Toko <span className="text-error-500">*</span>
              </Label>
              <Select
                id="store"
                options={stores.map((store) => ({
                  value: store.id.toString(),
                  label: store.name,
                }))}
                placeholder="Pilih Toko"
                value={formData.storeId?.toString() || ''}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    storeId: value ? Number(value) : null,
                  })
                }
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cashier harus ditugaskan ke satu toko (1-to-1 relationship)
              </p>
            </div>
          )}

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

