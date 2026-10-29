// Browser fixture for test/run-dm-panel-site.cjs: the floating DM window
// (components/dms/DmPanel) with the admins' "Ban Appeals" conversation next
// to a 1:1 between the same two admins, as the chat server sends them.
//
// Query: view=list (conversation list) or view=appeals (the conversation).
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import DmPanel from "../src/components/dms/DmPanel";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";

const params = new URLSearchParams(window.location.search);
const view = params.get("view") || "list";
const theme = createTheme();
const me = { id: "zx", name: "ZXHydra", avatar: false };
const pranay = { id: "pr", name: "Pranay", avatar: false };
const user = {
  id: me.id,
  name: me.name,
  loggedIn: true,
  perms: {},
  settings: {},
  autoContrastColor: (c) => c,
};
const now = Date.now();
const siteSender = {
  id: "site:ban-appeals",
  name: "Ban Appeals",
  avatar: false,
  avatarUrl: "/images/icon-192.png",
  site: true,
  status: "offline",
  groups: [],
  settings: {},
};
const appealsId = "2c1ae2a6ad7cc9db3a2b0bd6e2b6c5f0";
const directs = [
  {
    id: appealsId,
    name: "Ban Appeals",
    public: false,
    members: [me, pranay],
    lastMessageDate: now - 60000,
    lastMessage: { content: "BAN-APPEAL: X - BAN REASON: test , APPEAL: please", senderId: siteSender.id, date: now - 60000 },
  },
  {
    id: "0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
    public: false,
    members: [me, pranay],
    lastMessageDate: now - 3600000,
    lastMessage: { content: "1:1 hi", senderId: pranay.id, date: now - 3600000 },
  },
];
const channel = {
  id: appealsId,
  name: "Ban Appeals",
  public: false,
  members: [me, pranay],
  messages: [
    { id: "a1", sender: siteSender, senderId: siteSender.id, date: now - 120000, channel: appealsId, content: "BAN-APPEAL: X - BAN REASON: Testing the ban page , APPEAL: I would like to appeal this test ban." },
    { id: "a2", sender: siteSender, senderId: siteSender.id, date: now - 60000, channel: appealsId, content: "BAN-APPEAL VOTE: Pranay voted DENY - 2 admins: accept 0 of 2 needed, deny 1 of 1 needed - appeal DENIED" },
  ],
};

function Fixture() {
  const [current, setCurrent] = React.useState(view === "appeals" ? appealsId : null);
  return (
    <Box sx={{ width: 380, height: 560, display: "flex", flexDirection: "column", border: "1px solid #ccc", m: 2 }}>
      <DmPanel
        loading={false}
        user={user}
        directs={directs}
        notifsByChannel={{}}
        channel={current === appealsId ? channel : { messages: [] }}
        currentChannelId={current}
        composing={false}
        collapsed={false}
        dmLocked={null}
        sendError={null}
        renderTitleBar={({ left, actions }) => (
          <Box data-testid="title-bar" sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
            {left}
            {actions}
          </Box>
        )}
        onOpen={(id) => setCurrent(id)}
        onBack={() => setCurrent(null)}
        onNew={() => {}}
        textInput=""
        setTextInput={() => {}}
        onSend={() => {}}
        clearSendError={() => {}}
        messageListRef={React.createRef()}
        onMessagesScroll={() => {}}
        socket={{ send() {}, on() {} }}
      />
    </Box>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider value={{ showAlert: () => {}, cacheVal: 1 }}>
          <Fixture />
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  document.getElementById("root"),
  () => {
    window.__ready = true;
  },
);
