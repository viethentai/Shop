const config=window.KEO_SUPABASE_CONFIG||{};
const ready=Boolean(config.url&&config.anonKey&&!config.url.includes('YOUR_PROJECT')&&!config.anonKey.includes('YOUR_'));
const db=ready?window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('vi-VN').format(Number(n)||0)+'₫';
const labels={pending:'Chờ shop xác nhận',confirmed:'Đã xác nhận',preparing:'Đang chuẩn bị hàng',shipping:'Đang giao hàng',completed:'Đã hoàn thành',cancelled:'Đã hủy'};
const MAX_IMAGES=12;
const MAX_IMAGE_BYTES=5*1024*1024;
let orders=[];let selectedOrder=null;let products=[];let statusFilter='all';
// Ảnh đang chỉnh sửa của sản phẩm: {url} là ảnh đã lưu, {file,previewUrl} là ảnh mới chờ tải lên khi bấm Lưu
let editImages=[];

function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2500)}
function setError(id,msg){$(id).textContent=msg||''}
function isAdmin(user){return user?.app_metadata?.role==='admin'}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function productImagesOf(p){const list=Array.isArray(p.images)&&p.images.length?p.images:(p.image?[p.image]:[]);return list.filter(Boolean)}

function showDashboard(user){$('loginView').classList.add('hidden');$('dashboardView').classList.remove('hidden');$('logoutButton').classList.remove('hidden');$('adminEmail').textContent=user.email||'Quản trị viên';loadAll()}
async function verifySession(){if(!db){setError('loginError','Chưa cấu hình Supabase. Hãy hoàn tất supabase-config.js theo README.');return}const {data:{session}}=await db.auth.getSession();if(session){if(isAdmin(session.user))showDashboard(session.user);else{await db.auth.signOut();setError('loginError','Tài khoản này chưa được cấp quyền quản trị.')}}}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();if(!db)return setError('loginError','Chưa cấu hình Supabase.');const f=e.currentTarget;const email=f.elements.email.value.trim();const password=f.elements.password.value;const btn=f.querySelector('button');btn.disabled=true;setError('loginError','');try{const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;if(!isAdmin(data.user)){await db.auth.signOut();throw new Error('Tài khoản chưa được cấp quyền Admin.')}f.reset();showDashboard(data.user)}catch(err){setError('loginError',err.message||'Đăng nhập thất bại.')}finally{btn.disabled=false}});
$('logoutButton').onclick=async()=>{await db.auth.signOut();location.reload()};

async function loadAll(){await Promise.all([loadOrders(),loadProducts(),loadSettings()])}
async function loadOrders(){const {data,error}=await db.from('orders').select('*').order('created_at',{ascending:false}).limit(500);if(error){console.error(error);toast('Không tải được danh sách đơn hàng. Kiểm tra quyền Admin.');return}orders=data||[];renderOrders();renderStats()}
function renderStats(){$('statPending').textContent=orders.filter(o=>o.status==='pending').length;$('statProcessing').textContent=orders.filter(o=>['confirmed','preparing','shipping'].includes(o.status)).length;$('statCompleted').textContent=orders.filter(o=>o.status==='completed').length;$('statAll').textContent=orders.length}
function renderOrders(){document.querySelectorAll('#statusChips [data-status]').forEach(b=>b.classList.toggle('active',b.dataset.status===statusFilter));const list=orders.filter(o=>statusFilter==='all'||o.status===statusFilter);$('orderList').innerHTML=list.length?list.map(o=>`<button class="order-list-item ${selectedOrder?.id===o.id?'active':''}" data-order-id="${o.id}"><b>${o.order_code}</b><span>${escapeHtml(o.customer_name)} · ${new Date(o.created_at).toLocaleString('vi-VN')}</span><span>${labels[o.status]||o.status}</span><strong>${money(o.total)}</strong></button>`).join(''):'<p class="muted">Chưa có đơn hàng phù hợp.</p>'}
function renderOrderDetail(order){selectedOrder=order;renderOrders();const items=Array.isArray(order.items)?order.items:[];$('orderDetail').innerHTML=`<div class="detail-head"><div><span class="eyebrow">ORDER DETAIL</span><h3>${escapeHtml(order.order_code)}</h3></div><span class="status-pill status-${escapeHtml(order.status)}">${labels[order.status]||order.status}</span></div><div class="detail-meta"><div>Khách hàng: <b>${escapeHtml(order.customer_name)}</b></div><div>Số điện thoại: <b><a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a></b></div><div>Địa chỉ: <b>${escapeHtml(order.address)}</b></div><div>Ngày đặt: <b>${new Date(order.created_at).toLocaleString('vi-VN')}</b></div><div>Ghi chú: <b>${escapeHtml(order.note||'Không có')}</b></div></div><div class="detail-items">${items.map(i=>`<div><span>${escapeHtml(i.name)} × ${i.qty}${i.detail?' · '+escapeHtml(i.detail):''}</span><b>${money(Number(i.price)*Number(i.qty))}</b></div>`).join('')}</div><div class="detail-total"><span>Tổng đơn hàng</span><b>${money(order.total)}</b></div><div class="status-editor"><select id="newOrderStatus">${Object.entries(labels).map(([v,l])=>`<option value="${v}" ${order.status===v?'selected':''}>${l}</option>`).join('')}</select><button class="btn primary" id="saveOrderStatus">Cập nhật</button></div><p class="form-error" id="orderMessage"></p>`;$('saveOrderStatus').onclick=()=>updateOrderStatus(order.id)}
$('orderList').addEventListener('click',e=>{const b=e.target.closest('[data-order-id]');if(!b)return;const order=orders.find(o=>o.id===b.dataset.orderId);if(order)renderOrderDetail(order)});
async function updateOrderStatus(id){const status=$('newOrderStatus').value;const {data,error}=await db.from('orders').update({status}).eq('id',id).select().single();if(error){setError('orderMessage','Không thể cập nhật trạng thái.');console.error(error);return}orders=orders.map(o=>o.id===id?data:o);renderOrderDetail(data);renderStats();toast('Đã cập nhật trạng thái đơn hàng.')}
$('refreshOrders').onclick=loadOrders;$('statusChips').addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;statusFilter=b.dataset.status;renderOrders()});
$('adminLookupButton').onclick=async()=>{const code=$('adminOrderCode').value.trim().toUpperCase();if(!/^KEO-\d{8}-[A-F0-9]{12}$/.test(code)){toast('Mã đơn hàng chưa đúng định dạng.');return}const {data,error}=await db.from('orders').select('*').eq('order_code',code).maybeSingle();if(error){toast('Không thể tra cứu mã đơn.');return}if(!data){toast('Không tìm thấy đơn hàng.');return}if(!orders.some(o=>o.id===data.id))orders.unshift(data);renderOrderDetail(data);activateSection('orders');renderStats()};
function activateSection(name){document.querySelectorAll('.side-tab[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===name));document.querySelectorAll('.admin-section').forEach(s=>s.classList.toggle('hidden',s.id!==`section-${name}`))}
document.querySelectorAll('.side-tab[data-section]').forEach(b=>b.onclick=()=>activateSection(b.dataset.section));

async function loadProducts(){const {data,error}=await db.from('products').select('*').order('id');if(error){console.error(error);return}products=data||[];$('productSelect').innerHTML=products.map(p=>`<option value="${p.id}">${p.id}. ${escapeHtml(p.name)}${p.active?'':' (ẩn)'}</option>`).join('');if(products.length)fillProductForm(products[0])}

function revokePreviews(){editImages.forEach(e=>{if(e.previewUrl)URL.revokeObjectURL(e.previewUrl)})}
function fillProductForm(p){const f=$('productForm');revokePreviews();editImages=productImagesOf(p).map(url=>({url}));f.elements.id.value=p.id;f.elements.name.value=p.name;f.elements.category.value=p.category;f.elements.price.value=p.price;f.elements.emoji.value=p.emoji;f.elements.bg.value=p.bg;f.elements.imageFile.value='';f.elements.active.checked=p.active;renderImageList();setError('productMessage','')}
$('productSelect').addEventListener('change',()=>{const p=products.find(x=>x.id===Number($('productSelect').value));if(p)fillProductForm(p)});

$('imageFile').addEventListener('change',()=>{
  const files=[...$('imageFile').files];
  $('imageFile').value='';
  const accepted=[];
  for(const file of files){
    if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>MAX_IMAGE_BYTES){setError('productMessage',`"${file.name}" không hợp lệ: chỉ nhận PNG, JPG, WEBP, GIF và tối đa 5 MB.`);continue}
    accepted.push({file,previewUrl:URL.createObjectURL(file)});
  }
  const room=MAX_IMAGES-editImages.length;
  if(accepted.length>room){setError('productMessage',`Mỗi sản phẩm tối đa ${MAX_IMAGES} ảnh.`);accepted.splice(Math.max(room,0))}
  editImages.push(...accepted);
  renderImageList();
  if(accepted.length)setError('productMessage','');
});

$('imageList').addEventListener('click',e=>{
  const b=e.target.closest('button[data-act]');if(!b)return;
  const i=Number(b.dataset.idx),act=b.dataset.act;
  if(act==='remove'){const [gone]=editImages.splice(i,1);if(gone?.previewUrl)URL.revokeObjectURL(gone.previewUrl)}
  else{const j=act==='left'?i-1:i+1;if(j<0||j>=editImages.length)return;[editImages[i],editImages[j]]=[editImages[j],editImages[i]]}
  renderImageList();
});

$('removeProductImage').addEventListener('click',()=>{revokePreviews();editImages=[];$('imageFile').value='';renderImageList();setError('productMessage','Ảnh sẽ được gỡ khi bạn lưu sản phẩm.')});

function renderImageList(){
  $('imageCurrent').textContent=editImages.length?`${editImages.length} ảnh · ảnh đầu tiên là ảnh bìa`:'Chưa có ảnh';
  $('imageList').innerHTML=editImages.map((e,i)=>`<div class="image-thumb"><img src="${escapeHtml(e.previewUrl||e.url)}" alt="Ảnh ${i+1}">${i===0?'<span class="thumb-cover">Bìa</span>':''}${e.file?'<span class="thumb-new">Mới</span>':''}<div class="thumb-actions"><button type="button" data-act="left" data-idx="${i}" ${i===0?'disabled':''} aria-label="Đưa ảnh sang trái">◀</button><button type="button" data-act="remove" data-idx="${i}" aria-label="Xóa ảnh">✕</button><button type="button" data-act="right" data-idx="${i}" ${i===editImages.length-1?'disabled':''} aria-label="Đưa ảnh sang phải">▶</button></div></div>`).join('');
}

async function uploadProductImage(file,productId){const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[file.type];if(!ext)throw new Error('Định dạng ảnh không được hỗ trợ.');const path=`products/images/${Date.now()}-${crypto.randomUUID()}.${ext}`;const {error}=await db.storage.from('product-images').upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});if(error)throw error;const {data}=db.storage.from('product-images').getPublicUrl(path);return data.publicUrl}

$('productForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.currentTarget;
  const id=Number(f.elements.id.value);
  const price=Number(f.elements.price.value);
  if(!Number.isSafeInteger(price)||price<0)return setError('productMessage','Giá bán không hợp lệ.');
  const btn=f.querySelector('button[type=submit]');
  btn.disabled=true;
  setError('productMessage','Đang lưu sản phẩm...');
  try{
    // Tải ảnh mới lên theo đúng thứ tự hiển thị, ảnh đã có giữ nguyên URL
    const urls=[];
    for(const entry of editImages){urls.push(entry.file?await uploadProductImage(entry.file,id):entry.url)}
    const payload={
      name:f.elements.name.value.trim(),
      category:f.elements.category.value,
      price,
      emoji:f.elements.emoji.value.trim()||'🛍️',
      bg:f.elements.bg.value.trim()||'#ece3d8',
      images:urls,
      image:urls[0]||null,
      active:f.elements.active.checked,
      updated_at:new Date().toISOString()
    };
    const {data,error}=await db.from('products').update(payload).eq('id',id).select().single();
    if(error)throw error;
    products=products.map(p=>p.id===data.id?data:p);
    $('productSelect').selectedOptions[0].textContent=`${data.id}. ${data.name}${data.active?'':' (ẩn)'}`;
    fillProductForm(data);
    setError('productMessage','Đã lưu sản phẩm và ảnh lên Supabase Storage.');
    toast('Đã cập nhật sản phẩm.');
  }catch(err){
    setError('productMessage',`Lưu sản phẩm thất bại: ${err.message||'Lỗi không xác định'}`);
    console.error(err);
  }finally{btn.disabled=false}
});

async function loadSettings(){const {data,error}=await db.from('store_settings').select('*').eq('id',true).maybeSingle();if(error||!data)return;const f=$('settingsForm');f.elements.store_name.value=data.store_name;f.elements.zalo_phone.value=data.zalo_phone}
$('settingsForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const payload={store_name:f.elements.store_name.value.trim(),zalo_phone:f.elements.zalo_phone.value.trim(),updated_at:new Date().toISOString()};const {error}=await db.from('store_settings').upsert({id:true,...payload});if(error){setError('settingsMessage','Không thể lưu thông tin shop.');console.error(error);return}setError('settingsMessage','Đã lưu thông tin cửa hàng.');toast('Đã cập nhật thông tin shop.')});
verifySession();
