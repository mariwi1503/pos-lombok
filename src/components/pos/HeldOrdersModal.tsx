import React from 'react'
import { Clock, Play, Trash2, User, X } from 'lucide-react'
import { formatRupiah } from '../../services/storage'
import type { HeldTransaction } from '../../types/pos'

interface HeldOrdersModalProps {
  heldList: HeldTransaction[]
  onClose: () => void
  onResume: (held: HeldTransaction) => void
  onDelete: (id: string) => void
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({
  heldList,
  onClose,
  onResume,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 my-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-lg text-slate-900">
              Antrean Transaksi Tertunda
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {heldList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada transaksi yang sedang ditahan.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {heldList.map((held) => (
              <div
                key={held.id}
                className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{held.orderNumber}</span>
                  <span className="text-slate-400 text-[11px]">{held.timestamp}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{held.customer.name}</span>
                  <span className="text-slate-400">• {held.items.length} item</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="font-bold text-xs text-emerald-800">
                    {formatRupiah(held.total)}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onDelete(held.id)}
                      className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onResume(held)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Lanjutkan</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
