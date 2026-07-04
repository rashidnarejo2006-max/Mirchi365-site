/* ==========================================================================
   main.js — Application bootstrap
   Loaded LAST (after script.js). Everything script.js already declares
   (MENU, CUSTOMERS, ORDERS, INVENTORY, OFFERS, USERS, currentUser, initApp,
   applyRolePermissions, doLogout, renderCart, etc.) already exists as plain
   global bindings by the time this file runs, since these are classic
   <script> tags sharing one global scope (no bundler / no backend needed).

   What this file does, in order:
     1. Opens (or creates) the CustomerDB IndexedDB database.
     2. On first-ever run, seeds every store with the same demo data that
        script.js ships with, so the UI looks identical to before.
     3. On every run after that, REPLACES script.js's in-memory arrays with
        whatever is actually saved in IndexedDB — this is what makes data
        survive a refresh, browser close, or computer restart.
     4. Restores a logged-in session / theme / language / sidebar state from
        localStorage (small preferences only — never business data).
   ========================================================================== */

const AppBootstrap = {

  async init(){
    try{
      await DB.init();
    }catch(err){
      console.error("IndexedDB init failed:", err);
      toast("Offline database could not start — some data may not be saved. Try reloading.", "error");
      return;
    }

    await this._seedIfEmpty();
    await this._loadFromDatabase();
    this._restoreSidebarState();
    await this._restoreSession();
  },

  /** First run only: push script.js's built-in demo data into IndexedDB. */
  async _seedIfEmpty(){
    try{
      const [menuCount, custCount, invCount, offerCount, settingsRow] = await Promise.all([
        DB.count("menu"), DB.count("customers"), DB.count("inventory"), DB.count("offers"), SettingsManager.get(),
      ]);

      if(menuCount === 0){
        for(const item of MENU) await DB.add("menu", { ...item });
      }
      if(custCount === 0){
        for(const c of CUSTOMERS) await DB.add("customers", { ...c, createdAt: Date.now() });
      }
      if(invCount === 0){
        for(const it of INVENTORY) await DB.add("inventory", { ...it, createdAt: Date.now() });
      }
      if(offerCount === 0){
        for(const o of OFFERS) await DB.add("offers", { ...o, deadline: o.deadline instanceof Date ? o.deadline.getTime() : o.deadline, createdAt: Date.now() });
      }
      if(!settingsRow){
        await SettingsManager.save({ ...SETTINGS });
      }
    }catch(err){
      console.error("Seeding IndexedDB failed:", err);
      toast("Could not prepare the offline database.", "error");
    }
  },

  /** Every run: pull whatever is currently saved and replace the in-memory arrays. */
  async _loadFromDatabase(){
    try{
      const [menu, customers, inventory, offers, orders, settingsRow] = await Promise.all([
        MenuManager.getAll(), CustomerManager.getAll(), InventoryManager.getAll(),
        OfferManager.getAll(), OrderManager.getAll(), SettingsManager.get(),
      ]);

      if(menu.length) MENU = menu;
      if(customers.length) CUSTOMERS = customers;
      if(inventory.length) INVENTORY = inventory;
      if(offers.length){
        OFFERS = offers;
        offerIdCounter = Math.max(0, ...OFFERS.map(o=>o.id||0));
      }
      // Orders (and therefore the kitchen board / dashboard stats / reports)
      // are restored fully so today's history survives a refresh.
      ORDERS = orders.map(o=>({ ...o, time: new Date(o.time) }));
      tokenCounter = Math.max(100, ...ORDERS.map(o=>o.token||0));

      if(settingsRow){
        SETTINGS.taxPct = settingsRow.taxPct ?? SETTINGS.taxPct;
        SETTINGS.servicePct = settingsRow.servicePct ?? SETTINGS.servicePct;
        SETTINGS.deliveryDefault = settingsRow.deliveryDefault ?? SETTINGS.deliveryDefault;
        SETTINGS.currency = settingsRow.currency ?? SETTINGS.currency;
      }
    }catch(err){
      console.error("Loading saved data from IndexedDB failed:", err);
      toast("Could not load your saved data — showing defaults instead.", "error");
    }
  },

  /* ---- Small preferences: localStorage only, never IndexedDB ---- */

  _restoreSidebarState(){
    try{
      const collapsed = localStorage.getItem('mirchi365-sidebar') === 'collapsed';
      if(collapsed && window.innerWidth > 800) $('#sidebar').classList.add('collapsed');
    }catch(e){}
  },

  async _restoreSession(){
    let savedUsername = null;
    try{ savedUsername = localStorage.getItem('mirchi365-session'); }catch(e){}
    if(!savedUsername) return;
    const match = USERS.find(u => u.username === savedUsername);
    if(!match) return;
    currentUser = match;
    try{
      const savedProfile = await ProfileManager.findByUsername(match.username);
      if(savedProfile) Object.assign(currentUser, { name: savedProfile.name, phone: savedProfile.phone, email: savedProfile.email });
    }catch(err){ console.error(err); }
    $('#loginScreen').classList.add('hidden');
    $('#app').classList.remove('hidden');
    initApp();
  },
};

// Kick everything off as soon as this file loads.
AppBootstrap.init();
