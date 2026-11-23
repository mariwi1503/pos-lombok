import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ModulePermission, Staff } from '../types/pos'
import { initialPermissions } from '../data/dummyData'
import { getAuthUser, getStoredStaff, setAuthUser } from '../services/storage'

interface AuthContextType {
  user: Staff | null
  login: (staff: Staff) => void
  logout: () => void
  switchStaff: (staffId: string) => void
  hasPermission: (feature: string) => boolean
  isOwner: boolean
  isSupervisor: boolean
  isCashier: boolean
  availableStaff: Staff[]
  refreshStaff: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Staff | null>(() => getAuthUser())
  const [availableStaff, setAvailableStaff] = useState<Staff[]>(() => getStoredStaff())

  const refreshStaff = () => {
    const list = getStoredStaff()
    setAvailableStaff(list)
    if (user) {
      const current = list.find((s) => s.id === user.id)
      if (current) setUser(current)
    }
  }

  useEffect(() => {
    const active = getAuthUser()
    setUser(active)
    setAvailableStaff(getStoredStaff())
  }, [])

  const login = (staff: Staff) => {
    setUser(staff)
    setAuthUser(staff)
  }

  const logout = () => {
    setUser(null)
    setAuthUser(null)
  }

  const switchStaff = (staffId: string) => {
    const target = availableStaff.find((s) => s.id === staffId)
    if (target) {
      login(target)
    }
  }

  const hasPermission = (feature: string): boolean => {
    if (!user) return false
    if (user.role === 'Owner') return true
    const rule = initialPermissions.find((p: ModulePermission) => p.feature === feature)
    if (!rule) return true
    if (user.role === 'Supervisor') return rule.supervisor
    if (user.role === 'Kasir') return rule.cashier
    return false
  }

  const isOwner = user?.role === 'Owner'
  const isSupervisor = user?.role === 'Supervisor'
  const isCashier = user?.role === 'Kasir'

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchStaff,
        hasPermission,
        isOwner,
        isSupervisor,
        isCashier,
        availableStaff,
        refreshStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
