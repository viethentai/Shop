-- Chạy một lần trong Supabase SQL Editor để bật tải ảnh sản phẩm từ máy tính.
-- Bucket public giúp website khách hàng xem ảnh sản phẩm bằng URL công khai.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Chỉ tài khoản có app_metadata.role = 'admin' mới được tải ảnh lên.
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_store_admin());

-- Chỉ Admin được thay thế/cập nhật ảnh.
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_store_admin())
with check (bucket_id = 'product-images' and public.is_store_admin());

-- Chỉ Admin được xóa ảnh.
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_store_admin());
