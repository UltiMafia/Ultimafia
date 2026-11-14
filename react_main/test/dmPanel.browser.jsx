// Test page for test/run-text-size.cjs: the real DmPanel, as the floating DM
// window draws it, with test conversations. ?view=conversation opens one
// conversation; otherwise the conversation list shows.
import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import DmPanel from "../src/components/dms/DmPanel";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";

const theme = createTheme({ palette: { mode: "dark" } });
const user = { id: "me", name: "Tester", loggedIn: true, settings: {}, perms: {} };
const friend = { id: "friend", name: "A friend with a fairly long display name" };
const now = Date.now();
const messages = [
  { id: "m1", sender: friend, content: "Are you joining the next game tonight? It starts in about twenty minutes.", date: now - 60000 },
  { id: "m2", sender: user, content: "Yes, save me a seat.", date: now - 30000 },
];
const channel = {
  id: "c1",
  members: [user, friend],
  lastMessage: { content: messages[1].content, senderId: "me", date: now - 30000 },
  messages,
};

function Fixture() {
  const conversation = new URLSearchParams(window.location.search).get("view") === "conversation";
  const [textInput, setTextInput] = useState("A reply I am typing");
  const messageListRef = useRef(null);
  return (
    <Box data-testid="dm-window" sx={{ position: "fixed", right: 8, bottom: 8, width: 340, maxWidth: "calc(100vw - 16px)", border: 1 }}>
      <DmPanel
        loading={false}
        user={user}
        directs={[channel]}
        notifsByChannel={{}}
        channel={channel}
        currentChannelId={conversation ? "c1" : null}
        composing={false}
        collapsed={false}
        sendError={null}
        socket={{ send: () => {} }}
        textInput={textInput}
        setTextInput={setTextInput}
        onSend={() => {}}
        clearSendError={() => {}}
        messageListRef={messageListRef}
        onMessagesScroll={() => {}}
        onBack={() => {}}
        onOpen={() => {}}
        onNew={() => {}}
        renderTitleBar={({ left, actions }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, height: 48 }}>
            {left}
            {actions}
          </Box>
        )}
      />
    </Box>
  );
}

const root = document.createElement("div");
root.id = "root";
document.body.append(root);
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <SiteInfoContext.Provider value={{ showAlert: () => {}, emotes: {} }}>
        <UserContext.Provider value={user}>
          <Fixture />
        </UserContext.Provider>
      </SiteInfoContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__fixtureReady = true),
);
