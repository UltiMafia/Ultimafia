// Test page for test/run-emote-picker.cjs: the real EmotePicker, anchored at
// the bottom right of the screen like the game chat box.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material";
import EmotePicker from "../src/components/EmotePicker";
import { UserContext } from "../src/Contexts";
import "../src/css/main.css";

const theme = createTheme({ palette: { mode: "dark" } });
const user = {
  id: "tester",
  settings: {
    customStickers: {
      wave: { id: "s1", name: "Wave", path: "missing-sticker.webp" },
    },
  },
};

const root = document.createElement("div");
document.body.append(root);

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={user}>
        <div
          data-testid="chat-box"
          style={{
            position: "fixed",
            right: 8,
            bottom: 8,
            height: 40,
            display: "flex",
          }}
        >
          <EmotePicker
            onEmoteSelected={(value) => (window.__lastEmote = value)}
          />
        </div>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root
);
window.__emotePickerReady = true;
