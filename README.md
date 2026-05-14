# POWER5

Your AI-powered daily priority system — connects to Gmail, generates your top 5 tasks each morning, tracks your performance over time.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WolfDens/Power5&project-name=power5&repository-name=power5)

---

## Quick start

1. Click **Deploy with Vercel** above — forks the repo and deploys in ~60 seconds
2. In Vercel → your project → **Storage** → connect an **Upstash Redis** database
3. Open your deployed app URL — the setup wizard walks you through the rest

That's it. The app handles API key entry and onboarding in-browser.

---

## Full setup guide

For the complete step-by-step walkthrough including the morning email digest setup, see [SETUP.md](./SETUP.md).

---

## How it works

- A Claude Code routine runs at 4:30am, reads your Gmail, and POSTs a digest to your app
- When you open the app, your digest is ready — one tap generates your Power 5
- Check off tasks throughout the day — syncs across phone and computer
- End Day locks the list, rolls incomplete tasks, updates your Power Score
- Habits screen surfaces patterns in your behavior over time

## Stack

- **Frontend:** React + Vite, deployed on Vercel
- **API:** Vercel serverless functions
- **Storage:** Upstash Redis (task history, digest cache)
- **AI:** Anthropic Claude (Haiku for generation)
- **Digest:** Claude Code scheduled routine via Gmail MCP
