/* ==========================================================================
   menu.js — MenuManager
   Talks to the "menu" store. script.js's MENU array is the in-memory cache
   the New Order grid, Menu Management table, and stock badges render from.
   ========================================================================== */

const MenuManager = {
  STORE: "menu",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  /** Prevents adding the exact same item name twice inside the same category. */
  async add(item){
    const all = await this.getAll();
    const dup = all.find(m => m.cat.toLowerCase() === item.cat.toLowerCase() && m.name.toLowerCase() === item.name.toLowerCase());
    if(dup){ return { ok:false, reason:"duplicate", record: dup }; }
    const record = { ...item, createdAt: Date.now() };
    const id = await DB.add(this.STORE, record);
    record.id = id;
    return { ok:true, record };
  },

  async update(item){
    await DB.update(this.STORE, item);
    return item;
  },

  async delete(id){
    return DB.delete(this.STORE, id);
  },
};
