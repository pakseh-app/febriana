import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { rupiah } from '../lib/format'
import type { Product } from '../lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const { soldCounts, wishlist, toggleWishlist } = useStore()
  const price = product.discount_price ?? product.price
  const wished = wishlist.includes(product.id)
  const img = product.images?.[0]
  return (
    <div className="card flex flex-col">
      <Link to={`/produk/${product.id}`}>
        {img ? (
          <img src={img} alt={product.name} className="w-full h-56 object-cover rounded-xl" />
        ) : (
          <div className="w-full h-56 bg-beige rounded-xl flex items-center justify-center text-4xl font-display">{product.name.charAt(0)}</div>
        )}
      </Link>
      <div className="mt-3 flex-1">
        <Link to={`/produk/${product.id}`} className="font-medium hover:text-gold">{product.name}</Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold">{rupiah(price)}</span>
          {product.discount_price && <span className="text-sm line-through text-gray-400">{rupiah(product.price)}</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Terjual {soldCounts[product.id] ?? 0} · Stok {product.stock}
          {product.is_new ? ' · Baru' : ''}
        </div>
      </div>
      <button onClick={() => toggleWishlist(product.id)} className="mt-3 text-sm border border-sand rounded-full py-2 hover:bg-beige">
        {wished ? '♥ Tersimpan di Wishlist' : '♡ Wishlist'}
      </button>
    </div>
  )
}
