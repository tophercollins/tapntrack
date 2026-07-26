// Tap N Track — self-hosted single-user API.
// Runs on 127.0.0.1 only; Caddy reverse-proxies your subdomain to it and terminates HTTPS.
// Auth: a single shared secret (Bearer token) — there is exactly one user (you).
import express from 'express'
import pg from 'pg'
import crypto from 'node:crypto'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const API_SECRET = process.env.API_SECRET
const PORT = Number(process.env.PORT || 8787)
const USER = 'local' // single-user constant; kept so the row shape matches Supabase for graduation

// jsonb params: node-postgres would turn a JS array into a Postgres array literal, which breaks a
// jsonb column. Stringify objects/arrays ourselves; text binds and casts to jsonb cleanly.
const j = (v) => (v == null ? null : JSON.stringify(v))

const app = express()
app.use(express.json())

// CORS — permissive for now. Tighten `Access-Control-Allow-Origin` to your app's origin once the
// subdomain exists.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'authorization, content-type')
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Request logging — method, path, status (visible via `journalctl -u tapntrack-api`).
app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.path} -> ${res.statusCode}`))
  next()
})

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// Auth gate for everything under /api
app.use('/api', (req, res, next) => {
  const auth = req.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!API_SECRET || token !== API_SECRET) return res.status(401).json({ error: 'unauthorized' })
  next()
})

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e)
  res.status(500).json({ error: e.message })
})

// ---------------- activities ----------------
app.get('/api/activities', wrap(async (req, res) => {
  const { since } = req.query
  const q = since
    ? await pool.query('SELECT * FROM activities WHERE updated_at > $1 ORDER BY sort_order', [since])
    : await pool.query('SELECT * FROM activities ORDER BY sort_order')
  res.json(q.rows)
}))

app.post('/api/activities', wrap(async (req, res) => {
  const a = req.body || {}
  const q = await pool.query(
    `INSERT INTO activities (id,user_id,name,emoji,color,tracking_type,unit,daily_target,dimensions,value_formula,created_at,sort_order,is_base,parent_id,deleted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11::timestamptz,NOW()),$12,$13,$14,$15)
     ON CONFLICT (id) DO UPDATE SET
       name=EXCLUDED.name, emoji=EXCLUDED.emoji, color=EXCLUDED.color, tracking_type=EXCLUDED.tracking_type,
       unit=EXCLUDED.unit, daily_target=EXCLUDED.daily_target, dimensions=EXCLUDED.dimensions,
       value_formula=EXCLUDED.value_formula, sort_order=EXCLUDED.sort_order, is_base=EXCLUDED.is_base,
       parent_id=EXCLUDED.parent_id, deleted_at=EXCLUDED.deleted_at, updated_at=NOW()
     RETURNING *`,
    [a.id, USER, a.name, a.emoji, a.color, a.tracking_type, a.unit ?? null, a.daily_target ?? null,
     j(a.dimensions), a.value_formula ?? null, a.created_at ?? null, a.sort_order ?? 0,
     a.is_base ?? true, a.parent_id ?? null, a.deleted_at ?? null])
  res.json(q.rows[0])
}))

app.delete('/api/activities/:id', wrap(async (req, res) => {
  await pool.query('UPDATE activities SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------------- events ----------------
app.get('/api/events', wrap(async (req, res) => {
  const { since } = req.query
  const q = since
    ? await pool.query('SELECT * FROM events WHERE updated_at > $1 ORDER BY timestamp', [since])
    : await pool.query('SELECT * FROM events ORDER BY timestamp')
  res.json(q.rows)
}))

app.post('/api/events', wrap(async (req, res) => {
  const e = req.body || {}
  const id = e.id || crypto.randomUUID()
  const q = await pool.query(
    `INSERT INTO events (id,user_id,activity_id,value,duration,dimension_values,timestamp,note)
     VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz,NOW()),$8)
     ON CONFLICT (id) DO UPDATE SET
       value=EXCLUDED.value, duration=EXCLUDED.duration, dimension_values=EXCLUDED.dimension_values,
       timestamp=EXCLUDED.timestamp, note=EXCLUDED.note, updated_at=NOW()
     RETURNING *`,
    [id, USER, e.activity_id, e.value ?? null, e.duration ?? null, j(e.dimension_values), e.timestamp ?? null, e.note ?? null])
  res.status(201).json(q.rows[0])
}))

app.delete('/api/events/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM events WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------------- convenience: the iOS Shortcut target ----------------
// POST /api/log { activityId, value?, duration?, dimensionValues?, note? }
app.post('/api/log', wrap(async (req, res) => {
  const { activityId, value, duration, dimensionValues, note } = req.body || {}
  if (!activityId) return res.status(400).json({ error: 'activityId required' })
  const act = await pool.query('SELECT id,emoji,name FROM activities WHERE id=$1 AND deleted_at IS NULL', [activityId])
  if (!act.rowCount) return res.status(404).json({ error: `unknown activity: ${activityId}` })
  const id = crypto.randomUUID()
  const q = await pool.query(
    `INSERT INTO events (id,user_id,activity_id,value,duration,dimension_values,note)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, USER, activityId, value ?? null, duration ?? null, j(dimensionValues), note ?? null])
  const a = act.rows[0]
  res.status(201).json({ ok: true, logged: `${a.emoji} ${a.name}`, event: q.rows[0] })
}))

app.listen(PORT, '127.0.0.1', () => console.log(`tapntrack-api listening on 127.0.0.1:${PORT}`))
