/* ==========================================================================
   offers.js — OfferManager
   Talks to the "offers" store. script.js's OFFERS array is the in-memory
   cache the Offers & Discounts grid renders from.
   ========================================================================== */

const OfferManager = {
  STORE: "offers",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  async findByTitle(title){
    const matches = await DB.getByIndex(this.STORE, "title", title);
    return matches[0] || null;
  },

  async add(offer){
    const existing = await this.findByTitle(offer.title);
    if(existing){ return { ok:false, reason:"duplicate", record: existing }; }
    const record = { ...offer, deadline: offer.deadline instanceof Date ? offer.deadline.getTime() : offer.deadline, createdAt: Date.now() };
    const id = await DB.add(this.STORE, record);
    record.id = id;
    return { ok:true, record };
  },

  async delete(id){
    return DB.delete(this.STORE, id);
  },
};
