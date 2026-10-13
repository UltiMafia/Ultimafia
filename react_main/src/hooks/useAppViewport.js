import { useEffect } from "react";

// Sizes the app frame (the phone site shell and the game session) to the
// *visual* viewport through CSS variables, so nothing sits under the mobile
// browser's toolbars or the on-screen keyboard, and no gap opens below the
// bottom bar. `--app-height` is the visible height, `--app-offset-top` the
// visible area's top offset (which changes when the keyboard opens).
export function useAppViewport() {
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const root = document.documentElement;

    function update() {
      root.style.setProperty(
        "--app-height",
        `${Math.round(visualViewport.height)}px`
      );
      root.style.setProperty(
        "--app-offset-top",
        `${Math.round(visualViewport.offsetTop)}px`
      );
    }

    update();
    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);
    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
    };
  }, []);
}
