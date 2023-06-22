import React, { useState, useContext } from "react";
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
import CreateDeck from "./CreateDeck";

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
      text: "My Decks",
      path: "/user/decks",
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
          <Route exact path="/user/decks" render={() => <CreateDeck />} />
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

  if (hasImage && !imageUrl && id) {
    style.backgroundImage = `url(/uploads/${id}_avatar.jpg?t=${siteInfo.cacheVal})`;
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

  var userNameClassName = `user-name ${adjustColor(color)}`;

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
        name={name}
        small={small}
        dead={dead}
        active={active}
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

    if (userIndex == -1) {
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
