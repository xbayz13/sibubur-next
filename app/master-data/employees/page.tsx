'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { employeesService } from '@/lib/services/employees';
import { storesService } from '@/lib/services/stores';
import { Employee, Store } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import EmployeeForm from '@/components/MasterData/EmployeeForm';

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, storesData] = await Promise.all([
        employeesService.getAll(),
        storesService.getAll(),
      ]);
      setEmployees(employeesData);
      setStores(storesData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data karyawan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleSubmit = async (employeeData: {
    name: string;
    storeId?: number;
    status?: 'active' | 'inactive';
    dailySalary?: number;
  }) => {
    try {
      if (editingEmployee) {
        await employeesService.update(editingEmployee.id, employeeData);
        showToast('Karyawan berhasil diperbarui', 'success');
      } else {
        await employeesService.create(employeeData);
        showToast('Karyawan berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingEmployee(null);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan karyawan', 'error');
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus karyawan "${employee.name}"?`)) return;

    try {
      await employeesService.delete(employee.id);
      showToast('Karyawan berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus karyawan', 'error');
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
          <BackButton href="/master-data" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Karyawan</h1>
              <p className="text-slate-600">Manajemen data karyawan</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Tambah Karyawan
            </button>
          </div>

          <DataTable
            data={employees}
            columns={[
              { header: 'Nama', accessor: 'name' },
              {
                header: 'Toko',
                accessor: (item) => item.store?.name || '-',
              },
              {
                header: 'Status',
                accessor: (item) => {
                  const status = (item as any).status;
                  return status === 'active' ? (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs">
                      Tidak Aktif
                    </span>
                  );
                },
              },
              {
                header: 'Gaji Harian',
                accessor: (item) => {
                  const salary = (item as any).dailySalary;
                  return salary ? `Rp ${Number(salary).toLocaleString('id-ID')}` : '-';
                },
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            keyExtractor={(item) => item.id}
          />

          {showForm && (
            <EmployeeForm
              employee={editingEmployee}
              stores={stores}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingEmployee(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

