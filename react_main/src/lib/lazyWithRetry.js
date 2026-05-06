import { lazy } from "react";

const RELOAD_KEY = "ultimafia:chunk-reload";

function isChunkLoadError(err) {
  if (!err) return false;
  const name = err.name || "";
  const message = err.message || "";
  return (
    name === "ChunkLoadError" ||
    /Loading chunk [\d\w]+ failed/i.test(message) ||
    /Loading CSS chunk [\d\w]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

export function lazyWithRetry(factory) {
  return lazy(() =>
    factory().catch((err) => {
      if (!isChunkLoadError(err)) throw err;

      const alreadyReloaded =
        typeof window !== "undefined" &&
        window.sessionStorage?.getItem(RELOAD_KEY) === "1";

      if (alreadyReloaded) throw err;

      try {
        window.sessionStorage.setItem(RELOAD_KEY, "1");
      } catch (_) {}

      window.location.reload();
      return new Promise(() => {});
    })
  );
}

export function clearChunkReloadFlag() {
  try {
    window.sessionStorage.removeItem(RELOAD_KEY);
  } catch (_) {}
}
