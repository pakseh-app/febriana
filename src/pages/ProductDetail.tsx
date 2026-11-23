import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { rupiah } from '../lib/format'
import { minPrice, priceFor, sellPrice } from '../lib/types'
import ProductCard from '../components/ProductCard'

const RECENT_KEY = 'febriana-recent'

export default function ProductDetail() {
  const { id } = useParams()
  const { products, soldCounts, addToCart, toggleWishlist, wishlist } = useStore()
  const navigate = useNavigate()
  const product = products.find((p) => p.id === id)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  const [copied, setCopied] = useState(false)
  const related = product ? products.filter((p) => p.id !== product.id && p.category_id && p.category_id === product.category_id).slice(0, 4) : []

  // Simpan ke "Terakhir Dilihat" di Beranda
  useEffect(() => {
    if (!id) return
    try {
      const prev: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch { /* abaikan */ }
  }, [id])
  if (!product) return <p className="card">Produk tidak ditemukan.</p>
  // Harga mengikuti ukuran yang dipilih (misal S Rp20.000, XL Rp35.000);
  // sebelum memilih ukuran, tampilkan harga termurah.
  const { price: basePrice, discount_price: baseDisc } = priceFor(product, size || undefined)
  const price = size ? (baseDisc ?? basePrice) : minPrice(product)
  const needSize = product.sizes.length > 0 && !size
  const needColor = product.colors.length > 0 && !color
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        {product.images?.[img] ? (
          <img src={product.images[img]} alt={product.name} className="w-full rounded-2xl object-cover" />
        ) : (
          <div className="w-full h-96 bg-beige rounded-2xl flex items-center justify-center text-6xl font-display">{product.name.charAt(0)}</div>
        )}
        <div className="flex gap-2 mt-3">
          {product.images?.map((src, i) => (
            <button key={i} onClick={() => setImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border ${i === img ? 'border-gold' : 'border-sand'}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold">{product.name}</h1>
        <div className="mt-2 flex items-baseline gap-2">
          {!size && product.sizes.length > 1 && <span className="text-sm text-gray-500">Mulai</span>}
          <span className="text-2xl font-bold">{rupiah(price)}</span>
          {size ? (
            baseDisc && <span className="line-through text-gray-400">{rupiah(basePrice)}</span>
          ) : (
            product.discount_price && <span className="line-through text-gray-400">{rupiah(product.price)}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Terjual {soldCounts[product.id] ?? 0} · Stok {product.stock}</p>
        <p className="mt-4 text-gray-700 whitespace-pre-line">{product.description || '—'}</p>
        {product.sizes.length > 0 && (
          <div className="mt-5">
            <span className="label">Ukuran</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`px-4 py-2 rounded-full border text-center ${size === s ? 'bg-ink text-white' : 'border-sand bg-white'}`}>
                  <span className="block font-medium">{s}</span>
                  <span className={`block text-xs ${size === s ? 'text-gray-300' : 'text-gray-500'}`}>{rupiah(sellPrice(product, s))}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {product.colors.length > 0 && (
          <div className="mt-4">
            <span className="label">Warna</span>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`px-4 py-2 rounded-full border ${color === c ? 'bg-ink text-white' : 'border-sand bg-white'}`}>{c}</button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 flex items-center gap-3">
          <span className="label !mb-0">Jumlah</span>
          <button className="btn-outline !px-3 !py-1" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span>{qty}</span>
          <button className="btn-outline !px-3 !py-1" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="btn-primary"
            disabled={product.stock <= 0 || needSize || needColor}
            onClick={() => { addToCart(product, size, color, qty); navigate('/keranjang') }}
          >
            {product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
          </button>
          <button className="btn-outline" onClick={() => toggleWishlist(product.id)}>
            {wishlist.includes(product.id) ? '♥ Di Wishlist' : '♡ Wishlist'}
          </button>
        </div>
        {(needSize || needColor) && <p className="text-sm text-amber-700 mt-2">Pilih ukuran dan warna dulu.</p>}
        <div className="mt-6 pt-5 border-t border-beige">
          <p className="text-sm font-medium mb-2">Bagikan produk ini:</p>
          <div className="flex flex-wrap gap-2">
            <a
              className="btn-outline !py-2 !px-4 text-sm"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`${product.name} — ${rupiah(price)} di FEBRIANA: ${window.location.href}`)}`}
            >
              Bagikan via WhatsApp
            </a>
            <button
              className="btn-outline !py-2 !px-4 text-sm"
              onClick={async () => {
                try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* clipboard tidak tersedia */ }
              }}
            >
              {copied ? 'Link disalin ✓' : 'Salin Link Produk'}
            </button>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div className="md:col-span-2">
          <h2 className="font-display text-2xl font-bold mb-4">Produk Terkait</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

