import React, { useLayoutEffect, useRef, useState } from "react";
import { EmoteKeys, emotify } from "./Emotes";
import { useOnOutsideClick } from "./Basic";

export default function EmotePicker(props) {
  const [isPanelVisible, setPanelVisible] = useState(false);
  const panelRef = useRef();
  const containerRef = useRef();

  useOnOutsideClick([panelRef, containerRef], () => setPanelVisible(false));

  useLayoutEffect(() => {
    if (!isPanelVisible) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const menuRect = panelRef.current.getBoundingClientRect();

    let panelLeft = containerRect.left;
    let menuTop = containerRect.top + containerRect.height + 1 + window.scrollY;

    if (menuTop + menuRect.height - window.scrollY > window.innerHeight)
      menuTop = containerRect.top - menuRect.height - 2;

    panelRef.current.style.left = panelLeft + "px";
    panelRef.current.style.top = menuTop + "px";
    panelRef.current.style.visibility = "visible";
  });

  const emotes = (
    <div className="emote-picker-wrapper">
      {EmoteKeys.map((emote) => (
        <div
          className="emote"
          key={emote}
          onClick={(e) => selectEmote(e, emote)}
        >
          {emotify(emote)}
        </div>
      ))}
    </div>
  );

  function selectEmote(e, emote) {
    props.onEmoteSelected(emote);
    if (!e.shiftKey) {
      setPanelVisible(false);
    }
  }

  function togglePanel() {
    setPanelVisible(!isPanelVisible);
  }

  return (
    <div ref={containerRef} className={`dropdown ${props.className || ""}`}>
      <div className="dropdown-control" onClick={togglePanel}>
        Emotes!
      </div>
      {isPanelVisible && (
        <div className="dropdown-menu emote-picker-panel" ref={panelRef}>
          {emotes}
        </div>
      )}
    </div>
  );
}
