import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

export default function Catalog() {
  const { products, categories, loading } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [onlyWishlist, setOnlyWishlist] = useState(false)
  const { wishlist } = useStore()
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (cat && p.category_id !== cat) return false
        if (onlyWishlist && !wishlist.includes(p.id)) return false
        if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
        return true
      }),
    [products, cat, q, onlyWishlist, wishlist],
  )
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Katalog</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <input className="input max-w-xs" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyWishlist} onChange={(e) => setOnlyWishlist(e.target.checked)} /> Wishlist saja
        </label>
      </div>
      {loading ? <p>Memuat…</p> : filtered.length === 0 ? (
        <p className="card">Tidak ada produk yang cocok. Coba kata kunci atau kategori lain.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
