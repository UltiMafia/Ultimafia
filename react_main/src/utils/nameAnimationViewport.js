// One observer per transcript, not one observer per rendered name.
const viewports = new WeakMap();

function setActive(element, active) {
  if (active) {
    element.style.removeProperty("animation-name");
    element.style.removeProperty("will-change");
  } else {
    // Pausing alone retains animation effects/layers for the whole history.
    element.style.animationName = "none";
    element.style.willChange = "auto";
  }
}

export function observeNameAnimation(element) {
  const root = element?.closest("[data-name-animation-viewport]");
  if (!root || typeof IntersectionObserver === "undefined") return undefined;
  let group = viewports.get(root);
  if (!group) {
    group = { nodes: new Set(), observer: null };
    group.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (group.nodes.has(entry.target)) {
          setActive(entry.target, entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0);
        }
      }
    // Edge adjacency can keep isIntersecting true at zero clipped area.
    }, { root, threshold: [0, Number.EPSILON] });
    viewports.set(root, group);
  }
  group.nodes.add(element);
  setActive(element, false);
  group.observer.observe(element);
  return () => {
    group.observer.unobserve(element);
    group.nodes.delete(element);
    setActive(element, true);
    if (!group.nodes.size) {
      group.observer.disconnect();
      viewports.delete(root);
    }
  };
}
