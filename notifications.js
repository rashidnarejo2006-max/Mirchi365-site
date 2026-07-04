/* ==========================================================================
   notifications.js — NotificationManager
   Talks to the "notifications" store.
   ========================================================================== */

const NotificationManager = {
  STORE: "notifications",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  async add(text, icon){
    const record = { text, icon: icon || "fa-solid fa-circle-info", read:false, createdAt: Date.now() };
    const id = await DB.add(this.STORE, record);
    record.id = id;
    return record;
  },
};
