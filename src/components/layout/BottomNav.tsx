import React from 'react'
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Users2,
  ShieldCheck,
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'

export type TabType = 'dashboard' | 'produk' | 'kasir' | 'mitra' | 'staff' | 'riwayat'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { itemCount } = useCart()
  const { t } = useLanguage()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-2xl mx-auto px-3 py-2 flex items-center justify-between relative">
        {/* Tab Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">{t('tabDashboard')}</span>
        </button>

        {/* Tab Produk */}
        <button
          onClick={() => onTabChange('produk')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'produk'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">{t('tabProducts')}</span>
        </button>

        {/* Floating Kasir / Cart Button in Center */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => onTabChange('kasir')}
            className={`w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-800/30 hover:bg-emerald-900 active:scale-90 transition-all border-4 border-white relative ${
              activeTab === 'kasir' ? 'ring-2 ring-emerald-700' : ''
            }`}
            title="Mesin Kasir POS"
          >
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Mitra */}
        <button
          onClick={() => onTabChange('mitra')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'mitra'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users2 className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">{t('tabMitra')}</span>
        </button>

        {/* Tab Staff */}
        <button
          onClick={() => onTabChange('staff')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'staff'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">{t('tabStaff')}</span>
        </button>
      </div>
    </div>
  )
}
