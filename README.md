# Power5 — Setup Guide

## What you need
1. Vercel account (free) — you already have this
2. Anthropic API key — you already have this
3. A webhook secret — just make one up (e.g. "tideandtimber2025")

---

## Step 1 — Push to GitHub

Unzip this folder, push it to your GitHub repo (same as before).
Make sure Vercel root directory is set to `power5`.

---

## Step 2 — Enable Vercel KV (2 minutes)

1. Go to vercel.com → your Power5 project
2. Click **Storage** tab
3. Click **Create Database** → choose **KV**
4. Name it `power5-kv` → click Create
5. Click **Connect to Project** → select your Power5 project

Vercel automatically adds the KV environment variables. Done.

---

## Step 3 — Add environment variables

In Vercel → your project → **Settings** → **Environment Variables**, add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (sk-ant-...) |
| `WEBHOOK_SECRET` | Make up a password, e.g. `tideandtimber2025` |

Click Save, then redeploy.

---

## Step 4 — Connect Cowork (the magic part)

Add this as the final step in your Cowork morning digest task instructions:

```
After creating/updating the digest artifact, send the digest content to the Power5 app 
via a POST request:

URL: https://power5.vercel.app/api/digest
Method: POST
Headers: Content-Type: application/json
Body: {
  "secret": "tideandtimber2025",
  "digest": "<the full text content of the digest artifact>"
}

This stores the digest for Brian's Power5 app to read automatically when he opens it.
```

Replace `tideandtimber2025` with whatever you set as WEBHOOK_SECRET.
Replace `power5.vercel.app` with your actual Vercel URL.

---

## How it works after setup

- **4:30am** — Cowork runs, builds digest, POSTs it to /api/digest, stored automatically
- **When you open the app** — sees "Cowork digest ready", one tap to generate
- **Generation** — reads the digest from storage, calls Claude, returns your Power 5 in ~3 seconds
- **End Day** — locks the day, rolls incomplete tasks, syncs to KV
- **Any device** — phone, computer, same data from KV

---

## Adding phone to home screen

**iPhone (Safari):**
1. Open your app URL in Safari
2. Share button → Add to Home Screen
3. Name it Power5 → Add

**Android (Chrome):**
1. Open URL in Chrome
2. Three-dot menu → Add to Home Screen
