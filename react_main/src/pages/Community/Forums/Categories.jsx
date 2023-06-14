import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { NameWithAvatar } from "../../User/User";
import { Time } from "../../../components/Basic";
import LoadingPage from "../../Loading";
import { useErrorAlert } from "../../../components/Alerts";
import { ViewsAndReplies } from "./Forums";

export default function Categories(props) {
  const [categoryInfo, setCategoryInfo] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Categories | UltiMafia";
    props.updateForumNavInfo({ action: "home" });

    axios
      .get("/forums/categories")
      .then((res) => {
        const categories = res.data.sort(sortItems);

        for (const category of categories)
          category.boards = category.boards.sort(sortItems);

        setCategoryInfo(categories);
        setLoaded(true);

        props.updateForumNavInfo({
          type: "home",
        });
      })
      .catch(errorAlert);
  }, []);

  function sortItems(a, b) {
    return a.position - b.position;
  }

  const categories = categoryInfo.map((category) => {
    const boards = category.boards.map((board) => {
      const newestThreads = board.newestThreads.map((thread) => (
        <div className="column-item" key={thread.id}>
          <div className="thread-link-wrapper">
            <Link to={`/community/forums/thread/${thread.id}`}>
              {thread.title}
            </Link>
          </div>
          <NameWithAvatar
            small
            id={thread.author.id}
            name={thread.author.name}
            avatar={thread.author.avatar}
          />
          <div className="thread-counts">
            <ViewsAndReplies
              viewCount={thread.viewCount || 0}
              replyCount={thread.replyCount || 0}
            />
          </div>
        </div>
      ));

      const recentReplies = board.recentReplies.map((reply) => (
        <div className="column-item" key={reply.id}>
          <div className="thread-link-wrapper">
            <Link
              to={`/community/forums/thread/${reply.thread.id}?reply=${reply.id}`}
            >
              {reply.thread.title}
            </Link>
          </div>
          <NameWithAvatar
            small
            id={reply.author.id}
            name={reply.author.name}
            avatar={reply.author.avatar}
          />
          <div className="reply-age">
            <Time millisec={Date.now() - reply.postDate} />
            {` ago`}
          </div>
        </div>
      ));

      return (
        <div className="board" key={board.id}>
          <i className={`fas fa-${board.icon || "comments"} board-icon`} />
          <Link
            className="board-info"
            to={`/community/forums/board/${board.id}`}
          >
            <div className="board-name">{board.name}</div>
            <div className="board-desc">{board.description}</div>
          </Link>
          <div className="forum-column tall">
            <div className="column-title">Newest Thread</div>
            <div
              className={`column-content ${
                newestThreads.length == 0 ? "center-content" : ""
              }`}
            >
              {newestThreads.length == 0 && (
                <div className="column-item center-item">No threads yet</div>
              )}
              {newestThreads}
            </div>
          </div>
          <div className="forum-column tall three">
            <div className="column-title">Recent Replies</div>
            <div
              className={`column-content ${
                recentReplies.length == 0 ? "center-content" : ""
              }`}
            >
              {recentReplies.length == 0 && (
                <div className="column-item center-item">No replies yet</div>
              )}
              {recentReplies}
            </div>
          </div>
        </div>
      );
    });

    return (
      <div className="span-panel forum-category" key={category.id}>
        <div className="title">{category.name}</div>
        <div className="boards">{boards}</div>
      </div>
    );
  });

  if (!loaded) return <LoadingPage />;

  return categories;
}
