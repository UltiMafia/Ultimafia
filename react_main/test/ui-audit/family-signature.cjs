// Runs inside the Playwright page with no application dependencies.
// Produces a structural signature of one rendered page so that pages of the
// same kind can be compared without anyone writing a list of expected flaws.
function familySignature() {
  const main = document.querySelector("#main-content");
  const shell = (main && main.querySelector(".ui-page")) || main || document.body;
  // Some routes (forum thread, moderation cases) do not use the shared page
  // shell. Descend through single-child wrappers so their content is measured
  // instead of the wrapper alone.
  let pageRoot = shell;
  for (let level = 0; level < 3; level++) {
    const children = [...pageRoot.children].filter((child) => {
      const style = getComputedStyle(child);
      const box = child.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    });
    if (children.length !== 1) break;
    pageRoot = children[0];
  }
  const className = (element) =>
    typeof element.className === "string" ? element.className : element.getAttribute("class") || "";
  const styleOf = (element) => getComputedStyle(element);
  const textOf = (element) => (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim();
  const number = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const round = (value) => (value === null ? null : Math.round(value * 100) / 100);
  // A radius larger than any real card is a circle or pill, not a value to
  // compare literally. Normalising it keeps 50% circles out of the tail.
  const radiusOf = (style) => {
    const value = number(style.borderTopLeftRadius);
    return value !== null && value > 64 ? 999 : value;
  };

  const visible = (element) => {
    const style = styleOf(element);
    const box = element.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    if (box.width <= 0 || box.height <= 0) return false;
    if (element.closest('[aria-hidden="true"]')) return false;
    return true;
  };

  const selectorOf = (element) => {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const parts = [];
    for (let node = element; node && node !== pageRoot; node = node.parentElement) {
      const parent = node.parentElement;
      if (!parent) break;
      const siblings = [...parent.children].filter((child) => child.tagName === node.tagName);
      parts.unshift(`${node.tagName.toLowerCase()}${siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : ""}`);
    }
    const rootName = pageRoot.id ? `#${CSS.escape(pageRoot.id)}` : pageRoot.className ? `.${String(pageRoot.className).trim().split(/\s+/)[0]}` : "body";
    return `${rootName} > ${parts.join(" > ")}`;
  };

  const containerOf = (element) => {
    const names = className(element);
    if (/\bui-card\b/.test(names)) return "ui-card";
    if (/\bui-section\b/.test(names)) return "ui-section";
    if (/\bbox-panel\b/.test(names)) return "box-panel";
    if (/\bui-table\b/.test(names)) return "ui-table";
    if (/\bMuiAlert-root\b/.test(names)) return "alert";
    if (/\bMuiCard-root\b/.test(names)) return "mui-card";
    if (/\bMuiPaper-root\b/.test(names)) return "mui-paper";
    if (element.tagName === "FORM") return "form";
    if (element.tagName === "TABLE") return "table";
    if (element.tagName === "UL" || element.tagName === "OL") return "list";
    if (element.tagName === "SECTION") return "section";
    return "plain";
  };

  // ui-section is a heading/section primitive with no surface; it is not a card.
  const cardLike = (container) =>
    ["ui-card", "box-panel", "mui-card", "mui-paper"].includes(container);

  const roleOf = (element, container) => {
    if (element.matches(".comments-wrapper, .comments-page") || element.querySelector(".comment-row, .comments-page")) return "comments";
    if (container === "table" || element.matches('[role="table"], .MuiTable-root')) return "table";
    if (element.matches(".md-content, .paragraph, .bio, .role-description")) return "prose";
    const fields = element.querySelectorAll("input, select, textarea");
    const submit = [...element.querySelectorAll("button")].some((button) => /save|submit|create|update|apply|send|host|continue/i.test(textOf(button)));
    if (container === "form" || (fields.length >= 3 && submit)) return "form";
    if (container === "list" || element.matches('[role="list"], .MuiList-root')) return "list";
    if (element.querySelectorAll("button, a.ui-action, .MuiButton-root").length >= 2 && !element.querySelector("h1, h2, h3")) return "actions";
    if (element.querySelector("img, video, canvas") && !element.querySelector("h1, h2, h3")) return "media";
    return "section";
  };

  const depthOf = (element) => {
    let depth = 0;
    for (let node = element; node && node !== pageRoot; node = node.parentElement) depth++;
    return depth;
  };

  const blockSelector = [
    "section", "article", "aside", "form", "table", "ul", "ol",
    '[role="region"]', '[role="tabpanel"]',
    ".ui-card", ".ui-section", ".box-panel", ".MuiPaper-root", ".ui-table",
    ".comments-wrapper", ".comments-page", ".md-content",
  ].join(",");

  const headingOf = (element) => {
    const heading = [...element.querySelectorAll("h1, h2, h3, h4, h5, h6")].find(
      (candidate) => visible(candidate) && candidate.closest(blockSelector) === element,
    );
    if (!heading) return null;
    const style = styleOf(heading);
    return {
      level: Number(heading.tagName.slice(1)),
      fontSize: round(number(style.fontSize)),
      fontWeight: style.fontWeight,
      marginTop: round(number(style.marginTop)),
      marginBottom: round(number(style.marginBottom)),
    };
  };

  const blockTokens = (element, container, heading) => {
    const style = styleOf(element);
    const box = element.getBoundingClientRect();
    const paragraph = [...element.querySelectorAll("p, li, td")].find((candidate) => visible(candidate) && textOf(candidate).length > 2);
    const paragraphStyle = paragraph ? styleOf(paragraph) : null;
    return {
      radius: radiusOf(style),
      paddingTop: round(number(style.paddingTop)),
      paddingRight: round(number(style.paddingRight)),
      paddingBottom: round(number(style.paddingBottom)),
      paddingLeft: round(number(style.paddingLeft)),
      gap: round(number(style.rowGap)),
      borderWidth: round(number(style.borderTopWidth)),
      hasBackground: !["rgba(0, 0, 0, 0)", "transparent"].includes(style.backgroundColor),
      widthRatio: round(box.width / Math.max(1, pageRoot.getBoundingClientRect().width)),
      headingLevel: heading ? heading.level : null,
      headingFontSize: heading ? heading.fontSize : null,
      bodyFontSize: paragraphStyle ? round(number(paragraphStyle.fontSize)) : null,
      bodyLineHeight: paragraphStyle ? paragraphStyle.lineHeight : null,
    };
  };

  const blocks = [];
  const consider = (element) => {
    const container = containerOf(element);
    const heading = headingOf(element);
    const matched = element.matches(blockSelector) || cardLike(container) || Boolean(heading);
    if (!matched) return;
    // A headingless wrapper at the page edge is layout, not a content block.
    // Its cards and lists are measured individually.
    if (depthOf(element) <= 1 && !heading && element.querySelector(".ui-card, section, article, .box-panel")) return;
    const role = roleOf(element, container);
    if (role === "actions" && element.closest(".comment-row, .comments-page, .comments-wrapper")) return;
    const depth = depthOf(element);
    if (depth > 6) return;
    const box = element.getBoundingClientRect();
    if (box.width < 40 || box.height < 16) return;
    // Nested duplicates of the same role in the same container are one block.
    // Siblings are not duplicates: several cards of the same kind are a real
    // repetition that the comparison needs to see.
    const duplicate = blocks.find(
      (block) =>
        block.role === role &&
        block.container === container &&
        (element.contains(block.element) || block.element.contains(element)),
    );
    if (duplicate) {
      if (element.contains(duplicate.element)) {
        Object.assign(duplicate, { element, depth, heading, tokens: blockTokens(element, container, heading) });
      }
      return;
    }
    blocks.push({ element, role, container, depth, heading, tokens: blockTokens(element, container, heading) });
  };
  // Descend through wrappers that are not themselves meaningful blocks, so a
  // page whose content sits inside an unrecognized layout div is still measured.
  const walk = (parent, depth) => {
    if (depth > 6) return;
    for (const child of parent.children) {
      if (!visible(child)) continue;
      consider(child);
      walk(child, depth + 1);
    }
  };
  walk(pageRoot, 0);

  const publicBlocks = blocks
    .map((block) => ({
      role: block.role,
      container: block.container,
      depth: block.depth,
      headingLevel: block.heading ? block.heading.level : null,
      tokens: block.tokens,
      selector: selectorOf(block.element),
      childBlocks: blocks.filter((other) => other !== block && block.element.contains(other.element)).length,
    }))
    .sort((left, right) => left.depth - right.depth || left.selector.localeCompare(right.selector));

  const headings = [...pageRoot.querySelectorAll("h1, h2, h3, h4, h5, h6")]
    .filter(visible)
    .map((element) => {
      const style = styleOf(element);
      const box = element.getBoundingClientRect();
      return {
        level: Number(element.tagName.slice(1)),
        text: textOf(element).slice(0, 60),
        fontSize: round(number(style.fontSize)),
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        marginTop: round(number(style.marginTop)),
        marginBottom: round(number(style.marginBottom)),
        top: round(box.top),
        authored: Boolean(element.closest('.md-content, .bio, .paragraph, [data-custom-background="true"] .box-panel')),
        selector: selectorOf(element),
      };
    });

  const actions = [...pageRoot.querySelectorAll('button, a.ui-action, .MuiButton-root')]
    .filter(visible)
    .slice(0, 80)
    .map((element) => {
      const style = styleOf(element);
      const box = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        height: round(box.height),
        width: round(box.width),
        radius: radiusOf(style),
        fontSize: round(number(style.fontSize)),
        fontWeight: style.fontWeight,
        paddingLeft: round(number(style.paddingLeft)),
        hasLabel: textOf(element).length > 0,
        labelLength: textOf(element).length,
        disclosure: /\b(strategy-disclosure|deck-cover|deck-cover-upload|media-preview|MuiStack-root|ui-action-row|profile-game-row)\b/.test(className(element)),
        selector: selectorOf(element),
      };
    });

  const lists = [...pageRoot.querySelectorAll("ul, ol, .MuiList-root")]
    .filter(visible)
    .map((element) => {
      const rows = [...element.children].filter(visible);
      const style = styleOf(element);
      const first = rows[0] ? rows[0].getBoundingClientRect() : null;
      return {
        container: containerOf(element),
        primitive: (className(element).match(/[\w-]*(?:list|rows?)[\w-]*/i) || [])[0] || element.tagName.toLowerCase(),
        rows: rows.length,
        rowHeight: first ? round(first.height) : null,
        gap: round(number(style.rowGap)),
        paddingLeft: round(number(style.paddingLeft)),
        selector: selectorOf(element),
      };
    });

  const cards = blocks
    .filter((block) => cardLike(block.container))
    .map((block) => {
      const box = block.element.getBoundingClientRect();
      const rows = block.role === "comments" ? [...block.element.querySelectorAll(".comment-row")] : [];
      const lastRow = rows[rows.length - 1];
      const firstChild = [...block.element.children].find((child) => {
        const childBox = child.getBoundingClientRect();
        return childBox.width > 0 && childBox.height > 0;
      });
      return {
        container: block.container,
        role: block.role,
        className: className(block.element),
        parentClass: className(block.element.parentElement).slice(0, 80),
        depth: block.depth,
        radius: block.tokens.radius,
        paddingTop: block.tokens.paddingTop,
        paddingRight: block.tokens.paddingRight,
        paddingBottom: block.tokens.paddingBottom,
        paddingLeft: block.tokens.paddingLeft,
        firstChildPaddingTop: firstChild ? round(number(styleOf(firstChild).paddingTop)) : null,
        lastCommentPaddingBottom: lastRow ? round(number(styleOf(lastRow).paddingBottom)) : null,
        x: round(box.x), y: round(box.y), width: round(box.width), height: round(box.height),
        hasBackground: block.tokens.hasBackground,
        borderWidth: block.tokens.borderWidth,
        headingLevel: block.tokens.headingLevel,
        headingFontSize: block.tokens.headingFontSize,
        bodyFontSize: block.tokens.bodyFontSize,
        selector: selectorOf(block.element),
      };
    });

  // Adjacent visible cards in the same column; nested cards are excluded.
  const cardBoxes = cards.filter((card) => card.width > 0 && card.height > 0);
  const visibleCards = cardBoxes.filter((card) => !cardBoxes.some((other) =>
    other !== card && other.x <= card.x + 1 && other.y <= card.y + 1 &&
    other.x + other.width >= card.x + card.width - 1 &&
    other.y + other.height >= card.y + card.height - 1));
  const sortedCards = [...visibleCards].sort((left, right) => left.x - right.x || left.y - right.y);
  const cardGaps = [];
  for (let index = 1; index < sortedCards.length; index++) {
    const previous = sortedCards[index - 1];
    const current = sortedCards[index];
    if (previous.parentClass !== current.parentClass) continue;
    if (/(?:^|\s)ui-page-content(?:\s|$)/.test(previous.parentClass)) continue;
    if (Math.abs(previous.x - current.x) > 2) continue;
    if (current.y < previous.y + previous.height - 1) continue;
    const gap = current.y - (previous.y + previous.height);
    if (gap >= 0 && gap <= 80) cardGaps.push(round(gap));
  }
  const cardGapMedian = (() => {
    const sorted = [...cardGaps].sort((left, right) => left - right);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  })();

  const overflow = [];
  for (const element of pageRoot.querySelectorAll("*")) {
    if (!visible(element)) continue;
    // SVG text has no meaningful clientWidth; charts are not layout overflow.
    if (element.closest("svg, canvas")) continue;
    if (element.closest(".avatar, .avatar-image") || element.querySelector(".avatar")) continue;
    const style = styleOf(element);
    const horizontal = style.overflowX;
    if (!["visible", "hidden"].includes(horizontal)) continue;
    if (element.scrollWidth - element.clientWidth <= 4) continue;
    const label = textOf(element);
    if (!label && !element.matches("input, select, textarea, img, table, ul, ol")) continue;
    const box = element.getBoundingClientRect();
    if (box.width < 40) continue;
    // A child of an intentional horizontal scroller (tab strips, carousels) is
    // not a layout overflow; the scroller is doing its job.
    let scrollableAncestor = false;
    for (let node = element.parentElement; node && node !== pageRoot; node = node.parentElement) {
      const overflowX = styleOf(node).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") { scrollableAncestor = true; break; }
    }
    if (scrollableAncestor) continue;
    // Report the outermost overflowing element once, not every descendant that
    // inherits the same overflow.
    if (overflow.some((entry) => entry.element.contains(element))) continue;
    overflow.push({
      element,
      selector: selectorOf(element),
      overflowX: horizontal,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      excess: element.scrollWidth - element.clientWidth,
      right: round(box.right),
      viewport: window.innerWidth,
    });
    if (overflow.length >= 12) break;
  }

  const parseColor = (value) => {
    const text = String(value);
    const match = text.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(",").map((part) => parseFloat(part.trim()));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] === undefined ? 1 : parts[3] };
    }
    // color-mix() computes to color(srgb r g b / a) in modern engines.
    const srgb = text.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
    if (!srgb) return null;
    return { r: parseFloat(srgb[1]) * 255, g: parseFloat(srgb[2]) * 255, b: parseFloat(srgb[3]) * 255, a: srgb[4] === undefined ? 1 : parseFloat(srgb[4]) };
  };
  const relativeLuminance = ({ r, g, b }) => {
    const channel = (value) => {
      const scaled = value / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const contrast = (foreground, background) => {
    const left = relativeLuminance(foreground);
    const right = relativeLuminance(background);
    const light = Math.max(left, right);
    const dark = Math.min(left, right);
    return (light + 0.05) / (dark + 0.05);
  };
  const backgroundOf = (element) => {
    for (let node = element; node; node = node.parentElement) {
      const colour = parseColor(styleOf(node).backgroundColor);
      if (colour && colour.a >= 0.9) return colour;
    }
    return null;
  };

  const contrastFindings = [];
  const textSample = [...pageRoot.querySelectorAll("p, li, td, .comment-content, .user-name, .comment-time, .md-content p")]
    .filter((element) => visible(element) && textOf(element).length > 2)
    .slice(0, 250);
  for (const element of textSample) {
    const style = styleOf(element);
    const foreground = parseColor(style.color);
    if (!foreground) continue;
    const background = backgroundOf(element);
    if (!background) continue;
    const ratio = round(contrast(foreground, background));
    const fontSize = number(style.fontSize) || 16;
    const bold = Number(style.fontWeight) >= 600;
    const large = fontSize >= 24 || (fontSize >= 18.66 && bold);
    const minimum = large ? 3 : 4.5;
    if (ratio !== null && ratio < minimum) {
      contrastFindings.push({
        selector: selectorOf(element),
        text: textOf(element).slice(0, 50),
        ratio,
        minimum,
        fontSize: round(fontSize),
        foreground: style.color,
        background: `rgb(${background.r}, ${background.g}, ${background.b})`,
      });
    }
  }
  contrastFindings.sort((left, right) => left.ratio - right.ratio);

  // Authored backgrounds: text that sits directly on a page with a custom
  // background must be inside an opaque surface of its own. This is the
  // contract that broke when the comment panel was removed.
  const authoredHost = document.querySelector('[data-custom-background="true"]');
  const unprotectedText = [];
  if (authoredHost) {
    const candidates = [...pageRoot.querySelectorAll(
      ".comment-row, .comment-content, .comments-page p, .md-content p, .bio p, p, li, .user-name, .comment-time",
    )];
    for (const element of candidates) {
      if (!visible(element) || textOf(element).length < 2) continue;
      const host = element.closest('[data-custom-background="true"]');
      if (!host) continue;
      let surface = null;
      for (let node = element; node && node !== host; node = node.parentElement) {
        const colour = parseColor(styleOf(node).backgroundColor);
        if (colour && colour.a >= 0.9) { surface = node; break; }
      }
      if (surface) continue;
      unprotectedText.push({
        selector: selectorOf(element),
        text: textOf(element).slice(0, 50),
        tag: element.tagName.toLowerCase(),
      });
      if (unprotectedText.length >= 10) break;
    }
  }

  const valueCounts = (values) => {
    const counts = {};
    for (const value of values) {
      if (value === null || value === undefined) continue;
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  };

  const pageHeading = [...(main || pageRoot).querySelectorAll("h1, h2")].find(visible) || null;  const pageHeader = pageHeading ? (() => {
    const style = styleOf(pageHeading);
    const box = pageHeading.getBoundingClientRect();
    const rootBox = pageRoot.getBoundingClientRect();
    const container = (pageHeading.parentElement && pageHeading.parentElement.parentElement) || pageHeading.parentElement;
    return {
      level: Number(pageHeading.tagName.slice(1)),
      text: textOf(pageHeading).slice(0, 60),
      fontSize: round(number(style.fontSize)),
      fontWeight: style.fontWeight,
      topOffset: round(box.top - rootBox.top),
      hasDescription: [...container.querySelectorAll("p")].some((item) => visible(item) && textOf(item).length > 10),
      actionCount: [...container.querySelectorAll("button, a.ui-action, .MuiButton-root")].filter(visible).length,
      selector: selectorOf(pageHeading),
    };
  })() : null;

  return {
    route: location.pathname + location.search,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    pageWidth: round(pageRoot.getBoundingClientRect().width),
    pageHeader,
    blocks: publicBlocks,
    headings,
    cards,
    cardGaps,
    cardGapMedian,
    actions,
    lists,
    overflow: overflow.map(({ element: _element, ...entry }) => entry),
    unprotectedText,
    contrast: contrastFindings.slice(0, 12),
    tokens: {
      cardRadii: valueCounts(cards.map((card) => card.radius)),
      cardContainers: valueCounts(cards.map((card) => card.container)),
      headingSizes: valueCounts(headings.filter((heading) => !heading.authored).map((heading) => heading.fontSize)),
      actionHeights: valueCounts(actions.map((action) => action.height)),
      actionRadii: valueCounts(actions.map((action) => action.radius)),
      listContainers: valueCounts(lists.map((list) => list.container)),
    },
  };
}

module.exports = { familySignature };
