import { useEffect, useState } from 'react'
import { requireSupabase } from '../lib/supabase'
import { useStore } from '../context/StoreContext'
import { rupiah } from '../lib/format'
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

type Tab = 'overview' | 'produk' | 'kategori' | 'pesanan' | 'pengaturan'

export default function Admin() {
  const { refresh, products, categories, orders, settings, soldCounts } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const sb = requireSupabase()
    sb.auth.getSession().then(({ data }) => { setAuthed(Boolean(data.session)); setChecking(false) })
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

  if (checking) return <p>Memeriksa sesi…</p>
  if (!authed) {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-3xl font-bold mb-4">Login Admin</h1>
        <form onSubmit={login} className="card space-y-4">
          <div><label className="label">Email admin</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full">Masuk Dashboard</button>
          <p className="text-xs text-gray-500">Akun dibuat di Supabase → Authentication → Users (Add user, centang Auto Confirm User).</p>
        </form>
      </div>
    )
  }

  const approved = orders.filter((o) => APPROVED_STATUSES.includes(o.status))
  const revenue = approved.reduce((n, o) => n + Number(o.total), 0)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'produk', label: 'Produk' },
    { id: 'kategori', label: 'Kategori' },
    { id: 'pesanan', label: 'Pesanan' },
    { id: 'pengaturan', label: 'Pengaturan Toko' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold">Dashboard Admin</h1>
        <button className="btn-outline !py-2" onClick={logout}>Keluar</button>
      </div>
      <div className="flex gap-2 mt-4 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); setErr('') }} className={`px-4 py-2 rounded-full border ${tab === t.id ? 'bg-ink text-white' : 'border-sand bg-white'}`}>{t.label}</button>
        ))}
      </div>
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      <div className="mt-5">
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card"><div className="text-sm text-gray-500">Total Produk</div><div className="text-2xl font-bold">{products.length}</div></div>
            <div className="card"><div className="text-sm text-gray-500">Total Pesanan</div><div className="text-2xl font-bold">{orders.length}</div></div>
            <div className="card"><div className="text-sm text-gray-500">Total Kategori</div><div className="text-2xl font-bold">{categories.length}</div></div>
            <div className="card"><div className="text-sm text-gray-500">Pendapatan (pesanan disetujui)</div><div className="text-2xl font-bold">{rupiah(revenue)}</div></div>
            <div className="card col-span-2 md:col-span-4">
              <div className="font-bold mb-2">Produk Terlaris (hanya pesanan yang disetujui)</div>
              {products.length === 0 ? <p className="text-sm text-gray-500">Belum ada produk.</p> : [...products].sort((a, b) => (soldCounts[b.id] ?? 0) - (soldCounts[a.id] ?? 0)).slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-sm py-1 border-b border-beige last:border-0"><span>{p.name}</span><span>Terjual {soldCounts[p.id] ?? 0}</span></div>
              ))}
            </div>
          </div>
        )}
        {tab === 'produk' && <ProductManager onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
        {tab === 'kategori' && <CategoryManager onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
        {tab === 'pesanan' && <OrderManager orders={orders} onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
        {tab === 'pengaturan' && <SettingsManager settings={settings} onDone={async (m) => { setMsg(m); await refresh() }} onError={setErr} />}
      </div>
    </div>
  )
}

function ProductManager({ onDone, onError }: { onDone: (m: string) => void; onError: (m: string) => void }) {
  const { products, categories } = useStore()
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
  const [uploading, setUploading] = useState(false)

  function startNew() {
    setEditing(null); setName(''); setPrice(''); setDiscount(''); setCategoryId(''); setSizes(''); setColors(''); setStock('0'); setDesc(''); setImages([]); setActive(true)
  }
  function startEdit(p: Product) {
    setEditing(p); setName(p.name); setPrice(String(p.price)); setDiscount(p.discount_price ? String(p.discount_price) : '')
    setCategoryId(p.category_id || ''); setSizes(p.sizes.join(', ')); setColors(p.colors.join(', '))
    setStock(String(p.stock)); setDesc(p.description || ''); setImages(p.images || []); setActive(p.active !== false)
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
        description: desc.trim() || null, images, active,
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

  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={startNew}>+ Tambah Produk</button>
      <form onSubmit={save} className="card space-y-3">
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
          <div><label className="label">Aktif</label><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Tampilkan di katalog</div>
        </div>
        <div><label className="label">Deskripsi</label><textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div>
          <label className="label">Foto produk (bucket product-images)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} />
          {uploading && <p className="text-sm">Mengunggah…</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <button type="button" className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs" onClick={() => setImages(images.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
          </div>
        </div>
        <button className="btn-primary">{editing ? 'Simpan Perubahan' : 'Tambah Produk'}</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Produk</th><th>Harga</th><th>Stok</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-beige">
                <td className="py-2">{p.name}</td>
                <td>{rupiah(p.discount_price ?? p.price)}</td>
                <td>{p.stock}</td>
                <td className="text-right space-x-2"><button className="underline" onClick={() => startEdit(p)}>Edit</button><button className="underline text-red-600" onClick={() => remove(p)}>Hapus</button></td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={4} className="py-3 text-gray-500">Belum ada produk.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CategoryManager({ onDone, onError }: { onDone: (m: string) => void; onError: (m: string) => void }) {
  const { categories } = useStore()
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
    if (!confirm(`Hapus kategori "${c.name}"?`)) return
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
      {categories.map((c) => (
        <div key={c.id} className="flex justify-between py-2 border-b border-beige last:border-0"><span>{c.name}</span><button className="underline text-red-600 text-sm" onClick={() => remove(c)}>Hapus</button></div>
      ))}
      {categories.length === 0 && <p className="text-sm text-gray-500">Belum ada kategori.</p>}
    </div>
  )
}

function OrderManager({ orders, onDone, onError }: { orders: Order[]; onDone: (m: string) => void; onError: (m: string) => void }) {
  async function setStatus(o: Order, status: string) {
    try {
      const { error } = await requireSupabase().from('orders').update({ status }).eq('id', o.id)
      if (error) throw error
      onDone(`Pesanan ${o.customer_name} diubah ke "${status}".`)
    } catch (e) { onError(e instanceof Error ? e.message : 'Gagal mengubah status.') }
  }
  if (orders.length === 0) return <p className="card">Belum ada pesanan.</p>
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="card">
          <div className="flex justify-between flex-wrap gap-2">
            <div><b>{o.customer_name}</b> · {o.customer_whatsapp}<br /><span className="text-sm text-gray-500">{o.address}</span></div>
            <div className="text-right"><div className="font-bold">{rupiah(Number(o.total))}</div><div className="text-xs text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : ''}</div></div>
          </div>
          <div className="text-sm mt-2">
            {o.items.map((it, i) => <div key={i}>- {it.name} {[it.size, it.color].filter(Boolean).join(' / ')} x{it.qty} = {rupiah(it.price * it.qty)}</div>)}
            {o.note && <div className="text-gray-500">Catatan: {o.note}</div>}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <select className="input !w-auto" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <a className="underline text-sm" target="_blank" rel="noreferrer" href={`https://wa.me/${o.customer_whatsapp.replace(/[^0-9]/g, '')}`}>Hubungi pelanggan via WhatsApp</a>
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
    <form onSubmit={save} className="card space-y-4 max-w-2xl">
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
  )
}
