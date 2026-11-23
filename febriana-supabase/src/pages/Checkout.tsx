import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { buildOrderMessage, rupiah, waLink } from '../lib/format'
import { requireSupabase } from '../lib/supabase'
import type { OrderItem } from '../lib/types'

export default function Checkout() {
  const { cart, clearCart, storeName, whatsapp, refresh } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const total = cart.reduce((n, l) => n + (l.product.discount_price ?? l.product.price) * l.qty, 0)

  if (cart.length === 0) return <p className="card">Keranjang kosong — isi dulu dari katalog.</p>

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !phone.trim() || !address.trim()) { setError('Isi nama, nomor WhatsApp, dan alamat lengkap.'); return }
    setSaving(true)
    try {
      const items: OrderItem[] = cart.map((l) => ({
        product_id: l.product.id,
        name: l.product.name,
        size: l.size || undefined,
        color: l.color || undefined,
        qty: l.qty,
        price: l.product.discount_price ?? l.product.price,
      }))
      const sb = requireSupabase()
      // Simpan pesanan dulu (status Menunggu Konfirmasi), baru buka WhatsApp.
      const { error: insertError } = await sb.from('orders').insert({
        customer_name: name.trim(),
        customer_whatsapp: phone.trim(),
        address: address.trim(),
        items,
        total,
        note: note.trim() || null,
        status: 'Menunggu Konfirmasi',
      })
      if (insertError) throw insertError
      const message = buildOrderMessage(storeName, { customer_name: name.trim(), customer_whatsapp: phone.trim(), address: address.trim(), items, total, note })
      clearCart()
      await refresh()
      window.open(waLink(whatsapp, message), '_blank')
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pesanan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-4">Checkout</h1>
      <div className="card mb-4">
        {cart.map((l) => (
          <div key={`${l.product.id}-${l.size}-${l.color}`} className="flex justify-between text-sm py-1">
            <span>{l.product.name} x{l.qty}</span>
            <span>{rupiah((l.product.discount_price ?? l.product.price) * l.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t mt-2 pt-2"><span>Total</span><span>{rupiah(total)}</span></div>
      </div>
      <form onSubmit={submit} className="card space-y-4">
        <div><label className="label">Nama pelanggan</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Nomor WhatsApp</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
        <div><label className="label">Alamat lengkap</label><textarea className="input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div><label className="label">Catatan (opsional)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={saving}>{saving ? 'Menyimpan pesanan…' : 'Pesan via WhatsApp'}</button>
        <p className="text-xs text-gray-500">Pesanan disimpan dulu dengan status “Menunggu Konfirmasi”, lalu WhatsApp admin terbuka dengan pesan otomatis terisi. Tekan kirim di WhatsApp.</p>
      </form>
    </div>
  )
}
