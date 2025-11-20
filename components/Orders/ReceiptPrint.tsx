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
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${order.orderNumber}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  width: 80mm;
                  margin: 0;
                  padding: 10px;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px dashed #000;
                  padding-bottom: 10px;
                  margin-bottom: 10px;
                }
                .info {
                  margin: 10px 0;
                }
                .items {
                  border-top: 1px dashed #000;
                  border-bottom: 1px dashed #000;
                  padding: 10px 0;
                  margin: 10px 0;
                }
                .item {
                  margin: 5px 0;
                }
                .item-name {
                  font-weight: bold;
                }
                .item-details {
                  margin-left: 10px;
                  font-size: 0.9em;
                }
                .total {
                  text-align: right;
                  margin-top: 10px;
                  font-weight: bold;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  padding-top: 10px;
                  border-top: 2px dashed #000;
                }
                @media print {
                  body {
                    width: 80mm;
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
            <h2 className="text-2xl font-bold text-slate-800">
              {isKitchen ? 'Receipt Dapur' : 'Receipt Pelanggan'}
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
            className="bg-white border-2 border-dashed border-slate-300 p-6 font-mono text-sm"
            style={{ width: '80mm', margin: '0 auto' }}
          >
            <div className="header">
              <div className="text-xl font-bold">SiBubur</div>
              <div className="text-xs">Sistem Point of Sale</div>
            </div>

            <div className="info">
              <div>
                <strong>No. Order:</strong> {order.orderNumber}
              </div>
              <div>
                <strong>Tanggal:</strong>{' '}
                {new Date(order.createdAt).toLocaleString('id-ID')}
              </div>
              {order.customerName && (
                <div>
                  <strong>Pelanggan:</strong> {order.customerName}
                </div>
              )}
              <div>
                <strong>Toko:</strong> {order.store.name}
              </div>
              {isKitchen && (
                <div>
                  <strong>Status:</strong> {order.status === 'open' ? 'Belum Bayar' : order.status === 'paid' ? 'Lunas' : 'Dibatalkan'}
                </div>
              )}
            </div>

            <div className="items">
              <div className="text-center font-bold mb-2">--- ITEM PESANAN ---</div>
              {order.orderItems.map((item, idx) => (
                <div key={idx} className="item">
                  <div className="item-name">
                    {item.quantity}x {item.product.name}
                  </div>
                  <div className="item-details">
                    @ Rp {Number(item.unitPrice).toLocaleString('id-ID')}
                  </div>
                  {item.orderItemAddons && item.orderItemAddons.length > 0 && (
                    <div className="item-details">
                      {item.orderItemAddons.map((addon, aidx) => (
                        <div key={aidx}>
                          + {addon.quantity}x {addon.addon.name} @ Rp{' '}
                          {Number(addon.addonPrice).toLocaleString('id-ID')}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="item-details">
                    Subtotal: Rp {Number(item.lineTotal).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            <div className="total">
              <div className="text-lg mt-2">
                TOTAL: Rp {Number(order.totalAmount).toLocaleString('id-ID')}
              </div>
            </div>

            {!isKitchen && (
              <div className="footer">
                <div>Terima kasih atas kunjungan Anda!</div>
                <div className="text-xs mt-2">
                  {new Date().toLocaleString('id-ID')}
                </div>
              </div>
            )}

            {isKitchen && (
              <div className="footer">
                <div className="text-xs">--- RECEIPT DAPUR ---</div>
                <div className="text-xs mt-2">
                  Silakan siapkan pesanan sesuai item di atas
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

