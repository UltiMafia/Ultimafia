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

export function estimateTranscriptRowHeight(row, floor = 60) {
  const message = rowMessage(row);
  const content =
    message && typeof message.content === "string" ? message.content : "";

  if (!content) return floor;

  const explicitLines = content.split("\n").length;
  const wrappedLines = Math.ceil(content.length / CHARS_PER_LINE);
  const quoteLine = message.isQuote || message.replyTo ? 1 : 0;
  const lines = Math.max(explicitLines, wrappedLines, 1) + quoteLine;
  const estimate = ROW_CHROME + lines * LINE_HEIGHT;

  return Math.min(MAX_ESTIMATE, Math.max(floor, estimate));
}
