import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { minPrice } from '../lib/types'
import ProductCard from '../components/ProductCard'

export default function Catalog() {
  const { products, categories, loading, soldCounts } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [onlyWishlist, setOnlyWishlist] = useState(() => searchParams.get('wishlist') === '1')
  const [sort, setSort] = useState<'baru' | 'termurah' | 'termahal' | 'terlaris' | 'nama'>('baru')
  const { wishlist } = useStore()

  useEffect(() => {
    if (onlyWishlist) setSearchParams({ wishlist: '1' }, { replace: true })
    else if (searchParams.get('wishlist')) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyWishlist])

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (cat && p.category_id !== cat) return false
      if (onlyWishlist && !wishlist.includes(p.id)) return false
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    const by = {
      baru: (a: typeof products[number], b: typeof products[number]) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      termurah: (a: typeof products[number], b: typeof products[number]) => minPrice(a) - minPrice(b),
      termahal: (a: typeof products[number], b: typeof products[number]) => minPrice(b) - minPrice(a),
      terlaris: (a: typeof products[number], b: typeof products[number]) => (soldCounts[b.id] ?? 0) - (soldCounts[a.id] ?? 0),
      nama: (a: typeof products[number], b: typeof products[number]) => a.name.localeCompare(b.name, 'id'),
    }[sort]
    return [...list].sort(by)
  }, [products, cat, q, onlyWishlist, wishlist, sort, soldCounts])

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">{onlyWishlist ? 'Wishlist Saya' : 'Katalog'}</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <input className="input max-w-xs" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input max-w-xs" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="baru">Urutkan: Terbaru</option>
          <option value="terlaris">Urutkan: Terlaris</option>
          <option value="termurah">Urutkan: Termurah</option>
          <option value="termahal">Urutkan: Termahal</option>
          <option value="nama">Urutkan: Nama A–Z</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyWishlist} onChange={(e) => setOnlyWishlist(e.target.checked)} /> Wishlist saja
        </label>
      </div>
      <p className="text-sm text-gray-500 mb-4">{filtered.length} produk ditemukan</p>
      {loading ? <p>Memuat…</p> : filtered.length === 0 ? (
        <p className="card">{onlyWishlist ? 'Wishlist masih kosong. Ketuk ♥ di produk untuk menyimpan.' : 'Tidak ada produk yang cocok. Coba kata kunci atau kategori lain.'}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
