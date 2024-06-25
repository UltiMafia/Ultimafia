import React, { useReducer, useContext, useState, useRef, useLayoutEffect } from "react";
import { NavLink, Switch, Route, Redirect } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import Categories from "./Categories";
import Board from "./Board";
import Thread from "./Thread";
import { useErrorAlert } from "../../../components/Alerts";
import { UserContext } from "../../../Contexts";
import { Avatar } from "../../User/User";

import { Container, Box, Typography, IconButton, Paper, Link as MuiLink, List, ListItem } from "@mui/material";
import { useTheme } from "@mui/styles";

export default function Forums() {
  const [forumNavInfo, updateForumNavInfo] = useForumNavInfo();

  return (
    <Container>
      <ForumNav forumNavInfo={forumNavInfo} />
      <Switch>
        <Route
          exact
          path="/community/forums"
          render={() => <Categories updateForumNavInfo={updateForumNavInfo} />}
        />
        <Route
          exact
          path="/community/forums/board/:boardId"
          render={() => <Board updateForumNavInfo={updateForumNavInfo} />}
        />
        <Route
          exact
          path="/community/forums/thread/:threadId"
          render={() => <Thread updateForumNavInfo={updateForumNavInfo} />}
        />
        <Route render={() => <Redirect to="/community/forums" />} />
      </Switch>
    </Container>
  );
}

function ForumNav(props) {
  const forumNavInfo = props.forumNavInfo;

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Box display="flex" alignItems="center">
        <MuiLink component={NavLink} to="/community/forums" sx={{ display: "flex", alignItems: "center" }}>
          <i className="fas fa-home" />
          <Typography variant="body1" sx={{ ml: 1 }}>Forums</Typography>
        </MuiLink>
        {forumNavInfo.board && (
          <MuiLink component={NavLink} to={`/community/forums/board/${forumNavInfo.board.id}`} sx={{ display: "flex", alignItems: "center", ml: 2 }}>
            <i className="fas fa-chevron-right" />
            <Typography variant="body1" sx={{ ml: 1 }}>{forumNavInfo.board.name}</Typography>
          </MuiLink>
        )}
        {forumNavInfo.thread && (
          <MuiLink component={NavLink} to={`/community/forums/thread/${forumNavInfo.thread.id}`} sx={{ display: "flex", alignItems: "center", ml: 2 }}>
            <i className="fas fa-chevron-right" />
            <Typography variant="body1" sx={{ ml: 1 }}>{forumNavInfo.thread.title}</Typography>
          </MuiLink>
        )}
      </Box>
    </Paper>
  );
}

function useForumNavInfo() {
  return useReducer((info, action) => {
    let newInfo;

    switch (action.type) {
      case "board":
        newInfo = {
          board: {
            id: action.id,
            name: action.name,
          },
        };
        break;
      case "thread":
        newInfo = {
          board: {
            id: action.boardId,
            name: action.boardName,
          },
          thread: {
            id: action.threadId,
            title: action.threadTitle,
          },
        };
        break;
      case "home":
        newInfo = {};
        break;
      default:
        newInfo = info;
    }

    return newInfo || info;
  }, {});
}

export function VoteWidget(props) {
  const theme = useTheme();
  const item = props.item;
  const itemType = props.itemType;
  const itemHolder = props.itemHolder;
  const setItemHolder = props.setItemHolder;
  const itemKey = props.itemKey;

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [showVoteBox, setShowVoteBox] = useState(false);
  const [userVotes, setUserVotes] = useState([]);
  const widgetRef = useRef();
  const popupRef = useRef();

  function updateItemVoteCount(direction, newDirection) {
    let voteCount = item.voteCount;

    if (item.vote === 0) voteCount += direction;
    else if (item.vote === direction) voteCount -= direction;
    else voteCount += 2 * direction;

    return update(item, {
      vote: { $set: newDirection },
      voteCount: { $set: voteCount },
    });
  }

  function onVote(itemId, direction) {
    if (!user.perms.vote) return;

    axios
      .post("/forums/vote", { item: itemId, itemType, direction })
      .then((res) => {
        const newDirection = Number(res.data);
        const newItem = updateItemVoteCount(direction, newDirection);

        if (!itemHolder) {
          setItemHolder(newItem);
          return;
        }

        const items = itemKey ? itemHolder[itemKey] : itemHolder;
        const index = items.findIndex((it) => it.id === itemId);

        if (index !== -1) {
          const newItems = items.slice();
          newItems[index] = newItem;

          if (itemKey) {
            setItemHolder(update(itemHolder, { [itemKey]: { $set: newItems } }));
          } else {
            setItemHolder(newItems);
          }
        }
      })
      .catch(errorAlert);
  }

  function getVotes(itemId, direction) {
    if (!user.perms.viewVotes) return;

    axios.get(`/forums/vote/${itemId}/${direction}`).then((res) => {
      setUserVotes(res.data);
      setShowVoteBox(true);
    });
  }

  function hideVotes() {
    setShowVoteBox(false);
  }

  useLayoutEffect(() => {
    if (!showVoteBox || !widgetRef.current || !popupRef.current) return;

    const elmRect = widgetRef.current.getBoundingClientRect();
    const popRect = popupRef.current.getBoundingClientRect();

    popupRef.current.style.visibility = "visible";
    popupRef.current.style.top = `${elmRect.top - popRect.height / 2 + elmRect.height / 2 + window.scrollY}px`;
    popupRef.current.style.left = `${elmRect.left - popRect.width - 10}px`;
  });

  return (
    <Box ref={widgetRef} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <IconButton
        onMouseEnter={() => getVotes(item.id, 1)}
        onMouseLeave={hideVotes}
        onClick={() => onVote(item.id, 1)}
        className="fas fa-arrow-up"
        sx={{ fontSize: '16px', color: item.vote === 1 ? theme.palette.info.main : 'inherit' }}
      />
      <Typography variant="body2" sx={{ cursor: 'default' }}>{item.voteCount || 0}</Typography>
      <IconButton
        onMouseEnter={() => getVotes(item.id, -1)}
        onMouseLeave={hideVotes}
        onClick={() => onVote(item.id, -1)}
        className="fas fa-arrow-down"
        sx={{ fontSize: '16px', color: item.vote === -1 ? theme.palette.info.main : 'inherit' }}
      />
      {showVoteBox && userVotes.length > 0 && (
        <Paper ref={popupRef} className="vote-user-box" sx={{ position: 'absolute', visibility: 'hidden' }}>
          <List>
            {userVotes.map((e) => (
              <ListItem key={e.voter.id} sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  small
                  hasImage={e.voter.avatar}
                  id={e.voter.id}
                  name={e.voter.name}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>{e.voter.name}</Typography>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}

export function ViewsAndReplies(props) {
  const { viewCount, replyCount } = props;
  const viewsPlural = viewCount !== 1;
  const repliesPlural = replyCount !== 1;

  return `${viewCount} view${viewsPlural ? "s" : ""}, ${replyCount} repl${repliesPlural ? "ies" : "y"}`;
}
