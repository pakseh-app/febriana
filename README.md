# FEBRIANA — Toko Pakaian (React + Vite + Supabase)

Toko online pakaian FEBRIANA — versi source code untuk di-deploy ke GitHub Pages,
terhubung ke Supabase yang sudah kamu siapkan (bukan versi yang jalan di dalam Muse).

## Yang sudah jadi di project ini

- **Storefront:** Beranda (banner, Terlaris, Terbaru), Katalog (cari + filter kategori),
  Detail produk (galeri, ukuran, warna, stok), Keranjang, Wishlist (tersimpan di browser).
- **Checkout WhatsApp:** form nama / WA / alamat / catatan → pesanan **disimpan dulu**
  ke tabel `orders` dengan status `Menunggu Konfirmasi` → WhatsApp admin terbuka
  dengan pesan otomatis terisi (nama, alamat, daftar produk, ukuran/warna, jumlah,
  harga satuan, subtotal, total, catatan). Nomor admin: **+62 856-0032-7769**
  (`6285600327769`), bisa diubah di Pengaturan Toko.
- **Dashboard admin `/admin`:** login Supabase Auth (email + password), Overview
  (total produk/pesanan/kategori, pendapatan, produk terlaris), Produk (tambah/edit/
  hapus, upload foto ke bucket `product-images`), Kategori, Pesanan (ubah status,
  hubungi pelanggan via WhatsApp), Pengaturan Toko (nama, logo + banner ke bucket
  `store-assets`, nomor WA, link Shopee/Instagram/TikTok/Facebook — opsional).
- **Aturan "Terjual":** angka Terjual hanya dihitung dari pesanan yang sudah disetujui
  admin (`Menunggu Pembayaran`, `Diproses`, `Dikirim`, `Selesai`). Pesanan yang masih
  `Menunggu Konfirmasi` atau `Dibatalkan` tidak dihitung; kalau pesanan yang sudah
  disetujui dibatalkan, angkanya berkurang lagi.
- **Desain:** premium cream/beige/putih/hitam, mobile-first, Bahasa Indonesia.
- **Tanpa data dummy:** katalog mulai kosong — produk diisi lewat dashboard admin.

## Langkah 1 — Isi `.env` (kunci API Supabase)

```bash
cp .env.example .env
```

Buka Supabase → **Project Settings** (ikon gear kiri bawah) → **API**, salin:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

> Di tampilan Supabase terbaru, anon key kadang tertulis **"publishable key"** —
> itu kunci yang sama, pakai yang itu. Jangan pernah isi **service_role key**
> di `.env` — itu rahasia dan tidak dipakai frontend.

## Langkah 2 — Jalankan policy admin (WAJIB, sekali saja)

Policy RLS yang sudah dibuat sebelumnya hanya mengizinkan pengunjung membaca
produk dan membuat pesanan. Tanpa langkah ini, admin yang login pun **tidak bisa
menyimpan produk/pesanan/pengaturan** (error row-level security).

Buka Supabase → **SQL Editor** → **New query**, tempel isi file
`supabase/admin-policies.sql`, klik **Run**.

## Langkah 3 — Jalankan di laptop

```bash
npm install
npm run dev     # buka http://localhost:5173
npm run build   # cek hasil build di folder dist/
```

## Langkah 4 — Deploy ke GitHub Pages

1. Buat repo baru di GitHub (misalnya `febriana`), lalu:
   ```bash
   git init && git add . && git commit -m "FEBRIANA toko online"
   git branch -M main
   git remote add origin https://github.com/<username>/febriana.git
   git push -u origin main
   ```
2. Di repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**,
   tambahkan dua secret ini (nilainya sama seperti di `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Di repo GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Push apa pun ke branch `main` — workflow `.github/workflows/deploy.yml` akan
   build lalu deploy otomatis. Alamatnya: `https://<username>.github.io/febriana/`.

## Langkah 5 — Uji sebelum jualan (1 menit)

1. Buka situs hasil deploy, tambah 1 produk lewat `/admin`, lalu checkout sebagai
   pembeli dan pastikan WhatsApp terbuka ke **+62 856-0032-7769** dengan pesan
   pesanan yang benar.
2. Di `/admin` → Pesanan, ubah status dari `Menunggu Konfirmasi` ke
   `Menunggu Pembayaran` dan pastikan angka **Terjual** produk itu baru bertambah
   setelah status diubah (bukan saat checkout).

## Struktur tabel Supabase (sudah dibuat)

`categories`, `products`, `orders`, `settings` (baris `id = 1`, kolom `whatsapp`
default `6285600327769`), bucket Storage `product-images` dan `store-assets`
(keduanya public).
