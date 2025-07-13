import React, { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";

import { Link, Route, Switch, Redirect } from "react-router-dom";
import update from "immutability-helper";

import Profile, { KUDOS_ICON, KARMA_ICON, ACHIEVEMENTS_ICON } from "./Profile";
import Settings from "./Settings";
import Shop from "./Shop";
import { UserContext, SiteInfoContext, GameContext } from "../../Contexts";
import { HiddenUpload } from "../../components/Form";

import "../../css/user.css";
import { youtubeRegex } from "../../components/Basic";
import { useTheme } from "@mui/styles";
import { Link as MuiLink, Popover } from "@mui/material";
import { Box, Card, AppBar, Toolbar } from "@mui/material";
import { PieChart } from "./PieChart";
import { usePopoverOpen } from "../../hooks/usePopoverOpen";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";

export function YouTubeEmbed(props) {
  const embedId = props.embedId;
  var autoplay = "";
  if (props.autoplay) {
    autoplay = 1;
  } else {
    autoplay = 0;
  }
  if (embedId !== null && embedId !== "") {
    return (
      <div id="profile-video" className="video-responsive">
        <iframe
          src={`https://www.youtube.com/embed/${embedId}?autoplay=${autoplay}&mute=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media;"
          allowFullScreen
        ></iframe>
      </div>
    );
  } else {
    return null;
  }
}
export function MediaEmbed(props) {
  const mediaUrl = props.mediaUrl;
  const autoplay = !!props.autoplay;
  const loop = !!props.loop;
  const mediaRef = useRef();

  const mediaOptions = JSON.parse(
    window.localStorage.getItem("mediaOptions") || "{}"
  );
  const volume = mediaOptions.volume || 1;
  const muted = mediaOptions.muted || false;
  let embedId;

  const getMediaType = (mediaUrl) => {
    if (!mediaUrl) {
      return null;
    }
    const ytMatches = mediaUrl.match(youtubeRegex) ?? "";
    if (ytMatches && ytMatches.length >= 7) {
      embedId = ytMatches[7];
      return "youtube";
    }
    const extension = mediaUrl.split(".").slice("-1")[0];
    switch (extension) {
      case "webm":
      case "mp4":
        return "video";
      case "mp3":
      case "ogg":
        return "audio";
      default:
        return null;
    }
  };
  const mediaType = props.mediaType || getMediaType(mediaUrl);

  const trackVolume = (e) => {
    mediaOptions.volume = e.target.volume;
    mediaOptions.muted = e.target.muted;
    window.localStorage.setItem("mediaOptions", JSON.stringify(mediaOptions));
  };

  useEffect(() => {
    if (mediaRef && mediaRef.current) {
      mediaRef.current.volume = volume;
      mediaRef.current.muted = muted;
      mediaRef.current.addEventListener("volumechange", trackVolume);
    }
    return () => {
      if (mediaRef && mediaRef.current) {
        mediaRef.current.removeEventListener("volumechange", trackVolume);
      }
    };
  }, [mediaRef]);

  switch (mediaType) {
    case "audio":
      return (
        <audio
          ref={mediaRef}
          controls
          src={mediaUrl}
          autoPlay={autoplay}
          loop={loop}
        ></audio>
      );
    case "video":
      return (
        <div id="profile-video" className="video-responsive-generic">
          <video
            ref={mediaRef}
            className="video-responsive-content"
            controls
            src={mediaUrl}
            autoPlay={autoplay}
            loop={loop}
          ></video>
        </div>
      );
    case "youtube":
      return <YouTubeEmbed embedId={embedId} autoplay={autoplay} />;
    default:
      return null;
  }
}
export default function User(props) {
  const theme = useTheme();
  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();

  const links = [
    {
      text: "Profile",
      path: user.id ? `/user/${user.id}` : "/user",
      exact: true,
      hide: !user.loggedIn,
    },
    {
      text: "Settings",
      path: "/user/settings",
      hide: !user.loggedIn,
    },
    {
      text: "Shop",
      path: "/user/shop",
      hide: !user.loggedIn,
    },
  ];
  if (user.loaded && !user.loggedIn) return <Redirect to="/" />;

  const outerStyle = isPhoneDevice
    ? { padding: theme.spacing(0) }
    : { padding: theme.spacing(3) };
  const cardStyle = isPhoneDevice
      ? { padding: theme.spacing(1), textAlign: "justify" }
      : { padding: theme.spacing(3), textAlign: "justify" };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {links.map((link, index) => (
            <MuiLink
              key={index}
              href={link.path}
              underline="none"
              color="inherit"
              variant="button"
              sx={{ margin: theme.spacing(1) }}
            >
              {link.text}
            </MuiLink>
          ))}
        </Toolbar>
      </AppBar>
      <Box maxWidth="1080px" sx={outerStyle}>
        <Card
          variant="outlined"
          sx={cardStyle}
        >
          <Switch>
            <Route exact path="/user" render={() => <Profile />} />
            <Route exact path="/user/settings" render={() => <Settings />} />
            <Route exact path="/user/shop" render={() => <Shop />} />
            <Route exact path="/user/:userId" render={() => <Profile />} />
            <Route render={() => <Redirect to="/user" />} />
          </Switch>
        </Card>
      </Box>
    </>
  );
}

export function Avatar(props) {
  const small = props.small;
  const large = props.large;
  const id = props.id;
  const name = props.name;
  const hasImage = props.hasImage;
  const imageUrl = props.imageUrl;
  const edit = props.edit;
  const onUpload = props.onUpload;
  const active = props.active;
  const dead = props.dead;
  const avatarId = props.avatarId;
  const deckProfile = props.deckProfile;
  const absoluteLeftAvatarPx = props.absoluteLeftAvatarPx;
  const isSquare = props.isSquare || false;

  const santaDir = "/images/holiday/santahat.png";

  const siteInfo = useContext(SiteInfoContext);
  const style = {};
  const colors = [
    "#fff59d",
    "#ef9a9a",
    "#9fa8da",
    "#ce93d8",
    "#a5d6a7",
    "#f48fb1",
    "#ffcc80",
    "#90deea",
    "#80cbc4",
  ]; //yellow, red, blue, purple, green, pink, orange, cyan, teal
  var size;

  if (small) size = "small";
  else if (large) size = "large";
  else size = "";

  if (absoluteLeftAvatarPx) {
    style.position = "absolute";
    style.left = absoluteLeftAvatarPx;

    if (!small) {
      style.transform = "translateY(12px)";
    }
  }

  if (hasImage && !imageUrl && id && avatarId) {
    if (id === avatarId) {
      if (!deckProfile) {
        style.backgroundImage = `url(/uploads/${id}_avatar.webp?t=${siteInfo.cacheVal})`;
      } else {
        style.backgroundImage = `url(/uploads/decks/${avatarId}.webp?t=${siteInfo.cacheVal})`;
      }
    }
  } else if (hasImage && !imageUrl && id) {
    style.backgroundImage = `url(/uploads/${id}_avatar.webp?t=${siteInfo.cacheVal})`;
  } else if (hasImage && imageUrl) {
    style.backgroundImage = `url(${imageUrl})`;
  } else if (name) {
    var rand = 0;

    for (let i = 0; i < name.length; i++) rand ^= name.charCodeAt(i);

    rand ^= name.charCodeAt(1);
    rand ^= rand << 13;
    rand ^= rand >> 7;
    rand ^= rand << 17;
    rand = Math.abs(rand) / Math.pow(2, 31);

    style.backgroundColor = colors[Math.floor(rand * colors.length)];
  }
  if (typeof hasImage == "string") {
    if (hasImage.includes("decks")) {
      style.backgroundImage = `url(/uploads${hasImage}?t=${siteInfo.cacheVal})`;
      style.backgroundColor = "#00000000";
    }
  }

  {
    /*SANTA CHANGES: In December, uncomment the below lines*/
  }
  {
    /*var santaWidth;
  var santaHorizAdjust;
  var santaVertAdjust;

  if (large) {
    santaWidth = "100px";
    santaHorizAdjust = -25;
    santaVertAdjust = -40;
  } else if (small) {
    santaWidth = "20px;";
    santaHorizAdjust = -5;
    santaVertAdjust = -8;
  } else {
    santaWidth = "40px";
    santaHorizAdjust = -12;
    santaVertAdjust = -15;
  }
var santaAdjust = `translate(${santaHorizAdjust}px, ${santaVertAdjust}px)`;*/
  }
  {
    /*SANTA CHANGES*/
  }

  return (
    <div
      className={`avatar ${size} ${dead ? "dead" : ""} ${
        active ? "active" : ""
      }`}
      style={{
        ...style,
        display: "inline-block",
        borderRadius: isSquare ? "0px" : undefined,
      }}
    >
      {edit && (
        <HiddenUpload className="edit" name="avatar" onFileUpload={onUpload}>
          <i className="far fa-file-image" />
        </HiddenUpload>
      )}

      {/*SANTA CHANGES: In December, uncomment the below lines*/}
      {/*<div>
        <img
          className="santa"
          width={santaWidth}
          style={{ position: "absolute", transform: santaAdjust }}
          src={santaDir}
        ></img>
      </div>*/}
      {/*SANTA CHANGES*/}
    </div>
  );
}

export function NameWithAvatar(props) {
  const id = props.id;
  const name = props.name || "[deleted]";
  const avatar = props.avatar;
  const noLink = props.name ? props.noLink : true;
  const color = props.color;
  const newTab = props.newTab;
  const small = props.small;
  const active = props.active;
  const groups = props.groups;
  const dead = props.dead;
  const avatarId = props.avatarId;
  const deckProfile = props.deckProfile;
  const includeMiniprofile = props.includeMiniprofile;
  const absoluteLeftAvatarPx = props.absoluteLeftAvatarPx;

  const game = useContext(GameContext);
  const [userProfile, setUserProfile] = useState(null);
  const [isClicked, setIsClicked] = useState(false);

  const {
    popoverOpen: canOpenPopover,
    popoverClasses,
    anchorEl,
    handleClick: handlePopoverClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  const popoverOpen = includeMiniprofile && canOpenPopover;

  useEffect(() => {
    if (includeMiniprofile && id) {
      axios.get(`/api/user/${id}/profile`).then((res) => {
        res.data.props = props;
        setUserProfile(res.data);
      });
    }
  }, []);

  var contents = (
    <>
      <Avatar
        hasImage={avatar}
        id={id}
        avatarId={avatarId}
        name={name}
        small={small}
        dead={dead}
        active={active}
        deckProfile={deckProfile}
        absoluteLeftAvatarPx={absoluteLeftAvatarPx}
      />
      <div
        className={`user-name ${props.dead ? "dead" : color}`}
        style={{ ...(color ? { color } : {}), display: "inline" }}
      >
        {name}
      </div>
      {groups && <Badges groups={groups} small={small} />}
    </>
  );

  // noLink should take precedence over includeMiniprofile
  if (noLink) {
    return (
      <div
        className={`name-with-avatar no-link`}
        target={newTab ? "_blank" : ""}
      >
        {contents}
      </div>
    );
  } else if (includeMiniprofile) {
    const handlePlayerClick = (e) => {
      if (props.onClick) return props.onClick();

      if (!props.name || !includeMiniprofile) return;

      handlePopoverClick(e);

      setIsClicked(popoverOpen);
    };

    const handleMiniprofileClose = (e) => {
      setIsClicked(false);
      closePopover();
    };

    return (
      <>
        <div
          className={`name-with-avatar no-link${
            isClicked ? " name-with-avatar-clicked" : ""
          }`}
          onClick={handlePlayerClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {contents}
        </div>
        <div>
          <Popover
            open={props.showPopover !== false && popoverOpen}
            sx={popoverClasses}
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "center",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "center",
              horizontal: -24,
            }}
            onClose={handleMiniprofileClose}
            disableScrollLock
          >
            {userProfile && (
              <>
                <Miniprofile
                  user={userProfile}
                  game={game}
                  key={userProfile.id}
                />
              </>
            )}
          </Popover>
        </div>
      </>
    );
  } else {
    return (
      <Link
        className={`name-with-avatar`}
        to={`/user/${id}`}
        target={newTab ? "_blank" : ""}
      >
        {contents}
      </Link>
    );
  }
}

export function Miniprofile(props) {
  const user = props.user;
  const game = props.game;
  const inheritedProps = user.props;

  const id = user.id;
  const name = user.name || "[deleted]";
  const pronouns = user.pronouns || "";
  const avatar = user.avatar;
  const color = inheritedProps.color;
  const avatarId = inheritedProps.avatarId;
  const hasDefaultPronouns = pronouns === "";

  var mafiaStats = user.stats["Mafia"].all;

  return (
    <div className="miniprofile">
      <div className="popover-title">
        <Link className={`name-with-avatar`} to={`/user/${id}`} target="_blank">
          <Avatar hasImage={avatar} id={id} avatarId={avatarId} name={name} />
          <div
            className={`user-name`}
            style={{ ...(color ? { color } : {}), display: "inline" }}
          >
            {name}
          </div>
        </Link>
      </div>
      {!hasDefaultPronouns && <div className="pronouns">({pronouns})</div>}
      <PieChart
        wins={mafiaStats.wins.count}
        losses={mafiaStats.wins.total - mafiaStats.wins.count}
        abandons={mafiaStats.abandons.total}
      />
      <div className="score-info">
        <div className="score-info-column">
          <div className="score-info-row score-info-smallicon">
            <img src={KUDOS_ICON} />
          </div>
          <div className="score-info-row">{user.kudos}</div>
        </div>
        <div className="score-info-column">
          <div className="score-info-row score-info-smallicon">
            <img src={KARMA_ICON} />
          </div>
          <div className="score-info-row">{user.karma}</div>
        </div>
        <div className="score-info-column">
          <div className="score-info-row score-info-smallicon">
            <img src={ACHIEVEMENTS_ICON} />
          </div>
          <div className="score-info-row">{user.achievements.length}/40</div>
        </div>
      </div>
    </div>
  );
}

export function LoveType(props) {
  const type = props.type;
  return <div className="in-love">{getLoveTitle(type)}</div>;
}

function getLoveTitle(loveType) {
  if (loveType === "Lover") {
    return "In Love With";
  } else if (loveType === "Married") {
    return "Married To";
  } else return "";
}

export function StatusIcon(props) {
  return <div className={`status-icon ${props.status}`} />;
}

export function Badges(props) {
  if (props.groups[0] === null) {
    return <></>;
  }
  const badges = props.groups
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

  return (
    <div className={`badge-list ${props.small ? "small" : ""}`}>{badges}</div>
  );
}

export function LoveIcon(props) {
  const isLove = props.isLove;
  const love = props.love;
  const userId = props.userId;
  const loveType = love.type;
  const onLoveClick = props.onClick;
  const isMarried = props.isMarried;
  const currentUserLove = props.currentUserLove;

  if (
    (!isLove && !isMarried && !currentUserLove) ||
    (isLove && loveType !== "Married" && love.id === userId)
  ) {
    return (
      <i
        className={`fas fa-heart  ${isLove ? "sel-love" : ""}`}
        onClick={onLoveClick}
      />
    );
  }
  return null;
}

export function MarriedIcon(props) {
  const isMarried = props.isMarried;
  const userId = props.userId;
  const love = props.love;
  const saved = props.saved;
  const isLove = props.isLove;
  const loveType = love.type;
  const onMarryClick = props.onClick;
  if (userId === love.id) {
    if ((saved && isLove && loveType === "Lover") || isMarried) {
      return (
        <i
          className={`fas fa-ring ${isMarried ? "sel-married" : ""}`}
          onClick={onMarryClick}
        />
      );
    }
  }
  return null;
}

export function Badge(props) {
  return (
    <div className="badge">
      <i
        className={`fas fa-${props.icon}`}
        style={{ color: props.color }}
        title={props.name}
      />
    </div>
  );
}

export function useUser() {
  const [user, setUser] = useState({
    loggedIn: false,
    loaded: false,
    perms: {},
    rank: 0,
    blockedUsers: [],
    settings: {},
    itemsOwned: {},
  });

  function clear() {
    setUser({
      loggedIn: false,
      loaded: true,
      perms: {},
      rank: 0,
      blockedUsers: [],
    });
  }

  function blockUserToggle(userId) {
    var userIndex = user.blockedUsers.indexOf(userId);

    if (userIndex === -1) {
      setUser(
        update(user, {
          blockedUsers: {
            $push: [userId],
          },
        })
      );
    } else {
      setUser(
        update(user, {
          blockedUsers: {
            $splice: [[userIndex, 1]],
          },
        })
      );
    }
  }

  function updateSetting(prop, value) {
    setUser(
      update(user, {
        settings: {
          [prop]: {
            $set: value,
          },
        },
      })
    );
  }

  return {
    ...user,
    state: user,
    set: setUser,
    blockUserToggle,
    updateSetting,
    clear,
  };
}
