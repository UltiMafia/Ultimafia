import React, { useContext, useState } from "react";
import ReactMarkdown from "react-markdown";

import { emotify } from "components/Emotes";
import { MediaEmbed } from "pages/User/User";
import { SiteInfoContext } from "../Contexts";
import { InlineRoleMention } from "./Roles";

// Spoiler component that hides content until clicked
function Spoiler({ children }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      style={{
        backgroundColor: revealed ? "transparent" : "#AC2222",
        color: revealed ? "inherit" : "transparent",
        cursor: "pointer",
        padding: "0 2px",
        borderRadius: "3px",
        userSelect: revealed ? "auto" : "none",
        transition: "all 0.1s ease",
      }}
      title={revealed ? "Click to hide" : "Click to reveal spoiler"}
    >
      {children}
    </span>
  );
}

// Function to parse ||spoiler|| syntax and convert to Spoiler components
function spoilerify(children) {
  if (!children) return children;

  function transform(nodeChildren) {
    return nodeChildren.flatMap((child, idx) => {
      if (typeof child !== "string") return child;

      const parts = [];
      const regex = /\|\|(.+?)\|\|/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(child)) !== null) {
        // Add text before the spoiler
        const before = child.slice(lastIndex, match.index);
        if (before) parts.push(before);

        // Add the spoiler component
        parts.push(
          <Spoiler key={`spoiler-${idx}-${match.index}`}>{match[1]}</Spoiler>
        );

        lastIndex = regex.lastIndex;
      }

      // Add remaining text after last spoiler
      const after = child.slice(lastIndex);
      if (after) parts.push(after);

      return parts.length ? parts : child;
    });
  }

  return transform(Array.isArray(children) ? children : [children]);
}

// Function to parse {color:value}text{/color} syntax
// Only accepts hex color codes (#RGB, #RRGGBB, #RRGGBBAA)
function colorify(children) {
  if (!children) return children;

  function transform(nodeChildren) {
    return nodeChildren.flatMap((child, idx) => {
      if (typeof child !== "string") return child;

      const parts = [];
      const regex = /\{color:([^}]+)\}(.+?)\{\/color\}/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(child)) !== null) {
        const before = child.slice(lastIndex, match.index);
        if (before) parts.push(before);

        const colorValue = match[1].trim();
        // Validate hex color code: #RGB, #RRGGBB, or #RRGGBBAA
        const isValidHex =
          /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(colorValue);

        if (isValidHex) {
          parts.push(
            <span
              key={`color-${idx}-${match.index}`}
              style={{ color: colorValue }}
            >
              {match[2]}
            </span>
          );
        } else {
          // If invalid hex, don't apply color - just return the text
          parts.push(match[2]);
        }

        lastIndex = regex.lastIndex;
      }

      const after = child.slice(lastIndex);
      if (after) parts.push(after);

      return parts.length ? parts : child;
    });
  }

  return transform(Array.isArray(children) ? children : [children]);
}

// Function to parse {size:value}text{/size} syntax
// Only accepts numbers (px), with min 8 and max 72
function sizeify(children) {
  if (!children) return children;

  function transform(nodeChildren) {
    return nodeChildren.flatMap((child, idx) => {
      if (typeof child !== "string") return child;

      const parts = [];
      const regex = /\{size:([^}]+)\}(.+?)\{\/size\}/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(child)) !== null) {
        const before = child.slice(lastIndex, match.index);
        if (before) parts.push(before);

        // Parse the size value and remove 'px' if present
        const sizeValue = match[1].trim().replace("px", "");
        const sizeNum = parseInt(sizeValue, 10);

        // Validate and clamp between 8 and 72
        if (!isNaN(sizeNum)) {
          const clampedSize = Math.max(8, Math.min(72, sizeNum));
          parts.push(
            <span
              key={`size-${idx}-${match.index}`}
              style={{ fontSize: `${clampedSize}px` }}
            >
              {match[2]}
            </span>
          );
        } else {
          // If invalid number, don't apply size - just return the text
          parts.push(match[2]);
        }

        lastIndex = regex.lastIndex;
      }

      const after = child.slice(lastIndex);
      if (after) parts.push(after);

      return parts.length ? parts : child;
    });
  }

  return transform(Array.isArray(children) ? children : [children]);
}

// Function to parse {center}text{/center} syntax
function centerify(children) {
  if (!children) return children;

  function transform(nodeChildren) {
    return nodeChildren.flatMap((child, idx) => {
      if (typeof child !== "string") return child;

      const parts = [];
      const regex = /\{center\}(.+?)\{\/center\}/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(child)) !== null) {
        const before = child.slice(lastIndex, match.index);
        if (before) parts.push(before);

        parts.push(
          <div
            key={`center-${idx}-${match.index}`}
            style={{ textAlign: "center" }}
          >
            {match[1]}
          </div>
        );

        lastIndex = regex.lastIndex;
      }

      const after = child.slice(lastIndex);
      if (after) parts.push(after);

      return parts.length ? parts : child;
    });
  }

  return transform(Array.isArray(children) ? children : [children]);
}

function roleifyMarkdown(children, siteInfo) {
  if (!children) return children;
  const roles = siteInfo?.roles?.Mafia || [];
  const names = roles.map((r) => r.name).sort((a, b) => b.length - a.length);
  if (names.length === 0) return children;

  // Create a map from lowercase role names to canonical names for case-insensitive matching
  const nameMap = new Map(roles.map((r) => [r.name.toLowerCase(), r.name]));

  const pattern = names
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  // Use negative lookbehind and lookahead to exclude matches adjacent to apostrophes
  const regex = new RegExp(`(?<!')\\b(${pattern})\\b(?!')`, "gi");

  function transform(nodeChildren) {
    return nodeChildren.map((child, idx) => {
      if (typeof child !== "string") return child;
      const parts = [];
      let lastIndex = 0;
      regex.lastIndex = 0;
      let match = regex.exec(child);
      while (match) {
        const before = child.slice(lastIndex, match.index);
        if (before) parts.push(before);
        const matched = match[0];
        // Normalize to canonical role name (correct case)
        const canonical = nameMap.get(matched.toLowerCase()) || matched;
        parts.push(
          <InlineRoleMention
            roleName={canonical}
            key={`${idx}-${match.index}`}
          />
        );
        lastIndex = regex.lastIndex;
        match = regex.exec(child);
      }
      const after = child.slice(lastIndex);
      if (after) parts.push(after);
      return parts.length ? parts : child;
    });
  }

  return transform(Array.isArray(children) ? children : [children]);
}

export default function CustomMarkdown(props) {
  const siteInfo = useContext(SiteInfoContext);
  return (
    <ReactMarkdown
      components={{
        a(properties) {
          const { node, ...rest } = properties;
          return (
            <a
              href={properties.href}
              rel="noopener noreferrer nofollow"
              {...rest}
            >
              {properties.children}
            </a>
          );
        },
        img(properties) {
          return <MediaEmbed mediaUrl={properties.src} />;
        },
        p(properties) {
          const { node, ...rest } = properties;
          return (
            <p {...rest}>
              {roleifyMarkdown(
                emotify(
                  colorify(sizeify(centerify(spoilerify(properties.children))))
                ),
                siteInfo
              )}
            </p>
          );
        },
      }}
    >
      {props.children}
    </ReactMarkdown>
  );
}
