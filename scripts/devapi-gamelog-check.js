const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const { CLIENT_ID, CLIENT_SECRET, GAME_ID } = process.env;

async function call(path, token, init = {}) {
  return fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
}

(async () => {
  const tokenRes = await call("/dev/token", null, {
    method: "POST",
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  });
  const { token } = await tokenRes.json();

  const anon = await call(`/dev/games/${GAME_ID}/log`);
  console.log("anonymous", anon.status, await anon.text());

  const page = await (await call(`/dev/games/${GAME_ID}/log`, token)).json();
  const counts = {};
  for (const e of page.events) counts[`${e.direction}:${e.event}`] = (counts[`${e.direction}:${e.event}`] || 0) + 1;
  console.log("events", page.events.length, "nextChunk", page.nextChunk);
  console.log("counts", JSON.stringify(counts));
  console.log("phases", page.events.filter((e) => e.event == "phase").map((e) => e.payload.name).join(" > "));
  console.log("sample in", JSON.stringify(page.events.find((e) => e.direction == "in")));

  const download = await call(`/dev/games/${GAME_ID}/log.jsonl`, token);
  const body = await download.text();
  console.log("download", download.status, download.headers.get("content-disposition"), "lines", body.trim().split("\n").length, "bytes", body.length);
})();
