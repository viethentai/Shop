-- KHO BÁU NHỎ: chạy toàn bộ file này trong Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id bigint primary key,
  name text not null check (length(name) between 1 and 160),
  category text not null,
  price integer not null check (price >= 0),
  emoji text not null default '🛍️',
  bg text not null default '#ffe1e9',
  image text,
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Nâng cấp database cũ: thêm danh sách nhiều ảnh và chuyển ảnh đơn hiện có sang danh sách.
alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;
update public.products set images = jsonb_build_array(image) where image is not null and images = '[]'::jsonb;

create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  store_name text not null default 'KHO BÁU NHỎ',
  zalo_phone text not null default '0358259044',
  updated_at timestamptz not null default now()
);
insert into public.store_settings(id) values(true) on conflict(id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  note text not null default '',
  items jsonb not null,
  total bigint not null check(total >= 0),
  status text not null default 'pending' check(status in ('pending','confirmed','preparing','shipping','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_code_idx on public.orders(order_code);

alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;

-- Chỉ tài khoản được gán app_metadata.role = 'admin' mới có quyền quản trị.
create or replace function public.is_store_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to authenticated;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated using(active);
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated using(public.is_store_admin()) with check(public.is_store_admin());
drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings" on public.store_settings for select to anon, authenticated using(true);
drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings" on public.store_settings for all to authenticated using(public.is_store_admin()) with check(public.is_store_admin());
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders for all to authenticated using(public.is_store_admin()) with check(public.is_store_admin());

-- Tạo đơn qua RPC: client không được INSERT trực tiếp vào bảng orders.
create or replace function public.random_order_suffix() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random()*32)::int, 1), '')
  from generate_series(1,12);
$$;

create or replace function public.create_store_order(p_customer jsonb, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_total bigint := 0;
  v_item jsonb;
  v_qty integer;
  v_price integer;
  v_name text;
  v_order public.orders;
  v_clean_items jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_customer) <> 'object' or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Dữ liệu đơn hàng không hợp lệ';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Giỏ hàng không hợp lệ';
  end if;
  if length(trim(coalesce(p_customer->>'name',''))) not between 1 and 50
     or trim(coalesce(p_customer->>'phone','')) !~ '^0[0-9]{9,11}$'
     or length(trim(coalesce(p_customer->>'address',''))) not between 1 and 1000
     or length(coalesce(p_customer->>'note','')) > 10000 then
    raise exception 'Thông tin khách hàng không hợp lệ';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::integer;
    v_price := (v_item->>'price')::integer;
    v_name := trim(coalesce(v_item->>'name',''));
    if v_qty < 1 or v_qty > 20 or v_price < 0 or v_price > 100000000 or length(v_name) not between 1 and 160 then
      raise exception 'Sản phẩm trong đơn không hợp lệ';
    end if;
    v_total := v_total + (v_qty::bigint * v_price::bigint);
    v_clean_items := v_clean_items || jsonb_build_array(jsonb_build_object(
      'name',v_name,'price',v_price,'qty',v_qty,
      'detail',left(coalesce(v_item->>'detail',''),500),
      'emoji',left(coalesce(v_item->>'emoji','🛍️'),8)
    ));
  end loop;
  if v_total > 1000000000 then raise exception 'Tổng đơn hàng vượt giới hạn'; end if;
  v_code := 'KBN-' || to_char(now() at time zone 'Asia/Ho_Chi_Minh','YYYYMMDD') || '-' || public.random_order_suffix();
  insert into public.orders(order_code,customer_name,phone,address,note,items,total)
  values(v_code,trim(p_customer->>'name'),trim(p_customer->>'phone'),trim(p_customer->>'address'),left(coalesce(p_customer->>'note',''),10000),v_clean_items,v_total)
  returning * into v_order;
  return jsonb_build_object('order_code',v_order.order_code,'total',v_order.total,'created_at',v_order.created_at);
end; $$;
revoke all on function public.create_store_order(jsonb,jsonb) from public;
grant execute on function public.create_store_order(jsonb,jsonb) to anon, authenticated;

-- Tra cứu công khai chỉ trả thông tin cần thiết, KHÔNG trả tên/sđt/địa chỉ/ghi chú.
create or replace function public.lookup_store_order(p_order_code text)
returns jsonb language sql security definer set search_path = public as $$
  select case when o.id is null then null else jsonb_build_object(
    'order_code',o.order_code,'status',o.status,'total',o.total,
    'items',o.items,'created_at',o.created_at,'updated_at',o.updated_at
  ) end
  from (select upper(trim(coalesce(p_order_code,''))) as code) q
  left join public.orders o on o.order_code=q.code
  limit 1;
$$;
revoke all on function public.lookup_store_order(text) from public;
grant execute on function public.lookup_store_order(text) to anon, authenticated;

-- Ghi nhận thời điểm cập nhật trạng thái.
create or replace function public.touch_order_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.touch_order_updated_at();

-- Seed 50 sản phẩm mặc định; không ghi đè sản phẩm đã được shop chỉnh sửa.
insert into public.products(id,name,category,price,emoji,bg,active) values(1,'Áo thun cherry','Áo',159000,'👚','#ffe0e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(2,'Áo baby tee pastel','Áo',149000,'👕','#e9ddff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(3,'Áo croptop nơ','Áo',179000,'🎀','#ffe9c9',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(4,'Áo sơ mi oversize','Áo',229000,'👔','#dff2eb',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(5,'Áo len cardigan','Áo',289000,'🧥','#f7dfd7',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(6,'Áo hai dây hoa','Áo',139000,'🌸','#ffe1ed',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(7,'Áo polo cute','Áo',189000,'👕','#e1edff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(8,'Áo hoodie mèo','Áo',329000,'🐱','#e8ddff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(9,'Áo blouse tay phồng','Áo',249000,'👚','#ffebd6',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(10,'Áo sweater chữ','Áo',279000,'🧶','#dff4e9',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(11,'Quần jean ống rộng','Quần & váy',329000,'👖','#dce9ff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(12,'Chân váy tennis','Quần & váy',219000,'👗','#ffe0e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(13,'Váy hoa nhí','Quần & váy',359000,'🌷','#f9e4ec',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(14,'Quần short kaki','Quần & váy',199000,'🩳','#fff0cf',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(15,'Chân váy chữ A','Quần & váy',239000,'👗','#e8ddff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(16,'Quần suông basic','Quần & váy',289000,'👖','#e4eee8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(17,'Váy babydoll','Quần & váy',339000,'🎀','#ffe1e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(18,'Quần cargo','Quần & váy',319000,'👖','#e4e8d9',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(19,'Chân váy denim','Quần & váy',259000,'👗','#dceaff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(20,'Váy yếm cute','Quần & váy',319000,'🌼','#ffedcf',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(21,'Túi tote pastel','Túi',129000,'👜','#ffe5d9',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(22,'Túi đeo chéo mini','Túi',249000,'👛','#e9ddff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(23,'Túi kẹp nách','Túi',279000,'👜','#ffe0e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(24,'Balo mini','Túi',299000,'🎒','#dff3e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(25,'Túi canvas hoa','Túi',159000,'🌸','#fff0ce',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(26,'Ví mini trái tim','Túi',119000,'💗','#ffe0ed',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(27,'Túi baguette','Túi',269000,'👜','#e4eaff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(28,'Túi đeo vai','Túi',239000,'🛍️','#e7f3e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(29,'Túi lưới đi chơi','Túi',99000,'🧺','#ffebd6',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(30,'Túi charm bear','Túi',189000,'🧸','#f4e1ff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(31,'Kẹp tóc nơ','Phụ kiện',39000,'🎀','#ffe1e9',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(32,'Băng đô hoa','Phụ kiện',49000,'🌼','#fff0c9',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(33,'Vòng cổ trái tim','Phụ kiện',89000,'💖','#ffe0e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(34,'Khuyên tai ngọc','Phụ kiện',79000,'✨','#eee5ff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(35,'Tất cổ ngắn','Phụ kiện',35000,'🧦','#e4f4eb',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(36,'Mũ bucket','Phụ kiện',119000,'🧢','#ffebd7',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(37,'Thắt lưng basic','Phụ kiện',99000,'〰️','#e5eaff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(38,'Kính gọng màu','Phụ kiện',129000,'👓','#ffe0e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(39,'Scrunchie set 3','Phụ kiện',59000,'🎗️','#f4e2ff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(40,'Charm điện thoại','Phụ kiện',69000,'📿','#e2f3e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(41,'Dây chuyền layer','Phụ kiện',139000,'📿','#fff0d5',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(42,'Kẹp càng cua','Phụ kiện',45000,'🦋','#ffe0ed',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(43,'Túi đựng mỹ phẩm','Túi',149000,'🧴','#e9e1ff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(44,'Áo khoác denim','Áo',399000,'🧥','#dceaff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(45,'Quần legging','Quần & váy',169000,'🩰','#f8e0e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(46,'Váy maxi pastel','Quần & váy',429000,'🌺','#ffe9d7',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(47,'Khăn bandana','Phụ kiện',59000,'🧣','#e3f3e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(48,'Túi đeo hạt cườm','Túi',219000,'🪩','#f3e2ff',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(49,'Áo tank top','Áo',119000,'👚','#ffe0e8',true) on conflict(id) do nothing;
insert into public.products(id,name,category,price,emoji,bg,active) values(50,'Chân váy xếp ly','Quần & váy',249000,'🌸','#e8e2ff',true) on conflict(id) do nothing;

-- Làm mới schema cache của PostgREST để API nhận cột images ngay (tránh lỗi "could not find the 'images' column ... in the schema cache").

-- ===== Set mix sẵn (admin quản lý) =====
create table if not exists public.mix_sets (
  id bigint generated by default as identity primary key,
  name text not null check (length(name) between 1 and 120),
  description text not null default '' check (length(description) <= 300),
  tag text not null default '' check (length(tag) <= 30),
  emoji text not null default '🎀' check (length(emoji) <= 8),
  bg text not null default '#edeae7' check (bg ~ '^#[0-9A-Fa-f]{6}$'),
  price bigint not null check (price >= 0),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 30),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mix_sets enable row level security;

drop policy if exists "Public can read active mix sets" on public.mix_sets;
create policy "Public can read active mix sets" on public.mix_sets for select to anon, authenticated using(active);

drop policy if exists "Admins manage mix sets" on public.mix_sets;
create policy "Admins manage mix sets" on public.mix_sets for all to authenticated using(public.is_store_admin()) with check(public.is_store_admin());

insert into public.mix_sets(id,name,description,tag,emoji,bg,price,items,sort_order,active) values
(1,'Set nàng thơ pastel','Áo baby tee + chân váy + kẹp nơ','BEST SELLER','🧚','#f3f2f0',359000,'[2,15,31]',1,true),
(2,'Set dạo phố năng động','Áo thun + quần jean + túi tote','COOL GIRL','🛼','#f3f1ef',549000,'[1,11,21]',2,true),
(3,'Set picnic đáng yêu','Váy hoa + túi mini + băng đô','JUST CUTE','🌷','#edeae7',579000,'[13,22,32]',3,true)
on conflict(id) do nothing;

-- Đồng bộ lại bộ đếm id sau khi chèn id thủ công
select setval(pg_get_serial_sequence('public.mix_sets','id'), (select max(id) from public.mix_sets));

-- Đổi tên cửa hàng cũ sang tên mới (chỉ khi còn tên mặc định cũ)
update public.store_settings set store_name = 'KHO BÁU NHỎ' where id = true and store_name = 'kẹo closet';

notify pgrst, 'reload schema';
