'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

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
  
  // Auto-set amount for non-cash methods
  const isCash = selectedPaymentMethod?.name.toLowerCase().includes('cash');
  const effectiveAmount = isCash ? (amountReceived || 0) : total;
  
  const change = effectiveAmount > total ? effectiveAmount - total : 0;
  
  const canProceed = selectedMethod !== null && (
    !isCash || (amountReceived !== null && amountReceived >= total)
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
      amount: effectiveAmount,
      change: change > 0 ? change : 0,
    };

    onComplete(payment);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="bg-black text-white border border-white/10 max-w-2xl w-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-black z-auto">
        <h2 className="text-2xl font-bold text-white">
          {step === 'method' ? 'Pilih Metode Pembayaran' : 'Konfirmasi Pembayaran'}
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'method' ? (
          // Payment Method Selection
          <div>
            <p className="text-gray-300 mb-6">
              Total: <span className="text-2xl font-bold text-orange-500">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    if (!method.name.toLowerCase().includes('cash')) {
                      setAmountReceived(total);
                    } else {
                      setAmountReceived(null);
                    }
                  }}
                  className={`p-6 border-2 rounded-lg transition ${
                    selectedMethod === method.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {method.name.toLowerCase().includes('cash') && '💵'}
                      {method.name.toLowerCase().includes('transfer') && '🏦'}
                      {method.name.toLowerCase().includes('qris') && '📱'}
                      {method.name.toLowerCase().includes('kartu') && '💳'}
                      {!method.name.toLowerCase().includes('cash') && !method.name.toLowerCase().includes('transfer') && !method.name.toLowerCase().includes('qris') && !method.name.toLowerCase().includes('kartu') && '💰'}
                    </div>
                    <p className="font-semibold text-white">{method.name}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Amount input for cash */}
            {isCash && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Jumlah Diterima</label>
                <input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amountReceived || ''}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white placeholder:text-gray-500 mb-4"
                  autoFocus
                />
                {amountReceived !== null && (
                  <div className="text-lg font-semibold text-white">
                    Kembalian: <span className="text-green-500">
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
            <div className="bg-white/5 border border-white/10 p-6 rounded-lg space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Metode:</span>
                <span className="font-semibold text-white">{selectedPaymentMethod?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="font-semibold text-white">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
              {isCash && amountReceived !== null && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Diterima:</span>
                    <span className="font-semibold text-white">
                      Rp {amountReceived.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between text-lg">
                    <span className="text-gray-400">Kembalian:</span>
                    <span className="font-bold text-green-500">
                      Rp {change.toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </div>

            <p className="text-gray-400 text-center">
              Klik &quot;Selesaikan&quot; untuk menyelesaikan transaksi
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/10 flex gap-2 justify-end bg-black sticky bottom-0">
        <button 
          onClick={() => {
            if (step === 'confirm') {
              setStep('method');
            } else {
              onClose();
            }
          }}
          className="px-6 py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors font-medium"
        >
          {step === 'confirm' ? 'Kembali' : 'Batal'}
        </button>
        
        <button
          disabled={!canProceed}
          onClick={step === 'method' ? handleNext : handleConfirm}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {step === 'method' ? 'Lanjutkan' : 'Selesaikan'}
        </button>
      </div>
    </Modal>
  );
}
