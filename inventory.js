/* ==========================================================================
   inventory.js — InventoryManager
   Talks to the "inventory" store. script.js's INVENTORY array is the
   in-memory cache the Inventory table and low-stock dashboard alert read from.
   ========================================================================== */

const InventoryManager = {
  STORE: "inventory",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  async findByName(name){
    const matches = await DB.getByIndex(this.STORE, "ingredient", name);
    return matches[0] || null;
  },

  async add(item){
    const existing = await this.findByName(item.name);
    if(existing){ return { ok:false, reason:"duplicate", record: existing }; }
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
