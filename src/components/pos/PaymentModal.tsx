import React, { useState } from 'react'
import {
  Banknote,
  Check,
  CreditCard,
  QrCode,
  Smartphone,
  X,
} from 'lucide-react'
import { formatRupiah, saveTransaction } from '../../services/storage'
import type { Transaction } from '../../types/pos'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

interface PaymentModalProps {
  onClose: () => void
  onSuccess: (transaction: Transaction) => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth()
  const {
    items,
    customer,
    subtotal,
    totalDiscount,
    taxAmount,
    total,
    orderNumber,
    clearCart,
    generateNewOrderNumber,
  } = useCart()

  const [method, setMethod] = useState<'Tunai' | 'QRIS' | 'Transfer' | 'Debit'>('Tunai')
  const [cashAmount, setCashAmount] = useState<number>(total)
  const [customInput, setCustomInput] = useState<string>(total.toString())

  // Quick denomination suggestions
  const denominations = [
    { label: 'Uang Pas', value: total },
    { label: 'Rp 20.000', value: 20000 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 },
  ].filter((d) => d.value >= total || d.label === 'Uang Pas')

  const change = Math.max(0, cashAmount - total)
  const isEnough = method === 'Tunai' ? cashAmount >= total : true

  const handleConfirmPayment = () => {
    if (!isEnough) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const dateIso = now.toISOString().split('T')[0]

    const transaction: Transaction = {
      id: 'trx_' + Date.now(),
      orderNumber,
      timestamp: timeStr,
      date: dateStr,
      dateIso,
      cashierId: user?.id || 'staff-1',
      cashierName: user?.name || 'Budi S.',
      customer,
      items,
      subtotal,
      discountTotal: totalDiscount,
      tax: taxAmount,
      total,
      paymentMethod: method,
      amountPaid: method === 'Tunai' ? cashAmount : total,
      change: method === 'Tunai' ? change : 0,
      status: 'completed',
    }

    saveTransaction(transaction)
    clearCart()
    generateNewOrderNumber()
    onSuccess(transaction)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 my-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Pembayaran</h3>
            <p className="text-xs text-slate-400">Total Tagihan: {formatRupiah(total)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Display Banner */}
        <div className="bg-emerald-800 text-white rounded-2xl p-4 text-center">
          <p className="text-xs text-emerald-200">Total yang harus dibayar</p>
          <h2 className="text-2xl font-black font-serif tracking-tight mt-0.5">
            {formatRupiah(total)}
          </h2>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'Tunai', label: 'Tunai', icon: Banknote },
              { id: 'QRIS', label: 'QRIS', icon: QrCode },
              { id: 'Debit', label: 'Debit', icon: CreditCard },
              { id: 'Transfer', label: 'Transfer', icon: Smartphone },
            ].map((m) => {
              const Icon = m.icon
              const isSelected = method === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-700 text-emerald-800 ring-1 ring-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Method Specific UI */}
        {method === 'Tunai' ? (
          <div className="space-y-3 pt-1">
            {/* Quick Denominations */}
            <div className="flex flex-wrap gap-1.5">
              {denominations.map((d, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCashAmount(d.value)
                    setCustomInput(d.value.toString())
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    cashAmount === d.value
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Custom Amount Received Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Uang Diterima (Rp)
              </label>
              <input
                type="number"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value)
                  setCashAmount(parseInt(e.target.value) || 0)
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-base focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>

            {/* Change Calculation Box */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Kembalian:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  change > 0
                    ? 'text-emerald-700'
                    : cashAmount < total
                    ? 'text-red-500'
                    : 'text-slate-800'
                }`}
              >
                {cashAmount < total
                  ? `Kurang ${formatRupiah(total - cashAmount)}`
                  : formatRupiah(change)}
              </span>
            </div>
          </div>
        ) : method === 'QRIS' ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="w-32 h-32 bg-white p-2 rounded-xl border border-slate-200 mx-auto flex items-center justify-center">
              <QrCode className="w-24 h-24 text-slate-800" />
            </div>
            <p className="font-bold text-xs text-slate-800">Scan QRIS Toko Berkah Jaya</p>
            <p className="text-[10px] text-slate-400">
              Mendukung GoPay, OVO, Dana, ShopeePay, BCA, dll.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1 text-xs">
            <p className="font-bold text-slate-800">Mesin EDC / Transfer Bank</p>
            <p className="text-slate-500 text-[11px]">BCA: 8820-1928-11 a.n. Toko Berkah Jaya</p>
            <p className="text-emerald-700 font-semibold text-[11px] mt-1">
              Gesek kartu atau konfirmasi mutasi bank.
            </p>
          </div>
        )}

        {/* Confirm Payment Action */}
        <div className="pt-2">
          <button
            onClick={handleConfirmPayment}
            disabled={!isEnough}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
              isEnough
                ? 'bg-emerald-800 hover:bg-emerald-900 active:scale-98 shadow-emerald-800/20'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>Selesaikan & Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  )
}
