import React, { useState } from 'react'
import {
  ArrowRight,
  KeyRound,
  Shield,
  Sparkles,
  Store,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { Staff } from '../../types/pos'

export const LoginPage: React.FC = () => {
  const { availableStaff, login } = useAuth()
  const [selectedStaffId, setSelectedStaffId] = useState<string>(availableStaff[0]?.id || '')
  const [pin, setPin] = useState<string>('1234')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const target = availableStaff.find((s) => s.id === selectedStaffId)
    if (!target) {
      setErrorMsg('Pilih akun staff terlebih dahulu.')
      return
    }
    if (target.pin && target.pin !== pin) {
      setErrorMsg('PIN salah! Gunakan PIN demo default: 1234')
      return
    }
    login(target)
  }

  const handleQuickDemoLogin = (staff: Staff) => {
    login(staff)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-emerald-800 text-white p-7 text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-700/50 rounded-full blur-xl pointer-events-none" />
          <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-3 backdrop-blur-sm border border-white/20 shadow-inner">
            <Store className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-tight">Toko Berkah Jaya</h1>
          <p className="text-emerald-100/90 text-xs mt-1">Sistem Kasir & Manajemen Toko Pintar</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-[11px] font-medium text-emerald-100 mt-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Mode Simulasi Demo (Client-Side & LocalStorage)
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Quick 1-Click Demo Profiles */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                Pilih Akun Demo (1-Klik Masuk)
              </label>
              <span className="text-[11px] text-slate-400">Pilih role untuk tes</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {availableStaff.slice(0, 4).map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => handleQuickDemoLogin(staff)}
                  className="flex flex-col text-left p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-600 hover:bg-emerald-50/50 active:scale-95 transition-all group bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${staff.avatarColor}`}
                    >
                      {staff.initials}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        staff.role === 'Owner'
                          ? 'bg-purple-100 text-purple-700'
                          : staff.role === 'Supervisor'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {staff.role}
                    </span>
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-800 line-clamp-1">
                    {staff.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{staff.shift}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
              atau login dengan PIN
            </span>
          </div>

          {/* Form Login with PIN */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Staff Kasir / Petugas
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                {availableStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} — {staff.role} ({staff.shift})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  PIN Keamanan (Demo: 1234)
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN (1234)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 transition-all"
            >
              <span>Masuk ke Sistem Kasir</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Role Access Matrix preview info */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Informasi Hak Akses Role:</span>
            </div>
            <p>• <strong>Owner:</strong> Akses penuh semua modul, laporan laba kotor & omzet.</p>
            <p>• <strong>Supervisor:</strong> Mengelola produk, stok, dan staff toko.</p>
            <p>• <strong>Kasir:</strong> Berfokus pada transaksi penjualan POS & cetak struk.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
