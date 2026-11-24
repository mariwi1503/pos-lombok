import React, { useRef, useState } from 'react'
import {
  ArrowRight,
  Barcode,
  CheckCircle2,
  FileText,
  Minus,
  PauseCircle,
  Percent,
  Plus,
  QrCode,
  Scan,
  ShoppingCart,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { playErrorBuzz, playScannerBeep } from '../../services/sound'
import { formatRupiah, getStoredCustomers, getStoredProducts } from '../../services/storage'
import type { Product, Transaction } from '../../types/pos'
import { HeldOrdersModal } from './HeldOrdersModal'
import { PaymentModal } from './PaymentModal'
import { ReceiptModal } from './ReceiptModal'
import { SupervisorAuthModal } from './SupervisorAuthModal'

export const PosView: React.FC = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const {
    items,
    customer,
    setCustomer,
    addItem,
    removeItem,
    updateQuantity,
    setItemDiscount,
    setItemNotes,
    clearCart,
    orderDiscount,
    setOrderDiscount,
    taxRate,
    setTaxRate,
    subtotal,
    itemCount,
    totalPieces,
    totalDiscount,
    taxAmount,
    total,
    holdCurrentCart,
    loadHeldCart,
    heldTransactions,
    removeHeld,
  } = useCart()

  const [barcodeInput, setBarcodeInput] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showScannerSimulator, setShowScannerSimulator] = useState(false)
  const [showSupervisorAuth, setShowSupervisorAuth] = useState<boolean>(false)
  const [showHeldModal, setShowHeldModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null)

  // Item discount or note editing
  const [activeItemModal, setActiveItemModal] = useState<{
    type: 'discount' | 'note'
    productId: string
    value: string
  } | null>(null)

  // Order discount modal
  const [showOrderDiscountModal, setShowOrderDiscountModal] = useState(false)
  const [tempDiscount, setTempDiscount] = useState('0')

  const inputRef = useRef<HTMLInputElement>(null)
  const products = getStoredProducts()
  const customers = getStoredCustomers()

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Live filter based on barcodeInput
  const query = barcodeInput.trim().toLowerCase()
  const liveSuggestions: Product[] = query
    ? products
        .filter((p) => {
          const code = (p.code || '').toLowerCase()
          const sku = (p.sku || '').toLowerCase()
          const name = p.name.toLowerCase()
          const id = p.id.toLowerCase()
          const cleanSku = sku.replace(/[^0-9a-z]/g, '')
          const cleanQuery = query.replace(/[^0-9a-z]/g, '')

          return (
            code.includes(query) ||
            sku.includes(query) ||
            name.includes(query) ||
            id === query ||
            (cleanQuery.length >= 2 && cleanSku.includes(cleanQuery))
          )
        })
        .slice(0, 6)
    : []

  // Add product to cart helper with Audio Beep & Stock Check
  const handleSelectProduct = (product: Product) => {
    const res = addItem(product, 1)
    if (res.success) {
      playScannerBeep()
      showToast(`✅ ${product.name} berhasil ditambahkan!`, 'success')
      setBarcodeInput('')
      setIsInputFocused(false)
      inputRef.current?.focus()
    } else {
      playErrorBuzz()
      showToast(`⚠️ ${res.message}`, 'error')
    }
  }

  // Handle barcode submit on Enter / Scanner trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return

    const trimmed = barcodeInput.trim().toLowerCase()
    const cleanQuery = trimmed.replace(/[^0-9a-z]/g, '')

    let matched = products.find(
      (p) =>
        p.code?.toLowerCase() === trimmed ||
        p.sku?.toLowerCase() === trimmed ||
        p.id.toLowerCase() === trimmed ||
        p.sku?.toLowerCase().replace(/[^0-9a-z]/g, '') === cleanQuery
    )

    if (!matched && liveSuggestions.length > 0) {
      matched = liveSuggestions[0]
    }

    if (matched) {
      handleSelectProduct(matched)
    } else {
      playErrorBuzz()
      showToast(`❌ Produk dengan kode "${barcodeInput}" tidak ditemukan!`, 'error')
    }
  }

  // Anti-fraud void handler
  const requestVoidCart = (_type: 'batal' | 'kosongkan') => {
    if (items.length === 0) return

    // If current role is Kasir, require Supervisor authorization!
    if (user?.role === 'Kasir') {
      setShowSupervisorAuth(true)
    } else {
      // Owner or Supervisor can void directly
      if (window.confirm('Konfirmasi pembatalan seluruh isi keranjang kasir?')) {
        clearCart()
        showToast('Transaksi dibatalkan oleh ' + user?.role, 'success')
      }
    }
  }

  const handleSupervisorApproved = () => {
    setShowSupervisorAuth(false)
    clearCart()
    showToast('✅ Pembatalan / Void disetujui Supervisor!', 'success')
  }

  return (
    <div className="pb-36 pt-2 px-4 max-w-2xl mx-auto space-y-3.5 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border border-emerald-500/50'
              : 'bg-red-900 text-white border border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Search / Barcode Bar & Action Buttons (Matches Screen 4) */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onFocus={() => setIsInputFocused(true)}
              onChange={(e) => {
                setBarcodeInput(e.target.value)
                setIsInputFocused(true)
              }}
              placeholder={t('posSearchPlaceholder')}
              className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none shadow-sm font-medium"
            />
            <Scan className="w-4 h-4 text-emerald-700 absolute left-3 top-3" />
            {barcodeInput && (
              <button
                type="button"
                onClick={() => {
                  setBarcodeInput('')
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Scan Barcode Simulator Button */}
          <button
            onClick={() => setShowScannerSimulator(true)}
            className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-900 active:scale-95 transition-all shadow-md shadow-emerald-800/15 shrink-0"
            title={t('posScannerTooltip')}
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Plus Manual Button */}
          <button
            onClick={() => setShowProductPicker(true)}
            className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-100 active:scale-95 transition-all shrink-0"
            title={t('posAddManualTooltip')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Live Auto-Suggest Dropdown */}
        {isInputFocused && barcodeInput.trim().length > 0 && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsInputFocused(false)}
            />
            <div className="absolute left-0 right-0 top-12 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              {liveSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <p>Tidak ditemukan produk dengan kode atau nama "{barcodeInput}".</p>
                </div>
              ) : (
                liveSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="flex items-center justify-between p-2.5 hover:bg-emerald-50/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <ShoppingCart className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 truncate">
                          {prod.name}
                        </h5>
                        <p className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
                          {prod.code || prod.sku}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        {formatRupiah(prod.price)}
                      </span>
                      <button className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-[11px] hover:bg-emerald-900 active:scale-95 shadow-sm">
                        + Tambah
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Customer Selector Row (Matches Screen 4) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{customer.name}</span>
              {customer.points > 0 && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                  ★ {customer.points} {t('posPointsLabel')}
                </span>
              )}
            </div>
            {customer.phone !== '-' && (
              <span className="text-[11px] text-slate-400 block">{customer.phone}</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowCustomerPicker(true)}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1"
        >
          <span>⇄ {t('posChangeCustomer')}</span>
        </button>
      </div>

      {/* Daftar Belanja Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base text-slate-900">{t('posCartTitle')}</h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-800 text-white">
            {itemCount} {t('posItemsCount')}
          </span>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => requestVoidCart('kosongkan')}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('posEmptyCartBtn')}</span>
          </button>
        )}
      </div>

      {/* Cart Items List (Matches Screen 4) */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{t('posCartEmptyTitle')}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {t('posCartEmptySub')}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => {
                setBarcodeInput('8821')
                inputRef.current?.focus()
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              {t('posTryType')} 8821
            </button>
            <button
              onClick={() => setShowProductPicker(true)}
              className="px-4 py-2 rounded-2xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 active:scale-95 transition-all shadow-md shadow-emerald-800/15"
            >
              {t('posPickProductBtn')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const unitPrice = item.product.price
            const effectivePrice =
              item.itemDiscount > 0
                ? unitPrice - (unitPrice * item.itemDiscount) / 100
                : unitPrice
            const itemTotal = effectivePrice * item.quantity

            return (
              <div
                key={item.product.id}
                className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2.5"
              >
                {/* Product Info Row */}
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <ShoppingCart className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-slate-400 hover:text-red-600 p-1 -mr-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.product.sku || 'SKU-001'} • @{formatRupiah(unitPrice)}
                    </p>

                    {/* Discount & Note buttons */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() =>
                          setActiveItemModal({
                            type: 'discount',
                            productId: item.product.id,
                            value: item.itemDiscount.toString(),
                          })
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                          item.itemDiscount > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Percent className="w-2.5 h-2.5" />
                        <span>
                          {item.itemDiscount > 0
                            ? `Diskon ${item.itemDiscount}%`
                            : 'DISCOUNT Diskon Item'}
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          setActiveItemModal({
                            type: 'note',
                            productId: item.product.id,
                            value: item.notes || '',
                          })
                        }
                        className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{item.notes ? item.notes : 'Catatan'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stepper & Subtotal Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  {/* Stepper [-] Qty [+] with Stock Constraint */}
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200/80">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        const res = updateQuantity(item.product.id, item.quantity + 1)
                        if (!res.success) {
                          playErrorBuzz()
                          showToast(`⚠️ ${res.message}`, 'error')
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal Item */}
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-900 font-mono">
                      {formatRupiah(itemTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Billing Summary Box (Matches Screen 4) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal ({totalPieces} pcs)</span>
          <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>Diskon Transaksi</span>
            <button
              onClick={() => {
                setTempDiscount(orderDiscount.toString())
                setShowOrderDiscountModal(true)
              }}
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              (+ Tambah)
            </button>
          </div>
          <span className="font-semibold text-emerald-700">
            -{formatRupiah(totalDiscount)}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>PPN ({taxRate}%)</span>
            <button
              onClick={() => setTaxRate(taxRate === 0 ? 11 : 0)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
            >
              {taxRate === 0 ? 'Aktifkan 11%' : 'Nol-kan'}
            </button>
          </div>
          <span className="font-semibold text-slate-800">{formatRupiah(taxAmount)}</span>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center">
          <span className="font-bold text-sm text-slate-900">Total Tagihan</span>
          <span className="text-xl font-black text-emerald-900 font-mono">
            {formatRupiah(total)}
          </span>
        </div>
      </div>

      {/* Bottom Sticky Action Bar (Matches Screen 4) */}
      <div className="fixed bottom-14 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2.5 px-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Tahan button */}
          <button
            onClick={() => {
              if (items.length === 0 && heldTransactions.length > 0) {
                setShowHeldModal(true)
                return
              }
              if (items.length === 0) return
              holdCurrentCart(user?.name || 'Budi S.')
              showToast('Transaksi telah ditahan (Hold Bill)', 'success')
            }}
            className="flex-1 py-3 px-3 rounded-2xl border border-slate-200/90 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all relative bg-white"
          >
            <PauseCircle className="w-4 h-4 text-slate-600" />
            <span>Tahan</span>
            {heldTransactions.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {heldTransactions.length}
              </span>
            )}
          </button>

          {/* Batal button with Anti-Fraud protection */}
          <button
            onClick={() => requestVoidCart('batal')}
            disabled={items.length === 0}
            className={`flex-1 py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              items.length > 0
                ? 'border-red-200 text-red-600 hover:bg-red-50 active:scale-95 bg-white'
                : 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>{t('cancel')}</span>
          </button>

          {/* Bayar button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={items.length === 0}
            className={`flex-[2] py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-lg transition-all ${
              items.length > 0
                ? 'bg-emerald-800 hover:bg-emerald-900 active:scale-98 shadow-emerald-800/25'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <span>{t('posPayBtn')} {formatRupiah(total)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Supervisor Auth Modal (Anti-Fraud) */}
      {showSupervisorAuth && (
        <SupervisorAuthModal
          onClose={() => {
            setShowSupervisorAuth(false)
          }}
          onSuccess={handleSupervisorApproved}
        />
      )}

      {/* Barcode Scanner Simulator Modal */}
      {showScannerSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Simulasi Barcode Scanner</h3>
              </div>
              <button
                onClick={() => setShowScannerSimulator(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder Graphic with Red Laser */}
            <div className="relative h-32 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="w-3/4 h-20 border-2 border-dashed border-emerald-500/60 rounded-xl relative flex items-center justify-center">
                <Barcode className="w-16 h-16 text-slate-700/60" />
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
              </div>
              <p className="absolute bottom-1.5 text-[10px] text-slate-400">
                Pilih barcode di bawah untuk simulasi scan
              </p>
            </div>

            {/* Quick Tap Barcodes */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Tap Barcode untuk Scan:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      handleSelectProduct(p)
                    }}
                    className="flex flex-col text-left p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/80 active:scale-95 transition-all group"
                  >
                    <span className="font-bold text-xs text-white line-clamp-1 group-hover:text-emerald-300">
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold mt-0.5">
                      {p.sku || p.code}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {formatRupiah(p.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowScannerSimulator(false)}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Tutup Scanner
            </button>
          </div>
        </div>
      )}

      {/* Product Quick Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-3.5 animate-in zoom-in-95 my-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                Pilih Produk ke Keranjang
              </h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    handleSelectProduct(p)
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-300 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {p.code} • {p.sku} • {formatRupiah(p.price)}
                      </p>
                    </div>
                  </div>

                  <button className="px-3 py-1 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 active:scale-95 shadow-sm">
                    + Tambah
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowProductPicker(false)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
            >
              Selesai Memilih
            </button>
          </div>
        </div>
      )}

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-5 space-y-3.5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Pilih Pelanggan</h3>
              <button
                onClick={() => setShowCustomerPicker(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setCustomer(c)
                    setShowCustomerPicker(false)
                    showToast(`Pelanggan diubah: ${c.name}`)
                  }}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    customer.id === c.id
                      ? 'bg-emerald-50 border-emerald-600 font-bold text-emerald-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {c.phone} • {c.points} Poin ({c.memberType})
                    </p>
                  </div>
                  {customer.id === c.id && <span className="text-emerald-700 font-bold">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Item Discount / Note Modal */}
      {activeItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full shadow-2xl p-5 space-y-3 animate-in zoom-in-95">
            <h3 className="font-bold text-sm text-slate-900">
              {activeItemModal.type === 'discount' ? 'Diskon Item (%)' : 'Catatan Pesanan Item'}
            </h3>
            {activeItemModal.type === 'discount' ? (
              <input
                type="number"
                min="0"
                max="100"
                value={activeItemModal.value}
                onChange={(e) =>
                  setActiveItemModal({ ...activeItemModal, value: e.target.value })
                }
                placeholder="Persentase diskon (misal: 10)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            ) : (
              <textarea
                value={activeItemModal.value}
                onChange={(e) =>
                  setActiveItemModal({ ...activeItemModal, value: e.target.value })
                }
                placeholder="Contoh: Jangan terlalu manis, ekstra bungkus..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setActiveItemModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (activeItemModal.type === 'discount') {
                    setItemDiscount(activeItemModal.productId, parseFloat(activeItemModal.value) || 0)
                  } else {
                    setItemNotes(activeItemModal.productId, activeItemModal.value)
                  }
                  setActiveItemModal(null)
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-800/20"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Discount Modal */}
      {showOrderDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full shadow-2xl p-5 space-y-3 animate-in zoom-in-95">
            <h3 className="font-bold text-sm text-slate-900">Potongan Diskon Nota (Rp)</h3>
            <input
              type="number"
              value={tempDiscount}
              onChange={(e) => setTempDiscount(e.target.value)}
              placeholder="Jumlah potongan (Rp)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowOrderDiscountModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setOrderDiscount(Math.max(0, parseInt(tempDiscount) || 0))
                  setShowOrderDiscountModal(false)
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-800/20"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {showHeldModal && (
        <HeldOrdersModal
          heldList={heldTransactions}
          onClose={() => setShowHeldModal(false)}
          onResume={(held) => {
            loadHeldCart(held)
            setShowHeldModal(false)
            showToast('Draft pesanan berhasil dimuat kembali!')
          }}
          onDelete={(id) => removeHeld(id)}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(trx) => {
            setShowPaymentModal(false)
            setCompletedTransaction(trx)
          }}
        />
      )}

      {/* Receipt Modal */}
      {completedTransaction && (
        <ReceiptModal
          transaction={completedTransaction}
          onClose={() => setCompletedTransaction(null)}
          onNewTransaction={() => setCompletedTransaction(null)}
        />
      )}
    </div>
  )
}
