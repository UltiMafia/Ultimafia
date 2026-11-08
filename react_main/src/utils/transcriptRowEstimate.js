// Height estimate for a transcript row that has not been measured yet.
//
// A constant cannot describe a chat transcript: the windowed transcript places
// rows by estimate until they render, and an estimate below the real height
// leaves scrollable history the element cannot reach (a false top) — iOS holds
// the correction through a gesture instead of writing it. Ordinary messages run
// from a single line to the 240-character limit, which is many wrapped lines, so
// the estimate follows the content and only falls back to the platform floor.
//
// Overestimating is the safe direction: measuring the rendered row trims the
// extra space back, while underestimating feeds the unreachable-offset problem.
// Measured against the real transcript: a 15-line message renders at
// ~366px, i.e. ~24px per line including the row chrome. Biased high on
// purpose — overestimating is trimmed by measurement, underestimating is not.
const LINE_HEIGHT = 24;
const ROW_CHROME = 18; // vertical padding and the row separator
const CHARS_PER_LINE = 45; // deliberately few: more lines, higher estimate
const MAX_ESTIMATE = 1200;

// The transcript's rows are the rendered <Message> elements, so the message
// being measured lives on the element's props; helpers and tests may pass the
// message itself.
function rowMessage(row) {
  if (row && typeof row === "object" && row.props && row.props.message) {
    return row.props.message;
  }
  return row;
}

let measureContext = null;

// Average glyph width for the element's own font, so the wrap estimate follows
// the user's appearance settings rather than a fixed character count.
function averageCharWidth(style) {
  try {
    if (!measureContext) {
      measureContext = document.createElement("canvas").getContext("2d");
    }
    if (!measureContext) return null;
    measureContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const sample =
      "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789";
    const width = measureContext.measureText(sample).width;
    return width > 0 ? width / sample.length : null;
  } catch (e) {
    return null;
  }
}

// Font size is a user setting applied to <html> (Contexts GlobalStyles), so the
// per-line height and the characters that fit on a line are properties of the
// rendered transcript, not constants. Biased slightly high everywhere: a
// measured row trims the extra, an underestimate cannot be recovered on iOS.
export function transcriptLayoutMetrics(element) {
  if (!element || typeof window === "undefined") return null;

  const style = window.getComputedStyle(element);
  const fontSize = parseFloat(style.fontSize) || 16;
  let lineHeight = parseFloat(style.lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) lineHeight = fontSize * 1.45;

  const padding =
    (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
  const width = Math.max(120, (element.clientWidth || 0) - padding);
  const charWidth = averageCharWidth(style) || fontSize * 0.5;
  const charsPerLine = Math.max(8, Math.floor(width / charWidth));

  return {
    signature: `${Math.round(fontSize * 10)}|${Math.round(lineHeight * 10)}|${Math.round(width)}`,
    lineHeight: lineHeight * 1.05,
    charsPerLine: Math.max(8, Math.floor(charsPerLine * 0.92)),
    chrome: Math.round(lineHeight * 0.9),
  };
}

export function estimateTranscriptRowHeight(row, floor = 60, layout = null) {
  const message = rowMessage(row);
  const content =
    message && typeof message.content === "string" ? message.content : "";

  if (!content) return floor;

  const lineHeight = layout ? layout.lineHeight : LINE_HEIGHT;
  const charsPerLine = layout ? layout.charsPerLine : CHARS_PER_LINE;
  const chrome = layout ? layout.chrome : ROW_CHROME;

  const explicitLines = content.split("\n").length;
  const wrappedLines = Math.ceil(content.length / charsPerLine);
  const quoteLine = message.isQuote || message.replyTo ? 1 : 0;
  const lines = Math.max(explicitLines, wrappedLines, 1) + quoteLine;
  const estimate = chrome + lines * lineHeight;

  return Math.min(MAX_ESTIMATE, Math.max(floor, estimate));
}
