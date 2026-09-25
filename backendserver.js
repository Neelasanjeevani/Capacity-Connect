require('dotenv').config();
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const { users, allowlist, makeCollection } = require('./src/db');
const { sendOtpEmail, sendPasswordNotice } = require('./src/mailer');
const { requireAuth, requireRole } = require('./src/middleware/auth');
const { crudRoutes } = require('./src/content');

const app = express();
const PORT = process.env.PORT || 4000;

/* ---------------------------------------------------------- security --- */
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

/* -------------------------------------------------------- optional: -----
   serve the frontend from this same process, so one deployment gives you
   the whole site. Only kicks in if a ../frontend folder exists next to
   this backend folder (see the top-level project README) — harmless to
   leave in if you host the frontend elsewhere instead. */
const path = require('path');
const frontendDir = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendDir)) app.use(express.static(frontendDir));

/* generous global limiter, plus a tight one on the sensitive routes below */
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many attempts from this device. Try again later.' }
});

/* ---------------------------------------------------------- OTP store ---
   Short-lived, so it lives in memory rather than on disk: a restart just
   means anyone mid-verification has to request a fresh code. Codes are
   stored hashed, exactly like passwords, so nothing readable sits in
   server memory dumps or logs. */
const pendingLogins = new Map();  // ticket -> { userId, codeHash, expiresAt, attempts }
const pendingRegs   = new Map();  // email  -> { data, codeHash, expiresAt, attempts, resends, lastSent }

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_MAX_RESENDS = 3;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const loginFailures = new Map(); // email -> { attempts, lockedUntil }

function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function isLockedOut(email) {
  const rec = loginFailures.get(email.toLowerCase());
  if (!rec || !rec.lockedUntil) return 0;
  return Math.max(0, rec.lockedUntil - Date.now());
}
function recordLoginFailure(email) {
  const key = email.toLowerCase();
  const rec = loginFailures.get(key) || { attempts: 0, lockedUntil: 0 };
  rec.attempts += 1;
  if (rec.attempts >= LOGIN_MAX_ATTEMPTS) rec.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  loginFailures.set(key, rec);
}
function clearLoginFailure(email) { loginFailures.delete(email.toLowerCase()); }

function issueSession(res, user) {
  const token = jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.cookie('session', token, {
    httpOnly: true,                 // not readable by page JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000
  });
}

/* --------------------------------------------------------- validation --- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function badEmail(e) { return !e || !EMAIL_RE.test(String(e).trim()); }

/* =========================================================================
   REGISTRATION — step 1: submit details, get emailed a code
   ========================================================================= */
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password, title, dept, role } = req.body || {};
  if (!name || badEmail(email) || !password || password.length < 6) {
    return res.status(400).json({ error: 'Name, a valid email and a password of at least 6 characters are required.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  if (users.findByEmail(cleanEmail)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const code = genCode();
  const codeHash = await bcrypt.hash(code, 10);
  pendingRegs.set(cleanEmail, {
    data: { name: String(name).trim(), email: cleanEmail, passwordHash,
      role: role === 'trainer' ? 'trainer' : 'trainee', title: title || '', dept: dept || '' },
    codeHash, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, resends: 0, lastSent: Date.now()
  });
  try { await sendOtpEmail(cleanEmail, name, code, 'register'); }
  catch (e) { console.error('register email failed', e); return res.status(502).json({ error: 'Could not send the verification email. Try again shortly.' }); }
  res.json({ message: 'Verification code sent to your email.' });
});

app.post('/api/auth/register/verify', authLimiter, async (req, res) => {
  const { email, code } = req.body || {};
  if (badEmail(email) || !code) return res.status(400).json({ error: 'Email and code are required.' });
  const cleanEmail = String(email).trim().toLowerCase();
  const pending = pendingRegs.get(cleanEmail);
  if (!pending) return res.status(400).json({ error: 'No pending registration for this email. Register again.' });
  if (Date.now() > pending.expiresAt) { pendingRegs.delete(cleanEmail); return res.status(400).json({ error: 'This code has expired. Register again.' }); }
  const ok = await bcrypt.compare(String(code), pending.codeHash);
  if (!ok) {
    pending.attempts += 1;
    if (pending.attempts >= OTP_MAX_ATTEMPTS) { pendingRegs.delete(cleanEmail); return res.status(400).json({ error: 'Too many incorrect codes. Register again.' }); }
    return res.status(400).json({ error: `Incorrect code. ${OTP_MAX_ATTEMPTS - pending.attempts} attempt(s) left.` });
  }
  const user = { id: uuid(), ...pending.data, status: 'pending', createdAt: new Date().toISOString() };
  await users.create(user);
  pendingRegs.delete(cleanEmail);
  res.json({ message: 'Email verified. Your account is now waiting for administrator approval.' });
});

app.post('/api/auth/register/resend', authLimiter, async (req, res) => {
  const { email } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const pending = pendingRegs.get(cleanEmail);
  if (!pending) return res.status(400).json({ error: 'No pending registration for this email.' });
  if (pending.resends >= OTP_MAX_RESENDS) return res.status(429).json({ error: 'Resend limit reached. Register again for a fresh code.' });
  if (Date.now() - pending.lastSent < OTP_RESEND_COOLDOWN_MS) return res.status(429).json({ error: 'Please wait before requesting another code.' });
  const code = genCode();
  pending.codeHash = await bcrypt.hash(code, 10);
  pending.expiresAt = Date.now() + OTP_TTL_MS;
  pending.attempts = 0; pending.resends += 1; pending.lastSent = Date.now();
  await sendOtpEmail(cleanEmail, pending.data.name, code, 'register');
  res.json({ message: 'Verification code re-sent.' });
});

/* =========================================================================
   LOGIN — step 1: check password, get emailed a code (holding a "ticket")
   ========================================================================= */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (badEmail(email) || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const cleanEmail = String(email).trim().toLowerCase();

  const wait = isLockedOut(cleanEmail);
  if (wait > 0) return res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(wait / 60000)} minute(s).` });

  const user = users.findByEmail(cleanEmail);
  const ok = user && await bcrypt.compare(password, user.passwordHash);
  if (!ok) { recordLoginFailure(cleanEmail); return res.status(401).json({ error: 'Email and password do not match an account.' }); }
  if (user.status === 'pending') return res.status(403).json({ error: 'This account is awaiting administrator approval.' });
  if (!allowlist.isAllowed(cleanEmail)) return res.status(403).json({ error: 'This account is not authorised to access the portal.' });

  clearLoginFailure(cleanEmail);
  const code = genCode();
  const ticket = uuid();
  pendingLogins.set(ticket, {
    userId: user.id, codeHash: await bcrypt.hash(code, 10),
    expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, email: cleanEmail, name: user.name
  });
  try { await sendOtpEmail(user.email, user.name, code, 'login'); }
  catch (e) { console.error('login email failed', e); return res.status(502).json({ error: 'Could not send the verification email. Try again shortly.' }); }
  res.json({ ticket, message: 'Verification code sent to your email.' });
});

app.post('/api/auth/login/verify', authLimiter, async (req, res) => {
  const { ticket, code } = req.body || {};
  const pending = ticket && pendingLogins.get(ticket);
  if (!pending) return res.status(400).json({ error: 'Your session expired. Log in again.' });
  if (Date.now() > pending.expiresAt) { pendingLogins.delete(ticket); return res.status(400).json({ error: 'This code has expired. Log in again.' }); }
  const ok = code && await bcrypt.compare(String(code), pending.codeHash);
  if (!ok) {
    pending.attempts += 1;
    if (pending.attempts >= OTP_MAX_ATTEMPTS) { pendingLogins.delete(ticket); return res.status(400).json({ error: 'Too many incorrect codes. Log in again.' }); }
    return res.status(400).json({ error: `Incorrect code. ${OTP_MAX_ATTEMPTS - pending.attempts} attempt(s) left.` });
  }
  const user = users.findById(pending.userId);
  pendingLogins.delete(ticket);
  if (!user) return res.status(400).json({ error: 'Account no longer exists.' });
  issueSession(res, user);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/api/auth/login/resend', authLimiter, async (req, res) => {
  const { ticket } = req.body || {};
  const pending = ticket && pendingLogins.get(ticket);
  if (!pending) return res.status(400).json({ error: 'Your session expired. Log in again.' });
  const code = genCode();
  pending.codeHash = await bcrypt.hash(code, 10);
  pending.expiresAt = Date.now() + OTP_TTL_MS;
  pending.attempts = 0;
  const user = users.findById(pending.userId);
  await sendOtpEmail(user.email, user.name, code, 'login');
  res.json({ message: 'Verification code re-sent.' });
});

app.post('/api/auth/logout', (req, res) => { res.clearCookie('session'); res.json({ ok: true }); });
app.get('/api/me', requireAuth, (req, res) => res.json(req.user));

/* =========================================================================
   ADMIN — approvals and the access allowlist. Every route here re-checks
   the role from the verified JWT; nothing is trusted from the client.
   ========================================================================= */
app.get('/api/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  res.json(users.all().map(({ passwordHash, ...safe }) => safe));
});
app.post('/api/admin/users/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
  const u = await users.update(req.params.id, { status: 'active' });
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});
app.delete('/api/admin/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  if (req.params.id === req.user.sub) return res.status(400).json({ error: 'Cannot remove your own account.' });
  await users.remove(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/allowlist', requireAuth, requireRole('admin'), (req, res) => res.json(allowlist.get()));
app.post('/api/admin/allowlist', requireAuth, requireRole('admin'), async (req, res) => {
  const current = allowlist.get();
  const { restrict, addEmail, removeEmail } = req.body || {};
  if (typeof restrict === 'boolean') current.restrict = restrict;
  if (addEmail && badEmail(addEmail) === false) current.emails = [...new Set([...current.emails, addEmail.trim().toLowerCase()])];
  if (removeEmail) current.emails = current.emails.filter(e => e !== removeEmail.toLowerCase());
  await allowlist.set(current);
  res.json(current);
});

/* -------------------------------------------------- self-service change --
   Lets a signed-in user change their own email/password, confirming the
   current password first — mirrors the frontend's Account security panel. */
app.post('/api/me/security', requireAuth, async (req, res) => {
  const { currentPassword, newEmail, newPassword } = req.body || {};
  const user = users.findById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
  const patch = {};
  if (newEmail && !badEmail(newEmail)) {
    const clean = newEmail.trim().toLowerCase();
    if (users.findByEmail(clean) && clean !== user.email) return res.status(409).json({ error: 'Another account already uses that email.' });
    patch.email = clean;
  }
  if (newPassword) {
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    patch.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' });
  await users.update(user.id, patch);
  res.clearCookie('session'); // force re-login with the new credentials
  res.json({ ok: true });
});

/* =========================================================================
   CONTENT — courses, programmes, resources, announcements, quizzes,
   enrollments, quiz attempts, knowledge-sharing posts, feedback and
   certificates. Each collection lives in its own JSON file (see
   src/db.js); GET routes are public catalogue browsing, writes are
   role-gated per collection below.
   ========================================================================= */
const courses        = makeCollection('courses');
const programs        = makeCollection('programs');
const resources        = makeCollection('resources');
const announcements    = makeCollection('announcements');
const quizzes        = makeCollection('quizzes');
const enrollments    = makeCollection('enrollments');
const attempts        = makeCollection('attempts');
const posts            = makeCollection('posts');
const feedback        = makeCollection('feedback');
const certificates    = makeCollection('certificates');

crudRoutes(app, { path: '/api/courses',       collection: courses,       createRoles: ['trainer', 'admin'], ownerField: 'trainerId' });
crudRoutes(app, { path: '/api/programs',      collection: programs,      createRoles: ['admin'] });
crudRoutes(app, { path: '/api/resources',     collection: resources,     createRoles: ['trainer', 'admin'] });
crudRoutes(app, { path: '/api/announcements', collection: announcements, createRoles: ['admin'] });
crudRoutes(app, { path: '/api/quizzes',       collection: quizzes,       createRoles: ['trainer', 'admin'], ownerField: 'trainerId' });
crudRoutes(app, { path: '/api/posts',         collection: posts,        createRoles: null /* any signed-in user */, ownerField: 'authorId' });

/* enrollments and attempts are personal records: reading the full list
   needs a role, but every signed-in user can read/create their own */
crudRoutes(app, { path: '/api/enrollments', collection: enrollments, publicRead: false, createRoles: null, writeRoles: ['admin'], ownerField: 'userId' });
crudRoutes(app, { path: '/api/attempts',    collection: attempts,    publicRead: false, createRoles: null, writeRoles: ['admin'], ownerField: 'userId' });
app.get('/api/enrollments/me', requireAuth, (req, res) => res.json(enrollments.all().filter(e => e.userId === req.user.sub)));
app.get('/api/attempts/me',    requireAuth, (req, res) => res.json(attempts.all().filter(a => a.userId === req.user.sub)));
app.get('/api/certificates/me', requireAuth, (req, res) => res.json(certificates.all().filter(c => c.userId === req.user.sub)));

crudRoutes(app, { path: '/api/certificates', collection: certificates, publicRead: false, createRoles: ['admin', 'trainer'] });

/* feedback: anyone signed in can submit; only admins can read the list */
app.post('/api/feedback', requireAuth, async (req, res) => {
  const item = { id: uuid(), ...req.body, userId: req.user.sub, createdAt: new Date().toISOString() };
  await feedback.create(item);
  res.status(201).json(item);
});
app.get('/api/feedback', requireAuth, requireRole('admin'), (req, res) => res.json(feedback.all()));

/* comments on a knowledge-sharing post */
app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  const post = posts.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const comment = { id: uuid(), authorId: req.user.sub, authorName: req.user.name, text: req.body.text, createdAt: new Date().toISOString() };
  const updated = await posts.update(post.id, { comments: [...(post.comments || []), comment] });
  res.status(201).json(updated);
});

/* --------------------------------------------------- first-run bootstrap --
   If there is no administrator yet, create one with a random password and
   email it to INITIAL_ADMIN_EMAIL. Nothing is ever printed to the console
   or stored unhashed. */
async function ensureInitialAdmin() {
  const hasAdmin = users.all().some(u => u.role === 'admin');
  if (hasAdmin) return;
  const email = (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) { console.warn('No admin exists yet and INITIAL_ADMIN_EMAIL is not set — set it in .env and restart.'); return; }
  const tempPassword = uuid().split('-')[0] + uuid().split('-')[0];
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await users.create({ id: uuid(), name: 'Administrator', email, passwordHash, role: 'admin', status: 'active', createdAt: new Date().toISOString() });
  const current = allowlist.get(); current.emails = [...new Set([...current.emails, email])]; await allowlist.set(current);
  try { await sendPasswordNotice(email, 'Administrator', tempPassword); console.log(`Initial administrator created and emailed to ${email}.`); }
  catch (e) { console.error('Could not email the initial admin password — check SMTP settings in .env.', e); }
}

ensureInitialAdmin().finally(() => {
  app.listen(PORT, () => console.log(`Capacity Connect API listening on port ${PORT}`));
});
