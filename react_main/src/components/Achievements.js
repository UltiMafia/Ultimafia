/*
import React, { useState, useContext, useRef, useEffect } from "react";
import { UserContext, SiteInfoContext, PopoverContext } from "../Contexts";
import { SearchBar } from "./Nav";
import { hyphenDelimit } from "../utils";
import { Alignments } from "../Constants";
import {
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Tabs,
  Tab,
  Box,
  IconButton,
  Typography,
  Grid2,
  Paper,
  Stack,
  Divider,
  useMediaQuery,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { usePopoverOpen } from "../hooks/usePopoverOpen";
import { NewLoading } from "../pages/Welcome/NewLoading";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

export function AchievementCount(props) {
  const roleRef = useRef();
  const popover = useContext(PopoverContext);
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const [roleData, setRoleData] = useState(null);
  const isPhoneDevice = useIsPhoneDevice();

  const {
    popoverOpen: canOpenPopover,
    popoverClasses,
    anchorEl,
    handleClick: handlePopoverClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  const handleRoleCountClick = (e) => {
    if (props.onClick) return props.onClick();

    if (makeRolePrediction) {
      makeRolePrediction(props.role);
      popover.close();
      return;
    }

    if (!achievementName || props.showPopover == false || achievementName === "null") return;

    handlePopoverClick(e);
  };

  var achievementName, hasBeenCompleted;

  if (typeof props.achievement == "string") {
    roleName = props.role;
  } else if (props.role) {
    roleName = props.achievement.name;
  }
  let achievements1;
  if (user.settings && typeof user.achievements == "string") {
    achievements1 = user.settings.roleSkins.split(",");
  }

  let userAchievements = null;
  if (achievements1) {
    userAchievements = achievements1.filter((s) => s.split(":")[0] == roleName);
  }

  if (userRoleSkins && userRoleSkins.length == 1) {
    roleSkin = userRoleSkins[0].split(":")[1];
  } else {
    roleSkin = "vivid";
  }

  if (props.skin) {
    roleSkin = props.skin;
  }

  useEffect(() => {
    setRoleData({
      ...siteInfo.rolesRaw[props.gameType][roleName],
      modifiers: siteInfo.modifiers[props.gameType].filter((m) =>
        modifiers?.split("/").includes(m.name)
      ),
    });
  }, [siteInfo, roleName]);

  const roleClass = roleName
    ? `${hyphenDelimit(props.gameType)}-${hyphenDelimit(roleName)}`
    : "null";

  function onRoleGroupClick() {
    if (props.roleGroup) {
      popover.onClick(
        Promise.resolve({
          data: {
            roles: props.roleGroup,
            gameType: props.gameType,
            setup: props,
            otherRoles: props.otherRoles,
          },
        }),
        "roleGroup",
        roleRef.current,
        "Role Group"
      );
    }
  }

  const digits =
    props.count && !props.hideCount ? props.count.toString().split("") : "";

  const popoverDisabled = Boolean(
    props.showPopover === false || roleClass == "null"
  );
  const popoverOpen = !popoverDisabled && canOpenPopover;
  const mapAlignmentToText = {
    Village: "Village 💙",
    Mafia: "Mafia 🔪",
    Cult: "Cult 🦑",
    Independent: "Independent ✨",
    Event: "Event ⚡",
    Resistance: "Resistance ✊",
    Spies: "Spies 🕵️",
    Town: "Village 💙",
    Ghost: "Ghost 👻",
    Host: "Host 🎤",
    Liberals: "Liberals 🇺🇸",
    Fascists: "Fascists 🛠️",
    Liars: "Liars 🤥",
  };
  const roleAlignment = mapAlignmentToText[roleData?.alignment];
  const roleTags = roleData?.tags ? roleData.tags.sort().join(", ") : "";
  const hasModifiers = roleData?.modifiers?.length;
  const DescriptionLines = (
    <List dense sx={{ ...(hasModifiers ? { paddingBottom: 0 } : {}) }}>
      {roleData?.description?.map((text, i) => (
        <ListItem
          key={i}
          sx={{
            paddingBottom: "0",
            paddingTop: "0",
            px: isPhoneDevice ? 1 : 2,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: "0",
              marginRight: "8px",
            }}
          >
            <i className={"fas fa-info-circle"} />
          </ListItemIcon>
          <ListItemText
            disableTypography
            className={"mui-popover-text"}
            primary={text}
          />
        </ListItem>
      ))}
    </List>
  );
  const Modifiers = hasModifiers ? (
    <List dense sx={{ paddingTop: "0" }}>
      {roleData?.modifiers?.map((modifier, i) => (
        <ListItem
          key={modifier.name}
          sx={{
            paddingBottom: "0",
            paddingTop: "0",
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: "0",
              marginRight: "8px",
            }}
          >
            <i
              className={`modifier modifier-${props.gameType}-${modifier.name}`}
            />
          </ListItemIcon>
          <ListItemText
            disableTypography
            className={"mui-popover-text"}
            primary={
              <div>
                <span style={{ fontWeight: "bold" }}>{modifier.name}</span>:{" "}
                {roleData?.SpecialInteractionsModifiers &&
                roleData?.SpecialInteractionsModifiers[modifier.name]
                  ? roleData?.SpecialInteractionsModifiers[modifier.name]
                  : roleData?.alignment == "Event" &&
                    modifier.eventDescription != null
                  ? modifier.eventDescription
                  : modifier.description}
              </div>
            }
          />
        </ListItem>
      ))}
    </List>
  ) : (
    ""
  );
  let specials = [];
  let specialRoles = [];
  if (otherRoles && otherRoles.length > 0) {
    if (roleData?.SpecialInteractions) {
      for (let i in otherRoles) {
        let roleSet = otherRoles[i];
        for (let thing in roleSet) {
          //!specials.includes([thing.split(":")[0],roleData.SpecialInteractions[thing.split(":")[0]]])
          if (
            roleData.SpecialInteractions[thing.split(":")[0]] &&
            !specialRoles.includes(thing.split(":")[0])
          ) {
            specialRoles.push(thing.split(":")[0]);
            specials.push([
              thing.split(":")[0],
              roleData.SpecialInteractions[thing.split(":")[0]],
            ]);
          }
        }
      }
    }
  }
  let hasSpecials = specials.length > 0;
  const SpecialInteractions = hasSpecials ? (
    <List dense sx={{ paddingTop: "0" }}>
      <div>
        <span style={{ fontWeight: "bold" }}>Special Interactions</span>
      </div>
      {specials.map((special, i) => (
        <ListItem
          key={i}
          sx={{
            paddingBottom: "0",
            paddingTop: "0",
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: "0",
              marginRight: "8px",
            }}
          >
            <i
              className={`role role-icon-vivid-${hyphenDelimit(
                props.gameType
              )}-${hyphenDelimit(special[0])} "small"`}
            />
          </ListItemIcon>
          <ListItemText
            disableTypography
            className={"mui-popover-text"}
            primary={
              <div>
                <span style={{ fontWeight: "bold" }}>{special[0]}</span>:{" "}
                {special[1][0]}
              </div>
            }
          />
        </ListItem>
      ))}
    </List>
  ) : (
    ""
  );

  if (props.closed && (props.count > 0 || props.hideCount)) {
    return (
      <div className="role-count-wrap closed-role-count">
        {!props.hideCount && <DigitsCount digits={digits} />}
        <i
          className={`fas fa-question i-${props.alignment}`}
          onClick={props.onClick}
        />
      </div>
    );
  } else if (props.roleGroup) {
    return (
      <div className="role-count-wrap">
        <div className="role-group-placeholder">
          <div
            className={`role role-icon-${roleSkin}-${roleClass} ${
              props.small ? "small" : props.large ? "large" : ""
            } ${props.bg ? "bg" : ""}`}
            ref={roleRef}
            onClick={onRoleGroupClick}
          >
            {!props.hideCount && <DigitsCount digits={digits} />}
          </div>
        </div>
      </div>
    );
  } else if (!props.closed) {
    return (
      <>
        <div
          className="role-count-wrap"
          aria-owns={popoverOpen ? "mouse-over-popover" : undefined}
          aria-haspopup="true"
          onClick={handleRoleCountClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`role role-icon-${roleSkin}-${roleClass} ${
              props.small ? "small" : props.large ? "large" : ""
            } ${props.bg ? "bg" : ""}`}
            ref={roleRef}
          >
            {props.count > 1 && <DigitsCount digits={digits} />}
            {modifiers &&
              modifiers
                .split("/")
                .map((modifier, k) => (
                  <div
                    key={modifier}
                    className={`modifier modifier-pos-${k} modifier-${
                      props.gameType
                    }-${hyphenDelimit(modifier)}`}
                  />
                ))}
          </div>
        </div>
        <Popover
          open={props.showPopover !== false && popoverOpen}
          sx={popoverClasses}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          onClose={closePopover}
          disableScrollLock
          disableRestoreFocus
        >
          <div className={"mui-popover"}>
            <div className={"mui-popover-title"}>
              <div className={`role role-icon-${roleSkin}-${roleClass}`} />
              &nbsp;{<Link href={`/learn/role/${roleName}`}>{roleName}</Link>}
              &nbsp;
            </div>
            <div style={{ margin: "6px" }}>
              <div>
                <span style={{ fontWeight: "bold" }}>Alignment</span>:{" "}
                {roleAlignment}
              </div>
              <div>
                <span style={{ fontWeight: "bold" }}>Tags</span>: {roleTags}
              </div>
              {DescriptionLines}
              {Modifiers}
              {SpecialInteractions}
            </div>
          </div>
        </Popover>
      </>
    );
  } else {
    return <></>;
  }
}

export function RoleCell(props) {
  const iconLength = props.iconLength || "2em";
  const role = props.role;
  const icon = props.icon;
  const onAddClick = props.onAddClick;
  const onDelClick = props.onDelClick;

  const siteInfo = useContext(SiteInfoContext);
  const popover = useContext(PopoverContext);
  const user = useContext(UserContext);
  const roleCellRef = useRef();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const myHeight = `calc(1.2 * ${iconLength} + 2 * var(--mui-spacing))`;

  if (role === undefined) {
    return (
      <Box
        sx={{
          minWidth: 0,
          height: myHeight,
          minHeight: "var(--mui-spacing)",
          borderRadius: "var(--mui-shape-borderRadius)",
          border: `1px solid var(--mui-palette-divider)`,
        }}
      />
    );
  }

  function onRoleCellClick() {
    popover.onClick(
      Promise.resolve({
        data: {
          roleName: siteInfo.modifiers[props.gameType][role.name],
        },
      }),
      "role",
      roleCellRef,
      role.name
    );
  }

  return (
    <Paper
      variant="outlined"
      className="role-cell"
      key={role.name}
      sx={{
        p: isSmallScreen ? 0.5 : 1,
        lineHeight: "normal",
        height: myHeight,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          width: "100%",
        }}
        onMouseOver={() => null && onRoleCellClick()}
        ref={roleCellRef}
      >
        {user.loggedIn && onAddClick && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(role);
            }}
            sx={{
              padding: 1,
              bgcolor: "#62a0db",
              alignSelf: "stretch",
              minWidth: "0px",
            }}
          >
            <i
              className="fa-plus fas"
              aria-hidden="true"
              style={{ fontSize: "0.5em" }}
            />
          </Button>
        )}
        {user.loggedIn && onDelClick && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelClick(role);
            }}
            sx={{
              padding: 1,
              bgcolor: "#e45050",
              alignSelf: "stretch",
              minWidth: "0px",
            }}
          >
            <i
              className="fa-times fas"
              aria-hidden="true"
              style={{ fontSize: "0.5em" }}
            />
          </Button>
        )}
        {icon}
        <Typography
          variant="body2"
          sx={{
            flex: "1",
            textAlign: "right",
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {role.name}
        </Typography>
      </Stack>
      {(role.newlyAdded || role.recentlyUpdated || role.featured) && (
        <RoleBanners
          newlyAdded={role.newlyAdded}
          recentlyUpdated={role.recentlyUpdated}
          featured={role.featured}
          sx={{ padding: "2px" }}
        />
      )}
    </Paper>
  );
}
*/
