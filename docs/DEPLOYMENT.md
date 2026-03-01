# UNSAID — Deployment Guide

## Architecture

```
Vercel (Frontend)          Render (Backend + DB)
┌──────────────┐          ┌──────────────────────┐
│  Next.js 14  │ ──API──▶ │  Express.js API       │
│  Static +SSR │          │  Prisma ORM           │
└──────────────┘          │  PostgreSQL (Render)   │
                          └──────────────────────┘
```

---

## Step 1: Push to GitHub

```bash
# Already done — repo initialized with initial commit
# Create the repo on GitHub (private):
gh auth login
gh repo create Unsaid --private --source=. --push

# OR manually:
# 1. Go to https://github.com/new
# 2. Name: Unsaid, Private, NO readme/gitignore
# 3. Then run:
git remote add origin https://github.com/YOUR_USERNAME/Unsaid.git
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

### Option A: Blueprint (Automatic)
1. Go to [render.com/blueprints](https://render.com/blueprints)
2. Connect your GitHub repo
3. Render reads `render.yaml` and auto-provisions:
   - **Web Service** (`unsaid-api`) — Node.js
   - **PostgreSQL** (`unsaid-db`) — Free tier
4. Set the manual env vars in the Render dashboard (see below)

### Option B: Manual Setup
1. **Create PostgreSQL Database:**
   - Render Dashboard → New → PostgreSQL
   - Name: `unsaid-db`, Free plan
   - Copy the **Internal Database URL**

2. **Create Web Service:**
   - Render Dashboard → New → Web Service
   - Connect GitHub repo → select `Unsaid`
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/index.js`
   - **Plan:** Free

3. **Environment Variables** (set in Render dashboard):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(from Render Postgres — Internal URL)* |
| `JWT_SECRET` | *(generate: `openssl rand -base64 64`)* |
| `JWT_REFRESH_SECRET` | *(generate: `openssl rand -base64 64`)* |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_DOMAIN` | `.onrender.com` |
| `FRONTEND_URL` | `https://unsaid.vercel.app` *(update after Vercel deploy)* |
| `GROQ_API_KEY` | *(from https://console.groq.com)* |
| `VAPID_PUBLIC_KEY` | *(generate: `npx web-push generate-vapid-keys`)* |
| `VAPID_PRIVATE_KEY` | *(from same command)* |
| `YOUTUBE_API_KEY` | *(from Google Cloud Console)* |

4. Deploy. Wait for build + migration to finish.
5. Test: `https://unsaid-api.onrender.com/api/health`

---

## Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `Unsaid` GitHub repo
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** `client`
5. **Environment Variables:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://unsaid-api.onrender.com/api` |
| `NEXT_PUBLIC_APP_NAME` | `UNSAID` |
| `NEXT_PUBLIC_INACTIVITY_TIMEOUT` | `300000` |
| `NEXT_PUBLIC_PIN_LOCK_TIMEOUT` | `60000` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | *(same VAPID public key from Step 2)* |

6. Deploy.

---

## Step 4: Connect Frontend ↔ Backend

After both are deployed:

1. **On Render:** Update `FRONTEND_URL` to your Vercel URL (e.g., `https://unsaid.vercel.app`)
2. **On Vercel:** Confirm `NEXT_PUBLIC_API_URL` points to your Render URL
3. Redeploy both if needed.

---

## Important Notes

### Free Tier Limits
- **Render Free:** Server spins down after 15 min of inactivity. First request takes ~30s to cold-start.
- **Render Postgres Free:** 1GB storage, expires after 90 days (backup and recreate).
- **Groq Free:** 100K tokens/day per model. The app has model fallback (3 models).
- **Vercel Free:** 100GB bandwidth/month, 6000 min build time/month.

### Music Files
The 430MB of local MP3 files are excluded from git. Options:
- Upload to a CDN (e.g., Cloudflare R2, AWS S3) and update `src` paths in `client/src/data/playlists.ts`
- Use the YouTube-based playlists (Indian playlists already use YouTube)

### Uploads (Profile Pictures)
Render free tier has an **ephemeral filesystem** — uploaded files are lost on redeploy.
For production, switch to cloud storage (S3, Cloudflare R2, etc.).

### Custom Domain
- Vercel: Settings → Domains → Add your domain
- Render: Settings → Custom Domains → Add your domain
- Update `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` accordingly
