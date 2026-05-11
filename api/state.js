import { kv } from "./_upstash.js";

const STATE_KEY = "power5:state";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await kv.get(STATE_KEY);
      return res.status(200).json({ ok: true, data: data || null });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: "No data" });
    try {
      await kv.set(STATE_KEY, data);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
