# KHO BÁU NHỎ — Storefront + Admin + Supabase

Website bán hàng frontend HTML/CSS/JavaScript, sử dụng Supabase Auth + PostgreSQL để lưu đơn hàng, sản phẩm và thông tin shop. Không cần build framework.

## 1. Cấu hình Supabase lần đầu

1. Tạo project tại https://supabase.com/.
2. Mở **Project Settings → API** và sao chép **Project URL** cùng **anon/public key**.
3. Mở `supabase-config.js`, thay `YOUR_PROJECT_ID` và `YOUR_SUPABASE_ANON_PUBLIC_KEY` bằng thông tin của project.
   - Chỉ dùng anon/public key ở frontend.
   - Tuyệt đối không đưa `service_role` hoặc secret key vào bất kỳ file JavaScript nào.
4. Vào **SQL Editor** trong Supabase, mở và chạy toàn bộ nội dung `database.sql`. Lệnh này tạo bảng, RLS, RPC và 50 sản phẩm mẫu. Nếu đã chạy trước đó, chạy lại để thêm cột `images` (nhiều ảnh cho mỗi sản phẩm).
5. Vào **SQL Editor**, mở file `storage-setup.sql` và chạy toàn bộ nội dung để tạo kho ảnh `product-images` cùng quyền tải ảnh dành riêng cho Admin.
6. Vào **Authentication → Providers → Email**, bật Email provider. Tắt **Allow new users to sign up** trong Authentication settings để người ngoài không tự đăng ký tài khoản.
7. Trong **Authentication → Users**, tạo tài khoản email/mật khẩu cho chủ shop.
8. Gán quyền admin cho đúng tài khoản vừa tạo bằng SQL Editor (thay email thật):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

9. Đăng xuất/đăng nhập lại ở `admin.html` để nhận JWT mới có quyền `role=admin`.

## 2. Chạy website

- Mở `index.html` để xem cửa hàng; hoặc chạy qua local web server (khuyên dùng), ví dụ VS Code Live Server.
- Nút **Admin** trên website mở `admin.html`.
- Admin đăng nhập bằng email/mật khẩu đã tạo trong Supabase Auth.
- Nên deploy toàn bộ thư mục này lên hosting tĩnh có HTTPS (Netlify, Vercel, Cloudflare Pages hoặc hosting riêng). Giữ nguyên các file cùng thư mục.

## 3. Các chức năng

### Khách hàng
- Xem, tìm kiếm, lọc sản phẩm; chọn set mix có sẵn; tự mix set; quản lý giỏ hàng.
- Đặt hàng tạo mã dạng `KBN-YYYYMMDD-XXXXXXXXXXXX` và lưu trực tiếp vào Supabase.
- Sau khi đặt thành công, khách thấy mã đơn, có thể sao chép và mở Zalo shop để gửi mã yêu cầu xác nhận.
- Tra cứu đơn bằng mã. Trang tra cứu công khai chỉ trả mã đơn, trạng thái, sản phẩm, tổng tiền và thời gian; không trả tên, số điện thoại, địa chỉ hoặc ghi chú khách hàng.

### Chủ shop (`admin.html`)
- Đăng nhập bằng Supabase Auth; quyền admin được kiểm tra bằng `app_metadata.role` và RLS ở database.
- Xem danh sách đơn, tìm theo mã/tên/số điện thoại, lọc trạng thái, xem thông tin khách và chi tiết đơn.
- Cập nhật trạng thái: Chờ shop xác nhận → Đã xác nhận → Đang chuẩn bị hàng → Đang giao hàng → Đã hoàn thành; hoặc Đã hủy.
- Chỉnh sửa sản phẩm, ẩn/hiện sản phẩm, tải nhiều ảnh cho mỗi sản phẩm lên Supabase Storage (sắp xếp thứ tự, xóa từng ảnh; ảnh đầu tiên là ảnh bìa), cập nhật tên shop và số Zalo.

## 4. Bảo mật và lưu ý

- RLS bật trên cả `orders`, `products`, `store_settings`. Chỉ user có `app_metadata.role = 'admin'` mới đọc/sửa dữ liệu quản trị.
- Khách không được đọc trực tiếp bảng `orders`; chỉ có thể gọi RPC tra cứu giới hạn dữ liệu. Mã đơn có phần ngẫu nhiên khó đoán.
- RPC tạo đơn kiểm tra thông tin khách, số lượng, giá trị và tính tổng từ các dòng sản phẩm gửi lên. Vì đây là website đặt hàng chưa thanh toán trực tuyến, chủ shop vẫn cần kiểm tra lại giá/tồn kho trước khi xác nhận.
- Mật khẩu admin không còn nằm trong mã nguồn. Không bật đăng ký công khai nếu website chỉ có một chủ shop.
- Sản phẩm trong giỏ được lưu LocalStorage trên thiết bị khách; đơn hàng sau khi gửi được lưu tập trung trên Supabase.
- Nút Zalo chỉ mở cuộc trò chuyện. Khách vẫn cần tự gửi mã đơn; website không tự gửi tin nhắn thay khách.
- Đây là bản frontend gọi Supabase trực tiếp, không có server riêng. Nếu sau này tích hợp thanh toán, tồn kho hoặc vận chuyển, nên bổ sung server-side validation/webhook tương ứng.

## 5. Cấu trúc tệp

- `index.html`, `style.css`, `app.js`: cửa hàng khách hàng.
- `admin.html`, `admin.css`, `admin.js`: trang quản trị riêng.
- `supabase-config.js`: Project URL và anon/public key.
- `database.sql`: schema, RLS, RPC, trigger và dữ liệu 50 sản phẩm mẫu.
- `storage-setup.sql`: tạo bucket ảnh sản phẩm và chính sách quyền tải ảnh lên/xóa ảnh.
