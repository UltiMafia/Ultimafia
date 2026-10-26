import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Browser regression for the chat reply button and reply rows
// (test/chatReply.browser.jsx). Production build of a test-only entry; it
// never ships with the application. Font Awesome is linked first, as in
// public/index.html, so the pin and reply icons have their real size.
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./test/chatReply.browser.jsx" },
    tsconfigPath: "./jsconfig.json",
  },
  html: {
    title: "Chat reply regression",
    tags: [
      {
        tag: "link",
        attrs: { rel: "stylesheet", href: "/css/fontawesome.min.css" },
        head: true,
        append: false,
      },
    ],
  },
  output: {
    distPath: { root: "/tmp/ultimafia-chat-reply-browser" },
    cleanDistPath: true,
  },
});
