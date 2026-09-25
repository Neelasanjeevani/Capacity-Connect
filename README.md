# Capacity Connect — Backend API

A secure Node/Express API covering two things:

1. **Auth** — registration, login, both gated by an emailed one-time code;
   sessions, admin approvals, the access allowlist, and self-service
   credential changes.
2. **Content** — courses, programmes, resources, announcements, quizzes,
   enrollments, quiz attempts, knowledge-sharing posts, feedback and
   certificates, each with a standard REST interface.

What it actually enforces, on the server, where a visitor cannot see or
edit it:

- Passwords are hashed with bcrypt — never stored or compared in plain text.
- The OTP code is generated on the server, hashed before being stored, sent
  by real email, and **never sent back to the browser**.
- Wrong-password lockouts (5 tries → 15 minute lockout) and wrong-code
  limits (5 tries) are tracked server-side.
- Sessions are a JWT in an `httpOnly` cookie — page JavaScript cannot read
  or forge it.
- Rate limiting on every auth route slows down automated guessing.
- Every write to content (creating a course, approving a user, editing the
  allowlist...) re-checks the caller's role from their verified session
  token — nothing is trusted from the request body.

## 1. Install

Requires Node.js 18 or newer.

```
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `FRONTEND_ORIGIN` — exactly where your site is served from (e.g.
  `http://localhost:5500` while testing, or your real domain once deployed).
  If you use the single-process static-serving option (see the top-level
  README), this can just be your one deployed URL.
- `JWT_SECRET` — generate one with:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `SMTP_*` — your email sender. For Gmail: turn on 2-Step Verification on
  the account, then create an **App password**
  (Google Account → Security → App passwords) and use that as `SMTP_PASS`
  — never the normal Gmail password.
- `INITIAL_ADMIN_EMAIL` — the address that should become the first
  administrator.

## 2. Run it

```
npm start
```

On first run, since no administrator exists yet, the server creates one
automatically and **emails a one-time password** to `INITIAL_ADMIN_EMAIL`.
That password is never printed to the terminal or written to disk in plain
text. Log in with it once, then use the frontend's Account security panel
(or `POST /api/me/security`) to set your own permanent email and password.

## 3. API reference

Every call from the browser needs `credentials: 'include'` so the session
cookie is sent, e.g.:

```js
await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, password })
});
```

### Auth

| Purpose | Method & path | Body | Notes |
|---|---|---|---|
| Register | `POST /api/auth/register` | `name, email, password, title, dept, role` | Sends a code by email |
| Confirm registration | `POST /api/auth/register/verify` | `email, code` | Creates the account (pending approval) |
| Resend registration code | `POST /api/auth/register/resend` | `email` | |
| Log in | `POST /api/auth/login` | `email, password` | Returns a `ticket`, sends a code by email |
| Confirm login | `POST /api/auth/login/verify` | `ticket, code` | Sets the session cookie |
| Resend login code | `POST /api/auth/login/resend` | `ticket` | |
| Who am I | `GET /api/me` | — | Reads the session cookie |
| Log out | `POST /api/auth/logout` | — | |
| Change own credentials | `POST /api/me/security` | `currentPassword, newEmail?, newPassword?` | Requires session cookie |
| List users (admin) | `GET /api/admin/users` | — | |
| Approve user (admin) | `POST /api/admin/users/:id/approve` | — | |
| Remove user (admin) | `DELETE /api/admin/users/:id` | — | |
| View allowlist (admin) | `GET /api/admin/allowlist` | — | |
| Edit allowlist (admin) | `POST /api/admin/allowlist` | `restrict?, addEmail?, removeEmail?` | |

### Content

Each of these follows the same shape: `GET` the list, `GET /:id` one item,
`POST` to create, `PUT /:id` to update, `DELETE /:id` to remove. `GET`
routes are public catalogue browsing unless noted.

| Collection | Base path | Who can create/edit | Notes |
|---|---|---|---|
| Courses | `/api/courses` | trainer, admin (or the trainer who owns it) | |
| Programmes | `/api/programs` | admin | |
| Resources | `/api/resources` | trainer, admin | |
| Announcements | `/api/announcements` | admin | |
| Quizzes | `/api/quizzes` | trainer, admin (or the owning trainer) | |
| Knowledge posts | `/api/posts` | any signed-in user (own posts) | comments: `POST /api/posts/:id/comments` `{text}` |
| Enrollments | `/api/enrollments` | any signed-in user (own records); admin for others | your own: `GET /api/enrollments/me` |
| Quiz attempts | `/api/attempts` | any signed-in user (own records) | your own: `GET /api/attempts/me` |
| Certificates | `/api/certificates` | trainer, admin issue them | your own: `GET /api/certificates/me` |
| Feedback | `/api/feedback` | any signed-in user submits; admin reads the list | `POST` only, no update/delete |

**Important — this part is not wired into the frontend yet.** The auth
routes above are already called by `frontend/js/app.js` once you set
`API_BASE`. The content routes exist and work, but the existing
course/quiz/programme/resource screens still read and write the browser's
local demo data, not these endpoints — connecting each screen to its
matching route is real, careful work (many small edits across a large
file) that's worth doing incrementally and testing as you go, rather than
as one large unverified change. Ask and I'll do it screen by screen.

## 4. Deploy it somewhere

This is a normal Node/Express app — any of these work and have a free tier:

- **Render.com** — connect the repo, set it as a "Web Service", add the
  `.env` values under Environment, deploy.
- **Railway.app** — similar: new project → deploy from repo → add
  variables.
- **Fly.io** — `fly launch` in this folder, then `fly secrets set` for each
  `.env` value.

Whichever you pick, set `FRONTEND_ORIGIN` to your real published site URL,
and re-generate `JWT_SECRET` for production (don't reuse a value from
local testing).

## 5. Data storage

All content and accounts are stored as plain JSON files under `data/` — so
nothing extra needs installing to try this out. This is fine for a small
internal tool; if you expect many concurrent users or need backups and
replication, swap `src/db.js`'s `makeCollection()` for a real database
(Postgres, MongoDB). Every route only calls the functions that module
exports, so that's the only file that needs to change.

OTP codes and login attempt counters live in memory (`server.js`), not in
a file, since they're only valid for a few minutes — a server restart just
means anyone mid-code-entry has to request a fresh one.
