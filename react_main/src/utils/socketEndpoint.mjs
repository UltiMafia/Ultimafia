// Same-origin proxying is explicitly enabled by the local development server.
// Keep existing production per-host/per-port routes unchanged by default.
export function socketEndpoint({ location, configuration, kind, port }) {
  if (configuration.sameOrigin === "true") {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    if (kind === "chat") return `${protocol}//${location.host}/ws/chat`;
    if (!/^\d+$/.test(String(port))) throw new Error("Invalid game socket port");
    return `${protocol}//${location.host}/ws/game/${port}`;
  }
  const usePageHost = !configuration.host || configuration.host === "localhost";
  const host = usePageHost ? location.hostname : configuration.host;
  // A port-routed socket keeps the explicit protocol/host configuration.
  if (configuration.usePort === "true") return `${configuration.protocol}://${host}:${port}`;
  // A path-routed socket shares the page's port: the dev server runs on 3001,
  // and a dev server proxying a live backend needs its own port here too.
  const pathHost = usePageHost ? location.host : configuration.host;
  const protocol = usePageHost
    ? (location.protocol === "https:" ? "wss" : "ws")
    : configuration.protocol;
  if (kind === "chat") return `${protocol}://${pathHost}/chatSocket`;
  return `${protocol}://${configuration.portHost || pathHost}/${port}`;
}
