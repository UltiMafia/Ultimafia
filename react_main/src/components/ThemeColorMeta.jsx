import { useEffect } from "react";

// Keep the browser's own chrome in step with the theme.
//
// Where the browser paints the safe-area strip itself -- the toolbar and the
// gesture strip on Android Chrome, the tab bar on iOS Safari -- the colour comes
// from <meta name="theme-color">. It shipped as one hard-coded dark value, so a
// light or custom site theme left the chrome around the app the wrong colour
// while the app itself was light.
//
// A component, not a hook called by Main: it has to run once the shell is on the
// page, and the shell renders behind Main's loading gate. The shell is the
// surface the bottom bar and the strip have to match, and MUI resolves its
// colour to a CSS variable, so read the shell rather than guessing from a
// palette. The scheme is applied by a class on <html> (dark-mode / light-mode)
// and can also change with the user's site theme, hence the observer.
export default function ThemeColorMeta() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const shell = document.querySelector(".app-shell");
    if (!meta || !shell) return;

    const apply = () => {
      const color = getComputedStyle(shell).backgroundColor;
      if (color && color !== "rgba(0, 0, 0, 0)") meta.setAttribute("content", color);
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-mui-color-scheme"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
