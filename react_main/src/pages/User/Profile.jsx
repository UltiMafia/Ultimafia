import React, { useState, useEffect, useContext } from "react";
import { Redirect, useParams, useHistory } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import { UserContext, SiteInfoContext } from "../../Contexts";
import { Avatar, Badges, MediaEmbed, NameWithAvatar } from "./User";
import { HiddenUpload, TextEditor } from "../../components/Form";
import LoadingPage from "../Loading";
import Setup from "../../components/Setup";
import { GameRow } from "../Play/Join";
import { Time, filterProfanity, basicRenderers } from "../../components/Basic";
import { useErrorAlert } from "../../components/Alerts";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { RatingThresholds, RequiredTotalForStats } from "../../Constants";
import { capitalize } from "../../utils";
import Comments from "../Community/Comments";

import "../../css/user.css";
import { Modal } from "../../components/Modal";
import { PieChart } from "./PieChart";

export default function Profile() {
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [name, setName] = useState();
  const [avatar, setAvatar] = useState();
  const [banner, setBanner] = useState();
  const [bio, setBio] = useState("");
  const [oldBio, setOldBio] = useState();
  const [editingBio, setEditingBio] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [settings, setSettings] = useState({});
  const [accounts, setAccounts] = useState({});
  const [recentGames, setRecentGames] = useState([]);
  const [createdSetups, setCreatedSetups] = useState([]);
  const [bustCache, setBustCache] = useState(false);
  const [friendsPage, setFriendsPage] = useState(1);
  const [maxFriendsPage, setMaxFriendsPage] = useState(1);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [stats, setStats] = useState();
  const [groups, setGroups] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [autoplay, setAutoplay] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { userId } = useParams();

  const isSelf = userId === user.id;
  const isBlocked = !isSelf && user.blockedUsers.indexOf(userId) !== -1;

  useEffect(() => {
    if (bustCache) setBustCache(false);
  }, [bustCache]);

  useEffect(() => {
    setEditingBio(false);

    if (userId) {
      setProfileLoaded(false);

      axios
        .get(`/user/${userId}/profile`)
        .then((res) => {
          setProfileLoaded(true);
          setName(res.data.name);
          setAvatar(res.data.avatar);
          setBanner(res.data.banner);
          setBio(filterProfanity(res.data.bio, user.settings, "\\*") || "");
          setIsFriend(res.data.isFriend);
          setSettings(res.data.settings);
          setAccounts(res.data.accounts || {});
          setRecentGames(res.data.games);
          setCreatedSetups(res.data.setups);
          setMaxFriendsPage(res.data.maxFriendsPage);
          setFriendRequests(res.data.friendRequests);
          setFriendsPage(1);
          setStats(res.data.stats);
          setGroups(res.data.groups);
          setMediaUrl("");
          setAutoplay(false);

          if (res.data.settings.youtube) {
            setMediaUrl(res.data.settings.youtube);
            setAutoplay(res.data.settings.autoplay);
          }
          document.title = `${res.data.name}'s Profile | UltiMafia`;
        })
        .catch((e) => {
          errorAlert(e);
          history.push("/play");
        });

      axios
        .get(`/user/${userId}/friends`)
        .then((res) => {
          setFriends(res.data);
        })
        .catch(errorAlert);
    }
  }, [userId]);

  function onEditBanner(files, type) {
    if (!user.itemsOwned.customProfile) {
      errorAlert(
        "You must purchase profile customization with coins from the Shop."
      );
      return false;
    }

    return true;
  }

  function onFileUpload(files, type) {
    if (files.length) {
      const formData = new FormData();
      formData.append("image", files[0]);

      for (let el of document.getElementsByClassName("hidden-upload"))
        el.value = "";

      axios
        .post(`/user/${type}`, formData)
        .then((res) => {
          switch (type) {
            case "avatar":
              setAvatar(true);
              siteInfo.clearCache();
              break;
            case "banner":
              setBanner(true);
              siteInfo.clearCache();
              break;
          }
        })
        .catch((e) => {
          if (e.response == null || e.response.status === 413)
            errorAlert("File too large, must be less than 2 MB.");
          else errorAlert(e);
        });
    }
  }

  function onFriendUserClick() {
    if (isFriend) {
      var shouldUnfriend = window.confirm(
        "Are you sure you wish to unfriend or cancel your friend request?"
      );
      if (!shouldUnfriend) return;
    }

    axios
      .post("/user/friend", { user: userId })
      .then((res) => {
        setIsFriend(!isFriend);
        siteInfo.showAlert(res.data, "success");
      })
      .catch(errorAlert);
  }

  function onDeleteFriend(friendId) {
    return () => {
      var shouldUnfriend = window.confirm(
        "Are you sure you wish to delete this friend?"
      );
      if (!shouldUnfriend) return;

      axios
        .post("/user/friend", { user: friendId })
        .then((res) => {
          setIsFriend(false);
          siteInfo.showAlert(res.data, "success");
        })
        .catch(errorAlert);
    };
  }

  function onBlockUserClick() {
    if (!isBlocked) {
      var shouldBlock = window.confirm(
        "Are you sure you wish to block this user?"
      );
      if (!shouldBlock) return;
    }

    axios
      .post("/user/block", { user: userId })
      .then(() => {
        user.blockUserToggle(userId);

        if (isBlocked) siteInfo.showAlert("User unblocked.", "success");
        else siteInfo.showAlert("User blocked.", "success");
      })
      .catch(errorAlert);
  }

  function onBioClick() {
    setEditingBio(isSelf);
    setOldBio(bio);
  }

  function onEditBio(e) {
    axios
      .post(`/user/bio`, { bio: bio })
      .then(() => {
        setEditingBio(false);
        setBio(filterProfanity(bio, user.settings, "\\*"));
      })
      .catch(errorAlert);
  }

  function onCancelEditBio(e) {
    e.stopPropagation();
    setEditingBio(false);
    setBio(oldBio);
  }

  function onAcceptFriend(_userId) {
    axios
      .post("/user/friend", { user: _userId })
      .then((res) => {
        var newFriendRequests = friendRequests
          .slice()
          .filter((u) => u.id !== _userId);
        setFriendRequests(newFriendRequests);
        siteInfo.showAlert(res.data, "success");
      })
      .catch(errorAlert);
  }

  function onRejectFriend(_userId) {
    axios
      .post("/user/friend/reject", { user: _userId })
      .then((res) => {
        var newFriendRequests = friendRequests
          .slice()
          .filter((u) => u.id !== _userId);
        setFriendRequests(newFriendRequests);
        siteInfo.showAlert(res.data, "success");
      })
      .catch(errorAlert);
  }

  function onFriendsPageNav(page) {
    var filterArg = getPageNavFilterArg(
      page,
      friendsPage,
      friends,
      "lastActive"
    );

    if (filterArg == null) return;

    axios
      .get(`/user/${userId}/friends?${filterArg}`)
      .then((res) => {
        if (res.data.length) {
          setFriends(res.data);
          setFriendsPage(page);
        }
      })
      .catch(errorAlert);
  }

  const panelStyle = {};
  const bannerStyle = {};

  if (settings.backgroundColor)
    panelStyle.backgroundColor = settings.backgroundColor;

  if (banner)
    bannerStyle.backgroundImage = `url(/uploads/${userId}_banner.jpg?t=${siteInfo.cacheVal})`;

  if (settings.bannerFormat === "stretch")
    bannerStyle.backgroundSize = "100% 100%";

  var ratings = [];
  var totalGames = 0;

  if (stats && stats["Mafia"] && stats["Mafia"].all) {
    var mafiaStats = stats["Mafia"].all;
    totalGames = mafiaStats?.wins?.total + mafiaStats?.abandons?.total || 0;

    ratings = Object.keys(RatingThresholds).map((statName) => {
      var stat = mafiaStats[statName];

      if (RatingThresholds[statName] == null) return <></>;
      else if (totalGames < RequiredTotalForStats) stat = "-";
      else if (statName === "wins")
        stat = `${Math.round((stat.count / totalGames) * 100)}%`;
      else if (statName === "abandons")
        stat = `${Math.round((mafiaStats.abandons.total / totalGames) * 100)}%`;
      else if (statName === "losses")
        stat = `${Math.round(
          ((totalGames - mafiaStats.wins.count - mafiaStats.abandons.total) /
            totalGames) *
            100
        )}%`;

      return (
        <div className="rating" key={statName}>
          <div className="name">{capitalize(statName)}</div>
          <div className="score">{stat}</div>
        </div>
      );
    });
  }

  const recentGamesRows = recentGames.map((game) => {
    return (
      <GameRow
        game={game}
        type={game.status || "Finished"}
        key={game.id}
        small
      />
    );
  });

  const createdSetupRows = createdSetups.map((setup) => (
    <Setup setup={setup} key={setup.id} maxRolesCount={5} />
  ));

  const friendRequestRows = friendRequests.map((user) => (
    <div className="friend-request" key={user.id}>
      <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
      <div className="btns">
        <i className="fas fa-check" onClick={() => onAcceptFriend(user.id)} />
        <i className="fas fa-times" onClick={() => onRejectFriend(user.id)} />
      </div>
    </div>
  ));

  // userId is the id of the current profile
  // user.id is the id of the current user
  const showDelete = userId === user.id;

  const friendRows = friends.map((friend) => (
    <div className="friend" key={friend.id}>
      <div className="friend-avatar">
        <NameWithAvatar
          id={friend.id}
          name={friend.name}
          avatar={friend.avatar}
        />
        {showDelete && (
          <div className="btns-wrapper">
            <i className="fas fa-trash" onClick={onDeleteFriend(friend.id)} />
          </div>
        )}
      </div>
      <div className="last-active">
        <Time minSec millisec={Date.now() - friend.lastActive} suffix=" ago" />
      </div>
    </div>
  ));

  if (user.loaded && !user.loggedIn && !userId) return <Redirect to="/play" />;

  if (user.loaded && user.loggedIn && !userId)
    return <Redirect to={`/user/${user.id}`} />;

  if (!profileLoaded || !user.loaded) return <LoadingPage />;

  return (
    <>
      <div className="profile">
        {stats && (
          <StatsModal
            stats={stats}
            show={showStatsModal}
            setShow={setShowStatsModal}
          />
        )}
        <div className="main-panel" style={panelStyle}>
          <div className="banner" style={bannerStyle}>
            {isSelf && (
              <HiddenUpload
                className="edit"
                name="banner"
                onClick={onEditBanner}
                onFileUpload={onFileUpload}
              >
                <i className="far fa-file-image" />
              </HiddenUpload>
            )}
          </div>
          <div className="user-info">
            <div className="avi-name-row">
              <div className="avi-name">
                {!bustCache && (
                  <Avatar
                    large
                    id={userId}
                    hasImage={avatar}
                    bustCache={bustCache}
                    name={name}
                    edit={isSelf}
                    onUpload={onFileUpload}
                  />
                )}
                <div className="name">{name}</div>
              </div>
            </div>
            <Badges groups={groups} />
            {!isSelf && user.loggedIn && (
              <div className="options">
                <i
                  className={`fas fa-user-plus ${isFriend ? "sel" : ""}`}
                  onClick={onFriendUserClick}
                />
                <i
                  className={`fas fa-ban ${isBlocked ? "sel" : ""}`}
                  onClick={onBlockUserClick}
                  title="Block user"
                />
              </div>
            )}
            <div className="accounts">
              {accounts.discord && settings.showDiscord && (
                <div className="account-badge">
                  <div className="icon discord-icon" />
                  <div className="username-wrapper">
                    <div className="username">{accounts.discord}</div>
                  </div>
                </div>
              )}
              {accounts.twitch && settings.showTwitch && (
                <div className="account-badge">
                  <div className="icon twitch-icon" />
                  <div className="username-wrapper">
                    <div className="username">{accounts.twitch}</div>
                  </div>
                </div>
              )}
              {accounts.steam && settings.showSteam && (
                <div className="account-badge">
                  <div className="icon steam-icon" />
                  <div className="username-wrapper">
                    <div className="username">{accounts.steam}</div>
                  </div>
                </div>
              )}
            </div>
            <div
              className={`bio ${isSelf && !editingBio ? "edit" : ""}`}
              onClick={onBioClick}
            >
              {!editingBio && (
                <div className="md-content">
                  <ReactMarkdown renderers={basicRenderers()} source={bio} />
                </div>
              )}
              {editingBio && (
                <>
                  <TextEditor value={bio} onChange={setBio} />
                  <div className="buttons">
                    <div className="btn btn-theme" onClick={onEditBio}>
                      Submit
                    </div>
                    <div
                      className="btn btn-theme-sec"
                      onClick={onCancelEditBio}
                    >
                      Cancel
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="side column">
          {mediaUrl && (
            <MediaEmbed mediaUrl={mediaUrl} autoplay={autoplay}></MediaEmbed>
          )}
          {totalGames >= RequiredTotalForStats && (
            <div className="box-panel ratings" style={panelStyle}>
              <div className="heading">Mafia Ratings</div>
              <div className="content">
                {ratings}
                <div
                  className="expand-icon-wrapper"
                  onClick={() => setShowStatsModal(true)}
                >
                  <i className="fas fa-expand-arrows-alt" />
                </div>
              </div>
              <div
                className="content"
                style={{ padding: "0", justifyContent: "center" }}
              >
                <PieChart
                  wins={mafiaStats.wins.count}
                  losses={mafiaStats.wins.total - mafiaStats.wins.count}
                  abandons={mafiaStats.abandons.total}
                />
              </div>
            </div>
          )}
          <div className="box-panel recent-games" style={panelStyle}>
            <div className="heading">Recent Games</div>
            <div className="content">
              {recentGamesRows}
              {recentGames.length === 0 && "No games"}
            </div>
          </div>
          {friendRequests.length > 0 && (
            <div className="box-panel friend-requests" style={panelStyle}>
              <div className="heading">Friend Requests</div>
              <div className="content">{friendRequestRows}</div>
            </div>
          )}
          <div className="box-panel friends" style={panelStyle}>
            <div className="heading">Friends</div>
            <div className="content">
              <PageNav inverted page={friendsPage} onNav={onFriendsPageNav} />
              {friendRows}
              {friends.length === 0 && "No friends yet"}
              <PageNav inverted page={friendsPage} onNav={onFriendsPageNav} />
            </div>
          </div>
          <div className="box-panel created-setups" style={panelStyle}>
            <div className="heading">Setups Created</div>
            <div className="content">
              {createdSetupRows}
              {createdSetups.length === 0 && "No setups"}
            </div>
          </div>
        </div>
      </div>
      <Comments location={userId} />
    </>
  );
}

function StatsModal(props) {
  const [statsFilter, setStatsFilter] = useState("all");
  const [statsFilterQuery, setStatsFilterQuery] = useState("");

  const statsFilters = ["all", "bySetup", "byRole", "byAlignment"];
  const statsFilterNames = {
    all: "All",
    bySetup: "Setup",
    byRole: "Role",
    byAlignment: "Alignment",
  };
  const statsKeyNames = {
    totalGames: "Total Games",
    wins: "Wins",
    abandons: "Abandons",
  };

  var statsRowNames;
  var stats = props.stats["Mafia"][statsFilter];

  if (stats == null) {
    stats = [];
    statsRowNames = [];
  }
  if (statsFilter === "all") {
    stats = [stats];
    statsRowNames = ["All"];
  } else {
    statsRowNames = Object.keys(stats).filter((key) =>
      key.toLowerCase().includes(statsFilterQuery)
    );
    stats = statsRowNames.map((key) => stats[key]);
    statsRowNames = statsRowNames.map(
      (key) => `${statsFilterNames[statsFilter]}: ${key}`
    );
  }

  const filterDropdownOptions = statsFilters.map((filter) => (
    <option key={filter} value={filter}>
      {statsFilterNames[filter]}
    </option>
  ));

  const statsRows = stats.map((statsObj, i) => {
    let totalGames = statsObj.totalGames;
    let totalGamesUnabandoned =
      statsObj.wins?.total + statsObj?.abandons?.total;
    let statsList = Object.keys(statsObj).map((statKey) => {
      let statData = statsObj[statKey];

      switch (statKey) {
        case "totalGames":
          statData = <div className="stat-data">{statData}</div>;
          break;
        case "wins":
        case "abandons":
          statData = (
            <div className="stat-data">
              {statData.count}/{totalGamesUnabandoned}
            </div>
          );
          break;
        case "reads":
        case "survival":
          statData = <div></div>;
          break;
      }

      return (
        <div className="stat" key={statKey}>
          <div className="stat-name">{statsKeyNames[statKey]}</div>
          {statData}
        </div>
      );
    });

    return (
      <div className="stats-row" key={statsRowNames[i]}>
        <div className="stats-row-name">{statsRowNames[i]}</div>
        <div className="stats-list">{statsList}</div>
      </div>
    );
  });

  const header = "Ranked Stats";

  const content = (
    <div className="stats-wrapper">
      <div className="filter">
        <select
          value={statsFilter}
          onChange={(e) => setStatsFilter(e.target.value)}
        >
          {filterDropdownOptions}
        </select>
        <input
          type="text"
          placeholder="Query"
          onChange={(e) => setStatsFilterQuery(e.target.value.toLowerCase())}
        />
      </div>
      <div className="stats">{statsRows}</div>
    </div>
  );

  const footer = (
    <div className="control">
      <div className="post btn btn-theme" onClick={() => props.setShow(false)}>
        Close
      </div>
    </div>
  );

  function onCancel() {
    props.setShow(false);
  }

  return (
    <Modal
      className="stats-modal"
      show={props.show}
      onBgClick={onCancel}
      header={header}
      content={content}
      footer={footer}
    />
  );
}
