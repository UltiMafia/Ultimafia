import { useEffect } from "react";

// Positions the app frame (the phone site shell and the game session) with top
// and bottom offsets on a fixed element. Normally both are zero, so the frame
// fills the viewport exactly like the fixed bottom bar did (flush to the screen
// edge). When the on-screen keyboard is open the frame is inset to the visible
// area so the top bar and bottom input stay on screen.
export function useAppViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    function update() {
      const layoutHeight = root.clientHeight;
      const keyboardOpen =
        visualViewport && visualViewport.height < layoutHeight - 120;

      if (keyboardOpen) {
        const top = Math.round(visualViewport.offsetTop);
        const bottom = Math.max(
          0,
          Math.round(layoutHeight - (visualViewport.offsetTop + visualViewport.height))
        );
        root.style.setProperty("--app-top", `${top}px`);
        root.style.setProperty("--app-bottom", `${bottom}px`);
      } else {
        root.style.setProperty("--app-top", "0px");
        root.style.setProperty("--app-bottom", "0px");
      }
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
