import React, { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Coins, LogOut, Receipt, RefreshCw, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { resetAllDataToDefault } from '../../services/storage'
import { LanguageSwitcher } from '../common/LanguageSwitcher'
import { ShiftModal } from '../pos/ShiftModal'

interface HeaderProps {
  onOpenNotifications?: () => void
  onOpenHistory?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onOpenHistory }) => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showProfileMenu])

  const handleReset = () => {
    if (window.confirm(t('resetConfirmPrompt'))) {
      resetAllDataToDefault()
      window.location.reload()
    }
  }

  const roleBadgeStyle = {
    Owner: 'bg-purple-100 text-purple-700 border-purple-200',
    Supervisor: 'bg-orange-100 text-orange-700 border-orange-200',
    Kasir: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }[user?.role || 'Kasir']

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Store title & Role badge */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
              {t('appName')}
            </h1>
            {user && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleBadgeStyle}`}
              >
                {user.role}
              </span>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              onClick={() => {
                setShowNotificationModal(true)
                onOpenNotifications?.()
              }}
              className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile Avatar with Dropdown */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-1 p-1 pl-1.5 pr-1 rounded-full bg-emerald-800 text-white hover:bg-emerald-900 active:scale-95 transition-all shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                  {user?.initials || <User className="w-4 h-4" />}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200 pr-0.5" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('loggedInAs')}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.shift} • Role: {user?.role}</p>
                  </div>

                    {/* Language Switcher inside Dropdown (Direct toggle without label) */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                      <LanguageSwitcher fullWidth />
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          setShowShiftModal(true)
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 transition-colors font-medium"
                      >
                        <Coins className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t('manageShiftMenu')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          onOpenHistory?.()
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 transition-colors font-medium"
                      >
                        <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t('historyMenu')}</span>
                      </button>

                      <button
                        onClick={handleReset}
                        className="w-full px-4 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t('resetDefaultMenu')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          logout()
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>{t('logoutMenu')}</span>
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900">{t('notificationsTitle')}</h3>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium"
              >
                {t('close')}
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/60">
                <p className="font-semibold text-amber-900">{t('notifLowStockTitle')}</p>
                <p className="text-amber-700 mt-0.5">{t('notifLowStockDesc')}</p>
                <span className="text-[10px] text-amber-500 mt-1 block">Baru saja</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                <p className="font-semibold text-emerald-900">{t('notifTargetTitle')}</p>
                <p className="text-emerald-700 mt-0.5">{t('notifTargetDesc')}</p>
                <span className="text-[10px] text-emerald-500 mt-1 block">14:28 WIB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Shift Reconciliation Modal */}
      {showShiftModal && (
        <ShiftModal onClose={() => setShowShiftModal(false)} />
      )}
    </>
  )
}
