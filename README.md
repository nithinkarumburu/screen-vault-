# Screen Vault — Personal Entertainment Library

A responsive React website with a dark cinematic black-and-gold design. Manage movies, TV/web series, anime, books, manga and games. Includes search, filters, statuses, ratings, notes, dashboard statistics, CSV import/export, and optional Supabase cloud sync.

## What's included

- Poster gallery (use a poster URL or a generated title card)
- Manual add/edit/delete
- Search across title, genre, platform, synopsis and notes
- Filters for format, status, genre and platform
- Statuses: To Watch, Watching, Completed, On Hold, Dropped, Wishlist, Playing, Reading
- Ratings from 0–10
- CSV import and export
- Dashboard with totals, format breakdown, top genres and average rating
- Optional Supabase email/password authentication and per-user cloud library
- Responsive mobile layout

## 1. Install prerequisites

Install Node.js 20 LTS or newer from https://nodejs.org/. Then unzip this project and open a terminal in the `screen_vault` folder.

Check installation:

```bash
node -v
npm -v
```

Install packages and start the site:

```bash
npm install
npm run dev
```

Open the local URL Vite prints, normally `http://localhost:5173`.

Without Supabase configured, the site runs in preview/local-session mode with a few demo titles. Changes are held in browser memory and are not durable; configure Supabase for real persistent storage and cross-device sync.

## 2. Set up cloud storage (Supabase)

1. Create a project at https://supabase.com/.
2. Open **SQL Editor** in your project.
3. Paste all of `supabase.sql` from this folder and run it.
4. Open **Project Settings → API** (or API Keys) and copy your Project URL and publishable/anon key.
5. Copy `.env.example` to a new file named `.env` in the project root.
6. Replace the placeholders:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

7. Stop and restart the dev server (`Ctrl+C`, then `npm run dev`).
8. Click **Connect cloud account** and create an account. Depending on your Supabase Auth email settings, you may need to confirm your email before signing in.

**Security notes**
- Do not put a Supabase `service_role` or secret key in a browser app. Use only the publishable/anon key.
- The SQL enables Row Level Security (RLS), and policies restrict each account to its own rows.
- Do not disable RLS on `library_items`.
- Keep `.env` private and out of GitHub. `.gitignore` is included.

## 3. Import your spreadsheet

Use the **Import CSV** button. The first row should contain column names. These names are supported (case-insensitive variants shown in parentheses):

| Column | Example |
|---|---|
| `title` (or `name`) | Person of Interest |
| `item_type` (or `type`, `Category`) | TV/Web Series |
| `year` | 2011 |
| `genres` | Crime, Drama, Sci-Fi |
| `platform` | Prime Video |
| `status` | To Watch |
| `rating` | 8.5 |
| `poster_url` (or `poster`) | https://example.com/poster.jpg |
| `synopsis` (or `description`) | Short summary |
| `notes` | Recommended by a friend |

Allowed `item_type` values: `Movie`, `TV/Web Series`, `Anime`, `Book`, `Manga`, `Game`.

Export your current library anytime with **Export**. Keep a backup of this CSV, especially before bulk imports. Import adds rows; it does not deduplicate titles automatically.

## 4. Build for production

```bash
npm run build
npm run preview
```

The production files are created in `dist/`. You can deploy the project to Vercel, Netlify, or another static host. Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in that host's environment-variable settings, then redeploy. Configure the host's SPA fallback if required by its platform.

## Notes / current limitations

- This starter uses a poster image URL rather than automatically fetching artwork. A future version can connect to a metadata API for automatic posters and synopsis.
- CSV import expects a header row and adds records; check your file before importing.
- The initial sample entries are demo data for the unconfigured preview. Once you connect Supabase, your account loads its own cloud records.
- No external service can be configured or deployed for you without access to your account; these instructions let you connect it safely.
