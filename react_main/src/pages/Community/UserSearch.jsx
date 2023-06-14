import React, { useState, useEffect, useContext } from "react";
import axios from "axios";

import { UserContext, SiteInfoContext } from "../../Contexts";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/User";

import "../../css/userSearch.css";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { Time } from "../../components/Basic";

export default function UserSearch(props) {
  const [userList, setUserList] = useState([]);
  const [searchVal, setSearchVal] = useState("");

  const user = useContext(UserContext);

  useEffect(() => {
    document.title = "Users | UltiMafia";
  }, []);

  useEffect(() => {
    if (searchVal.length > 0) {
      axios
        .get(`/user/searchName?query=${searchVal}`)
        .then((res) => {
          setUserList(res.data);
        })
        .catch(useErrorAlert);
    } else {
      axios
        .get("/user/online")
        .then((res) => {
          setUserList(res.data);
        })
        .catch(useErrorAlert);
    }
  }, [searchVal]);

  const users = userList.map((user) => (
    <div className="user-cell">
      <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
      <StatusIcon status={user.status} />
    </div>
  ));

  return (
    <div className="user-search-page">
      <div className="span-panel main">
        <div className="form">
          <input
            type="text"
            placeholder="Username"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>
        <div className="users">{users}</div>
      </div>
      <div className="user-lists">
        <NewestUsers />
        {user.perms.viewFlagged && <FlaggedUsers />}
      </div>
    </div>
  );
}

function NewestUsers(props) {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    const filterArg = getPageNavFilterArg(_page, page, users, "joined");

    if (filterArg == null) return;

    axios
      .get(`/user/newest?${filterArg}`)
      .then((res) => {
        if (res.data.length > 0) {
          setUsers(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  const userRows = users.map((user) => (
    <div className="user-row" key={user.id}>
      <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
      <div className="joined">
        <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
      </div>
    </div>
  ));

  return (
    <div className="newest-users box-panel">
      <div className="heading">Newest Users</div>
      <div className="users-list">
        <PageNav page={page} onNav={onPageNav} inverted />
        {userRows}
        <PageNav page={page} onNav={onPageNav} inverted />
      </div>
    </div>
  );
}

function FlaggedUsers(props) {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    const filterArg = getPageNavFilterArg(_page, page, users, "joined");

    if (filterArg == null) return;

    axios
      .get(`/user/flagged?${filterArg}`)
      .then((res) => {
        if (res.data.length > 0) {
          setUsers(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  const userRows = users.map((user) => (
    <div className="user-row" key={user.id}>
      <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
      <div className="joined">
        <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
      </div>
    </div>
  ));

  return (
    <div className="flagged-users box-panel">
      <div className="heading">Flagged Users</div>
      <div className="users-list">
        <PageNav page={page} onNav={onPageNav} inverted />
        {userRows}
        <PageNav page={page} onNav={onPageNav} inverted />
      </div>
    </div>
  );
}
