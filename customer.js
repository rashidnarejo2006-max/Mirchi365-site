/* ==========================================================================
   customer.js — CustomerManager
   Talks to the "customers" store in database.js. script.js's CUSTOMERS
   array stays as the in-memory cache the UI renders from; every mutation
   is mirrored here so it survives a refresh / browser restart.
   ========================================================================== */

const CustomerManager = {
  STORE: "customers",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  async findByPhone(phone){
    const matches = await DB.getByIndex(this.STORE, "phone", phone);
    return matches[0] || null;
  },

  /** Adds a new customer. Returns {ok, record} or {ok:false, reason} on duplicate phone. */
  async add(customer){
    const existing = await this.findByPhone(customer.phone);
    if(existing){ return { ok:false, reason:"duplicate", record: existing }; }
    const record = { ...customer, orders: customer.orders||0, totalSpent: customer.totalSpent||0, points: customer.points||0, createdAt: Date.now() };
    const id = await DB.add(this.STORE, record);
    record.id = id;
    return { ok:true, record };
  },

  async update(customer){
    await DB.update(this.STORE, customer);
    return customer;
  },

  async delete(id){
    return DB.delete(this.STORE, id);
  },

  /** Used at checkout time: creates the customer if new, or increments their stats if returning. */
  async recordOrder(phone, name, amount){
    if(!phone || phone === '-') return null;
    let existing = await this.findByPhone(phone);
    if(existing){
      existing.orders = (existing.orders||0) + 1;
      existing.totalSpent = (existing.totalSpent||0) + amount;
      existing.points = (existing.points||0) + Math.round(amount/100);
      await this.update(existing);
      return existing;
    }
    const res = await this.add({ name: name || 'Walk-in Customer', phone, orders:1, totalSpent:amount, points:Math.round(amount/100) });
    return res.record;
  },
};
