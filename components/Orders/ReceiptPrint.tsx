'use client';

import { useRef, useEffect } from 'react';
import { Order, Transaction } from '@/types';

interface ReceiptPrintProps {
  order: Order;
  type: 'kitchen' | 'customer';
  onClose: () => void;
  transaction?: Transaction;
  autoPrint?: boolean;
}

export default function ReceiptPrint({
  order,
  type,
  onClose,
  transaction,
  autoPrint = false,
}: ReceiptPrintProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Auto print for kitchen receipt
  useEffect(() => {
    if (autoPrint && type === 'kitchen') {
      const timer = setTimeout(() => {
        if (receiptRef.current) {
          handlePrint();
        }
      }, 500); // Small delay to ensure content is rendered
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, type, order.id]); // Include order.id to trigger when order changes

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const isKitchen = type === 'kitchen';
        printWindow.document.write(`
          <html>
            <head>
              <title>${isKitchen ? 'Struk Dapur' : 'Struk Pelanggan'} - ${order.orderNumber}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: 'Courier New', 'Monaco', monospace;
                  width: 80mm;
                  margin: 0 auto;
                  padding: 10px 5px;
                  color: #000000;
                  background: #ffffff;
                  font-size: 11px;
                  line-height: 1.3;
                }
                .header {
                  text-align: center;
                  border-bottom: 1px solid #000000;
                  padding-bottom: 8px;
                  margin-bottom: 8px;
                }
                .header-title {
                  font-size: ${isKitchen ? '16px' : '18px'};
                  font-weight: bold;
                  color: #000000;
                  margin-bottom: 2px;
                  letter-spacing: 0.5px;
                }
                .header-subtitle {
                  font-size: 9px;
                  color: #000000;
                  margin-top: 1px;
                }
                .receipt-type {
                  text-align: center;
                  font-weight: bold;
                  font-size: ${isKitchen ? '13px' : '12px'};
                  color: #000000;
                  padding: 4px;
                  margin-bottom: 8px;
                  text-transform: uppercase;
                  border-top: 1px solid #000000;
                  border-bottom: 1px solid #000000;
                }
                .info {
                  margin: 8px 0;
                  color: #000000;
                }
                .info-row {
                  margin: 4px 0;
                  font-size: 10px;
                  color: #000000;
                  line-height: 1.4;
                }
                .info-label {
                  font-weight: bold;
                  color: #000000;
                }
                .items {
                  border-top: 1px solid #000000;
                  border-bottom: 1px solid #000000;
                  padding: 8px 0;
                  margin: 8px 0;
                }
                .items-title {
                  text-align: center;
                  font-weight: bold;
                  font-size: ${isKitchen ? '12px' : '11px'};
                  color: #000000;
                  margin-bottom: 6px;
                  text-transform: uppercase;
                }
                .item {
                  margin: ${isKitchen ? '6px 0' : '4px 0'};
                  padding: ${isKitchen ? '4px 0' : '2px 0'};
                }
                .item-name {
                  font-weight: bold;
                  font-size: ${isKitchen ? '12px' : '11px'};
                  color: #000000;
                  margin-bottom: 1px;
                }
                .item-details {
                  margin-left: ${isKitchen ? '0' : '8px'};
                  font-size: 10px;
                  color: #000000;
                  margin-top: 1px;
                }
                .item-addon {
                  margin-left: 10px;
                  color: #000000;
                  font-size: 9px;
                }
                .item-subtotal {
                  margin-top: 2px;
                  font-size: 9px;
                  color: #000000;
                }
                .total {
                  margin-top: 8px;
                  padding-top: 8px;
                  border-top: 1px solid #000000;
                }
                .total-row {
                  margin: 2px 0;
                  font-size: 10px;
                  color: #000000;
                  display: flex;
                  justify-content: space-between;
                }
                .total-amount {
                  font-size: ${isKitchen ? '14px' : '16px'};
                  font-weight: bold;
                  color: #000000;
                  margin-top: 4px;
                  display: flex;
                  justify-content: space-between;
                }
                .payment-info {
                  margin-top: 8px;
                  padding-top: 8px;
                  border-top: 1px solid #000000;
                  font-size: 10px;
                }
                .payment-row {
                  margin: 3px 0;
                  display: flex;
                  justify-content: space-between;
                }
                .payment-label {
                  font-weight: bold;
                }
                .footer {
                  text-align: center;
                  margin-top: 10px;
                  padding-top: 8px;
                  border-top: 1px solid #000000;
                  color: #000000;
                }
                .footer-message {
                  font-size: ${isKitchen ? '10px' : '11px'};
                  color: #000000;
                  margin-bottom: 4px;
                  font-weight: ${isKitchen ? 'bold' : 'normal'};
                }
                .footer-time {
                  font-size: 9px;
                  color: #000000;
                }
                .divider {
                  border-top: 1px dashed #000000;
                  margin: 8px 0;
                }
                @media print {
                  body {
                    width: 80mm;
                    margin: 0;
                    padding: 5px;
                  }
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const isKitchen = type === 'kitchen';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-black">
              {isKitchen ? 'Struk Dapur' : 'Struk Pelanggan'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div
            ref={receiptRef}
            className={`bg-white border-2 ${isKitchen ? 'border-black' : 'border-dashed border-slate-400'} p-6 font-mono text-sm text-black`}
            style={{ width: '80mm', margin: '0 auto' }}
          >
            {/* Header */}
            <div className="header text-center">
              <div className="header-title">SiBubur</div>
              <div className="header-subtitle">Sistem Point of Sale</div>
            </div>

            {/* Receipt Type Badge */}
            <div className="receipt-type">
              {isKitchen ? 'STRUK DAPUR' : 'STRUK PELANGGAN'}
            </div>

            {/* Order Info */}
            <div className="info">
              <div className="info-row">
                <span className="info-label">No. Order:</span> {order.orderNumber}
              </div>
              <div className="info-row">
                <span className="info-label">Tanggal:</span>{' '}
                {new Date(order.createdAt).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {order.customerName && (
                <div className="info-row">
                  <span className="info-label">Pelanggan:</span> {order.customerName}
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Toko:</span> {order.store.name}
              </div>
              {isKitchen && (
                <div className="info-row">
                  <span className="info-label">Status:</span>{' '}
                  {order.status === 'open'
                    ? 'Belum Bayar'
                    : order.status === 'paid'
                    ? 'Lunas'
                    : 'Dibatalkan'}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="items">
              <div className="items-title">
                {isKitchen ? 'DAFTAR PESANAN' : 'ITEM PESANAN'}
              </div>
              {order.orderItems.map((item, idx) => (
                <div key={idx} className="item">
                  <div className="item-name">
                    {item.quantity}x {item.product.name}
                  </div>
                  {!isKitchen && (
                    <div className="item-details">
                      @ Rp {Number(item.unitPrice).toLocaleString('id-ID')}
                    </div>
                  )}
                  {item.orderItemAddons && item.orderItemAddons.length > 0 && (
                    <div className="item-details">
                      {item.orderItemAddons.map((addon, aidx) => (
                        <div key={aidx} className="item-addon">
                          {isKitchen ? '•' : '+'} {addon.quantity}x {addon.addon.name}
                          {!isKitchen && (
                            <> @ Rp {Number(addon.addonPrice).toLocaleString('id-ID')}</>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isKitchen && (
                    <div className="item-subtotal">
                      Subtotal: Rp {Number(item.lineTotal).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total - Only show for customer receipt */}
            {!isKitchen && (
              <div className="total">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>Rp {Number(order.subtotalAmount || order.totalAmount).toLocaleString('id-ID')}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="total-row">
                    <span>Pajak:</span>
                    <span>Rp {Number(order.taxAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="total-amount">
                  <span>TOTAL:</span>
                  <span>Rp {Number(order.totalAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Payment Info - Only show for customer receipt with transaction */}
            {!isKitchen && transaction && (
              <div className="payment-info">
                <div className="payment-row">
                  <span className="payment-label">Metode Pembayaran:</span>
                  <span>{transaction.paymentMethod?.name || 'Tunai'}</span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Jumlah Bayar:</span>
                  <span>Rp {Number(transaction.amount).toLocaleString('id-ID')}</span>
                </div>
                {transaction.change !== undefined && transaction.change > 0 && (
                  <div className="payment-row">
                    <span className="payment-label">Kembalian:</span>
                    <span>Rp {Number(transaction.change).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {isKitchen ? (
              <div className="footer">
                <div className="footer-message">
                  PERHATIAN: Siapkan pesanan sesuai item di atas
                </div>
                <div className="footer-time">
                  Dicetak: {new Date().toLocaleString('id-ID')}
                </div>
              </div>
            ) : (
              <div className="footer">
                <div className="footer-message">
                  Terima kasih atas kunjungan Anda!
                </div>
                <div className="footer-message" style={{ fontSize: '9px', marginTop: '2px' }}>
                  Semoga Anda puas dengan pelayanan kami
                </div>
                <div className="footer-time">
                  {new Date().toLocaleString('id-ID')}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Cetak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

