import { kv } from "./_upstash.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const today = new Date().toISOString().slice(0, 10);
  try {
    const digest = await kv.get(`digest:${today}`);
    return res.status(200).json({ available: !!digest, date: today });
  } catch (e) {
    return res.status(200).json({ available: false, date: today });
  }
}
