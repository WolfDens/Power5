# POWER5 — Setup Guide
### Your AI-powered daily priority system

---

## What is this?

Power5 is a personal productivity app that connects to your Gmail and Google Calendar, reads your emails each morning, and uses AI to generate your 5 most important tasks for the day. It tracks your completion history, builds a Power Score based on your performance, and learns your habits over time.

**Every person who sets this up gets their own completely private instance.** Your emails, tasks, and history are never shared with anyone else.

---

## What you'll need

- A computer (Mac or Windows)
- A Gmail account (this is what the app reads for your daily digest)
- About 15–20 minutes

**Accounts to create (all free or cheap):**

| Service | Cost | What it's for |
|---------|------|---------------|
| GitHub | Free | Stores the app code |
| Vercel | Free | Hosts the app |
| Upstash | Free | Saves your task history |
| Anthropic | ~$5 one-time | The AI that generates your list |
| Claude (claude.ai) | Free or Pro | Runs your morning email digest |

---

## Step 1 — Get the code

1. Go to **github.com** and create a free account if you don't have one
2. Go to the Power5 repository: **github.com/WolfDens/Power5**
3. Click the **Fork** button in the top right corner
4. This creates your own copy of the code — click **Create fork**

---

## Step 2 — Deploy to Vercel

1. Go to **vercel.com** and sign up with your GitHub account
2. Click **Add New Project**
3. Find your forked **Power5** repo and click **Import**
4. Leave all settings as default — Root Directory should be empty (files are at root)
5. Click **Deploy**
6. Wait about 60 seconds — you'll get a live URL like `power5-yourname.vercel.app`

---

## Step 3 — Set up your database (Upstash)

This is where your task history and data live.

1. In Vercel, go to your Power5 project → click **Storage** in the left sidebar
2. Click **Create Database** → select **Upstash** → select **Redis**
3. Give it any name (e.g. `power5-db`) → click **Create**
4. Click **Connect to Project** → select your Power5 project → confirm

Vercel will automatically add the database credentials to your project. You don't need to copy anything.

---

## Step 4 — Get your Anthropic API key

This powers the AI that generates your daily list.

1. Go to **console.anthropic.com** and create an account
2. Click **API Keys** in the left sidebar → click **Create Key**
3. Give it a name like `power5` → click **Create Key**
4. **Copy the key immediately** — it starts with `sk-ant-` and you won't be able to see it again
5. Go to **Billing** and add $5 in credits — this lasts several months at normal usage

---

## Step 5 — Add environment variables

This is where you plug in your API key and create a security password for your app.

1. In Vercel → your Power5 project → **Environments** (in left sidebar) → click **Production**
2. Click **Add Environment Variable**
3. Add the first variable:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your API key from Step 4 (the `sk-ant-...` one)
4. Click **+ Add Another** and add the second:
   - **Key:** `WEBHOOK_SECRET`
   - **Value:** make up any password — write it down, you'll need it later (example: `myname2025`)
5. Click **Save**
6. Go to **Deployments** → click the three dots on the latest deployment → **Redeploy**

Your app is now live. Open your Vercel URL — you should see the Power5 interface.

---

## Step 6 — Add it to your phone home screen

**iPhone (Safari only — must use Safari, not Chrome):**
1. Open your Vercel URL in Safari
2. Tap the Share button (box with arrow pointing up) at the bottom
3. Scroll down and tap **Add to Home Screen**
4. Name it `Power5` → tap **Add**

**Android (Chrome):**
1. Open your URL in Chrome
2. Tap the three-dot menu → **Add to Home Screen**

It opens full-screen like a native app.

---

## Step 7 — Set up your morning email digest (the magic part)

This is what makes Power5 automatic. A scheduled task reads your Gmail every morning and sends a summary to your app. Without this step, Power5 still works — you just won't have your emails automatically factored in.

1. Go to **claude.ai/code** in your browser (you need a Claude account — free tier works)
2. Click **Code** at the top → **Routines** in the left sidebar
3. Click **New routine** → select **Remote**
4. Fill in:
   - **Name:** Morning Email Digest
   - **Instructions:** Copy and paste everything in the box below
   - **Trigger:** Select **Schedule** → set to Weekdays, your preferred time (4:30 AM or before you wake up)
   - **Connectors:** Make sure Gmail and Google Calendar are listed
5. Click **Select an environment** → **New cloud environment**:
   - Network Access: **Custom**
   - Allowed Domains: `your-vercel-url.vercel.app` (your actual URL from Step 2)
   - Click **Create environment**
6. Select that environment for your routine
7. Click **Create**

### Instructions to paste (replace the placeholders):

```
Generate a morning email digest for [YOUR NAME] ([YOUR EMAIL]) and output it in the chat.

OBJECTIVE
Give [YOUR NAME] a fast, scannable read of what arrived in Gmail since the last business day, with four priorities:
1. Emails needing a reply (someone is waiting)
2. Action items & deadlines (specific asks, dates, commitments)
3. New project/deal updates
4. A general overview of everything else new

STEPS
1. Determine the lookback window:
   - Monday runs: cover Friday 7:30 AM through now.
   - Tue–Fri runs: cover the previous calendar day 7:30 AM through now (~24h).

2. Search all Gmail (not just inbox) for the lookback window, excluding promotions/social/updates/forums and trash/spam. Skip threads already replied to most recently. Cap at ~50 threads.

3. For substantive threads, fetch full content. For threads exceeding token limits: read the most recent message first, then go backwards for context. Never skip a thread — summarize what you can read.

4. Check Google Calendar for meetings and deadlines today and tomorrow.

5. Classify each thread:
   - NEEDS REPLY: direct question or awaiting input
   - ACTION / DEADLINE: task, due date, meeting, or commitment — include calendar events
   - FYI: informational only

6. Output a formatted digest with these sections:
   - "Needs Reply"
   - "Action Items & Deadlines" (include today/tomorrow calendar events)
   - "FYI / Overview"
   For each item: sender, subject, 1–2 sentence summary, Gmail link. Bold dates/deadlines. Include counts header.

7. Post a short summary: counts per bucket and 1–3 most time-sensitive items.

CONSTRAINTS
- Don't draft replies, mark as read, or change labels.
- If Gmail isn't authenticated, surface a clear message.
- If nothing new: output "Quiet morning — nothing needs your attention."

8. After outputting the digest, write a condensed plain text version (max 2000 words, all sections) to /tmp/power5_digest.txt, then run:

curl -X POST https://YOUR-VERCEL-URL.vercel.app/api/digest \
  -H "Content-Type: application/json" \
  -d "{\"secret\": \"YOUR-WEBHOOK-SECRET\", \"digest\": \"$(cat /tmp/power5_digest.txt)\"}"
```

**Before saving, replace:**
- `[YOUR NAME]` → your actual name
- `[YOUR EMAIL]` → your email address
- `YOUR-VERCEL-URL` → your actual Vercel URL (from Step 2)
- `YOUR-WEBHOOK-SECRET` → the password you created in Step 5

---

## How it works day-to-day

**Every weekday morning** (at whatever time you scheduled):
- Claude reads your Gmail and Calendar
- Classifies everything into buckets
- Sends a digest to your Power5 app automatically

**When you open the app:**
- If the digest ran: you'll see "Cowork digest ready" — tap **Let's go**
- If it hasn't run yet: tap **Pull latest digest** to check, or just tap **Let's go** to generate from your typical priorities
- Add any manual context in the optional text box
- Your Power 5 is generated in about 3 seconds

**During the day:**
- Tap tasks to check them off — syncs across your phone and computer automatically
- Drag to reorder, tap the pencil to edit, tap trash to remove
- Add tasks manually with the + button if needed
- Jot ideas in **In the Hopper** at the bottom — they get pulled in on future days when there's room

**End of day:**
- Tap **End Day** or it auto-locks at 11:59pm
- Incomplete tasks roll to tomorrow automatically
- Your history, streak, and Power Score update

---

## Troubleshooting

**"Load failed" or API error on the app**
→ Your Anthropic API key is wrong or has no credits. Go to console.anthropic.com, create a new key, update the `ANTHROPIC_API_KEY` environment variable in Vercel, and redeploy.

**Digest isn't showing up in the app**
→ Check that your Claude Code routine ran (look in the Routines section for recent runs). If it ran but still no digest, verify the webhook URL and secret in your routine instructions match exactly what's in your Vercel environment variables.

**App shows the wrong date**
→ Tap the date in the top left corner of the app to edit it.

**Tasks aren't syncing between phone and computer**
→ Check the sync indicator in the top right. If it shows an error, your Upstash database may need to be reconnected — go to Vercel → Storage and verify it's connected to your project.

---

## Your data and privacy

- Your task history lives in your own Upstash database — nobody else can access it
- Your API key is stored only in your Vercel environment variables — never exposed publicly
- The morning digest is processed by Claude using your own Claude account and Gmail authorization
- Nothing is shared with the person who shared this app with you

---

*Built on Power5 — questions? Reach out to whoever shared this with you.*
