// Same-origin proxying is explicitly enabled by the local development server.
// Keep existing production per-host/per-port routes unchanged by default.
export function socketEndpoint({ location, configuration, kind, port }) {
  if (configuration.sameOrigin === "true") {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    if (kind === "chat") return `${protocol}//${location.host}/ws/chat`;
    if (!/^\d+$/.test(String(port))) throw new Error("Invalid game socket port");
    return `${protocol}//${location.host}/ws/game/${port}`;
  }
  const host = !configuration.host || configuration.host === "localhost" ? location.hostname : configuration.host;
  if (configuration.usePort === "true") return `${configuration.protocol}://${host}:${port}`;
  if (kind === "chat") return `${configuration.protocol}://${host}/chatSocket`;
  return `${configuration.protocol}://${configuration.portHost || host}/${port}`;
}
