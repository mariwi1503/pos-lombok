import type {
  Customer,
  HeldTransaction,
  Product,
  ShiftRecord,
  Staff,
  Supplier,
  SupplierPurchase,
  Transaction,
} from '../types/pos'
import {
  initialCustomers,
  initialProducts,
  initialStaff,
  initialSuppliers,
  initialTransactions,
} from '../data/dummyData'

const KEYS = {
  PRODUCTS: 'pos_products',
  STAFF: 'pos_staff',
  CUSTOMERS: 'pos_customers',
  SUPPLIERS: 'pos_suppliers',
  TRANSACTIONS: 'pos_transactions',
  HELD_TRANSACTIONS: 'pos_held_transactions',
  AUTH_USER: 'pos_auth_user',
  PURCHASES: 'pos_purchases',
  CURRENT_SHIFT: 'pos_current_shift',
  SHIFT_HISTORY: 'pos_shift_history',
}

export const initialPurchases: SupplierPurchase[] = [
  {
    id: 'po_init_1',
    purchaseNumber: '#PO-202310-0012',
    date: '18 Okt 2023',
    dateIso: '2023-10-18',
    supplierId: 's1',
    supplierName: 'PT Indofood Sukses Makmur',
    items: [
      { productId: 'p1', productName: 'Indomie Goreng Special', quantity: 200, buyPrice: 2500, subtotal: 500000 },
      { productId: 'p2', productName: 'Indomie Kuah Soto', quantity: 150, buyPrice: 2500, subtotal: 375000 },
    ],
    totalAmount: 875000,
    paymentStatus: 'Lunas',
    notes: 'Restok mingguan mie instan reguler',
  },
  {
    id: 'po_init_2',
    purchaseNumber: '#PO-202310-0008',
    date: '10 Okt 2023',
    dateIso: '2023-10-10',
    supplierId: 's3',
    supplierName: 'CV Berkah Pangan Mandiri',
    items: [
      { productId: 'p18', productName: 'Minyak Goreng Bimoli 2L', quantity: 60, buyPrice: 31500, subtotal: 1890000 },
      { productId: 'p19', productName: 'Gula Pasir 1kg', quantity: 100, buyPrice: 13000, subtotal: 1300000 },
    ],
    totalAmount: 3190000,
    paymentStatus: 'Tempo',
    notes: 'Jatuh tempo 30 hari',
  },
]

export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('IDR', 'Rp').trim()
}

export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem(KEYS.PRODUCTS)
  if (!data) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(initialProducts))
    return initialProducts
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialProducts
  }
}

export const setStoredProducts = (products: Product[]) => {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products))
}

export const getStoredStaff = (): Staff[] => {
  const data = localStorage.getItem(KEYS.STAFF)
  if (!data) {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(initialStaff))
    return initialStaff
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialStaff
  }
}

export const setStoredStaff = (staff: Staff[]) => {
  localStorage.setItem(KEYS.STAFF, JSON.stringify(staff))
}

export const getStoredCustomers = (): Customer[] => {
  const data = localStorage.getItem(KEYS.CUSTOMERS)
  if (!data) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(initialCustomers))
    return initialCustomers
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialCustomers
  }
}

export const setStoredCustomers = (customers: Customer[]) => {
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers))
}

export const getStoredSuppliers = (): Supplier[] => {
  const data = localStorage.getItem(KEYS.SUPPLIERS)
  if (!data) {
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(initialSuppliers))
    return initialSuppliers
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSuppliers
  }
}

export const setStoredSuppliers = (suppliers: Supplier[]) => {
  localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(suppliers))
}

export const getStoredTransactions = (): Transaction[] => {
  const data = localStorage.getItem(KEYS.TRANSACTIONS)
  if (!data) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initialTransactions))
    return initialTransactions
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialTransactions
  }
}

export const saveTransaction = (transaction: Transaction) => {
  const current = getStoredTransactions()
  const updated = [transaction, ...current]
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated))

  // 1. Reduce product stock
  const products = getStoredProducts()
  transaction.items.forEach((item) => {
    const idx = products.findIndex((p) => p.id === item.product.id)
    if (idx !== -1) {
      products[idx].stock = Math.max(0, products[idx].stock - item.quantity)
    }
  })
  setStoredProducts(products)

  // 2. Increment staff transaction counter
  const staff = getStoredStaff()
  const staffIdx = staff.findIndex((s) => s.id === transaction.cashierId)
  if (staffIdx !== -1) {
    staff[staffIdx].todayTransactions = (staff[staffIdx].todayTransactions || 0) + 1
    setStoredStaff(staff)
  }

  // 3. Accumulate Customer Loyalty Points (1 point per Rp 10.000 spent)
  if (transaction.customer && transaction.customer.id !== 'c0') {
    const customers = getStoredCustomers()
    const cIdx = customers.findIndex((c) => c.id === transaction.customer.id)
    if (cIdx !== -1) {
      const earnedPoints = Math.floor(transaction.total / 10000)
      customers[cIdx].points += earnedPoints
      customers[cIdx].totalTransactions += 1
      setStoredCustomers(customers)
    }
  }

  // 4. Update Current Cashier Shift Record
  const currentShift = getCurrentShift()
  if (currentShift && currentShift.status === 'open') {
    if (transaction.paymentMethod === 'Tunai') {
      currentShift.systemCashSales += transaction.total
    } else {
      currentShift.systemNonCashSales += transaction.total
    }
    currentShift.totalTransactions += 1
    setCurrentShift(currentShift)
  }
}

// Supplier Purchases (PO & Restock)
export const getStoredPurchases = (): SupplierPurchase[] => {
  const data = localStorage.getItem(KEYS.PURCHASES)
  if (!data) {
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(initialPurchases))
    return initialPurchases
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialPurchases
  }
}

export const savePurchase = (purchase: SupplierPurchase) => {
  const current = getStoredPurchases()
  const updated = [purchase, ...current]
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify(updated))

  // Automatically restock product quantities and update buyPrice!
  const products = getStoredProducts()
  purchase.items.forEach((item) => {
    const pIdx = products.findIndex((p) => p.id === item.productId)
    if (pIdx !== -1) {
      products[pIdx].stock += item.quantity
      if (item.buyPrice > 0) {
        products[pIdx].buyPrice = item.buyPrice
      }
    }
  })
  setStoredProducts(products)
}

// Cashier Shift & Cash Drawer Management
export const getCurrentShift = (): ShiftRecord | null => {
  const data = localStorage.getItem(KEYS.CURRENT_SHIFT)
  if (!data) {
    // Default open shift for Budi Santoso with Rp 150.000 initial drawer cash
    const defaultShift: ShiftRecord = {
      id: 'shift_today_1',
      cashierId: 'staff-3',
      cashierName: 'Budi Santoso',
      shiftName: 'Shift Pagi',
      startTime: '07:00 WIB',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      initialCash: 150000,
      systemCashSales: 151500,
      systemNonCashSales: 187400,
      totalTransactions: 3,
      status: 'open',
    }
    localStorage.setItem(KEYS.CURRENT_SHIFT, JSON.stringify(defaultShift))
    return defaultShift
  }
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const setCurrentShift = (shift: ShiftRecord | null) => {
  if (shift) {
    localStorage.setItem(KEYS.CURRENT_SHIFT, JSON.stringify(shift))
  } else {
    localStorage.removeItem(KEYS.CURRENT_SHIFT)
  }
}

export const closeShift = (actualCashInDrawer: number, notes?: string): ShiftRecord => {
  const current = getCurrentShift()
  const now = new Date()
  const endTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

  const expectedCash = (current?.initialCash || 0) + (current?.systemCashSales || 0)
  const difference = actualCashInDrawer - expectedCash

  const closedShift: ShiftRecord = {
    ...(current || {
      id: 'shift_' + Date.now(),
      cashierId: 'staff-3',
      cashierName: 'Budi Santoso',
      shiftName: 'Shift Pagi',
      startTime: '07:00 WIB',
      date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      initialCash: 150000,
      systemCashSales: 0,
      systemNonCashSales: 0,
      totalTransactions: 0,
    }),
    endTime,
    actualCashInDrawer,
    difference,
    status: 'closed',
    notes,
  }

  // Save to shift history
  const historyData = localStorage.getItem(KEYS.SHIFT_HISTORY)
  const history: ShiftRecord[] = historyData ? JSON.parse(historyData) : []
  localStorage.setItem(KEYS.SHIFT_HISTORY, JSON.stringify([closedShift, ...history]))

  // Clear current shift
  localStorage.removeItem(KEYS.CURRENT_SHIFT)

  return closedShift
}

export const startNewShift = (cashier: Staff, initialCash: number, shiftName: string): ShiftRecord => {
  const now = new Date()
  const newShift: ShiftRecord = {
    id: 'shift_' + Date.now(),
    cashierId: cashier.id,
    cashierName: cashier.name,
    shiftName,
    startTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    initialCash,
    systemCashSales: 0,
    systemNonCashSales: 0,
    totalTransactions: 0,
    status: 'open',
  }

  setCurrentShift(newShift)
  return newShift
}

export const getStoredHeldTransactions = (): HeldTransaction[] => {
  const data = localStorage.getItem(KEYS.HELD_TRANSACTIONS)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export const saveHeldTransaction = (held: HeldTransaction) => {
  const current = getStoredHeldTransactions()
  const updated = [held, ...current.filter((h) => h.id !== held.id)]
  localStorage.setItem(KEYS.HELD_TRANSACTIONS, JSON.stringify(updated))
}

export const deleteHeldTransaction = (id: string) => {
  const current = getStoredHeldTransactions()
  const updated = current.filter((h) => h.id !== id)
  localStorage.setItem(KEYS.HELD_TRANSACTIONS, JSON.stringify(updated))
}

export const getAuthUser = (): Staff | null => {
  const data = localStorage.getItem(KEYS.AUTH_USER)
  if (!data) return initialStaff[0] // Default to Owner Andi Wijaya
  try {
    return JSON.parse(data)
  } catch {
    return initialStaff[0]
  }
}

export const setAuthUser = (user: Staff | null) => {
  if (user) {
    localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(KEYS.AUTH_USER)
  }
}

export const resetAllDataToDefault = () => {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(initialProducts))
  localStorage.setItem(KEYS.STAFF, JSON.stringify(initialStaff))
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(initialCustomers))
  localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(initialSuppliers))
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initialTransactions))
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify(initialPurchases))
  localStorage.removeItem(KEYS.HELD_TRANSACTIONS)
  localStorage.removeItem(KEYS.CURRENT_SHIFT)
  localStorage.removeItem(KEYS.SHIFT_HISTORY)
  localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(initialStaff[0]))
}
