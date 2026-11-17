// Compares structural signatures within and across page families. Pure
// functions: the browser runner supplies the signatures, this module decides
// what counts as a divergence.
const { applyScaleFindings, offScaleCensus } = require("./scale.cjs");
const RISK = { high: 3, medium: 2, low: 1 };
const TOLERANCE = { radius: 0.5, paddingTop: 3, paddingLeft: 3, gap: 3, headingFontSize: 1 };

const mode = (values) => {
  const counts = new Map();
  for (const value of values) {
    if (value === null || value === undefined) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  let best = null;
  let bestCount = -1;
  for (const [value, count] of counts) {
    if (count > bestCount) { best = value; bestCount = count; }
  }
  return { value: best, count: bestCount, distinct: counts.size };
};

const median = (values) => {
  const sorted = values.filter((value) => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const blocksByRole = (signature) => {
  const map = new Map();
  for (const block of signature.blocks || []) {
    if (!map.has(block.role)) map.set(block.role, []);
    map.get(block.role).push(block);
  }
  return map;
};

function compareFamilies(input) {
  const findings = [];
  const failures = [];
  let currentWidth = null;
  const add = (finding) => findings.push({ id: null, width: currentWidth, ...finding });
  const familyReports = [];

  const byFamily = new Map();
  for (const entry of input.cases) {
    if (!entry.family) continue;
    const key = `${entry.family}|${entry.width}`;
    if (!byFamily.has(key)) byFamily.set(key, []);
    byFamily.get(key).push(entry);
  }

  for (const family of input.families) {
    for (const width of input.widths) {
      currentWidth = width;
      const entries = byFamily.get(`${family.id}|${width}`) || [];
      const renderedMembers = entries.filter((entry) => entry.ok && entry.signature);
      // Editors without a settings step (roles-only games) are verified by the
      // shell check, not compared on a different screen.
      const members = family.id === "editors-setup"
        ? renderedMembers.filter((entry) => entry.hasSettingsStep && entry.settingsSignature)
        : renderedMembers;
      for (const entry of entries.filter((value) => !value.ok)) {
        failures.push({ family: family.id, width, name: entry.name, route: entry.route, error: entry.error });
      }
      const report = { family: family.id, label: family.label, width, compared: members.map((entry) => entry.name), high: 0, medium: 0, low: 0 };
      if (family.id === "editors-setup") report.note = "Compared on the shared Game settings step. The roles step is content-dependent and is verified by the editor shell check.";
      familyReports.push(report);
      if (members.length < 2) {
        report.note = "fewer than two rendered members; no comparison";
        continue;
      }

      // Editors have content-dependent first steps (roles vs settings). Compare
      // them on the step every game shares; the shell and role steps are
      // verified separately.
      const signatureOf = (member) => family.id === "editors-setup"
        ? (member.settingsSignature || member.signature)
        : member.signature;
      const gapValues = members.map((member) => signatureOf(member).cardGapMedian).filter((value) => typeof value === "number");
      if (gapValues.length >= 2) {
        const gapCentre = median(gapValues);
        const gapSpread = Math.max(...gapValues) - Math.min(...gapValues);
        if (gapSpread > 2) for (const member of members) {
          const value = signatureOf(member).cardGapMedian;
          if (typeof value !== "number" || Math.abs(value - gapCentre) <= 2) continue;
          add({
            family: family.id, check: "card-gap-divergence", severity: "medium",
            member: member.name, route: member.route, property: "cardGapMedian",
            observed: value, familyValue: gapCentre,
            detail: `Card gaps are ${value}px here against ${gapCentre}px across the family.`,
          });
          report.medium++;
        }
      }
      const reference = family.reference ? members.find((entry) => entry.name === family.reference) : null;
      const roles = new Map();
      for (const member of members) for (const role of blocksByRole(signatureOf(member)).keys()) {
        if (!roles.has(role)) roles.set(role, []);
        roles.get(role).push(member);
      }

      // Page header contract: same level, same size, same offset from the shell.
      const headers = members.map((member) => ({ member, header: signatureOf(member).pageHeader })).filter((value) => value.header);
      if (headers.length >= 2) {
        const levelMode = mode(headers.map((value) => value.header.level));
        const sizeMode = mode(headers.map((value) => value.header.fontSize));
        for (const { member, header } of headers) {
          if (levelMode.distinct > 1 && header.level !== levelMode.value) {
            add({
              family: family.id, check: "header-level", severity: "medium",
              member: member.name, route: member.route, property: "pageHeader.level",
              observed: `h${header.level}`, familyValue: `h${levelMode.value}`,
              selector: header.selector,
              detail: `Page title is h${header.level}; the family uses h${levelMode.value}.`,
            });
            report.medium++;
          }
          if (sizeMode.distinct > 1 && typeof header.fontSize === "number" && Math.abs(header.fontSize - sizeMode.value) > 1) {
            add({
              family: family.id, check: "header-size", severity: "medium",
              member: member.name, route: member.route, property: "pageHeader.fontSize",
              observed: header.fontSize, familyValue: sizeMode.value,
              selector: header.selector,
              detail: `Page title is ${header.fontSize}px; the family uses ${sizeMode.value}px.`,
            });
            report.medium++;
          }
        }
      }
      if (headers.length >= Math.ceil(members.length * 0.6)) for (const member of members) {
        if (signatureOf(member).pageHeader) continue;
        add({
          family: family.id, check: "missing-header", severity: "medium",
          member: member.name, route: member.route, property: "pageHeader",
          observed: "absent", familyValue: `${headers.length}/${members.length} members have one`,
          detail: "No page title was found on this route.",
        });
        report.medium++;
      }

      for (const [role, holders] of roles) {
        const required = Math.ceil(members.length * 0.6);
        for (const member of members) {
          const blocks = blocksByRole(signatureOf(member)).get(role);
          if (!blocks && holders.length >= required) {
            add({
              family: family.id, check: "missing-block", severity: "medium",
              member: member.name, route: member.route, property: role,
              observed: "absent", familyValue: `${holders.length}/${members.length} members have it`,
              detail: `A "${role}" block is missing.`,
            });
            report.medium++;
          }
        }

        const present = members
          .map((member) => ({ member, block: (blocksByRole(signatureOf(member)).get(role) || [])[0] }))
          .filter((value) => value.block);
        if (present.length < 2) continue;

        const referenceBlock = reference ? (blocksByRole(signatureOf(reference)).get(role) || [])[0] : null;
        const containerMode = mode(present.map((value) => value.block.container));
        const containerNorm = referenceBlock ? referenceBlock.container : containerMode.value;
        // With an explicit reference member, every other member is measured
        // against it. Without one, a split family is reported as a split rather
        // than letting the majority quietly define the target.
        const split = !referenceBlock && containerMode.count * 2 <= present.length;
        for (const { member, block } of present) {
          if (containerMode.distinct > 1 && block.container !== containerNorm) {
            add({
              family: family.id, check: "container-mismatch", severity: "high",
              member: member.name, route: member.route, property: `${role}.container`,
              observed: block.container,
              familyValue: referenceBlock ? `reference: ${reference.name}` : split ? `split: ${present.map((value) => value.block.container).join(" / ")}` : containerNorm,
              selector: block.selector,
              detail: referenceBlock
                ? `"${role}" uses ${block.container} here; the reference member uses ${containerNorm}.`
                : split
                  ? `Members disagree about the container for "${role}": ${block.container} here, ${present.filter((value) => value.block.container !== block.container).map((value) => value.block.container).join(", ") || "same"} elsewhere.`
                  : `"${role}" uses ${block.container} here but ${containerNorm} is the family norm.`,
            });
            report.high++;
          }
        }

        for (const property of Object.keys(TOLERANCE)) {
          const values = present.map((value) => value.block.tokens?.[property]).filter((value) => typeof value === "number");
          if (values.length < 2) continue;
          const spread = Math.max(...values) - Math.min(...values);
          if (spread <= TOLERANCE[property]) continue;
          const centre = reference ? present.find((value) => value.member.name === reference.name)?.block.tokens?.[property] : median(values);
          if (typeof centre !== "number") continue;
          for (const { member, block } of present) {
            const observed = block.tokens?.[property];
            if (typeof observed !== "number") continue;
            if (Math.abs(observed - centre) <= TOLERANCE[property]) continue;
            add({
              family: family.id, check: "token-divergence", severity: "medium",
              member: member.name, route: member.route, property: `${role}.${property}`,
              observed, familyValue: centre, spread, basis: reference ? `reference: ${reference.name}` : "family median",
              selector: block.selector,
              detail: `"${role}" ${property} is ${observed} against ${centre} (family spread ${Math.round(spread * 100) / 100}).`,
            });
            report.medium++;
          }
        }

        const levels = present.map((value) => value.block.headingLevel).filter((value) => value !== null && value !== undefined);
        if (levels.length >= 2) {
          const levelMode = mode(levels);
          const levelNorm = referenceBlock && referenceBlock.headingLevel !== null ? referenceBlock.headingLevel : levelMode.value;
          if (levelMode.distinct > 1) for (const { member, block } of present) {
            if (block.headingLevel === null || block.headingLevel === levelNorm) continue;
            add({
              family: family.id, check: "heading-level", severity: "medium",
              member: member.name, route: member.route, property: `${role}.headingLevel`,
              observed: `h${block.headingLevel}`, familyValue: referenceBlock ? `reference: ${reference.name} (h${levelNorm})` : `h${levelNorm}`,
              selector: block.selector,
              detail: `"${role}" is headed h${block.headingLevel} here, h${levelNorm} in the family.`,
            });
            report.medium++;
          }
        }
      }
    }
  }

  for (const entry of input.cases.filter((value) => value.ok && value.signature)) {
    currentWidth = entry.width;
    const signature = entry.signature;
    const cards = signature.cards || [];
    const containers = new Set(cards.map((card) => card.container));
    if (containers.size > 1) {
      add({
        family: entry.family, check: "mixed-card-containers", severity: "high",
        member: entry.name, route: entry.route, property: "card.container",
        observed: [...containers].join(", "), familyValue: "one container treatment",
        detail: `This page builds cards from ${containers.size} different primitives: ${[...containers].join(", ")}.`,
      });
    }

    // A class named "card" is not a card. If its computed surface is missing,
    // that is a high-severity visual defect regardless of container labels.
    const flatCards = cards.filter((card) =>
      card.container === "ui-card" &&
      !/header-panel|banner|media|flush/.test(card.className || "") &&
      (!card.hasBackground || !(card.radius > 0) || !(card.paddingTop >= 8))
    );
    if (flatCards.length) {
      add({
        family: entry.family, check: "card-without-surface", severity: "high",
        member: entry.name, route: entry.route, property: "card.surface",
        observed: `${flatCards.length} ui-card${flatCards.length === 1 ? "" : "s"} with no surface`,
        familyValue: "opaque background, radius and padding",
        selector: flatCards[0].selector,
        detail: `A ui-card renders with ${flatCards[0].hasBackground ? "a background" : "no background"}, radius ${flatCards[0].radius}, padding ${flatCards[0].paddingTop}.`,
      });
    }

    const cardBoxes = cards.filter((card) => card.width > 0 && card.height > 0);
    const visibleCards = cardBoxes.filter((card) => !cardBoxes.some((other) =>
      other !== card && other.x <= card.x + 1 && other.y <= card.y + 1 &&
      other.x + other.width >= card.x + card.width - 1 &&
      other.y + other.height >= card.y + card.height - 1));
    const isChrome = (card) => /header-panel|banner|media/.test(card.className || "");
    const unevenPadding = visibleCards.filter((card) => {
      if (isChrome(card)) return false;
      const sides = [card.paddingTop, card.paddingRight, card.paddingBottom, card.paddingLeft].filter((value) => typeof value === "number");
      return sides.length === 4 && Math.max(...sides) - Math.min(...sides) > 2;
    });
    if (unevenPadding.length) {
      add({
        family: entry.family, check: "uneven-card-padding", severity: "high",
        member: entry.name, route: entry.route, property: "card.padding",
        observed: `${unevenPadding.length} card${unevenPadding.length === 1 ? "" : "s"}`,
        familyValue: "equal padding on all sides",
        selector: unevenPadding[0].selector,
        detail: `Card padding is ${unevenPadding[0].paddingTop}/${unevenPadding[0].paddingRight}/${unevenPadding[0].paddingBottom}/${unevenPadding[0].paddingLeft} (top/right/bottom/left).`,
      });
    }

    const pageGaps = signature.cardGaps || [];
    if (pageGaps.length >= 2 && Math.max(...pageGaps) - Math.min(...pageGaps) > 4) {
      add({
        family: entry.family, check: "uneven-card-gaps", severity: "high",
        member: entry.name, route: entry.route, property: "card.gap",
        observed: pageGaps.join(", "), familyValue: "one card gap",
        detail: `Card-to-card gaps on this page are ${pageGaps.join(", ")}px.`,
      });
    }

    const commentTails = cards.filter((card) => card.role === "comments" && typeof card.lastCommentPaddingBottom === "number" && card.lastCommentPaddingBottom > 1);
    if (commentTails.length) {
      add({
        family: entry.family, check: "comment-tail-padding", severity: "high",
        member: entry.name, route: entry.route, property: "comment.lastRowPaddingBottom",
        observed: commentTails[0].lastCommentPaddingBottom, familyValue: 0,
        selector: commentTails[0].selector,
        detail: "The last comment row adds padding below the card's own padding.",
      });
    }

    const doublePadding = visibleCards.filter((card) => !isChrome(card) && card.role !== "comments" && typeof card.firstChildPaddingTop === "number" && card.firstChildPaddingTop > 4);
    if (doublePadding.length) {
      add({
        family: entry.family, check: "double-card-padding", severity: "medium",
        member: entry.name, route: entry.route, property: "card.firstChildPaddingTop",
        observed: doublePadding[0].firstChildPaddingTop, familyValue: 0,
        selector: doublePadding[0].selector,
        detail: "The card's first child adds its own padding, so content is inset further than the card padding.",
      });
    }

    const cardStyles = new Map();
    for (const card of cards) {
      if (/header-panel|banner|media/.test(card.className || "")) continue;
      const key = `${card.radius}|${card.paddingTop}|${card.hasBackground}|${card.borderWidth}`;
      cardStyles.set(key, (cardStyles.get(key) || 0) + 1);
    }
    if (cardStyles.size > 1) {
      add({
        family: entry.family, check: "card-style-variance", severity: "medium",
        member: entry.name, route: entry.route, property: "card.style",
        observed: `${cardStyles.size} treatments`, familyValue: "one treatment",
        detail: `Cards on this page differ in radius, padding, background or border: ${[...cardStyles.entries()].map(([key, count]) => `${key} ×${count}`).join("; ")}.`,
      });
    }

    const byLevel = new Map();
    for (const heading of (signature.headings || []).filter((heading) => !heading.authored)) {
      if (!byLevel.has(heading.level)) byLevel.set(heading.level, []);
      byLevel.get(heading.level).push(heading);
    }
    for (const [level, headings] of byLevel) {
      const sizes = headings.map((heading) => heading.fontSize).filter((value) => typeof value === "number");
      if (sizes.length < 2) continue;
      const spread = Math.max(...sizes) - Math.min(...sizes);
      if (spread <= 1) continue;
      add({
        family: entry.family, check: "heading-size-variance", severity: "medium",
        member: entry.name, route: entry.route, property: `h${level}.fontSize`,
        observed: `${Math.min(...sizes)}–${Math.max(...sizes)}px`, familyValue: "one size per level",
        detail: `Same-level headings differ by ${Math.round(spread * 100) / 100}px: ${headings.slice(0, 4).map((heading) => `${heading.fontSize}px "${heading.text}"`).join("; ")}.`,
      });
    }

    const listPrimitives = new Set((signature.lists || []).filter((list) => list.rows > 1).map((list) => list.primitive || list.container));
    if (listPrimitives.size > 1) {
      add({
        family: entry.family, check: "mixed-list-primitives", severity: "medium",
        member: entry.name, route: entry.route, property: "list.primitive",
        observed: [...listPrimitives].join(", "), familyValue: "one list treatment",
        detail: `This page uses ${listPrimitives.size} list treatments: ${[...listPrimitives].join(", ")}.`,
      });
    }

    for (const item of signature.overflow || []) {
      add({
        family: entry.family, check: "horizontal-overflow", severity: "high",
        member: entry.name, route: entry.route, property: "overflowX",
        observed: `${item.excess}px wider than its box`, familyValue: "no horizontal overflow",
        selector: item.selector,
        detail: `Content is ${item.excess}px wider than its box (${item.overflowX}); extends to ${item.right}px in a ${item.viewport}px viewport.`,
      });
    }

    for (const item of signature.contrast || []) {
      add({
        family: entry.family, check: "low-contrast", severity: item.ratio < 3 ? "high" : "medium",
        member: entry.name, route: entry.route, property: "contrast",
        observed: `${item.ratio}:1`, familyValue: `>= ${item.minimum}:1`,
        selector: item.selector,
        detail: `"${item.text}" at ${item.fontSize}px is ${item.ratio}:1 on ${item.background}.`,
      });
    }

    applyScaleFindings({ ...entry, family: entry.family }, add);

    if ((signature.unprotectedText || []).length) {
      const items = signature.unprotectedText;
      add({
        family: entry.family, check: "unprotected-text", severity: "high",
        member: entry.name, route: entry.route, property: "authored-background",
        observed: `${items.length} text item${items.length === 1 ? "" : "s"} without a surface`,
        familyValue: "own opaque surface",
        selector: items[0].selector,
        detail: `Text sits directly on the page's authored background. First: "${items[0].text}".`,
      });
    }
  }

  findings.sort((left, right) => RISK[right.severity] - RISK[left.severity] || left.family.localeCompare(right.family) || left.member.localeCompare(right.member));
  findings.forEach((finding, index) => { finding.id = `UF-${String(index + 1).padStart(4, "0")}`; });

  const census = {
    cardRadii: new Map(), cardContainers: new Map(), headingSizes: new Map(),
    actionHeights: new Map(), listPrimitives: new Map(), routes: 0,
  };
  const bump = (map, value) => {
    if (value === null || value === undefined) return;
    const key = String(value);
    const current = map.get(key) || { count: 0, routes: new Set() };
    current.count++;
    map.set(key, current);
    return current;
  };
  for (const entry of input.cases.filter((value) => value.ok && value.signature)) {
    census.routes++;
    for (const card of entry.signature.cards || []) {
      bump(census.cardRadii, card.radius)?.routes.add(entry.route);
      bump(census.cardContainers, card.container)?.routes.add(entry.route);
    }
    for (const heading of (entry.signature.headings || []).filter((value) => !value.authored)) {
      bump(census.headingSizes, heading.fontSize)?.routes.add(entry.route);
    }
    for (const action of entry.signature.actions || []) bump(census.actionHeights, action.height)?.routes.add(entry.route);
    for (const list of entry.signature.lists || []) if (list.rows > 1) bump(census.listPrimitives, list.primitive || list.container)?.routes.add(entry.route);
  }
  const serialiseCensus = (map) => [...map.entries()]
    .map(([value, data]) => ({ value, count: data.count, routes: data.routes.size }))
    .sort((left, right) => right.count - left.count);

  const summary = {
    routes: input.cases.length,
    rendered: input.cases.filter((entry) => entry.ok).length,
    failed: failures.length,
    findings: findings.length,
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length,
    width: input.widths,
    theme: input.theme,
    visualAcceptance: false,
  };

  const offScale = offScaleCensus(input.cases);
  const offScaleElements = Object.values(offScale).reduce((total, value) => total + value.elements, 0);
  summary.offScaleElements = offScaleElements;
  return { summary, findings, failures, families: familyReports, offScale, census: {
    cardRadii: serialiseCensus(census.cardRadii),
    cardContainers: serialiseCensus(census.cardContainers),
    headingSizes: serialiseCensus(census.headingSizes),
    actionHeights: serialiseCensus(census.actionHeights),
    listPrimitives: serialiseCensus(census.listPrimitives),
    routes: census.routes,
  } };
}

module.exports = { compareFamilies };
