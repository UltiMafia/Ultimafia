import React from "react";

import { formatUnreadBadge } from "utils/unreadBadge";

import "css/countBadge.css";

// Small red circle with a white count, pinned to the top-right corner of its
// child (like an app icon badge). Renders nothing extra when the count is 0.
export default function CountBadge({ count, max = 99, label, children, offset = -4 }) {
  const text = formatUnreadBadge(count, max);
  return (
    <span className="count-badge-anchor">
      {children}
      {text && (
        <span
          className="count-badge"
          style={{ top: offset, right: offset }}
          aria-label={label ? `${text} ${label}` : undefined}
          data-testid="count-badge"
        >
          {text}
        </span>
      )}
    </span>
  );
}
