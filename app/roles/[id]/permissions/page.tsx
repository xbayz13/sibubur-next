'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { rolesService } from '@/lib/services/roles';
import { permissionsService } from '@/lib/services/permissions';
import { rolePermissionsService } from '@/lib/services/role-permissions';
import { Role, Permission } from '@/types';

export default function RolePermissionsPage() {
  const params = useParams();
  const { showToast } = useToast();
  const roleId = Number(params.id);
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) return response.data.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [roleData, allPermsRes, rolePermsData] = await Promise.all([
        rolesService.getById(roleId),
        permissionsService.getAll({ limit: 100 }),
        rolePermissionsService.getRolePermissions(roleId),
      ]);

      setRole(roleData);
      setAllPermissions(Array.isArray(allPermsRes) ? allPermsRes : allPermsRes.data);
      setRolePermissions(rolePermsData);
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal memuat data'), 'error');
    } finally {
      setLoading(false);
    }
  }, [roleId, showToast]);

  useEffect(() => {
    if (roleId) {
      loadData();
    }
  }, [roleId, loadData]);

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
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal mengubah permission'), 'error');
    }
  };

  const handleAssignAll = async () => {
    try {
      const allPermissionIds = allPermissions.map((p) => p.id);
      await rolePermissionsService.assignPermissions(roleId, allPermissionIds);
      showToast('Semua permission berhasil ditetapkan', 'success');
      await loadData();
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal menetapkan permission'), 'error');
    }
  };

  const handleRemoveAll = async () => {
    setDeleteConfirm(true);
  };

  const confirmRemoveAll = async () => {
    try {
      await rolePermissionsService.assignPermissions(roleId, []);
      showToast('Semua permission berhasil dihapus', 'success');
      await loadData();
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal menghapus permission'), 'error');
    } finally {
      setDeleteConfirm(false);
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
          <BackButton href="/roles" label="Kembali ke Daftar Role" />
          <div className="flex justify-between items-center">
            <div>
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

           <ConfirmationModal
             isOpen={deleteConfirm}
             title="Hapus Semua Permission?"
             message="Hapus semua permission dari role ini?"
             confirmText="Ya, Hapus Semua"
             cancelText="Batal"
             onConfirm={confirmRemoveAll}
             onCancel={() => setDeleteConfirm(false)}
             variant="danger"
           />
         </div>
       </MainLayout>
     </ProtectedRoute>
   );
 }
