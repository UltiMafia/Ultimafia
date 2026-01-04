import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import { UserContext, SiteInfoContext } from "../Contexts";
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
  Typography,
  Grid2,
  Paper,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import { usePopoverOpen } from "../hooks/usePopoverOpen";
import { NewLoading } from "../pages/Welcome/NewLoading";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { PopoverContent } from "./Popover";
import { getAlignmentColor, SmallRoleList } from "./Setup";

export function RoleDetails({
  gameType,
  roleName,
  otherRoles = null,
  skin = null,
  showHeader = true,
  modifiersOverride = null,
}) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

  // Determine role skin (same precedence as RoleCount)
  let roleSkin = null;
  if (skin) {
    roleSkin = skin;
  } else if (user.settings && typeof user.settings.roleSkins == "string") {
    const userRoleSkins = user.settings.roleSkins.split(",");
    const userRoleSkinsMatched = userRoleSkins.filter(
      (s) => s.split(":")[0] == roleName
    );
    if (userRoleSkinsMatched.length > 0) {
      roleSkin = userRoleSkinsMatched[0].split(":")[1];
    }
  }
  if (roleSkin === null) {
    roleSkin = "vivid";
  }

  // Gather role data and modifiers exactly like RoleCount
  const baseRoleData = siteInfo.rolesRaw?.[gameType]?.[roleName] || {};
  const mappedModifiers = siteInfo.modifiers?.[gameType]
    ? siteInfo.modifiers[gameType].filter((m) => {
        const source = Array.isArray(modifiersOverride)
          ? modifiersOverride
          : baseRoleData?.modifiers
          ? baseRoleData.modifiers.split("/")
          : [];
        return source.includes(m.name);
      })
    : [];
  const roleData = { ...baseRoleData, modifiers: mappedModifiers };

  const roleClass = roleName
    ? `${hyphenDelimit(gameType)}-${hyphenDelimit(roleName)}`
    : "null";

  // Map alignment, tags, and description formatting exactly as in RoleCount
  const mapAlignmentToText = {
    Village: "Village 💙",
    Mafia: "Mafia 🔪",
    Cult: "Cult 🦑",
    Independent: "Independent ✨",
    Event: "Event ⚡",
    Resistance: "Resistance ✊",
    Spies: "Spies 🕵️",
    Town: "Village 💙",
    Host: "Host 🎤",
    Liberals: "Liberals 🇺🇸",
    Fascists: "Fascists 🛠️",
    Liars: "Liars 🤥",
    Army: "Army ⚔️",
  };
  const roleAlignment = mapAlignmentToText[roleData?.alignment];
  const roleTags = roleData?.tags ? roleData.tags.sort().join(", ") : "";

  const DescriptionLines = (
    <Stack direction="column" spacing={1}>
      {roleData?.description?.map((text, i) => (
        <Stack
          direction="row"
          spacing={1}
          key={i}
          sx={{ alignItems: "center" }}
        >
          <i className={"fas fa-info-circle"} />
          <Typography>{text}</Typography>
        </Stack>
      ))}
    </Stack>
  );

  const hasModifiers = roleData?.modifiers?.length;
  const Modifiers = hasModifiers ? (
    <Stack direction="column" spacing={1}>
      {roleData?.modifiers?.map((modifier, index) => (
        <Stack
          direction="row"
          spacing={1}
          key={modifier.name + index}
          sx={{ alignItems: "center" }}
        >
          <i className={`modifier modifier-${gameType}-${modifier.name}`} />
          <Typography>
            <span style={{ fontWeight: "bold" }}>{modifier.name}</span>:{" "}
            {roleData?.SpecialInteractionsModifiers &&
            roleData?.SpecialInteractionsModifiers[modifier.name]
              ? roleData?.SpecialInteractionsModifiers[modifier.name]
              : roleData?.alignment == "Event" &&
                modifier.eventDescription != null
              ? modifier.eventDescription
              : modifier.description}
          </Typography>
        </Stack>
      ))}
    </Stack>
  ) : (
    ""
  );

  let specials = [];
  let specialRoles = [];
  let otherRolesParsed = otherRoles;
  if (otherRolesParsed && typeof otherRolesParsed == "string") {
    try {
      otherRolesParsed = JSON.parse(otherRolesParsed);
    } catch (e) {
      otherRolesParsed = null;
    }
  }
  if (otherRolesParsed && otherRolesParsed.length > 0) {
    if (roleData?.SpecialInteractions) {
      for (let i in otherRolesParsed) {
        let roleSet = otherRolesParsed[i];
        for (let thing in roleSet) {
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
        <ListItem key={i} sx={{ paddingBottom: "0", paddingTop: "0" }}>
          <ListItemIcon sx={{ minWidth: "0", marginRight: "8px" }}>
            <i
              className={`role role-icon-vivid-${hyphenDelimit(
                gameType
              )}-${hyphenDelimit(special[0])} "small"`}
            />
          </ListItemIcon>
          <ListItemText
            disableTypography
            className={"mui-popover-text"}
            primary={
              <Typography>
                <span style={{ fontWeight: "bold" }}>{special[0]}</span>:{" "}
                {special[1][0]}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  ) : (
    ""
  );

  return (
    <Stack
      direction="column"
      spacing={1}
      divider={<Divider orientation="horizontal" flexItem />}
    >
      {showHeader && (
        <Stack direction="row" spacing={1} alignItems="center">
          <div className={`role role-icon-${roleSkin}-${roleClass}`} />
          <Typography sx={{ fontWeight: "bold" }}>{roleName}</Typography>
        </Stack>
      )}
      <Typography>
        <span style={{ fontWeight: "bold" }}>Alignment</span>: {roleAlignment}
      </Typography>
      <Typography>
        <span style={{ fontWeight: "bold" }}>Tags</span>: {roleTags}
      </Typography>
      {DescriptionLines}
      {Modifiers}
      {SpecialInteractions}
    </Stack>
  );
}

export function RoleCount({
  gameType,
  role,
  count = null,
  roleGroup = null,

  // Should specify alignment if closed
  closed = false,
  alignment = null,

  makeRolePrediction = null,
  onClick = null,
  otherRoles = null,
  skin = null,
  showPopover = true,
  small = false,
  large = false,
}) {
  // Rolename and modifiers are partitioned by colon. A role may have no colon which means it lacks modifiers
  let roleName, modifiers;
  if (typeof role == "string") {
    roleName = role.split(":")[0];
    modifiers = role.split(":")[1] || "";
  } else if (role) {
    roleName = role.name;
    modifiers = role.modifier;
  }

  // Apply skins in order of precendence: skin specified by prop, skin chosen by user, default to vivid
  const user = useContext(UserContext);
  let roleSkin = null;
  if (skin) {
    roleSkin = skin;
  } else if (user.settings && typeof user.settings.roleSkins == "string") {
    const userRoleSkins = user.settings.roleSkins.split(",");
    const userRoleSkinsMatched = userRoleSkins.filter(
      (s) => s.split(":")[0] == roleName
    );
    if (userRoleSkinsMatched.length > 0) {
      roleSkin = userRoleSkinsMatched[0].split(":")[1];
    }
  }
  if (roleSkin === null) {
    roleSkin = "vivid";
  }

  // other roles in the setup provide context for special interactions that may occur
  if (otherRoles) {
    if (typeof otherRoles == "string") {
      otherRoles = JSON.parse(otherRoles);
    } else {
      otherRoles = otherRoles;
    }
  }

  const roleRef = useRef();
  const siteInfo = useContext(SiteInfoContext);
  const [roleData, setRoleData] = useState(null);
  const isPhoneDevice = useIsPhoneDevice();

  const {
    popoverOpen: canOpenPopover,
    openByClick,
    anchorEl,
    handleClick: handlePopoverClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  const handleRoleCountClick = (e) => {
    if (onClick) return onClick();

    if (makeRolePrediction) {
      makeRolePrediction(role);
      return;
    }

    if (!alignment && (!roleName || !showPopover || roleName === "null"))
      return;

    handlePopoverClick(e);
  };

  useEffect(() => {
    setRoleData({
      ...siteInfo.rolesRaw[gameType][roleName],
      modifiers: siteInfo.modifiers[gameType].filter((m) =>
        modifiers?.split("/").includes(m.name)
      ),
    });
  }, [siteInfo, roleName]);

  const roleClass = roleName
    ? `${hyphenDelimit(gameType)}-${hyphenDelimit(roleName)}`
    : "null";

  const digits = count ? count.toString().split("") : [];

  const popoverDisabled = !showPopover || (roleClass == "null" && !alignment);
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
    Host: "Host 🎤",
    Liberals: "Liberals 🇺🇸",
    Fascists: "Fascists 🛠️",
    Liars: "Liars 🤥",
    Army: "Army ⚔️",
  };
  const roleAlignment = mapAlignmentToText[roleData?.alignment];
  const roleTags = roleData?.tags ? roleData.tags.sort().join(", ") : "";
  const hasModifiers = roleData?.modifiers?.length;
  const DescriptionLines = (
    <Stack direction="column" spacing={1}>
      {roleData?.description?.map((text, i) => (
        <Stack
          direction="row"
          spacing={1}
          key={i}
          sx={{
            alignItems: "center",
          }}
        >
          <i className={"fas fa-info-circle"} />
          <Typography>{text}</Typography>
        </Stack>
      ))}
    </Stack>
  );
  const Modifiers = hasModifiers ? (
    <Stack direction="column" spacing={1}>
      {roleData?.modifiers?.map((modifier, i) => (
        <Stack
          direction="row"
          spacing={1}
          key={modifier.name}
          sx={{
            alignItems: "center",
          }}
        >
          <i className={`modifier modifier-${gameType}-${modifier.name}`} />
          <Typography>
            <span style={{ fontWeight: "bold" }}>{modifier.name}</span>:{" "}
            {roleData?.SpecialInteractionsModifiers &&
            roleData?.SpecialInteractionsModifiers[modifier.name]
              ? roleData?.SpecialInteractionsModifiers[modifier.name]
              : roleData?.alignment == "Event" &&
                modifier.eventDescription != null
              ? modifier.eventDescription
              : modifier.description}
          </Typography>
        </Stack>
      ))}
    </Stack>
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
                gameType
              )}-${hyphenDelimit(special[0])} "small"`}
            />
          </ListItemIcon>
          <ListItemText
            disableTypography
            className={"mui-popover-text"}
            primary={
              <Typography>
                <span style={{ fontWeight: "bold" }}>{special[0]}</span>:{" "}
                {special[1][0]}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  ) : (
    ""
  );

  const popoverProps = {
    "aria-owns": popoverOpen ? "mouse-over-popover" : undefined,
    "aria-haspopup": "true",
    onClick: handleRoleCountClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  let layoutContent,
    popoverTitle = null,
    popoverContent = null,
    popoverPage = null,
    popoverIcon = null;
  if (closed) {
    popoverTitle = `${alignment} roleset`;
    popoverContent = (
      <SmallRoleList
        roles={Object.keys(roleGroup)}
        gameType={gameType}
        otherRoles={otherRoles}
      />
    );
    layoutContent = (
      <div className="role-count-wrap closed-role-count" {...popoverProps}>
        <DigitsCount digits={digits} />
        <i className={`fas fa-question i-${alignment}`} onClick={onClick} />
      </div>
    );
  } else if (roleGroup) {
    const roles = Object.keys(roleGroup);
    let roleGroupAlignment = null;
    if (roles.length > 0) {
      const firstRole = siteInfo.rolesRaw[gameType][roles[0].split(":")[0]];
      roleGroupAlignment = firstRole ? firstRole.alignment : null;
    }
    popoverTitle = `Role group ${roleName}`;
    popoverContent = (
      <SmallRoleList
        roles={Object.keys(roleGroup)}
        gameType={gameType}
        otherRoles={otherRoles}
      />
    );
    layoutContent = (
      <div className="role-count-wrap closed-role-count" {...popoverProps}>
        <DigitsCount digits={digits} />
        <Typography
          sx={{
            lineHeight: 1,
            fontFamily: "RobotoSlab",
            fontSize: "2rem",
            fontWeight: "bold",
            userSelect: "none",
            textShadow: "0 .04rem 0 #000",
            color: getAlignmentColor(roleGroupAlignment),
          }}
        >
          {role}
        </Typography>
      </div>
    );
  } else if (!closed) {
    popoverTitle = roleName;
    popoverContent = (
      <Stack
        direction="column"
        spacing={1}
        divider={<Divider orientation="horizontal" flexItem />}
      >
        <Typography>
          <span style={{ fontWeight: "bold" }}>Alignment</span>: {roleAlignment}
        </Typography>
        <Typography>
          <span style={{ fontWeight: "bold" }}>Tags</span>: {roleTags}
        </Typography>
        {DescriptionLines}
        {Modifiers}
        {SpecialInteractions}
      </Stack>
    );
    popoverPage = `/learn/role/${roleName}`;
    popoverIcon = <div className={`role role-icon-${roleSkin}-${roleClass}`} />;

    // Determine which modifier icon to display
    let modifierIcon = null;
    if (modifiers && modifiers.trim()) {
      const modifierCount = roleData?.modifiers?.length || 0;
      if (modifierCount === 1) {
        // Show the actual modifier icon
        const firstModifier = roleData.modifiers[0];
        modifierIcon = (
          <div
            className={`modifier modifier-${gameType}-${firstModifier.name}`}
          />
        );
      } else if (modifierCount === 2) {
        // Show modified-twice icon
        modifierIcon = <div className="modifier-modified-twice" />;
      } else if (modifierCount >= 3) {
        // Show modified-thrice icon
        modifierIcon = <div className="modifier-modified-thrice" />;
      }
    }

    layoutContent = (
      <div
        {...popoverProps}
        style={{
          cursor: makeRolePrediction ? "pointer" : "default",
        }}
      >
        <div
          className={`role role-icon-${roleSkin}-${roleClass} ${
            small ? "small" : large ? "large" : ""
          }`}
          ref={roleRef}
        >
          {count > 1 && <DigitsCount digits={digits} />}
          {modifierIcon}
        </div>
      </div>
    );
  } else {
    return <></>;
  }

  return (
    <>
      {layoutContent}
      <Popover
        open={popoverOpen}
        sx={{ pointerEvents: openByClick ? "auto" : "none" }}
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
        <PopoverContent
          title={popoverTitle}
          content={popoverContent}
          page={popoverPage}
          icon={popoverIcon}
        />
      </Popover>
    </>
  );
}

export function ModifierCount(props) {
  const iconLength = props.iconLength || undefined;
  const roleRef = useRef();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  //const [roleData, setRoleData] = useState(null);
  const isPhoneDevice = useIsPhoneDevice();

  const {
    popoverOpen: canOpenPopover,
    openByClick,
    anchorEl,
    handleClick: handlePopoverClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  const handleRoleCountClick = (e) => {
    if (props.onClick) return props.onClick();

    if (!roleName || props.showPopover == false || roleName === "null") return;

    handlePopoverClick(e);
  };

  var roleName;

  if (typeof props.role == "string") {
    roleName = props.role.split(":")[0];
  } else if (props.role) {
    roleName = props.role.name;
  }
  /*
  useEffect(() => {
    setRoleData({
      ...siteInfo.modifiers[props.gameType][roleName],
    });
  }, [siteInfo, roleName]);
*/
  let tempData = null;
  if (siteInfo.modifiers[props.gameType].filter((t) => t.name == roleName)) {
    tempData = siteInfo.modifiers[props.gameType].filter(
      (t) => t.name == roleName
    )[0];
  } else {
    tempData = siteInfo.modifiers[props.gameType]["Disloyal"];
  }
  const roleData = tempData;

  const roleClass = roleName
    ? `${hyphenDelimit(props.gameType)}-${hyphenDelimit(roleName)}`
    : "null";

  const digits =
    props.count && !props.hideCount ? props.count.toString().split("") : "";

  const popoverDisabled = Boolean(props.showPopover === false);
  const popoverOpen = !popoverDisabled && canOpenPopover;
  const roleTags = roleData?.tags ? roleData.tags.sort().join(", ") : "";
  const DescriptionLines = (
    <List dense sx={{ ...{ paddingTop: "0" } }}>
      {[roleData?.description].map((text, i) => (
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

  return (
    <>
      <div
        className={`modifier modifier-${roleClass}`}
        aria-owns={popoverOpen ? "mouse-over-popover" : undefined}
        aria-haspopup="true"
        onClick={handleRoleCountClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          height: iconLength,
          width: iconLength,
        }}
      >
        {props.count > 1 && <DigitsCount digits={digits} />}
      </div>
      <div>
        <Popover
          open={props.showPopover !== false && popoverOpen}
          sx={{ pointerEvents: openByClick ? "auto" : "none" }}
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
              <Stack direction="row" spacing={1} alignItems="center">
                <div className={`modifier modifier-${roleClass}`} />
                <Typography>{roleName}</Typography>
              </Stack>
            </div>
            <div style={{ margin: "3px" }}>
              <div>
                <span style={{ fontWeight: "bold" }}>Tags</span>: {roleTags}
              </div>
              {DescriptionLines}
            </div>
          </div>
        </Popover>
      </div>
    </>
  );
}

export function GameSettingCount(props) {
  const iconLength = props.iconLength || undefined;
  const roleRef = useRef();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  //const [roleData, setRoleData] = useState(null);
  const isPhoneDevice = useIsPhoneDevice();

  const {
    popoverOpen: canOpenPopover,
    openByClick,
    anchorEl,
    handleClick: handlePopoverClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  const handleRoleCountClick = (e) => {
    if (props.onClick) return props.onClick();

    if (!roleName || props.showPopover == false || roleName === "null") return;

    handlePopoverClick(e);
  };

  var roleName;

  if (typeof props.role == "string") {
    roleName = props.role.split(":")[0];
  } else if (props.role) {
    roleName = props.role.name;
  }
  /*
  useEffect(() => {
    setRoleData({
      ...siteInfo.modifiers[props.gameType][roleName],
    });
  }, [siteInfo, roleName]);
*/
  let tempData = null;
  if (siteInfo.gamesettings[props.gameType].filter((t) => t.name == roleName)) {
    tempData = siteInfo.gamesettings[props.gameType].filter(
      (t) => t.name == roleName
    )[0];
  } else {
    tempData = siteInfo.gamesettings[props.gameType]["Day Start"];
  }
  const roleData = tempData;

  const roleClass = roleName ? `${hyphenDelimit(roleName)}` : "null";

  const digits =
    props.count && !props.hideCount ? props.count.toString().split("") : "";

  const popoverDisabled = Boolean(props.showPopover === false);
  const popoverOpen = !popoverDisabled && canOpenPopover;
  const roleTags = roleData?.tags ? roleData.tags.sort().join(", ") : "";
  const DescriptionLines = (
    <List dense sx={{ ...{ paddingTop: "0" } }}>
      {[roleData?.description].map((text, i) => (
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

  return (
    <>
      <div
        className={`gamesetting gamesetting-${roleClass}`}
        aria-owns={popoverOpen ? "mouse-over-popover" : undefined}
        aria-haspopup="true"
        onClick={handleRoleCountClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          height: iconLength,
          width: iconLength,
        }}
      >
        {props.count > 1 ? <DigitsCount digits={digits} /> : ""}
      </div>
      <div>
        <Popover
          open={props.showPopover !== false && popoverOpen}
          sx={{ pointerEvents: openByClick ? "auto" : "none" }}
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
              <Stack direction="row" spacing={1} alignItems="center">
                <div className={`gamesetting gamesetting-${roleClass}`} />
                <Typography>{roleName}</Typography>
              </Stack>
            </div>
            <div style={{ margin: "3px" }}>
              <div>
                <span style={{ fontWeight: "bold" }}>Tags</span>: {roleTags}
              </div>
              {DescriptionLines}
            </div>
          </div>
        </Popover>
      </div>
    </>
  );
}

function DigitsCount(props) {
  const digits = props.digits;
  return (
    <>
      <div className="digits-wrapper">
        {digits.map((digit, index) => (
          <div key={digit} className={`digit digit-${digit}`}></div>
        ))}
      </div>
    </>
  );
}

export function RoleCell(props) {
  const iconLength = props.iconLength || "2em";
  const role = props.role;
  const icon = props.icon;
  const onAddClick = props.onAddClick;
  const onDelClick = props.onDelClick;

  const siteInfo = useContext(SiteInfoContext);
  const user = useContext(UserContext);
  const roleCellRef = useRef();
  const isPhoneDevice = useIsPhoneDevice();

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

  return (
    <Paper
      variant="outlined"
      className="role-cell"
      key={role.name}
      sx={{
        p: isPhoneDevice ? 0.5 : 1,
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

export function RoleSearch(props) {
  const [roleListType, setRoleListType] = useState(
    Alignments[props.gameType][0]
  );
  const [searchVal, setSearchVal] = useState("");
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

  function onAlignNavClick(alignment) {
    setSearchVal("");
    setRoleListType(alignment);
  }

  const roleAbbreviations = {
    blue: ["Villager"],
    nilla: ["Villager", "Mafioso"],
    gs: ["Gunsmith"],
    gf: ["Godfather"],
    bs: ["Blacksmith"],
    orc: ["Oracle"],
    ww: ["Werewolf", "Hellhound"],
    hh: ["Hellhound"],
    bg: ["Bodyguard"],
    cl: ["Cult Leader"],
    gr: ["Graverobber"],
    hb: ["Heartbreaker"],
    lk: ["Lightkeeper"],
    lm: ["Loudmouth"],
    mm: ["Mastermind"],
    ph: ["Party Host"],
    sk: ["Serial Killer"],
    sw: ["Sleepwalker"],
    tc: ["Town Crier"],
    tl: ["Tea Lady"],
    rh: ["Robin Hood"],
    hk: ["Housekeeper"],
  };

  function onSearchInput(query) {
    setSearchVal(query.toLowerCase());

    if (query !== "" && roleListType.length > 0) setRoleListType("");
    else if (query === "" && roleListType.length === 0)
      setRoleListType(Alignments[props.gameType][0]);
  }

  const alignButtons = Alignments[props.gameType].map((type) => (
    <Tab
      label={type}
      value={type}
      onClick={() => onAlignNavClick(type)}
      key={type}
    />
  ));

  if (!siteInfo.roles) return <NewLoading small />;

  const roleCells = useMemo(
    () =>
      siteInfo.roles[props.gameType].map((role, i) => {
        const searchTerms = searchVal
          .split(",")
          .filter((term) => term.trim() !== "")
          .map((term) => term.trim().toLowerCase());

        const matchesSearch =
          searchTerms.length === 0 ||
          searchTerms.some(
            (term) =>
              role.name.toLowerCase().includes(term) ||
              role.tags.join("").toLowerCase().includes(term) ||
              Object.entries(roleAbbreviations).some(
                ([shortcut, roleNames]) =>
                  shortcut === term && roleNames.includes(role.name)
              )
          );

        if (
          !role.disabled &&
          (role.alignment === roleListType ||
            (searchVal.length > 0 &&
              (role.name.toLowerCase().indexOf(searchVal) !== -1 ||
                matchesSearch)))
        ) {
          return (
            <Grid2 size={{ xs: 2 }} key={role.name}>
              <RoleCell
                onAddClick={props.onAddClick}
                role={role}
                icon={<RoleCount role={role.name} gameType={props.gameType} />}
              />
            </Grid2>
          );
        }
      }),
    [searchVal, roleListType, props.onAddClick, props.gameType]
  );

  return (
    <Stack direction="column">
      <Stack direction={isPhoneDevice ? "column-reverse" : "row"} spacing={1}>
        <Tabs
          value={roleListType}
          onChange={(_, value) => setRoleListType(value)}
        >
          {alignButtons}
        </Tabs>
        <Box sx={{ ml: isPhoneDevice ? undefined : "auto !important" }}>
          <SearchBar
            value={searchVal}
            placeholder="🔎 Role Name"
            onInput={onSearchInput}
          />
        </Box>
      </Stack>
      <Divider direction="horizontal" sx={{ mb: 1 }} />
      <Paper sx={{ p: 1 }}>
        <Grid2 container spacing={1} columns={{ xs: 4, sm: 6, md: 8 }}>
          {roleCells}
        </Grid2>
      </Paper>
    </Stack>
  );
}

export function ModifierSearch(props) {
  const [roleListType, setRoleListType] = useState("Items");

  const [searchVal, setSearchVal] = useState("");
  const roleCellRefs = useRef([]);
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

  function onAlignNavClick(alignment) {
    setSearchVal("");
    setRoleListType(alignment);
  }

  function onSearchInput(query) {
    setSearchVal(query.toLowerCase());

    if (query !== "" && roleListType.length > 0) setRoleListType("");
    else if (query === "" && roleListType.length === 0)
      setRoleListType("Items");
  }

  function getCompatibleModifiersOther(mods) {
    if (!mods) {
      mods = [];
    }
    mods = mods.map((m) => m.name);
    const mappedMods = siteInfo.modifiers[props.gameType].filter((t) =>
      mods.includes(t.name)
    );
    let temp = [];
    for (let mod of mappedMods) {
      if (mod && mod.incompatible) {
        temp.push(...mod.incompatible);
      }
    }
    const incompatibles = temp;
    const modifierOptions = siteInfo.modifiers[props.gameType]
      .filter((e) => !e.hidden)
      .filter((e) => e.allowDuplicate || !mods.includes(e.name))
      .filter((e) => !incompatibles.includes(e.name))
      .map((modifier) => modifier.name);
    return modifierOptions;
  }

  if (!siteInfo.modifiers) return <NewLoading small />;

  const alignButtons = ["Items", "Visits", "Appearance", "Chat", "Other"].map(
    (type) => (
      <Tab
        label={type}
        value={type}
        onClick={() => onAlignNavClick(type)}
        key={type}
      />
    )
  );

  const roleCells = siteInfo.modifiers[props.gameType].map((role, i) => {
    const searchTerms = searchVal
      .split(",")
      .filter((term) => term.trim() !== "")
      .map((term) => term.trim().toLowerCase());

    const matchesSearch =
      searchTerms.length === 0 ||
      searchTerms.some(
        (term) =>
          role.name.toLowerCase().includes(term) ||
          role.tags.join("").toLowerCase().includes(term)
        /*
          ||
          Object.entries(roleAbbreviations).some(
            ([shortcut, roleNames]) =>
              shortcut === term && roleNames.includes(role.name)
          )
          */
      );

    if (
      !role.disabled &&
      getCompatibleModifiersOther(props.curMods).includes(role.name) &&
      (role.category === roleListType ||
        (searchVal.length > 0 &&
          (role.name.toLowerCase().indexOf(searchVal) !== -1 || matchesSearch)))
    ) {
      return (
        <Grid2 size={{ xs: 2 }} key={role.name}>
          <RoleCell
            onAddClick={props.onAddClick}
            role={role}
            icon={
              <ModifierCount
                iconLength="2em"
                role={role.name}
                gameType={props.gameType}
              />
            }
          />
        </Grid2>
      );
    }
  });

  return (
    <Stack direction="column" spacing={1}>
      <Stack direction={isPhoneDevice ? "column-reverse" : "row"} spacing={1}>
        <Tabs
          value={roleListType}
          onChange={(_, value) => setRoleListType(value)}
        >
          {alignButtons}
        </Tabs>
        <Box sx={{ ml: isPhoneDevice ? undefined : "auto !important" }}>
          <SearchBar
            value={searchVal}
            placeholder="🔎 Modifier Name"
            onInput={onSearchInput}
          />
        </Box>
      </Stack>
      <Divider direction="horizontal" sx={{ mb: 1 }} />
      <Paper sx={{ p: 1 }}>
        <Grid2 container spacing={1} columns={{ xs: 2, sm: 6, md: 8 }}>
          {roleCells}
        </Grid2>
      </Paper>
    </Stack>
  );
}

export function GameSettingSearch(props) {
  const [roleListType, setRoleListType] = useState("Standard");

  const [searchVal, setSearchVal] = useState("");
  const roleCellRefs = useRef([]);
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

  function onAlignNavClick(alignment) {
    setSearchVal("");
    setRoleListType(alignment);
  }

  function onSearchInput(query) {
    setSearchVal(query.toLowerCase());

    if (query !== "" && roleListType.length > 0) setRoleListType("");
    else if (query === "" && roleListType.length === 0)
      setRoleListType("Standard");
  }

  function getCompatibleGameSettingsOther(mods) {
    if (!mods) {
      mods = {};
    }
    const mappedMods = siteInfo.gamesettings[props.gameType].filter(
      (t) => t.name in mods
    );
    let temp = [];
    for (let mod of mappedMods) {
      if (mod && mod.incompatible) {
        temp.push(...mod.incompatible);
      }
    }
    const incompatibles = temp;
    const modifierOptions = siteInfo.gamesettings[props.gameType]
      .filter((e) => !e.hidden)
      .filter((e) => e.allowDuplicate || !(e.name in mods))
      .filter((e) => !incompatibles.includes(e.name))
      .map((modifier) => modifier.name);
    return modifierOptions;
  }

  if (!siteInfo.gamesettings) return <NewLoading small />;

  const alignButtons = ["Standard", "Voting", "Timer", "Other"].map((type) => (
    <Tab
      label={type}
      value={type}
      onClick={() => onAlignNavClick(type)}
      key={type}
    />
  ));

  const roleCells = siteInfo.gamesettings[props.gameType].map((role, i) => {
    const searchTerms = searchVal
      .split(",")
      .filter((term) => term.trim() !== "")
      .map((term) => term.trim().toLowerCase());

    const matchesSearch =
      searchTerms.length === 0 ||
      searchTerms.some(
        (term) =>
          role.name.toLowerCase().includes(term) ||
          role.tags.join("").toLowerCase().includes(term)
        /*
          ||
          Object.entries(roleAbbreviations).some(
            ([shortcut, roleNames]) =>
              shortcut === term && roleNames.includes(role.name)
          )
          */
      );

    if (
      !role.disabled &&
      getCompatibleGameSettingsOther(props.curMods).includes(role.name) &&
      (role.category === roleListType ||
        (searchVal.length > 0 &&
          (role.name.toLowerCase().indexOf(searchVal) !== -1 || matchesSearch)))
    ) {
      return (
        <Grid2 size={{ xs: 2 }} key={role.name}>
          <RoleCell
            onAddClick={props.onAddClick}
            role={role}
            icon={
              <GameSettingCount
                iconLength="2em"
                role={role.name}
                gameType={props.gameType}
              />
            }
          />
        </Grid2>
      );
    }
  });

  return (
    <Stack direction="column" spacing={1}>
      <Stack direction={isPhoneDevice ? "column-reverse" : "row"} spacing={1}>
        <Tabs
          value={roleListType}
          onChange={(_, value) => setRoleListType(value)}
        >
          {alignButtons}
        </Tabs>
        <Box sx={{ ml: isPhoneDevice ? undefined : "auto !important" }}>
          <SearchBar
            value={searchVal}
            placeholder="🔎 Game Setting Name"
            onInput={onSearchInput}
          />
        </Box>
      </Stack>
      <Divider direction="horizontal" sx={{ mb: 1 }} />
      <Paper sx={{ p: 1 }}>
        <Grid2 container spacing={1} columns={{ xs: 2, sm: 6, md: 8 }}>
          {roleCells}
        </Grid2>
      </Paper>
    </Stack>
  );
}

function RoleBanners(props) {
  const newlyAdded = props.newlyAdded;
  const recentlyUpdated = props.recentlyUpdated;
  const featured = props.featured;

  var banners = [];
  if (newlyAdded) {
    banners.push(<RoleBanner key="newlyAdded" type="newlyAdded" text="new" />);
  }

  if (recentlyUpdated) {
    banners.push(
      <RoleBanner
        key="recentlyUpdated"
        type="recentlyUpdated"
        text={<i className="fas fa-sync" />}
      />
    );
  }

  if (featured) {
    banners.push(
      <RoleBanner
        key="featured"
        type="featured"
        text={<i className="fas fa-star" />}
      />
    );
  }

  return (
    <>
      <div className="role-banner-wrapper">
        <div className="role-banners">{banners}</div>
      </div>
    </>
  );
}

function RoleBanner(props) {
  const text = props.text;
  const type = props.type;

  return (
    <>
      <div className={`role-banner ${type}`}>
        <div className="role-banner-text">{text}</div>
      </div>
    </>
  );
}

// Inline role mention with icon, themed text, and popover
export function InlineRoleMention({
  roleName,
  gameType = "Mafia",
  textStyle = {},
}) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const {
    popoverOpen: canOpenPopover,
    openByClick,
    anchorEl,
    handleClick: handlePopoverClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  // Determine role skin same precedence as RoleCount
  let roleSkin = null;
  if (user.settings && typeof user.settings.roleSkins == "string") {
    const userRoleSkins = user.settings.roleSkins.split(",");
    const userRoleSkinsMatched = userRoleSkins.filter(
      (s) => s.split(":")[0] == roleName
    );
    if (userRoleSkinsMatched.length > 0) {
      roleSkin = userRoleSkinsMatched[0].split(":")[1];
    }
  }
  if (roleSkin === null) {
    roleSkin = "vivid";
  }

  const baseRoleData = siteInfo.rolesRaw?.[gameType]?.[roleName] || {};
  const roleClass = roleName
    ? `${hyphenDelimit(gameType)}-${hyphenDelimit(roleName)}`
    : "null";
  const popoverOpen = canOpenPopover && roleClass !== "null";

  const popoverIcon = (
    <div className={`role role-icon-${roleSkin}-${roleClass}`} />
  );

  return (
    <>
      <span
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          verticalAlign: "baseline",
        }}
      >
        <div
          className={`role role-icon-${roleSkin}-${roleClass}`}
          style={{
            width: "1rem",
            height: "1rem",
            marginRight: 4,
            backgroundSize: "100% 100%",
            display: "inline-block",
            verticalAlign: "baseline",
          }}
        />
        <span
          aria-owns={popoverOpen ? "mouse-over-popover" : undefined}
          aria-haspopup="true"
          onClick={handlePopoverClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            verticalAlign: "baseline",
            lineHeight: "inherit",
          }}
        >
          <span
            style={{
              color: "var(--mui-palette-primary-main)",
              fontWeight: 600,
              verticalAlign: "baseline",
              ...textStyle,
            }}
          >
            {roleName}
          </span>
        </span>
      </span>

      <Popover
        open={popoverOpen}
        sx={{ pointerEvents: openByClick ? "auto" : "none" }}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={closePopover}
        disableScrollLock
        disableRestoreFocus
      >
        <PopoverContent
          title={roleName}
          content={
            <RoleDetails
              gameType={gameType}
              roleName={roleName}
              showHeader={false}
            />
          }
          page={`/learn/role/${roleName}`}
          icon={popoverIcon}
        />
      </Popover>
    </>
  );
}
