import React, { useState } from 'react'
import {
  ArrowRight,
  Delete,
  Shield,
  Sparkles,
  Store,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { playErrorBuzz, playScannerBeep } from '../../services/sound'
import type { Staff } from '../../types/pos'
import { LanguageSwitcher } from '../common/LanguageSwitcher'

export const LoginPage: React.FC = () => {
  const { availableStaff, login } = useAuth()
  const { t } = useLanguage()
  const [selectedStaff, setSelectedStaff] = useState<Staff>(availableStaff[0])
  const [pin, setPin] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [loginMode, setLoginMode] = useState<'pin' | 'quick'>('pin')

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      const newPin = pin + val
      setPin(newPin)
      setErrorMsg('')
    }
  }

  const handleKeypadClear = () => {
    setPin('')
    setErrorMsg('')
  }

  const handleKeypadBackspace = () => {
    setPin(pin.slice(0, -1))
    setErrorMsg('')
  }

  const handlePinLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedStaff) {
      setErrorMsg(t('selectStaffFirstMsg'))
      return
    }

    if (selectedStaff.pin && selectedStaff.pin !== pin) {
      playErrorBuzz()
      setErrorMsg(t('pinWrongMsg'))
      return
    }

    playScannerBeep()
    login(selectedStaff)
  }

  const handleQuickDemoLogin = (staff: Staff) => {
    playScannerBeep()
    login(staff)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-emerald-800 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <LanguageSwitcher />
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-700/50 rounded-full blur-xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-2.5 backdrop-blur-sm border border-white/20 shadow-inner">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-tight">{t('appName')}</h1>
          <p className="text-emerald-100/90 text-xs mt-0.5">{t('appSubtitle')}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-[11px] font-medium text-emerald-100 mt-2.5 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('demoMode')}</span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-4 pb-0">
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setLoginMode('pin')}
              className={`flex-1 py-2 rounded-xl transition-all ${loginMode === 'pin'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {t('loginPinTab')}
            </button>
            <button
              onClick={() => setLoginMode('quick')}
              className={`flex-1 py-2 rounded-xl transition-all ${loginMode === 'quick'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {t('loginQuickTab')}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {loginMode === 'pin' ? (
            /* PIN Mode with Touchscreen Keypad */
            <div className="space-y-3.5">
              {/* Staff Selector Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('selectStaffLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableStaff.slice(0, 4).map((staff) => {
                    const isSelected = selectedStaff.id === staff.id
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staff)
                          setErrorMsg('')
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${isSelected
                            ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600'
                            : 'bg-white border-slate-200/90 hover:bg-slate-50'
                          }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${staff.avatarColor}`}
                        >
                          {staff.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{staff.name}</p>
                          <p className="text-[10px] text-slate-400">{staff.role}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PIN Display & Feedback */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-center space-y-1.5">
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('enterPinFor')} <span className="font-bold text-slate-800">{selectedStaff.name}</span> {t('demoPinHint')}
                </p>

                {/* PIN Dots Display */}
                <div className="flex items-center justify-center gap-3 h-8">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${pin.length > idx
                          ? 'bg-emerald-800 scale-110 shadow-sm'
                          : 'bg-slate-200 border border-slate-300'
                        }`}
                    />
                  ))}
                </div>

                {errorMsg && (
                  <p className="text-[11px] font-bold text-red-600 animate-in fade-in">{errorMsg}</p>
                )}
              </div>

              {/* Touchscreen Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-11 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 active:bg-slate-100 font-bold text-base text-slate-800 shadow-sm active:scale-95 transition-all"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-600 transition-all"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 active:bg-slate-100 font-bold text-base text-slate-800 shadow-sm active:scale-95 transition-all"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition-all"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handlePinLogin()}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 transition-all"
              >
                <span>{t('enterCashierBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* 1-Click Quick Demo Login */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {t('quickLoginTitle')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {availableStaff.slice(0, 4).map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleQuickDemoLogin(staff)}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-600 hover:bg-emerald-50/50 active:scale-95 transition-all group bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${staff.avatarColor}`}
                      >
                        {staff.initials}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${staff.role === 'Owner'
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
                    <span className="text-[10px] text-slate-400 mt-0.5">{staff.shift}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Role Access Matrix preview info */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('roleInfoTitle')}</span>
            </div>
            <p>• <strong>Owner:</strong> {t('roleInfoOwner')}</p>
            <p>• <strong>Supervisor:</strong> {t('roleInfoSupervisor')}</p>
            <p>• <strong>Kasir:</strong> {t('roleInfoCashier')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
