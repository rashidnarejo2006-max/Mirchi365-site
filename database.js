/* ==========================================================================
   MIRCHI 365 — database.js
   Generic, reusable IndexedDB manager. Every "Manager" class (customer.js,
   orders.js, inventory.js, ...) calls into this single object instead of
   touching indexedDB directly. Nothing here knows about the UI.

   Connects to: index.html (loaded before script.js / main.js)
   Used by:     customer.js, orders.js, inventory.js, menu.js, offers.js,
                payments.js, settings.js, profile.js, notifications.js,
                receipt.js, main.js
   ========================================================================== */

const DB_NAME = "CustomerDB";
const DB_VERSION = 1;

/* Schema: object store name -> { keyPath, autoIncrement, indexes[] }
   index.name   = the name other code uses to query by (e.g. "phone")
   index.keyPath= the actual property name stored on the record */
const DB_SCHEMA = {
  customers: {
    keyPath: "id", autoIncrement: true,
    indexes: [
      { name: "phone", keyPath: "phone", unique: true },
      { name: "name", keyPath: "name", unique: false },
      { name: "createdAt", keyPath: "createdAt", unique: false },
    ],
  },
  orders: {
    keyPath: "id", autoIncrement: true,
    indexes: [
      { name: "token", keyPath: "token", unique: true },
      { name: "customerPhone", keyPath: "phone", unique: false },
      { name: "paymentMethod", keyPath: "payment", unique: false },
      { name: "createdAt", keyPath: "time", unique: false },
    ],
  },
  menu: {
    keyPath: "id", autoIncrement: true,
    indexes: [
      { name: "category", keyPath: "cat", unique: false },
      { name: "itemName", keyPath: "name", unique: false },
    ],
  },
  inventory: {
    keyPath: "id", autoIncrement: true,
    indexes: [{ name: "ingredient", keyPath: "name", unique: true }],
  },
  offers: {
    keyPath: "id", autoIncrement: true,
    indexes: [{ name: "title", keyPath: "title", unique: true }],
  },
  settings: {
    keyPath: "id", autoIncrement: true,
    indexes: [],
  },
  payments: {
    keyPath: "id", autoIncrement: true,
    indexes: [
      { name: "method", keyPath: "method", unique: false },
      { name: "token", keyPath: "token", unique: false },
    ],
  },
  kitchenOrders: {
    keyPath: "id", autoIncrement: true,
    indexes: [
      { name: "token", keyPath: "token", unique: true },
      { name: "status", keyPath: "status", unique: false },
    ],
  },
  notifications: {
    keyPath: "id", autoIncrement: true,
    indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }],
  },
  profile: {
    keyPath: "id", autoIncrement: true,
    indexes: [{ name: "username", keyPath: "username", unique: true }],
  },
};

class DatabaseManager {
  constructor(){
    this.db = null;
    this.ready = false;
  }

  /** Open (or create/upgrade) the database. Safe to call more than once. */
  init(){
    if(this.ready) return Promise.resolve(this.db);
    return new Promise((resolve, reject)=>{
      if(!('indexedDB' in window)){
        reject(new Error("IndexedDB is not supported in this browser."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e)=>{
        const db = e.target.result;
        Object.keys(DB_SCHEMA).forEach(storeName=>{
          const cfg = DB_SCHEMA[storeName];
          let store;
          if(!db.objectStoreNames.contains(storeName)){
            store = db.createObjectStore(storeName, { keyPath: cfg.keyPath, autoIncrement: cfg.autoIncrement });
          } else {
            store = e.target.transaction.objectStore(storeName);
          }
          cfg.indexes.forEach(idx=>{
            if(!store.indexNames.contains(idx.name)){
              store.createIndex(idx.name, idx.keyPath, { unique: !!idx.unique });
            }
          });
        });
      };

      request.onsuccess = (e)=>{
        this.db = e.target.result;
        this.ready = true;
        this.db.onversionchange = ()=>{ this.db.close(); };
        resolve(this.db);
      };

      request.onerror = (e)=>{
        reject(e.target.error || new Error("Failed to open IndexedDB."));
      };

      request.onblocked = ()=>{
        reject(new Error("Database upgrade is blocked by another open tab. Please close other tabs of this app and reload."));
      };
    });
  }

  /** Internal helper: run a callback with an open transaction on a store. */
  _tx(storeName, mode, callback){
    return new Promise((resolve, reject)=>{
      if(!this.ready){ reject(new Error("Database is not initialized yet.")); return; }
      if(!this.db.objectStoreNames.contains(storeName)){
        reject(new Error(`Store "${storeName}" does not exist.`));
        return;
      }
      let transaction;
      try{
        transaction = this.db.transaction(storeName, mode);
      }catch(err){
        reject(err);
        return;
      }
      const store = transaction.objectStore(storeName);
      let result;
      transaction.oncomplete = ()=> resolve(result);
      transaction.onerror = (e)=> reject(e.target.error || new Error("Transaction failed."));
      transaction.onabort = (e)=> reject(e.target.error || new Error("Transaction aborted."));
      try{
        callback(store, (r)=>{ result = r; });
      }catch(err){
        reject(err);
      }
    });
  }

  /** Add a new record. Returns the generated primary key. */
  add(storeName, data){
    return this._tx(storeName, "readwrite", (store, setResult)=>{
      const req = store.add(data);
      req.onsuccess = ()=> setResult(req.result);
    });
  }

  /** Update (or insert if missing) a record — record must include its keyPath field. */
  update(storeName, data){
    return this._tx(storeName, "readwrite", (store, setResult)=>{
      const req = store.put(data);
      req.onsuccess = ()=> setResult(req.result);
    });
  }

  /** Delete a record by primary key. */
  delete(storeName, id){
    return this._tx(storeName, "readwrite", (store, setResult)=>{
      const req = store.delete(id);
      req.onsuccess = ()=> setResult(true);
    });
  }

  /** Get one record by primary key. */
  get(storeName, id){
    return this._tx(storeName, "readonly", (store, setResult)=>{
      const req = store.get(id);
      req.onsuccess = ()=> setResult(req.result || null);
    });
  }

  /** Get every record in a store. */
  getAll(storeName){
    return this._tx(storeName, "readonly", (store, setResult)=>{
      const req = store.getAll();
      req.onsuccess = ()=> setResult(req.result || []);
    });
  }

  /** Get all records matching an index value (e.g. getByIndex('customers','phone','0300-...')). */
  getByIndex(storeName, indexName, value){
    return this._tx(storeName, "readonly", (store, setResult)=>{
      const idx = store.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = ()=> setResult(req.result || []);
    });
  }

  /** Client-side filter/search across all records in a store. predicate(record) => boolean */
  async search(storeName, predicate){
    const all = await this.getAll(storeName);
    return all.filter(predicate);
  }

  /** Remove every record from a store. */
  clear(storeName){
    return this._tx(storeName, "readwrite", (store, setResult)=>{
      const req = store.clear();
      req.onsuccess = ()=> setResult(true);
    });
  }

  /** Count records in a store. */
  count(storeName){
    return this._tx(storeName, "readonly", (store, setResult)=>{
      const req = store.count();
      req.onsuccess = ()=> setResult(req.result || 0);
    });
  }
}

// Single shared instance used by every manager file.
const DB = new DatabaseManager();
