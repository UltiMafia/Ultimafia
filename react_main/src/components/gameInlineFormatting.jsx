import React from "react";

// A deliberately small chat syntax, not a document/HTML renderer:
// **bold**, *italic*, __underline__, ~~strikethrough~~. Parse only plain
// segments after the existing whole-line filter. URL spans remain opaque;
// the existing link/emote/mention pipeline then decorates their text.
export function formatGameText(content) {
  const parts = [];
  for (const part of (Array.isArray(content) ? content.flat(Infinity) : [content])) {
    if (typeof part === "string" && typeof parts[parts.length - 1] === "string")
      parts[parts.length - 1] += part;
    else parts.push(part);
  }
  const tags = { "**": "strong", "*": "em", "__": "u", "~~": "s" };
  const root = { children: [] };
  const stack = [root];
  let key = 0;
  function append(value) {
    const children = stack[stack.length - 1].children;
    if (typeof value === "string" && typeof children[children.length - 1] === "string")
      children[children.length - 1] += value;
    else children.push(value);
  }
  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    if (typeof part !== "string") {
      append(part);
      continue;
    }
    for (let i = 0; i < part.length;) {
      // Match the existing bare-link grammar, but do not parse marker-looking
      // URL path characters. If this URL ends a surrounding format, leave its
      // closing delimiter for the parser instead of adding it to the href.
      const url = part.slice(i).match(/^https?:\/\/([\w.]+)\.(\w+)([^\s]*)/);
      if (url) {
        let end = url[0].length;
        for (let level = 1; level < stack.length; level++) {
          const token = stack[level].token;
          const at = url[0].lastIndexOf(token, end - token.length);
          if (at < 0 || !/^[.,!?;:)]*$/.test(url[0].slice(at + token.length, end))) break;
          end = at;
        }
        // A real URL always includes its scheme and host; never trim those.
        if (end > "https://".length) {
          append(url[0].slice(0, end));
          i += end;
          continue;
        }
      }
      if (part[i] === "\\" && /[*_~\\]/.test(part[i + 1] || "")) {
        append(part[i + 1]);
        i += 2;
        continue;
      }
      const top = stack[stack.length - 1];
      const token = top.token && part.startsWith(top.token, i)
        ? top.token
        : ["**", "__", "~~", "*"].find((candidate) => part.startsWith(candidate, i));
      if (!token) {
        append(part[i++]);
        continue;
      }
      // Never reinterpret punctuation inside a word. Formatting must surround
      // words/phrases, not conceal characters inside a word from game filters.
      const before = i > 0 ? part[i - 1] : (p > 0 ? "x" : "");
      const after = i + token.length < part.length
        ? part[i + token.length]
        : (p + 1 < parts.length ? "x" : "");
      const closes = top.token === token && before && !/\s/.test(before) && !/[\p{L}\p{N}]/u.test(after);
      const opens = !/[\p{L}\p{N}]/u.test(before) && after && !/\s/.test(after);
      if (closes) {
        stack.pop();
        append(React.createElement(tags[token], {
          key: `game-format-${key++}`,
          "data-game-inline-format": true,
        }, top.children));
      } else if (opens && stack.length < 9 && top.token !== token) {
        stack.push({ token, children: [] });
      } else {
        append(token);
      }
      i += token.length;
    }
  }
  // Unmatched delimiters are literal. No content is discarded.
  while (stack.length > 1) {
    const unclosed = stack.pop();
    append(unclosed.token);
    for (const child of unclosed.children) append(child);
  }
  return root.children;
}

// Decorate text using the existing game pipeline, including within our own
// wrappers. Never recurse into links or other opaque application components.
export function mapGameFormattedText(content, decorate) {
  return content.map((part) => {
    if (React.isValidElement(part) && part.props["data-game-inline-format"])
      return React.cloneElement(part, {}, mapGameFormattedText(part.props.children, decorate));
    return typeof part === "string" ? decorate(part) : part;
  });
}

// Read only our formatting tree, never text or identity from an application
// component. This lets callers apply whole-visible-line policies after markers
// have been removed (underscores otherwise change regex word boundaries).
export function gameFormattedPlainText(content) {
  let result = "";
  for (const part of content) {
    if (typeof part === "string") result += part;
    else if (React.isValidElement(part) && part.props["data-game-inline-format"]) {
      const inner = gameFormattedPlainText(part.props.children);
      if (inner === null) return null;
      result += inner;
    } else if (part != null && part !== false) return null;
  }
  return result;
}
