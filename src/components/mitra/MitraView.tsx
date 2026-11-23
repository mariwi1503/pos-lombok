import React, { useState } from 'react'
import {
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Phone,
  Plus,
  Trash2,
  Truck,
  Users,
  X,
} from 'lucide-react'
import {
  formatRupiah,
  getStoredCustomers,
  getStoredProducts,
  getStoredPurchases,
  getStoredSuppliers,
  savePurchase,
  setStoredCustomers,
  setStoredSuppliers,
} from '../../services/storage'
import type { Customer, PurchaseItem, Supplier, SupplierPurchase } from '../../types/pos'

interface MitraViewProps {
  initialSubTab?: 'pelanggan' | 'supplier' | 'pembelian'
}

export const MitraView: React.FC<MitraViewProps> = ({ initialSubTab = 'pelanggan' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pelanggan' | 'supplier' | 'pembelian'>(initialSubTab)
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers())
  const [suppliers, setSuppliers] = useState<Supplier[]>(getStoredSuppliers())
  const [purchases, setPurchases] = useState<SupplierPurchase[]>(getStoredPurchases())
  const products = getStoredProducts()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<SupplierPurchase | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Customer Form
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custMember, setCustMember] = useState<'Umum' | 'Member' | 'VIP'>('Member')

  // Supplier Form
  const [supName, setSupName] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supCategory, setSupCategory] = useState('')
  const [supAddress, setSupAddress] = useState('')

  // New Purchase Form
  const [poSupplierId, setPoSupplierId] = useState<string>(suppliers[0]?.id || '')
  const [poDate, setPoDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [poStatus, setPoStatus] = useState<'Lunas' | 'Tempo'>('Lunas')
  const [poNotes, setPoNotes] = useState<string>('')
  const [poItems, setPoItems] = useState<PurchaseItem[]>([
    {
      productId: products[0]?.id || 'p1',
      productName: products[0]?.name || 'Indomie Goreng',
      quantity: 50,
      buyPrice: products[0]?.buyPrice || 2500,
      subtotal: 50 * (products[0]?.buyPrice || 2500),
    },
  ])

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!custName.trim()) return

    const newCust: Customer = {
      id: 'c_' + Date.now(),
      name: custName,
      phone: custPhone || '-',
      points: custMember === 'VIP' ? 100 : custMember === 'Member' ? 50 : 0,
      totalTransactions: 0,
      memberType: custMember,
    }

    const updated = [newCust, ...customers]
    setCustomers(updated)
    setStoredCustomers(updated)
    setCustName('')
    setCustPhone('')
    setShowAddModal(false)
    showToast(`Pelanggan "${newCust.name}" berhasil ditambahkan!`)
  }

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supName.trim()) return

    const newSup: Supplier = {
      id: 's_' + Date.now(),
      name: supName,
      phone: supPhone || '-',
      category: supCategory || 'Umum',
      address: supAddress || 'Indonesia',
    }

    const updated = [newSup, ...suppliers]
    setSuppliers(updated)
    setStoredSuppliers(updated)
    setSupName('')
    setSupPhone('')
    setSupCategory('')
    setSupAddress('')
    setShowAddModal(false)
    showToast(`Supplier "${newSup.name}" berhasil ditambahkan!`)
  }

  const handleAddPoItem = () => {
    const defaultProd = products[0]
    setPoItems([
      ...poItems,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        quantity: 20,
        buyPrice: defaultProd.buyPrice || 2500,
        subtotal: 20 * (defaultProd.buyPrice || 2500),
      },
    ])
  }

  const handleRemovePoItem = (index: number) => {
    if (poItems.length <= 1) return
    setPoItems(poItems.filter((_, i) => i !== index))
  }

  const handlePoItemChange = (index: number, field: string, val: any) => {
    const updated = [...poItems]
    if (field === 'productId') {
      const prod = products.find((p) => p.id === val)
      if (prod) {
        updated[index].productId = prod.id
        updated[index].productName = prod.name
        updated[index].buyPrice = prod.buyPrice || prod.price * 0.75
        updated[index].subtotal = updated[index].quantity * updated[index].buyPrice
      }
    } else if (field === 'quantity') {
      const q = Math.max(1, parseInt(val) || 1)
      updated[index].quantity = q
      updated[index].subtotal = q * updated[index].buyPrice
    } else if (field === 'buyPrice') {
      const p = Math.max(0, parseInt(val) || 0)
      updated[index].buyPrice = p
      updated[index].subtotal = updated[index].quantity * p
    }
    setPoItems(updated)
  }

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault()
    const targetSup = suppliers.find((s) => s.id === poSupplierId) || suppliers[0]
    const totalAmount = poItems.reduce((acc, i) => acc + i.subtotal, 0)
    const randomNum = Math.floor(1000 + Math.random() * 9000)

    const newPO: SupplierPurchase = {
      id: 'po_' + Date.now(),
      purchaseNumber: `#PO-202310-${randomNum}`,
      date: new Date(poDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      dateIso: poDate,
      supplierId: targetSup.id,
      supplierName: targetSup.name,
      items: poItems,
      totalAmount,
      paymentStatus: poStatus,
      notes: poNotes,
    }

    savePurchase(newPO)
    setPurchases(getStoredPurchases())
    setShowAddPurchaseModal(false)
    showToast(`✅ Pembelian ${newPO.purchaseNumber} berhasil dicatat & stok bertambah!`)
  }

  return (
    <div className="pb-24 pt-2 px-4 max-w-2xl mx-auto space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Subtab Switcher (Full Width on Smartphone, No Overlap) */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold gap-1 shadow-inner">
        <button
          onClick={() => setActiveSubTab('pelanggan')}
          className={`flex-1 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
            activeSubTab === 'pelanggan'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Pelanggan ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('supplier')}
          className={`flex-1 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
            activeSubTab === 'supplier'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Supplier ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pembelian')}
          className={`flex-1 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
            activeSubTab === 'pembelian'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Kulakan / PO ({purchases.length})</span>
        </button>
      </div>

      {/* Subtab Header & Action Button */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <h3 className="font-serif font-bold text-base text-slate-900">
            {activeSubTab === 'pelanggan' && 'Daftar Pelanggan Toko'}
            {activeSubTab === 'supplier' && 'Daftar Supplier / Distributor'}
            {activeSubTab === 'pembelian' && 'Riwayat Pembelian & Restok'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {activeSubTab === 'pelanggan' && `${customers.length} kontak pelanggan terdaftar`}
            {activeSubTab === 'supplier' && `${suppliers.length} rekanan supplier aktif`}
            {activeSubTab === 'pembelian' && `${purchases.length} faktur kulakan supplier`}
          </p>
        </div>

        {activeSubTab === 'pembelian' ? (
          <button
            onClick={() => setShowAddPurchaseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 active:scale-95 shadow-md shadow-emerald-800/15 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Catat PO</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 active:scale-95 shadow-md shadow-emerald-800/15 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        )}
      </div>

      {/* Content based on subtab */}
      {activeSubTab === 'pelanggan' && (
        <div className="space-y-3">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.memberType === 'VIP'
                          ? 'bg-amber-100 text-amber-800'
                          : c.memberType === 'Member'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.memberType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Award className="w-3 h-3" />
                      {c.points} Poin (Dapat Tukar Diskon)
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {c.totalTransactions} Transaksi
              </span>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'supplier' && (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block mt-1">
                    {s.category}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {s.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {s.address}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab Pembelian / Kulakan ke Supplier */}
      {activeSubTab === 'pembelian' && (
        <div className="space-y-3">
          <div className="bg-emerald-900 text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-300">Total Pengeluaran Kulakan</p>
              <h3 className="text-lg font-black font-mono">
                {formatRupiah(purchases.reduce((acc, p) => acc + p.totalAmount, 0))}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-800 text-emerald-100">
              {purchases.length} Faktur Masuk
            </span>
          </div>

          {purchases.map((po) => {
            const totalQty = po.items.reduce((acc, i) => acc + i.quantity, 0)
            return (
              <div
                key={po.id}
                onClick={() => setSelectedPurchase(po)}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-emerald-300 transition-all cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {po.purchaseNumber}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{po.date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">{po.supplierName}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {po.items.length} jenis produk • {totalQty} pcs masuk
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-slate-900 block">
                      {formatRupiah(po.totalAmount)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                        po.paymentStatus === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {po.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Detail Pembelian / PO */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-3.5 animate-in zoom-in-95 my-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Faktur Pembelian Supplier
                </h3>
                <p className="font-mono text-xs text-slate-400">{selectedPurchase.purchaseNumber}</p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Pemasok / Supplier:</span>
                <span className="font-bold text-slate-800">{selectedPurchase.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal Transaksi:</span>
                <span className="font-semibold text-slate-700">{selectedPurchase.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Pembayaran:</span>
                <span className="font-bold text-emerald-800">{selectedPurchase.paymentStatus}</span>
              </div>
              {selectedPurchase.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Catatan:</span>
                  <span className="text-slate-600">{selectedPurchase.notes}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Rincian Barang Masuk Ke Gudang Toko
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {selectedPurchase.items.map((i, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{i.productName}</p>
                      <p className="text-[11px] text-slate-400">
                        Masuk: +{i.quantity} pcs @{formatRupiah(i.buyPrice)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      {formatRupiah(i.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 text-sm">Total Belanja Modal:</span>
              <span className="font-mono font-black text-base text-emerald-900">
                {formatRupiah(selectedPurchase.totalAmount)}
              </span>
            </div>

            <button
              onClick={() => setSelectedPurchase(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* Modal Catat Pembelian Baru ke Supplier */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-3.5 animate-in zoom-in-95 my-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Catat Pembelian ke Supplier (Restok)
                </h3>
                <p className="text-xs text-slate-400">Stok produk otomatis bertambah di toko.</p>
              </div>
              <button
                onClick={() => setShowAddPurchaseModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Supplier</label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Beli</label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Lunas">Lunas (Tunai/Transfer)</option>
                    <option value="Tempo">Tempo (Hutang Dagang)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="Misal: Faktur #123..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Items List Builder */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">Daftar Barang Masuk</label>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Barang</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handlePoItemChange(idx, 'productId', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stok skrg: {p.stock})
                            </option>
                          ))}
                        </select>
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePoItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500">Qty Masuk:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Harga Beli Satuan (Rp):</label>
                          <input
                            type="number"
                            value={item.buyPrice}
                            onChange={(e) => handlePoItemChange(idx, 'buyPrice', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-semibold text-slate-600">
                        Subtotal: <span className="font-mono text-emerald-800">{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-emerald-50 rounded-xl flex justify-between items-center text-xs font-bold border border-emerald-200">
                <span>Total Belanja Modal:</span>
                <span className="font-mono text-sm text-emerald-950">
                  {formatRupiah(poItems.reduce((acc, i) => acc + i.subtotal, 0))}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 shadow-md shadow-emerald-800/20"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Pelanggan/Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {activeSubTab === 'pelanggan' ? 'Tambah Pelanggan Baru' : 'Tambah Supplier Baru'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeSubTab === 'pelanggan' ? (
              <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Contoh: Bu Anita"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Keanggotaan</label>
                  <select
                    value={custMember}
                    onChange={(e) => setCustMember(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Umum">Umum</option>
                    <option value="Member">Member (Dapat Poin Belanja)</option>
                    <option value="VIP">VIP (Poin Ganda)</option>
                  </select>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 shadow-md shadow-emerald-800/20"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pemasok / PT</label>
                  <input
                    type="text"
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="Contoh: CV Sumber Makmur"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Barang</label>
                  <input
                    type="text"
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    placeholder="Contoh: Sembako, Minuman..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontak Telepon</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="0811-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Gudang</label>
                  <input
                    type="text"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    placeholder="Kota / Alamat singkat"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 shadow-md shadow-emerald-800/20"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
