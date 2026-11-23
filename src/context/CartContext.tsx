import React, { createContext, useContext, useEffect, useState } from 'react'
import type { CartItem, Customer, HeldTransaction, Product } from '../types/pos'
import { initialCustomers } from '../data/dummyData'
import {
  deleteHeldTransaction,
  getStoredHeldTransactions,
  saveHeldTransaction,
} from '../services/storage'

interface CartContextType {
  items: CartItem[]
  customer: Customer
  setCustomer: (customer: Customer) => void
  addItem: (product: Product, quantity?: number) => { success: boolean; message?: string }
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => { success: boolean; message?: string }
  setItemDiscount: (productId: string, discount: number) => void
  setItemNotes: (productId: string, notes: string) => void
  clearCart: () => void
  orderDiscount: number
  setOrderDiscount: (discount: number) => void
  taxRate: number
  setTaxRate: (rate: number) => void
  orderNumber: string
  subtotal: number
  itemCount: number
  totalPieces: number
  totalDiscount: number
  taxAmount: number
  total: number
  holdCurrentCart: (cashierName: string) => void
  loadHeldCart: (held: HeldTransaction) => void
  heldTransactions: HeldTransaction[]
  removeHeld: (id: string) => void
  generateNewOrderNumber: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const generateRandomOrderNumber = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `#TRX-202310-${randomNum}`
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer>(initialCustomers[0])
  const [orderDiscount, setOrderDiscount] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(0)
  const [orderNumber, setOrderNumber] = useState<string>('#TRX-202310-0082')
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([])

  useEffect(() => {
    setHeldTransactions(getStoredHeldTransactions())
  }, [])

  const generateNewOrderNumber = () => {
    setOrderNumber(generateRandomOrderNumber())
  }

  const addItem = (product: Product, quantity: number = 1): { success: boolean; message?: string } => {
    if (product.stock <= 0) {
      return { success: false, message: `Stok produk "${product.name}" habis!` }
    }

    const existing = items.find((item) => item.product.id === product.id)
    const currentQty = existing ? existing.quantity : 0
    if (currentQty + quantity > product.stock) {
      return {
        success: false,
        message: `Stok "${product.name}" tidak mencukupi! Tersisa ${product.stock} ${product.unit}.`,
      }
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id)
      if (existingIdx !== -1) {
        const updated = [...prev]
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        }
        return updated
      }
      return [...prev, { product, quantity, itemDiscount: 0, notes: '' }]
    })
    return { success: true }
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, qty: number): { success: boolean; message?: string } => {
    if (qty <= 0) {
      removeItem(productId)
      return { success: true }
    }
    const item = items.find((i) => i.product.id === productId)
    if (item && qty > item.product.stock) {
      return {
        success: false,
        message: `Stok "${item.product.name}" tidak mencukupi! Tersisa ${item.product.stock} ${item.product.unit}.`,
      }
    }
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    )
    return { success: true }
  }

  const setItemDiscount = (productId: string, discount: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, itemDiscount: discount } : item
      )
    )
  }

  const setItemNotes = (productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notes } : item))
    )
  }

  const clearCart = () => {
    setItems([])
    setOrderDiscount(0)
    setCustomer(initialCustomers[0])
  }

  const subtotal = items.reduce((acc, item) => {
    const itemPrice = item.product.price
    const discountedPrice = item.itemDiscount > 0
      ? Math.max(0, itemPrice - (itemPrice * item.itemDiscount) / 100)
      : itemPrice
    return acc + discountedPrice * item.quantity
  }, 0)

  const itemCount = items.length
  const totalPieces = items.reduce((acc, item) => acc + item.quantity, 0)
  const totalDiscount = orderDiscount
  const afterDiscount = Math.max(0, subtotal - totalDiscount)
  const taxAmount = Math.round((afterDiscount * taxRate) / 100)
  const total = afterDiscount + taxAmount

  const holdCurrentCart = (cashierName: string) => {
    if (items.length === 0) return
    const held: HeldTransaction = {
      id: 'held_' + Date.now(),
      orderNumber,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      cashierName,
      customer,
      items,
      subtotal,
      total,
    }
    saveHeldTransaction(held)
    setHeldTransactions(getStoredHeldTransactions())
    clearCart()
    generateNewOrderNumber()
  }

  const loadHeldCart = (held: HeldTransaction) => {
    setItems(held.items)
    setCustomer(held.customer)
    setOrderNumber(held.orderNumber)
    deleteHeldTransaction(held.id)
    setHeldTransactions(getStoredHeldTransactions())
  }

  const removeHeld = (id: string) => {
    deleteHeldTransaction(id)
    setHeldTransactions(getStoredHeldTransactions())
  }

  return (
    <CartContext.Provider
      value={{
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
        orderNumber,
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
        generateNewOrderNumber,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
