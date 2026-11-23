-- Harga berbeda per ukuran, misal daster: S = Rp20.000, XL = Rp35.000.
-- Jalankan SEKALI di Supabase > SQL Editor > New query > paste > Run.
-- Kolom baru: size_prices (jsonb), contoh isi:
--   {"S": {"price": 20000, "discount_price": null}, "XL": {"price": 35000, "discount_price": 30000}}
-- Kalau sebuah ukuran tidak ada di size_prices, website memakai harga
-- dasar produk (price / discount_price) seperti sebelumnya.

alter table public.products
  add column if not exists size_prices jsonb not null default '{}'::jsonb;

-- Isi awal untuk produk yang sudah ada: setiap ukuran yang sudah
-- terdaftar memakai harga dasar produk yang sekarang.
update public.products
set size_prices = (
  select coalesce(
    jsonb_object_agg(
      s,
      jsonb_build_object(
        'price', products.price,
        'discount_price', products.discount_price
      )
    ),
    '{}'::jsonb
  )
  from unnest(products.sizes) as s
)
where size_prices = '{}'::jsonb and cardinality(products.sizes) > 0;
