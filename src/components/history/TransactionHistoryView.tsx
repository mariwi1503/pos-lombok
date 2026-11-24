import React, { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  Printer,
  Receipt,
  Search,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import { formatRupiah, getStoredTransactions } from '../../services/storage'
import type { Transaction } from '../../types/pos'
import { ReceiptModal } from '../pos/ReceiptModal'

interface TransactionHistoryViewProps {
  onBack: () => void
}

type PeriodPreset = 'all' | 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ onBack }) => {
  const allTransactions = getStoredTransactions()

  // State filters
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [cashierFilter, setCashierFilter] = useState<string>('all')

  // Custom date range state (defaults to today)
  const todayIso = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(todayIso)
  const [endDate, setEndDate] = useState(todayIso)

  // Selected transaction for detail / reprint modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [reprintTx, setReprintTx] = useState<Transaction | null>(null)

  // Filter transactions based on date range and presets
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1

    // Day of week (0 = Sunday, 1 = Monday...)
    const dayOfWeek = now.getDay()
    const daysSinceMonday = (dayOfWeek + 6) % 7
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday).getTime()

    const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000
    const lastWeekEnd = thisWeekStart - 1

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
    const lastMonthEnd = thisMonthStart - 1

    return allTransactions.filter((tx) => {
      // 1. Date filter
      let matchesDate = true
      const txTime = tx.dateIso
        ? new Date(tx.dateIso).getTime()
        : todayStart // fallback

      if (periodPreset === 'today') {
        matchesDate = txTime >= todayStart && txTime <= todayEnd
      } else if (periodPreset === 'this_week') {
        matchesDate = txTime >= thisWeekStart
      } else if (periodPreset === 'last_week') {
        matchesDate = txTime >= lastWeekStart && txTime <= lastWeekEnd
      } else if (periodPreset === 'this_month') {
        matchesDate = txTime >= thisMonthStart
      } else if (periodPreset === 'last_month') {
        matchesDate = txTime >= lastMonthStart && txTime <= lastMonthEnd
      } else if (periodPreset === 'custom') {
        const startTimestamp = new Date(startDate).getTime()
        const endTimestamp = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1
        matchesDate = txTime >= startTimestamp && txTime <= endTimestamp
      }

      // 2. Search query filter (Order number, customer name, cashier name)
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        tx.orderNumber.toLowerCase().includes(q) ||
        tx.customer.name.toLowerCase().includes(q) ||
        tx.cashierName.toLowerCase().includes(q) ||
        tx.items.some((i) => i.product.name.toLowerCase().includes(q))

      // 3. Payment method filter
      const matchesMethod = methodFilter === 'all' || tx.paymentMethod === methodFilter

      // 4. Cashier filter
      const matchesCashier = cashierFilter === 'all' || tx.cashierName.includes(cashierFilter)

      return matchesDate && matchesSearch && matchesMethod && matchesCashier
    })
  }, [allTransactions, periodPreset, searchQuery, methodFilter, cashierFilter, startDate, endDate])

  // Summary calculations for filtered period
  const totalOmzet = filteredTransactions.reduce((acc, t) => acc + t.total, 0)
  const totalTrxCount = filteredTransactions.length
  const avgOrder = totalTrxCount > 0 ? Math.round(totalOmzet / totalTrxCount) : 0

  const methodBreakdown = {
    Tunai: filteredTransactions.filter((t) => t.paymentMethod === 'Tunai').length,
    QRIS: filteredTransactions.filter((t) => t.paymentMethod === 'QRIS').length,
    Debit: filteredTransactions.filter((t) => t.paymentMethod === 'Debit').length,
    Transfer: filteredTransactions.filter((t) => t.paymentMethod === 'Transfer').length,
  }

  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) return

    const headers = [
      'No. Nota',
      'Tanggal',
      'Waktu',
      'Kasir',
      'Pelanggan',
      'Metode Bayar',
      'Jumlah Item',
      'Subtotal',
      'Diskon',
      'PPN',
      'Total',
      'Status',
    ]

    const rows = filteredTransactions.map((tx) => [
      `"${tx.orderNumber}"`,
      `"${tx.date}"`,
      `"${tx.timestamp}"`,
      `"${tx.cashierName}"`,
      `"${tx.customer.name}"`,
      `"${tx.paymentMethod}"`,
      tx.items.reduce((acc, i) => acc + i.quantity, 0),
      tx.subtotal,
      tx.discountTotal,
      tx.tax,
      tx.total,
      `"${tx.status}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="pb-24 pt-2 px-4 max-w-2xl mx-auto space-y-4">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Unduh CSV</span>
          </button>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
            {totalTrxCount} Nota
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div>
          <h2 className="font-bold text-lg text-slate-900">
            Riwayat Transaksi Penjualan
          </h2>
          <p className="text-xs text-slate-400">
            Laporan lengkap seluruh nota kasir dengan filter tanggal kustom.
          </p>
        </div>

        {/* Period Filter Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'this_week', label: 'Minggu Ini' },
            { id: 'last_week', label: 'Minggu Lalu' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'all', label: 'Semua' },
            { id: 'custom', label: '📅 Pilih Tanggal' },
          ].map((p) => {
            const isSelected = periodPreset === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPeriodPreset(p.id as PeriodPreset)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Custom Date Range Picker (shown when 'custom' is active) */}
        {periodPreset === 'custom' && (
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/90 space-y-2.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Tentukan Rentang Tanggal Transaksi:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Dari Tanggal:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Sampai Tanggal:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Bar & Dropdown Filters */}
        <div className="space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Nota (#TRX...), pelanggan, kasir, atau produk..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Secondary Dropdowns: Metode Bayar & Kasir */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="all">Semua Metode Pembayaran</option>
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Debit">Debit Card</option>
                <option value="Transfer">Transfer Bank</option>
              </select>
            </div>

            <div>
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="all">Semua Kasir Petugas</option>
                <option value="Budi">Budi Santoso</option>
                <option value="Siti">Siti Aminah</option>
                <option value="Andi">Andi Wijaya</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filtered Period Summary KPI Box */}
        <div className="bg-emerald-900 text-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-200">
            <span>Ringkasan Periode Ini</span>
            <span className="font-mono">{filteredTransactions.length} Struk Terbit</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-800">
            <div>
              <span className="text-[11px] text-emerald-300 block">Total Omzet Bersih</span>
              <h3 className="text-xl font-black font-mono tracking-tight text-white mt-0.5">
                {formatRupiah(totalOmzet)}
              </h3>
            </div>
            <div>
              <span className="text-[11px] text-emerald-300 block">Rata-rata Order</span>
              <h3 className="text-xl font-black font-mono tracking-tight text-white mt-0.5">
                {formatRupiah(avgOrder)}
              </h3>
            </div>
          </div>

          {/* Method breakdown badges */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100">
              💵 Tunai: {methodBreakdown.Tunai}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100">
              📱 QRIS: {methodBreakdown.QRIS}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100">
              💳 Debit: {methodBreakdown.Debit}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100">
              📲 Transfer: {methodBreakdown.Transfer}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">Tidak ada transaksi ditemukan</p>
            <p className="text-xs text-slate-400">
              Coba sesuaikan preset periode, tanggal, atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const itemCount = tx.items.reduce((acc, i) => acc + i.quantity, 0)
            const methodStyle = {
              Tunai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              QRIS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
              Debit: 'bg-purple-100 text-purple-800 border-purple-200',
              Transfer: 'bg-blue-100 text-blue-800 border-blue-200',
            }[tx.paymentMethod]

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
              >
                {/* Header row: Order number & Date */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {tx.orderNumber}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tx.date} • {tx.timestamp}</span>
                  </div>
                </div>

                {/* Body info: Customer & Cashier */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{tx.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kasir: {tx.cashierName}</span>
                  </div>
                </div>

                {/* Footer: Items count, Method, and Total */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${methodStyle}`}>
                      {tx.paymentMethod}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {itemCount} pcs ({tx.items.length} item)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm text-emerald-900">
                      {formatRupiah(tx.total)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 transition-colors" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 my-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Rincian Transaksi
                </h3>
                <p className="font-mono text-xs text-slate-400">{selectedTx.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info meta */}
            <div className="bg-slate-50 rounded-2xl p-3.5 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu:</span>
                <span className="font-semibold text-slate-700">{selectedTx.date} • {selectedTx.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kasir:</span>
                <span className="font-semibold text-slate-700">{selectedTx.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pelanggan:</span>
                <span className="font-semibold text-slate-700">{selectedTx.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Pembayaran:</span>
                <span className="font-bold text-emerald-800">{selectedTx.paymentMethod}</span>
              </div>
            </div>

            {/* Itemized List */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Daftar Barang ({selectedTx.items.length})
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedTx.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.product.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.quantity} x {formatRupiah(item.product.price)}
                        {item.itemDiscount > 0 ? ` (Disc ${item.itemDiscount}%)` : ''}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      {formatRupiah(
                        (item.product.price - (item.product.price * item.itemDiscount) / 100) *
                          item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatRupiah(selectedTx.subtotal)}</span>
              </div>
              {selectedTx.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon Transaksi</span>
                  <span>-{formatRupiah(selectedTx.discountTotal)}</span>
                </div>
              )}
              {selectedTx.tax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>PPN</span>
                  <span>{formatRupiah(selectedTx.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Tagihan</span>
                <span className="text-emerald-900 font-mono">{formatRupiah(selectedTx.total)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1">
                <span>Jumlah Bayar ({selectedTx.paymentMethod})</span>
                <span className="font-mono">{formatRupiah(selectedTx.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Kembalian</span>
                <span className="font-mono">{formatRupiah(selectedTx.change)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setReprintTx(selectedTx)
                  setSelectedTx(null)
                }}
                className="flex-1 py-3 bg-emerald-800 text-white font-bold text-xs rounded-2xl hover:bg-emerald-900 active:scale-95 transition-all shadow-md shadow-emerald-800/20 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang Struk</span>
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-3 border border-slate-300 text-slate-600 font-bold text-xs rounded-2xl hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      {reprintTx && (
        <ReceiptModal
          transaction={reprintTx}
          onClose={() => setReprintTx(null)}
          onNewTransaction={() => setReprintTx(null)}
        />
      )}
    </div>
  )
}
