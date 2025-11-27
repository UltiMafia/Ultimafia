import React, {
  useReducer,
  useContext,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import Categories from "./Categories";
import Board from "./Board";
import Thread from "./Thread";
import SearchResults from "./SearchResults";
import ForumSearch from "./ForumSearch";
import { useErrorAlert } from "../../../components/Alerts";
import { UserContext } from "../../../Contexts";
import { NameWithAvatar } from "../../User/User";

import "css/forums.css";
import {
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { usePopoverOpen } from "hooks/usePopoverOpen";

export default function Forums() {
  const [forumNavInfo, updateForumNavInfo] = useForumNavInfo();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  return (
    <div className="forums">
      <ForumNav
        forumNavInfo={forumNavInfo}
        onSearchClick={() => setSearchDialogOpen(true)}
      />
      <Routes>
        <Route
          path="/"
          element={<Categories updateForumNavInfo={updateForumNavInfo} />}
        />
        <Route
          path="board/:boardId"
          element={<Board updateForumNavInfo={updateForumNavInfo} />}
        />
        <Route
          path="thread/:threadId"
          element={<Thread updateForumNavInfo={updateForumNavInfo} />}
        />
        <Route
          path="search"
          element={<SearchResults updateForumNavInfo={updateForumNavInfo} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ForumSearch
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </div>
  );
}

function ForumNav(props) {
  const forumNavInfo = props.forumNavInfo;

  return (
    <div className="span-panel">
      <div className="forum-nav">
        <div className="path">
          <NavLink to="/community/forums">
            <i className="fas fa-home home" />
            Forums
          </NavLink>
          {forumNavInfo.board && (
            <NavLink to={`/community/forums/board/${forumNavInfo.board.id}`}>
              <i className="fas fa-chevron-right separator" />
              {forumNavInfo.board.name}
            </NavLink>
          )}
          {forumNavInfo.thread && (
            <NavLink to={`/community/forums/thread/${forumNavInfo.thread.id}`}>
              <i className="fas fa-chevron-right separator" />
              {forumNavInfo.thread.title}
            </NavLink>
          )}
        </div>
        <div className="forum-nav-actions" style={{ marginLeft: "auto" }}>
          <Button
            onClick={props.onSearchClick}
            startIcon="🔎"
            variant="text"
            size="small"
            sx={{ color: "text.secondary" }}
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}

function useForumNavInfo() {
  return useReducer((info, action) => {
    var newInfo;

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
  const [userVotes, setUserVotes] = useState([]);

  const upvoters = userVotes.slice().filter((vote) => vote.direction === 1);
  const downvoters = userVotes.slice().filter((vote) => vote.direction === -1);

  const { popoverOpen, openByClick, anchorEl, handleClick, closePopover } =
    usePopoverOpen();

  function updateItemVoteCount(direction, newDirection) {
    var voteCount = item.voteCount;

    if (item.vote === 0) voteCount += direction;
    else if (item.vote === direction) voteCount += -1 * direction;
    else voteCount += 2 * direction;

    return update(item, {
      vote: {
        $set: newDirection,
      },
      voteCount: {
        $set: voteCount,
      },
    });
  }

  function onVote(itemId, direction) {
    if (!user.perms.vote) return;

    axios
      .post("/api/forums/vote", {
        item: itemId,
        itemType,
        direction,
      })
      .then((res) => {
        var newDirection = Number(res.data);
        var newItem = updateItemVoteCount(direction, newDirection);
        var items;

        if (itemHolder == null) {
          setItemHolder(newItem);
          return;
        }

        if (itemKey) items = itemHolder[itemKey];
        else items = itemHolder;

        for (let i in items) {
          if (items[i].id === itemId) {
            var newItems = items.slice();
            newItems[i] = newItem;

            if (itemKey) {
              setItemHolder(
                update(itemHolder, {
                  [itemKey]: {
                    $set: newItems,
                  },
                })
              );
            } else setItemHolder(newItems);
            break;
          }
        }
      })
      .catch(errorAlert);
  }

  function getVotes(e, itemId) {
    if (!user.perms.viewVotes) return;
    handleClick(e);
    axios.get(`/api/forums/vote/${itemId}`).then((res) => {
      setUserVotes(res.data);
    });
  }

  return (
    <Stack direction="column">
      <IconButton
        className={`fas fa-arrow-up`}
        sx={{
          fontSize: "1em",
          ...(item.vote === 1 ? { color: theme.palette.info.main } : {}),
        }}
        onClick={() => onVote(item.id, 1)}
      />
      <IconButton
        onClick={(e) => getVotes(e, item.id)}
        sx={{
          position: "relative",
          fontSize: "1em",
          minWidth: "2em",
          minHeight: "2em",
        }}
      >
        <Typography
          sx={{
            position: "absolute",
            lineHeight: "1",
          }}
        >
          {item.voteCount || 0}
        </Typography>
      </IconButton>
      <IconButton
        className={`fas fa-arrow-down`}
        sx={{
          fontSize: "1em",
          ...(item.vote === -1 ? { color: theme.palette.info.main } : {}),
        }}
        onClick={() => onVote(item.id, -1)}
      />
      <Popover
        open={popoverOpen}
        sx={{ pointerEvents: openByClick ? "auto" : "none" }}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        onClose={closePopover}
        disableScrollLock
        disableRestoreFocus
      >
        <Stack
          direction="column"
          spacing={1}
          sx={{
            p: 1,
          }}
        >
          <i className="fas fa-arrow-up" style={{ alignSelf: "center" }} />
          {upvoters.map((e) => (
            <NameWithAvatar
              small
              id={e.voter.id}
              name={e.voter.name}
              vanityUrl={e.voter.vanityUrl}
              avatar={e.voter.avatar}
            />
          ))}
          {upvoters.length === 0 && (
            <Typography sx={{ alignSelf: "center" }}>None</Typography>
          )}
          <Divider orientation="horizontal" flexItem />
          {downvoters.map((e) => (
            <NameWithAvatar
              small
              id={e.voter.id}
              name={e.voter.name}
              vanityUrl={e.voter.vanityUrl}
              avatar={e.voter.avatar}
            />
          ))}
          {downvoters.length === 0 && (
            <Typography sx={{ alignSelf: "center" }}>None</Typography>
          )}
          <i className="fas fa-arrow-down" style={{ alignSelf: "center" }} />
        </Stack>
      </Popover>
    </Stack>
  );
}

export function ViewsAndReplies(props) {
  const viewCount = props.viewCount;
  const replyCount = props.replyCount;

  const viewsPlural = viewCount !== 1;
  const repliesPlural = replyCount !== 1;

  return `${viewCount} view${viewsPlural ? "s" : ""}, ${replyCount} repl${
    repliesPlural ? "ies" : "y"
  }`;
}
