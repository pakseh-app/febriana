import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { rupiah } from '../lib/format'

export default function ProductDetail() {
  const { id } = useParams()
  const { products, soldCounts, addToCart, toggleWishlist, wishlist } = useStore()
  const navigate = useNavigate()
  const product = products.find((p) => p.id === id)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  if (!product) return <p className="card">Produk tidak ditemukan.</p>
  const price = product.discount_price ?? product.price
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
          <span className="text-2xl font-bold">{rupiah(price)}</span>
          {product.discount_price && <span className="line-through text-gray-400">{rupiah(product.price)}</span>}
        </div>
        <p className="text-sm text-gray-500 mt-1">Terjual {soldCounts[product.id] ?? 0} · Stok {product.stock}</p>
        <p className="mt-4 text-gray-700 whitespace-pre-line">{product.description || '—'}</p>
        {product.sizes.length > 0 && (
          <div className="mt-5">
            <span className="label">Ukuran</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`px-4 py-2 rounded-full border ${size === s ? 'bg-ink text-white' : 'border-sand bg-white'}`}>{s}</button>
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
      </div>
    </div>
  )
}
