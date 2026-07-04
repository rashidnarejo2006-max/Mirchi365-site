/* ==========================================================================
   payments.js — PaymentManager
   Talks to the "payments" store. The Payments page's "Recent Transactions"
   table is rendered from script.js's ORDERS array (unchanged, so the UI
   stays exactly as it was) — this store is the permanent transaction ledger
   requested for the offline database, kept in sync alongside it.
   ========================================================================== */

const PaymentManager = {
  STORE: "payments",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  async logPayment(order){
    const record = {
      token: order.token, customer: order.customer, method: order.payment,
      amount: order.grand, status: "Paid", time: Date.now(),
    };
    const id = await DB.add(this.STORE, record);
    record.id = id;
    return record;
  },
};
