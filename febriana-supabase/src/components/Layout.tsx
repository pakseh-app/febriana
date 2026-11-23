import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { prettyPhone, socialUrl, waLink } from '../lib/format'
import { SocialIcon, socialLinksFromSettings } from './SocialIcons'

export default function Layout() {
  const { cart, settings, whatsapp, storeName, configured } = useStore()
  const navigate = useNavigate()
  const count = cart.reduce((n, l) => n + l.qty, 0)
  const logo = settings?.logo_url
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-beige">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {logo && <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />}
            <span className="font-display text-xl tracking-widest font-bold">{storeName}</span>
          </Link>
          <nav className="hidden md:flex gap-5 ml-6 text-sm">
            <NavLink to="/" className="hover:text-gold">Beranda</NavLink>
            <NavLink to="/katalog" className="hover:text-gold">Katalog</NavLink>
            <NavLink to="/tentang" className="hover:text-gold">Tentang</NavLink>
            <NavLink to="/kontak" className="hover:text-gold">Kontak</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate('/keranjang')} className="relative border border-ink rounded-full px-4 py-2 text-sm">
              Keranjang {count > 0 && <span className="absolute -top-2 -right-2 bg-gold text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{count}</span>}
            </button>
          </div>
        </div>
        <nav className="md:hidden flex gap-5 px-4 pb-2 text-sm overflow-x-auto">
          <NavLink to="/" className="hover:text-gold">Beranda</NavLink>
          <NavLink to="/katalog" className="hover:text-gold">Katalog</NavLink>
          <NavLink to="/tentang" className="hover:text-gold">Tentang</NavLink>
          <NavLink to="/kontak" className="hover:text-gold">Kontak</NavLink>
        </nav>
      </header>
      {!configured && (
        <div className="bg-amber-100 text-amber-900 text-sm px-4 py-2 text-center">
          Supabase belum dikonfigurasi — salin .env.example menjadi .env lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY. Lihat README.
        </div>
      )}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-ink text-white mt-10">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 justify-between">
          <div>
            <div className="font-display text-xl tracking-widest font-bold">{storeName}</div>
            <p className="text-white/70 text-sm mt-1">{settings?.tagline || 'Toko pakaian online.'}</p>
          </div>
          <div className="text-sm text-white/80 space-y-3">
            <div><Link to="/tentang" className="underline">Tentang Kami</Link> · <Link to="/kontak" className="underline">Kontak</Link> · <Link to="/admin" className="underline">Login Admin</Link></div>
            <div className="flex items-center gap-2">
              <a href={waLink(whatsapp, `Halo Admin ${storeName}, saya ingin bertanya mengenai produk yang tersedia.`)} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <SocialIcon platform="whatsapp" size={36} iconSize={17} />
              </a>
              {socialLinksFromSettings(settings).map((l) => (
                <a key={l.platform} href={socialUrl(l.platform, l.value)} target="_blank" rel="noreferrer" aria-label={l.platform}>
                  <SocialIcon platform={l.platform} size={36} iconSize={17} />
                </a>
              ))}
            </div>
            <div className="text-white/60 text-xs">WhatsApp: {prettyPhone(whatsapp)}</div>
          </div>
        </div>
      </footer>
      <a
        href={waLink(whatsapp, `Halo Admin ${storeName}, saya ingin bertanya mengenai produk yang tersedia.`)}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 bg-[#25D366] text-white rounded-full px-5 py-3 shadow-lg text-sm font-medium inline-flex items-center gap-2"
      >
        <SocialIcon platform="whatsapp" size={22} iconSize={13} />
        Chat WhatsApp
      </a>
    </div>
  )
}
