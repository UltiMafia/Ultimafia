import React, { useState, useEffect, useContext, useRef } from "react";
import UiAction from "../../../components/ui/UiAction";
import UiIcon from "../../../components/ui/UiIcon";
import { UiSection, UiList, UiListItem } from "components/ui";
import { newestRepliesFirst } from "./recentActivity.mjs";
import { useParams, Link } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import axios from "axios";

import { useErrorAlert } from "../../../components/Alerts";
import { getPageNavFilterArg, PageNav } from "../../../components/Nav";
import { NameWithAvatar } from "../../User/UserWidgets";
import { Modal } from "../../../components/Modal";
import { VoteWidget } from "components/VoteWidget";
import { ViewsAndReplies } from "./Forums";
import { TextEditor } from "../../../components/Form";
import { Time } from "../../../components/Basic";
import { UserContext } from "../../../Contexts";
import { ListSkeleton } from "../../../components/Skeletons";

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
    if (!user.perms?.createThread) return;
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
    const recentReplies = newestRepliesFirst(thread.recentReplies).map((reply) => (
      <div className="column-item" key={reply.id} data-reply-id={reply.id}>
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
      <UiListItem
        className={`forum-thread-row ${thread.deleted ? "deleted" : ""}`}
        key={thread.id}
      >
        <VoteWidget
          item={thread}
          itemType="thread"
          itemHolder={boardInfo}
          setItemHolder={setBoardInfo}
          itemKey="threads"
        />
        <div className="forum-thread-main">
          <Link
            className="thread-title"
            to={`/community/forums/thread/${thread.id}`}
          >
            {thread.locked && <UiIcon name="lock" size={16} />}
            {thread.pinned && <UiIcon name="pin" size={16} />}
            {thread.restricted && <UiIcon name="moderation" size={16} label="Restricted thread" />}
            {thread.title}
          </Link>
          <div className="forum-thread-byline"><NameWithAvatar
            small
            id={thread.author.id}
            avatar={thread.author.avatar}
            name={thread.author.name}
            groups={thread.author.groups}
            vanityUrl={thread.author.vanityUrl}
          /><span> · <Time millisec={Date.now() - thread.postDate} /> ago</span></div>
          <div className="counts">
            <ViewsAndReplies
              viewCount={thread.viewCount || 0}
              replyCount={thread.replyCount || 0}
            />
          </div>
        </div>
        <div className="forum-thread-activity">
          <span className="forum-metadata">Last reply</span>
          {recentReplies[0] || <span className="forum-metadata">No replies yet</span>}
          {recentReplies.length > 1 && <details className="forum-recent-replies"><summary>Earlier replies ({recentReplies.length - 1})</summary>
            {recentReplies.slice(1)}
          </details>}
        </div>
      </UiListItem>
    );
  }

  if (redirect) return <Navigate to={redirect} />;

  if (!loaded) return <ListSkeleton />;

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
      <UiSection title={boardInfo.name} headingLevel={1} actions={<UiAction variant="primary"
          onClick={onCreateThreadClick}
          disabled={!user.perms?.createThread}
        >
          <UiIcon name="add" size={18} />
          Create Thread
        </UiAction>}>
      <div className="forum-thread-columns" aria-hidden="true"><span>Thread</span><span>Latest activity</span></div>
      {pinnedThreads.length > 0 && (
        <UiSection title="Pinned"><UiList>{pinnedThreads}</UiList></UiSection>
      )}
      <UiList aria-label="Discussion threads">
        {threads.length > 0 && threads}
        {threads.length === 0 && <UiListItem>No threads yet</UiListItem>}
      </UiList>
      <PageNav inverted page={boardPage} onNav={onBoardPageNav} />
      </UiSection>
    </div>
  );
}

function CreateThreadModal(props) {
  const user = useContext(UserContext);
  const submissionRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("");
  const [pollExpiration, setPollExpiration] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [includePetition, setIncludePetition] = useState(false);
  const [petitionTitle, setPetitionTitle] = useState("");
  const [petitionBody, setPetitionBody] = useState("");

  const errorAlert = useErrorAlert();
  const header = "Create Thread";

  const content = (
    <div className="form">
      <div className="field-wrapper thread-title">
        <div className="label">Title</div>
        <input type="text" aria-label="Thread title" value={props.threadTitle} onChange={onTitleChange} disabled={submitting} />
      </div>
      <TextEditor
        value={props.threadContent}
        onChange={props.setThreadContent}
      />
      <div className="field-wrapper">
        <div className="label">Create Poll</div>
        <div className="switch-wrapper">
          <Switch
            label="Create poll" disabled={submitting}
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
              aria-label="Poll question"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="What is your question?"
            />
          </div>
          <div className="field-wrapper">
            <div className="label">Options (comma-separated)</div>
            <input
              type="text"
              aria-label="Poll options, comma-separated"
              value={pollOptions}
              onChange={(e) => setPollOptions(e.target.value)}
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
          <div className="field-wrapper">
            <div className="label">Expires in</div>
            <input
              type="text"
              aria-label="Poll expiration"
              value={pollExpiration}
              onChange={(e) => setPollExpiration(e.target.value)}
              placeholder="Leave blank for no expiration"
            />
          </div>
        </>
      )}
      <div className="field-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="checkbox"
          aria-label="People list"
          checked={restricted}
          onChange={(e) => setRestricted(e.target.checked)}
        />
        <div className="label" style={{ margin: 0 }}>People List</div>
      </div>
      <div className="field-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="checkbox"
          aria-label="Include petition"
          checked={includePetition}
          onChange={(e) => setIncludePetition(e.target.checked)}
        />
        <div className="label" style={{ margin: 0 }}>Petition</div>
      </div>
      {includePetition && (
        <>
          <div className="field-wrapper">
            <div className="label">Petition Title</div>
            <input
              type="text"
              aria-label="Petition title"
              value={petitionTitle}
              onChange={(e) => setPetitionTitle(e.target.value)}
              placeholder="What is your petition?"
              maxLength={200}
            />
          </div>
          <div className="field-wrapper">
            <div className="label">Petition Body</div>
            <textarea
              aria-label="Petition body"
              value={petitionBody}
              onChange={(e) => setPetitionBody(e.target.value)}
              placeholder="Describe what you are petitioning for..."
              maxLength={5000}
              rows={4}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>
        </>
      )}
    </div>
  );

  const footer = (
    <div className="thread-submit-actions">
      {submissionError && <p role="alert">{submissionError}</p>}
      <UiAction onClick={onCancel} disabled={submitting}>
        Cancel
      </UiAction>
      <UiAction variant="primary" busy={submitting} disabled={!props.threadTitle.trim() || !props.threadContent.trim() || !user.perms?.createThread} onClick={onPostThread}>
        Post thread
      </UiAction>
    </div>
  );

  function onTitleChange(e) {
    props.setThreadTitle(e.target.value);
  }

  function onCancel() {
    if (submissionRef.current) return;
    props.setShow(false);
    setIncludePoll(false);
    setPollQuestion("");
    setPollOptions("");
    setPollExpiration("");
    setRestricted(false);
    setIncludePetition(false);
    setPetitionTitle("");
    setPetitionBody("");
  }

  function onPostThread() {
    if (submissionRef.current || !user.perms?.createThread || !props.threadTitle.trim() || !props.threadContent.trim()) return;
    submissionRef.current = true;
    setSubmitting(true);
    setSubmissionError("");
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

    if (restricted) {
      threadData.restricted = true;
    }

    if (includePetition && petitionTitle.trim()) {
      threadData.petition = {
        title: petitionTitle.trim(),
        body: petitionBody,
      };
    }

    axios
      .post("/api/forums/thread", threadData)
      .then((res) => {
        props.setShow(false);
        props.setRedirect(`/community/forums/thread/${res.data}`);

        setIncludePoll(false);
        setPollQuestion("");
        setPollOptions("");
        setPollExpiration("");
        setRestricted(false);
        setIncludePetition(false);
        setPetitionTitle("");
        setPetitionBody("");
      })
      .catch(error => { setSubmissionError("Could not post the thread. Your draft has been kept."); errorAlert(error); })
      .finally(() => { submissionRef.current = false; setSubmitting(false); });
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
    <button type="button" role="switch" aria-label={props.label} aria-checked={!!props.value} disabled={props.disabled}
      className={`switch ${props.value ? "on" : ""}`}
      onClick={() =>
        !props.disabled && props.onChange({ target: { value: !props.value } })
      }
    >
      <div className="track" />
      <div className="thumb" />
    </button>
  );
}
