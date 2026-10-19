import React, { useState } from "react";
import { isTextEffect } from "shared/textEffects";

import "./TextEffects.css";

// Effects drawn per letter; the rest animate the whole message.
const PER_LETTER = { wave: true, rainbow: true };

// A message animates only when it first appears. Later mounts (switching
// meeting tabs, scrolling back, reloading the game, reviews) show it plain.
const FIRST_SEEN_WINDOW_MS = 1000;
const FRESH_MESSAGE_MS = 30000;
const firstSeen = new Map();

export function prefersReducedMotion() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch (e) {
    return false;
  }
}

// Returns the effect to play for this mount of a message, or null.
export function pickTextEffect(message, now = Date.now()) {
  const effect = message && message.textEffect;
  if (!isTextEffect(effect) || !message.id) return null;
  if (prefersReducedMotion()) return null;
  if (typeof message.time === "number" && now - message.time > FRESH_MESSAGE_MS)
    return null;

  const seen = firstSeen.get(message.id);
  if (seen === undefined) {
    firstSeen.set(message.id, now);
    if (firstSeen.size > 500) firstSeen.delete(firstSeen.keys().next().value);
    return effect;
  }
  // Within the window covers React's double render in development.
  return now - seen < FIRST_SEEN_WINDOW_MS ? effect : null;
}

export function useTextEffect(message, disabled) {
  const [effect] = useState(() => (disabled ? null : pickTextEffect(message)));
  return effect;
}

export function isPerLetterEffect(effect) {
  return !!PER_LETTER[effect];
}

function graphemes(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
      (s) => s.segment
    );
  }
  return Array.from(text);
}

// Wraps every visible character (and every inline element such as an emote
// or link) of already-processed UserText content in a span carrying its
// position, so per-letter effects can stagger. Whitespace stays plain text.
export function splitIntoLetters(content) {
  const segments = Array.isArray(content) ? content.flat(Infinity) : [content];
  const out = [];
  let index = 0;
  segments.forEach((segment, k) => {
    if (segment == null || segment === false || segment === "") return;
    if (typeof segment === "string" || typeof segment === "number") {
      for (const ch of graphemes(String(segment))) {
        if (/^\s+$/.test(ch)) out.push(ch);
        else
          out.push(
            <span className="te-ch" style={{ "--te-i": index }} key={`c${k}-${index}`}>
              {ch}
            </span>
          );
        index++;
      }
    } else {
      out.push(
        <span className="te-ch" style={{ "--te-i": index }} key={`e${k}-${index}`}>
          {segment}
        </span>
      );
      index++;
    }
  });
  return out;
}

export function TextEffect({ effect, children }) {
  if (!effect) return children;
  return (
    <span className={`text-effect text-effect-${effect}`} data-text-effect={effect}>
      {children}
    </span>
  );
}
