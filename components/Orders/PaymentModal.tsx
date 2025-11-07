'use client';

import { useState } from 'react';
import { Order, PaymentMethod } from '@/types';

interface PaymentModalProps {
  order: Order;
  paymentMethods: PaymentMethod[];
  onProcess: (paymentMethodId: number, amount: number, change: number) => void;
  onClose: () => void;
}

export default function PaymentModal({
  order,
  paymentMethods,
  onProcess,
  onClose,
}: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(
    paymentMethods[0]?.id || 0
  );
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [error, setError] = useState('');

  const totalAmount = Number(order.totalAmount);
  const paidAmount = parseFloat(amountPaid) || 0;
  const change = paidAmount - totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPaymentMethod) {
      setError('Pilih metode pembayaran');
      return;
    }

    if (paidAmount < totalAmount) {
      setError('Jumlah pembayaran kurang');
      return;
    }

    onProcess(selectedPaymentMethod, paidAmount, Math.max(0, change));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Proses Pembayaran</h2>

          <div className="space-y-4 mb-6">
            <div>
              <div className="text-sm text-slate-600">Nomor Order</div>
              <div className="text-lg font-semibold">{order.orderNumber}</div>
            </div>

            <div>
              <div className="text-sm text-slate-600">Total Tagihan</div>
              <div className="text-2xl font-bold text-blue-600">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Metode Pembayaran *
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => {
                  setSelectedPaymentMethod(Number(e.target.value));
                  setError('');
                }}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                required
              >
                <option value={0}>Pilih Metode Pembayaran</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Jumlah Bayar *
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => {
                  setAmountPaid(e.target.value);
                  setError('');
                }}
                min={totalAmount}
                step="1000"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-lg"
                placeholder="0"
                required
              />
              {paidAmount > 0 && (
                <div className="mt-2">
                  {change >= 0 ? (
                    <div className="text-emerald-600 font-semibold">
                      Kembalian: Rp {change.toLocaleString('id-ID')}
                    </div>
                  ) : (
                    <div className="text-rose-600">
                      Kurang: Rp {Math.abs(change).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

