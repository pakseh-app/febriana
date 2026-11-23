import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { requireSupabase } from '../lib/supabase'
import type { Category, Order, Product, Settings } from '../lib/types'
import { DEFAULT_WHATSAPP, soldCountFor } from '../lib/types'

export type CartLine = { product: Product; size: string; color: string; qty: number }

type StoreState = {
  configured: boolean
  loading: boolean
  products: Product[]
  categories: Category[]
  orders: Order[]
  settings: Settings | null
  whatsapp: string
  storeName: string
  soldCounts: Record<string, number>
  cart: CartLine[]
  wishlist: string[]
  addToCart: (p: Product, size: string, color: string, qty?: number) => void
  removeFromCart: (productId: string, size: string, color: string) => void
  setQty: (productId: string, size: string, color: string, qty: number) => void
  clearCart: () => void
  toggleWishlist: (id: string) => void
  refresh: () => Promise<void>
}

const Ctx = createContext<StoreState | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [soldFromServer, setSoldFromServer] = useState<Record<string, number> | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartLine[]>(() => load('febriana-cart', []))
  const [wishlist, setWishlist] = useState<string[]>(() => load('febriana-wishlist', []))

  const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

  async function refresh() {
    if (!configured) { setLoading(false); return }
    setLoading(true)
    try {
      const sb = requireSupabase()
      const [p, c, o, s, sc] = await Promise.all([
        sb.from('products').select('*').eq('active', true).order('created_at', { ascending: false }),
        sb.from('categories').select('*').eq('active', true).order('name'),
        // Tabel orders hanya terbaca kalau login sebagai admin.
        // Pengunjung gagal membaca di sini — itu normal dan aman,
        // karena angka Terjual diambil dari fungsi sold_counts() di bawah.
        sb.from('orders').select('*').order('created_at', { ascending: false }),
        sb.from('settings').select('*').eq('id', 1).maybeSingle(),
        sb.rpc('sold_counts'),
      ])
      if (p.data) setProducts(p.data as Product[])
      if (c.data) setCategories(c.data as Category[])
      if (o.data) setOrders(o.data as Order[])
      if (s.data) setSettings(s.data as Settings)
      if (sc.data) {
        const map: Record<string, number> = {}
        for (const row of sc.data as { product_id: string; sold: number }[]) map[row.product_id] = Number(row.sold)
        setSoldFromServer(map)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => { localStorage.setItem('febriana-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('febriana-wishlist', JSON.stringify(wishlist)) }, [wishlist])

  const soldCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of products) {
      // Utamakan angka dari server (sold_counts) supaya pengunjung
      // yang tidak login pun melihat angka yang sama dengan admin.
      // Kalau fungsi itu belum dijalankan di Supabase, pakai hitungan
      // dari tabel orders (hanya jalan kalau login admin).
      map[p.id] = soldFromServer?.[p.id] ?? soldCountFor(p.id, orders)
    }
    return map
  }, [products, orders, soldFromServer])

  const value: StoreState = {
    configured,
    loading,
    products,
    categories,
    orders,
    settings,
    whatsapp: settings?.whatsapp || DEFAULT_WHATSAPP,
    storeName: settings?.store_name || 'FEBRIANA',
    soldCounts,
    cart,
    wishlist,
    addToCart: (p, size, color, qty = 1) => {
      setCart((prev) => {
        const i = prev.findIndex((l) => l.product.id === p.id && l.size === size && l.color === color)
        if (i >= 0) {
          const next = [...prev]
          next[i] = { ...next[i], qty: next[i].qty + qty }
          return next
        }
        return [...prev, { product: p, size, color, qty }]
      })
    },
    removeFromCart: (productId, size, color) =>
      setCart((prev) => prev.filter((l) => !(l.product.id === productId && l.size === size && l.color === color))),
    setQty: (productId, size, color, qty) =>
      setCart((prev) =>
        qty <= 0
          ? prev.filter((l) => !(l.product.id === productId && l.size === size && l.color === color))
          : prev.map((l) => (l.product.id === productId && l.size === size && l.color === color ? { ...l, qty } : l)),
      ),
    clearCart: () => setCart([]),
    toggleWishlist: (id) => setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    refresh,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore harus di dalam StoreProvider')
  return ctx
}
