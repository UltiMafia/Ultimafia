import React from "react";

export const Slang = ({ slang, original }) => {
  let emoji = slang.emoji;
  if (Array.isArray(emoji)) {
    // If multiple EMOJIs are provided, pick 1 randomly
    emoji = emoji[Math.floor(Math.random() * emoji.length)];
  }
  const emojiText = emoji ? ` ${emoji}` : "";
  const text = slang.replacement || original + emojiText;

  return (
    <>
      <div style={{ background: "lime" }}>{text}</div>
    </>
  );
};
