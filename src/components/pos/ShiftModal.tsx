import React, { useState } from 'react'
import { CheckCircle2, Clock, Printer, X } from 'lucide-react'
import { closeShift, formatRupiah, getCurrentShift, startNewShift } from '../../services/storage'
import { useAuth } from '../../context/AuthContext'
import type { ShiftRecord } from '../../types/pos'

interface ShiftModalProps {
  onClose: () => void
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ onClose }) => {
  const { user } = useAuth()
  const [currentShift, setLocalShift] = useState<ShiftRecord | null>(getCurrentShift())
  const [cashInput, setCashInput] = useState<string>('')
  const [shiftNotes, setShiftNotes] = useState<string>('')
  const [closedSummary, setClosedSummary] = useState<ShiftRecord | null>(null)

  const initialCash = currentShift?.initialCash || 150000
  const cashSales = currentShift?.systemCashSales || 0
  const nonCashSales = currentShift?.systemNonCashSales || 0
  const expectedCashInDrawer = initialCash + cashSales

  const actualCash = parseInt(cashInput) || 0
  const difference = cashInput ? actualCash - expectedCashInDrawer : 0

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cashInput) return

    const summary = closeShift(actualCash, shiftNotes)
    setClosedSummary(summary)
    setLocalShift(null)
  }

  const handleStartNewShift = () => {
    if (!user) return
    const newShift = startNewShift(user, 150000, 'Shift ' + (user.shift.includes('Siang') ? 'Siang' : 'Pagi'))
    setLocalShift(newShift)
    setClosedSummary(null)
    setCashInput('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 my-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-800" />
            <h3 className="font-serif font-bold text-base text-slate-900">
              {closedSummary ? 'Rekap Tutup Kasir Selesai' : 'Laporan Shift & Kasir'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {closedSummary ? (
          /* Closed Shift Receipt Summary */
          <div className="space-y-3 animate-in fade-in">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Shift Berhasil Ditutup & Uang Kas Direkonsiliasi!</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 font-mono text-xs space-y-1.5 text-slate-700">
              <div className="text-center font-bold font-serif pb-1.5 border-b border-dashed border-slate-300 text-slate-900">
                REKAP TUTUP KASIR
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span>Kasir:</span>
                <span className="font-bold">{closedSummary.cashierName}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Shift:</span>
                <span>{closedSummary.shiftName}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Waktu:</span>
                <span>{closedSummary.startTime} - {closedSummary.endTime}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200">
                <span>Modal Kas Awal:</span>
                <span>{formatRupiah(closedSummary.initialCash)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Penjualan Tunai:</span>
                <span>{formatRupiah(closedSummary.systemCashSales)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Penjualan Non-Tunai:</span>
                <span>{formatRupiah(closedSummary.systemNonCashSales)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-900 pt-1 border-t border-slate-300">
                <span>Total Penjualan Shift:</span>
                <span>{formatRupiah(closedSummary.systemCashSales + closedSummary.systemNonCashSales)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-900 pt-1 border-t border-dashed border-slate-300">
                <span>Uang Fisik di Laci:</span>
                <span>{formatRupiah(closedSummary.actualCashInDrawer || 0)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>Status Selisih:</span>
                <span className={(closedSummary.difference || 0) < 0 ? 'text-red-600' : (closedSummary.difference || 0) > 0 ? 'text-indigo-600' : 'text-emerald-700'}>
                  {(closedSummary.difference || 0) === 0
                    ? 'UANG PAS (Cocok)'
                    : (closedSummary.difference || 0) > 0
                    ? `LEBIH +${formatRupiah(closedSummary.difference || 0)}`
                    : `KURANG ${formatRupiah(closedSummary.difference || 0)}`}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekap</span>
              </button>
              <button
                onClick={handleStartNewShift}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 shadow-md shadow-emerald-800/20"
              >
                Mulai Shift Baru
              </button>
            </div>
          </div>
        ) : (
          /* Active Shift Dashboard & Close Form */
          <form onSubmit={handleCloseShift} className="space-y-3.5 text-xs">
            {/* Shift Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/90 space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span>Kasir Aktif:</span>
                <span className="font-bold text-slate-800">{currentShift?.cashierName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Mulai Shift:</span>
                <span className="font-semibold text-slate-800">{currentShift?.startTime}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200">
                <span>Modal Awal Kembalian:</span>
                <span className="font-mono font-semibold text-slate-700">{formatRupiah(initialCash)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Penjualan Tunai Sistem:</span>
                <span className="font-mono font-bold text-emerald-800">+{formatRupiah(cashSales)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Penjualan Non-Tunai (QRIS/Card):</span>
                <span className="font-mono text-slate-700">+{formatRupiah(nonCashSales)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-300 font-bold text-slate-900">
                <span>Uang Tunai Laci Seharusnya:</span>
                <span className="text-sm font-black text-emerald-900 font-mono">
                  {formatRupiah(expectedCashInDrawer)}
                </span>
              </div>
            </div>

            {/* Input Fisik Uang di Laci */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Hitung Fisik Uang Tunai di Laci Kasir (Rp):
              </label>
              <input
                type="number"
                required
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder="Contoh: 301500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-base focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>

            {/* Live Difference Indicator */}
            {cashInput && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between font-bold ${
                  difference === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : difference > 0
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                <span>Status Rekonsiliasi:</span>
                <span>
                  {difference === 0
                    ? '✓ UANG PAS (Sesuai)'
                    : difference > 0
                    ? `LEBIH +${formatRupiah(difference)}`
                    : `SELISIH KURANG ${formatRupiah(difference)}`}
                </span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Catatan Shift Kasir (Opsional):
              </label>
              <textarea
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                rows={2}
                placeholder="Contoh: Ada uang koin pecahan 500 habis..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 shadow-md shadow-emerald-800/20"
              >
                Tutup Kasir
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
