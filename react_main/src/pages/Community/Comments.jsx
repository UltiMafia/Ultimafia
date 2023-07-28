import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import { useErrorAlert } from "../../components/Alerts";
import { VoteWidget } from "./Forums/Forums";
import { NameWithAvatar } from "../User/User";
import { Time, filterProfanity, basicRenderers } from "../../components/Basic";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { TextEditor } from "../../components/Form";
import { UserContext } from "../../Contexts";
import LoadingPage from "../Loading";

import "../../css/forums.css";
import "../../css/comments.css";

export default function Comments(props) {
  const location = props.location;

  const [page, setPage] = useState(1);
  const [comments, setComments] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    setComments([]);
    onCommentsPageNav(1);
  }, [location]);

  function onCommentsPageNav(_page) {
    var filterArg = getPageNavFilterArg(_page, page, comments, "date");

    if (filterArg == null) return;

    axios
      .get(`/comment?location=${location}&${filterArg}`)
      .then((res) => {
        setLoaded(true);

        if (res.data.length > 0) {
          for (let comment of res.data)
            comment.content = filterProfanity(
              comment.content,
              user.settings,
              "\\*"
            );

          setComments(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  function onPostSubmit() {
    axios
      .post("/comment", { content: postContent, location })
      .then(() => {
        onCommentsPageNav(1);
        setPostContent("");
        setShowInput(false);
      })
      .catch(errorAlert);
  }

  function onPostCancel() {
    setShowInput(false);
  }

  const commentRows = comments.map((comment) => (
    <Comment
      location={location}
      comment={comment}
      comments={comments}
      setComments={setComments}
      onDelete={() => onCommentsPageNav(page)}
      onRestore={() => onCommentsPageNav(page)}
      key={comment.id}
    />
  ));

  if (!loaded) return <LoadingPage className="under" />;

  return (
    <div className="comments-wrapper thread-wrapper">
      <div className="comments-input-wrapper">
        {!showInput && user.loggedIn && user.perms.postReply && (
          <div className="btn btn-theme" onClick={() => setShowInput(true)}>
            Post Comment
          </div>
        )}
        {showInput && (
          <div className="reply-form span-panel">
            <TextEditor value={postContent} onChange={setPostContent} />
            <div className="post-btn-wrapper">
              <div className="post-reply btn btn-theme" onClick={onPostSubmit}>
                Post
              </div>
              <div className="btn btn-theme-sec" onClick={onPostCancel}>
                Cancel
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="comments-page">
        <PageNav inverted page={page} onNav={onCommentsPageNav} />
        {comments.length == 0 && "No comments yet"}
        {commentRows}
        <PageNav inverted page={page} onNav={onCommentsPageNav} />
      </div>
    </div>
  );
}

function Comment(props) {
  const location = props.location;
  const comment = props.comment;
  const comments = props.comments;
  const setComments = props.setComments;
  const onDelete = props.onDelete;
  const onRestore = props.onRestore;

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  function onDeleteClick() {
    const shouldDelete = window.confirm(
      "Are you sure you wish to delete this?"
    );

    if (!shouldDelete) return;

    axios
      .post(`/comment/delete`, { comment: comment.id })
      .then(onDelete)
      .catch(errorAlert);
  }

  function onRestoreClick() {
    axios
      .post(`/comment/restore`, { comment: comment.id })
      .then(onRestore)
      .catch(errorAlert);
  }

  var content = comment.content;

  if (comment.deleted && user.settings.hideDeleted) content = "*deleted*";

  return (
    <div
      className={`post ${comment.deleted ? "deleted" : ""} ${
        props.className || ""
      }`}
    >
      <div className="vote-wrapper">
        <VoteWidget
          item={comment}
          itemHolder={comments}
          setItemHolder={setComments}
          itemType="comment"
        />
      </div>
      <div className="main-wrapper">
        <div className="heading">
          <div className="heading-left">
            <div className="post-info">
              <NameWithAvatar
                id={comment.author.id}
                name={comment.author.name}
                avatar={comment.author.avatar}
                groups={comment.author.groups}
              />
              <div className="post-date">
                <Time minSec millisec={Date.now() - comment.date} />
                {" ago"}
              </div>
            </div>
          </div>
          <div className="btns-wrapper">
            {!comment.deleted &&
              (user.perms.deleteAnyPost ||
                (user.perms.deleteOwnPost && comment.author.id == user.id) ||
                location == user.id) && (
                <i className="fas fa-trash" onClick={onDeleteClick} />
              )}
            {comment.deleted && user.perms.restoreDeleted && (
              <i className="fas fa-trash-restore" onClick={onRestoreClick} />
            )}
          </div>
        </div>
        <div className="md-content">
          <ReactMarkdown renderers={basicRenderers()} source={content} />
        </div>
      </div>
    </div>
  );
}
