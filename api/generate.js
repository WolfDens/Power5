import { kv } from "./_upstash.js";

const SYSTEM_PROMPT = `You are the Power 5 priority assistant for Brian, a real estate investor who runs Tide & Timber Ventures in North Carolina.

Given a morning email digest (classified into Needs Reply, Action Items, FYI) and any manual notes, pick the best 5 tasks for today.

PRIORITY WEIGHTING:
1. RESimpli inbound leads
2. Contractor conversations — follow-ups, permits, scheduling, materials
3. Active flip properties — scope, inspections, cost issues
4. Investor/partner outreach — triplex builds, passive investors
5. Business systems — The Howler newsletter, cold caller, Wise payroll, Instagram

RULES:
- Exactly 5 tasks, specific and action-oriented, max 12 words each
- Prefer Needs Reply and Action Items over FYI
- Manual inputs are signals not guarantees — note if deprioritized and why
- Return ONLY valid JSON, no markdown, no extra text

OUTPUT FORMAT:
{
  "tasks": [
    {
      "title": "action-oriented, max 12 words",
      "source": "Gmail" | "Manual" | "RESimpli",
      "sourceIcon": "mail" | "edit" | "home",
      "priority": "high" | "med" | "low",
      "reasoning": "one sentence why this made the list"
    }
  ],
  "insight": "2-3 sentences: what drove the list, any manual items deprioritized and why"
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { manualInput, rolledTasks } = req.body || {};
  const today = new Date().toISOString().slice(0, 10);

  let digestText = null;
  try {
    digestText = await kv.get(`digest:${today}`);
  } catch (e) {}

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  let userMessage = `Today is ${dateLabel}.\n\n`;

  if (digestText) {
    userMessage += `Morning email digest (auto-processed by Cowork at 4:30am):\n\n--- DIGEST ---\n${digestText}\n--- END ---\n\nUse this as your primary source.`;
  } else {
    userMessage += `No digest available today. Generate from Brian's typical priorities: RESimpli leads, contractor follow-ups, active flips, investor outreach, business systems.`;
  }

  if (rolledTasks?.length > 0) {
    userMessage += `\n\nRolled from yesterday:\n${rolledTasks.map(t => `- ${t.title}`).join("\n")}`;
  }

  if (manualInput?.trim()) {
    userMessage += `\n\nBrian also noted:\n"${manualInput.trim()}"\nTreat as signal only.`;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Claude error: ${err}` });
    }

    const data = await response.json();
    const text = data.content.filter(c => c.type === "text").map(c => c.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json({ ...parsed, usedDigest: !!digestText });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
