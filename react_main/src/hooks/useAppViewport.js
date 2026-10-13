import { useEffect } from "react";

// Sizes the app frame (the phone site shell and the game session) through CSS
// variables. Normally the frame fills the layout viewport, so the bottom bar is
// flush and no gap opens. When the on-screen keyboard is open (the visual
// viewport is much shorter than the layout viewport) the frame shrinks to the
// visible area so the top bar and bottom input stay on screen.
export function useAppViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    function update() {
      const layoutHeight = root.clientHeight;
      const keyboardOpen =
        visualViewport && visualViewport.height < layoutHeight - 120;

      const height = keyboardOpen
        ? Math.round(visualViewport.height)
        : layoutHeight;
      const top = keyboardOpen ? Math.round(visualViewport.offsetTop) : 0;

      root.style.setProperty("--app-height", `${height}px`);
      root.style.setProperty("--app-offset-top", `${top}px`);
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    if (visualViewport) {
      visualViewport.addEventListener("resize", update);
      visualViewport.addEventListener("scroll", update);
    }

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (visualViewport) {
        visualViewport.removeEventListener("resize", update);
        visualViewport.removeEventListener("scroll", update);
      }
    };
  }, []);
}
