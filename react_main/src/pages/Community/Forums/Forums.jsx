import React, {useReducer, useContext, useState, useRef, useLayoutEffect} from "react";
import { NavLink, Switch, Route, Redirect } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import Categories from "./Categories";
import Board from "./Board";
import Thread from "./Thread";
import { useErrorAlert } from "../../../components/Alerts";
import { UserContext } from "../../../Contexts";
import {Avatar} from "../../User/User";

import "../../../css/forums.css";

export default function Forums() {
  const [forumNavInfo, updateForumNavInfo] = useForumNavInfo();

  return (
    <div className="forums">
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
      .post("/forums/vote", {
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

  function getVotes(itemId, direction) {
		if (!user.perms.viewVotes) return;
		axios.get(`/forums/vote/${itemId}/${direction}`).then(res => {
			setUserVotes(res.data);
			setShowVoteBox(true);
		})
	}

	function hideVotes() {
		setShowVoteBox(false);
	}

	useLayoutEffect(() => {
		if (!showVoteBox || !widgetRef.current || !popupRef.current) return;

		console.log("eff");

		const elmRect = widgetRef.current.getBoundingClientRect();
		const popRect = popupRef.current.getBoundingClientRect();

		popupRef.current.style.visibility = 'visible';
		popupRef.current.style.top = (elmRect.top - (popRect.height / 2) + (elmRect.height / 2) + window.scrollY) + "px"
		popupRef.current.style.left = (elmRect.left - popRect.width - 10 )+ "px";

	});

  return (
    <div ref={widgetRef} className="vote-widget">
    <i onMouseEnter={() => {getVotes(item.id, 1)}}
       onMouseLeave={hideVotes}
        className={`fas fa-arrow-up ${item.vote === 1 && "sel"}`}
        onClick={() => onVote(item.id, 1)}
      />
      {item.voteCount || 0}
			<i onMouseEnter={() => {getVotes(item.id, -1)}}
			   onMouseLeave={hideVotes}
				className={`fas fa-arrow-down ${item.vote == -1 && "sel"}`}
        onClick={() => onVote(item.id, -1)}
      />
      {(showVoteBox && userVotes.length > 0) &&
				<div ref={popupRef} className={`vote-user-box popover-window`}>
					<div className={`popover-content`}>
						<ul style={{listStyle: "none"}}>
						{userVotes.map(e => (
							<li style={{display: "flex"}}>{<Avatar
								small
								hasImage={e.voter.avatar}
								id={e.voter.id}
								name={e.voter.name}
							/>} {e.voter.name}</li>
						))}
						</ul>
					</div>
				</div>}
    </div>
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
