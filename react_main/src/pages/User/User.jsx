import React, { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";

import { Link, Route, Routes, Navigate } from "react-router-dom";

import Profile, { KUDOS_ICON, KARMA_ICON, ACHIEVEMENTS_ICON } from "./Profile";
import Settings from "./Settings";
import Shop from "./Shop";
import Inbox from "./Inbox";
import Family from "./Family";
import { UserContext, SiteInfoContext, GameContext } from "Contexts";
import AvatarUpload from "components/AvatarUpload";

import "css/user.css";
import { Time, youtubeRegex } from "components/Basic";

const soundcloudRegex = /^https?:\/\/(www\.)?soundcloud\.com\/[^\/]+\/[^\/\?]+/;
const spotifyRegex =
  /^https?:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+/;
const vimeoRegex = /^https?:\/\/(www\.)?vimeo\.com\/(\d+)/;
const invidiousRegex =
  /^https?:\/\/(www\.)?(invidious\.io|yewtu\.be|invidious\.flokinet\.to|invidious\.nixnet\.xyz|invidious\.privacydev\.net|invidious\.kavin\.rocks|invidious\.tux\.pizza|invidious\.projectsegfau\.lt|invidious\.riverside\.rocks|invidious\.busa\.co|invidious\.tinfoil-hat\.net|invidious\.jotoma\.de|invidious\.fdn\.fr|invidious\.mastodon\.host|invidious\.lelux\.fi|invidious\.mint\.lgbt|invidious\.fdn\.fr|invidious\.lelux\.fi|invidious\.mint\.lgbt|invidious\.nixnet\.xyz|invidious\.privacydev\.net|invidious\.kavin\.rocks|invidious\.tux\.pizza|invidious\.projectsegfau\.lt|invidious\.riverside\.rocks|invidious\.busa\.co|invidious\.tinfoil-hat\.net|invidious\.jotoma\.de|invidious\.fdn\.fr|invidious\.mastodon\.host|invidious\.lelux\.fi|invidious\.mint\.lgbt)\/watch\?v=([a-zA-Z0-9_-]{11})/;
import { useTheme } from "@mui/material/styles";
import { Popover, Tooltip } from "@mui/material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { PieChart } from "./PieChart";
import { usePopoverOpen } from "hooks/usePopoverOpen";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import ImageViewer from "components/ImageViewer";
import ReportDialog from "components/ReportDialog";
import { useErrorAlert } from "components/Alerts";

import santaDir from "images/holiday/santahat.png";

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
      <div id="profile-video" className="video-responsive-generic">
        <iframe
          className="video-responsive-content"
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

export function SoundCloudEmbed(props) {
  const mediaUrl = props.mediaUrl;
  if (mediaUrl) {
    return (
      <div id="profile-video" className="video-responsive-generic">
        <iframe
          className="video-responsive-content"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
            mediaUrl
          )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
          allow="autoplay"
          allowFullScreen
        ></iframe>
      </div>
    );
  } else {
    return null;
  }
}

export function SpotifyEmbed(props) {
  const mediaUrl = props.mediaUrl;
  if (mediaUrl) {
    // Convert Spotify URL to embed format
    const embedUrl = mediaUrl.replace(
      "open.spotify.com",
      "open.spotify.com/embed"
    );
    return (
      <div id="profile-video" className="video-responsive-generic">
        <iframe
          className="video-responsive-content"
          src={embedUrl}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  } else {
    return null;
  }
}

export function VimeoEmbed(props) {
  const mediaUrl = props.mediaUrl;
  const autoplay = props.autoplay ? 1 : 0;
  if (mediaUrl) {
    // Extract video ID from Vimeo URL
    const vimeoMatches = mediaUrl.match(vimeoRegex);
    if (vimeoMatches && vimeoMatches[2]) {
      const videoId = vimeoMatches[2];
      return (
        <div id="profile-video" className="video-responsive-generic">
          <iframe
            className="video-responsive-content"
            src={`https://player.vimeo.com/video/${videoId}?autoplay=${autoplay}&muted=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  }
  return null;
}

export function InvidiousEmbed(props) {
  const mediaUrl = props.mediaUrl;
  const autoplay = props.autoplay ? 1 : 0;
  if (mediaUrl) {
    // Extract video ID from Invidious URL
    const invidiousMatches = mediaUrl.match(invidiousRegex);
    if (invidiousMatches && invidiousMatches[3]) {
      const videoId = invidiousMatches[3];
      return (
        <div id="profile-video" className="video-responsive-generic">
          <iframe
            className="video-responsive-content"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&mute=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media;"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  }
  return null;
}

function ImageWithViewer({ imageUrl }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const mediaRef = useRef();

  return (
    <>
      <img
        ref={mediaRef}
        src={imageUrl}
        alt=""
        onClick={() => setViewerOpen(true)}
        style={{
          cursor: "pointer",
          maxWidth: "100%",
        }}
      />
      {viewerOpen && (
        <ImageViewer imageUrl={imageUrl} onClose={() => setViewerOpen(false)} />
      )}
    </>
  );
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
    if (mediaUrl.match(soundcloudRegex)) {
      return "soundcloud";
    }
    if (mediaUrl.match(spotifyRegex)) {
      return "spotify";
    }
    if (mediaUrl.match(vimeoRegex)) {
      return "vimeo";
    }
    if (mediaUrl.match(invidiousRegex)) {
      return "invidious";
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
        return "image";
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
    case "image":
      return <ImageWithViewer imageUrl={mediaUrl} />;
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
    case "soundcloud":
      return <SoundCloudEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
    case "spotify":
      return <SpotifyEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
    case "vimeo":
      return <VimeoEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
    case "invidious":
      return <InvidiousEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
    default:
      return null;
  }
}
export default function User(props) {
  const theme = useTheme();
  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();

  if (user.loaded && !user.loggedIn) return <Navigate to="/" />;

  return (
    <Routes>
      <Route path="/" element={<Profile />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="shop" element={<Shop />} />
      <Route path="inbox" element={<Inbox />} />
      <Route path="family/:familyId" element={<Family />} />
      <Route path=":userId" element={<Profile />} />
    </Routes>
  );
}

export function Avatar(props) {
  const small = props.small;
  const mediumlarge = props.mediumlarge;
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
  const ConnectFour = props.ConnectFour;
  const isSquare = props.isSquare || false;
  const border = props.border || undefined;
  const onlineStatus = props.onlineStatus || null;
  const lastActive = props.lastActive;
  const inGame = props.inGame;

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

  let avatarSize = 40;
  if (small) {
    avatarSize = 20;
  } else if (mediumlarge) {
    avatarSize = 60;
  } else if (large) {
    avatarSize = 100;
  }

  if (absoluteLeftAvatarPx) {
    style.position = "absolute";
    style.left = absoluteLeftAvatarPx;

    if (!small && !ConnectFour) {
      style.transform = "translateY(12px)";
    }
  } else {
    style.position = "relative";
  }

  if (ConnectFour) {
    style.transform = "translateX(5px) translateY(5px)";
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

  // Santa hat: Only show during December (turns off on January 1)
  const isDecember = new Date().getMonth() + 1 === 12; // getMonth() returns 0-11

  let santaProps = null;
  if (isDecember) {
    let santaWidth, santaHorizAdjust, santaVertAdjust;
    if (large) {
      santaWidth = "100px";
      santaHorizAdjust = -25;
      santaVertAdjust = -40;
    } else if (small) {
      santaWidth = "20px";
      santaHorizAdjust = -5;
      santaVertAdjust = -8;
    } else {
      santaWidth = "40px";
      santaHorizAdjust = -12;
      santaVertAdjust = -15;
    }
    santaProps = {
      width: santaWidth,
      transform: `translate(${santaHorizAdjust}px, ${santaVertAdjust}px)`,
    };
  }

  return (
    <div
      className={`avatar ${dead ? "dead" : ""} ${active ? "active" : ""}`}
      style={{
        ...style,
        display: "inline-block",
        width: `${avatarSize}px`,
        height: `${avatarSize}px`,
        borderRadius: isSquare ? "0px" : "50%",
        border: border,
      }}
    >
      {edit && (
        <AvatarUpload
          className="edit"
          name="avatar"
          onFileUpload={onUpload}
          isSquare={isSquare}
        >
          <i className="far fa-file-image" />
        </AvatarUpload>
      )}

      {onlineStatus !== null && (
        <Box
          sx={{
            position: "absolute",
            content: "''",
            bottom: isSquare ? 0 : 0.112 * avatarSize,
            right: isSquare ? 0 : 0.112 * avatarSize,
            transform: `translateX(50%) translateY(50%)`,
          }}
        >
          <OnlineStatus
            status={onlineStatus}
            lastActive={lastActive}
            inGame={inGame}
          />
        </Box>
      )}

      {/* Santa hat: Only shows during December (turns off on January 1) */}
      {isDecember && santaProps && (
        <div>
          <img
            className="santa"
            width={santaProps.width}
            style={{ position: "absolute", transform: santaProps.transform }}
            src={santaDir}
            alt="Santa hat"
          />
        </div>
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
  const avatarId = props.avatarId;
  const deckProfile = props.deckProfile;
  const includeMiniprofile = props.includeMiniprofile;
  const absoluteLeftAvatarPx = props.absoluteLeftAvatarPx;
  const vanityUrl = props.vanityUrl;
  const large = props.large;
  const isSquare = props.isSquare;

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
      axios
        .get(`/api/user/${id}/profile`)
        .then((res) => {
          res.data.props = props;
          setUserProfile(res.data);
        })
        .catch((error) => {
          console.warn(
            `Couldn't retrieve profile for ${id} (this error is harmless if they're a bot)`
          );
        });
    }
  }, []);

  var contents = (
    <Stack
      direction="row"
      spacing={absoluteLeftAvatarPx ? 0 : small ? 0.5 : 1}
      sx={{
        alignItems: "center",
      }}
    >
      <Avatar
        hasImage={avatar}
        id={id}
        avatarId={avatarId}
        name={name}
        small={small}
        large={large}
        isSquare={isSquare}
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
    </Stack>
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
              horizontal: "left",
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
    const profileLink = vanityUrl ? `/user/${vanityUrl}` : `/user/${id}`;
    return (
      <Link
        className={`name-with-avatar`}
        to={profileLink}
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
  const currentUser = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const id = user.id;
  const name = user.name || "[deleted]";
  const pronouns = user.pronouns || "";
  const avatar = user.avatar;
  const color = inheritedProps.color;
  const avatarId = inheritedProps.avatarId;
  const hasDefaultPronouns = pronouns === "";
  const vanityUrl = user.vanityUrl;

  let pieChart = <></>;
  if (user.stats) {
    const mafiaStats = user.stats["Mafia"].all;
    pieChart = (
      <PieChart
        wins={mafiaStats.wins.count}
        losses={mafiaStats.wins.total - mafiaStats.wins.count}
        abandons={mafiaStats.abandons.total}
      />
    );
  }

  const profileLink = vanityUrl ? `/user/${vanityUrl}` : `/user/${id}`;

  const isSelf = currentUser.loggedIn && currentUser.id === id;
  const [isFriend, setIsFriend] = useState(user.isFriend || false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const gameId = game?.gameId || null;

  // Update friend status when user prop changes
  useEffect(() => {
    setIsFriend(user.isFriend || false);
  }, [user.isFriend]);

  function onFriendUserClick() {
    if (isFriend) {
      var shouldUnfriend = window.confirm(
        "Are you sure you wish to unfriend or cancel your friend request?"
      );
      if (!shouldUnfriend) return;
    }

    axios
      .post("/api/user/friend", { user: id })
      .then((res) => {
        setIsFriend(!isFriend);
        siteInfo.showAlert(res.data, "success");
      })
      .catch(errorAlert);
  }

  function onReportClick() {
    setReportDialogOpen(true);
  }

  return (
    <div className="miniprofile">
      <div className="mui-popover-title">
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Link
            className={`name-with-avatar`}
            to={profileLink}
            target="_blank"
            style={{ flex: 1, minWidth: 0 }}
          >
            <Stack direction="row" spacing={1}>
              <Avatar
                hasImage={avatar}
                id={id}
                avatarId={avatarId}
                name={name}
              />
              <div
                className={`user-name`}
                style={{
                  ...(color ? { color } : {}),
                  display: "inline",
                  alignSelf: "center",
                }}
              >
                {name}
              </div>
            </Stack>
          </Link>
          {!isSelf && currentUser.loggedIn && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={isFriend ? "Unfriend" : "Send Friend Request"}>
                <IconButton
                  size="small"
                  onClick={onFriendUserClick}
                  sx={{
                    color: isFriend ? "primary.main" : "text.secondary",
                  }}
                >
                  <i className={`fas fa-user-plus ${isFriend ? "sel" : ""}`} />
                </IconButton>
              </Tooltip>
              <Tooltip title="File Report">
                <IconButton size="small" onClick={onReportClick}>
                  <i className="fas fa-flag" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </div>
      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        prefilledArgs={{
          userId: id,
          userName: name,
          game: gameId,
        }}
      />
      {!hasDefaultPronouns && <div className="pronouns">({pronouns})</div>}
      {pieChart}
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

export function getLoveTitle(loveType) {
  if (loveType === "Lover") {
    return "In Love With";
  } else if (loveType === "Married") {
    return "Married To";
  } else return "";
}

export function StatusIcon(props) {
  return <div className={`status-icon ${props.status}`} />;
}

export function OnlineStatus({ status, lastActive, inGame }) {
  const isPhoneDevice = useIsPhoneDevice();

  const onlineStatusIconSize = isPhoneDevice ? "16px" : "24px";

  let caption = null;
  let displayedStatus = status;
  if (inGame) {
    displayedStatus = "ingame";
    caption = "In game";
  } else if (status !== "online") {
    caption = (
      <>
        {"Last online "}
        <Time
          abbreviate={isPhoneDevice}
          minSec
          millisec={Date.now() - lastActive}
          suffix={" ago"}
        />
      </>
    );
  }

  return (
    <Box
      className={`status-icon ${displayedStatus}`}
      aria-hidden="true"
      sx={{
        position: "relative",
        width: onlineStatusIconSize,
        height: onlineStatusIconSize,
        borderRadius: "50%",
        border: "4px var(--scheme-color) solid",
      }}
    >
      {caption && (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            left: `calc(${onlineStatusIconSize}/2 + 4px + var(--mui-spacing)/2)`,
            bottom: `calc(${onlineStatusIconSize}/2 - 1em + 2px)`,
            filter: "opacity(.75)",
            fontSize: "0.75rem",
            textWrap: "nowrap",
            lineHeight: "1",
            pointerEvents: "none",
          }}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
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
      <IconButton aria-label="love user">
        <i
          className={`fas fa-heart  ${isLove ? "sel-love" : ""}`}
          onClick={onLoveClick}
        />
      </IconButton>
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
        <IconButton aria-label="marry user">
          <i
            className={`fas fa-ring ${isMarried ? "sel-married" : ""}`}
            onClick={onMarryClick}
          />
        </IconButton>
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
