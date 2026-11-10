import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/UserWidgets";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { Time } from "../../components/Basic";
import { UiField, UiAction, UiSection, UiPending } from "components/ui";
import "css/directories.css";
import { LatestRequest } from "../../lib/latestRequest";

export default function UserSearch(props) {
  const [userList, setUserList] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const [onlineCount, setOnlineCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const requests = useRef(new LatestRequest());
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Players | UltiMafia";
  }, []);

  useEffect(() => {
    const owner = requests.current;
    const request = owner.begin();
    setLoading(true);
    setFailed(false);
    if (searchVal.length > 0) {
      axios
        .get(`/api/user/searchName?query=${encodeURIComponent(searchVal)}`, { signal: request.signal })
        .then((res) => {
          if (!request.isCurrent()) return;
           setUserList(res.data);
           setLoading(false);
        })
        .catch(error => { if (request.isCurrent()) { setLoading(false); setFailed(true); errorAlert(error); } });
    } else {
      axios
        .get("/api/user/online", { signal: request.signal })
        .then((res) => {
          if (!request.isCurrent()) return;
          setUserList(res.data);
           setOnlineCount(res.data.length);
           setLoading(false);
        })
        .catch(error => { if (request.isCurrent()) { setLoading(false); setFailed(true); errorAlert(error); } });
    }
    return () => owner.invalidate();
  }, [searchVal, errorAlert, retry]);

  const users = userList.map((user) => (
    <li key={user.id} className="player-directory-row">
          <NameWithAvatar
            id={user.id}
            name={user.name}
            avatar={user.avatar}
            vanityUrl={user.vanityUrl}
          />
          <span className="player-directory-status"><StatusIcon status={user.status} />{user.status || "offline"}</span>
    </li>
  ));

  return (
    <>
    <header className="page-heading"><h1>Players</h1></header>
     <div className="player-directory-layout">
       <UiSection title={searchVal ? "Search results" : "Online players"}>
           <p className="directory-summary" role="status">
            {searchVal ? (loading ? "Searching players…" : `${userList.length} players found`) : onlineCount == null
              ? "Loading online users…"
              : `${onlineCount} user${onlineCount === 1 ? "" : "s"} online`}
           </p>
           <UiField
            fullWidth
            label="Search players"
            variant="outlined"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
           {loading && <UiPending label="Loading players" />}
           {failed && <div role="alert">Could not load players. <UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>}
           <ul className="player-directory-list" aria-label={searchVal ? "Matching players" : "Online players"} aria-busy={loading}>
             {users}
           </ul>
           {!loading && !failed && !users.length && <p role="status">{searchVal ? "No players found. Try another name." : "No players online."}</p>}
           {searchVal && <UiAction onClick={() => setSearchVal("")}>Show online players</UiAction>}
       </UiSection>
       <NewestUsers />
     </div>
    </>
  );
}

function NewestUsers(props) {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const requests = useRef(new LatestRequest());

  const errorAlert = useErrorAlert();

  useEffect(() => {
    onPageNav(1);
    const owner = requests.current;
    return () => owner.invalidate();
  }, []);

  function onPageNav(_page) {
    var filterArg = getPageNavFilterArg(
      _page,
      page,
      users,
      "joined",
      "lastActive"
    );

    if (filterArg == null) return;
    const request = requests.current.begin();

    axios
      .get(`/api/user/newest?${filterArg}`, { signal: request.signal })
      .then((res) => {
        if (!request.isCurrent()) return;
        setLoaded(true);
        if (res.data.length > 0) {
          setUsers(res.data);
          setPage(_page);
        }
      })
      .catch(error => {
        if (!request.isCurrent()) return;
        setLoaded(true);
        errorAlert(error);
      });
  }

  const userRows = users.map((user) => (
    <li key={user.id} className="player-directory-row player-directory-row--new">
        <NameWithAvatar
          id={user.id}
          name={user.name}
          avatar={user.avatar}
          vanityUrl={user.vanityUrl}
        />
        <span className="directory-summary">
          Joined {" "}
          <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
        </span>
    </li>
  ));

  return (
    <UiSection title="Newest players" className="newest-users">
        {!users.length && <p>{loaded ? "No players to show." : "Loading…"}</p>}
        <ul className="player-directory-list" aria-label="Newest players">{userRows}</ul>
        {users.length > 0 && <PageNav page={page} onNav={onPageNav} inverted />}
    </UiSection>
  );
}
