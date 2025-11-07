'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { employeesService } from '@/lib/services/employees';
import { attendancesService, CreateAttendanceDto, UpdateAttendanceDto } from '@/lib/services/attendances';
import { storesService } from '@/lib/services/stores';
import { Employee, Attendance, Store } from '@/types';
import DataTable from '@/components/MasterData/DataTable';

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();

  // Load stores and employees only once
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [employeesData, storesData] = await Promise.all([
          employeesService.getAll(),
          storesService.getAll(),
        ]);
        setEmployees(employeesData);
        setStores(storesData);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data', 'error');
      }
    };
    loadStaticData();
  }, [showToast]);

  // Load attendances when date or store filter changes
  useEffect(() => {
    const loadAttendances = async () => {
      try {
        setLoading(true);
        const attendancesData = await attendancesService.getAll(undefined, selectedDate);
        setAttendances(attendancesData);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data absensi', 'error');
        setAttendances([]);
      } finally {
        setLoading(false);
      }
    };
    loadAttendances();
  }, [selectedDate, showToast]);

  // Filter employees by store (client-side filtering)
  const filteredEmployees = selectedStoreId
    ? employees.filter((emp) => emp.store?.id === selectedStoreId)
    : employees;

  const handleRecordAttendance = () => {
    setShowAttendanceForm(true);
  };

  const reloadAttendances = async () => {
    try {
      const attendancesData = await attendancesService.getAll(undefined, selectedDate);
      setAttendances(attendancesData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data absensi', 'error');
    }
  };

  const handleDeleteAttendance = async (attendance: Attendance) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus absensi ini?`)) {
      return;
    }

    try {
      await attendancesService.delete(attendance.id);
      showToast('Absensi berhasil dihapus', 'success');
      await reloadAttendances();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus absensi', 'error');
    }
  };

  const handleSubmitAttendance = async (attendanceData: Array<{ employeeId: number; status: 'present' | 'absent'; existingId?: number }>) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const data of attendanceData) {
        try {
          if (data.existingId) {
            // Update existing
            await attendancesService.update(data.existingId, {
              date: selectedDate,
              employeeId: data.employeeId,
              status: data.status,
            });
          } else {
            // Create new
            await attendancesService.create({
              date: selectedDate,
              employeeId: data.employeeId,
              status: data.status,
            });
          }
          successCount++;
        } catch (error: any) {
          console.error(`Failed to save attendance for employee ${data.employeeId}:`, error);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        showToast(`${successCount} absensi berhasil disimpan, ${errorCount} gagal`, 'error');
      } else {
        showToast(`${successCount} absensi berhasil direkam`, 'success');
      }
      
      setShowAttendanceForm(false);
      await reloadAttendances();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan absensi', 'error');
    }
  };

  // Get attendance status for each employee (memoized)
  const getEmployeeAttendance = (employeeId: number): Attendance | undefined => {
    return attendances.find((att) => att.employeeId === employeeId);
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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Karyawan & Absensi</h1>
              <p className="text-slate-600">Manajemen data karyawan dan absensi harian</p>
            </div>
            <button
              onClick={handleRecordAttendance}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              Rekam Absensi
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter Toko
              </label>
              <select
                value={selectedStoreId || ''}
                onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              >
                <option value="">Semua Toko</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employees and Attendance Table */}
          <DataTable
            data={employees}
            columns={[
              {
                header: 'Nama',
                accessor: 'name',
              },
              {
                header: 'Toko',
                accessor: (employee) => employee.store?.name || '-',
              },
              {
                header: 'Status',
                accessor: (employee) => (
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      employee.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {employee.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                ),
              },
              {
                header: 'Absensi',
                accessor: (employee) => {
                  const attendance = getEmployeeAttendance(employee.id);
                  if (!attendance) {
                    return (
                      <span className="text-gray-400 text-sm">Belum direkam</span>
                    );
                  }
                  return (
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        attendance.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {attendance.status === 'present' ? 'Hadir' : 'Tidak Hadir'}
                    </span>
                  );
                },
              },
            ]}
            keyExtractor={(employee) => employee.id}
          />

          {/* Attendance Records Table */}
          {attendances.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Rekaman Absensi - {new Date(selectedDate).toLocaleDateString('id-ID')}</h2>
              <DataTable
                data={attendances}
                columns={[
                  {
                    header: 'Karyawan',
                    accessor: (attendance) => attendance.employee?.name || '-',
                  },
                  {
                    header: 'Toko',
                    accessor: (attendance) => attendance.employee?.store?.name || '-',
                  },
                  {
                    header: 'Status',
                    accessor: (attendance) => (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          attendance.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {attendance.status === 'present' ? 'Hadir' : 'Tidak Hadir'}
                      </span>
                    ),
                  },
                ]}
                onDelete={handleDeleteAttendance}
                keyExtractor={(attendance) => attendance.id}
              />
            </div>
          )}

          {/* Attendance Form Modal */}
          {showAttendanceForm && (
            <AttendanceForm
              employees={filteredEmployees}
              date={selectedDate}
              existingAttendances={attendances}
              onSubmit={handleSubmitAttendance}
              onCancel={() => setShowAttendanceForm(false)}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

interface AttendanceFormProps {
  employees: Employee[];
  date: string;
  existingAttendances: Attendance[];
  onSubmit: (data: Array<{ employeeId: number; status: 'present' | 'absent'; existingId?: number }>) => void;
  onCancel: () => void;
}

function AttendanceForm({
  employees,
  date,
  existingAttendances,
  onSubmit,
  onCancel,
}: AttendanceFormProps) {
  // State to track attendance for each employee
  const [attendanceMap, setAttendanceMap] = useState<Map<number, 'present' | 'absent' | null>>(
    new Map()
  );

  // Initialize attendance map when employees or date changes
  useEffect(() => {
    const newMap = new Map<number, 'present' | 'absent' | null>();
    employees.forEach((emp) => {
      const existing = existingAttendances.find(
        (att) => att.employeeId === emp.id && att.date === date
      );
      newMap.set(emp.id, existing ? existing.status : null);
    });
    setAttendanceMap(newMap);
  }, [employees, date, existingAttendances]);

  const handleToggleEmployee = (employeeId: number) => {
    setAttendanceMap((prev) => {
      const newMap = new Map(prev);
      const currentStatus = newMap.get(employeeId);
      
      // Cycle through: null -> present -> absent -> null
      if (currentStatus === null) {
        newMap.set(employeeId, 'present');
      } else if (currentStatus === 'present') {
        newMap.set(employeeId, 'absent');
      } else {
        newMap.set(employeeId, null);
      }
      
      return newMap;
    });
  };

  const handleSelectAll = (status: 'present' | 'absent') => {
    setAttendanceMap((prev) => {
      const newMap = new Map(prev);
      employees.forEach((emp) => {
        newMap.set(emp.id, status);
      });
      return newMap;
    });
  };

  const handleClearAll = () => {
    setAttendanceMap((prev) => {
      const newMap = new Map(prev);
      employees.forEach((emp) => {
        newMap.set(emp.id, null);
      });
      return newMap;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get all employees with attendance marked
    const attendanceData: Array<{ employeeId: number; status: 'present' | 'absent'; existingId?: number }> = [];
    
    attendanceMap.forEach((status, employeeId) => {
      if (status !== null) {
        const existing = existingAttendances.find(
          (att) => att.employeeId === employeeId && att.date === date
        );
        attendanceData.push({
          employeeId,
          status,
          existingId: existing?.id,
        });
      }
    });

    if (attendanceData.length === 0) {
      alert('Harap pilih setidaknya satu karyawan');
      return;
    }

    onSubmit(attendanceData);
  };

  const selectedCount = Array.from(attendanceMap.values()).filter((status) => status !== null).length;
  const presentCount = Array.from(attendanceMap.values()).filter((status) => status === 'present').length;
  const absentCount = Array.from(attendanceMap.values()).filter((status) => status === 'absent').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] shadow-xl flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Rekam Absensi</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
            disabled
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleSelectAll('present')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
          >
            Tandai Semua Hadir
          </button>
          <button
            type="button"
            onClick={() => handleSelectAll('absent')}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium transition-colors"
          >
            Tandai Semua Tidak Hadir
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 text-sm font-medium transition-colors"
          >
            Hapus Semua
          </button>
          <div className="ml-auto flex items-center gap-4 text-sm text-slate-600">
            <span>Terpilih: {selectedCount}</span>
            <span className="text-emerald-600">Hadir: {presentCount}</span>
            <span className="text-rose-600">Tidak Hadir: {absentCount}</span>
          </div>
        </div>

        {/* Employee Checklist */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-4 space-y-2 max-h-96">
          {employees.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Tidak ada karyawan untuk ditampilkan
            </div>
          ) : (
            employees.map((employee) => {
              const status = attendanceMap.get(employee.id);
              const existing = existingAttendances.find(
                (att) => att.employeeId === employee.id && att.date === date
              );

              return (
                <div
                  key={employee.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    status === 'present'
                      ? 'bg-emerald-50 border-emerald-300'
                      : status === 'absent'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleToggleEmployee(employee.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center">
                      {status === 'present' ? (
                        <div className="w-6 h-6 rounded border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : status === 'absent' ? (
                        <div className="w-6 h-6 rounded border-2 border-rose-600 bg-rose-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded border-2 border-slate-300 bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{employee.name}</div>
                      <div className="text-sm text-slate-600">
                        {employee.store?.name || 'Tidak ada toko'}
                      </div>
                    </div>
                    <div className="text-sm">
                      {status === 'present' && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                          Hadir
                        </span>
                      )}
                      {status === 'absent' && (
                        <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded text-xs font-medium">
                          Tidak Hadir
                        </span>
                      )}
                      {status === null && existing && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                          Sudah ada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2 pt-4 mt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all font-medium"
          >
            Simpan ({selectedCount} absensi)
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
