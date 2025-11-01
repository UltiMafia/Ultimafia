import React, { useState, useEffect, useContext } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import axios from "axios";

import { useErrorAlert } from "../../../components/Alerts";
import { getPageNavFilterArg, PageNav } from "../../../components/Nav";
import { NameWithAvatar } from "../../User/User";
import { Modal } from "../../../components/Modal";
import { VoteWidget, ViewsAndReplies } from "./Forums";
import { TextEditor } from "../../../components/Form";
import { Time } from "../../../components/Basic";
import { UserContext } from "../../../Contexts";
import { NewLoading } from "../../Welcome/NewLoading";

export default function Board(props) {
  const [boardInfo, setBoardInfo] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [boardPage, setBoardPage] = useState(1);
  const sortType = "bumpDate";
  // const [sortType, setSortType] = useState("bumpDate");
  const [loaded, setLoaded] = useState(false);
  const [redirect, setRedirect] = useState();

  const { boardId } = useParams();
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Create Mafia Setup | UltiMafia";
  }, []);

  useEffect(() => {
    axios
      .get(`/api/forums/board/${boardId}`)
      .then((res) => {
        setBoardInfo(res.data);
        setLoaded(true);

        document.title = `${res.data.name} | UltiMafia`;

        props.updateForumNavInfo({
          type: "board",
          id: boardId,
          name: res.data.name,
        });
      })
      .catch((e) => {
        errorAlert(e);
        setRedirect("/community/forums");
      });
  }, [boardId]);

  useEffect(() => {
    if (loaded) {
      props.updateForumNavInfo({
        action: "board",
        id: boardInfo.id,
        name: boardInfo.name,
      });
    }
  }, [loaded, boardInfo]);

  function onCreateThreadClick() {
    setShowCreateModal(true);
  }

  function onBoardPageNav(page) {
    var filterArg = getPageNavFilterArg(
      page,
      boardPage,
      boardInfo.threads,
      sortType
    );

    if (filterArg == null) return;

    axios
      .get(`/api/forums/board/${boardId}?sortType=${sortType}&${filterArg}`)
      .then((res) => {
        if (res.data.threads.length > 0) {
          setBoardInfo(res.data);
          setBoardPage(page);
        }
      })
      .catch(errorAlert);
  }

  function threadRowsMap(thread) {
    const recentReplies = thread.recentReplies.map((reply) => (
      <div className="column-item" key={reply.id}>
        <NameWithAvatar
          small
          id={reply.author.id}
          name={reply.author.name}
          avatar={reply.author.avatar}
          vanityUrl={reply.author.vanityUrl}
        />
        <Link
          className="reply-age"
          to={`/community/forums/thread/${thread.id}?reply=${reply.id}`}
        >
          <Time millisec={Date.now() - reply.postDate} />
          {` ago`}
        </Link>
      </div>
    ));

    return (
      <div
        className={`thread ${thread.deleted ? "deleted" : ""}`}
        key={thread.id}
      >
        <VoteWidget
          item={thread}
          itemType="thread"
          itemHolder={boardInfo}
          setItemHolder={setBoardInfo}
          itemKey="threads"
        />
        <div className="thread-info">
          <Link
            className="thread-title"
            to={`/community/forums/thread/${thread.id}`}
          >
            {thread.locked && <i className="fas fa-lock" />}
            {thread.pinned && <i className="fas fa-thumbtack" />}
            {thread.title}
          </Link>
          <NameWithAvatar
            small
            id={thread.author.id}
            avatar={thread.author.avatar}
            name={thread.author.name}
            groups={thread.author.groups}
            vanityUrl={thread.author.vanityUrl}
          />
          <div className="counts">
            <ViewsAndReplies
              viewCount={thread.viewCount || 0}
              replyCount={thread.replyCount || 0}
            />
          </div>
        </div>
        <div className="forum-column">
          <div className="column-title">Post Date</div>
          <div className="column-content">
            <div className="column-item center-item">
              <Time millisec={Date.now() - thread.postDate} />
              {` ago`}
            </div>
          </div>
        </div>
        <div className="forum-column three">
          <div className="column-title">Recent Replies</div>
          <div
            className={`column-content ${
              recentReplies.length === 0 ? "center-content" : ""
            }`}
          >
            {recentReplies.length === 0 && (
              <div className="column-item center-item">No replies yet</div>
            )}
            {recentReplies}
          </div>
        </div>
      </div>
    );
  }

  if (redirect) return <Navigate to={redirect} />;

  if (!loaded) return <NewLoading small />;

  const threads = boardInfo.threads.map(threadRowsMap);
  const pinnedThreads = boardInfo.pinnedThreads.map(threadRowsMap);

  return (
    <div className="board-wrapper">
      <CreateThreadModal
        boardId={boardId}
        show={showCreateModal}
        setShow={setShowCreateModal}
        threadTitle={newThreadTitle}
        setThreadTitle={setNewThreadTitle}
        threadContent={newThreadContent}
        setThreadContent={setNewThreadContent}
        setRedirect={setRedirect}
      />
      <div className="board-info">
        <div className="board-title-wrapper">
          <i className={`fas fa-${boardInfo.icon || "comments"} board-icon`} />
          <div className="board-title">{boardInfo.name}</div>
        </div>
        <div
          className="create-thread btn btn-theme"
          onClick={onCreateThreadClick}
          disabled={!user.perms.createThread}
        >
          <i className="fas fa-plus" />
          Create Thread
        </div>
      </div>
      {pinnedThreads.length > 0 && (
        <div className="threads pinned-threads span-panel">{pinnedThreads}</div>
      )}
      <PageNav inverted page={boardPage} onNav={onBoardPageNav} />
      <div className="threads span-panel">
        {threads.length > 0 && threads}
        {threads.length === 0 && "No threads yet"}
      </div>
      <PageNav inverted page={boardPage} onNav={onBoardPageNav} />
    </div>
  );
}

function CreateThreadModal(props) {
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("");
  const [pollExpiration, setPollExpiration] = useState("");
  
  const errorAlert = useErrorAlert();
  const header = "Create Thread";

  const content = (
    <div className="form">
      <div className="field-wrapper thread-title">
        <div className="label">Title</div>
        <input type="text" value={props.threadTitle} onChange={onTitleChange} />
      </div>
      <TextEditor
        value={props.threadContent}
        onChange={props.setThreadContent}
      />
      <div className="field-wrapper">
        <div className="label">Create Poll</div>
        <div className="switch-wrapper">
          <Switch
            value={includePoll}
            onChange={(e) => setIncludePoll(e.target.value)}
          />
        </div>
      </div>
      {includePoll && (
        <>
          <div className="field-wrapper">
            <div className="label">Question</div>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="What is your question?"
            />
          </div>
          <div className="field-wrapper">
            <div className="label">Options (comma-separated)</div>
            <input
              type="text"
              value={pollOptions}
              onChange={(e) => setPollOptions(e.target.value)}
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
          <div className="field-wrapper">
            <div className="label">Expires in</div>
            <input
              type="text"
              value={pollExpiration}
              onChange={(e) => setPollExpiration(e.target.value)}
              placeholder="Leave blank for no expiration"
            />
          </div>
        </>
      )}
    </div>
  );

  const footer = (
    <div className="control">
      <div className="post btn btn-theme" onClick={onPostThread}>
        Post
      </div>
      <div className="cancel btn btn-theme-sec" onClick={onCancel}>
        Cancel
      </div>
    </div>
  );

  function onTitleChange(e) {
    props.setThreadTitle(e.target.value);
  }

  function onCancel() {
    props.setShow(false);
    setIncludePoll(false);
    setPollQuestion("");
    setPollOptions("");
    setPollExpiration("");
  }

  function onPostThread() {
    const threadData = {
      board: props.boardId,
      title: props.threadTitle,
      content: props.threadContent,
    };
    
    // Add poll data if poll is included
    if (includePoll) {
      threadData.poll = {
        question: pollQuestion,
        options: pollOptions.split(/\s*,\s*/),
        expiration: pollExpiration || null,
      };
    }
    
    axios
      .post("/api/forums/thread", threadData)
      .then((res) => {
        props.setShow(false);
        props.setRedirect(`/community/forums/thread/${res.data}`);
        
        // Reset poll fields
        setIncludePoll(false);
        setPollQuestion("");
        setPollOptions("");
        setPollExpiration("");
      })
      .catch(errorAlert);
  }

  return (
    <Modal
      className="create-thread"
      show={props.show}
      onBgClick={onCancel}
      header={header}
      content={content}
      footer={footer}
    />
  );
}

function Switch(props) {
  return (
    <div
      className={`switch ${props.value ? "on" : ""}`}
      onClick={() =>
        !props.disabled && props.onChange({ target: { value: !props.value } })
      }
    >
      <div className="track" />
      <div className="thumb" />
      <input type="hidden" value={props.value} />
    </div>
  );
}
