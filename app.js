/* KHO BÁU NHỎ storefront. Supabase URL + anon key được cấu hình trong supabase-config.js.
   Không đặt service_role key, mật khẩu quản trị hoặc bí mật máy chủ trong frontend. */
const cfg = window.KEO_SUPABASE_CONFIG || {};
const supabaseReady = Boolean(cfg.url && cfg.anonKey && !cfg.url.includes('YOUR_PROJECT') && !cfg.anonKey.includes('YOUR_'));
const db = supabaseReady ? window.supabase.createClient(cfg.url, cfg.anonKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
const money = n => new Intl.NumberFormat('vi-VN').format(Number(n)||0) + '₫';
const categories = ['Tất cả','Áo','Quần & váy','Túi','Phụ kiện'];
const fallbackProducts = [
  {
    "id": 1,
    "name": "Áo thun cherry",
    "cat": "Áo",
    "price": 159000,
    "emoji": "👚",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 2,
    "name": "Áo baby tee pastel",
    "cat": "Áo",
    "price": 149000,
    "emoji": "👕",
    "bg": "#e9e4dd",
    "image": null,
    "active": true
  },
  {
    "id": 3,
    "name": "Áo croptop nơ",
    "cat": "Áo",
    "price": 179000,
    "emoji": "🎀",
    "bg": "#e8e4e0",
    "image": null,
    "active": true
  },
  {
    "id": 4,
    "name": "Áo sơ mi oversize",
    "cat": "Áo",
    "price": 229000,
    "emoji": "👔",
    "bg": "#ece9e5",
    "image": null,
    "active": true
  },
  {
    "id": 5,
    "name": "Áo len cardigan",
    "cat": "Áo",
    "price": 289000,
    "emoji": "🧥",
    "bg": "#eae7e4",
    "image": null,
    "active": true
  },
  {
    "id": 6,
    "name": "Áo hai dây hoa",
    "cat": "Áo",
    "price": 139000,
    "emoji": "🌸",
    "bg": "#f2f0ee",
    "image": null,
    "active": true
  },
  {
    "id": 7,
    "name": "Áo polo cute",
    "cat": "Áo",
    "price": 189000,
    "emoji": "👕",
    "bg": "#f2f0ee",
    "image": null,
    "active": true
  },
  {
    "id": 8,
    "name": "Áo hoodie mèo",
    "cat": "Áo",
    "price": 329000,
    "emoji": "🐱",
    "bg": "#f0eeec",
    "image": null,
    "active": true
  },
  {
    "id": 9,
    "name": "Áo blouse tay phồng",
    "cat": "Áo",
    "price": 249000,
    "emoji": "👚",
    "bg": "#edebe8",
    "image": null,
    "active": true
  },
  {
    "id": 10,
    "name": "Áo sweater chữ",
    "cat": "Áo",
    "price": 279000,
    "emoji": "🧶",
    "bg": "#edeae6",
    "image": null,
    "active": true
  },
  {
    "id": 11,
    "name": "Quần jean ống rộng",
    "cat": "Quần & váy",
    "price": 329000,
    "emoji": "👖",
    "bg": "#f0eeeb",
    "image": null,
    "active": true
  },
  {
    "id": 12,
    "name": "Chân váy tennis",
    "cat": "Quần & váy",
    "price": 219000,
    "emoji": "👗",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 13,
    "name": "Váy hoa nhí",
    "cat": "Quần & váy",
    "price": 359000,
    "emoji": "🌷",
    "bg": "#f1efec",
    "image": null,
    "active": true
  },
  {
    "id": 14,
    "name": "Quần short kaki",
    "cat": "Quần & váy",
    "price": 199000,
    "emoji": "🩳",
    "bg": "#eae7e4",
    "image": null,
    "active": true
  },
  {
    "id": 15,
    "name": "Chân váy chữ A",
    "cat": "Quần & váy",
    "price": 239000,
    "emoji": "👗",
    "bg": "#f0eeec",
    "image": null,
    "active": true
  },
  {
    "id": 16,
    "name": "Quần suông basic",
    "cat": "Quần & váy",
    "price": 289000,
    "emoji": "👖",
    "bg": "#ece9e6",
    "image": null,
    "active": true
  },
  {
    "id": 17,
    "name": "Váy babydoll",
    "cat": "Quần & váy",
    "price": 339000,
    "emoji": "🎀",
    "bg": "#f2f0ee",
    "image": null,
    "active": true
  },
  {
    "id": 18,
    "name": "Quần cargo",
    "cat": "Quần & váy",
    "price": 319000,
    "emoji": "👖",
    "bg": "#e5e1dc",
    "image": null,
    "active": true
  },
  {
    "id": 19,
    "name": "Chân váy denim",
    "cat": "Quần & váy",
    "price": 259000,
    "emoji": "👗",
    "bg": "#f0eeeb",
    "image": null,
    "active": true
  },
  {
    "id": 20,
    "name": "Váy yếm cute",
    "cat": "Quần & váy",
    "price": 319000,
    "emoji": "🌼",
    "bg": "#eae7e4",
    "image": null,
    "active": true
  },
  {
    "id": 21,
    "name": "Túi tote pastel",
    "cat": "Túi",
    "price": 129000,
    "emoji": "👜",
    "bg": "#efece9",
    "image": null,
    "active": true
  },
  {
    "id": 22,
    "name": "Túi đeo chéo mini",
    "cat": "Túi",
    "price": 249000,
    "emoji": "👛",
    "bg": "#e9e4dd",
    "image": null,
    "active": true
  },
  {
    "id": 23,
    "name": "Túi kẹp nách",
    "cat": "Túi",
    "price": 279000,
    "emoji": "👜",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 24,
    "name": "Balo mini",
    "cat": "Túi",
    "price": 299000,
    "emoji": "🎒",
    "bg": "#ece9e6",
    "image": null,
    "active": true
  },
  {
    "id": 25,
    "name": "Túi canvas hoa",
    "cat": "Túi",
    "price": 159000,
    "emoji": "🌸",
    "bg": "#eae7e3",
    "image": null,
    "active": true
  },
  {
    "id": 26,
    "name": "Ví mini trái tim",
    "cat": "Túi",
    "price": 119000,
    "emoji": "💗",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 27,
    "name": "Túi baguette",
    "cat": "Túi",
    "price": 269000,
    "emoji": "👜",
    "bg": "#f3f2f0",
    "image": null,
    "active": true
  },
  {
    "id": 28,
    "name": "Túi đeo vai",
    "cat": "Túi",
    "price": 239000,
    "emoji": "🛍️",
    "bg": "#f0edea",
    "image": null,
    "active": true
  },
  {
    "id": 29,
    "name": "Túi lưới đi chơi",
    "cat": "Túi",
    "price": 99000,
    "emoji": "🧺",
    "bg": "#edebe8",
    "image": null,
    "active": true
  },
  {
    "id": 30,
    "name": "Túi charm bear",
    "cat": "Túi",
    "price": 189000,
    "emoji": "🧸",
    "bg": "#f2f0ee",
    "image": null,
    "active": true
  },
  {
    "id": 31,
    "name": "Kẹp tóc nơ",
    "cat": "Phụ kiện",
    "price": 39000,
    "emoji": "🎀",
    "bg": "#ece3d8",
    "image": null,
    "active": true
  },
  {
    "id": 32,
    "name": "Băng đô hoa",
    "cat": "Phụ kiện",
    "price": 49000,
    "emoji": "🌼",
    "bg": "#e8e4e0",
    "image": null,
    "active": true
  },
  {
    "id": 33,
    "name": "Vòng cổ trái tim",
    "cat": "Phụ kiện",
    "price": 89000,
    "emoji": "💖",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 34,
    "name": "Khuyên tai ngọc",
    "cat": "Phụ kiện",
    "price": 79000,
    "emoji": "✨",
    "bg": "#f4f2f0",
    "image": null,
    "active": true
  },
  {
    "id": 35,
    "name": "Tất cổ ngắn",
    "cat": "Phụ kiện",
    "price": 35000,
    "emoji": "🧦",
    "bg": "#efece9",
    "image": null,
    "active": true
  },
  {
    "id": 36,
    "name": "Mũ bucket",
    "cat": "Phụ kiện",
    "price": 119000,
    "emoji": "🧢",
    "bg": "#eeebe8",
    "image": null,
    "active": true
  },
  {
    "id": 37,
    "name": "Thắt lưng basic",
    "cat": "Phụ kiện",
    "price": 99000,
    "emoji": "〰️",
    "bg": "#f4f2f0",
    "image": null,
    "active": true
  },
  {
    "id": 38,
    "name": "Kính gọng màu",
    "cat": "Phụ kiện",
    "price": 129000,
    "emoji": "👓",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 39,
    "name": "Scrunchie set 3",
    "cat": "Phụ kiện",
    "price": 59000,
    "emoji": "🎗️",
    "bg": "#f3f1ee",
    "image": null,
    "active": true
  },
  {
    "id": 40,
    "name": "Charm điện thoại",
    "cat": "Phụ kiện",
    "price": 69000,
    "emoji": "📿",
    "bg": "#edebe8",
    "image": null,
    "active": true
  },
  {
    "id": 41,
    "name": "Dây chuyền layer",
    "cat": "Phụ kiện",
    "price": 139000,
    "emoji": "📿",
    "bg": "#edeae7",
    "image": null,
    "active": true
  },
  {
    "id": 42,
    "name": "Kẹp càng cua",
    "cat": "Phụ kiện",
    "price": 45000,
    "emoji": "🦋",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 43,
    "name": "Túi đựng mỹ phẩm",
    "cat": "Túi",
    "price": 149000,
    "emoji": "🧴",
    "bg": "#f2f0ee",
    "image": null,
    "active": true
  },
  {
    "id": 44,
    "name": "Áo khoác denim",
    "cat": "Áo",
    "price": 399000,
    "emoji": "🧥",
    "bg": "#f0eeeb",
    "image": null,
    "active": true
  },
  {
    "id": 45,
    "name": "Quần legging",
    "cat": "Quần & váy",
    "price": 169000,
    "emoji": "🩰",
    "bg": "#efece9",
    "image": null,
    "active": true
  },
  {
    "id": 46,
    "name": "Váy maxi pastel",
    "cat": "Quần & váy",
    "price": 429000,
    "emoji": "🌺",
    "bg": "#eeebe8",
    "image": null,
    "active": true
  },
  {
    "id": 47,
    "name": "Khăn bandana",
    "cat": "Phụ kiện",
    "price": 59000,
    "emoji": "🧣",
    "bg": "#eeebe8",
    "image": null,
    "active": true
  },
  {
    "id": 48,
    "name": "Túi đeo hạt cườm",
    "cat": "Túi",
    "price": 219000,
    "emoji": "🪩",
    "bg": "#f3f1ee",
    "image": null,
    "active": true
  },
  {
    "id": 49,
    "name": "Áo tank top",
    "cat": "Áo",
    "price": 119000,
    "emoji": "👚",
    "bg": "#f2f0ed",
    "image": null,
    "active": true
  },
  {
    "id": 50,
    "name": "Chân váy xếp ly",
    "cat": "Quần & váy",
    "price": 249000,
    "emoji": "🌸",
    "bg": "#f3f1ee",
    "image": null,
    "active": true
  }
];
const fallbackSets = [
 {id:'s1',name:'Set nàng thơ pastel',desc:'Áo baby tee + chân váy + kẹp nơ',items:[2,15,31],price:359000,emoji:'🧚',bg:'#f3f2f0',tag:'BEST SELLER'},
 {id:'s2',name:'Set dạo phố năng động',desc:'Áo thun + quần jean + túi tote',items:[1,11,21],price:549000,emoji:'🛼',bg:'#f3f1ef',tag:'COOL GIRL'},
 {id:'s3',name:'Set picnic đáng yêu',desc:'Váy hoa + túi mini + băng đô',items:[13,22,32],price:579000,emoji:'🌷',bg:'#edeae7',tag:'JUST CUTE'}
];
let sets = fallbackSets;
let products = fallbackProducts;
let store = {name:'KHO BÁU NHỎ',phone:'0358259044'};
let cart = readCart();
let activeCat = 'Tất cả';
let mixQty = {};
let submitting = false;
const $ = id => document.getElementById(id);
const product = id => products.find(p => p.id === Number(id));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readCart(){try{const value=JSON.parse(localStorage.getItem('keoCart')||'[]');return Array.isArray(value)?value.filter(x=>x&&Number.isInteger(x.qty)&&x.qty>0&&Number.isFinite(Number(x.price))):[]}catch{return []}}
function persistCart(){try{localStorage.setItem('keoCart',JSON.stringify(cart))}catch{toast('Không thể lưu giỏ hàng trên trình duyệt này.')}}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');window.setTimeout(()=>el.classList.remove('show'),2600)}
function applyStore(){document.title=`${store.name} — mix đồ xinh`;document.querySelectorAll('.brand-name').forEach(el=>el.textContent=store.name);if($('storeZaloDisplay'))$('storeZaloDisplay').textContent=store.phone;if($('zaloConfirmLink'))$('zaloConfirmLink').href=`https://zalo.me/${String(store.phone).replace(/[^0-9]/g,'')}`;}
function getTotal(){return cart.reduce((sum,item)=>sum+Number(item.price)*item.qty,0)}
function saveCart(){persistCart();renderCart()}
function addProduct(id){const p=product(id);if(!p)return;const line=cart.find(x=>x.key===`p${id}`);if(line)line.qty=Math.min(20,line.qty+1);else cart.push({key:`p${id}`,type:'product',id:p.id,name:p.name,price:p.price,emoji:p.emoji,bg:p.bg,qty:1});saveCart();toast(`Đã thêm ${p.name} vào giỏ ♡`)}
function renderProducts(){const q=$('search').value.trim().toLocaleLowerCase('vi');const list=products.filter(p=>p.active!==false&&(activeCat==='Tất cả'||p.cat===activeCat)&&(p.name.toLocaleLowerCase('vi').includes(q)||p.cat.toLocaleLowerCase('vi').includes(q)));$('productGrid').innerHTML=list.map(p=>`<article class="product-card">${productVisual(p)}<div class="product-info"><h3>${escapeHTML(p.name)}</h3><div class="product-meta"><span class="price">${money(p.price)}</span><button class="add-btn" aria-label="Thêm ${escapeHTML(p.name)}" data-add-product="${p.id}">+</button></div></div></article>`).join('')||'<p>Chưa tìm thấy món phù hợp.</p>'}
function renderFilters(){$('filters').innerHTML=categories.map(c=>`<button class="filter ${activeCat===c?'active':''}" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('')}
function renderSets(){$('setGrid').innerHTML=sets.length?sets.map(s=>`<article class="set-card"><div class="set-visual" style="background:${escapeHTML(s.bg)}">${escapeHTML(s.emoji)}<small>${escapeHTML(s.tag)}</small></div><div class="set-body"><h3>${escapeHTML(s.name)}</h3><p>${escapeHTML(s.desc)}</p><div class="set-bottom"><span class="price">${money(s.price)}</span><button class="btn primary" data-add-set="${escapeHTML(s.id)}">Chọn set ♡</button></div></div></article>`).join(''):'<p class="empty">Chưa có set mix sẵn nào.</p>'}
function addSet(id){const s=sets.find(x=>String(x.id)===String(id));if(!s)return;const parts=s.items.map(product).filter(Boolean);cart.push({key:`set-${crypto.randomUUID()}`,type:'set',name:s.name,price:s.price,emoji:s.emoji,bg:s.bg,qty:1,detail:parts.map(p=>p.name).join(', ')});saveCart();toast('Đã thêm set vào giỏ ♡')}
const ACCESSORY_CAT = 'Phụ kiện';
const isAccessory = p => p.cat === ACCESSORY_CAT;
const mixMainIds = () => products.filter(p => !isAccessory(p) && mixQty[p.id] > 0).map(p => p.id);

function mixRow(p, locked){
  const q = mixQty[p.id] || 0;
  return `<div class="mix-row ${locked?'locked':''}"><div class="mix-emoji" style="background:${escapeHTML(p.bg)}">${escapeHTML(p.emoji)}</div><div><b>${escapeHTML(p.name)}</b><small>${money(p.price)}</small></div><div class="qty"><button data-mix="${p.id}" data-delta="-1" ${q?'':'disabled'} aria-label="Giảm số lượng">−</button><span>${q}</span><button data-mix="${p.id}" data-delta="1" ${locked?'disabled':''} aria-label="Tăng số lượng">+</button></div></div>`;
}

let mixTab = 'main';

function renderMix(){
  const active = products.filter(p => p.active !== false);
  const hasMain = mixMainIds().length > 0;
  const mains = active.filter(p => !isAccessory(p));
  const accs = active.filter(isAccessory);
  const countOf = list => list.reduce((a,p) => a + (mixQty[p.id] || 0), 0);
  document.querySelectorAll('[data-mix-tab]').forEach(b => {
    const t = b.dataset.mixTab;
    b.classList.toggle('active', t === mixTab);
    b.classList.toggle('locked', t === 'acc' && !hasMain);
    b.querySelector('span').textContent = t === 'main' ? countOf(mains) : countOf(accs);
  });
  if(mixTab === 'main'){
    $('mixPicks').innerHTML = mains.length ? mains.map(p => mixRow(p, false)).join('') : '<p class="mix-empty">Chưa có món chính nào.</p>';
  }else{
    const hint = hasMain ? '' : '<p class="mix-hint">Chọn ít nhất một món chính trước để thêm phụ kiện.</p>';
    $('mixPicks').innerHTML = hint + (accs.length ? accs.map(p => mixRow(p, !hasMain)).join('') : '<p class="mix-empty">Chưa có phụ kiện nào.</p>');
  }
  const chosen = active.filter(p => mixQty[p.id] > 0);
  const count = chosen.reduce((a,p) => a + mixQty[p.id], 0);
  const total = chosen.reduce((a,p) => a + p.price * mixQty[p.id], 0);
  $('mixTotal').textContent = `${count} món · ${money(total)}`;
}

function changeMix(id, delta){
  const p = products.find(x => x.id === id);
  if(!p) return;
  if(isAccessory(p) && delta > 0 && !mixMainIds().length)
    return toast('Hãy chọn món chính trước, rồi mới thêm phụ kiện nhé ♡');
  mixQty[id] = Math.max(0, Math.min(20, (mixQty[id] || 0) + delta));
  if(!mixQty[id]) delete mixQty[id];
  // Không còn món chính thì phụ kiện đã chọn không còn hợp lệ, bỏ đi
  if(!isAccessory(p) && !mixMainIds().length){
    const hadAccessory = products.some(x => isAccessory(x) && mixQty[x.id] > 0);
    products.filter(isAccessory).forEach(a => delete mixQty[a.id]);
    if(hadAccessory) toast('Đã bỏ phụ kiện vì set chưa có món chính.');
  }
  renderMix();
}

function addMix(){
  if(!mixMainIds().length) return toast('Bạn hãy chọn ít nhất một món chính nhé!');
  const chosen = products.filter(p => mixQty[p.id] > 0);
  // Món chính đứng trước, phụ kiện đứng sau
  const ordered = [...chosen.filter(p => !isAccessory(p)), ...chosen.filter(isAccessory)];
  const total = ordered.reduce((a,p) => a + p.price * mixQty[p.id], 0);
  cart.push({key:`mix-${crypto.randomUUID()}`, type:'mix', name:$('mixName').value.trim()||'Set tự mix của bạn', price:total, emoji:'🎀', bg:'#ece3d8', qty:1, detail:ordered.map(p => `${p.name} x${mixQty[p.id]}`).join(', ')});
  mixQty = {};
  $('mixName').value = '';
  renderMix();
  saveCart();
  toast('Set tự mix đã vào giỏ ♡');
}
function renderCart(){const count=cart.reduce((a,x)=>a+x.qty,0);$('cartCount').textContent=count;$('subtotal').textContent=money(getTotal());$('cartItems').innerHTML=cart.length?cart.map(x=>`<div class="cart-row"><div class="cart-thumb" style="background:${escapeHTML(x.bg||'#ece3d8')}">${escapeHTML(x.emoji||'🛍️')}</div><div><b>${escapeHTML(x.name)}</b><small>${escapeHTML(x.detail||money(x.price))}${x.detail?' · '+money(x.price):''}</small><div class="qty"><button data-cart-key="${escapeHTML(x.key)}" data-delta="-1">−</button><span>${x.qty}</span><button data-cart-key="${escapeHTML(x.key)}" data-delta="1">+</button></div></div><button class="remove" data-remove-cart="${escapeHTML(x.key)}">Xóa</button></div>`).join(''):'<div class="empty">🛍️<br><br>Giỏ hàng đang chờ những món đồ xinh!</div>'}
function changeCart(key,delta){const item=cart.find(x=>x.key===key);if(item)item.qty=Math.min(20,item.qty+delta);cart=cart.filter(x=>x.qty>0);saveCart()}
function removeCart(key){cart=cart.filter(x=>x.key!==key);saveCart()}
function openCart(){$('overlay').classList.add('show');$('cartDrawer').classList.add('show')}
function closeCart(){$('overlay').classList.remove('show');$('cartDrawer').classList.remove('show')}
function openCheckout(){if(!cart.length)return toast('Giỏ hàng của bạn đang trống!');closeCart();$('checkoutTotal').textContent=money(getTotal());$('checkoutModal').classList.add('show')}
function closeCheckout(){$('checkoutModal').classList.remove('show')}
function openLookup(){$('lookupModal').classList.add('show')}
function closeLookup(){$('lookupModal').classList.remove('show')}
function statusLabel(status){return ({pending:'Chờ shop xác nhận',confirmed:'Đã xác nhận',preparing:'Đang chuẩn bị hàng',shipping:'Đang giao hàng',completed:'Đã hoàn thành',cancelled:'Đã hủy'})[status]||'Không rõ trạng thái'}
function renderLookup(order){$('lookupResult').innerHTML=`<div class="lookup-card"><div class="lookup-result-head"><b>${escapeHTML(order.order_code)}</b><span class="status-pill status-${escapeHTML(order.status)}">${statusLabel(order.status)}</span></div><p>Ngày đặt: ${new Date(order.created_at).toLocaleString('vi-VN')}</p><div class="lookup-lines">${(order.items||[]).map(i=>`<div><span>${escapeHTML(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join('')}</div><div class="lookup-total"><span>Tổng đơn hàng</span><b>${money(order.total)}</b></div></div>`}
async function lookupOrder(){if(!db)return toast('Shop chưa cấu hình kết nối Supabase.');const code=$('lookupCode').value.trim().toUpperCase();if(!/^(KBN|KEO)-\d{8}-[A-Z0-9]{12}$/.test(code))return toast('Mã đơn hàng chưa đúng định dạng.');$('lookupButton').disabled=true;$('lookupResult').textContent='Đang tra cứu...';try{const {data,error}=await db.rpc('lookup_store_order',{p_order_code:code});if(error)throw error;if(!data){$('lookupResult').innerHTML='<p class="muted">Không tìm thấy đơn hàng. Hãy kiểm tra lại mã đơn nhé.</p>';return}renderLookup(data)}catch(err){console.error(err);$('lookupResult').textContent='Không thể tra cứu lúc này. Vui lòng thử lại.'}finally{$('lookupButton').disabled=false}}
async function placeOrder(event){event.preventDefault();if(submitting)return;if(!db)return toast('Website chưa cấu hình Supabase.');if(!cart.length)return toast('Giỏ hàng đang trống!');const form=event.currentTarget;const customer=Object.fromEntries(new FormData(form).entries());const nameLen=Array.from(String(customer.name||'').trim()).length;const addrLen=Array.from(String(customer.address||'').trim()).length;const noteLen=Array.from(String(customer.note||'')).length;if(nameLen<1)return toast('Vui lòng nhập họ và tên.');if(nameLen>50)return toast('Họ và tên không được quá 50 ký tự.');if(!/^0\d{9,11}$/.test(String(customer.phone||'').trim()))return toast('Số điện thoại phải bắt đầu bằng số 0 và gồm 10 đến 12 chữ số.');if(addrLen<1)return toast('Vui lòng nhập địa chỉ nhận hàng.');if(addrLen>1000)return toast('Địa chỉ không được quá 1000 ký tự.');if(noteLen>10000)return toast('Ghi chú không được quá 10000 ký tự.');const items=cart.map(x=>({name:String(x.name).slice(0,160),price:Number(x.price),qty:Number(x.qty),detail:String(x.detail||'').slice(0,500),emoji:String(x.emoji||'🛍️').slice(0,8)}));if(items.some(x=>!Number.isInteger(x.qty)||x.qty<1||x.qty>20||!Number.isFinite(x.price)||x.price<0))return toast('Có sản phẩm không hợp lệ trong giỏ hàng.');submitting=true;const submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Đang tạo đơn hàng...';try{const {data,error}=await db.rpc('create_store_order',{p_customer:customer,p_items:items});if(error)throw error;const order=data;cart=[];saveCart();form.reset();closeCheckout();$('successOrderCode').textContent=order.order_code;$('successOrderTotal').textContent=money(order.total);$('orderSuccessModal').classList.add('show');}catch(err){console.error(err);toast(err.message?.includes('fetch')?'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.':'Đặt hàng chưa thành công. Vui lòng kiểm tra thông tin và thử lại.')}finally{submitting=false;submit.disabled=false;submit.textContent='Tạo đơn hàng ♡'}}
async function init(){initCarousel();applyStore();renderFilters();renderSets();renderCart();$('search').addEventListener('input',renderProducts);$('productGrid').addEventListener('click',e=>{const b=e.target.closest('[data-add-product]');if(b)addProduct(b.dataset.addProduct)});$('filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){activeCat=b.dataset.category;renderFilters();renderProducts()}});$('setGrid').addEventListener('click',e=>{const b=e.target.closest('[data-add-set]');if(b)addSet(b.dataset.addSet)});$('mixTabs').addEventListener('click',e=>{const b=e.target.closest('[data-mix-tab]');if(b){mixTab=b.dataset.mixTab;renderMix()}});$('mixPicks').addEventListener('click',e=>{const b=e.target.closest('[data-mix]');if(b)changeMix(Number(b.dataset.mix),Number(b.dataset.delta))});$('cartItems').addEventListener('click',e=>{const r=e.target.closest('[data-remove-cart]');const q=e.target.closest('[data-cart-key]');if(r)removeCart(r.dataset.removeCart);if(q)changeCart(q.dataset.cartKey,Number(q.dataset.delta))});$('addMix').addEventListener('click',addMix);$('openCart').onclick=openCart;$('closeCart').onclick=closeCart;$('overlay').onclick=closeCart;$('checkoutBtn').onclick=openCheckout;$('closeCheckout').onclick=closeCheckout;$('checkoutForm').addEventListener('submit',placeOrder);$('checkoutModal').addEventListener('click',e=>{if(e.target===$('checkoutModal'))closeCheckout()});$('openLookup').onclick=openLookup;$('closeLookup').onclick=closeLookup;$('lookupButton').onclick=lookupOrder;$('lookupModal').addEventListener('click',e=>{if(e.target===$('lookupModal'))closeLookup()});$('closeSuccess').onclick=()=>$('orderSuccessModal').classList.remove('show');$('copyOrderCode').onclick=async()=>{try{await navigator.clipboard.writeText($('successOrderCode').textContent);toast('Đã sao chép mã đơn hàng!')}catch{toast('Hãy bôi đen và sao chép mã đơn hàng nhé.')}};$('openAdmin').onclick=()=>location.href='admin.html';
 if(!db){$('configNotice').classList.remove('hidden');renderProducts();renderMix();return;}
 try{const [{data:dbProducts,error:pError},{data:settings,error:sError},{data:dbSets,error:setsError}]=await Promise.all([db.from('products').select('*').eq('active',true).order('id'),db.from('store_settings').select('store_name,zalo_phone').eq('id',true).maybeSingle(),db.from('mix_sets').select('*').eq('active',true).order('sort_order').order('id')]);if(!pError&&dbProducts?.length)products=dbProducts.map(p=>({id:p.id,name:p.name,cat:p.category,price:p.price,emoji:p.emoji,bg:p.bg,image:p.image,images:p.images,active:p.active}));if(!sError&&settings)store={name:settings.store_name,phone:settings.zalo_phone};if(!setsError&&dbSets)sets=dbSets.map(s=>({id:s.id,name:s.name,desc:s.description,items:(Array.isArray(s.items)?s.items:[]).map(Number),price:s.price,emoji:s.emoji,bg:s.bg,tag:s.tag}));}catch(err){console.warn('Dùng dữ liệu sản phẩm dự phòng',err)}applyStore();renderProducts();renderMix();renderSets();}
/* ---- Nhiều ảnh cho mỗi sản phẩm: khung tự co theo ảnh, tự chạy ngang, kéo chuột/vuốt để xem ---- */
const CAROUSEL_INTERVAL = 3800;
let carouselDrag = null;

function productImages(p){
  const list = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);
  return list.filter(Boolean);
}

function productVisual(p){
  const imgs = productImages(p);
  if(!imgs.length) return `<div class="product-visual" style="background:${escapeHTML(p.bg)}"><small>${escapeHTML(p.cat)}</small>${escapeHTML(p.emoji)}</div>`;
  const slides = imgs.map((src,i)=>`<div class="carousel-slide"><img loading="lazy" decoding="async" draggable="false" src="${escapeHTML(src)}" alt="${escapeHTML(p.name)} - ảnh ${i+1}" onerror="this.style.visibility='hidden'"></div>`).join('');
  const dots = imgs.length > 1 ? `<div class="carousel-dots">${imgs.map((_,i)=>`<span class="${i===0?'active':''}"></span>`).join('')}</div>` : '';
  return `<div class="product-visual carousel" style="background:${escapeHTML(p.bg)}" data-count="${imgs.length}" data-index="0"><small>${escapeHTML(p.cat)}</small><div class="carousel-viewport"><div class="carousel-track">${slides}</div></div>${dots}</div>`;
}

function syncCarouselFrame(el){
  const img = el.querySelectorAll('.carousel-slide img')[Number(el.dataset.index)||0];
  if(img && img.complete && img.naturalWidth && img.naturalHeight){
    // Khung theo đúng tỉ lệ ảnh, giới hạn để bố cục lưới không bị vỡ với ảnh quá dài hoặc quá cao
    const ratio = Math.min(1.6, Math.max(0.75, img.naturalWidth / img.naturalHeight));
    el.style.setProperty('--ratio', ratio.toFixed(3));
  }
}

function setCarouselIndex(el, index){
  const count = Number(el.dataset.count) || 1;
  const i = ((index % count) + count) % count;
  el.dataset.index = i;
  el.querySelector('.carousel-track').style.transform = `translate3d(${-i*100}%,0,0)`;
  el.querySelectorAll('.carousel-dots span').forEach((d,k)=>d.classList.toggle('active', k===i));
  const imgs = el.querySelectorAll('.carousel-slide img');
  [i, (i+1) % count].forEach(k => { if(imgs[k]) imgs[k].loading = 'eager'; });
  syncCarouselFrame(el);
}

function onCarouselDown(e){
  if(e.button !== 0) return;
  const el = e.target.closest('.carousel');
  if(!el || Number(el.dataset.count) < 2) return;
  carouselDrag = {el, id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, base: Number(el.dataset.index)||0, active: false};
}

function onCarouselMove(e){
  const d = carouselDrag;
  if(!d || e.pointerId !== d.id) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  if(!d.active){
    if(Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)){ carouselDrag = null; return; } // người dùng đang cuộn dọc
    if(Math.abs(dx) < 6) return;
    d.active = true;
    d.el.classList.add('is-dragging');
  }
  const count = Number(d.el.dataset.count);
  const atEdge = (d.base === 0 && dx > 0) || (d.base === count-1 && dx < 0);
  d.dx = atEdge ? dx * 0.3 : dx;
  d.el.querySelector('.carousel-track').style.transform = `translate3d(calc(${-d.base*100}% + ${d.dx}px),0,0)`;
}

function onCarouselUp(e){
  const d = carouselDrag;
  if(!d || e.pointerId !== d.id) return;
  carouselDrag = null;
  if(!d.active) return;
  const count = Number(d.el.dataset.count);
  const threshold = Math.min(60, d.el.clientWidth * 0.15);
  let next = d.base;
  if(d.dx <= -threshold && d.base < count-1) next = d.base + 1;
  else if(d.dx >= threshold && d.base > 0) next = d.base - 1;
  d.el.classList.remove('is-dragging');
  setCarouselIndex(d.el, next);
}

function initCarousel(){
  const grid = $('productGrid');
  grid.addEventListener('pointerdown', onCarouselDown);
  window.addEventListener('pointermove', onCarouselMove, {passive:true});
  window.addEventListener('pointerup', onCarouselUp);
  window.addEventListener('pointercancel', onCarouselUp);
  grid.addEventListener('dragstart', e => { if(e.target.closest('.carousel')) e.preventDefault(); });
  // ảnh tải xong: cập nhật khung theo kích thước thật của ảnh đang hiển thị
  grid.addEventListener('load', e => {
    if(e.target.tagName !== 'IMG') return;
    const el = e.target.closest('.carousel');
    if(el && el.querySelectorAll('.carousel-slide img')[Number(el.dataset.index)||0] === e.target) syncCarouselFrame(el);
  }, true);
}

// Tự chạy ngang; tạm dừng khi người dùng đang kéo hoặc rê chuột lên sản phẩm
setInterval(() => {
  document.querySelectorAll('.product-visual.carousel').forEach(el => {
    if(Number(el.dataset.count) < 2 || el.classList.contains('is-dragging') || el.matches(':hover')) return;
    setCarouselIndex(el, (Number(el.dataset.index)||0) + 1);
  });
}, CAROUSEL_INTERVAL);

document.addEventListener('DOMContentLoaded',init);
