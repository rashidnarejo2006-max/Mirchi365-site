/* ==========================================================================
   notifications.js — NotificationManager
   Talks to the "notifications" store.
   ========================================================================== */

const NotificationManager = {
  STORE: "notifications",

  async getAll(){
    return DB.getAll(this.STORE);
  },

  /** meta: { page, refType, refId } — page is where a click should navigate to;
      refType/refId let auto-clear find "this stock item" / "this order" again later. */
  async add(text, icon, meta = {}){
    const record = {
      text, icon: icon || "fa-solid fa-circle-info", read:false, createdAt: Date.now(),
      page: meta.page || null, refType: meta.refType || null, refId: meta.refId ?? null,
    };
    const id = await DB.add(this.STORE, record);
    record.id = id;
    return record;
  },

  async delete(id){
    return DB.delete(this.STORE, id);
  },

  async clearAll(){
    return DB.clear(this.STORE);
  },
};
