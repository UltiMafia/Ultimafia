// The approved canonical scale (2026-11-13). One source for the structural
// checker and for the runtime tokens. Changing a number here is a product
// decision, not a cleanup.
const SCALE = {
  type: [12, 14, 16, 18, 20, 24],
  cards: { radii: [0, 6, 12], padding: [0, 4, 8, 12, 16, 24, 32] },
  actions: { heights: [32, 40, 44, 64], radii: [0, 8, 50, 999] },
  space: [0, 4, 8, 12, 16, 24, 32],
};
const NEAR = 0.75;
const onScale = (value, allowed) => allowed.some((candidate) => Math.abs(value - candidate) <= NEAR);
const round = (value) => Math.round(value * 10) / 10;

function compact(values) {
  const counts = new Map();
  for (const value of values) counts.set(round(value), (counts.get(round(value)) || 0) + 1);
  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}

function offScaleFor(signature) {
  const headings = (signature.headings || []).filter((heading) => !heading.authored && typeof heading.fontSize === "number");
  const cards = signature.cards || [];
  const actions = (signature.actions || []).filter((action) => typeof action.height === "number" && action.height >= 30 && (action.labelLength ?? 0) <= 40 && !action.disclosure);
  return {
    headings: compact(headings.filter((heading) => !onScale(heading.fontSize, SCALE.type)).map((heading) => heading.fontSize)),
    cardRadii: compact(cards.filter((card) => typeof card.radius === "number" && !onScale(card.radius, SCALE.cards.radii)).map((card) => card.radius)),
    cardPadding: compact(cards.filter((card) => typeof card.paddingTop === "number" && card.paddingTop > 0 && !onScale(card.paddingTop, SCALE.cards.padding)).map((card) => card.paddingTop)),
    actionHeights: compact(actions.filter((action) => !onScale(action.height, SCALE.actions.heights)).map((action) => action.height)),
    actionRadii: compact(actions.filter((action) => typeof action.radius === "number" && !onScale(action.radius, SCALE.actions.radii)).map((action) => action.radius)),
  };
}

const LABELS = {
  headings: { property: "heading.fontSize", expected: SCALE.type },
  cardRadii: { property: "card.radius", expected: SCALE.cards.radii },
  cardPadding: { property: "card.paddingTop", expected: SCALE.cards.padding },
  actionHeights: { property: "action.height", expected: SCALE.actions.heights },
  actionRadii: { property: "action.radius", expected: SCALE.actions.radii },
};

function applyScaleFindings(entry, add) {
  const found = offScaleFor(entry.signature);
  for (const [key, entries] of Object.entries(found)) {
    if (!entries.length) continue;
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const label = LABELS[key];
    add({
      family: entry.family, check: "off-scale", severity: "medium",
      member: entry.name, route: entry.route, property: label.property,
      observed: `${total} element${total === 1 ? "" : "s"}: ${entries.slice(0, 5).map(([value, count]) => `${value}px ×${count}`).join(", ")}`,
      familyValue: label.expected.join(", "),
      detail: `Rendered ${label.property} is outside the approved scale (${label.expected.join(", ")}px).`,
    });
  }
  return found;
}

function offScaleCensus(cases) {
  const totals = { headings: { elements: 0, routes: new Set(), values: new Map() }, cardRadii: { elements: 0, routes: new Set(), values: new Map() }, cardPadding: { elements: 0, routes: new Set(), values: new Map() }, actionHeights: { elements: 0, routes: new Set(), values: new Map() }, actionRadii: { elements: 0, routes: new Set(), values: new Map() } };
  for (const entry of cases) {
    if (!entry.ok || !entry.signature) continue;
    const found = offScaleFor(entry.signature);
    for (const [key, entries] of Object.entries(found)) {
      for (const [value, count] of entries) {
        totals[key].elements += count;
        totals[key].routes.add(entry.route);
        totals[key].values.set(value, (totals[key].values.get(value) || 0) + count);
      }
    }
  }
  return Object.fromEntries(Object.entries(totals).map(([key, data]) => [key, {
    elements: data.elements,
    routes: data.routes.size,
    values: [...data.values.entries()].sort((left, right) => right[1] - left[1]).map(([value, count]) => ({ value, count })),
  }]));
}

module.exports = { SCALE, offScaleFor, applyScaleFindings, offScaleCensus };
