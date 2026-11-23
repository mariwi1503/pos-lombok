import React, { useState } from 'react'
import {
  Check,
  Clock,
  IdCard,
  Shield,
  UserPlus,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initialPermissions } from '../../data/dummyData'
import { setStoredStaff } from '../../services/storage'
import type { Staff, StaffRole } from '../../types/pos'

export const StaffView: React.FC = () => {
  const { availableStaff, refreshStaff } = useAuth()
  const [filterRole, setFilterRole] = useState<string>('Semua')
  const [staffList, setStaffList] = useState<Staff[]>(availableStaff)
  const [showAddModal, setShowAddModal] = useState(false)

  // New staff form state
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<StaffRole>('Kasir')
  const [newShift, setNewShift] = useState('Shift Pagi')
  const [newPin, setNewPin] = useState('1234')

  const toggleStaffStatus = (id: string) => {
    const updated = staffList.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    setStaffList(updated)
    setStoredStaff(updated)
    refreshStaff()
  }

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    const initials = newName
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-800',
      'bg-orange-100 text-orange-700',
      'bg-teal-100 text-teal-800',
      'bg-purple-100 text-purple-700',
    ]

    const newStaffMember: Staff = {
      id: 'staff-' + Date.now(),
      name: newName,
      initials: initials || 'ST',
      role: newRole,
      shift: newShift,
      active: true,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      pin: newPin || '1234',
      todayTransactions: 0,
    }

    const updated = [newStaffMember, ...staffList]
    setStaffList(updated)
    setStoredStaff(updated)
    refreshStaff()

    setNewName('')
    setShowAddModal(false)
  }

  const roleCounts = {
    Owner: staffList.filter((s) => s.role === 'Owner').length,
    Supervisor: staffList.filter((s) => s.role === 'Supervisor').length,
    Kasir: staffList.filter((s) => s.role === 'Kasir').length,
  }

  const filteredStaff = staffList.filter((s) => {
    if (filterRole === 'Semua') return true
    return s.role === filterRole
  })

  return (
    <div className="pb-24 pt-2 px-4 max-w-2xl mx-auto space-y-4">
      {/* Top Banner: 6 Staff Aktif + Tambah Staff Button */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <IdCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-slate-900">
              {staffList.filter((s) => s.active).length} Staff Aktif
            </h2>
            <p className="text-xs text-slate-400">Kelola tim & hak akses role</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 active:scale-95 transition-all shadow-md shadow-emerald-800/15"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Staff</span>
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterRole('Semua')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            filterRole === 'Semua'
              ? 'bg-emerald-800 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterRole('Owner')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            filterRole === 'Owner'
              ? 'bg-emerald-800 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Owner ({roleCounts.Owner})
        </button>
        <button
          onClick={() => setFilterRole('Supervisor')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            filterRole === 'Supervisor'
              ? 'bg-emerald-800 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Supervisor ({roleCounts.Supervisor})
        </button>
        <button
          onClick={() => setFilterRole('Kasir')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            filterRole === 'Kasir'
              ? 'bg-emerald-800 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Kasir ({roleCounts.Kasir})
        </button>
      </div>

      {/* Staff List Cards */}
      <div className="space-y-3">
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${staff.avatarColor}`}
              >
                {staff.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{staff.name}</h3>
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
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  {staff.role === 'Owner' ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Akses Penuh</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{staff.shift} • {staff.active ? 'Aktif' : 'Nonaktif'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => toggleStaffStatus(staff.id)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${
                staff.active ? 'bg-emerald-800' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                  staff.active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Matriks Hak Akses Role (Matches Screen 2) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-800" />
            <h3 className="font-serif font-bold text-base text-slate-900">
              Matriks Hak Akses Role
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            4 Modul
          </span>
        </div>

        {/* Access Matrix Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-100 font-semibold">
                <th className="py-2.5 px-3 text-left">Fitur / Modul</th>
                <th className="py-2.5 px-2 text-center w-16">Owner</th>
                <th className="py-2.5 px-2 text-center w-16">Spv</th>
                <th className="py-2.5 px-2 text-center w-16">Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialPermissions.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-800">{perm.feature}</td>

                  {/* Owner */}
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </td>

                  {/* Supervisor */}
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </td>

                  {/* Kasir */}
                  <td className="py-3 px-2 text-center">
                    {perm.cashier ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-slate-900">Tambah Anggota Staff</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Misal: Dewi Lestari"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran / Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                >
                  <option value="Kasir">Kasir</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jadwal Shift</label>
                <select
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                >
                  <option value="Shift Pagi">Shift Pagi (07:00 - 15:00)</option>
                  <option value="Shift Siang">Shift Siang (14:00 - 22:00)</option>
                  <option value="Shift Malam">Shift Malam (21:00 - 05:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN Kasir (4 Angka)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 shadow-md shadow-emerald-800/20"
                >
                  Simpan Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
