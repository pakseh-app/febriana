-- JALANKAN DI SUPABASE > SQL EDITOR > NEW QUERY > RUN (sekali saja)
--
-- MASALAH: angka "Terjual" dihitung di browser dari tabel orders.
-- Pengunjung (anon) TIDAK BOLEH membaca tabel orders (isinya nama, nomor WA,
-- dan alamat pelanggan) — jadi di HP yang tidak login, orders gagal dibaca
-- dan Terjual jadi 0. Di PC kamu yang login sebagai admin, orders terbaca,
-- jadi Terjual tampil 2.
--
-- PERBAIKAN: fungsi ini hanya mengembalikan JUMLAH terjual per produk
-- (product_id + sold) dari pesanan yang sudah disetujui admin, TANPA
-- data pelanggan sama sekali. Aman dibuka untuk pengunjung.
create or replace function public.sold_counts()
returns table(product_id uuid, sold bigint)
language sql
security definer
stable
set search_path = public
as $$
  select (item ->> 'product_id')::uuid as product_id,
         sum((item ->> 'qty')::int) as sold
  from orders,
       jsonb_array_elements(items) as item
  where status in ('Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Selesai')
  group by 1;
$$;

grant execute on function public.sold_counts() to anon, authenticated;
