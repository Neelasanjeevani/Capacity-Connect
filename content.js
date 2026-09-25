/* -----------------------------------------------------------------------
   Wires a standard set of REST routes for a content collection, so every
   entity (courses, programs, resources...) doesn't need hand-written
   routes. Mounted from server.js — see the call sites at the bottom of
   this file for exactly which roles can do what for each collection.
   ----------------------------------------------------------------------- */
const { v4: uuid } = require('uuid');
const { requireAuth, requireRole } = require('./middleware/auth');

/**
 * @param {import('express').Express} app
 * @param {object} opts
 * @param {string} opts.path        URL prefix, e.g. '/api/courses'
 * @param {object} opts.collection  result of db.makeCollection(name)
 * @param {boolean} [opts.publicRead=true]   GET routes need no login
 * @param {string[]} [opts.createRoles]      roles allowed to POST (default: signed-in users)
 * @param {string[]} [opts.writeRoles]       roles allowed to PUT/DELETE any item (default: same as createRoles)
 * @param {string}  [opts.ownerField]        if set, the item's creator (req.user.sub) may also PUT/DELETE their own item
 */
function crudRoutes(app, opts) {
  const { path: base, collection, publicRead = true, createRoles = null, writeRoles = null, ownerField = null } = opts;

  const readMw = publicRead ? [] : [requireAuth];
  const createMw = createRoles ? [requireAuth, requireRole(...createRoles)] : [requireAuth];
  const writeGuard = (req, res, next) => {
    const item = collection.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const roles = writeRoles || createRoles;
    const isOwner = ownerField && item[ownerField] === req.user.sub;
    const roleOk = !roles || roles.includes(req.user.role);
    if (!isOwner && !roleOk) return res.status(403).json({ error: 'Not permitted' });
    req.item = item;
    next();
  };

  app.get(base, ...readMw, (req, res) => res.json(collection.all()));
  app.get(`${base}/:id`, ...readMw, (req, res) => {
    const item = collection.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  app.post(base, ...createMw, async (req, res) => {
    const item = { id: uuid(), ...req.body, createdAt: new Date().toISOString() };
    if (ownerField && !item[ownerField]) item[ownerField] = req.user.sub;
    await collection.create(item);
    res.status(201).json(item);
  });
  app.put(`${base}/:id`, requireAuth, writeGuard, async (req, res) => {
    const updated = await collection.update(req.params.id, req.body);
    res.json(updated);
  });
  app.delete(`${base}/:id`, requireAuth, writeGuard, async (req, res) => {
    await collection.remove(req.params.id);
    res.json({ ok: true });
  });
}

module.exports = { crudRoutes };
