import React, { useState, useEffect, useContext } from "react";
import { Redirect, useParams, Link } from "react-router-dom";
import axios from "axios";
import { useTheme } from "@mui/styles";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Paper,
  Modal,
  TextField,
  Divider,
} from "@mui/material";
import { useErrorAlert } from "../../../components/Alerts";
import { getPageNavFilterArg, PageNav } from "../../../components/Nav";
import { NameWithAvatar } from "../../User/User";
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
  const [loaded, setLoaded] = useState(false);
  const [redirect, setRedirect] = useState();

  const { boardId } = useParams();
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  useEffect(() => {
    document.title = "Board | UltiMafia";
  }, []);

  useEffect(() => {
    axios
      .get(`/forums/board/${boardId}`)
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
    var filterArg = getPageNavFilterArg(page, boardPage, boardInfo.threads, sortType);
    if (filterArg == null) return;

    axios
      .get(`/forums/board/${boardId}?sortType=${sortType}&${filterArg}`)
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
      <Box key={reply.id} display="flex" alignItems="center">
        <NameWithAvatar small id={reply.author.id} name={reply.author.name} avatar={reply.author.avatar} />
        <Link to={`/community/forums/thread/${thread.id}?reply=${reply.id}`} style={{ marginLeft: theme.spacing(1) }}>
          <Time millisec={Date.now() - reply.postDate} /> ago
        </Link>
      </Box>
    ));

    return (
      <Paper key={thread.id} style={{ padding: theme.spacing(2), marginBottom: theme.spacing(2) }}>
        <Box display="flex" alignItems="center" mb={2}>
          <VoteWidget item={thread} itemType="thread" itemHolder={boardInfo} setItemHolder={setBoardInfo} itemKey="threads" />
          <Box ml={2} flexGrow={1}>
            <Link to={`/community/forums/thread/${thread.id}`}>
            {thread.locked && <i className="fas fa-lock" />}
            {thread.pinned && <i className="fas fa-thumbtack" />}
              {thread.title}
            </Link>
            <NameWithAvatar small id={thread.author.id} avatar={thread.author.avatar} name={thread.author.name} groups={thread.author.groups} />
            <ViewsAndReplies viewCount={thread.viewCount || 0} replyCount={thread.replyCount || 0} />
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Post Date</Typography>
            <Typography>{<Time millisec={Date.now() - thread.postDate} />} ago</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Recent Replies</Typography>
            {recentReplies.length === 0 ? (
              <Typography>No replies yet</Typography>
            ) : (
              recentReplies
            )}
          </Grid>
        </Grid>
      </Paper>
    );
  }

  if (redirect) return <Redirect to={redirect} />;
  if (!loaded) return <NewLoading small />;

  const threads = boardInfo.threads.map(threadRowsMap);
  const pinnedThreads = boardInfo.pinnedThreads.map(threadRowsMap);

  return (
    <Container maxWidth="md" style={{ marginTop: theme.spacing(4) }}>
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center">
          <IconButton>
            <i className={`fas fa-${boardInfo.icon || "comments"}`} />
          </IconButton>
          <Typography variant="h5" style={{ marginLeft: theme.spacing(2) }}>
            {boardInfo.name}
          </Typography>
        </Box>
        <Button variant="contained" color="primary" onClick={onCreateThreadClick} disabled={!user.perms.createThread}>
          <i className="fas fa-plus" />
          Create Thread
        </Button>
      </Box>
      {pinnedThreads.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6">Pinned Threads</Typography>
          <Divider />
          {pinnedThreads}
        </Box>
      )}
      <PageNav inverted page={boardPage} onNav={onBoardPageNav} />
      <Box mb={4}>
        {threads.length > 0 ? threads : <Typography>No threads yet</Typography>}
      </Box>
      <PageNav inverted page={boardPage} onNav={onBoardPageNav} />
    </Container>
  );
}

function CreateThreadModal(props) {
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  const onTitleChange = (e) => props.setThreadTitle(e.target.value);
  const onCancel = () => props.setShow(false);
  const onPostThread = () => {
    axios
      .post("/forums/thread", {
        board: props.boardId,
        title: props.threadTitle,
        content: props.threadContent,
      })
      .then((res) => {
        props.setShow(false);
        props.setRedirect(`/community/forums/thread/${res.data}`);
      })
      .catch(errorAlert);
  };

  return (
    <Modal open={props.show} onClose={onCancel}>
      <Paper style={{ padding: theme.spacing(4), maxWidth: "500px", margin: "auto" }}>
        <Typography variant="h6">Create Thread</Typography>
        <Box mt={2}>
          <TextField
            label="Title"
            fullWidth
            value={props.threadTitle}
            onChange={onTitleChange}
          />
        </Box>
        <Box mt={2}>
          <TextEditor value={props.threadContent} onChange={props.setThreadContent} />
        </Box>
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button onClick={onCancel} style={{ marginRight: theme.spacing(2) }}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={onPostThread}>
            Post
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}