import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function UrgencyOverlay({
  duration = "5s",
  hidden = true,
  maxVh = "30",
}) {
  const [playing, setPlaying] = useState(!hidden);
  
  useEffect(() => {
    setPlaying(!hidden)
  }, [hidden]);

  if (hidden) {
    return <></>;
  }

  return (
    <div aria-hidden style={{
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: `${maxVh}vh`,
      pointerEvents: "none",
      isolation: "isolate",
      backgroundImage: `linear-gradient(to bottom, rgba(255, 0, 0, 0.3) 0%, rgba(255, 0, 0, 0.25) 50%, transparent 100%)`,
      backgroundSize: `100% ${playing ? maxVh : 0}vh`,
      backgroundRepeat: "no-repeat",
      transition: `all ${duration} cubic-bezier(.05,.88,.14,.79)`,
    }} />
  );
}