// Local-only, deterministic browser fixture. Axios never reaches a real server.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider, Button, Stack, Typography } from "@mui/material";
import { UserContext, SiteInfoContext } from "../src/Contexts";
import Comments from "../src/pages/Community/Comments";
import "react-mde/lib/styles/css/react-mde-all.css";

const user = { loggedIn: true, id: "fixture", name: "Fixture", settings: {}, perms: { postReply: true }, autoContrastColor: (color) => color };
const theme = createTheme({ palette: { mode: "dark" } });
const rows = {};
let failNext = false;
let delay = 0;
window.__commentImage = { requests: [], alerts: [], revokeCount: 0 };
const originalRevoke = URL.revokeObjectURL;
URL.revokeObjectURL = (url) => {
  window.__commentImage.revokeCount += 1;
  originalRevoke.call(URL, url);
};
axios.get = async (url) => {
  if (!url.startsWith("/api/comment?")) return { data: [] };
  const location = new URL(url, window.location.origin).searchParams.get("location");
  return { data: { comments: rows[location] || [], maxPage: 1, page: 1 } };
};
axios.post = async (url, body) => {
  if (url !== "/api/comment") throw new Error("Unexpected fixture request.");
  const image = body instanceof FormData ? body.get("image") : null;
  const content = body instanceof FormData ? body.get("content") : body.content;
  const location = body instanceof FormData ? body.get("location") : body.location;
  window.__commentImage.requests.push({ location, content, imageType: image?.type || null, imageBytes: image?.size || 0 });
  const currentDelay = delay;
  const shouldFail = failNext;
  failNext = false;
  await new Promise((resolve) => setTimeout(resolve, currentDelay));
  if (shouldFail) throw new Error("Fixture upload failed. Your draft is retained.");
  const id = "fixture" + window.__commentImage.requests.length;
  const imageUrl = image ? `/api/comment/${id}/image` : null;
  rows[location] = [{
    id, author: { ...user, groups: [], avatar: false },
    content: content + (imageUrl ? `\n\n![Pasted image](${imageUrl})` : ""),
    date: Date.now(), voteCount: 0, vote: 0, deleted: false,
  }, ...(rows[location] || [])];
  return { status: 200 };
};

function App() {
  const [location, setLocation] = useState("All");
  const [visible, setVisible] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const siteInfo = {
    roles: {}, emojis: {}, emotes: {}, stickers: {},
    showAlert(message) {
      window.__commentImage.alerts.push(message);
      setAlerts((previous) => [...previous, message]);
    },
  };
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <SiteInfoContext.Provider value={siteInfo}>
          <UserContext.Provider value={user}>
            <Stack spacing={2} sx={{ p: 2, maxWidth: 800, margin: "auto", color: "text.primary" }}>
              <Typography variant="h5">Comment image paste fixture — no live uploads</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button onClick={async () => {
                  const canvas = document.createElement("canvas");
                  canvas.width = 64; canvas.height = 32;
                  const context = canvas.getContext("2d");
                  context.fillStyle = "#458fdd"; context.fillRect(0, 0, 64, 32);
                  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
                  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                }}>Copy sample image</Button>
                <Button onClick={() => { failNext = true; }}>Fail next Post</Button>
                <Button onClick={() => { delay = delay ? 0 : 2000; }}>Toggle 2-second delay</Button>
                <Button onClick={() => setLocation((value) => value === "All" ? "Other" : "All")}>Switch wall</Button>
                <Button onClick={() => setVisible((value) => !value)}>Toggle mount</Button>
              </Stack>
              <Typography>Wall: {location}</Typography>
              {alerts.map((alert, index) => <Typography role="alert" key={index}>{alert}</Typography>)}
              {visible && <Comments location={location} fullWidth />}
            </Stack>
          </UserContext.Provider>
        </SiteInfoContext.Provider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
ReactDOM.render(<App />, document.getElementById("root"));
window.__commentImageReady = true;
