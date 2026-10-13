import { useEffect } from "react";

// Sizes the app frame (the phone site shell and the game session) with top and
// bottom offsets on a fixed element, and flags the keyboard with
// <html data-keyboard="open">.
//
// The frame offsets use the visual viewport (for browsers where the keyboard
// overlays the page). The keyboard flag uses focus rather than the viewport,
// because `interactive-widget=resizes-content` shrinks the layout viewport, so
// the visual-viewport heuristic no longer distinguishes the keyboard.
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

    // While a text field is focused the on-screen keyboard is up: hide the site
    // bottom navigation and the game chat's tabs+timer bar. The game's own
    // bottom bar is not touched.
    function isTextField(el) {
      if (!el) return false;
      if (el.isContentEditable) return true;
      if (el.tagName === "TEXTAREA") return true;
      if (el.tagName !== "INPUT") return false;
      const type = (el.getAttribute("type") || "text").toLowerCase();
      return ["text", "search", "email", "password", "tel", "url", "number"].includes(
        type
      );
    }
    function onFocusIn(event) {
      if (isTextField(event.target)) root.setAttribute("data-keyboard", "open");
    }
    function onFocusOut(event) {
      if (isTextField(event.target)) root.removeAttribute("data-keyboard");
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (visualViewport) {
        visualViewport.removeEventListener("resize", update);
        visualViewport.removeEventListener("scroll", update);
      }
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
}
