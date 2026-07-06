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

$('#loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const u = $('#username').value.trim().toLowerCase();
  const p = $('#password').value.trim();
  const match = USERS.find(usr => usr.username === u && usr.password === p);
  if(match){
    currentUser = match;
    try{
      const savedProfile = await ProfileManager.findByUsername(match.username);
      if(savedProfile) Object.assign(currentUser, { name: savedProfile.name, phone: savedProfile.phone, email: savedProfile.email });
    }catch(err){ console.error(err); }
    try{ localStorage.setItem('mirchi365-session', match.username); }catch(e){}
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
  currentUser = null;
  try{ localStorage.removeItem('mirchi365-session'); }catch(e){}
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
$('#saveProfileBtn').addEventListener('click', async ()=>{
  if(!isEditor()) return;
  currentUser.name = $('#profFullName').value.trim() || currentUser.name;
  currentUser.phone = $('#profPhone').value.trim();
  currentUser.email = $('#profEmail').value.trim();
  try{ await ProfileManager.save(currentUser.username, { name: currentUser.name, phone: currentUser.phone, email: currentUser.email }); }
  catch(err){ console.error(err); toast('Could not save profile.', 'error'); return; }
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
    try{ localStorage.setItem('mirchi365-sidebar', $('#sidebar').classList.contains('collapsed') ? 'collapsed' : 'expanded'); }catch(e){}
  }
  setTimeout(()=>{ if(appInitialized){ drawRevenueChart(); drawReportChart(); drawPaymentChart(); } }, 400);
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

let NOTIFICATIONS = [];

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

async function buildNotifications(){
  try{
    NOTIFICATIONS = await NotificationManager.getAll();
    if(NOTIFICATIONS.length === 0){
      const seed = [
        {icon:'fa-solid fa-triangle-exclamation', text:'Low stock: Cooking Oil (5 ltr left)'},
        {icon:'fa-solid fa-receipt', text:'Order #101 marked Ready for pickup'},
        {icon:'fa-solid fa-user-plus', text:'New customer Bilal Hussain registered'},
      ];
      for(const s of seed) await NotificationManager.add(s.text, s.icon);
      NOTIFICATIONS = await NotificationManager.getAll();
    }
    renderNotificationsList();
  }catch(err){
    console.error('Loading notifications failed:', err);
  }
}

function renderNotificationsList(){
  NOTIFICATIONS.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
  const list = $('#notifList');
  list.innerHTML = NOTIFICATIONS.length ? NOTIFICATIONS.map(i=>`
    <div class="notif-item" data-notifid="${i.id}" data-notifpage="${i.page||''}">
      <i class="${i.icon}"></i><span>${i.text}</span>
      <button class="notif-dismiss" data-notifdismiss="${i.id}" title="Dismiss"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('') : `<p class="muted" style="padding:14px;text-align:center;">No notifications right now.</p>`;

  $$('.notif-item', list).forEach(el=>{
    el.addEventListener('click', ()=>{
      const page = el.dataset.notifpage;
      if(page){ goToPage(page); $('#notifDropdown').classList.add('hidden'); }
    });
  });
  $$('[data-notifdismiss]', list).forEach(btn=>{
    btn.addEventListener('click', async e=>{
      e.stopPropagation();
      await removeNotification(+btn.dataset.notifdismiss);
    });
  });
}

/** Persists a new alert, pins it to the top of the bell dropdown, and lights up the badge dot.
    meta: { page, refType, refId } — see NotificationManager.add for details. */
async function addNotification(text, icon, meta = {}){
  try{
    const record = await NotificationManager.add(text, icon, meta);
    NOTIFICATIONS.unshift(record);
    renderNotificationsList();
    $('#notifDot').style.display = 'block';
  }catch(err){
    console.error('Saving notification failed:', err);
  }
}

async function removeNotification(id){
  try{ await NotificationManager.delete(id); }catch(err){ console.error(err); }
  NOTIFICATIONS = NOTIFICATIONS.filter(n=>n.id!==id);
  renderNotificationsList();
}

$('#clearAllNotifsBtn').addEventListener('click', async ()=>{
  try{ await NotificationManager.clearAll(); }catch(err){ console.error(err); }
  NOTIFICATIONS = [];
  renderNotificationsList();
  $('#notifDot').style.display = 'none';
});

/** Removes any notification(s) that referenced this exact thing, now that it's resolved
    (e.g. stock is back to "in", or an order has been Delivered). */
async function autoClearNotifications(refType, refId){
  const matches = NOTIFICATIONS.filter(n=>n.refType===refType && n.refId===refId);
  if(matches.length === 0) return;
  for(const m of matches){
    try{ await NotificationManager.delete(m.id); }catch(err){ console.error(err); }
  }
  NOTIFICATIONS = NOTIFICATIONS.filter(n=>!(n.refType===refType && n.refId===refId));
  renderNotificationsList();
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
  $$('[data-fav]', grid).forEach(b=>b.addEventListener('click', async e=>{
    e.stopPropagation();
    const item = MENU.find(m=>m.id===+b.dataset.fav);
    item.fav = !item.fav;
    try{ await MenuManager.update(item); }catch(err){ console.error(err); }
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
    const emptyMsg = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]) ? TRANSLATIONS[currentLang].cart_empty : 'Cart is empty — add something spicy!';
    wrap.innerHTML = `<div class="empty-cart"><i class="fa-solid fa-basket-shopping"></i><p>${emptyMsg}</p></div>`;
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

$('#confirmPaymentBtn').addEventListener('click', async ()=>{
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

  try{
    // 1. Save to IndexedDB first (order + kitchen ticket + customer + payment record).
    const saved = await OrderManager.add(order);
    order.id = saved.id;
    const custResult = await CustomerManager.recordOrder(order.phone, order.customer, order.grand);
    await PaymentManager.logPayment(order);

    if(custResult && custResult.isNew){
      addNotification(`New customer ${custResult.record.name} registered`, 'fa-solid fa-user-plus', { page:'customers', refType:'customer', refId: custResult.record.phone });
    }

    // Stock roughly decrements (cosmetic) — persist any change that happens.
    for(const ci of order.items){
      const m = MENU.find(x=>x.id===ci.id);
      if(m && m.stock==='in' && Math.random()<0.08){
        m.stock = 'low';
        await MenuManager.update(m);
        addNotification(`${m.name} is running Low on Stock`, 'fa-solid fa-triangle-exclamation', { page:'menu', refType:'stock', refId:m.id });
      }
    }
  }catch(err){
    console.error('Checkout save failed:', err);
    toast('Could not save this order — please try again.', 'error');
    return; // Never print/generate a receipt if the database save failed.
  }

  // 2. Only now that the save succeeded: refresh in-memory state + UI.
  ORDERS.push(order);
  lastOrderForReceipt = order;
  CUSTOMERS = await CustomerManager.getAll();

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
  saveReceiptToBlob(order);
});

// Sends the receipt to /api/save-receipt, which uses @vercel/blob on the
// server to store it. Only works once this project is deployed on Vercel
// with a Blob store connected — fails silently otherwise (e.g. when the
// files are just opened locally in a browser), so it never breaks the POS.
function saveReceiptToBlob(order){
  fetch('/api/save-receipt', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(order)
  }).catch(()=>{ /* no backend available in this environment — ignore */ });
}

function buildReceipt(order){
  $('#receiptContent').innerHTML = ReceiptManager.build(order, fmt);
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

  $$('[data-advance]').forEach(b=>b.addEventListener('click', async ()=>{
    const order = ORDERS.find(o=>o.token==b.dataset.advance);
    const next = {Pending:'Preparing', Preparing:'Ready', Ready:'Delivered'};
    order.status = next[order.status] || order.status;
    try{ await OrderManager.updateStatus(order); }catch(err){ console.error(err); toast('Could not save status update.', 'error'); }
    renderKotBoard(); updateDashboard(); renderDashKot();
    toast(`Order #${order.token} → ${order.status}`, 'info');
    if(order.status === 'Ready'){
      addNotification(`Order #${order.token} is Ready for pickup/serving`, 'fa-solid fa-bell', { page:'kitchen', refType:'kitchen', refId:order.token });
    } else if(order.status === 'Delivered'){
      autoClearNotifications('kitchen', order.token);
    }
  }));

  $('#kotBadge').textContent = ORDERS.filter(o=>o.status!=='Delivered').length;
  renderDashKot();
}

$('#clearDeliveredBtn').addEventListener('click', async ()=>{
  const delivered = ORDERS.filter(o=>o.status==='Delivered');
  if(delivered.length === 0){ toast('No delivered orders to clear', 'info'); return; }
  try{
    for(const o of delivered) await OrderManager.delete(o);
  }catch(err){
    console.error(err); toast('Could not clear delivered orders.', 'error'); return;
  }
  ORDERS = ORDERS.filter(o=>o.status!=='Delivered');
  renderKotBoard();
  updateDashboard();
  renderPaymentsTable();
  drawReportChart(); drawPaymentChart(); drawRevenueChart(); renderTopLists();
  toast(`${delivered.length} delivered order(s) cleared`, 'success');
});

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

  $$('[data-delmenu]').forEach(b=>b.addEventListener('click', async ()=>{
    const m = MENU.find(x=>x.id==b.dataset.delmenu);
    try{ if(m) await MenuManager.delete(m.id); }catch(err){ console.error(err); toast('Could not delete item.', 'error'); return; }
    MENU = MENU.filter(m=>m.id!=b.dataset.delmenu);
    renderMenuTable(filterCat); renderMenuGrid();
    toast('Menu item removed', 'info');
  }));
  $$('[data-editmenu]').forEach(b=>b.addEventListener('click', async ()=>{
    const m = MENU.find(x=>x.id==b.dataset.editmenu);
    const newPrice = prompt(`New price for ${m.name}:`, m.price);
    if(newPrice && !isNaN(newPrice)){
      m.price = +newPrice;
      try{ await MenuManager.update(m); }catch(err){ console.error(err); toast('Could not save price.', 'error'); return; }
      renderMenuTable(filterCat); renderMenuGrid(); toast('Price updated','success');
    }
  }));
  // Changing stock status here immediately reflects in the New Order menu grid too,
  // since both read from the same shared MENU array.
  $$('[data-stockselect]').forEach(sel=>sel.addEventListener('change', async ()=>{
    const m = MENU.find(x=>x.id==sel.dataset.stockselect);
    m.stock = sel.value;
    try{ await MenuManager.update(m); }catch(err){ console.error(err); toast('Could not save stock status.', 'error'); return; }
    renderMenuGrid();
    updateDashboard();
    toast(`${m.name} stock set to "${stockLabel(m.stock)}"`, 'success');
    if(m.stock==='out'){
      addNotification(`${m.name} is now Out of Stock`, 'fa-solid fa-circle-exclamation', { page:'menu', refType:'stock', refId:m.id });
    } else if(m.stock==='low'){
      addNotification(`${m.name} is running Low on Stock`, 'fa-solid fa-triangle-exclamation', { page:'menu', refType:'stock', refId:m.id });
    } else {
      autoClearNotifications('stock', m.id);
    }
  }));
}
$('#menuMgSearch').addEventListener('input', ()=> renderMenuTable());

$('#addMenuItemBtn').addEventListener('click', ()=>{
  $('#categoryList').innerHTML = getCategories().filter(c=>c!=='All').map(c=>`<option value="${c}"></option>`).join('');
  $('#menuItemModal').classList.remove('hidden');
});

$('#saveMenuItemBtn').addEventListener('click', async ()=>{
  const name = $('#newItemName').value.trim();
  const cat = $('#newItemCat').value.trim();
  const price = +$('#newItemPrice').value;
  if(!name || !cat || !price){ toast('Item name, category and price are required', 'error'); return; }

  const newItem = { name, cat, price, stock:$('#newItemStock').value, fav:false };
  let result;
  try{ result = await MenuManager.add(newItem); }
  catch(err){ console.error(err); toast('Could not save menu item.', 'error'); return; }

  if(!result.ok){ toast(`"${name}" already exists in ${cat}.`, 'error'); return; }

  MENU.push(result.record);
  renderCategoryTabs();
  renderCatTabsManage();
  renderMenuGrid();
  renderMenuTable();
  closeModal('menuItemModal');
  ['newItemName','newItemCat','newItemPrice'].forEach(id=>{ $('#'+id).value=''; });
  $('#newItemStock').value='in';
  toast(`${name} added to menu`, 'success');
});

/* -------------------------------------------------------------------------
   12. CUSTOMERS
   ------------------------------------------------------------------------- */
function renderCustomers(){
  $('#customerTableBody').innerHTML = CUSTOMERS.map(c=>`
    <tr>
      <td>${c.name}</td><td>${c.phone}</td><td>${c.orders}</td>
      <td>${fmt(c.totalSpent)}</td><td>${c.points} pts</td>
      <td><i class="fa-solid fa-eye tbl-action" data-viewcust="${c.phone}"></i><i class="fa-solid fa-trash tbl-action edit-only" data-delcust="${c.phone}"></i></td>
    </tr>
  `).join('');
  $$('[data-viewcust]').forEach(b=>b.addEventListener('click', ()=> openCustomerHistory(b.dataset.viewcust)));
  $$('[data-delcust]').forEach(b=>b.addEventListener('click', async ()=>{
    const cust = CUSTOMERS.find(c=>c.phone===b.dataset.delcust);
    try{ if(cust && cust.id) await CustomerManager.delete(cust.id); }catch(err){ console.error(err); toast('Could not delete customer.', 'error'); return; }
    CUSTOMERS = CUSTOMERS.filter(c=>c.phone!==b.dataset.delcust);
    renderCustomers();
    toast('Customer removed','info');
  }));
  animateStatCounters();
}

/** Shows every separate order (slip) a customer has placed, most recent first. */
function openCustomerHistory(phone){
  const cust = CUSTOMERS.find(c=>c.phone===phone);
  if(!cust) return;
  const orders = ORDERS.filter(o=>o.phone===phone).sort((a,b)=> new Date(b.time) - new Date(a.time));

  $('#customerHistoryMeta').innerHTML = `<b style="color:var(--white)">${cust.name}</b> · ${cust.phone} · ${cust.orders} orders · ${fmt(cust.totalSpent)} total spent`;
  $('#customerHistoryList').innerHTML = orders.length ? orders.map(o=>{
    const time = new Date(o.time);
    const itemsStr = o.items.map(i=>`${i.qty}x ${i.name}`).join(', ');
    return `
      <div class="order-slip">
        <div class="order-slip-head"><b>#${o.token}</b><small>${time.toLocaleDateString('en-GB')} · ${time.toLocaleTimeString('en-US')}</small></div>
        <div class="order-slip-items">${o.type} · ${itemsStr}</div>
        <div class="order-slip-total"><span>Payment: ${o.payment}</span><b>${fmt(o.grand)}</b></div>
      </div>
    `;
  }).join('') : `<p class="muted" style="text-align:center;padding:20px;">No orders found for this customer yet.</p>`;

  $('#customerHistoryModal').classList.remove('hidden');
}

/* ---- Customers export (PDF via print dialog, Word via a .doc download) ---- */
function buildCustomersReportHTML(){
  const rows = CUSTOMERS.map(c=>`
    <tr>
      <td style="padding:6px 10px;border:1px solid #ddd;">${c.name}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;">${c.phone}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;">${c.orders}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;">${fmt(c.totalSpent)}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;">${c.points}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="padding:8px;border:1px solid #ddd;color:#888;">No customers yet.</td></tr>`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:700px;margin:0 auto;">
      <h1 style="color:#e63946;margin-bottom:0;">MIRCHI 365</h1>
      <p style="margin-top:4px;color:#555;">Customer List — generated ${new Date().toLocaleString('en-GB')}</p>
      <hr style="border:none;border-top:2px solid #e63946;margin:14px 0;">
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Name</th>
          <th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Mobile Number</th>
          <th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Orders Placed</th>
          <th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Total Spent</th>
          <th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Reward Points</th>
        </tr>
        ${rows}
      </table>
    </div>
  `;
}
$('#downloadCustPdfBtn').addEventListener('click', ()=>{
  const html = buildCustomersReportHTML();
  const w = window.open('', '_blank', 'width=800,height=900');
  w.document.write(`<html><head><title>Mirchi365-Customers</title></head><body>${html}</body></html>`);
  w.document.close(); w.focus();
  setTimeout(()=> w.print(), 300);
  toast('Preparing customer list PDF…', 'info');
});
$('#downloadCustWordBtn').addEventListener('click', ()=>{
  const html = buildCustomersReportHTML();
  const fullDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>Mirchi365-Customers</title></head><body>${html}</body></html>`;
  const blob = new Blob(['\ufeff', fullDoc], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Mirchi365-Customers-${new Date().toISOString().slice(0,10)}.doc`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Word file downloaded', 'success');
});
$('#addCustomerBtn').addEventListener('click', ()=> $('#customerModal').classList.remove('hidden'));
$('#saveCustomerBtn').addEventListener('click', async ()=>{
  const name = $('#newCustName').value.trim();
  const phone = $('#newCustPhone').value.trim();
  if(!name || !phone){ toast('Name and phone are required','error'); return; }

  let result;
  try{ result = await CustomerManager.add({ name, phone, orders:0, totalSpent:0, points:0 }); }
  catch(err){ console.error(err); toast('Could not save customer.', 'error'); return; }

  if(!result.ok){ toast('A customer with this phone number already exists.', 'error'); return; }

  CUSTOMERS.push(result.record);
  renderCustomers(); closeModal('customerModal');
  $('#newCustName').value=''; $('#newCustPhone').value=''; $('#newCustAddress').value='';
  toast('Customer added','success');
  addNotification(`New customer ${name} registered`, 'fa-solid fa-user-plus', { page:'customers', refType:'customer', refId: phone });
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
  $$('[data-delinv]').forEach(b=>b.addEventListener('click', async ()=>{
    const it = INVENTORY[+b.dataset.delinv];
    try{ if(it.id) await InventoryManager.delete(it.id); }catch(err){ console.error(err); toast('Could not delete item.', 'error'); return; }
    INVENTORY.splice(+b.dataset.delinv,1); renderInventory(); toast('Inventory item removed','info');
  }));
  $$('[data-editinv]').forEach(b=>b.addEventListener('click', async ()=>{
    const it = INVENTORY[+b.dataset.editinv];
    const newStock = prompt(`Update stock for ${it.name} (${it.unit}):`, it.stock);
    if(newStock!==null && !isNaN(newStock)){
      it.stock = +newStock;
      try{ await InventoryManager.update(it); }catch(err){ console.error(err); toast('Could not save stock update.', 'error'); return; }
      renderInventory(); updateDashboard(); toast('Stock updated','success');
    }
  }));
  $('#lowStockCount').dataset.counter = INVENTORY.filter(it=>invStatus(it)!=='in').length;
}
$('#addStockBtn').addEventListener('click', ()=> $('#stockModal').classList.remove('hidden'));
$('#saveStockBtn').addEventListener('click', async ()=>{
  const name = $('#newStockName').value.trim();
  if(!name){ toast('Ingredient name required','error'); return; }

  const newItem = {
    name, stock:+$('#newStockQty').value||0, unit:$('#newStockUnit').value||'pcs',
    supplier:$('#newStockSupplier').value||'-', purchase:+$('#newStockPurchase').value||0, selling:+$('#newStockSelling').value||0
  };
  let result;
  try{ result = await InventoryManager.add(newItem); }
  catch(err){ console.error(err); toast('Could not save item.', 'error'); return; }

  if(!result.ok){ toast('This ingredient already exists in inventory.', 'error'); return; }

  INVENTORY.push(result.record);
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
  const w = canvas.clientWidth || canvas.parentElement.clientWidth || 300, h = 220;
  // Bitmap resolution scales with devicePixelRatio for crispness, but the CSS
  // display size must stay at the logical (w,h) — otherwise the chart renders
  // dpr-times too wide on any screen with scaling (virtually all phones/laptops).
  canvas.width = w*dpr; canvas.height = h*dpr;
  canvas.style.width = w+'px'; canvas.style.height = h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
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

// Charts are drawn onto a fixed-resolution <canvas>, so they must be redrawn
// whenever the viewport size changes (resize, orientation change, sidebar
// collapse/expand) or they'd stay locked to whatever size they were first
// measured at — this is what was making the Dashboard/Reports charts look
// wrong after the layout settled on PC and mobile.
let _chartResizeTimer = null;
window.addEventListener('resize', ()=>{
  clearTimeout(_chartResizeTimer);
  _chartResizeTimer = setTimeout(()=>{
    if(appInitialized){ drawRevenueChart(); drawReportChart(); drawPaymentChart(); }
  }, 150);
});
if(document.fonts && document.fonts.ready){
  document.fonts.ready.then(()=>{
    if(appInitialized){ drawRevenueChart(); drawReportChart(); drawPaymentChart(); }
  });
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

/* ---- Report export (PDF via print dialog, Word via a .doc download) ---- */
function buildReportHTML(){
  const totalSales = ORDERS.reduce((s,o)=>s+o.grand,0);
  const totalOrders = ORDERS.length;
  const itemCount = {};
  ORDERS.forEach(o=>o.items.forEach(i=>{ itemCount[i.name]=(itemCount[i.name]||0)+i.qty; }));
  const topItems = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topCustomers = [...CUSTOMERS].sort((a,b)=>b.totalSpent-a.totalSpent).slice(0,10);
  const methodTotals = {};
  ORDERS.forEach(o=>{ methodTotals[o.payment] = (methodTotals[o.payment]||0) + o.grand; });

  const rows = (arr, cols) => arr.length
    ? arr.map(r=>`<tr>${cols.map(c=>`<td style="padding:6px 10px;border:1px solid #ddd;">${r[c]}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cols.length}" style="padding:8px;border:1px solid #ddd;color:#888;">No data available.</td></tr>`;

  const itemRows = topItems.map(([name,qty])=>({name, qty})).map(r=>`<tr><td style="padding:6px 10px;border:1px solid #ddd;">${r.name}</td><td style="padding:6px 10px;border:1px solid #ddd;">${r.qty}</td></tr>`).join('') || `<tr><td colspan="2" style="padding:8px;border:1px solid #ddd;color:#888;">No sales yet.</td></tr>`;
  const custRows = topCustomers.map(c=>`<tr><td style="padding:6px 10px;border:1px solid #ddd;">${c.name}</td><td style="padding:6px 10px;border:1px solid #ddd;">${c.phone}</td><td style="padding:6px 10px;border:1px solid #ddd;">${fmt(c.totalSpent)}</td></tr>`).join('') || `<tr><td colspan="3" style="padding:8px;border:1px solid #ddd;color:#888;">No customers yet.</td></tr>`;
  const methodRows = Object.entries(methodTotals).map(([m,t])=>`<tr><td style="padding:6px 10px;border:1px solid #ddd;">${m}</td><td style="padding:6px 10px;border:1px solid #ddd;">${fmt(t)}</td></tr>`).join('') || `<tr><td colspan="2" style="padding:8px;border:1px solid #ddd;color:#888;">No payments yet.</td></tr>`;

  const generatedAt = new Date().toLocaleString('en-GB');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:700px;margin:0 auto;">
      <h1 style="color:#e63946;margin-bottom:0;">MIRCHI 365</h1>
      <p style="margin-top:4px;color:#555;">Sales Report — generated ${generatedAt}</p>
      <hr style="border:none;border-top:2px solid #e63946;margin:14px 0;">

      <h2 style="font-size:16px;">Summary</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:18px;">
        <tr><td style="padding:6px 10px;border:1px solid #ddd;"><b>Total Sales</b></td><td style="padding:6px 10px;border:1px solid #ddd;">${fmt(totalSales)}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #ddd;"><b>Total Orders</b></td><td style="padding:6px 10px;border:1px solid #ddd;">${totalOrders}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #ddd;"><b>Total Customers</b></td><td style="padding:6px 10px;border:1px solid #ddd;">${CUSTOMERS.length}</td></tr>
      </table>

      <h2 style="font-size:16px;">Top Selling Items</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:18px;">
        <tr><th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Item</th><th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Qty Sold</th></tr>
        ${itemRows}
      </table>

      <h2 style="font-size:16px;">Top Customers</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:18px;">
        <tr><th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Name</th><th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Phone</th><th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Total Spent</th></tr>
        ${custRows}
      </table>

      <h2 style="font-size:16px;">Payment Breakdown</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Method</th><th style="padding:6px 10px;border:1px solid #ddd;background:#f4f4f4;text-align:left;">Amount</th></tr>
        ${methodRows}
      </table>

      <p style="margin-top:24px;color:#888;font-size:12px;">Mirchi 365 · National Highway Gambat, Near New Nadra · 0317-2889755</p>
    </div>
  `;
}

$('#downloadReportPdfBtn').addEventListener('click', ()=>{
  const html = buildReportHTML();
  const w = window.open('', '_blank', 'width=800,height=900');
  w.document.write(`<html><head><title>Mirchi365-Report</title></head><body>${html}</body></html>`);
  w.document.close(); w.focus();
  setTimeout(()=> w.print(), 300);
  toast('Preparing report PDF…', 'info');
});

$('#downloadReportWordBtn').addEventListener('click', ()=>{
  const html = buildReportHTML();
  const fullDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>Mirchi365-Report</title></head>
    <body>${html}</body></html>`;
  const blob = new Blob(['\ufeff', fullDoc], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mirchi365-Report-${new Date().toISOString().slice(0,10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Word report downloaded', 'success');
});
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

  $$('[data-deloffer]', wrap).forEach(b=>b.addEventListener('click', async ()=>{
    const offer = OFFERS.find(o=>o.id == b.dataset.deloffer);
    try{ if(offer) await OfferManager.delete(offer.id); }catch(err){ console.error(err); toast('Could not delete offer.', 'error'); return; }
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

$('#saveOfferBtn').addEventListener('click', async ()=>{
  const title = $('#newOfferTitle').value.trim();
  const desc = $('#newOfferDesc').value.trim();
  if(!title || !desc){ toast('Title and description are required', 'error'); return; }

  let deadline = null;
  const cd = $('#newOfferCountdown').value;
  if(cd==='today'){ deadline = new Date(); deadline.setHours(23,59,59,999); }
  else if(cd==='3' || cd==='7'){ deadline = new Date(Date.now() + (+cd)*86400000); }

  const newOffer = {
    tag: $('#newOfferTag').value,
    title, desc,
    price: +$('#newOfferPrice').value || null,
    oldPrice: +$('#newOfferOldPrice').value || null,
    deadline
  };

  let result;
  try{ result = await OfferManager.add(newOffer); }
  catch(err){ console.error(err); toast('Could not save offer.', 'error'); return; }

  if(!result.ok){ toast(`An offer titled "${title}" already exists.`, 'error'); return; }

  OFFERS.push({ ...result.record, deadline: result.record.deadline ? new Date(result.record.deadline) : null });
  offerIdCounter = Math.max(offerIdCounter, result.record.id);

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
$('#saveSettingsBtn').addEventListener('click', async ()=>{
  SETTINGS.taxPct = +$('#setTax').value || 5;
  SETTINGS.servicePct = +$('#setService').value || 2;
  SETTINGS.deliveryDefault = +$('#setDelivery').value || 0;
  $('#deliveryInput').value = SETTINGS.deliveryDefault;
  try{ await SettingsManager.save({ ...SETTINGS }); }
  catch(err){ console.error(err); toast('Could not save settings.', 'error'); return; }
  computeTotals();
  toast('Settings saved successfully','success');
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

/* -------------------------------------------------------------------------
   20. LANGUAGE SYSTEM (English / Urdu / Sindhi)
   Every element tagged data-i18n="key" gets its text swapped; elements
   tagged data-i18n-placeholder="key" get their placeholder swapped.
   ------------------------------------------------------------------------- */
const TRANSLATIONS = {
  en: {
    nav_dashboard:"Dashboard", nav_neworder:"New Order", nav_kitchen:"Kitchen Orders", nav_menu:"Menu",
    nav_customers:"Customers", nav_payments:"Payments", nav_inventory:"Inventory", nav_reports:"Reports",
    nav_offers:"Offers", nav_settings:"Settings", nav_logout:"Logout",
    notifications:"Notifications", clear_all_label:"Clear All", role_view_only:"View Only", my_profile:"My Profile",
    page_dashboard_title:"Dashboard", dash_subtitle:"Welcome back — here's how Mirchi 365 is doing today.",
    stat_today_sales:"Today's Sales", stat_today_orders:"Today's Orders", stat_customers:"Customers",
    stat_pending_orders:"Pending Orders", stat_completed_orders:"Completed Orders", stat_monthly_revenue:"Monthly Revenue",
    stat_best_seller:"Best Seller", stat_low_stock:"Low Stock Alerts",
    panel_revenue_week:"Revenue this week", panel_live_kitchen:"Live Kitchen Queue", link_view_all:"View all",
    page_neworder_title:"New Order", token_label:"Token", ph_search_menu:"Search menu…",
    cart_label:"Cart", clear_label:"Clear", dine_in:"Dine In", take_away:"Take Away", delivery_label:"Delivery",
    ph_cust_name:"Customer name", ph_cust_phone:"Phone number", ph_cust_address:"Address", ph_cust_table:"Table number",
    cart_empty:"Cart is empty — add something spicy!", subtotal_label:"Subtotal", discount_label:"Discount",
    service_charges_label:"Service Charges", delivery_charges_label:"Delivery Charges", grand_total_label:"Grand Total",
    checkout_label:"Checkout",
    page_kitchen_title:"Kitchen Orders (KOT)", kitchen_subtitle:"Live order tickets for the kitchen team.", btn_clear_delivered:"Clear Delivered",
    kot_status_pending:"Pending", kot_status_preparing:"Preparing", kot_status_ready:"Ready", kot_status_delivered:"Delivered",
    page_menu_title:"Menu Management", menu_subtitle:"All food items across categories.", ph_search_generic:"Search…",
    th_item:"Item", th_category:"Category", th_price:"Price", th_stock:"Stock",
    btn_add_item:"Add Item", modal_add_menu_item:"Add Menu Item", lbl_item_name:"Item Name",
    page_customers_title:"Customers", customers_subtitle:"Manage your guests and reward points.",
    btn_add_customer:"Add Customer", th_name:"Name", th_phone:"Phone", th_orders:"Orders",
    th_total_spent:"Total Spent", th_reward_pts:"Reward Pts", modal_order_history:"Order History",
    page_payments_title:"Payments", payments_subtitle:"Accepted methods & recent transactions.",
    pay_cash:"Cash", pay_cash_desc:"Paid at counter", pay_easypaisa:"Easypaisa", pay_jazzcash:"JazzCash",
    pay_bank:"Bank Transfer", pay_card:"Card Payment", pay_card_desc:"Visa / Mastercard", pay_qr:"Scan QR",
    panel_recent_transactions:"Recent Transactions", th_token:"Token", th_customer:"Customer", th_method:"Method",
    th_amount:"Amount", th_status:"Status",
    page_inventory_title:"Inventory", inventory_subtitle:"Track stock and ingredient levels.",
    th_ingredient:"Ingredient", th_unit:"Unit", th_supplier:"Supplier", th_purchase_price:"Purchase Price",
    th_selling_price:"Selling Price",
    page_reports_title:"Reports", reports_subtitle:"Sales performance overview.",
    range_today:"Today", range_weekly:"Weekly", range_monthly:"Monthly", range_yearly:"Yearly",
    panel_revenue_trend:"Revenue Trend", panel_top_items:"Top Selling Items", panel_top_customers:"Top Customers",
    panel_payment_breakdown:"Payment Breakdown",
    page_offers_title:"Offers & Discounts", offers_subtitle:"Deals and promo codes running today.", btn_add_offer:"Add Offer",
    page_settings_title:"Settings", settings_subtitle:"Configure your restaurant profile.",
    panel_restaurant_profile:"Restaurant Profile", lbl_restaurant_name:"Restaurant Name",
    lbl_phone1:"Phone 1", lbl_phone2:"Phone 2", lbl_phone3:"Phone 3", lbl_address:"Address",
    panel_billing:"Billing", lbl_currency:"Currency", lbl_tax:"Tax %", lbl_service_charge:"Service Charge %",
    lbl_delivery_charges:"Default Delivery Charges", panel_preferences:"Preferences", lbl_dark_mode:"Dark Mode",
    lbl_language:"Language", lbl_printer:"Printer", btn_save_settings:"Save Settings",
    footer_credit:"This website was made by",
    login_tagline:"Spice that never stops", lbl_username:"Username", lbl_password:"Password",
    lbl_remember_me:"Remember me", lbl_forgot_password:"Forgot password?", btn_login:"Login",
    forgot_title:"Reset access", forgot_desc:"Enter your registered phone number and the shift manager will issue a temporary PIN.",
    btn_send_request:"Send request",
    lbl_full_name:"Full Name", lbl_phone_number:"Phone Number", lbl_email:"Email", lbl_role:"Role", btn_save_profile:"Save Profile",
    lbl_name:"Name", lbl_phone:"Phone", btn_save_customer:"Save Customer",
    modal_add_inventory:"Add Inventory Item", lbl_ingredient_name:"Ingredient Name", lbl_stock_qty:"Stock Qty",
    lbl_unit:"Unit", lbl_supplier:"Supplier", lbl_purchase_price:"Purchase Price", lbl_selling_price:"Selling Price",
    btn_save_item:"Save Item",
    modal_add_offer:"Add New Offer", lbl_offer_type:"Offer Type / Tag", opt_custom_discount:"Custom Discount",
    opt_birthday_package:"Birthday Package", opt_promo_code:"Promo Code", lbl_title:"Title", lbl_description:"Description",
    lbl_offer_price:"Offer Price (Rs)", lbl_original_price:"Original Price (optional)", lbl_countdown:"Countdown Timer",
    opt_no_countdown:"No countdown", opt_ends_today:"Ends today (midnight)", opt_ends_3days:"Ends in 3 days",
    opt_ends_7days:"Ends in 7 days", btn_save_offer:"Save Offer",
    modal_select_payment:"Select Payment Method", pay_bank_short:"Bank", pay_card_short:"Card", pay_split:"Split",
    lbl_total_payable:"Total Payable", btn_confirm_receipt:"Confirm & Generate Receipt",
    btn_print:"Print", btn_download_pdf:"Download PDF", btn_download_pdf_report:"Download PDF", btn_download_word_report:"Download Word",
  },
  ur: {
    nav_dashboard:"ڈیش بورڈ", nav_neworder:"نیا آرڈر", nav_kitchen:"کچن آرڈرز", nav_menu:"مینو",
    nav_customers:"کسٹمرز", nav_payments:"ادائیگیاں", nav_inventory:"انوینٹری", nav_reports:"رپورٹس",
    nav_offers:"آفرز", nav_settings:"ترتیبات", nav_logout:"لاگ آؤٹ",
    notifications:"اطلاعات", clear_all_label:"سب صاف کریں", role_view_only:"صرف ملاحظہ", my_profile:"میری پروفائل",
    page_dashboard_title:"ڈیش بورڈ", dash_subtitle:"خوش آمدید — آج مرچی 365 کی کارکردگی ملاحظہ کریں۔",
    stat_today_sales:"آج کی سیل", stat_today_orders:"آج کے آرڈرز", stat_customers:"کسٹمرز",
    stat_pending_orders:"زیرِ التوا آرڈرز", stat_completed_orders:"مکمل آرڈرز", stat_monthly_revenue:"ماہانہ آمدنی",
    stat_best_seller:"سب سے زیادہ فروخت", stat_low_stock:"کم اسٹاک الرٹس",
    panel_revenue_week:"اس ہفتے کی آمدنی", panel_live_kitchen:"لائیو کچن قطار", link_view_all:"سب دیکھیں",
    page_neworder_title:"نیا آرڈر", token_label:"ٹوکن", ph_search_menu:"مینو تلاش کریں…",
    cart_label:"کارٹ", clear_label:"صاف کریں", dine_in:"بیٹھ کر کھانا", take_away:"لے جانا", delivery_label:"ڈیلیوری",
    ph_cust_name:"کسٹمر کا نام", ph_cust_phone:"فون نمبر", ph_cust_address:"پتہ", ph_cust_table:"ٹیبل نمبر",
    cart_empty:"کارٹ خالی ہے — کچھ تیز مزیدار شامل کریں!", subtotal_label:"سب ٹوٹل", discount_label:"رعایت",
    service_charges_label:"سروس چارجز", delivery_charges_label:"ڈیلیوری چارجز", grand_total_label:"کل رقم",
    checkout_label:"چیک آؤٹ",
    page_kitchen_title:"کچن آرڈرز (KOT)", kitchen_subtitle:"کچن ٹیم کے لیے لائیو آرڈر ٹکٹس۔", btn_clear_delivered:"ڈیلیورڈ صاف کریں",
    kot_status_pending:"زیرِ التوا", kot_status_preparing:"تیار ہو رہا ہے", kot_status_ready:"تیار", kot_status_delivered:"پہنچا دیا گیا",
    page_menu_title:"مینو مینجمنٹ", menu_subtitle:"تمام کیٹیگریز کی فوڈ آئٹمز۔", ph_search_generic:"تلاش کریں…",
    th_item:"آئٹم", th_category:"کیٹیگری", th_price:"قیمت", th_stock:"اسٹاک",
    btn_add_item:"آئٹم شامل کریں", modal_add_menu_item:"مینو آئٹم شامل کریں", lbl_item_name:"آئٹم کا نام",
    page_customers_title:"کسٹمرز", customers_subtitle:"اپنے مہمانوں اور ریوارڈ پوائنٹس کو منظم کریں۔",
    btn_add_customer:"کسٹمر شامل کریں", th_name:"نام", th_phone:"فون", th_orders:"آرڈرز",
    th_total_spent:"کل خرچ", th_reward_pts:"ریوارڈ پوائنٹس", modal_order_history:"آرڈر کی تاریخ",
    page_payments_title:"ادائیگیاں", payments_subtitle:"قابلِ قبول طریقے اور حالیہ لین دین۔",
    pay_cash:"نقد", pay_cash_desc:"کاؤنٹر پر ادا کریں", pay_easypaisa:"ایزی پیسہ", pay_jazzcash:"جاز کیش",
    pay_bank:"بینک ٹرانسفر", pay_card:"کارڈ ادائیگی", pay_card_desc:"ویزا / ماسٹر کارڈ", pay_qr:"QR اسکین کریں",
    panel_recent_transactions:"حالیہ لین دین", th_token:"ٹوکن", th_customer:"کسٹمر", th_method:"طریقہ",
    th_amount:"رقم", th_status:"صورتحال",
    page_inventory_title:"انوینٹری", inventory_subtitle:"اسٹاک اور اجزاء کی سطح ٹریک کریں۔",
    th_ingredient:"جزو", th_unit:"اکائی", th_supplier:"سپلائر", th_purchase_price:"خریداری قیمت",
    th_selling_price:"فروخت قیمت",
    page_reports_title:"رپورٹس", reports_subtitle:"سیل کی کارکردگی کا جائزہ۔",
    range_today:"آج", range_weekly:"ہفتہ وار", range_monthly:"ماہانہ", range_yearly:"سالانہ",
    panel_revenue_trend:"آمدنی کا رجحان", panel_top_items:"زیادہ فروخت ہونے والے آئٹمز", panel_top_customers:"بہترین کسٹمرز",
    panel_payment_breakdown:"ادائیگی کی تفصیل",
    page_offers_title:"آفرز اور رعایتیں", offers_subtitle:"آج کی ڈیلز اور پرومو کوڈز۔", btn_add_offer:"آفر شامل کریں",
    page_settings_title:"ترتیبات", settings_subtitle:"اپنے ریسٹورنٹ پروفائل کو ترتیب دیں۔",
    panel_restaurant_profile:"ریسٹورنٹ پروفائل", lbl_restaurant_name:"ریسٹورنٹ کا نام",
    lbl_phone1:"فون 1", lbl_phone2:"فون 2", lbl_phone3:"فون 3", lbl_address:"پتہ",
    panel_billing:"بلنگ", lbl_currency:"کرنسی", lbl_tax:"ٹیکس %", lbl_service_charge:"سروس چارج %",
    lbl_delivery_charges:"ڈیفالٹ ڈیلیوری چارجز", panel_preferences:"ترجیحات", lbl_dark_mode:"ڈارک موڈ",
    lbl_language:"زبان", lbl_printer:"پرنٹر", btn_save_settings:"ترتیبات محفوظ کریں",
    footer_credit:"یہ ویب سائٹ بنائی گئی ہے",
    login_tagline:"وہ مصالحہ جو کبھی نہیں رکتا", lbl_username:"صارف نام", lbl_password:"پاسورڈ",
    lbl_remember_me:"مجھے یاد رکھیں", lbl_forgot_password:"پاسورڈ بھول گئے؟", btn_login:"لاگ ان",
    forgot_title:"رسائی دوبارہ ترتیب دیں", forgot_desc:"اپنا رجسٹرڈ فون نمبر درج کریں، شفٹ منیجر عارضی پن جاری کرے گا۔",
    btn_send_request:"درخواست بھیجیں",
    lbl_full_name:"پورا نام", lbl_phone_number:"فون نمبر", lbl_email:"ای میل", lbl_role:"کردار", btn_save_profile:"پروفائل محفوظ کریں",
    lbl_name:"نام", lbl_phone:"فون", btn_save_customer:"کسٹمر محفوظ کریں",
    modal_add_inventory:"انوینٹری آئٹم شامل کریں", lbl_ingredient_name:"جزو کا نام", lbl_stock_qty:"اسٹاک مقدار",
    lbl_unit:"اکائی", lbl_supplier:"سپلائر", lbl_purchase_price:"خریداری قیمت", lbl_selling_price:"فروخت قیمت",
    btn_save_item:"آئٹم محفوظ کریں",
    modal_add_offer:"نئی آفر شامل کریں", lbl_offer_type:"آفر کی قسم / ٹیگ", opt_custom_discount:"اپنی مرضی کی رعایت",
    opt_birthday_package:"سالگرہ پیکج", opt_promo_code:"پرومو کوڈ", lbl_title:"عنوان", lbl_description:"تفصیل",
    lbl_offer_price:"آفر قیمت (روپے)", lbl_original_price:"اصل قیمت (اختیاری)", lbl_countdown:"کاؤنٹ ڈاؤن ٹائمر",
    opt_no_countdown:"کوئی کاؤنٹ ڈاؤن نہیں", opt_ends_today:"آج آدھی رات ختم", opt_ends_3days:"3 دن میں ختم",
    opt_ends_7days:"7 دن میں ختم", btn_save_offer:"آفر محفوظ کریں",
    modal_select_payment:"ادائیگی کا طریقہ منتخب کریں", pay_bank_short:"بینک", pay_card_short:"کارڈ", pay_split:"تقسیم",
    lbl_total_payable:"کل قابلِ ادائیگی", btn_confirm_receipt:"تصدیق کریں اور رسید بنائیں",
    btn_print:"پرنٹ", btn_download_pdf:"PDF ڈاؤن لوڈ کریں", btn_download_pdf_report:"PDF رپورٹ ڈاؤن لوڈ کریں", btn_download_word_report:"ورڈ رپورٹ ڈاؤن لوڈ کریں",
  },
  sd: {
    nav_dashboard:"ڊيش بورڊ", nav_neworder:"نئون آرڊر", nav_kitchen:"ڪچن آرڊر", nav_menu:"مينيو",
    nav_customers:"گراهڪ", nav_payments:"ادائيگيون", nav_inventory:"انونٽري", nav_reports:"رپورٽون",
    nav_offers:"آفرون", nav_settings:"سيٽنگون", nav_logout:"لاگ آئوٽ",
    notifications:"اطلاعون", clear_all_label:"سڀ صاف ڪريو", role_view_only:"صرف ڏسڻ", my_profile:"منهنجي پروفائيل",
    page_dashboard_title:"ڊيش بورڊ", dash_subtitle:"ڀليڪار — اڄ مرچي 365 ڪيئن ڪم ڪري رهيو آهي.",
    stat_today_sales:"اڄ جي وڪرو", stat_today_orders:"اڄ جا آرڊر", stat_customers:"گراهڪ",
    stat_pending_orders:"بيٺل آرڊر", stat_completed_orders:"مڪمل آرڊر", stat_monthly_revenue:"مهيني جي آمدني",
    stat_best_seller:"سڀ کان وڌيڪ وڪامندڙ", stat_low_stock:"گهٽ اسٽاڪ خبردار",
    panel_revenue_week:"هن هفتي جي آمدني", panel_live_kitchen:"لائيو ڪچن قطار", link_view_all:"سڀ ڏسو",
    page_neworder_title:"نئون آرڊر", token_label:"ٽوڪن", ph_search_menu:"مينيو ڳوليو…",
    cart_label:"ڪارٽ", clear_label:"صاف ڪريو", dine_in:"ويهي کائڻ", take_away:"کڻي وڃڻ", delivery_label:"ڊليوري",
    ph_cust_name:"گراهڪ جو نالو", ph_cust_phone:"فون نمبر", ph_cust_address:"پتو", ph_cust_table:"ٽيبل نمبر",
    cart_empty:"ڪارٽ خالي آهي — ڪجهه مساليدار شامل ڪريو!", subtotal_label:"سب ٽوٽل", discount_label:"رعايت",
    service_charges_label:"سروس چارجز", delivery_charges_label:"ڊليوري چارجز", grand_total_label:"ڪل رقم",
    checkout_label:"چيڪ آئوٽ",
    page_kitchen_title:"ڪچن آرڊر (KOT)", kitchen_subtitle:"ڪچن ٽيم لاءِ لائيو آرڊر ٽڪيٽون.", btn_clear_delivered:"ڊليورڊ صاف ڪريو",
    kot_status_pending:"بيٺل", kot_status_preparing:"تيار ٿي رهيو آهي", kot_status_ready:"تيار", kot_status_delivered:"پهچائي ڇڏيو ويو",
    page_menu_title:"مينيو مينيجمينٽ", menu_subtitle:"سڀني ڪيٽيگرين جا فوڊ آئٽم.", ph_search_generic:"ڳوليو…",
    th_item:"آئٽم", th_category:"ڪيٽيگري", th_price:"قيمت", th_stock:"اسٽاڪ",
    btn_add_item:"آئٽم شامل ڪريو", modal_add_menu_item:"مينيو آئٽم شامل ڪريو", lbl_item_name:"آئٽم جو نالو",
    page_customers_title:"گراهڪ", customers_subtitle:"پنهنجن مهمانن ۽ رعايتي پوائنٽن کي سنڀاليو.",
    btn_add_customer:"گراهڪ شامل ڪريو", th_name:"نالو", th_phone:"فون", th_orders:"آرڊر",
    th_total_spent:"ڪل خرچ", th_reward_pts:"رعايتي پوائنٽ", modal_order_history:"آرڊر جي تاريخ",
    page_payments_title:"ادائيگيون", payments_subtitle:"قبول ٿيندڙ طريقا ۽ تازيون ادائيگيون.",
    pay_cash:"نقد", pay_cash_desc:"ڪائونٽر تي ادا ڪريو", pay_easypaisa:"ايزي پيسا", pay_jazzcash:"جاز ڪيش",
    pay_bank:"بينڪ ٽرانسفر", pay_card:"ڪارڊ ادائيگي", pay_card_desc:"ويزا / ماسٽر ڪارڊ", pay_qr:"QR اسڪين ڪريو",
    panel_recent_transactions:"تازيون ادائيگيون", th_token:"ٽوڪن", th_customer:"گراهڪ", th_method:"طريقو",
    th_amount:"رقم", th_status:"حالت",
    page_inventory_title:"انونٽري", inventory_subtitle:"اسٽاڪ ۽ سامان جي سطح جو حساب رکو.",
    th_ingredient:"سامان", th_unit:"يونٽ", th_supplier:"سپلائر", th_purchase_price:"خريداري قيمت",
    th_selling_price:"وڪرو قيمت",
    page_reports_title:"رپورٽون", reports_subtitle:"وڪري جي ڪارڪردگي جو جائزو.",
    range_today:"اڄ", range_weekly:"هفتيوار", range_monthly:"مهيني وار", range_yearly:"سال وار",
    panel_revenue_trend:"آمدني جو رجحان", panel_top_items:"وڌيڪ وڪامندڙ آئٽم", panel_top_customers:"بهترين گراهڪ",
    panel_payment_breakdown:"ادائيگي جو تفصيل",
    page_offers_title:"آفرون ۽ رعايتون", offers_subtitle:"اڄ جون ڊيلز ۽ پروموڪوڊ.", btn_add_offer:"آفر شامل ڪريو",
    page_settings_title:"سيٽنگون", settings_subtitle:"پنهنجي ريسٽورنٽ پروفائيل سيٽ ڪريو.",
    panel_restaurant_profile:"ريسٽورنٽ پروفائيل", lbl_restaurant_name:"ريسٽورنٽ جو نالو",
    lbl_phone1:"فون 1", lbl_phone2:"فون 2", lbl_phone3:"فون 3", lbl_address:"پتو",
    panel_billing:"بلنگ", lbl_currency:"ڪرنسي", lbl_tax:"ٽيڪس %", lbl_service_charge:"سروس چارج %",
    lbl_delivery_charges:"ڊفالٽ ڊليوري چارجز", panel_preferences:"پسنديدگيون", lbl_dark_mode:"ڊارڪ موڊ",
    lbl_language:"ٻولي", lbl_printer:"پرنٽر", btn_save_settings:"سيٽنگون سانڍيو",
    footer_credit:"هي ويبسائيٽ ٺاهي وئي آهي",
    login_tagline:"اهو مسالو جيڪو ڪڏهن نه ٿو رڪجي", lbl_username:"يوزر نالو", lbl_password:"پاسورڊ",
    lbl_remember_me:"مونکي ياد رکو", lbl_forgot_password:"پاسورڊ وسري ويو؟", btn_login:"لاگ اِن",
    forgot_title:"رسائي ٻيهر سيٽ ڪريو", forgot_desc:"پنهنجو رجسٽرڊ فون نمبر داخل ڪريو، شفٽ مئنيجر عارضي پن جاري ڪندو.",
    btn_send_request:"درخواست موڪليو",
    lbl_full_name:"پورو نالو", lbl_phone_number:"فون نمبر", lbl_email:"اي ميل", lbl_role:"ڪردار", btn_save_profile:"پروفائيل سانڍيو",
    lbl_name:"نالو", lbl_phone:"فون", btn_save_customer:"گراهڪ سانڍيو",
    modal_add_inventory:"انونٽري آئٽم شامل ڪريو", lbl_ingredient_name:"سامان جو نالو", lbl_stock_qty:"اسٽاڪ مقدار",
    lbl_unit:"يونٽ", lbl_supplier:"سپلائر", lbl_purchase_price:"خريداري قيمت", lbl_selling_price:"وڪرو قيمت",
    btn_save_item:"آئٽم سانڍيو",
    modal_add_offer:"نئون آفر شامل ڪريو", lbl_offer_type:"آفر جو قسم / ٽيگ", opt_custom_discount:"پنهنجي مرضي جي رعايت",
    opt_birthday_package:"سالگره پيڪيج", opt_promo_code:"پروموڪوڊ", lbl_title:"عنوان", lbl_description:"تفصيل",
    lbl_offer_price:"آفر قيمت (روپيا)", lbl_original_price:"اصلي قيمت (اختياري)", lbl_countdown:"ڪائونٽ ڊائون ٽائمر",
    opt_no_countdown:"ڪوبه ڪائونٽ ڊائون ناهي", opt_ends_today:"اڄ اڌ رات ختم", opt_ends_3days:"3 ڏينهن ۾ ختم",
    opt_ends_7days:"7 ڏينهن ۾ ختم", btn_save_offer:"آفر سانڍيو",
    modal_select_payment:"ادائيگي جو طريقو چونڊيو", pay_bank_short:"بينڪ", pay_card_short:"ڪارڊ", pay_split:"ورهايو",
    lbl_total_payable:"ڪل ادا ڪرڻ جوڳي رقم", btn_confirm_receipt:"تصديق ڪريو ۽ رسيد ٺاهيو",
    btn_print:"پرنٽ", btn_download_pdf:"PDF ڊائون لوڊ ڪريو", btn_download_pdf_report:"PDF رپورٽ ڊائون لوڊ ڪريو", btn_download_word_report:"ورڊ رپورٽ ڊائون لوڊ ڪريو",
  },
};

let currentLang = 'en';

function applyLanguage(lang){
  if(!TRANSLATIONS[lang]) lang = 'en';
  const dict = TRANSLATIONS[lang];
  const enDict = TRANSLATIONS.en;
  $$('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    el.textContent = dict[key] || enDict[key] || el.textContent;
  });
  $$('[data-i18n-placeholder]').forEach(el=>{
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = dict[key] || enDict[key] || el.placeholder;
  });
  currentLang = lang;
  try{ localStorage.setItem('mirchi365-lang', lang); }catch(e){}
  const order = ['en','ur','sd'];
  const sel = $('#langSelect');
  if(sel) sel.selectedIndex = order.indexOf(lang);
  // Re-render JS-generated content that includes translatable strings
  if(typeof renderCart === 'function') renderCart();
}

$('#langSelect').addEventListener('change', e=>{
  const order = ['en','ur','sd'];
  applyLanguage(order[e.target.selectedIndex] || 'en');
  toast('Language updated', 'success');
});

function applySavedLanguage(){
  let saved = null;
  try{ saved = localStorage.getItem('mirchi365-lang'); }catch(e){}
  applyLanguage(saved || 'en');
}
applySavedLanguage();
