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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nomor Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pelanggan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Toko
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
                    {order.orderNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">
                    {order.customerName || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{order.store.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
                    Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    {order.status === 'open' && (
                      <>
                        <button
                          onClick={() => onPayment(order)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Bayar
                        </button>
                        <button
                          onClick={() => onCancel(order.id)}
                          className="text-rose-600 hover:text-rose-900"
                        >
                          Batal
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onPrintReceipt(order, 'kitchen')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Cetak Dapur
                    </button>
                    <button
                      onClick={() => onPrintReceipt(order, 'customer')}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Cetak Pelanggan
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

