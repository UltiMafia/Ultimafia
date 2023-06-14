import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Redirect, Link, useParams, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import update from "immutability-helper";

import LoadingPage from "../../Loading";
import { useErrorAlert } from "../../../components/Alerts";
import { VoteWidget } from "./Forums";
import { NameWithAvatar } from "../../User/User";
import { Time, filterProfanity } from "../../../components/Basic";
import { PageNav } from "../../../components/Nav";
import { TextEditor } from "../../../components/Form";
import { UserContext } from "../../../Contexts";

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

        for (const reply of res.data.replies)
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

      const reply = document.getElementById(`reply-${params.get("reply")}`);
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
      let newContent = `${replyContent}\n\n> ##### @${reply.author.name}:\n`;
      const quotedContent = reply.content.split("\n");

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

        for (const reply of res.data.replies)
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

  if (!loaded) return <LoadingPage />;

  const replies = threadInfo.replies.map((reply) => (
    <Post
      className={`reply ${reply.id == params.get("reply") ? "sel" : ""}`}
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
          {replies.length == 0 && "No replies yet"}
          {replies}
        </div>
        <PageNav
          inverted
          page={page}
          maxPage={threadInfo.pageCount}
          onNav={onThreadPageNav}
        />
      </div>
    </div>
  );
}

function Post(props) {
  const { id } = props;
  const { postInfo } = props;
  const { itemType } = props;
  const { voteItem } = props;
  const { voteItemHolder } = props;
  const { setVoteItemHolder } = props;
  const { itemKey } = props;
  const { hasTitle } = props;
  const { permaLink } = props;
  const { locked } = props;
  const { onReplyClick } = props;
  const { onDelete } = props;
  const { onRestore } = props;
  const { onEdit } = props;
  const { onNotifyToggled } = props;
  const { onPinToggled } = props;
  const { onLockToggled } = props;

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(postInfo.content);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  function onDeleteClick() {
    const shouldDelete = window.confirm(
      "Are you sure you wish to delete this?"
    );

    if (!shouldDelete) return;

    axios
      .post(`/forums/${itemType}/delete`, { [itemType]: postInfo.id })
      .then(onDelete)
      .catch(errorAlert);
  }

  function onRestoreClick() {
    axios
      .post(`/forums/${itemType}/restore`, { [itemType]: postInfo.id })
      .then(onRestore)
      .catch(errorAlert);
  }

  function onEditClick() {
    setEditing(true);
  }

  function onEditSave() {
    axios
      .post(`/forums/${itemType}/edit`, {
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
      .post(`/forums/thread/notify`, { thread: postInfo.id })
      .then(onNotifyToggled)
      .catch(() => {});
  }

  function onTogglePinnedClick() {
    axios
      .post(`/forums/thread/togglePinned`, { thread: postInfo.id })
      .then(onPinToggled)
      .catch(errorAlert);
  }

  function onToggleLockedClick() {
    axios
      .post(`/forums/thread/toggleLocked`, { thread: postInfo.id })
      .then(onLockToggled)
      .catch(errorAlert);
  }

  let { content } = postInfo;

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
                {itemType == "thread" && user.perms.pinThreads && (
                  <i
                    className={`fas fa-thumbtack ${
                      postInfo.pinned ? "fa-rotate-180" : ""
                    }`}
                    onClick={onTogglePinnedClick}
                  />
                )}
                {itemType == "thread" && user.perms.lockThreads && (
                  <i
                    className={`fas fa-lock${postInfo.locked ? "-open" : ""}`}
                    onClick={onToggleLockedClick}
                  />
                )}
                {(user.perms.deleteAnyPost ||
                  (user.perms.deleteOwnPost &&
                    postInfo.author.id == user.id)) && (
                  <i className="fas fa-trash" onClick={onDeleteClick} />
                )}
                {user.perms.editPost &&
                  postInfo.author.id == user.id &&
                  (!locked || user.perms.postInLocked) && (
                    <i className="fas fa-pencil-alt" onClick={onEditClick} />
                  )}
                {itemType == "thread" && postInfo.author.id == user.id && (
                  <i
                    className={`fa${postInfo.replyNotify ? "s" : "r"} fa-bell`}
                    onClick={onNotifyClick}
                  />
                )}
                {permaLink && (
                  <Link to={permaLink} onClick={() => onPermaLinkClick()}>
                    <i className="fas fa-link" />
                  </Link>
                )}
                {user.perms.postReply &&
                  (!locked || user.perms.postInLocked) && (
                    <i
                      className="reply-btn fas fa-reply"
                      onClick={onReplyClick}
                    />
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
            <ReactMarkdown source={content} />
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
              <div className="btn btn-theme-third" onClick={onEditCancel}>
                Cancel
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
