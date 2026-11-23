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
    // Logo TikTok asli (bukan not musik biasa): bentuk "d" khas TikTok.
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
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
