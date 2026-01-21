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

import { VoteWidget } from "./Forums";
import { NameWithAvatar } from "../../User/User";

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

  if (redirect) return <Navigate to={redirect} />;

  if (!loaded) return <Loading small />;

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
    <div className="thread-wrapper">
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
      <ThreadPoll threadId={threadId} locked={threadInfo.locked} />
      <div className="reply-form-wrapper" ref={replyFormRef}>
        {showReplyForm && (
          <div className="reply-form span-panel">
            <TextEditor value={replyContent} onChange={setReplyContent} />
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
          (!threadInfo.locked || user.perms.postInLocked) && (
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
  const onReplyClick = props.onReplyClick;
  const onDelete = props.onDelete;
  const onRestore = props.onRestore;
  const onEdit = props.onEdit;
  const onNotifyToggled = props.onNotifyToggled;
  const onPinToggled = props.onPinToggled;
  const onLockToggled = props.onLockToggled;

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(postInfo.content);
  const [anchorEl, setAnchorEl] = useState(null);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

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
                {postInfo.title}
              </div>
            )}
            <div className="post-info">
              <NameWithAvatar
                id={postInfo.author.id}
                name={postInfo.author.name}
                avatar={postInfo.author.avatar}
                groups={postInfo.author.groups}
                vanityUrl={postInfo.author.vanityUrl}
              />
              <div className="post-date">
                <Time minSec millisec={Date.now() - postInfo.postDate} />
                {" ago"}
              </div>
            </div>
          </div>
          <div className="btns-wrapper">
            {!postInfo.deleted && (
              <>
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
            <CustomMarkdown>{content}</CustomMarkdown>
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
