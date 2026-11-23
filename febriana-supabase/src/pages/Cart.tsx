import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { rupiah } from '../lib/format'

export default function Cart() {
  const { cart, setQty, removeFromCart } = useStore()
  const navigate = useNavigate()
  const total = cart.reduce((n, l) => n + (l.product.discount_price ?? l.product.price) * l.qty, 0)
  if (cart.length === 0) {
    return (
      <div className="card text-center py-10">
        <p>Keranjang masih kosong.</p>
        <Link to="/katalog" className="btn-primary inline-block mt-4">Lihat Katalog</Link>
      </div>
    )
  }
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Keranjang</h1>
      <div className="space-y-3">
        {cart.map((l) => {
          const price = l.product.discount_price ?? l.product.price
          return (
            <div key={`${l.product.id}-${l.size}-${l.color}`} className="card flex gap-4 items-center">
              {l.product.images?.[0] ? (
                <img src={l.product.images[0]} alt="" className="w-20 h-20 object-cover rounded-xl" />
              ) : (
                <div className="w-20 h-20 bg-beige rounded-xl flex items-center justify-center font-display text-2xl">{l.product.name.charAt(0)}</div>
              )}
              <div className="flex-1">
                <div className="font-medium">{l.product.name}</div>
                <div className="text-sm text-gray-500">{[l.size, l.color].filter(Boolean).join(' / ')}</div>
                <div className="font-bold mt-1">{rupiah(price * l.qty)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-outline !px-3 !py-1" onClick={() => setQty(l.product.id, l.size, l.color, l.qty - 1)}>−</button>
                <span>{l.qty}</span>
                <button className="btn-outline !px-3 !py-1" onClick={() => setQty(l.product.id, l.size, l.color, l.qty + 1)}>+</button>
              </div>
              <button className="text-sm text-red-600" onClick={() => removeFromCart(l.product.id, l.size, l.color)}>Hapus</button>
            </div>
          )
        })}
      </div>
      <div className="card mt-6 flex items-center justify-between">
        <span className="font-bold text-lg">Total: {rupiah(total)}</span>
        <button className="btn-primary" onClick={() => navigate('/checkout')}>Checkout via WhatsApp</button>
      </div>
    </div>
  )
}
