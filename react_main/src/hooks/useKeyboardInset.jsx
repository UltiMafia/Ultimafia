import { useEffect, useState } from "react";

// Height of the on-screen keyboard, in CSS pixels, derived from the visual
// viewport. Zero when no keyboard is open or the API is unavailable. Used to
// lift a bottom-anchored input above the keyboard, because a fixed layout does
// not resize when the keyboard covers the lower part of the screen.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    function update() {
      const covered =
        window.innerHeight -
        (visualViewport.height + visualViewport.offsetTop);
      setInset(Math.max(0, Math.round(covered)));
    }

    update();
    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);
    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
