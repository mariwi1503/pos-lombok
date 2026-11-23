import React, { useState } from 'react'
import {
  Edit3,
  Package,
  Plus,
  Scan,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { categories } from '../../data/dummyData'
import { formatRupiah, getStoredProducts, setStoredProducts } from '../../services/storage'
import type { Product } from '../../types/pos'

interface ProductViewProps {
  onNavigateTab?: (tab: any, subTab?: string) => void
}

export const ProductView: React.FC<ProductViewProps> = ({ onNavigateTab }) => {
  const { hasPermission } = useAuth()
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>(getStoredProducts())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'safe' | 'low'>('all')

  // Edit / Add Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Permissions check
  const canViewBuyPrice = hasPermission('Master Produk & Harga Beli')

  // Status Counts
  const totalCount = products.length
  const lowCount = products.filter((p) => p.stock <= (p.minStock || 10)).length
  const safeCount = totalCount - lowCount

  const filteredProducts = products.filter((p) => {
    // Search filter
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())

    // Category filter
    const matchesCategory =
      selectedCategory === 'all' || p.categoryId === selectedCategory

    // Stock filter
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = p.stock <= (p.minStock || 10)
    } else if (stockFilter === 'safe') {
      matchesStock = p.stock > (p.minStock || 10)
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    let updated: Product[]
    if (isAddMode) {
      updated = [editingProduct, ...products]
      showToast(`Produk "${editingProduct.name}" berhasil ditambahkan!`)
    } else {
      updated = products.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      showToast(`Produk "${editingProduct.name}" berhasil diperbarui!`)
    }

    setProducts(updated)
    setStoredProducts(updated)
    setEditingProduct(null)
    setIsAddMode(false)
  }

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Hapus produk ini dari daftar katalog?')) {
      const updated = products.filter((p) => p.id !== id)
      setProducts(updated)
      setStoredProducts(updated)
      setEditingProduct(null)
      showToast('Produk berhasil dihapus.')
    }
  }

  const openAddModal = () => {
    const newProd: Product = {
      id: 'p_' + Date.now(),
      name: '',
      handle: 'produk-' + Date.now(),
      description: '',
      price: 10000,
      buyPrice: 7500,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
      category: 'Makanan',
      categoryId: 'makanan',
      stock: 50,
      minStock: 10,
      unit: 'pcs',
      code: `BRG-0${products.length + 1}`,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    }
    setEditingProduct(newProd)
    setIsAddMode(true)
  }

  return (
    <div className="pb-24 pt-2 px-4 max-w-2xl mx-auto space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Top Switcher Tabs: Produk | Pelanggan | Supplier (Matches Screen 3) */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-800 text-white shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
          <span>Produk</span>
        </button>

        <button
          onClick={() => onNavigateTab?.('mitra', 'pelanggan')}
          className="px-4 py-2 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Pelanggan
        </button>

        <button
          onClick={() => onNavigateTab?.('mitra', 'supplier')}
          className="px-4 py-2 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Supplier
        </button>
      </div>

      {/* Search Bar & Tambah Button */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk, kode, atau barcode..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none shadow-sm"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Scan className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          )}
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 active:scale-95 transition-all shadow-md shadow-emerald-800/15 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Stock Summary Badges: Total, Aman, Menipis (Matches Screen 3) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStockFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            stockFilter === 'all'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
          <span>{totalCount} Total</span>
        </button>

        <button
          onClick={() => setStockFilter('safe')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            stockFilter === 'safe'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{safeCount} Aman</span>
        </button>

        <button
          onClick={() => setStockFilter('low')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            stockFilter === 'low'
              ? 'bg-orange-100 text-orange-800 border border-orange-300'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>{lowCount} Menipis</span>
        </button>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Kategori
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-emerald-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Product Card List (Matches Screen 3) */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Produk tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              Coba kata kunci lain atau ubah filter kategori.
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isLowStock = p.stock <= (p.minStock || 10)
            const margin =
              p.buyPrice && p.price > 0
                ? Math.round(((p.price - p.buyPrice) / p.price) * 100)
                : 25

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 hover:border-slate-200 transition-all"
              >
                {/* Product Header Row */}
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder icon
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            {p.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Stock badge */}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isLowStock
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Stok: {p.stock}
                        </span>

                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setEditingProduct(p)
                            setIsAddMode(false)
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Kode: {p.code || 'BRG-001'} • SKU: {p.sku || 'SKU-001'}
                    </p>
                  </div>
                </div>

                {/* Bottom Pricing & Margin Box (Matches Screen 3) */}
                <div className="bg-slate-50/90 rounded-2xl p-2.5 px-3 flex items-center justify-between text-xs border border-slate-100">
                  <div className="flex items-center gap-4">
                    {/* Beli (Masked if Cashier) */}
                    <div>
                      <span className="text-slate-400 text-[10px] block">Beli:</span>
                      <span className="font-semibold text-slate-700">
                        {canViewBuyPrice ? formatRupiah(p.buyPrice || p.price * 0.75) : '•••••'}
                      </span>
                    </div>

                    {/* Jual */}
                    <div>
                      <span className="text-slate-400 text-[10px] block">Jual:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(p.price)}</span>
                    </div>

                    {/* Margin (Masked if Cashier) */}
                    <div>
                      <span className="text-slate-400 text-[10px] block">Margin:</span>
                      <span className="font-bold text-emerald-700">
                        {canViewBuyPrice ? `${margin}%` : '••••'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Add to Cart button */}
                  <button
                    onClick={() => {
                      addItem(p, 1)
                      showToast(`+1 ${p.name} ditambahkan ke kasir`)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-[11px] hover:bg-emerald-900 active:scale-95 transition-all shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>+ Kasir</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Tambah / Edit Produk */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {isAddMode ? 'Tambah Produk Baru' : 'Edit Detail Produk'}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value)
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                        category: cat ? cat.name : 'Makanan',
                      })
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="pcs / botol / kg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli (Modal)</label>
                  <input
                    type="number"
                    value={editingProduct.buyPrice || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        buyPrice: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Min. Stok</label>
                  <input
                    type="number"
                    value={editingProduct.minStock || 10}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        minStock: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Barang</label>
                  <input
                    type="text"
                    value={editingProduct.code || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Barcode</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Foto Produk</label>
                <input
                  type="text"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                {!isAddMode && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct.id)}
                    className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                    title="Hapus Produk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
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
          </div>
        </div>
      )}
    </div>
  )
}
