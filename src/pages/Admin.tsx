import { useEffect, useMemo, useState } from 'react'
import { requireSupabase } from '../lib/supabase'
import { useStore } from '../context/StoreContext'
import { rupiah, waLink } from '../lib/format'
import { APPROVED_STATUSES, ORDER_STATUSES, type Category, type Order, type Product } from '../lib/types'

async function uploadImage(bucket: string, file: File): Promise<string> {
  const sb = requireSupabase()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await sb.storage.from(bucket).upload(path, file)
  if (error) throw error
  const { data } = sb.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

const STATUS_STYLE: Record<string, string> = {
  'Menunggu Konfirmasi': 'bg-amber-100 text-amber-800',
  'Menunggu Pembayaran': 'bg-sky-100 text-sky-800',
  Diproses: 'bg-violet-100 text-violet-800',
  Dikirim: 'bg-blue-100 text-blue-800',
  Selesai: 'bg-green-100 text-green-800',
  Dibatalkan: 'bg-red-100 text-red-800',
}

function StatusPill({ status }: { status: string }) {
  return <span className={`inline-block text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
}

type Tab = 'overview' | 'produk' | 'kategori' | 'pesanan' | 'pengaturan'

// Email admin disimpan di konfigurasi (VITE_ADMIN_EMAIL), jadi di halaman
// login admin hanya perlu memasukkan password. Email ini harus sama dengan
// akun yang dibuat di Supabase → Authentication → Users. Kalau variabel ini
// belum diisi, kolom email tetap ditampilkan sebagai cadangan.
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || ''

export default function Admin() {
  const { refresh, products, categories, orders, settings, soldCounts } = useStore()
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  // Mode reset password: dibuka lewat link reset dari email Supabase.
  const [resetMode, setResetMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [linkError, setLinkError] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const sb = requireSupabase()
    // Link reset yang kedaluwarsa / sudah dipakai akan kembali dengan
    // #error=access_denied&error_code=otp_expired di alamatnya.
    if (window.location.hash.includes('otp_expired') || window.location.hash.includes('access_denied')) {
      setLinkError('Link reset sudah kedaluwarsa atau sudah pernah dipakai. Minta link reset yang baru dari Supabase, lalu klik secepatnya (link hanya berlaku sebentar dan sekali pakai).')
    }
    // Supabase mengirim event ini saat link reset password yang valid dibuka.
    const { data: listener } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setResetMode(true)
    })
    if (window.location.hash.includes('type=recovery')) setResetMode(true)
    sb.auth.getSession().then(({ data }) => { setAuthed(Boolean(data.session)); setChecking(false) })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    try {
      const sb = requireSupabase()
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
      setAuthed(true)
      await refresh()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Login gagal')
    }
  }

  async function logout() {
    await requireSupabase().auth.signOut()
    setAuthed(false)
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (newPassword.length < 6) { setErr('Password baru minimal 6 karakter.'); return }
    if (newPassword !== newPassword2) { setErr('Konfirmasi password tidak sama.'); return }
    try {
      const { error } = await requireSupabase().auth.updateUser({ password: newPassword })
      if (error) throw error
      setMsg('Password berhasil diubah. Kamu sudah masuk ke dashboard.')
      setResetMode(false)
      setAuthed(true)
      await refresh()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Gagal mengubah password — link mungkin sudah kedaluwarsa, minta link baru.')
    }
  }

  if (checking) return <p>Memeriksa sesi…</p>
  if (resetMode && !authed) {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-3xl font-bold mb-4">Buat Password Baru</h1>
        <form onSubmit={resetPassword} className="card space-y-4">
          <div><label className="label">Password baru</label><input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus /></div>
          <div><label className="label">Ulangi password baru</label><input className="input" type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full">Simpan Password Baru</button>
        </form>
      </div>
    )
  }
  if (!authed) {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-3xl font-bold mb-4">Login Admin</h1>
        {linkError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{linkError}</p>}
        <form onSubmit={login} className="card space-y-4">
          {ADMIN_EMAIL ? (
            <p className="text-sm text-gray-500">Login admin — cukup masukkan password.</p>
          ) : (
            <div><label className="label">Email admin</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          )}
          <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full">Masuk Dashboard</button>
          <p className="text-xs text-gray-500">Akun dibuat di Supabase → Authentication → Users (Add user, centang Auto Confirm User).</p>
        </form>
      </div>
    )
  }

  const approved = orders.filter((o) => APPROVED_STATUSES.includes(o.status))
  const revenue = approved.reduce((n, o) => n + Number(o.total), 0)
  const pending = orders.filter((o) => o.status === 'Menunggu Konfirmasi').length
  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'produk', label: 'Produk' },
    { id: 'kategori', label: 'Kategori' },
    { id: 'pesanan', label: 'Pesanan', badge: pending || undefined },
    { id: 'pengaturan', label: 'Pengaturan Toko' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Halo, Admin {settings?.store_name || 'FEBRIANA'} — {pending > 0 ? `${pending} pesanan menunggu konfirmasi.` : 'tidak ada pesanan yang menunggu.'}</p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" rel="noreferrer" className="btn-outline !py-2">Lihat Toko ↗</a>
          <button className="btn-outline !py-2" onClick={logout}>Keluar</button>
        </div>
      </div>
      <div className="flex gap-2 mt-4 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); setErr('') }} className={`px-4 py-2 rounded-full border ${tab === t.id ? 'bg-ink text-white' : 'border-sand bg-white'}`}>
            {t.label}
            {t.badge ? <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{t.badge}</span> : null}
          </button>
        ))}
      </div>
      {msg && <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">{msg}</p>}
      {err && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{err}</p>}
      <div className="mt-5">
        {tab === 'overview' && <Overview />}
        {tab === 'produk' && <ProductManager onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
        {tab === 'kategori' && <CategoryManager onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
        {tab === 'pesanan' && <OrderManager orders={orders} onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
        {tab === 'pengaturan' && <SettingsManager settings={settings} onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
      </div>
    </div>
  )
}

function Overview() {
  const { products, orders, soldCounts } = useStore()
  const approved = orders.filter((o) => APPROVED_STATUSES.includes(o.status))
  const revenue = approved.reduce((n, o) => n + Number(o.total), 0)
  const pending = orders.filter((o) => o.status === 'Menunggu Konfirmasi')
  const totalSold = Object.values(soldCounts).reduce((n, v) => n + v, 0)
  const lowStock = products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock)
  const recent = [...orders].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5)

  // Grafik pendapatan 14 hari terakhir (hanya pesanan disetujui)
  const days = useMemo(() => {
    const arr: { label: string; total: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toDateString()
      const total = approved
        .filter((o) => o.created_at && new Date(o.created_at).toDateString() === key)
        .reduce((n, o) => n + Number(o.total), 0)
      arr.push({ label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), total })
    }
    return arr
  }, [orders])
  const maxDay = Math.max(1, ...days.map((d) => d.total))

  const stats = [
    { label: 'Total Produk', value: String(products.length), sub: `${products.filter((p) => p.active !== false).length} aktif` },
    { label: 'Total Pesanan', value: String(orders.length), sub: `${pending.length} menunggu konfirmasi` },
    { label: 'Pendapatan (disetujui)', value: rupiah(revenue), sub: `${approved.length} pesanan disetujui` },
    { label: 'Produk Terjual', value: String(totalSold), sub: `rata-rata ${orders.length ? rupiah(Math.round(revenue / orders.length)) : 'Rp0'} / pesanan` },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="card !bg-amber-50 !border-amber-200">
          <b>Perlu tindakan:</b> {pending.length} pesanan masih Menunggu Konfirmasi — {pending.slice(0, 3).map((o) => o.customer_name).join(', ')}
          {pending.length > 3 ? ` dan ${pending.length - 3} lainnya` : ''}. Ubah statusnya di tab Pesanan.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-bold mb-1">Pendapatan 14 Hari Terakhir</div>
          <p className="text-xs text-gray-500 mb-4">Hanya pesanan yang sudah disetujui admin.</p>
          <div className="flex items-end gap-1 h-32">
            {days.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1" title={`${d.label}: ${rupiah(d.total)}`}>
                <div className="w-full bg-gold/80 rounded-t" style={{ height: `${Math.max(3, (d.total / maxDay) * 100)}%` }} />
                <span className="text-[9px] text-gray-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="font-bold mb-3">Pesanan per Status</div>
          {ORDER_STATUSES.map((s) => {
            const n = orders.filter((o) => o.status === s).length
            const pct = orders.length ? Math.round((n / orders.length) * 100) : 0
            return (
              <div key={s} className="flex items-center gap-3 py-1.5 text-sm">
                <span className="w-40 shrink-0"><StatusPill status={s} /></span>
                <span className="flex-1 h-2 bg-beige rounded-full overflow-hidden"><span className="block h-full bg-ink" style={{ width: `${pct}%` }} /></span>
                <span className="w-8 text-right font-medium">{n}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-bold mb-2">Produk Terlaris</div>
          {products.length === 0 ? <p className="text-sm text-gray-500">Belum ada produk.</p> : [...products].sort((a, b) => (soldCounts[b.id] ?? 0) - (soldCounts[a.id] ?? 0)).slice(0, 5).map((p) => {
            const sold = soldCounts[p.id] ?? 0
            const max = Math.max(1, ...products.map((x) => soldCounts[x.id] ?? 0))
            return (
              <div key={p.id} className="py-1.5 text-sm">
                <div className="flex justify-between"><span>{p.name}</span><span className="font-medium">Terjual {sold}</span></div>
                <div className="h-1.5 bg-beige rounded-full mt-1 overflow-hidden"><span className="block h-full bg-gold" style={{ width: `${(sold / max) * 100}%` }} /></div>
              </div>
            )
          })}
        </div>
        <div className="card">
          <div className="font-bold mb-2">Stok Menipis (≤ 5)</div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">Semua stok aman.</p>
          ) : (
            lowStock.map((p) => (
              <div key={p.id} className="flex justify-between py-1.5 text-sm border-b border-beige last:border-0">
                <span>{p.name}</span>
                <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock === 0 ? 'HABIS' : `Sisa ${p.stock}`}</span>
              </div>
            ))
          )}
          <div className="font-bold mt-4 mb-2">Pesanan Terbaru</div>
          {recent.length === 0 ? <p className="text-sm text-gray-500">Belum ada pesanan.</p> : recent.map((o) => (
            <div key={o.id} className="flex justify-between items-center py-1.5 text-sm border-b border-beige last:border-0">
              <span>{o.customer_name} <span className="text-gray-400">· {fmtDate(o.created_at)}</span></span>
              <span className="flex items-center gap-2"><b>{rupiah(Number(o.total))}</b><StatusPill status={o.status} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductManager({ onDone, onError }: { onDone: (m: string) => void; onError: (m: string) => void }) {
  const { products, categories, soldCounts, refresh } = useStore()
  const [editing, setEditing] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sizes, setSizes] = useState('')
  const [colors, setColors] = useState('')
  const [stock, setStock] = useState('0')
  const [desc, setDesc] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [active, setActive] = useState(true)
  const [isNew, setIsNew] = useState(false)
  const [isBest, setIsBest] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [sort, setSort] = useState<'baru' | 'terlaris' | 'termurah' | 'termahal' | 'stok'>('baru')

  function startNew() {
    setEditing(null); setName(''); setPrice(''); setDiscount(''); setCategoryId(''); setSizes(''); setColors(''); setStock('0'); setDesc(''); setImages([]); setActive(true); setIsNew(false); setIsBest(false)
  }
  function startEdit(p: Product) {
    setEditing(p); setName(p.name); setPrice(String(p.price)); setDiscount(p.discount_price ? String(p.discount_price) : '')
    setCategoryId(p.category_id || ''); setSizes(p.sizes.join(', ')); setColors(p.colors.join(', '))
    setStock(String(p.stock)); setDesc(p.description || ''); setImages(p.images || []); setActive(p.active !== false)
    setIsNew(Boolean(p.is_new)); setIsBest(Boolean(p.is_best_seller))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  async function handleUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const f of Array.from(files)) urls.push(await uploadImage('product-images', f))
      setImages((prev) => [...prev, ...urls])
    } catch (e) { onError(e instanceof Error ? e.message : 'Upload gagal — pastikan policy Storage admin sudah dijalankan (supabase/admin-policies.sql).') }
    finally { setUploading(false) }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      const sb = requireSupabase()
      const payload = {
        name: name.trim(), price: Number(price), discount_price: discount ? Number(discount) : null,
        category_id: categoryId || null, sizes: sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: colors.split(',').map((s) => s.trim()).filter(Boolean), stock: Number(stock),
        description: desc.trim() || null, images, active, is_new: isNew, is_best_seller: isBest,
      }
      const { error } = editing
        ? await sb.from('products').update(payload).eq('id', editing.id)
        : await sb.from('products').insert(payload)
      if (error) throw error
      onDone(editing ? 'Produk diperbarui.' : 'Produk ditambahkan.')
      startNew()
    } catch (e2) { onError(e2 instanceof Error ? e2.message : 'Gagal menyimpan produk.') }
  }
  async function remove(p: Product) {
    if (!confirm(`Hapus produk "${p.name}"?`)) return
    try {
      const { error } = await requireSupabase().from('products').delete().eq('id', p.id)
      if (error) throw error
      onDone('Produk dihapus.')
    } catch (e) { onError(e instanceof Error ? e.message : 'Gagal menghapus.') }
  }
  async function duplicate(p: Product) {
    try {
      const { error } = await requireSupabase().from('products').insert({
        name: `${p.name} (salinan)`, price: p.price, discount_price: p.discount_price, category_id: p.category_id,
        sizes: p.sizes, colors: p.colors, stock: p.stock, description: p.description, images: p.images, active: false,
        is_new: false, is_best_seller: false,
      })
      if (error) throw error
      onDone(`"${p.name}" diduplikasi sebagai draft (nonaktif).`)
    } catch (e) { onError(e instanceof Error ? e.message : 'Gagal menduplikasi.') }
  }
  async function toggleActive(p: Product) {
    try {
      const { error } = await requireSupabase().from('products').update({ active: p.active === false }).eq('id', p.id)
      if (error) throw error
      await refresh()
    } catch (e) { onError(e instanceof Error ? e.message : 'Gagal mengubah status.') }
  }
  async function adjustStock(p: Product, delta: number) {
    const next = Math.max(0, p.stock + delta)
    try {
      const { error } = await requireSupabase().from('products').update({ stock: next }).eq('id', p.id)
      if (error) throw error
      await refresh()
    } catch (e) { onError(e instanceof Error ? e.message : 'Gagal mengubah stok.') }
  }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (catFilter && p.category_id !== catFilter) return false
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    const by = {
      baru: (a: Product, b: Product) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      terlaris: (a: Product, b: Product) => (soldCounts[b.id] ?? 0) - (soldCounts[a.id] ?? 0),
      termurah: (a: Product, b: Product) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price),
      termahal: (a: Product, b: Product) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price),
      stok: (a: Product, b: Product) => a.stock - b.stock,
    }[sort]
    return [...list].sort(by)
  }, [products, q, catFilter, sort, soldCounts])
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name || '—'

  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={startNew}>+ Tambah Produk</button>
      <form onSubmit={save} className="card space-y-3">
        <div className="font-bold">{editing ? `Edit: ${editing.name}` : 'Produk Baru'}</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="label">Nama produk</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label className="label">Kategori</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Harga (Rp)</label><input className="input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
          <div><label className="label">Harga diskon (Rp, kosongkan bila tidak ada)</label><input className="input" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
          <div><label className="label">Ukuran (pisah koma, contoh: S, M, L)</label><input className="input" value={sizes} onChange={(e) => setSizes(e.target.value)} /></div>
          <div><label className="label">Warna (pisah koma)</label><input className="input" value={colors} onChange={(e) => setColors(e.target.value)} /></div>
          <div><label className="label">Stok</label><input className="input" type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
          <div className="flex flex-wrap gap-4 items-end pb-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Tampilkan di katalog</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} /> Tandai Baru</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isBest} onChange={(e) => setIsBest(e.target.checked)} /> Tandai Terlaris</label>
          </div>
        </div>
        <div><label className="label">Deskripsi</label><textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div>
          <label className="label">Foto produk (bucket product-images) — foto pertama jadi foto utama</label>
          <input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} />
          {uploading && <p className="text-sm">Mengunggah…</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />
                {i === 0 && <span className="absolute bottom-1 left-1 bg-ink text-white text-[10px] rounded px-1">Utama</span>}
                <button type="button" className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs" onClick={() => setImages(images.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary">{editing ? 'Simpan Perubahan' : 'Tambah Produk'}</button>
          {editing && <button type="button" className="btn-outline" onClick={startNew}>Batal Edit</button>}
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input max-w-xs" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="baru">Urutkan: Terbaru</option>
          <option value="terlaris">Urutkan: Terlaris</option>
          <option value="termurah">Urutkan: Termurah</option>
          <option value="termahal">Urutkan: Termahal</option>
          <option value="stok">Urutkan: Stok menipis</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Produk</th><th>Kategori</th><th>Harga</th><th>Terjual</th><th>Stok</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-beige">
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg" /> : <span className="w-10 h-10 bg-beige rounded-lg flex items-center justify-center font-display">{p.name.charAt(0)}</span>}
                    <span>{p.name}{p.is_new ? ' · Baru' : ''}{p.is_best_seller ? ' · ★' : ''}</span>
                  </span>
                </td>
                <td>{catName(p.category_id)}</td>
                <td>{rupiah(p.discount_price ?? p.price)}{p.discount_price ? <span className="block text-xs line-through text-gray-400">{rupiah(p.price)}</span> : null}</td>
                <td>{soldCounts[p.id] ?? 0}</td>
                <td>
                  <span className="inline-flex items-center gap-1">
                    <button className="border rounded px-1.5" onClick={() => adjustStock(p, -1)} title="Kurangi stok">−</button>
                    <b className={p.stock <= 5 ? 'text-red-600' : ''}>{p.stock}</b>
                    <button className="border rounded px-1.5" onClick={() => adjustStock(p, 1)} title="Tambah stok">+</button>
                  </span>
                </td>
                <td><button className={`text-xs font-semibold rounded-full px-2 py-1 ${p.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`} onClick={() => toggleActive(p)} title="Klik untuk ubah">{p.active !== false ? 'Aktif' : 'Nonaktif'}</button></td>
                <td className="text-right whitespace-nowrap space-x-2">
                  <button className="underline" onClick={() => startEdit(p)}>Edit</button>
                  <button className="underline" onClick={() => duplicate(p)}>Duplikat</button>
                  <button className="underline text-red-600" onClick={() => remove(p)}>Hapus</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="py-3 text-gray-500">Tidak ada produk yang cocok.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CategoryManager({ onDone, onError }: { onDone: (m: string) => void; onError: (m: string) => void }) {
  const { categories, products } = useStore()
  const [name, setName] = useState('')
  async function add(e: React.FormEvent) {
    e.preventDefault()
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const { error } = await requireSupabase().from('categories').insert({ name: name.trim(), slug })
      if (error) throw error
      setName('')
      onDone('Kategori ditambahkan.')
    } catch (e2) { onError(e2 instanceof Error ? e2.message : 'Gagal menambah kategori.') }
  }
  async function remove(c: Category) {
    const n = products.filter((p) => p.category_id === c.id).length
    if (n > 0 && !confirm(`Kategori "${c.name}" dipakai ${n} produk. Produknya tidak terhapus, tapi jadi tanpa kategori. Lanjut hapus?`)) return
    if (n === 0 && !confirm(`Hapus kategori "${c.name}"?`)) return
    try {
      const { error } = await requireSupabase().from('categories').delete().eq('id', c.id)
      if (error) throw error
      onDone('Kategori dihapus.')
    } catch (e) { onError(e instanceof Error ? e.message : 'Gagal menghapus.') }
  }
  return (
    <div className="card">
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input className="input" placeholder="Nama kategori baru" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn-primary whitespace-nowrap">Tambah</button>
      </form>
      {categories.map((c) => {
        const n = products.filter((p) => p.category_id === c.id).length
        return (
          <div key={c.id} className="flex justify-between py-2 border-b border-beige last:border-0">
            <span>{c.name} <span className="text-sm text-gray-400">· {n} produk</span></span>
            <button className="underline text-red-600 text-sm" onClick={() => remove(c)}>Hapus</button>
          </div>
        )
      })}
      {categories.length === 0 && <p className="text-sm text-gray-500">Belum ada kategori.</p>}
    </div>
  )
}

function OrderManager({ orders, onDone, onError }: { orders: Order[]; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  async function setStatus(o: Order, status: string) {
    try {
      const { error } = await requireSupabase().from('orders').update({ status }).eq('id', o.id)
      if (error) throw error
      onDone(`Pesanan ${o.customer_name} diubah ke "${status}".`)
    } catch (e) { onError(e instanceof Error ? e.message : 'Gagal mengubah status.') }
  }
  function exportCsv() {
    const rows = [['Tanggal', 'Nama', 'WhatsApp', 'Alamat', 'Produk', 'Total', 'Status']]
    for (const o of orders) {
      rows.push([
        o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '',
        o.customer_name, o.customer_whatsapp, (o.address || '').replace(/\n/g, ' '),
        o.items.map((it) => `${it.name} x${it.qty}`).join('; '),
        String(o.total), o.status,
      ])
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pesanan-febriana-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false
    if (q && !(o.customer_name.toLowerCase().includes(q.toLowerCase()) || o.customer_whatsapp.includes(q))) return false
    return true
  })
  if (orders.length === 0) return <p className="card">Belum ada pesanan.</p>
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input className="input max-w-xs" placeholder="Cari nama / nomor WA…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s} ({orders.filter((o) => o.status === s).length})</option>)}
        </select>
        <button className="btn-outline !py-2 ml-auto" onClick={exportCsv}>Export CSV ↓</button>
      </div>
      {filtered.length === 0 && <p className="card">Tidak ada pesanan yang cocok.</p>}
      {filtered.map((o) => (
        <div key={o.id} className="card">
          <div className="flex justify-between flex-wrap gap-2">
            <div><b>{o.customer_name}</b> · {o.customer_whatsapp}<br /><span className="text-sm text-gray-500">{o.address}</span></div>
            <div className="text-right"><div className="font-bold">{rupiah(Number(o.total))}</div><div className="text-xs text-gray-500">{fmtDate(o.created_at)}</div><div className="mt-1"><StatusPill status={o.status} /></div></div>
          </div>
          <div className="text-sm mt-2">
            {o.items.map((it, i) => <div key={i}>- {it.name} {[it.size, it.color].filter(Boolean).join(' / ')} x{it.qty} = {rupiah(it.price * it.qty)}</div>)}
            {o.note && <div className="text-gray-500">Catatan: {o.note}</div>}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <select className="input !w-auto" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <a className="underline text-sm" target="_blank" rel="noreferrer" href={waLink(o.customer_whatsapp, `Halo ${o.customer_name}, terima kasih sudah memesan di FEBRIANA. Pesananmu saat ini: ${o.status}.`)}>Hubungi pelanggan via WhatsApp</a>
          </div>
          <p className="text-xs text-gray-500 mt-2">“Terjual” baru bertambah setelah status disetujui (bukan Menunggu Konfirmasi / Dibatalkan).</p>
        </div>
      ))}
    </div>
  )
}

function SettingsManager({ settings, onDone, onError }: { settings: import('../lib/types').Settings | null; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [storeName, setStoreName] = useState(settings?.store_name || 'FEBRIANA')
  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp || '6285600327769')
  const [tagline, setTagline] = useState(settings?.tagline || '')
  const [about, setAbout] = useState(settings?.about || '')
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '')
  const [bannerUrl, setBannerUrl] = useState(settings?.banner_url || '')
  const [shopee, setShopee] = useState(settings?.shopee_url || '')
  const [instagram, setInstagram] = useState(settings?.instagram_url || '')
  const [tiktok, setTiktok] = useState(settings?.tiktok_url || '')
  const [facebook, setFacebook] = useState(settings?.facebook_url || '')
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleAsset(kind: 'logo' | 'banner', files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    setUploading(true)
    try {
      const url = await uploadImage('store-assets', f)
      if (kind === 'logo') setLogoUrl(url); else setBannerUrl(url)
    } catch (e) { onError(e instanceof Error ? e.message : 'Upload gagal.') }
    finally { setUploading(false) }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = { store_name: storeName.trim(), whatsapp: whatsapp.replace(/[^0-9]/g, ''), tagline: tagline.trim() || null, about: about.trim() || null, logo_url: logoUrl || null, banner_url: bannerUrl || null, shopee_url: shopee.trim() || null, instagram_url: instagram.trim() || null, tiktok_url: tiktok.trim() || null, facebook_url: facebook.trim() || null }
      const { error } = await requireSupabase().from('settings').update(payload).eq('id', 1)
      if (error) throw error
      onDone('Pengaturan toko disimpan.')
    } catch (e2) { onError(e2 instanceof Error ? e2.message : 'Gagal menyimpan pengaturan.') }
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-bold">Link Toko</div>
          <div className="text-sm text-gray-500 break-all">{`${window.location.origin}${window.location.pathname.startsWith('/febriana') ? '/febriana/' : '/'}`}</div>
        </div>
        <button
          className="btn-outline !py-2"
          onClick={async () => {
            try { await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname.startsWith('/febriana') ? '/febriana/' : '/'}`); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* clipboard tidak tersedia */ }
          }}
        >
          {copied ? 'Disalin ✓' : 'Salin Link Toko'}
        </button>
      </div>
      <form onSubmit={save} className="card space-y-4">
        <div><label className="label">Nama toko</label><input className="input" value={storeName} onChange={(e) => setStoreName(e.target.value)} /></div>
        <div><label className="label">Nomor WhatsApp admin (format internasional, contoh 6285600327769)</label><input className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
        <div><label className="label">Tagline</label><input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
        <div><label className="label">Tentang toko</label><textarea className="input" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} /></div>
        <div>
          <label className="label">Logo (bucket store-assets)</label>
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 mb-2" />}
          <input type="file" accept="image/*" onChange={(e) => handleAsset('logo', e.target.files)} />
        </div>
        <div>
          <label className="label">Banner (bucket store-assets)</label>
          {bannerUrl && <img src={bannerUrl} alt="Banner" className="h-20 object-cover rounded mb-2" />}
          <input type="file" accept="image/*" onChange={(e) => handleAsset('banner', e.target.files)} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="label">Shopee (opsional)</label><input className="input" value={shopee} onChange={(e) => setShopee(e.target.value)} placeholder="link atau @username" /></div>
          <div><label className="label">Instagram (opsional)</label><input className="input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="link atau @username" /></div>
          <div><label className="label">TikTok (opsional)</label><input className="input" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="link atau @username" /></div>
          <div><label className="label">Facebook (opsional)</label><input className="input" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="link atau @username" /></div>
        </div>
        {uploading && <p className="text-sm">Mengunggah…</p>}
        <button className="btn-primary">Simpan Pengaturan</button>
      </form>
    </div>
  )
}
