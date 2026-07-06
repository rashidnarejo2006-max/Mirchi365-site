/* ==========================================================================
   orders.js — OrderManager (also drives the kitchenOrders store)
   script.js's ORDERS array is the in-memory cache the Kitchen board, KOT
   badges, dashboard stats, and reports all read from. Every checkout and
   every status change is mirrored into IndexedDB here.
   ========================================================================== */

const OrderManager = {
  STORE: "orders",
  KOT_STORE: "kitchenOrders",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  /** Persists a freshly-checked-out order, and creates its matching kitchen ticket. */
  async add(order){
    const record = { ...order, time: order.time instanceof Date ? order.time.getTime() : order.time, createdAt: Date.now() };
    const id = await DB.add(this.STORE, record);
    record.id = id;
    await DB.add(this.KOT_STORE, {
      token: order.token, status: order.status, type: order.type,
      table: order.table, items: order.items, time: record.time,
    });
    return record;
  },

  /** Updates an order (used when its KOT status advances: Pending -> Preparing -> Ready -> Delivered). */
  async updateStatus(order){
    await DB.update(this.STORE, { ...order, time: order.time instanceof Date ? order.time.getTime() : order.time });
    const tickets = await DB.getByIndex(this.KOT_STORE, "token", order.token);
    if(tickets[0]){
      tickets[0].status = order.status;
      await DB.update(this.KOT_STORE, tickets[0]);
    }
    return order;
  },

  async getKitchenTickets(){
    return DB.getAll(this.KOT_STORE);
  },

  /** Removes an order and its matching kitchen ticket (used by "Clear Delivered"). */
  async delete(order){
    if(order.id) await DB.delete(this.STORE, order.id);
    const tickets = await DB.getByIndex(this.KOT_STORE, "token", order.token);
    for(const t of tickets) await DB.delete(this.KOT_STORE, t.id);
  },
};
