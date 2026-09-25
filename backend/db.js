/* -----------------------------------------------------------------------
   A deliberately small file-backed store, so this project runs with no
   external database to install. It is safe for a single server instance
   and a modest number of users. For real scale or multiple server
   instances, swap this module for a real database (Postgres, MongoDB,
   etc.) — every other file only calls the functions exported here, so
   that's the one place that needs to change.
   ----------------------------------------------------------------------- */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ALLOWLIST_FILE = path.join(DATA_DIR, 'allowlist.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(ALLOWLIST_FILE)) fs.writeFileSync(ALLOWLIST_FILE, '{"restrict":true,"emails":[]}');

/* a very small write queue so two requests can't corrupt the file by
   writing at the same moment */
let writeChain = Promise.resolve();
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, data) {
  writeChain = writeChain.then(() => fs.promises.writeFile(file, JSON.stringify(data, null, 2)));
  return writeChain;
}

const users = {
  all() { return readJson(USERS_FILE); },
  findByEmail(email) { return this.all().find(u => u.email.toLowerCase() === email.toLowerCase()) || null; },
  findById(id) { return this.all().find(u => u.id === id) || null; },
  async create(user) {
    const list = this.all();
    list.push(user);
    await writeJson(USERS_FILE, list);
    return user;
  },
  async update(id, patch) {
    const list = this.all();
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    await writeJson(USERS_FILE, list);
    return list[idx];
  },
  async remove(id) {
    const list = this.all().filter(u => u.id !== id);
    await writeJson(USERS_FILE, list);
  }
};

const allowlist = {
  get() { return readJson(ALLOWLIST_FILE); },
  async set(data) { await writeJson(ALLOWLIST_FILE, data); return data; },
  isAllowed(email) {
    const { restrict, emails } = this.get();
    if (!restrict) return true;
    return emails.map(e => e.toLowerCase()).includes(email.toLowerCase());
  }
};

module.exports = { users, allowlist };

/* ------------------------------------------------------------- generic --
   A small factory so every other content type (courses, programs, posts,
   etc.) doesn't need its own bespoke file — same JSON-file pattern as
   `users` above, reused. Swap this module for a real database later and
   nothing outside db.js has to change. */
function makeCollection(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  return {
    all() { return readJson(file); },
    findById(id) { return this.all().find(x => x.id === id) || null; },
    async create(item) { const list = this.all(); list.push(item); await writeJson(file, list); return item; },
    async update(id, patch) {
      const list = this.all(); const idx = list.findIndex(x => x.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...patch };
      await writeJson(file, list);
      return list[idx];
    },
    async remove(id) { await writeJson(file, this.all().filter(x => x.id !== id)); }
  };
}
module.exports.makeCollection = makeCollection;
