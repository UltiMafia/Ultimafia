import React, { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";

import { Link } from "react-router-dom";

import { UserContext, SiteInfoContext, GameContext } from "Contexts";
import AvatarUpload from "components/AvatarUpload";
import ripEmote from "images/emotes/rip.webp";

import "css/user.css";
import { Time, youtubeRegex } from "components/Basic";

import { Popover } from "@mui/material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import ImageViewer from "components/ImageViewer";
import { usePopoverOpen } from "hooks/usePopoverOpen";
import { useAvatarImageUrl, AvatarPhoto } from "utils/avatarUrl";

import santaDir from "images/holiday/santahat.png";

// Miniprofile only renders inside an opened popover, and it pulls in d3 via
// PieChart — keep it out of the initial bundle.
const Miniprofile = React.lazy(() => import("components/Miniprofile"));

const soundcloudRegex = /^https?:\/\/(www\.)?soundcloud\.com\/[^\/]+\/[^\/\?]+/;
const spotifyRegex =
  /^https?:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+/;
const vimeoRegex = /^https?:\/\/(www\.)?vimeo\.com\/(\d+)/;
const invidiousRegex =
  /^https?:\/\/(www\.)?(invidious\.io|yewtu\.be|invidious\.flokinet\.to|invidious\.nixnet\.xyz|invidious\.privacydev\.net|invidious\.kavin\.rocks|invidious\.tux\.pizza|invidious\.projectsegfau\.lt|invidious\.riverside\.rocks|invidious\.busa\.co|invidious\.tinfoil-hat\.net|invidious\.jotoma\.de|invidious\.fdn\.fr|invidious\.mastodon\.host|invidious\.lelux\.fi|invidious\.mint\.lgbt|invidious\.fdn\.fr|invidious\.lelux\.fi|invidious\.mint\.lgbt|invidious\.nixnet\.xyz|invidious\.privacydev\.net|invidious\.kavin\.rocks|invidious\.tux\.pizza|invidious\.projectsegfau\.lt|invidious\.riverside\.rocks|invidious\.busa\.co|invidious\.tinfoil-hat\.net|invidious\.jotoma\.de|invidious\.fdn\.fr|invidious\.mastodon\.host|invidious\.lelux\.fi|invidious\.mint\.lgbt)\/watch\?v=([a-zA-Z0-9_-]{11})/;

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
  const loop = !!props.loop;
  // When collapsible, show expand/collapse control. `collapsed` is the initial state.
  const collapsible = !!props.collapsible;
  const [isCollapsed, setIsCollapsed] = useState(!!props.collapsed);
  // Don't CSS-transition the initial collapsed state (start already closed).
  const [allowAnimate, setAllowAnimate] = useState(false);
  const mediaRef = useRef();
  const viewer = useContext(UserContext);
  // Site setting: never autoplay media embeds for this viewer
  const disableMediaAutoplay =
    viewer?.settings?.disableMediaAutoplay === true ||
    viewer?.settings?.disableMediaAutoplay === "true";
  const autoplay = !!props.autoplay && !disableMediaAutoplay;

  useEffect(() => {
    setIsCollapsed(!!props.collapsed);
  }, [props.collapsed]);

  useEffect(() => {
    // Enable transitions only after first paint so initial collapse is instant.
    setAllowAnimate(false);
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setAllowAnimate(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [mediaUrl]);

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

  let body = null;
  switch (mediaType) {
    case "image":
      body = <ImageWithViewer imageUrl={mediaUrl} />;
      break;
    case "audio":
      body = (
        <audio
          ref={mediaRef}
          controls
          src={mediaUrl}
          autoPlay={autoplay}
          loop={loop}
        ></audio>
      );
      break;
    case "video":
      body = (
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
      break;
    case "youtube":
      body = <YouTubeEmbed embedId={embedId} autoplay={autoplay} />;
      break;
    case "soundcloud":
      body = <SoundCloudEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
      break;
    case "spotify":
      body = <SpotifyEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
      break;
    case "vimeo":
      body = <VimeoEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
      break;
    case "invidious":
      body = <InvidiousEmbed mediaUrl={mediaUrl} autoplay={autoplay} />;
      break;
    default:
      return null;
  }

  if (!collapsible) {
    return <div className="media-embed-wrap">{body}</div>;
  }

  return (
    <div
      className={`media-embed-wrap media-collapsible${
        isCollapsed ? " media-collapsed" : ""
      }${allowAnimate ? " media-animate" : ""}`}
    >
      <div className="media-embed-body" aria-hidden={isCollapsed}>
        {body}
      </div>
      <IconButton
        className="media-embed-toggle"
        size="small"
        onClick={() => setIsCollapsed((c) => !c)}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand media player" : "Collapse media player"}
        title={isCollapsed ? "Expand media player" : "Collapse media player"}
      >
        {isCollapsed ? (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <MusicNoteIcon fontSize="small" />
            <ExpandMoreIcon fontSize="small" />
          </Stack>
        ) : (
          <ExpandLessIcon />
        )}
      </IconButton>
    </div>
  );
}
function RipAvatarIcon({ small, large, absoluteLeftAvatarPx }) {
  let avatarSize = 40;
  if (small) {
    avatarSize = 20;
  } else if (large) {
    avatarSize = 100;
  }

  const style = {
    display: "inline-block",
    width: `${avatarSize}px`,
    height: `${avatarSize}px`,
    backgroundImage: `url(${ripEmote})`,
    flexShrink: 0,
  };

  if (absoluteLeftAvatarPx) {
    style.position = "absolute";
    style.left = absoluteLeftAvatarPx;
    if (!small) {
      style.transform = "translateY(12px)";
    }
  } else {
    style.position = "relative";
  }

  return <div className="avatar avatar-rip-icon" style={style} aria-hidden />;
}

export function Avatar(props) {
  const small = props.small;
  const mediumlarge = props.mediumlarge;
  const large = props.large;
  const id = props.id;
  const name = props.name;
  const hasImage = props.hasImage;
  const avatarVersion = props.avatarVersion;
  const imageUrl = props.imageUrl;
  const edit = props.edit;
  const onUpload = props.onUpload;
  const onRemove = props.onRemove;
  const keepAnimation = props.keepAnimation;
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
  const isDeckAvatar =
    !!deckProfile ||
    (typeof hasImage === "string" && hasImage.includes("decks"));
  const userFileId =
    hasImage && !imageUrl && id && !isDeckAvatar && (!avatarId || id === avatarId)
      ? id
      : null;
  const userFileUrl = useAvatarImageUrl(userFileId, {
    cacheVal: siteInfo.cacheVal,
    skipFreeze: !!edit,
    avatarVersion,
  });
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

  let photoSrc = null;
  if (hasImage && !imageUrl && id && avatarId) {
    if (id === avatarId) {
      if (!deckProfile && userFileUrl) {
        photoSrc = userFileUrl;
      } else if (deckProfile) {
        photoSrc = `/uploads/decks/${avatarId}.webp?t=${siteInfo.cacheVal}`;
      }
    }
  } else if (hasImage && !imageUrl && id && userFileUrl) {
    photoSrc = userFileUrl;
  } else if (hasImage && imageUrl) {
    photoSrc = imageUrl;
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
      photoSrc = `/uploads${hasImage}?t=${siteInfo.cacheVal}`;
      style.backgroundColor = "#00000000";
    }
  }
  if (photoSrc) {
    style.backgroundImage = "none";
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
      <AvatarPhoto src={photoSrc} />
      {edit && (
        <div className="edit avatar-edit-overlay">
          <AvatarUpload
            className="avatar-edit-action"
            name="avatar"
            onFileUpload={onUpload}
            isSquare={isSquare}
            keepAnimation={!!keepAnimation}
          >
            <i className="far fa-file-image" title="Upload avatar" />
          </AvatarUpload>
          {hasImage && onRemove && (
            <button
              type="button"
              className="avatar-edit-action avatar-remove"
              title="Remove avatar"
              aria-label="Remove avatar"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
            >
              <i className="fas fa-trash" />
            </button>
          )}
        </div>
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
        <img
          className="santa"
          width={santaProps.width}
          style={{
            display: "block",
            position: "absolute",
            transform: santaProps.transform,
          }}
          src={santaDir}
          alt="Santa hat"
        />
      )}
    </div>
  );
}

export function NameWithAvatar(props) {
  const id = props.id;
  const name = props.name || "[deleted]";
  const avatar = props.avatar;
  const avatarVersion = props.avatarVersion;
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
  const subContent = props.subContent;
  const ripAvatar = props.ripAvatar;
  const nameColorSwatch = props.nameColorSwatch;
  const nameFont = props.nameFont;
  const animatedNameColor = props.animatedNameColor;
  const nameGradientColorA = props.nameGradientColorA || "#ff0040";
  const nameGradientColorB = props.nameGradientColorB || "#00c2ff";
  const nameGradientColorC = props.nameGradientColorC || "#3dff6a";

  const game = useContext(GameContext);
  const user = useContext(UserContext);
  const [userProfile, setUserProfile] = useState(null);
  const [isClicked, setIsClicked] = useState(false);

  const autoColor = user.autoContrastColor(color);
  const nameFontClass =
    nameFont && nameFont !== "default" ? `name-font-${nameFont}` : "";
  // Dead names stay red; skip cosmetics that would override .user-name.dead
  const nameAnimClass =
    !dead && animatedNameColor && animatedNameColor !== "none"
      ? `name-anim-${animatedNameColor}`
      : "";
  // Rainbow/patriotic/gradient/tricolor use background-clip
  const usesClipText =
    !dead &&
    (animatedNameColor === "rainbow" ||
      animatedNameColor === "patriotic" ||
      animatedNameColor === "gradient" ||
      animatedNameColor === "tricolor");
  const useSolidNameColor = !dead && autoColor && !usesClipText;
  const nameStyle = {
    ...(useSolidNameColor ? { color: autoColor } : {}),
    display: "inline",
    ...(animatedNameColor === "gradient" || animatedNameColor === "tricolor"
      ? {
          ["--name-grad-a"]: nameGradientColorA,
          ["--name-grad-b"]: nameGradientColorB,
          ...(animatedNameColor === "tricolor"
            ? { ["--name-grad-c"]: nameGradientColorC }
            : {}),
        }
      : {}),
  };

  const {
    popoverOpen: canOpenPopover,
    openByClick,
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
      {ripAvatar ? (
        <RipAvatarIcon
          small={small}
          large={large}
          absoluteLeftAvatarPx={absoluteLeftAvatarPx}
        />
      ) : (
        <Avatar
          hasImage={avatar}
          id={id}
          avatarId={avatarId}
          avatarVersion={avatarVersion}
          name={name}
          small={small}
          large={large}
          isSquare={isSquare}
          dead={dead}
          active={active}
          deckProfile={deckProfile}
          absoluteLeftAvatarPx={absoluteLeftAvatarPx}
        />
      )}
      <Stack direction="column">
        <div
          className={`user-name ${props.dead ? "dead" : ""} ${nameFontClass} ${nameAnimClass}`.trim()}
          style={nameStyle}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            {nameColorSwatch && !dead && (
              <span
                className={`name-color-swatch ${
                  small ? "name-color-swatch-small" : "name-color-swatch-regular"
                }`}
                style={{ backgroundColor: nameColorSwatch }}
                title="Name color"
                aria-label="Name color"
              />
            )}
            <Typography
              component="span"
              className="user-name-text"
              sx={{ color: "inherit", fontFamily: "inherit" }}
            >
              {name}
            </Typography>
            {groups && <Badges groups={groups} small={small} />}
          </Stack>
        </div>
        {subContent}
      </Stack>
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
            sx={{ pointerEvents: openByClick ? "auto" : "none" }}
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
              <React.Suspense fallback={null}>
                <Miniprofile
                  user={userProfile}
                  game={game}
                  key={userProfile.id}
                />
              </React.Suspense>
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
