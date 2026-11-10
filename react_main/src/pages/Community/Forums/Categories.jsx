import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { NameWithAvatar } from "../../User/UserWidgets";
import { Time } from "../../../components/Basic";
import { useErrorAlert } from "../../../components/Alerts";
import { ViewsAndReplies } from "./Forums";
import { ListSkeleton } from "../../../components/Skeletons";
import { UiSection, UiList, UiListItem, UiIcon } from "components/ui";
import { newestRepliesFirst } from "./recentActivity.mjs";

export default function Categories(props) {
  const [categoryInfo, setCategoryInfo] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Categories | UltiMafia";
    props.updateForumNavInfo({ action: "home" });

    axios
      .get("/api/forums/categories")
      .then((res) => {
        var categories = res.data.sort(sortItems);

        for (let category of categories)
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
            vanityUrl={thread.author.vanityUrl}
          />
          <div className="thread-counts">
            <ViewsAndReplies
              viewCount={thread.viewCount || 0}
              replyCount={thread.replyCount || 0}
            />
          </div>
        </div>
      ));

      const recentReplies = newestRepliesFirst(board.recentReplies).map((reply) => (
        <div className="column-item" key={reply.id} data-reply-id={reply.id}>
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
            vanityUrl={reply.author.vanityUrl}
          />
          <div className="reply-age">
            <Time millisec={Date.now() - reply.postDate} />
            {` ago`}
          </div>
        </div>
      ));

      return (
        <UiListItem className="forum-board-row" key={board.id}>
          <div className="forum-board-main">
            <UiIcon name="chat" />
            <div><Link className="forum-board-name" to={`/community/forums/board/${board.id}`}>{board.name}</Link>
              <p className="forum-board-description">{board.description}</p></div>
          </div>
          <div className="forum-latest">
            <span className="forum-metadata">{recentReplies.length ? "Latest reply" : "Newest thread"}</span>
            {recentReplies[0] || (newestThreads.length ? newestThreads : <span className="forum-metadata">No threads yet</span>)}
            {recentReplies.length > 0 && <details className="forum-recent-replies"><summary>More activity</summary>
              <h3>Newest thread</h3>{newestThreads.length ? newestThreads : <span className="forum-metadata">No threads yet</span>}
              {recentReplies.length > 1 && <><h3>Earlier replies</h3>{recentReplies.slice(1)}</>}
            </details>}
          </div>
        </UiListItem>
      );
    });

    return (
      <UiSection title={category.name} className="forum-category" key={category.id}>
        <UiList aria-label={`${category.name} boards`}>{boards}</UiList>
      </UiSection>
    );
  });

  if (!loaded) return <ListSkeleton />;

  return <><header className="forum-directory-heading"><h1>Forums</h1><p>Browse discussions by board.</p></header>{categories}</>;
}
