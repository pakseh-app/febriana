export function rupiah(n: number): string {
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

export function waLink(phone: string, text: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function buildOrderMessage(
  storeName: string,
  order: { customer_name: string; customer_whatsapp: string; address: string; items: { name: string; size?: string; color?: string; qty: number; price: number }[]; total: number; note?: string | null },
): string {
  const lines: string[] = []
  lines.push(`Halo Admin ${storeName}, saya ingin memesan:`)
  lines.push('')
  lines.push(`Nama: ${order.customer_name}`)
  lines.push(`WhatsApp: ${order.customer_whatsapp}`)
  lines.push(`Alamat: ${order.address}`)
  lines.push('')
  lines.push('Pesanan:')
  for (const it of order.items) {
    const variant = [it.size, it.color].filter(Boolean).join(' / ')
    lines.push(`- ${it.name}${variant ? ` (${variant})` : ''} x${it.qty} @ ${rupiah(it.price)} = ${rupiah(it.price * it.qty)}`)
  }
  lines.push('')
  lines.push(`Total: ${rupiah(order.total)}`)
  if (order.note) lines.push(`Catatan: ${order.note}`)
  return lines.join('\n')
}

/** Nomor WA tampil cantik: 6285600327769 -> +62 856-0032-7769 */
export function prettyPhone(phone: string): string {
  const d = phone.replace(/[^0-9]/g, '')
  const local = d.startsWith('62') ? d.slice(2) : d.startsWith('0') ? d.slice(1) : d
  const groups = local.match(/.{1,4}/g) || []
  return `+62 ${groups.join('-')}`
}

/** Ambil handle dari link/username: "https://tiktok.com/@pakseh10" -> "@pakseh10" */
export function socialHandle(platform: 'shopee' | 'instagram' | 'tiktok' | 'facebook', value: string): string {
  const v = value.trim()
  if (/^https?:\/\//i.test(v)) {
    const handle = v.replace(/\/+$/, '').split('/').pop() || v
    return platform === 'tiktok' ? `@${handle.replace(/^@/, '')}` : handle
  }
  return platform === 'tiktok' ? `@${v.replace(/^@/, '')}` : v
}

export function socialUrl(platform: 'shopee' | 'instagram' | 'tiktok' | 'facebook', value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  const handle = value.replace(/^@/, '')
  const base: Record<string, string> = {
    shopee: 'https://shopee.co.id/',
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/@',
    facebook: 'https://facebook.com/',
  }
  return base[platform] + handle
}
