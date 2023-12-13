import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, Route, Switch, Redirect } from "react-router-dom";
import update from "immutability-helper";

import Profile from "./Profile";
import Settings from "./Settings";
import Shop from "./Shop";
import { UserContext, PopoverContext, SiteInfoContext } from "../../Contexts";
import { SubNav } from "../../components/Nav";
import { HiddenUpload } from "../../components/Form";

import "../../css/user.css";
import { adjustColor, flipTextColor } from "../../utils";
import { youtubeRegex } from "../../components/Basic";

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
  const user = useContext(UserContext);
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

  return (
    <>
      <SubNav links={links} />
      <div className="inner-content">
        <Switch>
          <Route exact path="/user" render={() => <Profile />} />
          <Route exact path="/user/settings" render={() => <Settings />} />
          <Route exact path="/user/shop" render={() => <Shop />} />
          <Route exact path="/user/:userId" render={() => <Profile />} />
          <Route render={() => <Redirect to="/user" />} />
        </Switch>
      </div>
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

  const santaDir = "/images/santahat.png";

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

  if (hasImage && !imageUrl && id && avatarId) {
    if (id === avatarId && !deckProfile) {
      style.backgroundImage = `url(/uploads/${id}_avatar.webp?t=${siteInfo.cacheVal})`;
    } else {
      style.backgroundImage = `url(/uploads/decks/${avatarId}.webp?t=${siteInfo.cacheVal})`;
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

  var santaWidth;
  var santaHorizAdjust;
  var santaVertAdjust;

  if (large) {
    santaWidth = "100px";
    santaHorizAdjust = -25;
    santaVertAdjust = -40;
  } else if (small) {
    santaWidth = "20px;"
    santaHorizAdjust = -5;
    santaVertAdjust = -8;
  }
  else {
    santaWidth = "40px";
    santaHorizAdjust = -12;
    santaVertAdjust = -15;
  }
  var santaAdjust = `translate(${santaHorizAdjust}px, ${santaVertAdjust}px)`;

  return (
      <div
        className={`avatar ${size} ${dead ? "dead" : ""} ${
          active ? "active" : ""
        }`}
        style={style}
      >
        {edit && (
          <HiddenUpload className="edit" name="avatar" onFileUpload={onUpload}>
            <i className="far fa-file-image" />
          </HiddenUpload>
        )}
        
        {/*SANTA CHANGES*/}
        <div>
        <img className="santa" width={santaWidth} style={{position: "absolute", transform: santaAdjust}} src={santaDir}></img>
        </div>
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
  const popover = useContext(PopoverContext);
  const avatarId = props.avatarId;
  const deckProfile = props.deckProfile;

  var userNameClassName = `user-name ${
    props.dead ? "dead" : adjustColor(color)
  }`;
  // var userNameClassName = `user-name ${adjustColor(color)}`;

  return (
    <Link
      className={`name-with-avatar ${noLink ? "no-link" : ""}`}
      to={`/user/${id}`}
      target={newTab ? "_blank" : ""}
      onClick={(e) => {
        popover.setVisible(false);

        if (noLink) e.preventDefault();
      }}
    >
      <Avatar
        hasImage={avatar}
        id={id}
        avatarId={avatarId}
        name={name}
        small={small}
        dead={dead}
        active={active}
        deckProfile={deckProfile}
      />
      <div
        className={userNameClassName}
        style={color ? { color: flipTextColor(color) } : {}}
      >
        {name}
      </div>
      {groups && <Badges groups={groups} small={small} />}
    </Link>
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
