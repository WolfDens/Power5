import { kv } from "./_upstash.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { secret, digest } = req.body || {};

  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!digest?.trim()) {
    return res.status(400).json({ error: "No digest content" });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    await kv.set(`digest:${today}`, digest.trim(), { ex: 172800 });
    return res.status(200).json({ ok: true, date: today });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
