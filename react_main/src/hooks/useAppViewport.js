import { useEffect } from "react";

// Sizes the app frame (the phone site shell and the game session) with top and
// bottom offsets on a fixed element, and flags the on-screen keyboard with
// <html data-keyboard="open">.
//
// The keyboard is detected from the height actually visible: the smaller of the
// layout viewport (window.innerHeight) and the visual viewport. Comparing that
// against the height seen while the keyboard was closed works whether the
// browser resizes the layout (interactive-widget=resizes-content) or only the
// visual viewport, and it clears as soon as the keyboard closes. Removed when
// the keyboard is dismissed even if the field keeps focus, which is what
// Android does when the keyboard's Back button closes it.
export function useAppViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    // A keyboard is hundreds of pixels tall and browser chrome is tens, so 150
    // separates the two.
    const KEYBOARD_HEIGHT = 150;

    // Tallest height seen with the keyboard closed; the baseline the keyboard
    // is measured against.
    let closedHeight = 0;
    let lastWidth = window.innerWidth;

    function visibleHeight() {
      return visualViewport
        ? Math.min(window.innerHeight, visualViewport.height)
        : window.innerHeight;
    }

    function update() {
      // A width change means rotation or a window resize, which changes the
      // baseline; re-learn it instead of mistaking it for a keyboard.
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        closedHeight = 0;
      }

      const height = visibleHeight();
      if (closedHeight === 0) closedHeight = height;

      const keyboardOpen = height < closedHeight - KEYBOARD_HEIGHT;
      if (!keyboardOpen) closedHeight = Math.max(closedHeight, height);

      if (keyboardOpen && visualViewport) {
        // Where the visual viewport sits inside the layout viewport. With
        // resizes-content the layout already shrank, so the bottom offset is 0.
        const top = Math.round(visualViewport.offsetTop);
        const bottom = Math.max(
          0,
          Math.round(
            root.clientHeight - (visualViewport.offsetTop + visualViewport.height)
          )
        );
        root.style.setProperty("--app-top", `${top}px`);
        root.style.setProperty("--app-bottom", `${bottom}px`);
      } else {
        root.style.setProperty("--app-top", "0px");
        root.style.setProperty("--app-bottom", "0px");
      }

      if (keyboardOpen) root.setAttribute("data-keyboard", "open");
      else root.removeAttribute("data-keyboard");
    }

    update();
    window.addEventListener("resize", update);
    if (visualViewport) {
      visualViewport.addEventListener("resize", update);
      visualViewport.addEventListener("scroll", update);
    }

    return () => {
      root.removeAttribute("data-keyboard");
      root.style.removeProperty("--app-top");
      root.style.removeProperty("--app-bottom");
      window.removeEventListener("resize", update);
      if (visualViewport) {
        visualViewport.removeEventListener("resize", update);
        visualViewport.removeEventListener("scroll", update);
      }
    };
  }, []);
}
