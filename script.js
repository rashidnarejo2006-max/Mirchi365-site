/* ==========================================================================
   MIRCHI 365 — POS SYSTEM SCRIPT
   Vanilla JS. No backend — all data lives in memory for this session.
   ========================================================================== */

/* -------------------------------------------------------------------------
   0. DATA
   ------------------------------------------------------------------------- */
const CATEGORY_ICONS = {
  "Pizza":"fa-solid fa-pizza-slice","Burger":"fa-solid fa-burger","Rolls":"fa-solid fa-hotdog",
  "Karahi":"fa-solid fa-bowl-food","BBQ":"fa-solid fa-fire-burner","Rice":"fa-solid fa-bowl-rice",
  "Chinese":"fa-solid fa-utensils","Drinks":"fa-solid fa-mug-hot","Ice Cream":"fa-solid fa-ice-cream"
};

let MENU = [
  {id:1,name:"Chicken Tikka Pizza",cat:"Pizza",price:950,stock:"in"},
  {id:2,name:"Chicken Fajita Pizza",cat:"Pizza",price:990,stock:"in"},
  {id:3,name:"BBQ Pizza",cat:"Pizza",price:920,stock:"low"},
  {id:4,name:"Chicken Supreme Pizza",cat:"Pizza",price:1050,stock:"in"},
  {id:5,name:"Zinger Burger",cat:"Burger",price:420,stock:"in"},
  {id:6,name:"Chicken Burger",cat:"Burger",price:380,stock:"in"},
  {id:7,name:"Double Patty Burger",cat:"Burger",price:520,stock:"in"},
  {id:8,name:"Zinger Roll",cat:"Rolls",price:280,stock:"in"},
  {id:9,name:"Jalapeno Roll",cat:"Rolls",price:300,stock:"low"},
  {id:10,name:"Chicken Cheese Roll",cat:"Rolls",price:310,stock:"in"},
  {id:11,name:"Chicken Shinwari",cat:"Karahi",price:1400,stock:"in"},
  {id:12,name:"Chicken White Karahi",cat:"Karahi",price:1450,stock:"in"},
  {id:13,name:"Chicken Green Karahi",cat:"Karahi",price:1450,stock:"out"},
  {id:14,name:"Chicken Lahori Karahi",cat:"Karahi",price:1500,stock:"in"},
  {id:15,name:"Chicken Malai Boti",cat:"BBQ",price:650,stock:"in"},
  {id:16,name:"Chicken Tikka",cat:"BBQ",price:600,stock:"in"},
  {id:17,name:"Chicken Reshmi Kabab",cat:"BBQ",price:680,stock:"in"},
  {id:18,name:"Chicken Afghani Boti",cat:"BBQ",price:700,stock:"low"},
  {id:19,name:"Chicken Biryani",cat:"Rice",price:380,stock:"in"},
  {id:20,name:"Chicken Fried Rice",cat:"Rice",price:400,stock:"in"},
  {id:21,name:"Mutton Pulao",cat:"Rice",price:550,stock:"in"},
  {id:22,name:"Chicken Manchurian",cat:"Chinese",price:480,stock:"in"},
  {id:23,name:"Chicken Chilli Dry",cat:"Chinese",price:500,stock:"in"},
  {id:24,name:"Chicken Shashlik",cat:"Chinese",price:520,stock:"low"},
  {id:25,name:"Milk Tea",cat:"Drinks",price:120,stock:"in"},
  {id:26,name:"Green Tea",cat:"Drinks",price:110,stock:"in"},
  {id:27,name:"Coffee",cat:"Drinks",price:180,stock:"in"},
  {id:28,name:"Soft Drinks",cat:"Drinks",price:100,stock:"in"},
  {id:29,name:"Mineral Water",cat:"Drinks",price:60,stock:"in"},
  {id:30,name:"Vanilla Ice Cream",cat:"Ice Cream",price:200,stock:"in"},
  {id:31,name:"Chocolate Ice Cream",cat:"Ice Cream",price:220,stock:"in"},
  {id:32,name:"Pista Ice Cream",cat:"Ice Cream",price:230,stock:"low"},
  {id:33,name:"Mango Ice Cream",cat:"Ice Cream",price:220,stock:"in"},
].map(m=>({...m, fav:false}));

let CUSTOMERS = [
  {name:"Ahmed Raza",phone:"0300-1234567",orders:14,totalSpent:24800,points:248},
  {name:"Sara Khan",phone:"0301-9876543",orders:8,totalSpent:15200,points:152},
  {name:"Bilal Hussain",phone:"0333-4455667",orders:21,totalSpent:38900,points:389},
];

let INVENTORY = [
  {name:"Chicken",stock:8,unit:"kg",supplier:"Gambat Meat Suppliers",purchase:450,selling:0},
  {name:"Flour (Maida)",stock:40,unit:"kg",supplier:"Sindh Flour Mills",purchase:110,selling:0},
  {name:"Cooking Oil",stock:5,unit:"ltr",supplier:"National Oils",purchase:520,selling:0},
  {name:"Mozzarella Cheese",stock:3,unit:"kg",supplier:"Dairy Fresh",purchase:1400,selling:0},
  {name:"Soft Drink Crates",stock:2,unit:"crate",supplier:"Beverage Co.",purchase:1200,selling:0},
];

let CART = [];
let ORDERS = [];
let orderType = "Dine In";
let tokenCounter = 100;
let activeCategory = "All";
let selectedPayment = "Cash";
let lastOrderForReceipt = null;

const SETTINGS = { taxPct:5, servicePct:2, deliveryDefault:150, currency:"Rs" };

/* Two accounts: 'mian' is the full editor (can manage everything), 'admin' is
   view-only (can browse every page/tab but cannot add, edit, delete, or checkout). */
const USERS = [
  {username:"mian", password:"258000", role:"editor", name:"Mian Muhammad Dino", phone:"0317-2889755", email:"mian@mirchi365.pk"},
  {username:"admin", password:"123456", role:"viewer", name:"Admin", phone:"-", email:"-"},
];
let currentUser = null;
function isEditor(){ return currentUser && currentUser.role === 'editor'; }

/* -------------------------------------------------------------------------
   1. UTILITIES
   ------------------------------------------------------------------------- */
const $ = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>[...ctx.querySelectorAll(sel)];
const fmt = n => `${SETTINGS.currency} ${Math.round(n).toLocaleString('en-PK')}`;

function toast(msg, type="info"){
  const icons = {success:"fa-solid fa-circle-check", error:"fa-solid fa-circle-exclamation", info:"fa-solid fa-circle-info"};
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="${icons[type]}"></i><span>${msg}</span>`;
  $('#toastContainer').appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(30px)'; setTimeout(()=>el.remove(),300); }, 3200);
}

function animateCounter(el, target, prefix=""){
  const duration = 900; const start = performance.now();
  const from = 0;
  function step(t){
    const p = Math.min(1,(t-start)/duration);
    const val = Math.floor(from + (target-from)*(1-Math.pow(1-p,3)));
    el.textContent = prefix + val.toLocaleString('en-PK');
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* -------------------------------------------------------------------------
   2. LOADER
   ------------------------------------------------------------------------- */
window.addEventListener('load', ()=>{
  let pct = 0;
  const fill = $('#spiceFill');
  const iv = setInterval(()=>{
    pct += Math.random()*20+10;
    if(pct>=100){ pct=100; clearInterval(iv); }
    fill.style.width = pct+"%";
    if(pct>=100){
      setTimeout(()=>{ $('#loader').classList.add('fade-out'); }, 250);
    }
  }, 180);
});

/* -------------------------------------------------------------------------
   3. LOGIN
   ------------------------------------------------------------------------- */
$('#togglePass').addEventListener('click', ()=>{
  const pw = $('#password');
  const icon = $('#togglePass i');
  const show = pw.type === 'password';
  pw.type = show ? 'text' : 'password';
  icon.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
});

$('#forgotLink').addEventListener('click', e=>{ e.preventDefault(); $('#forgotPanel').classList.remove('hidden'); });
$('#closeForgot').addEventListener('click', ()=> $('#forgotPanel').classList.add('hidden'));
$('#sendResetBtn').addEventListener('click', ()=>{ toast('Reset request sent to shift manager','success'); $('#forgotPanel').classList.add('hidden'); });

$('#loginForm').addEventListener('submit', e=>{
  e.preventDefault();
  const u = $('#username').value.trim().toLowerCase();
  const p = $('#password').value.trim();
  const match = USERS.find(usr => usr.username === u && usr.password === p);
  if(match){
    currentUser = match;
    $('#loginError').classList.remove('show');
    $('#loginScreen').style.opacity = '0';
    $('#loginScreen').style.visibility = 'hidden';
    setTimeout(()=>{
      $('#loginScreen').classList.add('hidden');
      $('#app').classList.remove('hidden');
      initApp();
    }, 400);
  } else {
    $('#loginError').classList.add('show');
  }
});

function doLogout(){
  $('#app').classList.add('hidden');
  $('#loginScreen').classList.remove('hidden');
  requestAnimationFrame(()=>{ $('#loginScreen').style.opacity='1'; $('#loginScreen').style.visibility='visible'; });
  $('#password').value='';
  toast('Logged out successfully','info');
}
$('#logoutBtn').addEventListener('click', doLogout);
$('#profileLogout').addEventListener('click', e=>{ e.preventDefault(); doLogout(); });

/* -------------------------------------------------------------------------
   4. APP INIT
   ------------------------------------------------------------------------- */
let appInitialized = false;
function initApp(){
  applyRolePermissions();
  if(appInitialized) return; appInitialized = true;
  startClock();
  renderCategoryTabs();
  renderMenuGrid();
  renderCatTabsManage();
  renderMenuTable();
  renderCustomers();
  renderInventory();
  buildNotifications();
  updateDashboard();
  drawRevenueChart();
  drawReportChart();
  drawPaymentChart();
  renderOffers();
  updateTokenPreview();
  animateStatCounters();
}

function applyRolePermissions(){
  if(!currentUser) return;
  const editor = isEditor();
  document.body.classList.toggle('view-only', !editor);
  $('#cashierName').textContent = currentUser.name.split(' ')[0] || currentUser.username;
  $('#cashierRole').textContent = editor ? 'Editor' : 'Viewer';
  $('#avatarInitial').textContent = (currentUser.name || currentUser.username).charAt(0).toUpperCase();
  $('#roleBadge').classList.toggle('hidden', editor);
  $('#myProfileLink').classList.toggle('hidden', !editor);
  $('#profFullName').value = currentUser.name || '';
  $('#profPhone').value = currentUser.phone || '';
  $('#profEmail').value = currentUser.email || '';
  $('#profRole').value = editor ? 'Editor (full access)' : 'Viewer (view only)';
}

$('#myProfileLink').addEventListener('click', e=>{
  e.preventDefault();
  if(!isEditor()) return;
  $('#profileDropdown').classList.add('hidden');
  $('#myProfileModal').classList.remove('hidden');
});
$('#saveProfileBtn').addEventListener('click', ()=>{
  if(!isEditor()) return;
  currentUser.name = $('#profFullName').value.trim() || currentUser.name;
  currentUser.phone = $('#profPhone').value.trim();
  currentUser.email = $('#profEmail').value.trim();
  applyRolePermissions();
  closeModal('myProfileModal');
  toast('Profile updated successfully', 'success');
});

function startClock(){
  function tick(){
    const now = new Date();
    $('#topDate').textContent = now.toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
    $('#topTime').textContent = now.toLocaleTimeString('en-US');
  }
  tick(); setInterval(tick, 1000);
}

/* -------------------------------------------------------------------------
   5. SIDEBAR / NAVIGATION / TOPBAR
   ------------------------------------------------------------------------- */
function setSidebarOpen(open){
  $('#sidebar').classList.toggle('open', open);
  $('#sidebarBackdrop').classList.toggle('show', open && window.innerWidth<=800);
}

$('#sidebarToggle').addEventListener('click', ()=> setSidebarOpen(!$('#sidebar').classList.contains('open')));
$('#sidebarBackdrop').addEventListener('click', ()=> setSidebarOpen(false));

// Sidebar's own collapse button: on desktop it shrinks the sidebar to icon-only
// width; on mobile (where the sidebar slides in as an overlay) it simply closes it.
// Clicking again reverses the action, so it always toggles back and forth.
$('#sidebarCollapseBtn').addEventListener('click', ()=>{
  if(window.innerWidth <= 800){
    setSidebarOpen(false);
  } else {
    $('#sidebar').classList.toggle('collapsed');
  }
});

function goToPage(page){
  $$('.page').forEach(p=>p.classList.remove('active'));
  const target = $('#page-'+page);
  if(target) target.classList.add('active');
  $$('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.page===page));
  $('#sidebar').classList.remove('open');
  $('#sidebarBackdrop').classList.remove('show');
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('.nav-item').forEach(item=>{
  item.addEventListener('click', e=>{ e.preventDefault(); goToPage(item.dataset.page); });
});
$$('[data-page]').forEach(el=>{
  if(!el.classList.contains('nav-item')){
    el.addEventListener('click', e=>{ e.preventDefault(); goToPage(el.dataset.page); });
  }
});

$('#darkToggle').addEventListener('click', toggleTheme);
$('#settingsDark').addEventListener('change', toggleTheme);
function toggleTheme(){
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  $('#darkToggle').innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  $('#settingsDark').checked = !isLight;
  try{ localStorage.setItem('mirchi365-theme', isLight ? 'light' : 'dark'); }catch(e){}
}
function applySavedTheme(){
  let saved = null;
  try{ saved = localStorage.getItem('mirchi365-theme'); }catch(e){}
  const wantsLight = saved === 'light';
  document.body.classList.toggle('light', wantsLight);
  $('#darkToggle').innerHTML = wantsLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  $('#settingsDark').checked = !wantsLight;
}
applySavedTheme();

$('#notifBtn').addEventListener('click', ()=>{
  $('#notifDropdown').classList.toggle('hidden');
  $('#profileDropdown').classList.add('hidden');
  $('#notifDot').style.display='none';
});
$('#profileBtn').addEventListener('click', ()=>{
  $('#profileDropdown').classList.toggle('hidden');
  $('#notifDropdown').classList.add('hidden');
});
document.addEventListener('click', e=>{
  if(!e.target.closest('.notif-wrap')) $('#notifDropdown')?.classList.add('hidden');
  if(!e.target.closest('.profile-wrap')) $('#profileDropdown')?.classList.add('hidden');
});

function buildNotifications(){
  const items = [
    {icon:'fa-solid fa-triangle-exclamation', text:'Low stock: Cooking Oil (5 ltr left)'},
    {icon:'fa-solid fa-receipt', text:'Order #101 marked Ready for pickup'},
    {icon:'fa-solid fa-user-plus', text:'New customer Bilal Hussain registered'},
  ];
  $('#notifList').innerHTML = items.map(i=>`<div class="notif-item"><i class="${i.icon}"></i><span>${i.text}</span></div>`).join('');
}

/* -------------------------------------------------------------------------
   6. MENU GRID (NEW ORDER PAGE)
   ------------------------------------------------------------------------- */
function getCategories(){ return ["All", ...new Set(MENU.map(m=>m.cat))]; }

function renderCategoryTabs(){
  const wrap = $('#catTabs');
  wrap.innerHTML = getCategories().map(c=>
    `<button class="cat-tab ${c===activeCategory?'active':''}" data-cat="${c}">${c}</button>`
  ).join('');
  $$('.cat-tab', wrap).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeCategory = btn.dataset.cat;
      $$('.cat-tab', wrap).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderMenuGrid();
    });
  });
}

function stockLabel(s){ return s==='in' ? 'In Stock' : s==='low' ? 'Low Stock' : 'Out of Stock'; }

function renderMenuGrid(){
  const grid = $('#menuGrid');
  const search = ($('#menuSearch').value||'').toLowerCase();
  let items = MENU.filter(m => (activeCategory==='All' || m.cat===activeCategory) && m.name.toLowerCase().includes(search));
  if(items.length===0){ grid.innerHTML = `<div class="empty-cart" style="grid-column:1/-1"><i class="fa-solid fa-drumstick-bite"></i><p>No items found.</p></div>`; return; }
  grid.innerHTML = items.map(m=>`
    <div class="food-card glass" data-id="${m.id}">
      <i class="food-fav ${m.fav?'active fa-solid':'fa-regular'} fa-heart" data-fav="${m.id}"></i>
      <div class="food-img"><i class="${CATEGORY_ICONS[m.cat]||'fa-solid fa-utensils'}"></i></div>
      <h4>${m.name}</h4>
      <div class="food-meta">
        <span class="food-price">${fmt(m.price)}</span>
        <span class="stock-tag ${m.stock}">${stockLabel(m.stock)}</span>
      </div>
      <div class="food-actions">
        <button class="add-btn edit-only" data-add="${m.id}" ${m.stock==='out'?'disabled':''}>Add +</button>
        <button class="qv-btn" data-qv="${m.id}"><i class="fa-solid fa-eye"></i></button>
      </div>
    </div>
  `).join('');

  $$('[data-add]', grid).forEach(b=>b.addEventListener('click', ()=> addToCart(+b.dataset.add)));
  $$('[data-qv]', grid).forEach(b=>b.addEventListener('click', ()=> openQuickView(+b.dataset.qv)));
  $$('[data-fav]', grid).forEach(b=>b.addEventListener('click', e=>{
    e.stopPropagation();
    const item = MENU.find(m=>m.id===+b.dataset.fav);
    item.fav = !item.fav;
    renderMenuGrid();
  }));
}
$('#menuSearch').addEventListener('input', renderMenuGrid);

function openQuickView(id){
  const m = MENU.find(x=>x.id===id);
  $('#quickViewContent').innerHTML = `
    <button class="modal-close" onclick="closeModal('quickViewModal')"><i class="fa-solid fa-xmark"></i></button>
    <div class="food-img" style="height:140px;font-size:46px;margin-bottom:16px;">
      <i class="${CATEGORY_ICONS[m.cat]||'fa-solid fa-utensils'}"></i>
    </div>
    <h3>${m.name}</h3>
    <p class="muted" style="margin:8px 0 14px;">Category: ${m.cat}</p>
    <div class="food-meta" style="margin-bottom:16px;">
      <span class="food-price" style="font-size:18px;">${fmt(m.price)}</span>
      <span class="stock-tag ${m.stock}">${stockLabel(m.stock)}</span>
    </div>
    <button class="btn-primary full edit-only" ${m.stock==='out'?'disabled':''} onclick="addToCart(${m.id}); closeModal('quickViewModal');">Add to Cart</button>
  `;
  $('#quickViewModal').classList.remove('hidden');
}

/* -------------------------------------------------------------------------
   7. CART / BILLING
   ------------------------------------------------------------------------- */
function addToCart(id){
  const m = MENU.find(x=>x.id===id);
  if(!m || m.stock==='out') return;
  const existing = CART.find(c=>c.id===id);
  if(existing) existing.qty++;
  else CART.push({id:m.id,name:m.name,price:m.price,qty:1});
  renderCart();
  toast(`${m.name} added to cart`, 'success');
}

function renderCart(){
  const wrap = $('#cartItems');
  if(CART.length===0){
    wrap.innerHTML = `<div class="empty-cart"><i class="fa-solid fa-basket-shopping"></i><p>Cart is empty — add something spicy!</p></div>`;
  } else {
    wrap.innerHTML = CART.map(c=>`
      <div class="cart-item">
        <div class="cart-item-info"><h5>${c.name}</h5><span>${fmt(c.price)}</span></div>
        <div class="qty-control">
          <button class="edit-only" data-dec="${c.id}">−</button><b>${c.qty}</b><button class="edit-only" data-inc="${c.id}">+</button>
        </div>
        <i class="fa-solid fa-trash remove-item edit-only" data-remove="${c.id}"></i>
      </div>
    `).join('');
    $$('[data-inc]', wrap).forEach(b=>b.addEventListener('click', ()=>{ CART.find(c=>c.id==b.dataset.inc).qty++; renderCart(); }));
    $$('[data-dec]', wrap).forEach(b=>b.addEventListener('click', ()=>{
      const item = CART.find(c=>c.id==b.dataset.dec); item.qty--;
      if(item.qty<=0) CART = CART.filter(c=>c.id!==item.id);
      renderCart();
    }));
    $$('[data-remove]', wrap).forEach(b=>b.addEventListener('click', ()=>{ CART = CART.filter(c=>c.id!=b.dataset.remove); renderCart(); }));
  }
  computeTotals();
}

$('#clearCartBtn').addEventListener('click', ()=>{ if(!isEditor()) return; CART=[]; renderCart(); toast('Cart cleared','info'); });

function computeTotals(){
  const subtotal = CART.reduce((s,c)=>s+c.price*c.qty,0);
  const discVal = parseFloat($('#discountInput').value)||0;
  const discType = $('#discountType').value;
  const discount = discType==='pct' ? subtotal*discVal/100 : discVal;
  const taxable = Math.max(0, subtotal - discount);
  const gst = taxable * SETTINGS.taxPct/100;
  const service = taxable * SETTINGS.servicePct/100;
  const delivery = orderType==='Home Delivery' ? (parseFloat($('#deliveryInput').value)||0) : 0;
  const grand = taxable + gst + service + delivery;

  $('#sumSubtotal').textContent = fmt(subtotal);
  $('#sumGst').textContent = fmt(gst);
  $('#gstPctLabel').textContent = SETTINGS.taxPct;
  $('#sumService').textContent = fmt(service);
  $('#sumGrand').textContent = fmt(grand);
  return {subtotal, discount, gst, service, delivery, grand};
}
['input','change'].forEach(evt=>{
  $('#discountInput').addEventListener(evt, computeTotals);
  $('#discountType').addEventListener(evt, computeTotals);
  $('#deliveryInput').addEventListener(evt, computeTotals);
});

$$('.ot-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.ot-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    orderType = btn.dataset.type;
    $('#custAddress').classList.toggle('hidden-field', orderType!=='Home Delivery');
    $('#custTable').classList.toggle('hidden-field', orderType==='Home Delivery');
    computeTotals();
  });
});

function updateTokenPreview(){ $('#tokenPreview').textContent = '#'+(tokenCounter+1); }

/* -------------------------------------------------------------------------
   8. CHECKOUT / PAYMENT / RECEIPT
   ------------------------------------------------------------------------- */
$('#checkoutBtn').addEventListener('click', ()=>{
  if(CART.length===0){ toast('Add items to cart before checkout','error'); return; }
  const totals = computeTotals();
  $('#checkoutTotal').textContent = fmt(totals.grand);
  $('#checkoutModal').classList.remove('hidden');
});

$$('.pay-opt').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.pay-opt').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    selectedPayment = btn.dataset.pay;
  });
});

$('#confirmPaymentBtn').addEventListener('click', ()=>{
  const totals = computeTotals();
  tokenCounter++;
  const order = {
    token: tokenCounter,
    items: [...CART],
    customer: $('#custName').value || 'Walk-in Customer',
    phone: $('#custPhone').value || '-',
    address: $('#custAddress').value || '-',
    table: $('#custTable').value || '-',
    type: orderType,
    payment: selectedPayment,
    status: 'Pending',
    time: new Date(),
    ...totals
  };
  ORDERS.push(order);
  lastOrderForReceipt = order;

  // update customer record
  let cust = CUSTOMERS.find(c=>c.phone===order.phone);
  if(order.phone!=='-'){
    if(cust){ cust.orders++; cust.totalSpent += order.grand; cust.points += Math.round(order.grand/100); }
    else { CUSTOMERS.push({name:order.customer, phone:order.phone, orders:1, totalSpent:order.grand, points:Math.round(order.grand/100)}); }
  }

  // update stock roughly (decrement random chance to low/out) — cosmetic
  order.items.forEach(ci=>{
    const m = MENU.find(x=>x.id===ci.id);
    if(m && m.stock==='in' && Math.random()<0.08) m.stock='low';
  });

  CART = [];
  renderCart();
  renderMenuGrid();
  renderMenuTable();
  renderCustomers();
  closeModal('checkoutModal');
  buildReceipt(order);
  $('#receiptModal').classList.remove('hidden');
  renderKotBoard();
  updateDashboard();
  drawReportChart(); drawPaymentChart(); drawRevenueChart();
  renderPaymentsTable();
  updateTokenPreview();
  toast(`Order #${order.token} placed successfully`, 'success');
});

function buildReceipt(order){
  const itemsHtml = order.items.map(i=>`
    <div class="r-row"><span>${i.name} x${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>
  `).join('');
  $('#receiptContent').innerHTML = `
    <div class="receipt-center">
      <b style="font-size:15px;">MIRCHI 365</b><br>
      National Highway Gambat, Near New Nadra<br>
      0317-2889755 / 0312-3515342
    </div>
    <hr>
    <div class="r-row"><span>Token</span><span>#${order.token}</span></div>
    <div class="r-row"><span>Date</span><span>${order.time.toLocaleDateString('en-GB')}</span></div>
    <div class="r-row"><span>Time</span><span>${order.time.toLocaleTimeString('en-US')}</span></div>
    <div class="r-row"><span>Cashier</span><span>Admin</span></div>
    <div class="r-row"><span>Customer</span><span>${order.customer}</span></div>
    <div class="r-row"><span>Order Type</span><span>${order.type}</span></div>
    <hr>
    ${itemsHtml}
    <hr>
    <div class="r-row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
    <div class="r-row"><span>Discount</span><span>-${fmt(order.discount)}</span></div>
    <div class="r-row"><span>GST</span><span>${fmt(order.gst)}</span></div>
    <div class="r-row"><span>Service</span><span>${fmt(order.service)}</span></div>
    <div class="r-row"><span>Delivery</span><span>${fmt(order.delivery)}</span></div>
    <hr>
    <div class="r-row" style="font-size:14px;"><b>GRAND TOTAL</b><b>${fmt(order.grand)}</b></div>
    <div class="r-row"><span>Payment</span><span>${order.payment}</span></div>
    <hr>
    <div class="receipt-center">Thank you for dining with us! 🌶️<br>Visit again — Mirchi 365</div>
  `;
}

$('#printReceiptBtn').addEventListener('click', ()=>{
  const w = window.open('', '_blank', 'width=380,height=650');
  w.document.write(`<html><head><title>Receipt</title><style>
    body{font-family:'Courier New',monospace;font-size:12px;padding:16px;color:#000;}
    .r-row{display:flex;justify-content:space-between;} hr{border:none;border-top:1px dashed #000;margin:8px 0;}
    .receipt-center{text-align:center;}
  </style></head><body>${$('#receiptContent').innerHTML}</body></html>`);
  w.document.close(); w.focus(); w.print();
});
$('#downloadReceiptBtn').addEventListener('click', ()=>{
  toast('Preparing PDF download…', 'info');
  setTimeout(()=>{
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Mirchi365-Receipt-${lastOrderForReceipt?.token||''}</title></head><body>${$('#receiptContent').innerHTML}</body></html>`);
    w.document.close(); w.focus(); w.print();
  }, 400);
});

/* -------------------------------------------------------------------------
   9. MODALS (generic open/close)
   ------------------------------------------------------------------------- */
function closeModal(id){ $('#'+id).classList.add('hidden'); }
$$('.modal-close').forEach(b=>b.addEventListener('click', ()=>closeModal(b.dataset.close)));
$$('.modal-overlay').forEach(ov=>ov.addEventListener('click', e=>{ if(e.target===ov) ov.classList.add('hidden'); }));

/* -------------------------------------------------------------------------
   10. KITCHEN ORDER TICKETS (KOT)
   ------------------------------------------------------------------------- */
function renderKotBoard(){
  const cols = {Pending:'#kotPending', Preparing:'#kotPreparing', Ready:'#kotReady', Delivered:'#kotDelivered'};
  Object.values(cols).forEach(sel=> $(sel).innerHTML = '');
  const next = {Pending:'Preparing', Preparing:'Ready', Ready:'Delivered'};

  [...ORDERS].reverse().forEach(o=>{
    const itemsStr = o.items.map(i=>`${i.qty}x ${i.name}`).join(', ');
    const card = document.createElement('div');
    card.className = 'kot-card glass';
    card.innerHTML = `
      <div class="kot-card-head"><b>#${o.token}</b><small>${o.time.toLocaleTimeString('en-US')}</small></div>
      <div class="kot-items"><b>${o.type}</b>${o.table!=='-' ? ' · Table '+o.table : ''}<br>${itemsStr}</div>
      <div class="kot-actions">
        ${next[o.status] ? `<button class="edit-only" data-advance="${o.token}">Mark ${next[o.status]}</button>` : `<button disabled style="opacity:.5">Completed</button>`}
      </div>
    `;
    cols[o.status] && $(cols[o.status]).appendChild(card);
  });

  $$('[data-advance]').forEach(b=>b.addEventListener('click', ()=>{
    const order = ORDERS.find(o=>o.token==b.dataset.advance);
    const next = {Pending:'Preparing', Preparing:'Ready', Ready:'Delivered'};
    order.status = next[order.status] || order.status;
    renderKotBoard(); updateDashboard(); renderDashKot();
    toast(`Order #${order.token} → ${order.status}`, 'info');
  }));

  $('#kotBadge').textContent = ORDERS.filter(o=>o.status!=='Delivered').length;
  renderDashKot();
}

function renderDashKot(){
  const wrap = $('#dashKot');
  const active = [...ORDERS].filter(o=>o.status!=='Delivered').reverse().slice(0,6);
  wrap.innerHTML = active.length ? active.map(o=>`
    <div class="mini-kot-item"><span><b>#${o.token}</b> — ${o.type}</span><span class="pill ${o.status==='Pending'?'out':o.status==='Preparing'?'low':'in'}">${o.status}</span></div>
  `).join('') : `<p class="muted" style="padding:10px 0;">No active orders right now.</p>`;
}

/* -------------------------------------------------------------------------
   11. MENU MANAGEMENT TABLE
   ------------------------------------------------------------------------- */
function renderCatTabsManage(){
  const wrap = $('#catTabsMg');
  let mgCat = "All";
  wrap.innerHTML = getCategories().map(c=>`<button class="cat-tab ${c==='All'?'active':''}" data-mgcat="${c}">${c}</button>`).join('');
  $$('[data-mgcat]', wrap).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('[data-mgcat]', wrap).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderMenuTable(btn.dataset.mgcat);
    });
  });
}

function renderMenuTable(filterCat="All"){
  const search = ($('#menuMgSearch').value||'').toLowerCase();
  const items = MENU.filter(m=>(filterCat==='All'||m.cat===filterCat) && m.name.toLowerCase().includes(search));
  $('#menuTableBody').innerHTML = items.map(m=>`
    <tr>
      <td><div class="row-icon"><i class="${CATEGORY_ICONS[m.cat]||'fa-solid fa-utensils'}"></i></div></td>
      <td>${m.name}</td>
      <td>${m.cat}</td>
      <td>${fmt(m.price)}</td>
      <td>
        <select class="stock-select edit-only" data-stockselect="${m.id}">
          <option class="abcd" value="in" ${m.stock==='in'?'selected':''}>In Stock</option>
          <option class="abcd" value="low" ${m.stock==='low'?'selected':''}>Low Stock</option>
          <option class="abcd" value="out" ${m.stock==='out'?'selected':''}>Out of Stock</option>
        </select>
        <span class="pill ${m.stock} view-only-only">${stockLabel(m.stock)}</span>
      </td>
      <td>
        <i class="fa-solid fa-pen tbl-action edit-only" data-editmenu="${m.id}"></i>
        <i class="fa-solid fa-trash tbl-action edit-only" data-delmenu="${m.id}"></i>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px;">No items found.</td></tr>`;

  $$('[data-delmenu]').forEach(b=>b.addEventListener('click', ()=>{
    MENU = MENU.filter(m=>m.id!=b.dataset.delmenu);
    renderMenuTable(filterCat); renderMenuGrid();
    toast('Menu item removed', 'info');
  }));
  $$('[data-editmenu]').forEach(b=>b.addEventListener('click', ()=>{
    const m = MENU.find(x=>x.id==b.dataset.editmenu);
    const newPrice = prompt(`New price for ${m.name}:`, m.price);
    if(newPrice && !isNaN(newPrice)){ m.price = +newPrice; renderMenuTable(filterCat); renderMenuGrid(); toast('Price updated','success'); }
  }));
  // Changing stock status here immediately reflects in the New Order menu grid too,
  // since both read from the same shared MENU array.
  $$('[data-stockselect]').forEach(sel=>sel.addEventListener('change', ()=>{
    const m = MENU.find(x=>x.id==sel.dataset.stockselect);
    m.stock = sel.value;
    renderMenuGrid();
    updateDashboard();
    toast(`${m.name} stock set to "${stockLabel(m.stock)}"`, 'success');
  }));
}
$('#menuMgSearch').addEventListener('input', ()=> renderMenuTable());

/* -------------------------------------------------------------------------
   12. CUSTOMERS
   ------------------------------------------------------------------------- */
function renderCustomers(){
  $('#customerTableBody').innerHTML = CUSTOMERS.map(c=>`
    <tr>
      <td>${c.name}</td><td>${c.phone}</td><td>${c.orders}</td>
      <td>${fmt(c.totalSpent)}</td><td>${c.points} pts</td>
      <td><i class="fa-solid fa-eye tbl-action"></i><i class="fa-solid fa-trash tbl-action edit-only" data-delcust="${c.phone}"></i></td>
    </tr>
  `).join('');
  $$('[data-delcust]').forEach(b=>b.addEventListener('click', ()=>{
    CUSTOMERS = CUSTOMERS.filter(c=>c.phone!==b.dataset.delcust);
    renderCustomers();
    toast('Customer removed','info');
  }));
  animateStatCounters();
}
$('#addCustomerBtn').addEventListener('click', ()=> $('#customerModal').classList.remove('hidden'));
$('#saveCustomerBtn').addEventListener('click', ()=>{
  const name = $('#newCustName').value.trim();
  const phone = $('#newCustPhone').value.trim();
  if(!name || !phone){ toast('Name and phone are required','error'); return; }
  CUSTOMERS.push({name, phone, orders:0, totalSpent:0, points:0});
  renderCustomers(); closeModal('customerModal');
  $('#newCustName').value=''; $('#newCustPhone').value=''; $('#newCustAddress').value='';
  toast('Customer added','success');
});

/* -------------------------------------------------------------------------
   13. INVENTORY
   ------------------------------------------------------------------------- */
function invStatus(item){
  if(item.stock<=0) return 'out';
  if(item.stock<=5) return 'low';
  return 'in';
}
function renderInventory(){
  $('#inventoryTableBody').innerHTML = INVENTORY.map((it,idx)=>{
    const st = invStatus(it);
    return `
    <tr>
      <td>${it.name}</td><td>${it.stock}</td><td>${it.unit}</td><td>${it.supplier}</td>
      <td>${fmt(it.purchase)}</td><td>${it.selling?fmt(it.selling):'-'}</td>
      <td><span class="pill ${st}">${st==='in'?'Sufficient':st==='low'?'Low Stock':'Out of Stock'}</span></td>
      <td><i class="fa-solid fa-pen tbl-action edit-only" data-editinv="${idx}"></i><i class="fa-solid fa-trash tbl-action edit-only" data-delinv="${idx}"></i></td>
    </tr>`;
  }).join('');
  $$('[data-delinv]').forEach(b=>b.addEventListener('click', ()=>{
    INVENTORY.splice(+b.dataset.delinv,1); renderInventory(); toast('Inventory item removed','info');
  }));
  $$('[data-editinv]').forEach(b=>b.addEventListener('click', ()=>{
    const it = INVENTORY[+b.dataset.editinv];
    const newStock = prompt(`Update stock for ${it.name} (${it.unit}):`, it.stock);
    if(newStock!==null && !isNaN(newStock)){ it.stock = +newStock; renderInventory(); updateDashboard(); toast('Stock updated','success'); }
  }));
  $('#lowStockCount').dataset.counter = INVENTORY.filter(it=>invStatus(it)!=='in').length;
}
$('#addStockBtn').addEventListener('click', ()=> $('#stockModal').classList.remove('hidden'));
$('#saveStockBtn').addEventListener('click', ()=>{
  const name = $('#newStockName').value.trim();
  if(!name){ toast('Ingredient name required','error'); return; }
  INVENTORY.push({
    name, stock:+$('#newStockQty').value||0, unit:$('#newStockUnit').value||'pcs',
    supplier:$('#newStockSupplier').value||'-', purchase:+$('#newStockPurchase').value||0, selling:+$('#newStockSelling').value||0
  });
  renderInventory(); closeModal('stockModal');
  ['newStockName','newStockQty','newStockUnit','newStockSupplier','newStockPurchase','newStockSelling'].forEach(id=>$('#'+id).value='');
  toast('Inventory item added','success');
});

/* -------------------------------------------------------------------------
   14. PAYMENTS PAGE
   ------------------------------------------------------------------------- */
$$('.copy-btn').forEach(b=>b.addEventListener('click', ()=>{
  navigator.clipboard?.writeText(b.dataset.copy).then(()=> toast('Copied to clipboard','success')).catch(()=> toast('Copy failed','error'));
}));
function renderPaymentsTable(){
  $('#paymentsTableBody').innerHTML = [...ORDERS].reverse().map(o=>`
    <tr><td>#${o.token}</td><td>${o.customer}</td><td>${o.payment}</td><td>${fmt(o.grand)}</td>
    <td><span class="pill in">Paid</span></td></tr>
  `).join('') || `<tr><td colspan="5" class="muted" style="text-align:center;padding:20px;">No transactions yet.</td></tr>`;
}

/* -------------------------------------------------------------------------
   15. DASHBOARD STATS + CANVAS CHARTS
   ------------------------------------------------------------------------- */
function updateDashboard(){
  const todaySales = ORDERS.reduce((s,o)=>s+o.grand,0);
  const todayOrders = ORDERS.length;
  const pending = ORDERS.filter(o=>o.status!=='Delivered').length;
  const completed = ORDERS.filter(o=>o.status==='Delivered').length;
  const itemCount = {};
  ORDERS.forEach(o=>o.items.forEach(i=>{ itemCount[i.name]=(itemCount[i.name]||0)+i.qty; }));
  const best = Object.entries(itemCount).sort((a,b)=>b[1]-a[1])[0];

  const stats = $$('.stat-card h3');
  stats[0].dataset.target = todaySales; stats[0].dataset.prefix='Rs ';
  stats[1].dataset.target = todayOrders;
  stats[2].dataset.target = CUSTOMERS.length;
  stats[3].dataset.target = pending;
  stats[4].dataset.target = completed;
  stats[5].dataset.target = todaySales; stats[5].dataset.prefix='Rs ';
  $('#bestSeller').textContent = best ? best[0] : '—';
  stats[7].dataset.target = INVENTORY.filter(it=>invStatus(it)!=='in').length;

  animateStatCounters();
  renderKotBoard();
}

function animateStatCounters(){
  $$('.stat-card h3[data-target]').forEach(el=>{
    animateCounter(el, +el.dataset.target||0, el.dataset.prefix||"");
  });
  const cCard = $$('.stat-card')[2]?.querySelector('h3');
  if(cCard && !cCard.dataset.target) animateCounter(cCard, CUSTOMERS.length);
}

function drawBarChart(canvasId, labels, data, gradientColors){
  const canvas = $('#'+canvasId); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio||1;
  const w = canvas.clientWidth||canvas.parentElement.clientWidth, h = 220;
  canvas.width = w*dpr; canvas.height = h*dpr; ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,w,h);
  const max = Math.max(...data,1);
  const barW = w/data.length*0.55;
  const gap = w/data.length;
  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, gradientColors[0]); grad.addColorStop(1, gradientColors[1]);
  data.forEach((v,i)=>{
    const barH = (v/max) * (h-40);
    const x = i*gap + (gap-barW)/2;
    const y = h-30-barH;
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(154,154,168,0.9)';
    ctx.font = '11px Inter'; ctx.textAlign='center';
    ctx.fillText(labels[i], x+barW/2, h-12);
  });
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function drawRevenueChart(){
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const base = [4200,5100,3900,6200,7300,9100,ORDERS.reduce((s,o)=>s+o.grand,0)||4800];
  drawBarChart('revenueChart', days, base, ['#ffb703','#e63946']);
}
function drawReportChart(){
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const base = [4200,5100,3900,6200,7300,9100,ORDERS.reduce((s,o)=>s+o.grand,0)||4800];
  drawBarChart('reportChart', days, base, ['#ffd166','#ff5a5f']);
}
function drawPaymentChart(){
  const methods = ['Cash','Easypaisa','JazzCash','Bank','Card'];
  const counts = methods.map(m=>ORDERS.filter(o=>o.payment===m || (m==='Bank'&&o.payment==='Bank Transfer')).length || Math.round(Math.random()*3));
  drawBarChart('paymentChart', methods, counts, ['#f4f4f7','#ffb703']);
}

function renderTopLists(){
  const itemCount = {};
  ORDERS.forEach(o=>o.items.forEach(i=>{ itemCount[i.name]=(itemCount[i.name]||0)+i.qty; }));
  const top = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
  $('#topItemsList').innerHTML = top.length ? top.map(([n,q])=>`<div class="mini-kot-item"><span>${n}</span><b>${q} sold</b></div>`).join('')
    : `<p class="muted">No sales data yet today.</p>`;

  const topCust = [...CUSTOMERS].sort((a,b)=>b.totalSpent-a.totalSpent).slice(0,6);
  $('#topCustomersList').innerHTML = topCust.map(c=>`<div class="mini-kot-item"><span>${c.name}</span><b>${fmt(c.totalSpent)}</b></div>`).join('');
}
$$('.range-btn').forEach(b=>b.addEventListener('click', ()=>{
  $$('.range-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  drawReportChart(); renderTopLists();
}));

/* -------------------------------------------------------------------------
   16. OFFERS & DISCOUNTS (dynamic, with Add/Delete)
   ------------------------------------------------------------------------- */
let OFFERS = [
  {id:1, tag:'', title:'Family Feast', desc:'4 Burgers + 2 Pizza + 4 Drinks', price:3499, oldPrice:4200, deadline:null},
  {id:2, tag:'red', title:'Celebration Combo', desc:'2 Pizza + Cake Voucher + Free Delivery', price:2999, oldPrice:null, deadline:null},
  {id:3, tag:'yellow', title:'MIRCHI10', desc:'Flat 10% off on orders above Rs 1,500', price:null, oldPrice:null, deadline:(()=>{ const d=new Date(); d.setHours(23,59,59,999); return d; })()},
];
let offerIdCounter = 3;

function offerTagLabel(tag){ return tag==='red' ? 'BIRTHDAY PACKAGE' : tag==='yellow' ? 'PROMO CODE' : 'PARTY PACKAGE'; }

function renderOffers(){
  const wrap = $('#offerGrid');
  if(!wrap) return;
  wrap.innerHTML = OFFERS.map(o=>{
    const priceHtml = o.price ? `<div class="offer-price">${fmt(o.price)} ${o.oldPrice?`<s>${fmt(o.oldPrice)}</s>`:''}</div>` : '';
    const countdownHtml = o.deadline ? `<div class="countdown" data-deadline="${new Date(o.deadline).toISOString()}">Ends in --:--:--</div>` : '';
    const addBtnHtml = o.price ? `<button class="btn-primary full offer-add-btn edit-only" data-addoffer="${o.id}"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>` : '';
    return `
    <div class="offer-card glass">
      <button class="modal-close edit-only" data-deloffer="${o.id}" title="Remove offer"><i class="fa-solid fa-trash"></i></button>
      <span class="offer-tag ${o.tag}">${offerTagLabel(o.tag)}</span>
      <h3>${o.title}</h3>
      <p>${o.desc}</p>
      ${priceHtml}
      ${countdownHtml}
      ${addBtnHtml}
    </div>`;
  }).join('') || `<div class="muted" style="padding:20px;">No offers running right now — add one!</div>`;

  $$('[data-deloffer]', wrap).forEach(b=>b.addEventListener('click', ()=>{
    OFFERS = OFFERS.filter(o=>o.id != b.dataset.deloffer);
    renderOffers();
    toast('Offer removed', 'info');
  }));
  $$('[data-addoffer]', wrap).forEach(b=>b.addEventListener('click', ()=> addOfferToCart(+b.dataset.addoffer)));
  tickOfferCountdowns();
}

function addOfferToCart(offerId){
  const o = OFFERS.find(x=>x.id===offerId);
  if(!o || !o.price) return;
  const cartId = 'offer-'+o.id;
  const existing = CART.find(c=>c.id===cartId);
  if(existing) existing.qty++;
  else CART.push({id:cartId, name:o.title+' (Offer)', price:o.price, qty:1});
  renderCart();
  toast(`${o.title} added to cart`, 'success');
}

$('#addOfferBtn').addEventListener('click', ()=> $('#offerModal').classList.remove('hidden'));

$('#saveOfferBtn').addEventListener('click', ()=>{
  const title = $('#newOfferTitle').value.trim();
  const desc = $('#newOfferDesc').value.trim();
  if(!title || !desc){ toast('Title and description are required', 'error'); return; }

  let deadline = null;
  const cd = $('#newOfferCountdown').value;
  if(cd==='today'){ deadline = new Date(); deadline.setHours(23,59,59,999); }
  else if(cd==='3' || cd==='7'){ deadline = new Date(Date.now() + (+cd)*86400000); }

  offerIdCounter++;
  OFFERS.push({
    id: offerIdCounter,
    tag: $('#newOfferTag').value,
    title, desc,
    price: +$('#newOfferPrice').value || null,
    oldPrice: +$('#newOfferOldPrice').value || null,
    deadline
  });

  renderOffers();
  closeModal('offerModal');
  ['newOfferTitle','newOfferDesc','newOfferPrice','newOfferOldPrice'].forEach(id=>{ $('#'+id).value=''; });
  $('#newOfferTag').value=''; $('#newOfferCountdown').value='none';
  toast('Offer added successfully', 'success');
});

function tickOfferCountdowns(){
  $$('.countdown[data-deadline]').forEach(el=>{
    const end = new Date(el.dataset.deadline);
    const diff = end - new Date();
    if(diff<=0){ el.textContent='Offer ended'; return; }
    const h = String(Math.floor(diff/3600000)).padStart(2,'0');
    const m = String(Math.floor(diff/60000)%60).padStart(2,'0');
    const s = String(Math.floor(diff/1000)%60).padStart(2,'0');
    el.textContent = `Ends in ${h}:${m}:${s}`;
  });
}
setInterval(tickOfferCountdowns, 1000);

/* -------------------------------------------------------------------------
   17. SETTINGS
   ------------------------------------------------------------------------- */
$('#saveSettingsBtn').addEventListener('click', ()=>{
  SETTINGS.taxPct = +$('#setTax').value || 5;
  SETTINGS.servicePct = +$('#setService').value || 2;
  SETTINGS.deliveryDefault = +$('#setDelivery').value || 0;
  $('#deliveryInput').value = SETTINGS.deliveryDefault;
  computeTotals();
  toast('Settings saved successfully','success');
});
$('#langSelect').addEventListener('change', e=>{
  toast(`Interface language set to ${e.target.value} (demo)`, 'info');
});

/* -------------------------------------------------------------------------
   18. BACK TO TOP
   ------------------------------------------------------------------------- */
window.addEventListener('scroll', ()=>{
  $('#backToTop').classList.toggle('hidden', window.scrollY < 400);
});
$('#backToTop').addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));

/* -------------------------------------------------------------------------
   19. INITIAL RENDER OF DASH TOP LISTS AFTER APP LOADS
   ------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderTopLists();
  renderPaymentsTable();
});
