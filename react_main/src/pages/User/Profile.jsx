import React, { useState, useEffect, useContext, useRef } from "react";
import { Redirect, useParams, useHistory } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import update from "immutability-helper";

import { UserContext, SiteInfoContext } from "../../Contexts";
import {
  Avatar,
  Badges,
  MediaEmbed,
  LoveIcon,
  MarriedIcon,
  LoveType,
  NameWithAvatar,
} from "./User";
import { HiddenUpload, TextEditor } from "../../components/Form";
import Setup from "../../components/Setup";
import { Time, filterProfanity, basicRenderers } from "../../components/Basic";
import { useErrorAlert } from "../../components/Alerts";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { RatingThresholds, RequiredTotalForStats } from "../../Constants";
import { AchievementData } from "../../constants/Achievements";
import { capitalize } from "../../utils";
import Comments from "../Community/Comments";

import "../../css/user.css";
import { Modal } from "../../components/Modal";
import { PieChart } from "./PieChart";
import { NewLoading } from "../Welcome/NewLoading";
import { GameRow } from "../Play/LobbyBrowser/GameRow";
import { Box, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/styles";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";

export const KUDOS_ICON = `/images/kudos.png`;
export const KARMA_ICON = `/images/karma.png`;
export const ACHIEVEMENTS_ICON = `/images/achievements.png`;
export const DAILY_ICON = `/images/dailyChallenges.png`;

const DEFAULT_PRONOUNS_TEXT = "Click to edit your pronouns";

export default function Profile() {
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [name, setName] = useState();
  const [avatar, setAvatar] = useState();
  const [banner, setBanner] = useState();
  const [bio, setBio] = useState("");
  const [oldBio, setOldBio] = useState();
  const [editingBio, setEditingBio] = useState(false);
  const [pronouns, setPronouns] = useState("");
  const [oldPronouns, setOldPronouns] = useState();
  const [editingPronouns, setEditingPronouns] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isLove, setIsLove] = useState(false);
  const [isMarried, setIsMarried] = useState(false);
  const [kudos, setKudos] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [karmaInfo, setKarmaInfo] = useState({});
  const [settings, setSettings] = useState({});
  const [recentGames, setRecentGames] = useState([]);
  const [archivedGames, setArchivedGames] = useState([]);
  const [editingArchivedGames, setEditingArchivedGames] = useState(false);
  const [createdSetups, setCreatedSetups] = useState([]);
  const [bustCache, setBustCache] = useState(false);
  const [friendsPage, setFriendsPage] = useState(1);
  // const [maxFriendsPage, setMaxFriendsPage] = useState(1);
  const [friends, setFriends] = useState([]);
  const [love, setLove] = useState({});
  const [married, setMarried] = useState({});
  const [friendRequests, setFriendRequests] = useState([]);
  const [stats, setStats] = useState();
  const [groups, setGroups] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [autoplay, setAutoplay] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentUserLove, setCurrentUserLove] = useState({});

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { userId } = useParams();
  const isPhoneDevice = useIsPhoneDevice();

  const isSelf = userId === user.id;
  const isBlocked = !isSelf && user.blockedUsers.indexOf(userId) !== -1;
  const hasDefaultPronouns = pronouns === DEFAULT_PRONOUNS_TEXT;

  // userId is the id of the current profile
  // user.id is the id of the current user
  const showDelete = userId === user.id;

  const showDeleteArchivedGame = showDelete && editingArchivedGames;

  useEffect(() => {
    if (bustCache) setBustCache(false);
  }, [bustCache]);

  useEffect(() => {
    setEditingBio(false);
    setEditingPronouns(false);

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

          var pronouns;
          if (res.data.pronouns !== "") {
            pronouns = res.data.pronouns;
          } else {
            pronouns = DEFAULT_PRONOUNS_TEXT;
          }
          setPronouns(filterProfanity(pronouns, user.settings, "\\*") || "");
          setIsFriend(res.data.isFriend);
          setIsLove(res.data.isLove);
          setIsMarried(res.data.isMarried);
          setSettings(res.data.settings);
          setRecentGames(res.data.games);
          setArchivedGames(res.data.archivedGames);
          setCreatedSetups(res.data.setups);
          // setMaxFriendsPage(res.data.maxFriendsPage);
          setFriendRequests(res.data.friendRequests);
          setFriendsPage(1);
          setStats(res.data.stats);
          setKudos(res.data.kudos);
          setKarmaInfo(res.data.karmaInfo);
          setGroups(res.data.groups);
          setMediaUrl("");
          setAutoplay(false);
          setSaved(res.data.saved);
          setLove(res.data.love);
          setCurrentUserLove(res.data.currentLove);
          setAchievements(res.data.achievements);

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
            errorAlert("File too large, must be less than 1 MB.");
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

  function onUnarchiveGame(gameId, description) {
    return () => {
      var shouldDelete = window.confirm(
        `Are you sure you wish to unarchive ${description}? If the game is old enough to be expired then it will eventually be deleted.`
      );
      if (!shouldDelete) return;

      axios
        .delete(`/game/${gameId}/archive`)
        .then((res) => {
          siteInfo.showAlert(res.data, "success");
        })
        .catch(errorAlert);
    };
  }

  function onEditArchivedGamesClick() {
    return () => {
      setEditingArchivedGames(editingArchivedGames ? false : true);
    };
  }

  function onLoveUserClick() {
    if (isLove) {
      if ((love === null || love === undefined)) {
        var shouldCancel = window.confirm(
          "Are you sure you want to cancel your love?"
        );
        if (!shouldCancel) {
          return;
        }
      }
      else if (love.type === "Lover") {
        var shouldBreakup = window.confirm(
          "Are you sure you want to break up?"
        );
        if (!shouldBreakup) {
          return;
        }
      }
    }
    else {
      if (!window.confirm("Are you sure you wish to send a love request?")) {
        return;
      }
    }

    axios
      .post("/user/love", { user: userId, type: love.type, reqType: "Love" })
      .then((res) => {
        setIsLove(!isLove);
        siteInfo.showAlert(res.data.message, "success");
        if (res.data.love != undefined) {
          setLove(res.data.love);
        } else {
          if (res.data.requestType != undefined) {
            if (res.data.requestType === "Married") {
              setIsMarried(true);
              setIsLove(false);
            } else if (res.data.requestType === "Lover") {
              setIsLove(true);
              setIsMarried(false);
            }
          }
        }
      })
      .catch(errorAlert);
  }

  function onMarryUserClick() {
    if (isMarried && love.type === "Lover") {
      var shouldCancel = window.confirm(
        "Are you sure you want to stop proposing?"
      );
      if (!shouldCancel) {
        return;
      }
    }
    if (isMarried && love.type === "Married") {
      var shouldDivorce = window.confirm(
        "Are you sure you want to divorce?"
      );
      if (!shouldDivorce) {
        return;
      }
    }

    axios
      .post("/user/love", { user: userId, type: love.type, reqType: "Marry" })
      .then((res) => {
        setIsMarried(!isMarried);
        setIsLove(!isLove);
        siteInfo.showAlert(res.data.message, "success");
        if (res.data.love != undefined) {
          setLove(res.data.love);
        } else {
          if (res.data.requestType != undefined) {
            if (res.data.requestType === "Married") {
              setIsMarried(true);
              setIsLove(false);
            } else if (res.data.requestType === "Lover") {
              setIsLove(true);
              setIsMarried(false);
            }
          }
        }
      })
      .catch(errorAlert);
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

  function onPronounsClick() {
    setEditingPronouns(isSelf);
    setOldPronouns(pronouns);
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

  function onEditPronouns(e) {
    axios
      .post(`/user/pronouns`, { pronouns: pronouns })
      .then(() => {
        setEditingPronouns(false);
        setPronouns(filterProfanity(pronouns, user.settings, "\\*"));
      })
      .catch(errorAlert);
  }

  function onCancelEditBio(e) {
    e.stopPropagation();
    setEditingBio(false);
    setBio(oldBio);
  }

  function onCancelEditPronouns(e) {
    e.stopPropagation();
    setEditingPronouns(false);
    setPronouns(oldPronouns);
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
    bannerStyle.backgroundImage = `url(/uploads/${userId}_banner.webp?t=${siteInfo.cacheVal})`;

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
        odd={recentGames.indexOf(game) % 2 === 1}
        small
      />
    );
  });

  const archivedGamesRows = archivedGames.map((game) => {
    return (
      <div className="archived-game" key={game.id}>
        <Typography variant="body2">
          {filterProfanity(game.description, user.settings)}
        </Typography>
        {showDeleteArchivedGame && (
          <div className="btns-wrapper">
            <i
              className="fas fa-trash"
              onClick={onUnarchiveGame(game.id, game.description)}
            />
          </div>
        )}
        <GameRow game={game} type={game.status || "Finished"} small />
      </div>
    );
  });

  const AchievementRows = achievements
    .map((achID) => {
      for (let item of Object.entries(AchievementData.Mafia).filter(
        (achievementData) => achID == achievementData[1].ID
      )) {
        if (achID == item[1].ID) {
          return item[0];
        }
      }
    })
    .map((formatAch) => (
      <div className="Achievement" key={formatAch}>
        {formatAch}
      </div>
    ));

  const maxRolesCount = isPhoneDevice ? 6 : 8;
  const createdSetupRows = createdSetups.map((setup) => (
    <Setup setup={setup} key={setup.id} maxRolesCount={maxRolesCount} fixedWidth  />
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

  if (!profileLoaded || !user.loaded) return <NewLoading small />;

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
              <div className="left">
                <div className="score-info">
                  <div className="score-info-column">
                    <KarmaVoteWidget
                      item={karmaInfo}
                      setItem={setKarmaInfo}
                      userId={userId}
                    />
                  </div>
                  <div className="score-info-column">
                    <div className="score-info-row">
                      <img
                        src={KUDOS_ICON}
                        style={{ marginRight: "12px" }}
                        title="Kudos"
                      />
                      {kudos}
                    </div>
                    <div className="score-info-row">
                      <img
                        src={KARMA_ICON}
                        style={{ marginRight: "12px" }}
                        title="Karma"
                      />
                      {karmaInfo.voteCount}
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="name-badges-container">
                  <div style={{ marginTop: "10px" }}>
                    <Badges groups={groups} />
                  </div>
                  <div className="name">{name}</div>
                </div>
              </div>
              <div className="right">
                {love.id != null && (isLove || isMarried) && (
                  <div className="love">
                    <LoveType type={love.type}></LoveType>
                    <NameWithAvatar
                      id={love.id}
                      name={love.name}
                      avatar={love.avatar}
                    />
                  </div>
                )}
                {!isSelf && user.loggedIn && (
                  <div className="options">
                    <i
                      className={`fas fa-user-plus ${isFriend ? "sel" : ""}`}
                      onClick={onFriendUserClick}
                    />
                    <LoveIcon
                      isLove={isLove}
                      userId={user.id}
                      isMarried={isMarried}
                      love={love}
                      currentUserLove={currentUserLove}
                      onClick={onLoveUserClick}
                    ></LoveIcon>
                    <MarriedIcon
                      isLove={isLove}
                      saved={saved}
                      userId={user.id}
                      love={love}
                      isMarried={isMarried}
                      onClick={onMarryUserClick}
                    ></MarriedIcon>
                    <i
                      className={`fas fa-ban ${isBlocked ? "sel" : ""}`}
                      onClick={onBlockUserClick}
                      title="Block user"
                    />
                  </div>
                )}
              </div>
            </div>
            {(isSelf || !hasDefaultPronouns) && (
              <div
                className={`pronouns${
                  isSelf && !editingPronouns ? " edit" : ""
                }`}
                onClick={onPronounsClick}
              >
                {!editingPronouns && (
                  <div className="md-content">
                    <ReactMarkdown
                      renderers={basicRenderers()}
                      source={pronouns}
                    />
                  </div>
                )}
                {editingPronouns && (
                  <>
                    <TextEditor value={pronouns} onChange={setPronouns} />
                    <div className="buttons">
                      <div className="btn btn-theme" onClick={onEditPronouns}>
                        Submit
                      </div>
                      <div
                        className="btn btn-theme-sec"
                        onClick={onCancelEditPronouns}
                      >
                        Cancel
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div
              className={`bio${isSelf && !editingBio ? " edit" : ""}`}
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
          {totalGames >= RequiredTotalForStats && !settings.hideStatistics && (
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
          <div
            className="box-panel recent-games"
            style={{ ...panelStyle, maxWidth: "350px" }}
          >
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
          <div className="box-panel achievements" style={panelStyle}>
            <div style={{ display: "flex" }}>
              <img
                src={ACHIEVEMENTS_ICON}
                style={{
                  marginRight: "12px",
                  maxWidth: "30px",
                  maxHeight: "30px",
                }}
                title="achievements"
              />
              <div className="heading">Achievements</div>
            </div>
            <div className="content">
              {AchievementRows}
              {achievements.length === 0 && "No achievements yet"}
            </div>
          </div>
          {archivedGamesRows.length !== 0 && (
            <div
              className="box-panel archived-games"
              style={{ ...panelStyle, maxWidth: "350px" }}
            >
              <div className="heading">
                Archived Games{" "}
                {showDelete && (
                  <i
                    className="fas fa-edit"
                    onClick={onEditArchivedGamesClick()}
                  />
                )}
              </div>
              <div className="content">{archivedGamesRows}</div>
            </div>
          )}
        </div>
      </div>
      <Box sx={{ mt: 4 }}>
        <Comments location={userId} />
      </Box>
    </>
  );
}

export function KarmaVoteWidget(props) {
  const theme = useTheme();
  const item = props.item;
  const setItem = props.setItem;
  const userId = props.userId;

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const widgetRef = useRef();

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

  function onVote(direction) {
    if (!user.perms.vote) return;

    axios
      .post("/user/karma", {
        targetId: userId,
        direction,
      })
      .then((res) => {
        var newDirection = Number(res.data);
        var newItem = updateItemVoteCount(direction, newDirection);
        setItem(newItem);
      })
      .catch(errorAlert);
  }

  return (
    <div ref={widgetRef} className="vote-widget">
      <IconButton
        className={`fas fa-arrow-up`}
        style={{
          fontSize: "16px",
          ...(item.vote === 1 ? { color: theme.palette.info.main } : {}),
        }}
        onClick={() => onVote(1)}
      />
      <IconButton
        className={`fas fa-arrow-down`}
        style={{
          fontSize: "16px",
          ...(item.vote === -1 ? { color: theme.palette.info.main } : {}),
        }}
        onClick={() => onVote(-1)}
      />
    </div>
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
    // let totalGames = statsObj.totalGames;
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
