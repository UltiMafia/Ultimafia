import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Navigate, Link, useParams, useLocation } from "react-router-dom";
import update from "immutability-helper";
import { Popover, List, ListItem, Typography, Button } from "@mui/material";

import CustomMarkdown from "components/CustomMarkdown";
import { useErrorAlert } from "components/Alerts";
import { Time, filterProfanity } from "components/Basic";
import { PageNav } from "components/Nav";
import { TextEditor } from "components/Form";
import { UserContext } from "Contexts";
import { Loading } from "components/Loading";
import { ThreadPoll } from "components/Poll";

import { VoteWidget } from "components/VoteWidget";
import { NameWithAvatar } from "../../User/User";

function formatForumDate(timestamp) {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString();
}

function getFirstDateValue(author, keys) {
  if (!author) return null;

  for (const key of keys) {
    if (author[key]) return author[key];
  }

  return null;
}

function MentionEditor({ value, onChange, rosterUsers, mentionTagMap }) {
  const editorRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const allCandidates = [
    ...mentionTagMap.map((t) => ({ type: "tag", name: t.text, color: t.color })),
    ...(rosterUsers || [])
      .map((e) => ({ type: "user", name: e.user?.name }))
      .filter((c) => c.name),
  ];

  const filtered = pickerQuery
    ? allCandidates.filter((c) =>
        c.name.toLowerCase().includes(pickerQuery.toLowerCase())
      )
    : allCandidates;

  function insertAtCursor(text) {
    const ta = editorRef.current?.querySelector("textarea");
    const pos = ta ? ta.selectionStart : value.length;
    const next = value.slice(0, pos) + text + " " + value.slice(pos);
    onChange(next);
    setPickerOpen(false);
    setPickerQuery("");
    setTimeout(() => {
      if (ta) {
        ta.focus();
        const newPos = pos + text.length + 1;
        ta.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  function onSelect(candidate) {
    if (candidate.type === "tag") {
      insertAtCursor(`@!${candidate.name}`);
    } else {
      insertAtCursor(`@:${candidate.name}`);
    }
  }

  return (
    <div className="mention-autocomplete-wrapper" ref={editorRef}>
      <TextEditor value={value} onChange={onChange} />
      <div className="mention-picker-row">
        <button
          className="mention-ping-btn"
          type="button"
          onClick={() => { setPickerOpen((o) => !o); setPickerQuery(""); }}
        >
          <i className="fas fa-at" /> Ping
        </button>
        {pickerOpen && (
          <div className="mention-dropdown">
            <input
              className="mention-search"
              autoFocus
              placeholder="Search..."
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
            />
            {filtered.length === 0 && (
              <div className="mention-no-results">No matches</div>
            )}
            {filtered.map((c) => (
              <div
                key={`${c.type}-${c.name}`}
                className="mention-item"
                onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
              >
                {c.type === "tag" ? (
                  <span className="mention-item-tag" style={{ backgroundColor: c.color }}>
                    {c.name}
                    <span className="mention-item-type">role</span>
                  </span>
                ) : (
                  <span className="mention-item-user">
                    <i className="fas fa-user" /> {c.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Thread(props) {
  const [threadInfo, setThreadInfo] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [redirect, setRedirect] = useState();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [page, setPage] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const [newRosterUsername, setNewRosterUsername] = useState("");
  const [expandedRosterId, setExpandedRosterId] = useState(null);
  const [newTagText, setNewTagText] = useState("");
  const [newTagColor, setNewTagColor] = useState("#888888");
  const [rolesDashboardOpen, setRolesDashboardOpen] = useState(false);

  const replyFormRef = useRef();
  const { threadId } = useParams();
  const location = useLocation();
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const params = new URLSearchParams(location.search);

  useEffect(() => {
    document.title = "Forums | UltiMafia";
  }, []);

  useEffect(() => {
    // If there's a specific reply to view, load that; otherwise load the last page
    const replyParam = params.get("reply") || "";
    const url = replyParam
      ? `/api/forums/thread/${threadId}?reply=${replyParam}`
      : `/api/forums/thread/${threadId}?page=last`;

    axios
      .get(url)
      .then((res) => {
        res.data.content = filterProfanity(
          res.data.content,
          user.settings,
          "\\*"
        );

        for (let reply of res.data.replies)
          reply.content = filterProfanity(reply.content, user.settings, "\\*");

        setThreadInfo(res.data);
        setPage(res.data.page);
        setLoaded(true);

        props.updateForumNavInfo({
          type: "thread",
          boardId: res.data.board.id,
          boardName: res.data.board.name,
          threadId: res.data.id,
          threadTitle: res.data.title,
        });
      })
      .catch((e) => {
        errorAlert(e);
        setRedirect("/community/forums");
      });
  }, [threadId]);

  useEffect(() => {
    if (loaded) {
      props.updateForumNavInfo({
        action: "boardAndThread",
        boardId: threadInfo.board.id,
        boardName: threadInfo.board.name,
        threadId: threadInfo.id,
        threadTitle: threadInfo.title,
      });

      if (scrolled || !params.get("reply")) return;

      var reply = document.getElementById(`reply-${params.get("reply")}`);
      setScrolled(true);

      if (reply) reply.scrollIntoView();
    }
  }, [loaded, threadInfo]);

  useEffect(() => {
    if (showReplyForm) replyFormRef.current.scrollIntoView();
  }, [showReplyForm]);

  function onReplyClick(reply) {
    if (threadInfo.locked && !user.perms.postInLocked) return;

    setShowReplyForm(true);

    if (reply) {
      const profilePath = reply.author.vanityUrl
        ? `/user/${reply.author.vanityUrl}`
        : `/user/${reply.author.id}`;
      var newContent = `${replyContent}\n\n> ##### [${reply.author.name}](${profilePath}) said: [↻](/community/forums/thread/${threadId}?reply=${reply.id})\n`;
      var quotedContent = reply.content.split("\n");

      for (let i = 0; i < quotedContent.length; i++)
        quotedContent[i] = `> ${quotedContent[i]}`;

      newContent = `${newContent}${quotedContent.join("\n")}\n\n`;
      setReplyContent(newContent);
    }

    if (showReplyForm) replyFormRef.current.scrollIntoView();
  }

  function onPostReply() {
    axios
      .post(`/api/forums/reply`, {
        thread: threadInfo.id,
        content: replyContent,
      })
      .then((res) => {
        onThreadPageNav(Number(res.data));
        setReplyContent("");
        setShowReplyForm(false);

        document.body.scrollTop = document.body.scrollHeight;
      })
      .catch(errorAlert);
  }

  function onPostCancel() {
    setShowReplyForm(false);
    setReplyContent("");
  }

  function onThreadPageNav(page) {
    axios
      .get(`/api/forums/thread/${threadId}?page=${page}`)
      .then((res) => {
        res.data.content = filterProfanity(
          res.data.content,
          user.settings,
          "\\*"
        );

        for (let reply of res.data.replies)
          reply.content = filterProfanity(reply.content, user.settings, "\\*");

        setPage(page);
        setThreadInfo(res.data);
      })
      .catch(errorAlert);
  }

  function onThreadDeleted() {
    setRedirect(`/community/forums/board/${threadInfo.board.id}`);
  }

  function onNotifyToggled() {
    // For the author, toggle replyNotify
    // For non-authors, toggle isSubscribed
    if (threadInfo.author.id === user.id) {
      setThreadInfo(
        update(threadInfo, {
          replyNotify: {
            $set: !threadInfo.replyNotify,
          },
        })
      );
    } else {
      setThreadInfo(
        update(threadInfo, {
          isSubscribed: {
            $set: !threadInfo.isSubscribed,
          },
        })
      );
    }
  }

  function onPinToggled() {
    setThreadInfo(
      update(threadInfo, {
        pinned: {
          $set: !threadInfo.pinned,
        },
      })
    );
  }

  function onLockToggled() {
    setThreadInfo(
      update(threadInfo, {
        locked: {
          $set: !threadInfo.locked,
        },
      })
    );
  }

  function onRestrictToggled() {
    axios
      .post("/api/forums/thread/toggleRestricted", { thread: threadInfo.id })
      .then((res) => {
        setThreadInfo(
          update(threadInfo, { restricted: { $set: res.data.restricted } })
        );
      })
      .catch(errorAlert);
  }

  function onAddRosterEntry() {
    if (!newRosterUsername.trim()) return;
    axios
      .post("/api/forums/thread/roster", {
        thread: threadInfo.id,
        action: "add",
        username: newRosterUsername.trim(),
      })
      .then((res) => {
        setThreadInfo(
          update(threadInfo, {
            rosterUsers: { $set: [...(threadInfo.rosterUsers || []), res.data] },
          })
        );
        setNewRosterUsername("");
        setExpandedRosterId(res.data.user.id);
      })
      .catch(errorAlert);
  }

  function onRemoveRosterEntry(targetUserId) {
    axios
      .post("/api/forums/thread/roster", {
        thread: threadInfo.id,
        action: "remove",
        userId: targetUserId,
      })
      .then(() => {
        setThreadInfo(
          update(threadInfo, {
            rosterUsers: {
              $set: (threadInfo.rosterUsers || []).filter(
                (e) => e.user.id !== targetUserId
              ),
            },
          })
        );
        if (expandedRosterId === targetUserId) setExpandedRosterId(null);
      })
      .catch(errorAlert);
  }

  function onMuteTag(tagText) {
    axios
      .post("/api/forums/thread/roster/mute", {
        thread: threadInfo.id,
        tagText,
      })
      .then((res) => {
        const next = res.data.muted
          ? [...(threadInfo.mutedTags || []), tagText]
          : (threadInfo.mutedTags || []).filter((t) => t !== tagText);
        setThreadInfo(update(threadInfo, { mutedTags: { $set: next } }));
      })
      .catch(errorAlert);
  }

function onAddTag(targetUserId) {
    if (!newTagText.trim()) return;
    const text = newTagText.trim();
    const alreadyPreset = (threadInfo.tagPresets || []).some(
      (p) => p.text === text
    );
    const tagReq = axios.post("/api/forums/thread/roster", {
      thread: threadInfo.id,
      action: "addTag",
      userId: targetUserId,
      text,
      color: newTagColor,
    });
    const presetReq = alreadyPreset
      ? Promise.resolve(null)
      : axios.post("/api/forums/thread/roster", {
          thread: threadInfo.id,
          action: "savePreset",
          text,
          color: newTagColor,
        });
    Promise.all([tagReq, presetReq])
      .then(([tagRes, presetRes]) => {
        setThreadInfo(
          update(threadInfo, {
            rosterUsers: {
              $set: (threadInfo.rosterUsers || []).map((e) =>
                e.user.id === targetUserId
                  ? { ...e, tags: [...(e.tags || []), tagRes.data] }
                  : e
              ),
            },
            tagPresets: {
              $set: presetRes
                ? [...(threadInfo.tagPresets || []), presetRes.data]
                : threadInfo.tagPresets,
            },
          })
        );
      })
      .catch(errorAlert);
  }

  function onRemoveTag(targetUserId, tagId) {
    axios
      .post("/api/forums/thread/roster", {
        thread: threadInfo.id,
        action: "removeTag",
        userId: targetUserId,
        tagId,
      })
      .then(() => {
        setThreadInfo(
          update(threadInfo, {
            rosterUsers: {
              $set: (threadInfo.rosterUsers || []).map((e) =>
                e.user.id === targetUserId
                  ? { ...e, tags: (e.tags || []).filter((t) => t._id !== tagId) }
                  : e
              ),
            },
          })
        );
      })
      .catch(errorAlert);
  }

  function onSavePreset() {
    if (!newTagText.trim()) {
      errorAlert("Type a tag name first, then click the bookmark to save it.");
      return;
    }
    axios
      .post("/api/forums/thread/roster", {
        thread: threadInfo.id,
        action: "savePreset",
        text: newTagText.trim(),
        color: newTagColor,
      })
      .then((res) => {
        setThreadInfo(
          update(threadInfo, {
            tagPresets: {
              $set: [...(threadInfo.tagPresets || []), res.data],
            },
          })
        );
      })
      .catch(errorAlert);
  }

  function onRemovePreset(presetId) {
    axios
      .post("/api/forums/thread/roster", {
        thread: threadInfo.id,
        action: "removePreset",
        presetId,
      })
      .then(() => {
        setThreadInfo(
          update(threadInfo, {
            tagPresets: {
              $set: (threadInfo.tagPresets || []).filter(
                (p) => p._id !== presetId
              ),
            },
          })
        );
      })
      .catch(errorAlert);
  }

  function onApplyPreset(preset, targetUserId) {
    axios
      .post("/api/forums/thread/roster", {
        thread: threadInfo.id,
        action: "addTag",
        userId: targetUserId,
        text: preset.text,
        color: preset.color,
      })
      .then((res) => {
        setThreadInfo(
          update(threadInfo, {
            rosterUsers: {
              $set: (threadInfo.rosterUsers || []).map((e) =>
                e.user.id === targetUserId
                  ? { ...e, tags: [...(e.tags || []), res.data] }
                  : e
              ),
            },
          })
        );
      })
      .catch(errorAlert);
  }

  if (redirect) return <Navigate to={redirect} />;

  if (!loaded) return <Loading small />;

  const isAuthor = user.id === threadInfo.author?.id;
  const isMuted = !!threadInfo.isMuted || false;

  // Build tag color map from all applied tags across roster users + presets
  const mentionTagMap = (() => {
    const map = {};
    for (const p of (threadInfo.tagPresets || []))
      map[p.text.toLowerCase()] = { text: p.text, color: p.color };
    for (const entry of (threadInfo.rosterUsers || []))
      for (const t of (entry.tags || []))
        if (!map[t.text.toLowerCase()])
          map[t.text.toLowerCase()] = { text: t.text, color: t.color };
    return Object.values(map);
  })();
  const canReply =
    !isMuted &&
    (!threadInfo.restricted || isAuthor || threadInfo.isAllowedPoster);

  const replies = threadInfo.replies.map((reply) => (
    <Post
      className={`reply ${reply.id === params.get("reply") ? "sel" : ""}`}
      id={`reply-${reply.id}`}
      key={reply.id}
      postInfo={reply}
      itemType="reply"
      voteItem={reply}
      voteItemHolder={threadInfo}
      setVoteItemHolder={setThreadInfo}
      itemKey="replies"
      locked={threadInfo.locked}
      canReply={canReply}
      permaLink={`/community/forums/thread/${threadId}?reply=${reply.id}`}
      onReplyClick={() => onReplyClick(reply)}
      onDelete={() => onThreadPageNav(page)}
      onRestore={() => onThreadPageNav(page)}
      onEdit={() => onThreadPageNav(page)}
      mentionTags={mentionTagMap}
    />
  ));

  return (
    <div className="thread-wrapper">
      <div className="thread-main-row">
        <div className="thread-post-col">
          <Post
            postInfo={threadInfo}
            itemType="thread"
            voteItem={threadInfo}
            setVoteItemHolder={setThreadInfo}
            locked={threadInfo.locked}
            canReply={canReply}
            onReplyClick={() => onReplyClick()}
            onDelete={onThreadDeleted}
            onRestore={() => onThreadPageNav(page)}
            onEdit={() => onThreadPageNav(page)}
            onNotifyToggled={onNotifyToggled}
            onPinToggled={onPinToggled}
            onLockToggled={onLockToggled}
            onRestrictToggled={onRestrictToggled}
            mentionTags={mentionTagMap}
            hasTitle
          />
        </div>
        {((threadInfo.rosterUsers || []).length > 0 || threadInfo.restricted) && (
          <div className="restricted-panel span-panel">
            <div className="restricted-panel-header">
              <i className="fas fa-users" />
              <span>People</span>
              {isAuthor && (
                <span
                  className={`roster-restricted-badge${threadInfo.restricted ? "" : " inactive"} clickable-badge`}
                  onClick={onRestrictToggled}
                  title={threadInfo.restricted ? "Click to unrestrict" : "Click to restrict posting to people list"}
                >
                  {threadInfo.restricted ? "Restricted" : "Unrestricted"}
                </span>
              )}
              {!isAuthor && threadInfo.restricted && (
                <span className="roster-restricted-badge">
                  Restricted
                </span>
              )}
            </div>
            {isAuthor && (() => {
              const seenTexts = new Set();
              const allTags = [];
              for (const entry of (threadInfo.rosterUsers || [])) {
                for (const tag of (entry.tags || [])) {
                  if (!seenTexts.has(tag.text)) {
                    seenTexts.add(tag.text);
                    allTags.push(tag);
                  }
                }
              }
              if (allTags.length === 0) return null;
              const mutedSet = new Set(threadInfo.mutedTags || []);
              return (
                <div className="roles-section">
                  <div
                    className="roles-section-label clickable-badge"
                    onClick={() => setRolesDashboardOpen((o) => !o)}
                  >
                    Roles Dashboard
                    <i className={`fas fa-chevron-${rolesDashboardOpen ? "up" : "down"}`} style={{ marginLeft: 6, fontSize: 10 }} />
                  </div>
                  {rolesDashboardOpen && (
                    <div className="roles-list">
                      {allTags.map((tag) => {
                        const muted = mutedSet.has(tag.text);
                        return (
                          <div key={tag.text} className="role-row">
                            <span className="roster-tag" style={{ backgroundColor: tag.color }}>
                              {tag.text}
                            </span>
                            <i
                              className={`fas fa-volume-mute role-mute-btn${muted ? " active" : ""}`}
                              onClick={() => onMuteTag(tag.text)}
                              title={muted ? "Unmute role" : "Mute role"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="restricted-poster-list">
              {(threadInfo.rosterUsers || []).length === 0 && (
                <span className="no-extra-posters">No one added yet.</span>
              )}
              {(threadInfo.rosterUsers || []).map((entry) => (
                <div key={entry.user.id} className="roster-entry">
                  <div
                    className={`poster-list-item${isAuthor ? " clickable" : ""}`}
                    onClick={() =>
                      isAuthor &&
                      setExpandedRosterId(
                        expandedRosterId === entry.user.id
                          ? null
                          : entry.user.id
                      )
                    }
                  >
                    <NameWithAvatar
                      small
                      id={entry.user.id}
                      name={entry.user.name}
                      avatar={entry.user.avatar}
                      vanityUrl={entry.user.vanityUrl}
                    />
                    <div className="roster-tags">
                      {(entry.tags || []).map((tag) => (
                        <span
                          key={tag._id}
                          className="roster-tag"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.text}
                        </span>
                      ))}
                    </div>
                    {isAuthor && (
                      <i
                        className="fas fa-times chip-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRosterEntry(entry.user.id);
                        }}
                        title="Remove"
                      />
                    )}
                  </div>
                  {isAuthor && expandedRosterId === entry.user.id && (
                    <div className="roster-tag-editor">
                      {(entry.tags || []).map((tag) => (
                        <div key={tag._id} className="tag-editor-row">
                          <span
                            className="roster-tag"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.text}
                          </span>
                          <i
                            className="fas fa-times chip-remove"
                            onClick={() => onRemoveTag(entry.user.id, tag._id)}
                            title="Remove tag"
                          />
                        </div>
                      ))}
                      {(threadInfo.tagPresets || []).length > 0 && (
                        <div className="preset-chips">
                          {(threadInfo.tagPresets || []).map((preset) => (
                            <div key={preset._id} className="preset-chip-wrap">
                              <span
                                className="roster-tag preset-chip"
                                style={{ backgroundColor: preset.color }}
                                onClick={() =>
                                  onApplyPreset(preset, entry.user.id)
                                }
                                title="Click to apply"
                              >
                                {preset.text}
                              </span>
                              <i
                                className="fas fa-times chip-remove preset-remove"
                                onClick={() => onRemovePreset(preset._id)}
                                title="Delete preset"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="tag-add-row">
                        <input
                          type="text"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && onAddTag(entry.user.id)
                          }
                          placeholder="Tag name..."
                        />
                        <input
                          className="roster-color-input"
                          type="color"
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                        />
                        <div
                          className="btn btn-theme-sec"
                          onClick={() => onAddTag(entry.user.id)}
                        >
                          Add
                        </div>
                        <div
                          className="preset-save-btn"
                          onClick={onSavePreset}
                          title="Save as preset"
                        >
                          <i className="fas fa-bookmark" />
                          Save
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isAuthor && (
              <div className="add-poster-row">
                <input
                  type="text"
                  value={newRosterUsername}
                  onChange={(e) => setNewRosterUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onAddRosterEntry()}
                  placeholder="Add username..."
                />
                <div className="btn btn-theme-sec" onClick={onAddRosterEntry}>
                  Add
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ThreadPoll threadId={threadId} locked={threadInfo.locked} />
      <div className="reply-form-wrapper" ref={replyFormRef}>
        {showReplyForm && (
          <div className="reply-form span-panel">
            <MentionEditor
              value={replyContent}
              onChange={setReplyContent}
              rosterUsers={threadInfo.rosterUsers}
              mentionTagMap={mentionTagMap}
            />
            <div className="post-btn-wrapper">
              <div className="post-reply btn btn-theme" onClick={onPostReply}>
                Post
              </div>
              <div className="btn btn-theme-sec" onClick={onPostCancel}>
                Cancel
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="replies-wrapper">
        <PageNav
          inverted
          page={page}
          maxPage={threadInfo.pageCount}
          onNav={onThreadPageNav}
        />
        <div className="replies">
          {replies.length === 0 && "No replies yet"}
          {replies}
        </div>
        <PageNav
          inverted
          page={page}
          maxPage={threadInfo.pageCount}
          onNav={onThreadPageNav}
        />
        {user.perms.postReply &&
          (!threadInfo.locked || user.perms.postInLocked) &&
          canReply && (
            <div style={{ marginTop: "16px" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onReplyClick()}
                sx={{ minWidth: "120px" }}
              >
                Reply
              </Button>
            </div>
          )}
        {isMuted && (
          <div className="restricted-notice muted-notice">
            <i className="fas fa-volume-mute" /> You have been muted in this thread.
          </div>
        )}
        {!isMuted && threadInfo.restricted && !canReply && (
          <div className="restricted-notice">
            <i className="fas fa-user-lock" /> You are not allowed to post in
            this thread.
          </div>
        )}
      </div>
    </div>
  );
}

function Post(props) {
  const id = props.id;
  const postInfo = props.postInfo;
  const itemType = props.itemType;
  const voteItem = props.voteItem;
  const voteItemHolder = props.voteItemHolder;
  const setVoteItemHolder = props.setVoteItemHolder;
  const itemKey = props.itemKey;
  const hasTitle = props.hasTitle;
  const permaLink = props.permaLink;
  const locked = props.locked;
  const canReply = props.canReply !== false;
  const onReplyClick = props.onReplyClick;
  const onDelete = props.onDelete;
  const onRestore = props.onRestore;
  const onEdit = props.onEdit;
  const onNotifyToggled = props.onNotifyToggled;
  const onPinToggled = props.onPinToggled;
  const onLockToggled = props.onLockToggled;
  const onRestrictToggled = props.onRestrictToggled;
  const mentionTags = props.mentionTags;

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(postInfo.content);
  const [anchorEl, setAnchorEl] = useState(null);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const profileJoinDate = formatForumDate(
    getFirstDateValue(postInfo.author, [
      "joinDate",
      "createdAt",
      "created",
      "joined",
    ])
  );
  const profileLastSeenDate = formatForumDate(
    getFirstDateValue(postInfo.author, [
      "lastSeen",
      "lastActive",
      "lastOnline",
      "lastVisited",
      "lastVisit",
    ])
  );
  const authorSubContent =
    profileJoinDate || profileLastSeenDate ? (
      <div className="forum-author-meta">
        <div>
          <Time minSec millisec={Date.now() - postInfo.postDate} /> ago
        </div>
        {profileJoinDate && <div>Join Date {profileJoinDate}</div>}
        {profileLastSeenDate && <div>Last Seen {profileLastSeenDate}</div>}
      </div>
    ) : (
      <div className="forum-author-meta">
        <div>
          <Time minSec millisec={Date.now() - postInfo.postDate} /> ago
        </div>
      </div>
    );

  function onDeleteClick() {
    const shouldDelete = window.confirm(
      "Are you sure you wish to delete this?"
    );

    if (!shouldDelete) return;

    axios
      .post(`/api/forums/${itemType}/delete`, { [itemType]: postInfo.id })
      .then(onDelete)
      .catch(errorAlert);
  }

  function onRestoreClick() {
    axios
      .post(`/api/forums/${itemType}/restore`, { [itemType]: postInfo.id })
      .then(onRestore)
      .catch(errorAlert);
  }

  function onEditClick() {
    setEditing(true);
  }

  function onEditSave() {
    axios
      .post(`/api/forums/${itemType}/edit`, {
        [itemType]: postInfo.id,
        content: editContent,
      })
      .then(() => {
        setEditing(false);
        onEdit();
      })
      .catch(errorAlert);
  }

  function onEditCancel() {
    setEditing(false);
  }

  function onPermaLinkClick() {
    navigator.clipboard.writeText(window.location.origin + permaLink);
  }

  function onNotifyClick() {
    axios
      .post(`/api/forums/thread/notify`, { thread: postInfo.id })
      .then(onNotifyToggled)
      .catch(() => {});
  }

  function onTogglePinnedClick() {
    axios
      .post(`/api/forums/thread/togglePinned`, { thread: postInfo.id })
      .then(onPinToggled)
      .catch(errorAlert);
  }

  function onToggleLockedClick() {
    axios
      .post(`/api/forums/thread/toggleLocked`, { thread: postInfo.id })
      .then(onLockToggled)
      .catch(errorAlert);
  }

  function handlePopoverOpen(event) {
    setAnchorEl(event.currentTarget);
  }

  function handlePopoverClose() {
    setAnchorEl(null);
  }

  var content = postInfo.content;

  if (postInfo.deleted && user.settings.hideDeleted) content = "*deleted*";

  return (
    <div
      className={`post span-panel ${postInfo.deleted ? "deleted" : ""} ${
        props.className
      }`}
      id={id}
    >
      <div className="vote-wrapper">
        <VoteWidget
          item={voteItem}
          itemType={itemType}
          itemHolder={voteItemHolder}
          setItemHolder={setVoteItemHolder}
          itemKey={itemKey}
        />
      </div>
      <div className="main-wrapper">
        <div className="heading">
          <div className="heading-left">
            {hasTitle && (
              <div className="title">
                {locked && <i className="fas fa-lock" />}
                {postInfo.pinned && <i className="fas fa-thumbtack" />}
                {postInfo.restricted && (
                  <i className="fas fa-user-lock" title="Restricted thread" />
                )}
                {postInfo.title}
              </div>
            )}
            <div className="author-row">
              <div className="post-info">
                <NameWithAvatar
                  id={postInfo.author.id}
                  name={postInfo.author.name}
                  avatar={postInfo.author.avatar}
                  groups={postInfo.author.groups}
                  vanityUrl={postInfo.author.vanityUrl}
                  includeMiniprofile
                  large
                  subContent={authorSubContent}
                />
              </div>
              {postInfo.author?.forumBanner && (
                <img
                  className="forum-author-banner"
                  src={`/uploads/${postInfo.author.id}_forumBanner.webp`}
                  alt={`${postInfo.author.name} forum banner`}
                />
              )}
            </div>
          </div>
          <div className="btns-wrapper">
            {!postInfo.deleted && (
              <>
                {onReplyClick &&
                  user.perms.postReply &&
                  (!locked || user.perms.postInLocked) &&
                  canReply && (
                    <i className="fas fa-reply" onClick={onReplyClick} />
                  )}
                {itemType === "thread" && user.perms.pinThreads && (
                  <i
                    className={`fas fa-thumbtack ${
                      postInfo.pinned ? "fa-rotate-180" : ""
                    }`}
                    onClick={onTogglePinnedClick}
                  />
                )}
                {itemType === "thread" && user.perms.lockThreads && (
                  <i
                    className={`fas fa-lock${postInfo.locked ? "-open" : ""}`}
                    onClick={onToggleLockedClick}
                  />
                )}
                {(user.perms.deleteAnyPost ||
                  (user.perms.deleteOwnPost &&
                    postInfo.author.id === user.id)) && (
                  <i className="fas fa-trash" onClick={onDeleteClick} />
                )}
                {user.perms.editPost &&
                  postInfo.author.id === user.id &&
                  (!locked || user.perms.postInLocked) && (
                    <i className="fas fa-pencil-alt" onClick={onEditClick} />
                  )}
                {itemType === "thread" && user.loggedIn && (
                  <>
                    <i
                      className={`fa${
                        postInfo.author.id === user.id
                          ? postInfo.replyNotify
                            ? "s"
                            : "r"
                          : postInfo.isSubscribed
                          ? "s"
                          : "r"
                      } fa-bell`}
                      onClick={onNotifyClick}
                      onMouseEnter={handlePopoverOpen}
                      onMouseLeave={handlePopoverClose}
                      style={{ cursor: "pointer" }}
                    />
                    <Popover
                      sx={{
                        pointerEvents: "none",
                      }}
                      open={Boolean(anchorEl)}
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                      onClose={handlePopoverClose}
                      disableRestoreFocus
                    >
                      <div style={{ padding: "8px 12px" }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: "bold", mb: 1 }}
                        >
                          Subscribed Users:
                        </Typography>
                        {postInfo.subscriberUsers &&
                        postInfo.subscriberUsers.length > 0 ? (
                          <List dense sx={{ py: 0 }}>
                            {postInfo.author.id && postInfo.replyNotify && (
                              <ListItem sx={{ py: 0.5, px: 1 }}>
                                <Typography variant="body2">
                                  {postInfo.author.name} (Author)
                                </Typography>
                              </ListItem>
                            )}
                            {postInfo.subscriberUsers.map((subscriber) => (
                              <ListItem
                                key={subscriber.id}
                                sx={{ py: 0.5, px: 1 }}
                              >
                                <Typography variant="body2">
                                  {subscriber.name}
                                </Typography>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <>
                            {postInfo.author.id && postInfo.replyNotify ? (
                              <List dense sx={{ py: 0 }}>
                                <ListItem sx={{ py: 0.5, px: 1 }}>
                                  <Typography variant="body2">
                                    {postInfo.author.name} (Author)
                                  </Typography>
                                </ListItem>
                              </List>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{ fontStyle: "italic" }}
                              >
                                No subscribers
                              </Typography>
                            )}
                          </>
                        )}
                      </div>
                    </Popover>
                  </>
                )}
                {permaLink && (
                  <Link to={permaLink} onClick={() => onPermaLinkClick()}>
                    <i className="fas fa-link" />
                  </Link>
                )}
              </>
            )}
            {postInfo.deleted && user.perms.restoreDeleted && (
              <i className="fas fa-trash-restore" onClick={onRestoreClick} />
            )}
          </div>
        </div>
        {!editing && (
          <div className="md-content">
            <CustomMarkdown mentionTags={mentionTags}>{content}</CustomMarkdown>
          </div>
        )}
        {editing && (
          <div className="edit-wrapper">
            <TextEditor value={editContent} onChange={setEditContent} />
            <div className="post-btn-wrapper">
              <div
                className="post-reply btn btn-theme-sec"
                onClick={onEditSave}
              >
                Save
              </div>
              <div className="btn btn-theme-sec" onClick={onEditCancel}>
                Cancel
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
