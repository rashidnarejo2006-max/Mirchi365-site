/* ==========================================================================
   settings.js — SettingsManager
   Talks to the "settings" store. Restaurant profile / billing / preference
   fields are stored as one singleton record (id: 1).
   ========================================================================== */

const SettingsManager = {
  STORE: "settings",
  RECORD_ID: 1,

  async get(){
    const record = await DB.get(this.STORE, this.RECORD_ID);
    return record || null;
  },

  async save(data){
    const record = { ...data, id: this.RECORD_ID, updatedAt: Date.now() };
    await DB.update(this.STORE, record);
    return record;
  },
};
