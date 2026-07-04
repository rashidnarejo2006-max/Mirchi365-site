/* ==========================================================================
   profile.js — ProfileManager
   Talks to the "profile" store. Only the "mian" (editor) account can edit
   its own profile — enforced in script.js's UI layer, not here.
   ========================================================================== */

const ProfileManager = {
  STORE: "profile",

  async findByUsername(username){
    const matches = await DB.getByIndex(this.STORE, "username", username);
    return matches[0] || null;
  },

  async save(username, data){
    const existing = await this.findByUsername(username);
    const record = { ...(existing||{}), ...data, username, updatedAt: Date.now() };
    await DB.update(this.STORE, record);
    return record;
  },
};
