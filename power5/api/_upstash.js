// Lightweight Upstash Redis REST client — no npm package needed
// Uses KV_REST_API_URL and KV_REST_API_TOKEN set by Vercel/Upstash integration

async function upstash(command, ...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const res = await fetch(`${url}/${[command, ...args].map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export const kv = {
  async get(key) {
    const val = await upstash("GET", key);
    if (val === null) return null;
    try { return JSON.parse(val); } catch { return val; }
  },
  async set(key, value, opts = {}) {
    const args = [key, typeof value === "string" ? value : JSON.stringify(value)];
    if (opts.ex) args.push("EX", opts.ex);
    return upstash("SET", ...args);
  },
  async del(key) {
    return upstash("DEL", key);
  },
};
