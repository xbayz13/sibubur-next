'use client';

import { Order } from '@/types';

interface OrderListProps {
  orders: Order[];
  onPayment: (order: Order) => void;
  onPrintReceipt: (order: Order, type: 'kitchen' | 'customer') => void;
  onCancel: (orderId: number) => void;
}

export default function OrderList({
  orders,
  onPayment,
  onPrintReceipt,
  onCancel,
}: OrderListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'canceled':
        return 'bg-rose-100 text-rose-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Lunas';
      case 'canceled':
        return 'Dibatalkan';
      case 'open':
        return 'Belum Bayar';
      default:
        return status;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <p className="text-slate-500">Belum ada pesanan</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nomor Order
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Toko
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Tanggal
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-sm text-slate-900">
                        {order.customerName || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <div className="text-sm text-slate-900">{order.store.name}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-sm font-medium text-slate-900">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-500 hidden lg:table-cell">
                      {new Date(order.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {order.status === 'open' && (
                          <>
                            <button
                              onClick={() => onPayment(order)}
                              className="text-emerald-600 hover:text-emerald-900 text-xs sm:text-sm px-1 sm:px-0"
                            >
                              Bayar
                            </button>
                            <button
                              onClick={() => onCancel(order.id)}
                              className="text-rose-600 hover:text-rose-900 text-xs sm:text-sm px-1 sm:px-0"
                            >
                              Batal
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onPrintReceipt(order, 'kitchen')}
                          className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm px-1 sm:px-0"
                          title="Cetak Dapur"
                        >
                          <span className="hidden sm:inline">Cetak Dapur</span>
                          <span className="sm:hidden">Dapur</span>
                        </button>
                        <button
                          onClick={() => onPrintReceipt(order, 'customer')}
                          className="text-purple-600 hover:text-purple-900 text-xs sm:text-sm px-1 sm:px-0"
                          title="Cetak Pelanggan"
                        >
                          <span className="hidden sm:inline">Cetak Pelanggan</span>
                          <span className="sm:hidden">Pelanggan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

