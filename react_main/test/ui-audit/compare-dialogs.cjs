// Compares the dialogs, menus and popovers opened by the runtime pass.
const RISK = { high: 3, medium: 2, low: 1 };
const TOLERANCE = { radius: 0.5, titleFontSize: 1, bodyFontSize: 1 };

const mode = (values) => {
  const counts = new Map();
  for (const value of values) {
    if (value === null || value === undefined) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  let best = null;
  let bestCount = -1;
  for (const [value, count] of counts) if (count > bestCount) { best = value; bestCount = count; }
  return { value: best, count: bestCount, distinct: counts.size };
};

function compareDialogs({ dialogs, inventory }) {
  const findings = [];
  const add = (finding) => findings.push({ id: null, severity: "medium", ...finding });

  const rendered = dialogs.filter((entry) => entry.ok && entry.signature);
  const groups = new Map();
  for (const entry of rendered) {
    const key = `${entry.signature.kind}|${entry.width || 0}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  for (const [groupKey, entries] of groups) {
    const [kind, groupWidth] = groupKey.split("|");
    const pick = (property) => entries.map((entry) => entry.signature[property]).filter((value) => typeof value === "number");
    for (const property of ["radius", "titleFontSize", "bodyFontSize"]) {
      const values = pick(property);
      if (values.length < 2) continue;
      const spread = Math.max(...values) - Math.min(...values);
      if (spread <= TOLERANCE[property]) continue;
      const centre = mode(values).value;
      for (const entry of entries) {
        const observed = entry.signature[property];
        if (typeof observed !== "number" || Math.abs(observed - centre) <= TOLERANCE[property]) continue;
        add({
          check: `dialog-${property}`, severity: "medium", kind,
          route: entry.route, trigger: entry.trigger, title: entry.signature.title,
          property, observed, familyValue: centre,
          detail: `${kind} ${property} is ${observed} against ${centre} across ${kind}s.`,
        });
      }
    }

    // Content-sized popovers and menus legitimately vary with their contents.
    // Only the dialog frame's declared max-width is a comparable contract.
    if (kind === "dialog") {
      const widths = entries.map((entry) => entry.signature.maxWidth).filter(Boolean);
      if (widths.length >= 2) {
        const widthMode = mode(widths);
        if (widthMode.distinct > 1) for (const entry of entries) {
          const observed = entry.signature.maxWidth;
          if (!observed || observed === widthMode.value) continue;
          add({
            check: "dialog-max-width", severity: "medium", kind, width: entry.width,
            route: entry.route, trigger: entry.trigger, title: entry.signature.title,
            property: "maxWidth", observed, familyValue: widthMode.value,
            detail: `Dialog max-width is ${observed}; the common frame is ${widthMode.value}.`,
          });
        }
      }
    }
  }

  for (const entry of rendered) {
    const signature = entry.signature;
    if (signature.kind === "dialog" && signature.fieldCount > 0) {
      if (!signature.hasTitle) add({
        check: "dialog-missing-title", severity: "high", kind: signature.kind,
        route: entry.route, trigger: entry.trigger, title: null,
        property: "title", observed: "absent", familyValue: "a form dialog has a title",
        detail: `A ${signature.kind} with ${signature.fieldCount} fields has no title.`,
      });
      if (!signature.hasActions) add({
        check: "dialog-missing-actions", severity: "high", kind: signature.kind,
        route: entry.route, trigger: entry.trigger, title: signature.title,
        property: "actions", observed: "absent", familyValue: "a form dialog has an action region",
        detail: `A ${signature.kind} with ${signature.fieldCount} fields has no action region.`,
      });
    }

    if (signature.actionHeights.length > 1) add({
      check: "dialog-action-height-variance", severity: "medium", kind: signature.kind,
      route: entry.route, trigger: entry.trigger, title: signature.title,
      property: "button.height", observed: signature.actionHeights.join(", "), familyValue: "one action height",
      detail: `Buttons in this ${signature.kind} have different heights: ${signature.actionHeights.join(", ")}.`,
    });

    for (const item of signature.overflow || []) add({
      check: "dialog-overflow", severity: "high", kind: signature.kind,
      route: entry.route, trigger: entry.trigger, title: signature.title,
      property: "overflowX", observed: `${item.excess}px`, familyValue: "no horizontal overflow",
      selector: item.selector,
      detail: `Content is ${item.excess}px wider than its box inside this ${signature.kind}.`,
    });
  }

  const censusFor = (property) => {
    const counts = new Map();
    for (const entry of rendered) {
      const value = entry.signature[property] ?? (property === "width" ? entry.signature.box?.width : null);
      if (value === null || value === undefined) continue;
      const key = String(value);
      const current = counts.get(key) || { count: 0, kinds: new Set(), examples: [] };
      current.count++;
      current.kinds.add(entry.signature.kind);
      if (current.examples.length < 3) current.examples.push(`${entry.trigger} @ ${entry.route}`);
      counts.set(key, current);
    }
    return [...counts.entries()]
      .map(([value, data]) => ({ value, count: data.count, kinds: [...data.kinds], examples: data.examples }))
      .sort((left, right) => right.count - left.count);
  };

  const seen = new Set();
  const deduped = findings.filter((finding) => {
    const key = [finding.route, finding.trigger, finding.title, finding.property, finding.observed, finding.kind].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((left, right) => RISK[right.severity] - RISK[left.severity] || left.route.localeCompare(right.route));
  deduped.forEach((finding, index) => {
    if (finding.width === undefined) {
      finding.width = rendered.find((entry) => entry.route === finding.route && entry.trigger === finding.trigger && entry.signature.kind === finding.kind)?.width ?? null;
    }
    finding.id = `UD-${String(index + 1).padStart(4, "0")}`;
  });

  return {
    summary: {
      routes: new Set(dialogs.map((entry) => entry.route)).size,
      triggersTried: dialogs.reduce((total, entry) => total + (entry.triggersTried || 0), 0),
      overlaysOpened: rendered.length,
      byKind: Object.fromEntries([...groups.entries()].map(([kind, entries]) => [kind, entries.length])),
      findings: deduped.length,
      high: deduped.filter((finding) => finding.severity === "high").length,
      medium: deduped.filter((finding) => finding.severity === "medium").length,
      inventory,
      visualAcceptance: false,
    },
    findings: deduped,
    census: {
      radius: censusFor("radius"),
      titleFontSize: censusFor("titleFontSize"),
      bodyFontSize: censusFor("bodyFontSize"),
      maxWidth: censusFor("maxWidth"),
      actionHeights: (() => {
        const counts = new Map();
        for (const entry of rendered) for (const height of entry.signature.actionHeights) {
          const key = String(height);
          const current = counts.get(key) || { count: 0, kinds: new Set(), examples: [] };
          current.count++;
          current.kinds.add(entry.signature.kind);
          if (current.examples.length < 3) current.examples.push(`${entry.trigger} @ ${entry.route}`);
          counts.set(key, current);
        }
        return [...counts.entries()].map(([value, data]) => ({ value, count: data.count, kinds: [...data.kinds], examples: data.examples })).sort((left, right) => right.count - left.count);
      })(),
    },
  };
}

module.exports = { compareDialogs };
