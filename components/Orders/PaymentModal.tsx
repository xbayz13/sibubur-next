'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';

interface Payment {
  methodId: number;
  method: string;
  amount: number;
  change: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  paymentMethods: PaymentMethod[];
  onComplete: (payment: Payment) => void;
  loading?: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  paymentMethods,
  onComplete,
  loading = false,
}: PaymentModalProps) {
  const [step, setStep] = useState<'method' | 'confirm'>('method');
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [amountReceived, setAmountReceived] = useState<number | null>(null);

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
  const change = amountReceived ? amountReceived - total : 0;
  const canProceed = selectedMethod !== null && (
    selectedPaymentMethod?.name.toLowerCase().includes('transfer') || amountReceived >= total
  );

  const handleNext = () => {
    if (!canProceed) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedPaymentMethod) return;
    
    const payment: Payment = {
      methodId: selectedPaymentMethod.id,
      method: selectedPaymentMethod.name,
      amount: amountReceived || total,
      change: change > 0 ? change : 0,
    };

    onComplete(payment);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {step === 'method' ? 'Pilih Metode Pembayaran' : 'Konfirmasi Pembayaran'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'method' ? (
            // Payment Method Selection
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Total: <span className="text-2xl font-bold text-brand-500">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-6 border-2 rounded-lg transition ${
                      selectedMethod === method.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {method.name.toLowerCase().includes('cash') && '💵'}
                        {method.name.toLowerCase().includes('transfer') && '🏦'}
                        {method.name.toLowerCase().includes('kartu') && '💳'}
                        {!method.name.toLowerCase().includes('cash') && !method.name.toLowerCase().includes('transfer') && !method.name.toLowerCase().includes('kartu') && '💰'}
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-white">{method.name}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Amount input for cash */}
              {selectedPaymentMethod?.name.toLowerCase().includes('cash') && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Label htmlFor="amount">Jumlah Diterima</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || null)}
                    className="mb-4"
                    autoFocus
                  />
                  {amountReceived !== null && (
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      Kembalian: <span className="text-success-500">
                        Rp {change.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Confirmation
            <div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Metode:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPaymentMethod?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Total:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>
                {amountReceived && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Diterima:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Rp {amountReceived.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between text-lg">
                      <span className="text-gray-700 dark:text-gray-300">Kembalian:</span>
                      <span className="font-bold text-success-500">
                        Rp {change.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-center">
                Klik &quot;Selesaikan&quot; untuk menyelesaikan transaksi
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-2 justify-end bg-white dark:bg-gray-900 sticky bottom-0">
          <Button 
            variant="outline" 
            onClick={() => {
              if (step === 'confirm') {
                setStep('method');
              } else {
                onClose();
              }
            }}
          >
            {step === 'confirm' ? 'Kembali' : 'Batal'}
          </Button>
          
          <Button
            disabled={!canProceed}
            loading={loading}
            onClick={step === 'method' ? handleNext : handleConfirm}
          >
            {step === 'method' ? 'Lanjutkan' : 'Selesaikan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
