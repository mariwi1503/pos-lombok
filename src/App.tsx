import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { LanguageProvider } from './context/LanguageContext'
import { Header } from './components/layout/Header'
import { BottomNav, type TabType } from './components/layout/BottomNav'
import { LoginPage } from './components/auth/LoginPage'
import { DashboardView } from './components/dashboard/DashboardView'
import { StaffView } from './components/staff/StaffView'
import { ProductView } from './components/product/ProductView'
import { PosView } from './components/pos/PosView'
import { MitraView } from './components/mitra/MitraView'
import { TransactionHistoryView } from './components/history/TransactionHistoryView'

const MainApp: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [mitraSubTab, setMitraSubTab] = useState<'pelanggan' | 'supplier'>('pelanggan')

  if (!user) {
    return <LoginPage />
  }

  const handleNavigateTab = (tab: TabType, subTab?: string) => {
    setActiveTab(tab)
    if (subTab === 'pelanggan' || subTab === 'supplier') {
      setMitraSubTab(subTab)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Application Header */}
      <Header onOpenHistory={() => setActiveTab('riwayat')} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <DashboardView onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'produk' && (
          <ProductView onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'kasir' && <PosView />}

        {activeTab === 'mitra' && (
          <MitraView initialSubTab={mitraSubTab} />
        )}

        {activeTab === 'staff' && <StaffView />}

        {activeTab === 'riwayat' && (
          <TransactionHistoryView onBack={() => setActiveTab('dashboard')} />
        )}
      </main>

      {/* Sticky Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab === 'riwayat' ? 'dashboard' : activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
