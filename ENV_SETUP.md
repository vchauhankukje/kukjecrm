# Environment Variables Checklist

This project needs a `.env` file in the project root (same folder as `package.json`) that is **never committed to GitHub** — it's listed in `.gitignore` on purpose, since it holds secret keys.

When setting up on a new machine, create a file named exactly `.env` and fill in these values:

## Currently used

| Variable name | What it is | Where to get it |
|---|---|---|
| `VITE_SUPABASE_URL` | The project's Supabase API URL | Supabase dashboard → Project Settings → API → "Project URL" |
| `VITE_SUPABASE_ANON_KEY` | The public "anon" API key (safe for frontend use) | Supabase dashboard → Project Settings → API → "anon public" key |

Example `.env` file shape (values below are placeholders, not real):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Not currently used (reserved for future phases)

These were deliberately skipped in the current build (see project decisions) but are listed here in case they're added later:

| Variable name | What it would be | Where it would come from |
|---|---|---|
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 storage access key | Cloudflare dashboard → R2 → Manage API Tokens (not set up — Supabase Storage is used instead) |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 storage secret key | Same as above |
| `CLOUDFLARE_R2_BUCKET` | R2 bucket name | Same as above |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | Twilio Console home page (not set up — OTP is currently mocked, no real SMS) |
| `TWILIO_AUTH_TOKEN` | Twilio secret auth token | Same as above |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service identifier | Twilio Console → Verify → Services (requires trial account upgrade, not done) |

## Not needed in `.env` at all

- **Vercel**: deployment configuration lives in Vercel's own dashboard (project settings), not in this file. Nothing to copy here.
- **GitHub**: no credentials needed in `.env` — Git authentication is handled separately (see `SETUP.md`).
