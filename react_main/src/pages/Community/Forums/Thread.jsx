import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Redirect, Link, useParams, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import update from "immutability-helper";

import { useErrorAlert } from "../../../components/Alerts";
import { VoteWidget } from "./Forums";
import { NameWithAvatar } from "../../User/User";
import { Time, filterProfanity } from "../../../components/Basic";
import { PageNav } from "../../../components/Nav";
import { TextEditor } from "../../../components/Form";
import { UserContext } from "../../../Contexts";
import { NewLoading } from "../../Welcome/NewLoading";

import { useTheme } from "@mui/material/styles";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

export default function Thread(props) {
  const [threadInfo, setThreadInfo] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [redirect, setRedirect] = useState();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [page, setPage] = useState(1);
  const [scrolled, setScrolled] = useState(false);

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
    axios
      .get(`/forums/thread/${threadId}?reply=${params.get("reply") || ""}`)
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
      var newContent = `${replyContent}\n\n> ##### @${reply.author.name}:\n`;
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
      .post(`/forums/reply`, {
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
      .get(`/forums/thread/${threadId}?page=${page}`)
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
    setThreadInfo(
      update(threadInfo, {
        replyNotify: {
          $set: !threadInfo.replyNotify,
        },
      })
    );
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

  if (redirect) return <Redirect to={redirect} />;

  if (!loaded) return <NewLoading small />;

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
      permaLink={`/community/forums/thread/${threadId}?reply=${reply.id}`}
      onReplyClick={() => onReplyClick(reply)}
      onDelete={() => onThreadPageNav(page)}
      onRestore={() => onThreadPageNav(page)}
      onEdit={() => onThreadPageNav(page)}
    />
  ));

  return (
    <Container maxWidth="md">
      <Post
        postInfo={threadInfo}
        itemType="thread"
        voteItem={threadInfo}
        setVoteItemHolder={setThreadInfo}
        locked={threadInfo.locked}
        onReplyClick={() => onReplyClick()}
        onDelete={onThreadDeleted}
        onRestore={() => onThreadPageNav(page)}
        onEdit={() => onThreadPageNav(page)}
        onNotifyToggled={onNotifyToggled}
        onPinToggled={onPinToggled}
        onLockToggled={onLockToggled}
        hasTitle
      />
      <div ref={replyFormRef}>
        {showReplyForm && (
          <Paper elevation={3} style={{ padding: "16px", margin: "16px 0" }}>
            <TextEditor value={replyContent} onChange={setReplyContent} />
            <div>
              <Button
                variant="contained"
                color="primary"
                onClick={onPostReply}
                style={{ marginRight: "8px" }}
              >
                Post
              </Button>
              <Button variant="contained" color="secondary" onClick={onPostCancel}>
                Cancel
              </Button>
            </div>
          </Paper>
        )}
      </div>
      <div>
        <PageNav
          inverted
          page={page}
          maxPage={threadInfo.pageCount}
          onNav={onThreadPageNav}
        />
        <div>
          {replies.length === 0 && "No replies yet"}
          {replies}
        </div>
        <PageNav
          inverted
          page={page}
          maxPage={threadInfo.pageCount}
          onNav={onThreadPageNav}
        />
      </div>
    </Container>
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
  const onReplyClick = props.onReplyClick;
  const onDelete = props.onDelete;
  const onRestore = props.onRestore;
  const onEdit = props.onEdit;
  const onNotifyToggled = props.onNotifyToggled;
  const onPinToggled = props.onPinToggled;
  const onLockToggled = props.onLockToggled;

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(postInfo.content);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  function onPostDelete() {
    axios.delete(`/forums/${itemType}/${postInfo.id}`).then(onDelete).catch(errorAlert);
  }

  function onPostRestore() {
    axios.post(`/forums/${itemType}/restore/${postInfo.id}`).then(onRestore).catch(errorAlert);
  }

  function onPostEdit() {
    axios
      .put(`/forums/${itemType}/${postInfo.id}`, { content: editContent })
      .then(() => {
        setEditing(false);
        onEdit();
      })
      .catch(errorAlert);
  }

  function onPostReport() {
    axios
      .post(`/forums/report`, {
        post: postInfo.id,
        type: itemType,
      })
      .then(() => alert("Reported for review"))
      .catch(errorAlert);
  }

  function onEditCancel() {
    setEditing(false);
    setEditContent(postInfo.content);
  }

  const post = (
    <Paper
      elevation={3}
      id={id}
      style={{ padding: "16px", marginBottom: "16px" }}
      className={`post ${props.className || ""}`}
    >
      <div>
        <Typography
          variant="subtitle2"
          color="textSecondary"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <span>
            <NameWithAvatar user={postInfo.author} />
            <Link
              to={permaLink}
              style={{
                marginLeft: "8px",
                textDecoration: "none",
                color: theme.palette.primary.main,
              }}
            >
              <Time time={postInfo.time} />
            </Link>
          </span>
          {itemType === "thread" && postInfo.edited && (
            <span style={{ marginLeft: "8px" }}>
              (edited <Time time={postInfo.edited} />)
            </span>
          )}
        </Typography>
      </div>
      {hasTitle && (
        <Typography
          variant="h5"
          component="h2"
          style={{ marginTop: "8px", marginBottom: "16px" }}
        >
          {postInfo.title}
        </Typography>
      )}
      {postInfo.deleted ? (
        <div className="deleted">
          <p>Deleted</p>
          {user.perms.restoreDeletedPosts && (
            <Button
              variant="outlined"
              size="small"
              onClick={onPostRestore}
              style={{ marginTop: "8px" }}
            >
              Restore
            </Button>
          )}
        </div>
      ) : (
        <div>
          {editing ? (
            <div className="post-content">
              <TextEditor value={editContent} onChange={setEditContent} />
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onPostEdit}
                  style={{ marginRight: "8px" }}
                >
                  Save
                </Button>
                <Button variant="contained" color="secondary" onClick={onEditCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="post-content">
              <ReactMarkdown children={postInfo.content} />
            </div>
          )}
        </div>
      )}
      {!editing && (
        <div className="post-buttons" style={{ marginTop: "16px" }}>
          {!locked && (
            <IconButton size="small" onClick={onReplyClick}>
              <i className="fas fa-reply" />
            </IconButton>
          )}
          <VoteWidget
            voteItem={voteItem}
            voteItemHolder={voteItemHolder}
            setVoteItemHolder={setVoteItemHolder}
            itemKey={itemKey}
          />
          {!postInfo.deleted && (
            <div className="other-buttons">
              <IconButton size="small" onClick={onPostReport}>
                <i className="fas fa-flag" />
              </IconButton>
              {(user.id === postInfo.author.id || user.perms.editOtherPosts) &&
                !editing && (
                  <IconButton size="small" onClick={() => setEditing(true)}>
                    <i className="fas fa-edit" />
                  </IconButton>
                )}
              {(user.id === postInfo.author.id || user.perms.deleteOtherPosts) &&
                !postInfo.deleted && (
                  <IconButton size="small" onClick={onPostDelete}>
                    <i className="fas fa-trash" />
                  </IconButton>
                )}
              {itemType === "thread" && (
                <IconButton size="small" onClick={onNotifyToggled}>
                  <i
                    className={`fas fa-bell${
                      postInfo.replyNotify ? "" : "-slash"
                    }`}
                  />
                </IconButton>
              )}
              {itemType === "thread" && user.perms.pinThreads && (
                <IconButton size="small" onClick={onPinToggled}>
                  <i
                    className={`fas fa-thumbtack${
                      postInfo.pinned ? "" : "-slash"
                    }`}
                  />
                </IconButton>
              )}
              {itemType === "thread" && user.perms.lockThreads && (
                <IconButton size="small" onClick={onLockToggled}>
                  <i
                    className={`fas fa-lock${postInfo.locked ? "" : "-open"}`}
                  />
                </IconButton>
              )}
            </div>
          )}
        </div>
      )}
    </Paper>
  );

  return post;
}