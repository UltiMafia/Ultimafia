const fs = require("fs");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const KEY = JSON.parse(fs.readFileSync(process.env.DEVAPI_KEY_FILE, "utf8"));
const TOKEN_CACHE = process.env.TOKEN_CACHE || `${__dirname}/.token-cache.json`;
let token = null;
try { const c = JSON.parse(fs.readFileSync(TOKEN_CACHE, "utf8")); if (c.at > Date.now() - 10 * 60 * 1000) token = c.token; } catch {}
async function getToken() {
  const r = await fetch(`${BASE}/api/dev/token`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId: KEY.clientId, clientSecret: KEY.clientSecret }) });
  if (!r.ok) throw new Error(`token ${r.status} ${await r.text()}`);
  token = (await r.json()).token;
  fs.writeFileSync(TOKEN_CACHE, JSON.stringify({ token, at: Date.now() }), { mode: 0o600 });
  return token;
}
async function api(method, path, body, retry = true) {
  if (!token) await getToken();
  const r = await fetch(`${BASE}/api${path}`, { method, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  if (r.status == 401 && retry) { await getToken(); return api(method, path, body, false); }
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!r.ok) { const e = new Error(`${method} ${path} -> ${r.status} ${text}`); e.status = r.status; throw e; }
  return data;
}
module.exports = { BASE, api, getToken, getTokenValue: () => token };
