// Local-only fixture; requests and persistence are mocked, never the live site.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider, Button, CssBaseline } from "@mui/material";
import { UserContext, SiteInfoContext } from "../src/Contexts";
import Thread from "../src/pages/Community/Forums/Thread";
import "react-mde/lib/styles/css/react-mde-all.css";
import "../src/css/forums.css";

const theme = createTheme({ palette: { mode: "dark" } });
const author = { id: "other", name: "Other", groups: [], avatar: false };
const user = {
  loggedIn: true, id: "fixture", name: "Fixture", rank: 0, settings: {}, blockedUsers: [],
  perms: { postReply: true }, autoContrastColor: (color) => color,
};
const stored = JSON.parse(sessionStorage.getItem("forum-fixture-replies") || "{}");
let failNext = false;
let delay = 0;
let locked = false;
let muted = false;
let restricted = false;
window.__forumReply = { requests: [], alerts: [] };
function threadData(id, page = 1) {
  return {
    id, title: "Forum inline reply fixture " + id, content: "Original post. Reply below the selected post.",
    author, board: { id: "board1", name: "Fixture board", rank: 0 }, postDate: Date.now() - 60000,
    page, pageCount: 2, replyCount: 3, voteCount: 0, vote: 0, viewCount: 1,
    locked, restricted, isMuted: muted, isAllowedPoster: false, deleted: false,
    rosterUsers: [{ user: { id: "mention", name: "MentionCandidate" } }], tagPresets: [], mutedTags: [], subscribers: [], subscriberUsers: [],
    replies: [
      { id: id + "-page" + page + "-first", content: "First reply on page " + page, author, postDate: Date.now() - 30000, voteCount: 0, vote: 0, deleted: false },
      { id: id + "-page" + page + "-second", content: "Second reply on page " + page, author, postDate: Date.now() - 20000, voteCount: 0, vote: 0, deleted: false },
      ...(stored[id] || []),
    ],
  };
}
axios.get = async (url) => {
  if (url.startsWith("/api/forums/thread/")) {
    const parsed = new URL(url, window.location.origin);
    const id = parsed.pathname.split("/").pop();
    const requested = parsed.searchParams.get("page");
    return { data: threadData(id, requested === "2" ? 2 : 1) };
  }
  return { data: [] };
};
axios.post = async (url, body) => {
  if (url !== "/api/forums/reply") throw new Error("Unexpected fixture write: " + url);
  const image = body instanceof FormData ? body.get("image") : null;
  const content = body instanceof FormData ? body.get("content") : body.content;
  const thread = body instanceof FormData ? body.get("thread") : body.thread;
  window.__forumReply.requests.push({ thread, content, imageBytes: image?.size || 0, imageType: image?.type || null });
  const shouldFail = failNext; failNext = false;
  await new Promise((resolve) => setTimeout(resolve, delay));
  if (shouldFail) throw new Error("Fixture Post failed; draft retained.");
  const id = "fixture-" + Date.now();
  const imageUrl = image ? "/api/forums/reply/" + id + "/image" : null;
  stored[thread] = [...(stored[thread] || []), {
    id, content: content + (imageUrl ? "\n\n![Pasted image](" + imageUrl + ")" : ""),
    author: { ...author, id: user.id, name: user.name }, postDate: Date.now(), voteCount: 0, vote: 0, deleted: false,
  }];
  sessionStorage.setItem("forum-fixture-replies", JSON.stringify(stored));
  return { data: "1" };
};
function Fixture() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [generation, setGeneration] = useState(0);
  const siteInfo = { roles: {}, emojis: {}, emotes: {}, stickers: {}, showAlert(message) {
    window.__forumReply.alerts.push(message); setAlerts((old) => [...old, message]);
  } };
  function remount() { setGeneration((value) => value + 1); }
  return (
    <SiteInfoContext.Provider value={siteInfo}><UserContext.Provider value={user}>
      <div style={{ padding: 20 }}>
        <h1>Forum reply fixture — no live posts</h1>
        <div style={{ position: "sticky", top: 0, background: "#222", zIndex: 10 }}>
          <Button onClick={async () => {
            const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 32;
            const context = canvas.getContext("2d"); context.fillStyle = "#458fdd"; context.fillRect(0, 0, 64, 32);
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          }}>Copy sample image</Button>
          <Button onClick={() => { failNext = true; }}>Fail next Post</Button>
          <Button onClick={() => { delay = delay ? 0 : 2000; }}>Toggle 2-second delay</Button>
          <Button onClick={() => navigate(location.pathname.endsWith("threadA") ? "/community/forums/thread/threadB" : "/community/forums/thread/threadA")}>Switch thread</Button>
          <Button onClick={() => setVisible((value) => !value)}>Toggle mount</Button>
          <Button onClick={() => { locked = !locked; remount(); }}>Toggle locked</Button>
          <Button onClick={() => { muted = !muted; remount(); }}>Toggle muted</Button>
          <Button onClick={() => { restricted = !restricted; remount(); }}>Toggle restricted</Button>
        </div>
        {alerts.map((message, index) => <div role="alert" key={index}>{message}</div>)}
        {visible && <div className="forums"><Routes><Route path="/community/forums/thread/:threadId"
          element={<Thread key={generation} updateForumNavInfo={() => {}} />} /></Routes></div>}
      </div>
    </UserContext.Provider></SiteInfoContext.Provider>
  );
}
if (!location.pathname.startsWith("/community/forums/thread/")) history.replaceState({}, "", "/community/forums/thread/threadA");
ReactDOM.render(<ThemeProvider theme={theme}><CssBaseline /><BrowserRouter><Fixture /></BrowserRouter></ThemeProvider>, document.getElementById("root"));
window.__forumReplyReady = true;
