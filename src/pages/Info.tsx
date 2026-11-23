import { useStore } from '../context/StoreContext'
import { prettyPhone } from '../lib/format'
import { SocialCards, SocialIcon, WhatsAppButton } from '../components/SocialIcons'

export function About() {
  const { settings, storeName } = useStore()
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-4">Tentang Kami</h1>
      <p className="text-gray-700 whitespace-pre-line">{settings?.about || `${storeName} adalah toko pakaian online. Kami memilih bahan yang nyaman dan model yang elegan untuk dipakai sehari-hari.`}</p>
    </div>
  )
}

export function Contact() {
  const { settings, whatsapp, storeName } = useStore()
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <span className="inline-block bg-beige text-ink text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5">Hubungi Kami</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">Kontak {storeName}</h1>
        <p className="text-gray-600 mt-2">Ada yang mau ditanyakan soal produk, stok, atau pesanan? Chat kami, admin fast respon.</p>
      </div>

      {/* WhatsApp */}
      <div className="rounded-3xl bg-[#25D366]/10 border border-[#25D366]/30 p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <SocialIcon platform="whatsapp" size={56} iconSize={26} />
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold">WhatsApp Admin</h2>
          <p className="text-sm text-gray-600 mt-0.5">Chat langsung, tanya-tanya dulu boleh banget.</p>
          <p className="text-sm font-medium mt-1">{prettyPhone(whatsapp)}</p>
        </div>
        <WhatsAppButton whatsapp={whatsapp} storeName={storeName} label="Chat Sekarang" />
      </div>

      {/* Sosmed */}
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">Ikuti Kami di Sosmed</h2>
        <p className="text-sm text-gray-500 mb-4">Koleksi terbaru, promo, dan live shopping — klik ikonnya.</p>
        <SocialCards settings={settings} storeName={storeName} />
      </div>

      <p className="text-xs text-gray-400 text-center">Jam layanan: setiap hari, 08.00–21.00 WIB</p>
    </div>
  )
}
