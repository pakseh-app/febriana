import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import { SocialCards, WhatsAppButton } from '../components/SocialIcons'

const FEATURES = [
  { title: 'Nyaman Dipakai', desc: 'Bahan dipilih, adem dan tidak gerah untuk sehari-hari.' },
  { title: 'Harga Terjangkau', desc: 'Model elegan tanpa bikin kantong bolong.' },
  { title: 'Pesan via WhatsApp', desc: 'Checkout gampang, admin fast respon.' },
]

export default function Home() {
  const { products, categories, loading, settings, soldCounts, configured, whatsapp, storeName } = useStore()
  const best = [...products].sort((a, b) => (soldCounts[b.id] ?? 0) - (soldCounts[a.id] ?? 0)).slice(0, 4)
  const newest = products.slice(0, 8)
  const recent = (() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('febriana-recent') || '[]')
      return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is typeof products[number] => Boolean(p)).slice(0, 4)
    } catch { return [] }
  })()
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-beige via-cream to-sand p-8 md:p-12">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-gold/20" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-white/50" aria-hidden="true" />
        <div className="relative">
          {settings?.banner_url && <img src={settings.banner_url} alt="Banner" className="w-full h-48 md:h-64 object-cover rounded-2xl mb-8 shadow-sm" />}
          <span className="inline-block bg-ink text-white text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5">Koleksi Baru • Harga Bersahabat</span>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mt-4">{settings?.store_name || 'FEBRIANA'}</h1>
          <p className="mt-3 text-gray-600 max-w-xl text-base md:text-lg">{settings?.tagline || 'Pakaian pilihan untuk hari-harimu — nyaman, elegan, dan terjangkau.'}</p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/katalog" className="btn-primary inline-block">Belanja Sekarang</Link>
            <Link to="/katalog" className="btn-outline inline-block bg-white/70">Lihat Katalog</Link>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-6 text-sm text-gray-500">
            <span>✓ Gratis tanya-tanya dulu</span>
            <span>✓ Stok asli, update terus</span>
            <span>✓ Pesan langsung via WhatsApp</span>
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="card text-center">
            <h3 className="font-display font-bold text-lg">{f.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Kategori */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">Belanja berdasarkan Kategori</h2>
            <Link to="/katalog" className="text-sm text-gold font-medium">Lihat Semua ›</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.id} to="/katalog" className="bg-white border border-sand rounded-full px-5 py-2.5 text-sm font-medium hover:bg-beige hover:border-gold transition">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p>Memuat produk…</p>
      ) : !configured ? (
        <p className="card">Hubungkan Supabase dulu (lihat README) — setelah itu produk yang kamu isi di dashboard admin akan tampil di sini.</p>
      ) : products.length === 0 ? (
        <div className="card text-center py-10">
          <p className="font-display text-xl font-bold">Katalog masih kosong</p>
          <p className="text-sm text-gray-600 mt-1">Produk akan tampil di sini setelah diisi lewat dashboard admin.</p>
          <Link to="/katalog" className="btn-primary inline-block mt-5">Lihat Katalog</Link>
        </div>
      ) : (
        <>
          {best.some((p) => (soldCounts[p.id] ?? 0) > 0) && (
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-2xl font-bold">Terlaris</h2>
                <Link to="/katalog" className="text-sm text-gold font-medium">Lihat Semua ›</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {best.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">Produk Terbaru</h2>
              <Link to="/katalog" className="text-sm text-gold font-medium">Lihat Semua ›</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newest.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        </>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">Terakhir Kamu Lihat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recent.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* CTA + sosmed */}
      <section className="rounded-3xl bg-ink text-white p-8 md:p-10">
        <h2 className="font-display text-2xl md:text-3xl font-bold">Belum menemukan yang dicari?</h2>
        <p className="text-white/70 mt-2 max-w-xl">Tanya stok, ukuran, atau model lain langsung ke admin. Bisa juga intip koleksi terbaru di sosmed kami.</p>
        <div className="mt-6">
          <WhatsAppButton whatsapp={whatsapp} storeName={storeName} label="Chat Admin via WhatsApp" />
        </div>
        <div className="mt-8">
          <p className="text-sm text-white/50 mb-3">Ikuti kami di</p>
          <SocialCards settings={settings} storeName={storeName} />
        </div>
      </section>
    </div>
  )
}
