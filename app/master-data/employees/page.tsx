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
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
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
      const [employeesRes, storesRes] = await Promise.all([
        employeesService.getAll({ page, limit }),
        storesService.getAll({ limit: 100 }),
      ]);
      setEmployees(employeesRes.data);
      setStores(storesRes.data);
      setTotal(employeesRes.total);
      setTotalPages(employeesRes.totalPages);
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
          <BackButton href="/master-data" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Karyawan</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen data karyawan</p>
            </div>
            <Button onClick={handleCreate} size="md">
              + Tambah Karyawan
            </Button>
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
                    <span className="px-2 py-1 bg-success-100 text-success-800 dark:bg-success-500/20 dark:text-success-400 rounded-full text-xs">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 rounded-full text-xs">
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
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
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

