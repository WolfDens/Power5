// Regenerates a single task, avoiding duplicates with existing tasks

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { existingTasks, excludeTask, hopper, clientApiKey } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY || clientApiKey;
  if (!apiKey) return res.status(401).json({ error: "No API key" });

  const system = `You are the Power 5 priority assistant for Brian, a real estate investor at Tide & Timber Ventures in North Carolina.

Generate ONE new task to replace a task the user didn't like. It must be different from the existing tasks listed.

PRIORITY WEIGHTING:
1. RESimpli inbound leads
2. Contractor conversations
3. Active flip properties
4. Investor/partner outreach
5. Business systems — newsletter, cold caller, payroll, Instagram

Return ONLY valid JSON, no markdown:
{
  "task": {
    "title": "action-oriented, max 12 words",
    "source": "Gmail" | "Manual" | "ReSimpli" | "Hopper",
    "sourceIcon": "mail" | "edit" | "home" | "archive",
    "priority": "high" | "med" | "low",
    "reasoning": "one sentence"
  }
}`;

  let userMsg = `Generate one new task that is different from these already on the list:\n${(existingTasks || []).map(t => `- ${t}`).join("\n")}`;
  if (excludeTask) userMsg += `\n\nThe task being replaced was: "${excludeTask}" — generate something meaningfully different.`;
  if (hopper?.length > 0) userMsg += `\n\nConsider pulling from the hopper if relevant:\n${hopper.map(h => `- ${h.text}`).join("\n")}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system,
        messages: [{ role: "user", content: userMsg }],
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
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
