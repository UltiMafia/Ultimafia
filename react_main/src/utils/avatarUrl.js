import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "Contexts";

const staticExistsCache = new Map();

export function viewerWantsStaticAvatars(user) {
  const value = user?.settings?.disableAnimatedAvatars;
  return value === true || value === "true";
}

export function avatarUrl(
  id,
  { family = false, freeze = false, cacheVal } = {}
) {
  if (!id) return "";
  const base = family ? `${id}_family_avatar` : `${id}_avatar`;
  const file = freeze ? `${base}_static.webp` : `${base}.webp`;
  return `/uploads/${file}${cacheVal != null ? `?t=${cacheVal}` : ""}`;
}

function probeCacheKey(id, family, cacheVal) {
  return `${family ? "f" : "u"}:${id}:${cacheVal ?? ""}`;
}

function probeStaticAvatar(id, { family = false, cacheVal } = {}) {
  const key = probeCacheKey(id, family, cacheVal);
  const cached = staticExistsCache.get(key);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  const url = avatarUrl(id, { family, freeze: true, cacheVal });
  const pending = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      staticExistsCache.set(key, true);
      resolve(true);
    };
    img.onerror = () => {
      staticExistsCache.set(key, false);
      resolve(false);
    };
    img.src = url;
  });
  staticExistsCache.set(key, pending);
  return pending;
}

export function useDisableAnimatedAvatars() {
  const user = useContext(UserContext);
  return viewerWantsStaticAvatars(user);
}

/**
 * Returns a display URL for a user or family avatar.
 * When the viewer has disabled animated avatars, prefers the still first-frame
 * sibling if it exists; otherwise falls back to the live file.
 */
export function useAvatarImageUrl(
  id,
  { cacheVal, family = false, skipFreeze = false } = {}
) {
  const freeze = useDisableAnimatedAvatars() && !skipFreeze;
  const live = avatarUrl(id, { family, freeze: false, cacheVal });
  const frozen = avatarUrl(id, { family, freeze: true, cacheVal });
  const cacheKey = probeCacheKey(id, family, cacheVal);
  const [useFrozen, setUseFrozen] = useState(
    () => freeze && staticExistsCache.get(cacheKey) === true
  );

  useEffect(() => {
    if (!id || !freeze) {
      setUseFrozen(false);
      return;
    }
    const cached = staticExistsCache.get(cacheKey);
    if (cached === true) {
      setUseFrozen(true);
      return;
    }
    if (cached === false) {
      setUseFrozen(false);
      return;
    }
    let cancelled = false;
    probeStaticAvatar(id, { family, cacheVal }).then((exists) => {
      if (!cancelled) setUseFrozen(!!exists);
    });
    return () => {
      cancelled = true;
    };
  }, [id, family, freeze, cacheVal, cacheKey]);

  if (!id) return "";
  return freeze && useFrozen ? frozen : live;
}

export function useAvatarUrlMap(ids, { cacheVal, family = false } = {}) {
  const freeze = useDisableAnimatedAvatars();
  const listKey = (ids || []).filter(Boolean).join(",");
  const [frozenIds, setFrozenIds] = useState(() => new Set());

  useEffect(() => {
    const list = listKey ? listKey.split(",") : [];
    if (!freeze || list.length === 0) {
      setFrozenIds(new Set());
      return;
    }
    let cancelled = false;
    Promise.all(
      list.map((id) =>
        probeStaticAvatar(id, { family, cacheVal }).then((ok) => [id, ok])
      )
    ).then((results) => {
      if (cancelled) return;
      const next = new Set();
      for (const [id, ok] of results) {
        if (ok) next.add(id);
      }
      setFrozenIds(next);
    });
    return () => {
      cancelled = true;
    };
  }, [listKey, freeze, family, cacheVal]);

  return useMemo(() => {
    const map = {};
    const list = listKey ? listKey.split(",") : [];
    for (const id of list) {
      map[id] = avatarUrl(id, {
        family,
        freeze: freeze && frozenIds.has(id),
        cacheVal,
      });
    }
    return map;
  }, [listKey, freeze, frozenIds, family, cacheVal]);
}

export function AvatarPhoto({ src, alt = "" }) {
  if (!src) return null;
  return (
    <img className="avatar-img" src={src} alt={alt} draggable={false} />
  );
}

export function FamilyAvatarImage({
  id,
  size = 40,
  cacheVal,
  extraStyle,
  className,
}) {
  const src = useAvatarImageUrl(id, { family: true, cacheVal });
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        ...extraStyle,
      }}
    >
      <AvatarPhoto src={src} />
    </div>
  );
}
