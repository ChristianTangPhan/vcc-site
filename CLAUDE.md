# VACC church site — project notes

Website for **Vietnamese American Christian Church (VACC)**, Gulf Breeze, FL.
Live at **https://vcc-site.pages.dev** (Cloudflare Pages, auto-deploys on every push to `main`).
Owner: Christian Phan (Dudwen). Built mainly for iPhone use; also added to the home screen.

## Stack
- **Front end:** Vite + React + TypeScript (`src/`), plain CSS (`src/App.css`), no UI library.
- **API:** Cloudflare Pages Functions (`functions/api/**`), using `@neondatabase/serverless`.
- **Database:** Neon Postgres, db `vcc_db`, role `vcc_db_owner`. All access goes through SQL **functions** (never raw table queries from the API).
- **Secrets** (Cloudflare → Settings → Variables and Secrets, Production; locally in `.dev.vars`, git-ignored):
  `DATABASE_URL`, `ADMIN_KEY`. After changing a secret you MUST redeploy (Deployments → Retry deployment).

## Conventions (follow these)
- **snake_case filenames** everywhere (`info_fields.ts`, `series_editor.tsx`). Component names inside stay PascalCase.
- **DB naming:** ALL-CAPS plural tables, column prefixes per table (`p_` pastors, `s_` series, `sc_` series cancellations, `e_` events, `ep_` event presets, `i_` church info). Everything nullable except PKs. Function params use `in_` prefix. Functions use `SECURITY DEFINER` + `SET search_path TO 'public'`, table aliases in queries. Scripts wrapped in `BEGIN; ... COMMIT;`.
- `s_day` is **1–7, 1 = Sunday** (JS uses 0–6, so code does `s_day - 1`).
- Dates from the DB are returned as **text** (`"2026-11-12"`) to avoid timezone shifts.
- Owner reviews SQL before running it and prefers **one small step at a time**.
- Run `npm run build` before pushing (TypeScript treats unused code as an error; Cloudflare runs the same build).

## Database
| Table | Purpose |
|---|---|
| `PASTORS` | p_id, p_name, p_phone_number, p_email, p_image (URL like `/pastors/x.jpg` in `public/`) |
| `SERIES` | weekly repeating things (services, worship practice, prayer): s_id, s_name, s_description, s_location, s_day, s_start, s_end, s_sort_order, **s_show_on_home** |
| `SERIES_CANCELLATIONS` | skip one date of a series: sc_id, s_id (FK, cascade), sc_date, sc_reason; unique (s_id, sc_date) |
| `EVENTS` | one-time events: e_id, e_name, e_description, e_location, e_date, e_start, e_end |
| `EVENT_PRESETS` | saved event templates: ep_id, ep_label (unique), ep_name, ep_description, ep_location, ep_start, ep_end |
| `CHURCH_INFO` | single row (i_id = 1): i_name, i_abrv, i_tagline, i_about, i_address, i_phone, i_email, i_facebook, i_youtube, i_announcement |

Functions: `get_pastors`, `upsert_pastor`, `delete_pastor`, `get_series`, `upsert_series`, `delete_series`,
`get_series_cancellations`, `cancel_series_date`, `restore_series_date`, `get_events`, `upsert_event`, `delete_event`,
`get_event_presets`, `upsert_event_preset` (by label), `update_event_preset` (by id), `delete_event_preset`,
`get_church_info`, `update_church_info`. Upserts: NULL id = insert (returns new id), else update.

## API
- Public (GET): `/api/info`, `/api/pastors`, `/api/series`, `/api/cancellations`, `/api/events`
- Admin (`functions/api/admin/*`, guarded by `_middleware.ts` checking `Authorization: Bearer <ADMIN_KEY>`):
  `info` (PUT), `pastors` / `series` / `events` (POST upsert, DELETE ?id=), `presets` (GET, POST, PUT, DELETE),
  `cancellations` (POST cancel, DELETE ?s_id=&date= restore), `check` (GET, used by login)

## Front end layout
- `src/App.tsx` — loads all data (`loadAll`, with loading bar / "Try again" bar / ↻ refresh), nav, announcement, footer, picks the page by URL.
- `src/pages/` — `home_page.tsx` (hero, Today, Service Times, Pastors swipe row, About), `calendar_page.tsx`, `admin_page.tsx`.
- `src/editors/` — inline edit forms (info, pastor, series, event w/ presets + "also cancel", occurrence cancel/restore, preset manager).
- `src/components/` — `editable` (✏️ wrapper), `calendar` (week = Sun→next Sun, 8 days; month view), `cal_card`, `modal`, `text_field`.
- `src/lib/` — `dates`, `admin` (key storage + `sendAdmin`/`finishAdmin`), `maps` (Apple vs Google Maps link), `info_fields`.

## Behavior notes
- **Admin:** `/admin` → enter key → saved in localStorage on that device → home page shows ✏️ buttons + "Editing mode" bar. No link to /admin on the site.
- Series show on the calendar only **4 weeks ahead** (`SERIES_WEEKS_AHEAD` in App.tsx), rolling forward each Sunday.
- Visitors don't see cancelled dates; editors see them crossed out (to restore). Today cards have − / ↺ for editors and "+ Add event today".
- Service Times shows series with `s_show_on_home`; editors see all (hidden ones dimmed).
- Announcement banner (yellow) shows only when `i_announcement` has text; visitors can dismiss it (reappears if text changes).
- Theme colors are CSS variables at the top of `App.css`: orange `--brand` (church color), gold `--event` for one-time events.
- Neon free plan sleeps after ~5 min idle; first load can be slow — that's what the loading bar is for.

## Backlog (do NOT build until asked)
- Birthday page: admins add/remove; public sees only month + day; admins see/edit year.
- Church photos under the About text.
- Livestream section at bottom of home (YouTube/Facebook link), shown only when live — ideally auto (YouTube live check and/or during service times).
- Real church logo → replace `public/apple-touch-icon.png` (placeholder orange "VCC") .
- Rename VCC → VACC: name/short name editable on site (✏️ on banner); code spots: `index.html` title + `apple-mobile-web-app-title`, icon image. Repo/`pages.dev` rename optional (Pages project can't be renamed — would need a new project). Staying on free `pages.dev`, no custom domain for now.
- Photo uploads from phone (currently photo = link to a file in `public/`).
