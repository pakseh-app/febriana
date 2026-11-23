// Tipe ini mengikuti persis tabel Supabase yang sudah dibuat user
// (categories, products, orders, settings) — lihat README langkah 2.
export type Category = {
  id: string
  name: string
  slug: string | null
  image_url: string | null
  active: boolean | null
  created_at?: string
}

export type SizePrice = { price: number; discount_price?: number | null }

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  discount_price: number | null
  // Harga per ukuran, misal {"S": {"price": 20000}, "XL": {"price": 35000}}.
  // Ukuran yang tidak ada di sini memakai harga dasar (price/discount_price).
  size_prices?: Record<string, SizePrice> | null
  category_id: string | null
  sizes: string[]
  colors: string[]
  stock: number
  sold_count: number
  images: string[]
  active: boolean | null
  is_new: boolean | null
  is_best_seller: boolean | null
  created_at?: string
}

export type OrderItem = {
  product_id: string
  name: string
  size?: string
  color?: string
  qty: number
  price: number
}

export type Order = {
  id: string
  customer_name: string
  customer_whatsapp: string
  address: string
  items: OrderItem[]
  total: number
  note: string | null
  status: string
  created_at?: string
}

export type Settings = {
  id: number
  store_name: string | null
  whatsapp: string | null
  tagline: string | null
  about: string | null
  logo_url: string | null
  banner_url: string | null
  shopee_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  facebook_url: string | null
}

// Status yang dihitung sebagai "Terjual" — hanya setelah admin menyetujui.
// "Menunggu Konfirmasi" dan "Dibatalkan" TIDAK dihitung.
export const APPROVED_STATUSES = ['Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Selesai']
export const ORDER_STATUSES = [
  'Menunggu Konfirmasi',
  'Menunggu Pembayaran',
  'Diproses',
  'Dikirim',
  'Selesai',
  'Dibatalkan',
]

// Harga yang berlaku untuk satu ukuran. Kalau ukuran tidak punya harga
// sendiri, pakai harga dasar produk.
export function priceFor(p: Product, size?: string): { price: number; discount_price: number | null } {
  const sp = size ? p.size_prices?.[size] : undefined
  if (sp && typeof sp.price === 'number') return { price: sp.price, discount_price: sp.discount_price ?? null }
  return { price: p.price, discount_price: p.discount_price }
}

// Harga jual efektif (setelah diskon, bila ada) untuk satu ukuran.
export function sellPrice(p: Product, size?: string): number {
  const { price, discount_price } = priceFor(p, size)
  return discount_price ?? price
}

// Harga jual termurah di antara semua ukuran — dipakai di kartu produk
// ("Mulai Rp…") dan urutan Termurah/Termahal.
export function minPrice(p: Product): number {
  if (!p.sizes?.length) return sellPrice(p)
  return Math.min(...p.sizes.map((s) => sellPrice(p, s)))
}

export function soldCountFor(productId: string, orders: Order[]): number {
  let n = 0
  for (const o of orders) {
    if (!APPROVED_STATUSES.includes(o.status)) continue
    for (const item of o.items || []) {
      if (item.product_id === productId) n += item.qty
    }
  }
  return n
}

export const DEFAULT_WHATSAPP = '6285600327769'
