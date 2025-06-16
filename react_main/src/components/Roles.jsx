import React, { useState, useContext, useRef, useEffect } from "react";
import {
  Link,
} from "react-router-dom";
import { UserContext, SiteInfoContext, PopoverContext } from "../Contexts";
import { SearchBar } from "./Nav";
import { hyphenDelimit } from "../utils";
import { Alignments } from "../Constants";
import { BotBarLink } from "../pages/Play/Play";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { usePopoverOpen } from "../hooks/usePopoverOpen";
import { NewLoading } from "../pages/Welcome/NewLoading";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

export function RoleCount(props) {
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
      makeRolePrediction(roleName);
      popover.close();
      return;
    }

    if (!roleName || props.showPopover == false || roleName === "null") return;

    handlePopoverClick(e);
  };

  // Display predicted icon
  const isRolePrediction = props.isRolePrediction;
  // Choose from list of icons to predict from
  const makeRolePrediction = props.makeRolePrediction;

  var roleName, modifiers, roleSkin;


  if (typeof props.role == "string") {
    roleName = props.role.split(":")[0];
    modifiers = props.role.split(":")[1] || "";
  } else if (props.role) {
    roleName = props.role.name;
    modifiers = props.role.modifier;
  }
let userRoleSkins1;
  if(typeof user.settings.roleSkins == "string"){
userRoleSkins1 = user.settings.roleSkins.split(",");
  }

  let userRoleSkins = null;
  if (userRoleSkins1) {
    userRoleSkins = userRoleSkins1.filter((s) => s.split(":")[0] == roleName);
  }

  if(userRoleSkins && userRoleSkins.length == 1){
    roleSkin = userRoleSkins[0].split(":")[1];
  }
  else{
    roleSkin = "vivid";
  }

  useEffect(() => {
    setRoleData({
      ...siteInfo.rolesRaw[props.gameType][roleName],
      modifiers: siteInfo.modifiers[props.gameType].filter((m) =>
        modifiers?.split("/").includes(m.name)
      ),
    });
  }, [siteInfo, roleName]);

  if (isRolePrediction) {
    modifiers = "Unknown";
  }

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
  const roleTags =  (roleData?.tags) ?  roleData.tags.sort().join(", ") : "";
  const hasModifiers = roleData?.modifiers?.length;
  const DescriptionLines = (
    <List dense sx={{ ...(hasModifiers ? { paddingBottom: 0 } : {}) }}>
      {roleData?.description?.map((text, i) => (
        <ListItem
          key={text + i}
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
          key={modifier.name + i}
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
            <i className={`modifier modifier-${props.gameType}-${modifier.name}`} />
          </ListItemIcon>
          <ListItemText
            disableTypography
            className={"mui-popover-text"}
            primary={
              <div>
                <span style={{ fontWeight: "bold" }}>{modifier.name}</span>:{" "}
                {roleData?.alignment == "Event" &&
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
            className={`role role-icon-${roleSkin}-${roleClass} ${props.small ? "small" : props.large ? "large" : ""} ${props.bg ? "bg" : ""}`}
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
            className={`role role-icon-${roleSkin}-${roleClass} ${props.small ? "small" : props.large ? "large" : ""} ${
              props.bg ? "bg" : ""
            }`}
            ref={roleRef}
          >
            {props.count > 1 && <DigitsCount digits={digits} />}
            {modifiers &&
              modifiers
                .split("/")
                .map((modifier, k) => (
                  <div
                    className={`modifier modifier-pos-${k} modifier-${
                      props.gameType
                    }-${hyphenDelimit(modifier)}`}
                  />
                ))}
          </div>
        </div>
        <div>
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
          >
            <div className={"mui-popover"}>
              <div className={"mui-popover-title"}>
                <div className={`role role-icon-${roleSkin}-${roleClass}`} />
                &nbsp;{<Link to= {`/learn/role/${roleName}`}>{roleName}</Link>}&nbsp;
              </div>
              <div style={{ margin: "6px" }}>
                <div>
                  <span style={{ fontWeight: "bold" }}>Alignment</span>:{" "}
                  {roleAlignment}
                </div>
                <div>
                  <span style={{ fontWeight: "bold" }}>Tags</span>:{" "}
                  {roleTags}
                </div>
                {DescriptionLines}
                {Modifiers}
              </div>
            </div>
          </Popover>
        </div>
      </>
    );
  } else {
    return <></>;
  }
}

function DigitsCount(props) {
  const digits = props.digits;
  return (
    <>
      <div className="digits-wrapper">
        {digits.map((digit, index) => (
          <div key={index} className={`digit digit-${digit}`}></div>
        ))}
      </div>
    </>
  );
}

export function RoleSearch(props) {
  const theme = useTheme();
  const [roleListType, setRoleListType] = useState(
    Alignments[props.gameType][0]
  );
  const [searchVal, setSearchVal] = useState("");
  const roleCellRefs = useRef([]);
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const popover = useContext(PopoverContext);

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

  function onRoleCellClick(roleCellEl, role) {
    popover.onClick(
      Promise.resolve({
        data: {
          roleName: siteInfo.rolesRaw[props.gameType][role.name],
        },
      }),
      "role",
      roleCellEl,
      role.name
    );
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

  const roleCells = siteInfo.roles[props.gameType].map((role, i) => {
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
          (role.name.toLowerCase().indexOf(searchVal) !== -1 || matchesSearch)))
    ) {
      return (
        <Card
          className="role-cell"
          key={role.name}
          sx={{ padding: "4px", margin: "4px" }}
        >
          {user.loggedIn && props.onAddClick && (
            <IconButton
              className="add-role fa-plus-circle fas"
              onClick={(e) => {
                e.stopPropagation();
                props.onAddClick(role);
              }}
              sx={{ padding: "4px", fontSize: "16px" }}
            ></IconButton>
          )}
          <CardContent
            className="role-cell-content"
            onMouseOver={() =>
              null && onRoleCellClick(roleCellRefs.current[i], role)
            }
            ref={(el) => (roleCellRefs.current[i] = el)}
            sx={{ padding: "4px" }}
          >
            <RoleCount
              role={role.name}
              gameType={props.gameType}
              sx={{ fontSize: "14px" }}
            />
            <Typography variant="body2">{role.name}</Typography>
          </CardContent>
          <RoleBanners
            newlyAdded={role.newlyAdded}
            recentlyUpdated={role.recentlyUpdated}
            featured={role.featured}
            sx={{ padding: "2px" }}
          />
        </Card>
      );
    }
  });

  return (
    <Box className="role-list-container">
      <Box className="bot-bar">
        <Tabs
          value={roleListType}
          onChange={(_, value) => setRoleListType(value)}
          centered
        >
          {alignButtons}
        </Tabs>
        <SearchBar
          value={searchVal}
          placeholder="🔎 Role Name"
          onInput={onSearchInput}
        />
      </Box>
      <Box className="role-list">{roleCells}</Box>
    </Box>
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
