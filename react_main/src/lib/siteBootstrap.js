// Only data required by the application shell/game blocks mounting. Optional
// reference features publish independently, without extending the startup gate.
export const requiredSiteInfo = [
  ["/api/roles/all", "roles"],
  ["/api/roles/raw", "rolesRaw"],
  ["/api/roles/modifiers", "modifiers"],
  ["/api/roles/gamesettings", "gamesettings"],
  ["/api/items", "items"],
];
export const optionalSiteInfo = [
  ["/api/achievements", "achievementsRaw"],
  ["/api/roles/roletags", "tags"],
  ["/api/roles/descriptions", "learnGameDescriptionByType"],
  ["/api/stocks/config", "marketConfig"],
];

export function startSiteBootstrap({ get, publish, onReady, onError }) {
  const controller = new AbortController();
  let active = true;
  const load = ([url, prop]) => Promise.resolve()
    .then(() => get(url, { signal: controller.signal }))
    .then(response => { if (active) publish(prop, response.data); })
    .catch(error => { if (active) onError?.(prop, error); });
  const ready = Promise.all(requiredSiteInfo.map(load)).then(() => { if (active) onReady(); });
  const background = Promise.all(optionalSiteInfo.map(load));
  return { ready, background, cancel() { active = false; controller.abort(); } };
}
