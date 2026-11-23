import React, { useState } from 'react'
import { CheckCircle2, Copy, Printer, RotateCcw } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { formatRupiah } from '../../services/storage'
import type { Transaction } from '../../types/pos'

interface ReceiptModalProps {
  transaction: Transaction
  onClose?: () => void
  onNewTransaction: () => void
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onNewTransaction,
}) => {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = () => {
    const text = `
=== TOKO BERKAH JAYA ===
No. Nota: ${transaction.orderNumber}
Waktu: ${transaction.timestamp}
Kasir: ${transaction.cashierName}
Pelanggan: ${transaction.customer.name}
------------------------------
${transaction.items
  .map(
    (i) =>
      `${i.product.name} x${i.quantity} = ${formatRupiah(i.product.price * i.quantity)}`
  )
  .join('\n')}
------------------------------
Subtotal: ${formatRupiah(transaction.subtotal)}
Diskon: -${formatRupiah(transaction.discountTotal)}
PPN: ${formatRupiah(transaction.tax)}
TOTAL: ${formatRupiah(transaction.total)}
Bayar (${transaction.paymentMethod}): ${formatRupiah(transaction.amountPaid)}
Kembali: ${formatRupiah(transaction.change)}
==============================
Terima kasih telah berbelanja!
    `
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 my-4">
        {/* Header Success */}
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900">{t('paySuccessTitle')}</h3>
          <p className="text-xs text-slate-400">Transaksi telah dicatat dan stok diperbarui.</p>
        </div>

        {/* Thermal Receipt Simulation Card */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 font-mono text-xs text-slate-700 shadow-inner space-y-2">
          {/* Store Logo & Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-sm tracking-wider font-serif text-slate-900 uppercase">
              {t('appName')}
            </h4>
            <p className="text-[10px] text-slate-500">Jl. Berkah Makmur No. 88, Jakarta</p>
            <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
          </div>

          {/* Meta Info */}
          <div className="text-[10px] space-y-0.5 text-slate-500 py-1 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>Nota: {transaction.orderNumber}</span>
              <span>{transaction.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('receiptCashier')}: {transaction.cashierName}</span>
              <span>Cust: {transaction.customer.name.slice(0, 15)}</span>
            </div>
          </div>

          {/* Item List */}
          <div className="py-1 space-y-1 text-[11px] border-b border-dashed border-slate-300">
            {transaction.items.map((item, idx) => (
              <div key={idx}>
                <div className="font-semibold text-slate-800 line-clamp-1">
                  {item.product.name}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>
                    {item.quantity} x {formatRupiah(item.product.price)}
                    {item.itemDiscount > 0 ? ` (disc ${item.itemDiscount}%)` : ''}
                  </span>
                  <span className="font-medium text-slate-700">
                    {formatRupiah(
                      (item.product.price - (item.product.price * item.itemDiscount) / 100) *
                        item.quantity
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon Transaksi</span>
                <span>-{formatRupiah(transaction.discountTotal)}</span>
              </div>
            )}
            {transaction.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>PPN</span>
                <span>{formatRupiah(transaction.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-300">
              <span>TOTAL</span>
              <span>{formatRupiah(transaction.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Bayar ({transaction.paymentMethod})</span>
              <span>{formatRupiah(transaction.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900">
              <span>{t('payChange')}</span>
              <span>{formatRupiah(transaction.change)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300">
            <p>*** {t('receiptThankYou').toUpperCase()} ***</p>
            <p>{t('receiptFooterSub')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{t('payPrintReceipt')}</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <Copy className="w-4 h-4 text-slate-600" />
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          </div>

          <button
            onClick={onNewTransaction}
            className="w-full py-3 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-900 active:scale-98 transition-all shadow-md shadow-emerald-800/20 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('payNewOrder')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
