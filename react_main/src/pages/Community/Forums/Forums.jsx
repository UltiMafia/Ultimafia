import React, {
  useReducer,
  useState,
} from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";

import Categories from "./Categories";
import Board from "./Board";
import Thread from "./Thread";
import SearchResults from "./SearchResults";
import ForumSearch from "./ForumSearch";
import ModerationSideDrawer from "components/ModerationSideDrawer";

import "css/forums.css";
import { Button } from "@mui/material";

export default function Forums() {
  const [forumNavInfo, updateForumNavInfo] = useForumNavInfo();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [moderationDrawerOpen, setModerationDrawerOpen] = useState(false);

  return (
    <div className="forums">
      <ModerationSideDrawer
        open={moderationDrawerOpen}
        setOpen={setModerationDrawerOpen}
        allowedCategories={["Forum Management"]}
      />
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
            sx={{
              color: "var(--scheme-color-text)",
              fontFamily: "var(--primaryFont)",
              fontWeight: 700,
            }}
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

export function ViewsAndReplies(props) {
  const viewCount = props.viewCount;
  const replyCount = props.replyCount;

  const viewsPlural = viewCount !== 1;
  const repliesPlural = replyCount !== 1;

  return `${viewCount} view${viewsPlural ? "s" : ""}, ${replyCount} repl${
    repliesPlural ? "ies" : "y"
  }`;
}
