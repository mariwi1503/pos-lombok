import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Lock,
  Receipt,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { initialWeeklyTrend } from '../../data/dummyData'
import {
  formatRupiah,
  getStoredProducts,
  getStoredStaff,
  getStoredTransactions,
} from '../../services/storage'
import type { TabType } from '../layout/BottomNav'

interface DashboardViewProps {
  onNavigateTab: (tab: TabType, subTab?: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { hasPermission } = useAuth()
  const { t } = useLanguage()
  const [period, setPeriod] = useState<'hari' | 'minggu' | 'bulan'>('hari')
  const [selectedBar, setSelectedBar] = useState<string>('Min')

  const products = getStoredProducts()
  const transactions = getStoredTransactions()
  const staffList = getStoredStaff()

  // Calculate live numbers or fallbacks matching mockup
  const additionalSales = transactions.reduce((acc, t) => acc + t.total, 0)
  const additionalTrx = transactions.length

  const baseOmzet = period === 'hari' ? 12450000 : period === 'minggu' ? 66250000 : 284000000
  const totalOmzet = baseOmzet + additionalSales
  const totalTrxCount = (period === 'hari' ? 148 : period === 'minggu' ? 820 : 3410) + additionalTrx
  const totalLabaKotor = Math.round(totalOmzet * 0.3068)
  const avgOrder = Math.round(totalOmzet / totalTrxCount)

  // Low stock products
  const lowStockProducts = products
    .filter((p) => p.stock <= (p.minStock || 10))
    .slice(0, 3)

  // Active Cashiers
  const activeCashiers = staffList.filter((s) => s.role === 'Kasir' && s.active).slice(0, 2)

  const canViewProfit = hasPermission('Dashboard & Laba Kotor')

  return (
    <div className="pb-24 pt-2 px-4 max-w-2xl mx-auto space-y-4">
      {/* Period Filter Tabs: Hari Ini, Minggu Ini, Bulan Ini */}
      <div className="flex items-center gap-2">
        {(['hari', 'minggu', 'bulan'] as const).map((p) => {
          const label = p === 'hari' ? 'Hari Ini' : p === 'minggu' ? 'Minggu Ini' : 'Bulan Ini'
          const isActive = period === p
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* 2x2 Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Omzet */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">
                {t('dashboardOmzet')}
              </span>
              <Banknote className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {formatRupiah(totalOmzet)}
            </h3>
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              <ArrowUpRight className="w-3 h-3 text-emerald-700" />
              +14.2%
            </span>
          </div>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden">
          {!canViewProfit ? (
            <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10">
              <Lock className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-[11px] font-bold text-slate-600">Laba Terkunci</p>
              <p className="text-[10px] text-slate-400">Khusus Owner & Supervisor</p>
            </div>
          ) : null}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">{t('dashboardGrossProfit')}</span>
              <Wallet className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {formatRupiah(totalLabaKotor)}
            </h3>
          </div>
          <div className="mt-2.5">
            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
              Margin 30.6%
            </span>
          </div>
        </div>

        {/* Total Transaksi */}
        <div
          onClick={() => onNavigateTab('riwayat')}
          className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">{t('dashboardTotalTransactions')}</span>
              <Receipt className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {totalTrxCount} Struk
            </h3>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-400">Semua metode bayar</span>
            <span className="text-[10px] font-bold text-indigo-600 group-hover:underline flex items-center gap-0.5">
              Riwayat ➔
            </span>
          </div>
        </div>

        {/* Rata-rata Order */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">{t('dashboardAvgOrder')}</span>
              <ShoppingBag className="w-4 h-4 text-amber-700" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {formatRupiah(avgOrder)}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Per transaksi</p>
        </div>
      </div>

      {/* 7-Day Sales Trend Bar Chart */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">{t('salesTrend7Days')}</h3>
            <p className="text-xs text-slate-400">Ketuk batang untuk detail harian</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
            Min: Rp 12,4jt
          </span>
        </div>

        {/* Bar Chart Visualization */}
        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
          {initialWeeklyTrend.map((item) => {
            const isSelected = selectedBar === item.day
            // Calculate height percentage based on max 13jt
            const maxVal = 13000000
            const heightPercent = Math.min(100, Math.round((item.amount / maxVal) * 100))

            return (
              <div
                key={item.day}
                onClick={() => setSelectedBar(item.day)}
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
              >
                {/* Tooltip on active */}
                <div
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white opacity-100 -translate-y-1'
                      : 'opacity-0 group-hover:opacity-100 text-slate-600'
                  }`}
                >
                  {item.formatted}
                </div>

                {/* The Bar */}
                <div className="w-full flex justify-center h-28 items-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-xl transition-all duration-300 ${
                      item.day === 'Min'
                        ? 'bg-emerald-800 group-hover:bg-emerald-900'
                        : isSelected
                        ? 'bg-teal-600'
                        : 'bg-emerald-200/90 hover:bg-emerald-300'
                    }`}
                  />
                </div>

                <span
                  className={`text-xs font-semibold ${
                    item.day === 'Min' || isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Card Laporan Riwayat Transaksi Lengkap (Dipindahkan ke bawah Chart Penjualan) */}
      <button
        onClick={() => onNavigateTab('riwayat')}
        className="w-full flex items-center justify-between p-4 rounded-3xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-900 font-bold text-xs transition-all active:scale-98 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-slate-900">Laporan Riwayat Transaksi Lengkap</span>
            <span className="text-[11px] text-slate-400 font-medium">Filter tanggal kustom & cetak ulang nota</span>
          </div>
        </div>
        <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm">
          Buka ➔
        </span>
      </button>

      {/* Peringatan Stok Menipis */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-serif font-bold text-base text-slate-900">Peringatan Stok Menipis</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">{lowStockProducts.length} Produk</span>
        </div>

        <div className="space-y-2.5">
          {lowStockProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => onNavigateTab('produk')}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100/70 flex items-center justify-center text-orange-600 shrink-0">
                  <span className="text-lg">📦</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                  <p className="text-[11px] text-slate-400">Min. stok: {p.minStock || 10} {p.unit}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                Sisa {p.stock}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Kasir Bertugas */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-serif font-bold text-base text-slate-900">Kasir Bertugas</h3>
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            {activeCashiers.length} Aktif
          </span>
        </div>

        <div className="space-y-2.5">
          {activeCashiers.map((cashier) => (
            <div
              key={cashier.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${cashier.avatarColor}`}
                >
                  {cashier.initials}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{cashier.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {cashier.shift} • {cashier.todayTransactions || 0} trx
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Shortcuts: Master Pelanggan & Master Supplier */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => onNavigateTab('mitra', 'pelanggan')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-full bg-white border border-slate-200/90 text-slate-700 font-bold text-xs shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Users className="w-4 h-4 text-emerald-700" />
          <span>Master Pelanggan...</span>
        </button>

        <button
          onClick={() => onNavigateTab('mitra', 'supplier')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-full bg-white border border-slate-200/90 text-slate-700 font-bold text-xs shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Truck className="w-4 h-4 text-emerald-700" />
          <span>Master Supplier (...)</span>
        </button>
      </div>
    </div>
  )
}
