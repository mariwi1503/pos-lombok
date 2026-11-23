import React, { useState } from 'react'
import { KeyRound, ShieldAlert, X } from 'lucide-react'
import { playErrorBuzz } from '../../services/sound'
import { getStoredStaff } from '../../services/storage'

interface SupervisorAuthModalProps {
  title?: string
  description?: string
  onClose: () => void
  onSuccess: () => void
}

export const SupervisorAuthModal: React.FC<SupervisorAuthModalProps> = ({
  title = 'Otorisasi Supervisor Diperlukan',
  description = 'Sesuai aturan keamanan toko, pembatalan / void transaksi kasir harus disetujui oleh Supervisor atau Owner.',
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const staffList = getStoredStaff()
    // Find any supervisor or owner with matching PIN
    const authorized = staffList.find(
      (s) => (s.role === 'Owner' || s.role === 'Supervisor') && s.pin === pin
    )

    if (authorized) {
      onSuccess()
    } else {
      playErrorBuzz()
      setErrorMsg('PIN Supervisor / Owner salah! Gunakan PIN demo: 1234')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xs w-full shadow-2xl p-5 space-y-3.5 border border-slate-100 animate-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>

        <form onSubmit={handleVerify} className="space-y-3">
          {errorMsg && (
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Masukkan PIN Supervisor (Demo: 1234)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value)
                  setErrorMsg('')
                }}
                placeholder="PIN 1234"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20"
            >
              Setujui Void
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
