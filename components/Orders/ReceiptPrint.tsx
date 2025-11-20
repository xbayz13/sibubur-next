'use client';

import { useRef } from 'react';
import { Order } from '@/types';

interface ReceiptPrintProps {
  order: Order;
  type: 'kitchen' | 'customer';
  onClose: () => void;
}

export default function ReceiptPrint({
  order,
  type,
  onClose,
}: ReceiptPrintProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

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
                  padding: 15px 10px;
                  color: #000000;
                  background: #ffffff;
                  font-size: 12px;
                  line-height: 1.4;
                }
                .header {
                  text-align: center;
                  border-bottom: ${isKitchen ? '3px solid #000' : '2px dashed #000'};
                  padding-bottom: 12px;
                  margin-bottom: 12px;
                }
                .header-title {
                  font-size: ${isKitchen ? '18px' : '20px'};
                  font-weight: bold;
                  color: #000000;
                  margin-bottom: 4px;
                  letter-spacing: 1px;
                }
                .header-subtitle {
                  font-size: 10px;
                  color: #000000;
                  margin-top: 2px;
                }
                .receipt-type {
                  text-align: center;
                  font-weight: bold;
                  font-size: 14px;
                  color: #000000;
                  background: ${isKitchen ? '#f0f0f0' : 'transparent'};
                  padding: 6px;
                  margin-bottom: 10px;
                  border: ${isKitchen ? '2px solid #000' : 'none'};
                }
                .info {
                  margin: 12px 0;
                  color: #000000;
                }
                .info-row {
                  margin: 6px 0;
                  font-size: 11px;
                  color: #000000;
                }
                .info-label {
                  font-weight: bold;
                  color: #000000;
                }
                .items {
                  border-top: ${isKitchen ? '2px solid #000' : '1px dashed #000'};
                  border-bottom: ${isKitchen ? '2px solid #000' : '1px dashed #000'};
                  padding: 12px 0;
                  margin: 12px 0;
                }
                .items-title {
                  text-align: center;
                  font-weight: bold;
                  font-size: ${isKitchen ? '13px' : '12px'};
                  color: #000000;
                  margin-bottom: 10px;
                  ${isKitchen ? 'background: #f0f0f0; padding: 6px;' : ''}
                }
                .item {
                  margin: ${isKitchen ? '8px 0' : '6px 0'};
                  padding: ${isKitchen ? '6px' : '4px 0'};
                  ${isKitchen ? 'border-left: 3px solid #000; padding-left: 8px;' : ''}
                }
                .item-name {
                  font-weight: bold;
                  font-size: ${isKitchen ? '13px' : '12px'};
                  color: #000000;
                  margin-bottom: 2px;
                }
                .item-details {
                  margin-left: ${isKitchen ? '0' : '10px'};
                  font-size: 11px;
                  color: #000000;
                  margin-top: 2px;
                }
                .item-addon {
                  margin-left: 12px;
                  color: #000000;
                }
                .item-subtotal {
                  margin-top: 4px;
                  font-size: 10px;
                  color: #000000;
                }
                .total {
                  text-align: right;
                  margin-top: 12px;
                  padding-top: 10px;
                  border-top: ${isKitchen ? '2px solid #000' : '1px dashed #000'};
                }
                .total-amount {
                  font-size: ${isKitchen ? '16px' : '18px'};
                  font-weight: bold;
                  color: #000000;
                  margin-top: 6px;
                }
                .footer {
                  text-align: center;
                  margin-top: 15px;
                  padding-top: 12px;
                  border-top: ${isKitchen ? '2px solid #000' : '2px dashed #000'};
                  color: #000000;
                }
                .footer-message {
                  font-size: ${isKitchen ? '11px' : '12px'};
                  color: #000000;
                  margin-bottom: 6px;
                }
                .footer-time {
                  font-size: 10px;
                  color: #000000;
                }
                @media print {
                  body {
                    width: 80mm;
                    margin: 0;
                    padding: 10px;
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
              {isKitchen ? '🍳 Struk Dapur' : '🧾 Struk Pelanggan'}
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
              {isKitchen ? '🍳 STRUK DAPUR 🍳' : '🧾 STRUK PELANGGAN 🧾'}
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
                    ? '⏳ Belum Bayar'
                    : order.status === 'paid'
                    ? '✅ Lunas'
                    : '❌ Dibatalkan'}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="items">
              <div className="items-title">
                {isKitchen ? '📋 DAFTAR PESANAN' : '--- ITEM PESANAN ---'}
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
                <div className="text-xs mb-1 text-black">
                  Subtotal: Rp {Number(order.subtotalAmount || order.totalAmount).toLocaleString('id-ID')}
                </div>
                <div className="total-amount">
                  TOTAL: Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                </div>
              </div>
            )}

            {/* Footer */}
            {isKitchen ? (
              <div className="footer">
                <div className="footer-message font-bold text-xs">
                  ⚠️ PERHATIAN: Siapkan pesanan sesuai item di atas
                </div>
                <div className="footer-time mt-2">
                  Dicetak: {new Date().toLocaleString('id-ID')}
                </div>
              </div>
            ) : (
              <div className="footer">
                <div className="footer-message font-bold">
                  Terima kasih atas kunjungan Anda!
                </div>
                <div className="footer-message text-xs mt-1">
                  Semoga Anda puas dengan pelayanan kami
                </div>
                <div className="footer-time mt-2">
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

