import { socialHandle, socialUrl, waLink } from '../lib/format'
import type { Settings } from '../lib/types'

export type Platform = 'whatsapp' | 'shopee' | 'instagram' | 'tiktok' | 'facebook'

export const PLATFORM_META: Record<Platform, { label: string; bg: string; note: string }> = {
  whatsapp: { label: 'WhatsApp', bg: '#25D366', note: 'Chat admin, fast respon' },
  shopee: { label: 'Shopee', bg: '#EE4D2D', note: 'Belanja di Shopee' },
  instagram: { label: 'Instagram', bg: 'linear-gradient(45deg, #F9CE34, #EE2A7B, #6228D7)', note: 'Lihat koleksi terbaru' },
  tiktok: { label: 'TikTok', bg: '#000000', note: 'Video & live shopping' },
  facebook: { label: 'Facebook', bg: '#1877F2', note: 'Ikuti halaman kami' },
}

function IconSvg({ platform, size = 20 }: { platform: Platform; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (platform === 'whatsapp') {
    return (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  }
  if (platform === 'instagram') {
    return (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  }
  if (platform === 'tiktok') {
    return (
      <svg {...common}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    )
  }
  if (platform === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <text x="12" y="18" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#fff" fontFamily="Georgia, serif">f</text>
      </svg>
    )
  }
  // shopee
  return (
    <svg {...common}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

/** Ikon bulat bermerek untuk satu platform. */
export function SocialIcon({ platform, size = 44, iconSize = 20 }: { platform: Platform; size?: number; iconSize?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0 shadow-sm"
      style={{ width: size, height: size, background: PLATFORM_META[platform].bg }}
      aria-hidden="true"
    >
      <IconSvg platform={platform} size={iconSize} />
    </span>
  )
}

export type SocialLink = { platform: Exclude<Platform, 'whatsapp'>; value: string }

/** Daftar link sosmed dari Pengaturan Toko (yang kosong tidak tampil). */
export function socialLinksFromSettings(settings: Settings | null | undefined): SocialLink[] {
  const out: SocialLink[] = []
  if (settings?.shopee_url) out.push({ platform: 'shopee', value: settings.shopee_url })
  if (settings?.instagram_url) out.push({ platform: 'instagram', value: settings.instagram_url })
  if (settings?.tiktok_url) out.push({ platform: 'tiktok', value: settings.tiktok_url })
  if (settings?.facebook_url) out.push({ platform: 'facebook', value: settings.facebook_url })
  return out
}

/** Kartu-kartu sosmed berikon: nama platform + handle, bukan link mentah. */
export function SocialCards({ settings, storeName }: { settings: Settings | null | undefined; storeName: string }) {
  const links = socialLinksFromSettings(settings)
  if (links.length === 0) {
    return <p className="text-sm text-gray-500">Link Shopee / Instagram / TikTok / Facebook bisa diisi admin di Pengaturan Toko.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {links.map((l) => (
        <a
          key={l.platform}
          href={socialUrl(l.platform, l.value)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 bg-white border border-beige rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition"
        >
          <SocialIcon platform={l.platform} />
          <span className="min-w-0">
            <span className="block font-semibold">{PLATFORM_META[l.platform].label}</span>
            <span className="block text-sm text-gray-500 truncate">{socialHandle(l.platform, l.value)}</span>
            <span className="block text-xs text-gray-400 mt-0.5">{PLATFORM_META[l.platform].note}</span>
          </span>
          <span className="ml-auto text-gray-300 text-xl" aria-hidden="true">›</span>
        </a>
      ))}
    </div>
  )
}

/** Tombol WhatsApp berikon (dipakai di Kontak & Beranda). */
export function WhatsAppButton({ whatsapp, storeName, label = 'Chat WhatsApp' }: { whatsapp: string; storeName: string; label?: string }) {
  return (
    <a
      href={waLink(whatsapp, `Halo Admin ${storeName}, saya ingin bertanya mengenai produk yang tersedia.`)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-full font-medium shadow-md hover:opacity-90"
    >
      <IconSvg platform="whatsapp" size={20} />
      {label}
    </a>
  )
}
