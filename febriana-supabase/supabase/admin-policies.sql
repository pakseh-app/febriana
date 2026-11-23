-- JALANKAN DI SUPABASE > SQL EDITOR > NEW QUERY > RUN
-- (sekali saja, setelah tabel dibuat)
--
-- KENAPA FILE INI PERLU:
-- Langkah RLS yang sudah kamu jalankan hanya mengizinkan pengunjung
-- MEMBACA produk/kategori aktif dan MEMBUAT pesanan. Tanpa policy di bawah
-- ini, admin yang login pun TIDAK BISA menambah/edit produk, mengubah
-- status pesanan, atau menyimpan pengaturan toko — dashboard akan gagal
-- simpan dengan error "new row violates row-level security policy".
-- Policy ini mengizinkan SEMUA perubahan hanya untuk user yang login
-- (authenticated), yaitu akun admin yang dibuat di Authentication > Users.

-- 1) Admin (login) boleh tulis di semua tabel toko
create policy "admin tulis kategori" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin tulis produk" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin baca & ubah pesanan" on orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin tulis pengaturan" on settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2) Admin (login) boleh upload / hapus foto di Storage.
--    Bucket sudah public, jadi foto tetap bisa dilihat pengunjung tanpa login.
create policy "admin upload product-images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "admin hapus product-images" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "admin upload store-assets" on storage.objects
  for insert with check (bucket_id = 'store-assets' and auth.role() = 'authenticated');
create policy "admin hapus store-assets" on storage.objects
  for delete using (bucket_id = 'store-assets' and auth.role() = 'authenticated');
