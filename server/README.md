# Tap N Track — self-hosted backend (VPS platform template)

Single-user, self-hosted stack that runs Tap N Track entirely on the VPS. Also the **reusable
template** for future personal apps: Postgres + a tiny Node API (systemd) + Caddy + nightly
backups. Public apps graduate to Supabase/Vercel; personal apps live here.

## Stack (as installed)

| Piece | What / where |
|---|---|
| **Postgres 18** | local only (127.0.0.1:5432). DB `tapntrack`, role `tapntrack`. Schema: `schema.sql`. |
| **API** | Node + Express, `src/index.js`, listens on **127.0.0.1:8787**, Bearer-secret auth. |
| **systemd** | `tapntrack-api.service` — runs on boot, `Restart=always`. |
| **Backups** | `backup.sh` → nightly `pg_dump` to `~/backups/tapntrack/` (keeps 14). |
| **Caddy** | not yet installed — `Caddyfile.example` has the activation steps (your subdomain step). |

Secrets live in `server/.env` (gitignored, perms 600): `DATABASE_URL`, `API_SECRET`, `PORT`.

## Manage it

```bash
sudo systemctl status tapntrack-api      # health
sudo systemctl restart tapntrack-api     # after editing src/ or .env
journalctl -u tapntrack-api -f           # logs
npm run seed                             # (re)seed the 4 default activities
bash backup.sh                           # manual backup
```

Add the nightly backup to cron yourself (was intentionally not auto-installed):
```bash
( crontab -l 2>/dev/null; echo "15 3 * * * /home/topher/Projects/tapntrack/server/backup.sh >> /home/topher/backups/tapntrack/backup.log 2>&1" ) | crontab -
```

## API

All `/api/*` require `Authorization: Bearer $API_SECRET`. `/health` is open.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/activities?since=ISO` | pull activities |
| POST | `/api/activities` | upsert activity (snake_case row) |
| DELETE | `/api/activities/:id` | soft-delete |
| GET | `/api/events?since=ISO` | pull events |
| POST | `/api/events` | upsert event |
| DELETE | `/api/events/:id` | delete event |
| POST | `/api/log` | **iOS Shortcut target** — `{activityId, value?, duration?, dimensionValues?, note?}` |

### The iOS Shortcut (once Caddy + your subdomain are live)
A single **Get Contents of URL** action:
- URL: `https://tapntrack.YOURDOMAIN.com/api/log`
- Method: `POST`, Headers: `Authorization: Bearer <API_SECRET>`, `Content-Type: application/json`
- Body (JSON): `{"activityId":"bouldering","dimensionValues":{"grade":"V4","outcome":"Send","hang":"No"}}`

Add it to the Action Button / Back Tap / a Lock-Screen widget → tap logs a boulder while locked.

## Graduation to Supabase (if a personal app goes public)
The schema is deliberately Supabase-shaped. To move: switch `id` columns TEXT→UUID, restore the
`auth.users` FK + RLS policies (kept in the repo's `supabase/schema.sql`), map `user_id` to
`auth.uid()`, and repoint the app's API client at Supabase.
