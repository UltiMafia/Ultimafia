import React, { useContext } from "react";
import ReactMarkdown from "react-markdown";

import { emotify } from "components/Emotes";
import { MediaEmbed } from "pages/User/User";
import { SiteInfoContext } from "../Contexts";
import { InlineRoleMention } from "./Roles";

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
          <InlineRoleMention roleName={canonical} key={`${idx}-${match.index}`} />
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
              {roleifyMarkdown(emotify(properties.children), siteInfo)}
            </p>
          );
        },
      }}
    >
      {props.children}
    </ReactMarkdown>
  );
}
