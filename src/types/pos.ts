export interface Category {
  id: string
  name: string
  icon: string
  handle: string
  color: string
}

export interface Product {
  id: string
  name: string
  handle: string
  description: string
  price: number
  buyPrice?: number
  image: string
  category: string
  categoryId: string
  stock: number
  minStock?: number
  unit: string
  isPromo?: boolean
  discount?: number
  code?: string
  sku?: string
}

export type StaffRole = 'Owner' | 'Supervisor' | 'Kasir'

export interface Staff {
  id: string
  name: string
  initials: string
  role: StaffRole
  shift: string
  active: boolean
  avatarColor: string
  pin: string
  todayTransactions?: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  points: number
  totalTransactions: number
  memberType: 'Umum' | 'Member' | 'VIP'
}

export interface Supplier {
  id: string
  name: string
  phone: string
  category: string
  address: string
}

export interface CartItem {
  product: Product
  quantity: number
  itemDiscount: number // in percentage or fixed
  notes?: string
}

export interface Transaction {
  id: string
  orderNumber: string
  timestamp: string
  date: string
  dateIso?: string
  cashierId: string
  cashierName: string
  customer: Customer
  items: CartItem[]
  subtotal: number
  discountTotal: number
  tax: number
  total: number
  paymentMethod: 'Tunai' | 'QRIS' | 'Transfer' | 'Debit'
  amountPaid: number
  change: number
  status: 'completed' | 'held' | 'cancelled'
}

export interface HeldTransaction {
  id: string
  orderNumber: string
  timestamp: string
  cashierName: string
  customer: Customer
  items: CartItem[]
  subtotal: number
  total: number
  note?: string
}

export interface ModulePermission {
  feature: string
  owner: boolean
  supervisor: boolean
  cashier: boolean
}

export interface PurchaseItem {
  productId: string
  productName: string
  quantity: number
  buyPrice: number
  subtotal: number
}

export interface SupplierPurchase {
  id: string
  purchaseNumber: string
  date: string
  dateIso: string
  supplierId: string
  supplierName: string
  items: PurchaseItem[]
  totalAmount: number
  paymentStatus: 'Lunas' | 'Tempo'
  notes?: string
}

export interface ShiftRecord {
  id: string
  cashierId: string
  cashierName: string
  shiftName: string
  startTime: string
  endTime?: string
  date: string
  initialCash: number // modal awal kembalian di laci
  systemCashSales: number
  systemNonCashSales: number
  totalTransactions: number
  actualCashInDrawer?: number // uang fisik aktual di laci
  difference?: number // selisih (actual - expected)
  status: 'open' | 'closed'
  notes?: string
}
