# Tap N Track — Self-Hosted Runbook

How this app runs on the VPS, how to rebuild it from scratch, how to operate it, and how to clone
the pattern for a **new personal app**. This is the "personal-app platform" template: public/paying
apps lean on managed Supabase/Vercel; personal single-user apps self-host here.

> Conventions: paths assume the repo at `/home/topher/Projects/tapntrack` on an Ubuntu 26.04 VPS,
> user `topher` (passwordless sudo). Node is at `/usr/bin/node`. Replace `<...>` placeholders.
> **Never commit secrets** — they live in `server/.env` (gitignored, perms 600).

---

## 1. Architecture (what runs where)

```
 iPhone Lock Screen ──(HTTPS POST /api/log, Bearer key)──┐
 Browser / PWA  ──(HTTPS, /api/*, Bearer key)────────────┤
                                                          ▼
                                   Caddy (:80/:443, auto-TLS)      ── serves built PWA (dist/)
                                          │ reverse_proxy /api/*        + reverse-proxies API
                                          ▼
                                   tapntrack-api  (systemd, Node/Express, 127.0.0.1:8787)
                                          │ pg
                                          ▼
                                   Postgres 18   (127.0.0.1:5432, DB `tapntrack`)
                                          │
                                   nightly pg_dump → ~/backups/tapntrack/
```

- **Single-user model:** one shared `API_SECRET` (Bearer token) is the only auth. No RLS, no accounts.
- **Offline-first app:** the PWA works with no server (IndexedDB); sync is additive when a key is set.
- **Bidirectional sync:** app pushes local changes (debounced) and pulls remote changes on load.

Repo layout:
- `server/` — backend (schema, API, seed, backup, Caddy template). See `server/README.md`.
- `src/` — the PWA. API client: `src/lib/api.ts`; sync: `src/services/syncService.ts`.
- `probe/` — Playwright live-app tests (`cd probe && npm run probe`). See `probe/README.md`.

---

## 2. Provision from scratch (copy-paste)

### 2.1 Postgres
```bash
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
systemctl is-active postgresql            # expect: active
```

### 2.2 Database, role, secrets
```bash
cd /home/topher/Projects/tapntrack/server
DB_PASSWORD=$(openssl rand -hex 16)
API_SECRET=$(openssl rand -hex 24)
sudo -u postgres psql -c "CREATE ROLE tapntrack LOGIN PASSWORD '${DB_PASSWORD}';"
sudo -u postgres createdb -O tapntrack tapntrack
cat > .env <<ENV
DATABASE_URL=postgres://tapntrack:${DB_PASSWORD}@127.0.0.1:5432/tapntrack
API_SECRET=${API_SECRET}
PORT=8787
ENV
chmod 600 .env
```

### 2.3 Schema + seed
```bash
set -a && . ./.env && set +a
psql "$DATABASE_URL" -f schema.sql       # tables: activities, events, sync_metadata
npm install
npm run seed                             # 4 default activities
```

### 2.4 API as a systemd service
```bash
sudo tee /etc/systemd/system/tapntrack-api.service >/dev/null <<'UNIT'
[Unit]
Description=Tap N Track API (self-hosted, single-user)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=topher
WorkingDirectory=/home/topher/Projects/tapntrack/server
ExecStart=/usr/bin/node --env-file=/home/topher/Projects/tapntrack/server/.env /home/topher/Projects/tapntrack/server/src/index.js
Restart=always
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now tapntrack-api
curl -sS localhost:8787/health           # expect: {"ok":true,...}
```

### 2.5 Backups (nightly)
```bash
chmod +x backup.sh
bash backup.sh                           # smoke test → writes ~/backups/tapntrack/*.sql.gz
( crontab -l 2>/dev/null | grep -v 'tapntrack/server/backup.sh'
  echo "15 3 * * * /home/topher/Projects/tapntrack/server/backup.sh >> /home/topher/backups/tapntrack/backup.log 2>&1"
) | crontab -
```

### 2.6 Public exposure — Caddy + DNS + TLS
See `server/Caddyfile.example` for the full config. Summary:
1. DNS at the registrar (Namecheap): `A  tapntrack → 167.233.145.41` (+ optional `AAAA` → IPv6).
2. Install Caddy, copy the (edited) `Caddyfile.example` to `/etc/caddy/Caddyfile`, `sudo systemctl reload caddy`.
3. Open firewall 80/443 if a firewall is enabled.
Caddy then auto-provisions Let's Encrypt TLS. It serves `dist/` and reverse-proxies `/api/*` + `/health` to `127.0.0.1:8787`.

### 2.7 Frontend build + deploy
```bash
bash server/deploy-web.sh    # builds with VITE_API_URL and rsyncs dist/ → /var/www/tapntrack
```
(Serving from `/var/www/tapntrack` avoids Caddy's `caddy` user needing to traverse `$HOME`, which is `0750`.) Then in the app: **Settings → Connect**, paste the `API_SECRET` → stored in localStorage.

### 2.8 iOS Shortcut (lock-screen logging)
One **Get Contents of URL** action:
- URL `https://tapntrack.<domain>/api/log`, method `POST`
- Headers: `Authorization: Bearer <API_SECRET>`, `Content-Type: application/json`
- Body: `{"activityId":"bouldering","dimensionValues":{"grade":"V4","outcome":"Send","hang":"No"}}`
Add to Action Button / Back Tap / a Lock-Screen widget.

---

## 3. Operations
```bash
sudo systemctl status tapntrack-api        # health
sudo systemctl restart tapntrack-api       # after editing src/ or .env
journalctl -u tapntrack-api -f             # live logs
curl -sS localhost:8787/health             # quick check
```
Reseed the 4 defaults: `cd server && npm run seed`.

## 4. Backups & restore
- Nightly `pg_dump` → `~/backups/tapntrack/tapntrack-<TS>.sql.gz`, keeps newest 14, log at `~/backups/tapntrack/backup.log`.
- **Restore:** `gunzip -c ~/backups/tapntrack/<file>.sql.gz | psql "$DATABASE_URL"`
- **Off-box (recommended):** dumps sit on the same VPS. For box-loss safety, `rsync`/`scp` `~/backups/tapntrack/` to another machine, or fold into the VPS git-sync. (Not yet wired.)

## 5. Secrets & config reference
| Name | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | `server/.env` | Postgres connection (role `tapntrack`) |
| `API_SECRET` | `server/.env` | Bearer token; also the app "access key" + Shortcut key |
| `PORT` | `server/.env` | API port (default 8787) |
| `VITE_API_URL` | build-time env / root `.env` | API base URL baked into the PWA (public) |
| access key | browser localStorage (`tapntrack_api_key`) | = `API_SECRET`, entered once per device |

## 6. Verify end-to-end
```bash
set -a && . server/.env && set +a
# Shortcut emulation (pull path): logs an event the app will show
curl -sS -X POST -H "Authorization: Bearer $API_SECRET" -H "Content-Type: application/json" \
  -d '{"activityId":"pressups","value":25}' localhost:8787/api/log
# 401 without auth:
curl -sS -o /dev/null -w '%{http_code}\n' localhost:8787/api/activities   # expect 401
```
Then in the app (built with `VITE_API_URL`): Connect → the event appears; logging in-app pushes to Postgres within ~2s. Full regression: `cd probe && npm run probe` (expect 36 passed / 1 skipped).

---

## 7. Clone for a NEW personal app
The pattern is app-agnostic. To stand up `myapp`:
1. Copy `server/` into the new repo; rename DB/role/service (`myapp`, `myapp-api`), pick a free `PORT`.
2. Replace `server/schema.sql` + `server/src/seed.js` with the app's tables/seed. Keep the API auth + `/api/log` shape (or adapt endpoints).
3. Repeat §2.1–2.5 with the new names (one Postgres instance hosts many app DBs).
4. Add a Caddy site block for `myapp.<domain>` (same reverse-proxy + static-serve shape).
5. Point the app's data layer at the API (copy `src/lib/api.ts` + the sync approach).
Result: uniform stack across all personal apps — Postgres + Node API + systemd + Caddy + nightly dumps.

## 8. Graduate to managed (if an app goes public)
The schema is deliberately Supabase-shaped. To move to Supabase/Vercel:
1. Change `id` columns TEXT→UUID; restore the `auth.users` FK + RLS policies (kept in `supabase/schema.sql`); map `user_id` → `auth.uid()`.
2. Swap the app's API client back to `supabase-js` (auth + PostgREST).
3. Deploy the frontend to Vercel (the repo already has `vercel.json`).
Because both sides are Postgres, this is a migration, not a rewrite.

## 9. Current instance facts (tapntrack)
- VPS: Ubuntu 26.04, IPv4 `167.233.145.41`, IPv6 `2a01:4f8:1c16:18de::1`.
- Postgres 18, DB `tapntrack`, role `tapntrack`, local only.
- API: systemd `tapntrack-api`, `127.0.0.1:8787`.
- Backups: cron `15 3 * * *` → `~/backups/tapntrack/`.
- **Live at `https://tapntrack.annanil.com`** (Caddy v2.11, Let's Encrypt TLS, serving `/var/www/tapntrack` + reverse-proxying `/api`). DNS: Namecheap A record `tapntrack → 167.233.145.41`. ufw allows 22/80/443.
- Repo: `github.com/tophercollins/tapntrack`, branch `claude/plan-tap-n-track-ibRet`.
- Legacy: was Vercel (`tapntrackapp` project) + a now-deleted Supabase project `prelcnhtfrchuwmmngyg`.

## 10. Troubleshooting
| Symptom | Check |
|---|---|
| API 500s | `journalctl -u tapntrack-api -n 50`; is Postgres up? `systemctl status postgresql` |
| App won't connect | `VITE_API_URL` correct + rebuilt? CORS? key matches `API_SECRET`? `curl .../health` |
| Shortcut 401 | Bearer header/key exact; 404 → `activityId` doesn't exist server-side |
| Caddy no cert | DNS A record propagated? ports 80/443 open? `journalctl -u caddy` |
| Nothing pulls | signed in (key stored)? check `/api/events` returns rows with the key |
```
