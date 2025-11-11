import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";
import colorContrast from "color-contrast";

import { UserContext, SiteInfoContext } from "Contexts";
import {
  Avatar,
  Badge,
  MediaEmbed,
  LoveIcon,
  MarriedIcon,
  getLoveTitle,
  NameWithAvatar,
} from "./User";
import { HiddenUpload, TextEditor } from "components/Form";
import Setup from "components/Setup";
import { Time, filterProfanity } from "components/Basic";
import { useErrorAlert } from "components/Alerts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import { RatingThresholds, RequiredTotalForStats } from "Constants";
import { AchievementData } from "constants/Achievements";
import { capitalize } from "utils";
import Comments from "../Community/Comments";

import "css/user.css";
import { Modal } from "components/Modal";
import CustomMarkdown from "components/CustomMarkdown";
import ModerationSideDrawer from "components/ModerationSideDrawer";
import ReportDialog from "../../components/ReportDialog";
import { PieChart } from "./PieChart";
import { NewLoading } from "../Welcome/NewLoading";
import { GameRow } from "pages/Play/LobbyBrowser/GameRow";
import {
  violationMapById,
  communityViolations,
  gameViolations,
} from "constants/violations";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import system from "images/emotes/system.webp";

export const KUDOS_ICON = require(`images/kudos.png`);
export const KARMA_ICON = require(`images/karma.png`);
export const POINTS_ICON = require(`images/points.png`);
export const POINTS_NEGATIVE_ICON = require(`images/pointsNegative.png`);
export const ACHIEVEMENTS_ICON = require(`images/achievements.png`);
export const DAILY_ICON = require(`images/dailyChallenges.png`);

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
  const [points, setPoints] = useState(0);
  const [pointsNegative, setPointsNegative] = useState(0);
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
  const [moderationDrawerOpen, setModerationDrawerOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [currentUserLove, setCurrentUserLove] = useState({});
  const [modViolationsLoading, setModViolationsLoading] = useState(false);
  const [modViolations, setModViolations] = useState(null);
  const [banDialogState, setBanDialogState] = useState({
    open: false,
    action: null,
  });
  const [banDialogSubmitting, setBanDialogSubmitting] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const navigate = useNavigate();
  const errorAlert = useErrorAlert();
  const { userId } = useParams();
  const isPhoneDevice = useIsPhoneDevice();

  const isSelf = userId === user.id;
  const isBlocked = !isSelf && user.blockedUsers.indexOf(userId) !== -1;
  const canViewModViolations = Boolean(user.perms?.viewBans);
  const canIssueGameBan = Boolean(user.perms?.gameBan);
  const canIssueSiteBan = Boolean(user.perms?.siteBan);
  const communityViolationSelectOptions = communityViolations.map(
    (violation) => ({
      value: violation.id,
      label: violation.name,
    })
  );
  const gameViolationSelectOptions = gameViolations.map((violation) => ({
    value: violation.id,
    label: violation.name,
  }));

  const fetchModViolations = useCallback(() => {
    if (!userId || !canViewModViolations) {
      setModViolations(null);
      return;
    }

    setModViolationsLoading(true);
    axios
      .get(`/api/mod/violations?userId=${userId}`)
      .then((res) => {
        setModViolations(res.data);
      })
      .catch((e) => {
        if (e?.response?.status === 404) {
          setModViolations(null);
        } else {
          errorAlert(e);
        }
      })
      .finally(() => {
        setModViolationsLoading(false);
      });
  }, [userId, canViewModViolations, errorAlert]);

  const openBanDialog = (action) => {
    setBanDialogState({ open: true, action });
  };

  const closeBanDialog = () => {
    if (banDialogSubmitting) return;

    setBanDialogState({ open: false, action: null });
  };

  const handleBanSubmit = (payload) => {
    if (!banDialogState.action) return;

    setBanDialogSubmitting(true);
    axios
      .post(banDialogState.action.endpoint, {
        userId,
        ...payload,
      })
      .then(() => {
        siteInfo.showAlert(
          `${banDialogState.action.label} issued.`,
          "success"
        );
        setBanDialogState({ open: false, action: null });
        fetchModViolations();
      })
      .catch(errorAlert)
      .finally(() => {
        setBanDialogSubmitting(false);
      });
  };

  const modActionOptions = [];

  if (!isSelf && canIssueGameBan) {
    modActionOptions.push({
      id: "gameBan",
      label: "Game Ban",
      endpoint: "/api/mod/gameBan",
      violationOptions: gameViolationSelectOptions,
      description: "Temporarily ban this user from joining games.",
    });
  }

  if (!isSelf && canIssueSiteBan) {
    modActionOptions.push({
      id: "siteBan",
      label: "Site Ban",
      endpoint: "/api/mod/siteBan",
      violationOptions: communityViolationSelectOptions,
      description: "Prevent this user from accessing the site.",
    });
  }

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
        .get(`/api/user/${userId}/profile`)
        .then((res) => {
          setProfileLoaded(true);
          setName(res.data.name);
          setAvatar(res.data.avatar);
          setBanner(res.data.banner);
          setBio(filterProfanity(res.data.bio, user.settings, "\\*") || "");
          setPronouns(
            filterProfanity(res.data.pronouns, user.settings, "\\*") || ""
          );
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
          setPoints(res.data.points);
          setPointsNegative(res.data.pointsNegative);
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
          navigate("/play");
        });

      axios
        .get(`/api/user/${userId}/friends`)
        .then((res) => {
          setFriends(res.data);
        })
        .catch(errorAlert);
    }
  }, [userId]);

  useEffect(() => {
    if (!user.loaded) return;
    fetchModViolations();
  }, [user.loaded, fetchModViolations]);

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
        .post(`/api/user/${type}`, formData)
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
      .post("/api/user/friend", { user: userId })
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
        .post("/api/user/friend", { user: friendId })
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
        .delete(`/api/game/${gameId}/archive`)
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
      if (love === null || love === undefined) {
        var shouldCancel = window.confirm(
          "Are you sure you want to cancel your love?"
        );
        if (!shouldCancel) {
          return;
        }
      } else if (love.type === "Lover") {
        var shouldBreakup = window.confirm(
          "Are you sure you want to break up?"
        );
        if (!shouldBreakup) {
          return;
        }
      }
    } else {
      if (!window.confirm("Are you sure you wish to send a love request?")) {
        return;
      }
    }

    axios
      .post("/api/user/love", {
        user: userId,
        type: love.type,
        reqType: "Love",
      })
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
      var shouldDivorce = window.confirm("Are you sure you want to divorce?");
      if (!shouldDivorce) {
        return;
      }
    }

    axios
      .post("/api/user/love", {
        user: userId,
        type: love.type,
        reqType: "Marry",
      })
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
      .post("/api/user/block", { user: userId })
      .then(() => {
        user.blockUserToggle(userId);

        if (isBlocked) siteInfo.showAlert("User unblocked.", "success");
        else siteInfo.showAlert("User blocked.", "success");
      })
      .catch(errorAlert);
  }

  function onReportClick() {
    setReportDialogOpen(true);
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
      .post(`/api/user/bio`, { bio: bio })
      .then(() => {
        setEditingBio(false);
        setBio(filterProfanity(bio, user.settings, "\\*"));
      })
      .catch(errorAlert);
  }

  function onEditPronouns(e) {
    axios
      .post(`/api/user/pronouns`, { pronouns: pronouns })
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
      .post("/api/user/friend", { user: _userId })
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
      .post("/api/user/friend/reject", { user: _userId })
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
      .get(`/api/user/${userId}/friends?${filterArg}`)
      .then((res) => {
        if (res.data.length) {
          setFriends(res.data);
          setFriendsPage(page);
        }
      })
      .catch(errorAlert);
  }

  const panelStyle = {};
  const headingStyle = {};
  const bannerStyle = {};

  if (settings.backgroundColor) {
    panelStyle.backgroundColor = settings.backgroundColor;

    // ensure good color contrast for headings
    if (colorContrast(settings.backgroundColor, "#000") > 7) {
      headingStyle.color = "#000";
    } else {
      headingStyle.color = "#fff";
    }
  }

  if (banner) {
    bannerStyle.backgroundImage = `url(/uploads/${userId}_banner.webp?t=${siteInfo.cacheVal})`;
  }

  if (settings.bannerFormat === "stretch") {
    bannerStyle.backgroundSize = "100% 100%";
  } else {
    bannerStyle.backgroundSize = "contain";
  }

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

  const createdSetupRows = createdSetups.map((setup) => (
    <Setup setup={setup} key={setup.id} />
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

  if (user.loaded && !user.loggedIn && !userId) return <Navigate to="/play" />;

  if (user.loaded && user.loggedIn && !userId)
    return <Navigate to={`/user/${user.id}`} />;

  if (!profileLoaded || !user.loaded) return <NewLoading small />;

  const buttonsBox = (
    <Grid
      item
      xs={12}
      md={3}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack direction="row" className="options">
        {!isSelf && user.loggedIn && (
          <>
            <IconButton aria-label="friend user">
              <i
                className={`fas fa-user-plus ${isFriend ? "sel" : ""}`}
                onClick={onFriendUserClick}
              />
            </IconButton>
            <LoveIcon
              isLove={isLove}
              userId={user.id}
              isMarried={isMarried}
              love={love}
              currentUserLove={currentUserLove}
              onClick={onLoveUserClick}
            />
            <MarriedIcon
              isLove={isLove}
              saved={saved}
              userId={user.id}
              love={love}
              isMarried={isMarried}
              onClick={onMarryUserClick}
            />
            <IconButton aria-label="block user">
              <i
                className={`fas fa-ban ${isBlocked ? "sel" : ""}`}
                onClick={onBlockUserClick}
                title="Block user"
              />
            </IconButton>
            <Tooltip title="File Report">
              <IconButton size="large" onClick={onReportClick}>
                <img src={system} alt="Report" />
              </IconButton>
            </Tooltip>
            <ReportDialog
              open={reportDialogOpen}
              onClose={() => setReportDialogOpen(false)}
              prefilledArgs={{ user: userId }}
            />
          </>
        )}
      </Stack>
    </Grid>
  );

  const badges = groups
    .filter((g) => g.badge)
    .sort((a, b) => a.rank - b.rank)
    .map((g) => (
      <Badge
        icon={g.badge}
        color={g.badgeColor || "black"}
        name={g.name}
        key={g.name}
      />
    ));

  const avatarUpliftPx = !banner ? 0 : isPhoneDevice ? 38 : 58;
  const avatarPaddingPx = !banner
    ? isPhoneDevice
      ? 60
      : 100
    : isPhoneDevice
    ? 22
    : 50;

  const nameBox = (
    <Grid item xs={12} md={6} className="avi-name">
      <Box
        sx={{
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: `-${avatarUpliftPx}px`,
          }}
        >
          {!bustCache && (
            <Avatar
              mediumlarge={isPhoneDevice}
              large={!isPhoneDevice}
              id={userId}
              hasImage={avatar}
              bustCache={bustCache}
              name={name}
              edit={isSelf}
              onUpload={onFileUpload}
              border={`4px var(--scheme-color) solid`}
              isSquare={settings.avatarShape === "square"}
            />
          )}
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            justifyContent: "center",
            mt: `${avatarPaddingPx}px`,
            p: 1,
            width: "100%",
          }}
        >
          {badges}
          <Typography
            variant="h2"
            sx={{
              flexShrink: "2",
              fontWeight: "600",
            }}
          >
            {name}
          </Typography>
          {pronouns && (
            <Typography
              variant="caption"
              sx={{
                flexShrink: "1",
                filter: "opacity(.75)",
                minWidth: "40px",
                wordBreak: pronouns.includes("/") ? "normal" : "break-word",
              }}
            >
              ({pronouns})
            </Typography>
          )}
        </Stack>
      </Box>
    </Grid>
  );

  const inLoveBox = (
    <Grid item xs={12} md={3}>
      {love.id != null && (isLove || isMarried) && (
        <Link
          className={`name-with-avatar`}
          to={`/user/${love.id}`}
          target={""}
          style={{ height: "100%" }}
        >
          <Stack
            direction="row"
            sx={{
              width: "100%",
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack
              direction={isPhoneDevice ? "row" : "column"}
              spacing={isPhoneDevice ? 1 : 0}
              sx={{
                mb: 1,
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="italicRelation">
                {getLoveTitle(love.type)}
              </Typography>
              <Avatar hasImage={love.avatar} id={love.id} name={love.name} />
              <Typography>{love.name}</Typography>
            </Stack>
          </Stack>
        </Link>
      )}
    </Grid>
  );

  const aviGridItems = isPhoneDevice ? (
    <>
      {nameBox}
      {inLoveBox}
      {buttonsBox}
    </>
  ) : (
    <>
      {buttonsBox}
      {nameBox}
      {inLoveBox}
    </>
  );

  const bannerUpload = (
    <>
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
    </>
  );

  return (
    <>
      {stats && (
        <StatsModal
          stats={stats}
          show={showStatsModal}
          setShow={setShowStatsModal}
        />
      )}
      <ModBanDialog
        open={banDialogState.open}
        onClose={closeBanDialog}
        action={banDialogState.action}
        submitting={banDialogSubmitting}
        onSubmit={handleBanSubmit}
      />
      <ModerationSideDrawer
        open={moderationDrawerOpen}
        setOpen={setModerationDrawerOpen}
        prefilledArgs={{ userId }}
      />
      <Grid container rowSpacing={1} columnSpacing={1} className="profile">
        <Grid item xs={12}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "center",
            }}
          >
            {/* 900px max banner size + 16px padding on box-panel + 8px padding on content = 924px */}
            <div
              className="box-panel"
              style={{ ...panelStyle, width: "100%", maxWidth: "924px" }}
            >
              <div className="content" style={{ gap: "8px" }}>
                {banner && (
                  <div className="banner" style={bannerStyle}>
                    {bannerUpload}
                  </div>
                )}
                {!banner && (
                  <Box
                    className="banner"
                    sx={{ width: "100%", height: "24px !important" }}
                  >
                    {bannerUpload}
                  </Box>
                )}
                <Grid container>{aviGridItems}</Grid>
              </div>
            </div>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <Stack direction="column" spacing={1}>
            <div className="box-panel" style={panelStyle}>
              <div
                className={`bio${isSelf && !editingBio ? " edit" : ""}`}
                onClick={onBioClick}
              >
                {!editingBio && (
                  <div className="md-content">
                    <CustomMarkdown>{bio}</CustomMarkdown>
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
            {!isPhoneDevice && (
              <Box
                sx={{
                  mt: "16px !important",
                  px: 2,
                }}
              >
                <Comments fullWidth location={userId} />
              </Box>
            )}
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack direction="column" spacing={1}>
            {canViewModViolations && (
              <ModCollapsiblePanel
                panelStyle={panelStyle}
                title="Moderation: Violations"
                defaultOpen
              >
                <ModViolationsPanel
                  loading={modViolationsLoading}
                  data={modViolations}
                  violationMap={violationMapById}
                />
              </ModCollapsiblePanel>
            )}
            {modActionOptions.length > 0 && (
              <ModCollapsiblePanel
                panelStyle={panelStyle}
                title="Moderation: Quick Actions"
              >
                <ModQuickActionsPanel
                  actions={modActionOptions}
                  onActionSelect={openBanDialog}
                />
              </ModCollapsiblePanel>
            )}
            {mediaUrl && (
              <div className="box-panel" style={panelStyle}>
                <MediaEmbed
                  mediaUrl={mediaUrl}
                  autoplay={autoplay}
                ></MediaEmbed>
              </div>
            )}
            <div className="box-panel" style={panelStyle}>
              <div className="content">
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "stretch" }}
                >
                  {karmaInfo && (
                    <Stack direction="column" spacing={1}>
                      <KarmaVoteWidget
                        item={karmaInfo}
                        setItem={setKarmaInfo}
                        userId={userId}
                      />
                    </Stack>
                  )}
                  <Stack direction="column" spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <img
                        src={KUDOS_ICON}
                        style={{ marginRight: "12px" }}
                        title="Kudos"
                      />
                      {kudos}
                    </Stack>
                    {karmaInfo && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <img
                          src={KARMA_ICON}
                          style={{ marginRight: "12px" }}
                          title="Karma"
                        />
                        {karmaInfo.voteCount}
                      </Stack>
                    )}
                  </Stack>
                  <Stack direction="column" spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <img
                        src={POINTS_ICON}
                        style={{ marginRight: "12px" }}
                        title="Fortune"
                      />
                      {points}
                    </Stack>
                    {pointsNegative !== undefined && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <img
                          src={POINTS_NEGATIVE_ICON}
                          style={{ marginRight: "12px" }}
                          title="Misfortune"
                        />
                        {pointsNegative}
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              </div>
            </div>
            {totalGames >= RequiredTotalForStats &&
              !settings.hideStatistics && (
                <div className="box-panel ratings" style={panelStyle}>
                  <Typography variant="h3" sx={headingStyle}>
                    Mafia Ratings
                  </Typography>
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
              <Typography variant="h3" style={headingStyle}>
                Recent Games
              </Typography>
              <div className="content" style={{ padding: "0px" }}>
                {recentGamesRows}
                {recentGames.length === 0 && (
                  <Typography
                    sx={{
                      p: 1,
                    }}
                  >
                    No games
                  </Typography>
                )}
              </div>
            </div>
            {friendRequests.length > 0 && (
              <div className="box-panel" style={panelStyle}>
                <Typography variant="h3" style={headingStyle}>
                  Friend Requests
                </Typography>
                <div className="content">{friendRequestRows}</div>
              </div>
            )}
            <div className="box-panel" style={panelStyle}>
              <Typography variant="h3" style={headingStyle}>
                Friends
              </Typography>
              <div className="content">
                <PageNav inverted page={friendsPage} onNav={onFriendsPageNav} />
                {friendRows}
                {friends.length === 0 && (
                  <Typography
                    sx={{
                      p: 1,
                    }}
                  >
                    No friends yet
                  </Typography>
                )}
                <PageNav inverted page={friendsPage} onNav={onFriendsPageNav} />
              </div>
            </div>
            <div className="box-panel" style={panelStyle}>
              <Typography variant="h3" style={headingStyle}>
                Setups Created
              </Typography>
              <div className="content">
                {createdSetupRows}
                {createdSetups.length === 0 && "No setups"}
              </div>
            </div>
            <div className="box-panel achievements" style={panelStyle}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <img
                  src={ACHIEVEMENTS_ICON}
                  style={{
                    marginRight: "8px",
                    marginBottom: "8px",
                    maxWidth: "30px",
                    maxHeight: "30px",
                    backgroundColor: "rgba()",
                    borderRadius: "0px",
                  }}
                  title="achievements"
                />
                <Typography variant="h3" sx={headingStyle}>
                  Achievements
                </Typography>
              </div>
              <div className="content">
                {AchievementRows}
                {achievements.length === 0 && "No achievements yet"}
              </div>
            </div>
            {archivedGamesRows.length !== 0 && (
              <div className="box-panel archived-games" style={panelStyle}>
                <Typography variant="h3" sx={headingStyle}>
                  Archived Games{" "}
                  {showDelete && (
                    <i
                      className="fas fa-edit"
                      onClick={onEditArchivedGamesClick()}
                    />
                  )}
                </Typography>
                <div className="content" style={{ padding: "0px" }}>
                  <Stack direction="column" spacing={0}>
                    {archivedGamesRows}
                  </Stack>
                </div>
              </div>
            )}
          </Stack>
        </Grid>
        {isPhoneDevice && (
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Comments fullWidth location={userId} />
          </Grid>
        )}
      </Grid>
    </>
  );
}

const BAN_TYPE_LABELS = {
  site: "Site",
  game: "Game",
  chat: "Chat",
  forum: "Forum",
  playRanked: "Ranked",
  playCompetitive: "Competitive",
  ipFlag: "IP Flag",
};

function formatBanType(type) {
  return BAN_TYPE_LABELS[type] || type;
}

function formatDuration(ms) {
  if (!ms) return "Permanent";
  const seconds = Math.round(ms / 1000);

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks}w`;
  const months = Math.round(days / 30);
  if (months < 18) return `${months}mo`;
  const years = Math.round(days / 365);
  return `${years}y`;
}

function ModCollapsiblePanel({
  title,
  children,
  panelStyle,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const onToggle = (event) => {
    if (event) event.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <div className="box-panel" style={panelStyle}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ cursor: "pointer" }}
        onClick={onToggle}
      >
        <Typography variant="h3">{title}</Typography>
        <IconButton
          size="small"
          sx={{ marginLeft: "auto !important" }}
          onClick={onToggle}
        >
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </Collapse>
    </div>
  );
}

function ModViolationsPanel({ loading, data, violationMap }) {
  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} />
        <Typography variant="body2">Loading moderation data…</Typography>
      </Stack>
    );
  }

  if (!data) {
    return (
      <Typography variant="body2" sx={{ fontStyle: "italic" }}>
        No moderation data available.
      </Typography>
    );
  }

  const { target, linkedAccounts = [], permissions = {} } = data;
  const tickets = target?.tickets || [];
  const activeBans = target?.activeBans || [];

  const renderModReference = (mod) => {
    if (!mod) return null;

    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption">By</Typography>
        <NameWithAvatar
          id={mod.id}
          name={mod.name}
          avatar={mod.avatar}
          small
        />
      </Stack>
    );
  };

  const renderTicket = (ticket) => {
    const violationName =
      ticket.violationName ||
      violationMap[ticket.violationId]?.name ||
      ticket.violationId;

    return (
      <Stack
        key={ticket.id}
        spacing={0.5}
        sx={{
          backgroundColor: "var(--scheme-color-sec)",
          borderRadius: "4px",
          p: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {violationName}
          </Typography>
          <Chip
            size="small"
            label={`${formatBanType(ticket.banType)} ban`}
            variant="outlined"
          />
        </Stack>
        <Typography variant="caption">
          Issued{" "}
          <Time
            minSec
            millisec={Date.now() - ticket.createdAt}
            suffix=" ago"
          />
        </Typography>
        <Typography variant="caption">
          Length: {formatDuration(ticket.length)}
        </Typography>
        {ticket.expiresAt ? (
          <Typography variant="caption">
            Expires on {new Date(ticket.expiresAt).toLocaleString()}
          </Typography>
        ) : (
          <Typography variant="caption">Permanent</Typography>
        )}
        {ticket.notes && (
          <Typography variant="caption">Notes: {ticket.notes}</Typography>
        )}
        {renderModReference(ticket.mod)}
      </Stack>
    );
  };

  const renderBan = (ban) => {
    const violationName = ban.violationType
      ? violationMap[ban.violationType]?.name || ban.violationType
      : null;

    return (
      <Stack
        key={ban.id}
        spacing={0.5}
        sx={{
          backgroundColor: "var(--scheme-color-sec)",
          borderRadius: "4px",
          p: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatBanType(ban.type)} ban
          </Typography>
          <Chip
            size="small"
            color="warning"
            label={ban.expires === 0 ? "Permanent" : "Active"}
          />
        </Stack>
        {ban.expires ? (
          <Typography variant="caption">
            Expires on {new Date(ban.expires).toLocaleString()}
          </Typography>
        ) : (
          <Typography variant="caption">Permanent</Typography>
        )}
        {violationName && (
          <Typography variant="caption">Violation: {violationName}</Typography>
        )}
        {renderModReference(ban.mod)}
      </Stack>
    );
  };

  const hasModData = tickets.length > 0 || activeBans.length > 0;
  const linkedPermDenied =
    permissions &&
    permissions.canViewLinkedAccounts === false &&
    !linkedAccounts.length;

  return (
    <Stack spacing={1}>
      {activeBans.length > 0 && (
        <>
          <Typography variant="subtitle2">Active bans</Typography>
          <Stack spacing={1}>{activeBans.map(renderBan)}</Stack>
          <Divider />
        </>
      )}
      {tickets.length > 0 && (
        <>
          <Typography variant="subtitle2">Violation tickets</Typography>
          <Stack spacing={1}>{tickets.map(renderTicket)}</Stack>
        </>
      )}
      {!hasModData && (
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          No current bans or recorded violations.
        </Typography>
      )}
      <Divider />
      <Typography variant="subtitle2">Linked accounts</Typography>
      {linkedAccounts.length > 0 ? (
        <Stack spacing={1}>
          {linkedAccounts.map((account) => (
            <Stack
              key={account.userId}
              spacing={0.5}
              sx={{
                backgroundColor: "var(--scheme-color-sec)",
                borderRadius: "4px",
                p: 1,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <NameWithAvatar
                  id={account.userId}
                  name={account.name}
                  avatar={account.avatar}
                />
                {account.sharedIpCount > 0 && (
                  <Chip
                    size="small"
                    label={`Shared IPs: ${account.sharedIpCount}`}
                  />
                )}
              </Stack>
              {account.sharedIps && account.sharedIps.length > 0 && (
                <Typography variant="caption">
                  IPs: {account.sharedIps.join(", ")}
                </Typography>
              )}
              {account.activeBans?.length > 0 && (
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Active bans
                  </Typography>
                  {account.activeBans.map((ban) => renderBan(ban))}
                </Stack>
              )}
              {account.tickets?.length > 0 && (
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Violation tickets
                  </Typography>
                  {account.tickets.map((ticket) => renderTicket(ticket))}
                </Stack>
              )}
              {account.activeBans?.length === 0 &&
                account.tickets?.length === 0 && (
                  <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                    No violations recorded.
                  </Typography>
                )}
            </Stack>
          ))}
        </Stack>
      ) : linkedPermDenied ? (
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          Linked account details require the viewAlts permission.
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          No linked accounts with recorded violations.
        </Typography>
      )}
    </Stack>
  );
}

function ModQuickActionsPanel({ actions, onActionSelect }) {
  if (!actions.length) {
    return (
      <Typography variant="body2" sx={{ fontStyle: "italic" }}>
        No moderation actions available.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        Issue a ban and associate it with a violation ticket.
      </Typography>
      {actions.map((action) => (
        <Stack key={action.id} spacing={0.5}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {action.label}
          </Typography>
          {action.description && (
            <Typography variant="caption">{action.description}</Typography>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={() => onActionSelect(action)}
            sx={{ alignSelf: "flex-start" }}
          >
            Open {action.label} dialog
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}

function ModBanDialog({ open, onClose, action, submitting, onSubmit }) {
  const [length, setLength] = useState("");
  const [violationType, setViolationType] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && action) {
      setLength("");
      setNotes("");
      const defaultViolation = action.violationOptions?.[0]?.value || "";
      setViolationType(defaultViolation);
    }
  }, [open, action]);

  const violationOptions = action?.violationOptions || [];
  const disableSubmit = submitting || !length || !violationType;

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth>
      <DialogTitle>
        {action ? `Issue ${action.label}` : "Issue ban"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Length"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          placeholder="e.g. 3 days"
          disabled={submitting}
          autoFocus
        />
        <FormControl fullWidth disabled={submitting || !violationOptions.length}>
          <InputLabel id="violation-type-label">Violation Type</InputLabel>
          <Select
            labelId="violation-type-label"
            value={violationType}
            label="Violation Type"
            onChange={(e) => setViolationType(e.target.value)}
          >
            {violationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={2}
          disabled={submitting}
          helperText="This will be stored with the violation ticket (max 500 characters)."
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              length,
              violationType,
              violationNotes: notes.trim(),
            })
          }
          disabled={disableSubmit}
        >
          {submitting ? "Issuing…" : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
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
      .post("/api/user/karma", {
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
