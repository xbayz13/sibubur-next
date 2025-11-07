'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { rolesService } from '@/lib/services/roles';
import { permissionsService } from '@/lib/services/permissions';
import { rolePermissionsService } from '@/lib/services/role-permissions';
import { Role, Permission } from '@/types';

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const roleId = Number(params.id);
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleId) {
      loadData();
    }
  }, [roleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roleData, allPermsData, rolePermsData] = await Promise.all([
        rolesService.getById(roleId),
        permissionsService.getAll(),
        rolePermissionsService.getRolePermissions(roleId),
      ]);

      setRole(roleData);
      setAllPermissions(allPermsData);
      setRolePermissions(rolePermsData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (permissionId: number) => {
    const isAssigned = rolePermissions.some((p) => p.id === permissionId);

    try {
      if (isAssigned) {
        await rolePermissionsService.removePermission(roleId, permissionId);
        showToast('Permission berhasil dihapus', 'success');
      } else {
        await rolePermissionsService.addPermission(roleId, permissionId);
        showToast('Permission berhasil ditambahkan', 'success');
      }
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal mengubah permission', 'error');
    }
  };

  const handleAssignAll = async () => {
    try {
      const allPermissionIds = allPermissions.map((p) => p.id);
      await rolePermissionsService.assignPermissions(roleId, allPermissionIds);
      showToast('Semua permission berhasil ditetapkan', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menetapkan permission', 'error');
    }
  };

  const handleRemoveAll = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua permission dari role ini?')) {
      return;
    }

    try {
      await rolePermissionsService.assignPermissions(roleId, []);
      showToast('Semua permission berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus permission', 'error');
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

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/roles')}
                className="text-slate-600 hover:text-slate-900 mb-2"
              >
                ← Kembali ke Daftar Role
              </button>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Permission untuk Role: {role?.name}
              </h1>
              <p className="text-slate-600">Kelola izin akses untuk role ini</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAssignAll}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Pilih Semua
              </button>
              <button
                onClick={handleRemoveAll}
                className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              >
                Hapus Semua
              </button>
            </div>
          </div>

          {/* Permissions by Module */}
          <div className="space-y-4">
            {Object.entries(permissionsByModule).map(([module, permissions]) => (
              <div key={module} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 capitalize">
                  {module}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissions.map((permission) => {
                    const isAssigned = rolePermissions.some((p) => p.id === permission.id);
                    return (
                      <label
                        key={permission.id}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isAssigned
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleTogglePermission(permission.id)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            {permission.action}
                          </div>
                          <div className="text-xs text-slate-500">{permission.slug}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

