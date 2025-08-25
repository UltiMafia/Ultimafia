import React, { useContext, useRef, useState } from "react";

import { PopoverContext, UserContext, SiteInfoContext } from "Contexts";
import { Alignments } from "Constants";
import { RoleCount } from "components/Roles";
import { filterProfanity } from "components/Basic";
import { SearchBar } from "components/Nav";
import { hyphenDelimit } from "utils";

import {
  Box,
  Card,
  Divider,
  Grid,
  Stack,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/styles";

import "css/setup.css";
import "css/roles.css";

const ICON_WIDTH = 30;
const ICON_LIST_PADDING = 8;

export default function Setup(props) {
  const user = useContext(UserContext);
  const popover = useContext(PopoverContext);
  const setupRef = useRef();
  const [setupIndex, setSetupIndex] = useState(0);

  if (typeof props.setup.roles == "string")
    props.setup.roles = JSON.parse(props.setup.roles);

  const backgroundColor = props.backgroundColor || undefined;
  const maxRolesCount = props.maxRolesCount || 50;
  const classList = props.classList || "";
  const disablePopover = props.disablePopover;
  const small = props.small ?? true;
  const fixedWidth = props.fixedWidth || false; // Should the component always be the same size for the same maxRolesCount?
  const useRoleGroups = props.setup.useRoleGroups;
  const multi =
    (!props.setup.closed || useRoleGroups) &&
    !useRoleGroups &&
    props.setup.roles.length > 1;

  // Calculate the width if fixedWidth is set. This must be adjusted every time that the layout is adjusted.
  var width = null;
  if (fixedWidth) {
    // Two instances of padding
    // maxRolesCount instances of role icons
    // one instance of ellipses icon plus 5px of its margin
    width = ICON_LIST_PADDING * 2 + ICON_WIDTH * maxRolesCount + 5;
  }

  var roleCounts = [];
  var overSize = false;

  if (props.setup.closed && !useRoleGroups) {
    for (let alignment of Alignments[props.setup.gameType]) {
      roleCounts.push(
        <RoleCount
          closed
          alignment={alignment}
          count={props.setup.count[alignment]}
          gameType={props.setup.gameType}
          key={alignment}
          otherRoles={props.setup.roles}
        />
      );
    }
  } else if (useRoleGroups) {
    for (let roleGroup in props.setup.roles) {
      if (roleCounts.length >= maxRolesCount) {
        overSize = true;
        break;
      }
      const roleGroupData = props.setup.roles[roleGroup];
      roleCounts.push(
        <RoleCount
          key={JSON.stringify(props.setup.roles[roleGroup])}
          count={props.setup.roleGroupSizes[roleGroup]}
          showPopover
          small={small}
          role={Object.keys(roleGroupData)[0]}
          roleGroup={roleGroupData}
          gameType={props.setup.gameType}
          otherRoles={props.setup.roles}
        />
      );
    }
  } else {
    selectSetup(setupIndex);
  }

  function selectSetup(index) {
    let roleNames = Object.keys(props.setup.roles[index]);
    roleCounts = roleNames.map((role) => (
      <RoleCount
        small={small}
        role={role}
        count={props.setup.roles[index][role]}
        gameType={props.setup.gameType}
        key={role}
        otherRoles={props.setup.roles}
      />
    ));
  }

  function onClick({ ref = null }) {
    if (disablePopover) {
      return;
    }

    popover.onClick(
      `/api/setup/${props.setup.id}`,
      "setup",
      ref ? ref.current : setupRef.current,
      filterProfanity(props.setup.name, user.settings),
      (data) => (data.roles = JSON.parse(data.roles))
    );
  }

  function cycleSetups() {
    if (setupIndex < props.setup.roles.length - 1) {
      setSetupIndex(setupIndex + 1);
    } else {
      setSetupIndex(0);
    }
  }

  if (multi) {
    roleCounts.unshift(
      <i onClick={cycleSetups} className="fas fa-list-alt" key="multi" />
    );
  }

  if (roleCounts.length > maxRolesCount) {
    roleCounts = roleCounts.slice(0, maxRolesCount);
    overSize = true;
  }

  if (overSize) {
    roleCounts[maxRolesCount - 1] = (
      <i
        onClick={onClick}
        gameType={props.setup.gameType}
        className="fas fa-ellipsis-h"
        style={{
          alignSelf: "flex-end",
          marginLeft: "5px",
          cursor: "pointer",
        }}
        key="ellipses"
      />
    );
  }

  const displayedIcons = roleCounts.map((item) => {
    return (
      <Grid
        size={1}
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="30px"
        width="30px"
        key={`grid-${item.key}`}
      >
        {item}
      </Grid>
    );
  });

  return (
    <Card
      variant="outlined"
      className={"setup " + classList}
      ref={setupRef}
      style={{ backgroundColor: backgroundColor }}
    >
      <GameIcon revealPopover={onClick} gameType={props.setup.gameType} />
      <Divider orientation="vertical" flexItem />
      <Box
        sx={{
          width: width ? `${width}px` : undefined,
        }}
      >
        <Stack
          direction="column"
          sx={{
            padding: "8px",
          }}
        >
          <Typography variant="body2" className="setup-name">
            {filterProfanity(props.setup.name, user.settings)}
          </Typography>
          <Grid container>{displayedIcons}</Grid>
        </Stack>
      </Box>
    </Card>
  );
}

export function determineSetupType(setup) {
  const isMulti = setup.roles.length > 1;
  if (setup.closed) {
    if (setup.useRoleGroups) {
      return "Closed (groups)";
    }
    else {
      return "Closed (whole)";
    }
  }
  else {
    if (isMulti) {
      return "Closed (multi-set)";
    }
    else {
      return "Open";
    }
  }
}

export function getAlignmentColor(alignment) {
    if (alignment === "Village") {
      return "#66adff";
    }
    else if (alignment === "Mafia") {
      return "#505d66";
    }
    else if (alignment === "Cult") {
      return "#b161d3";
    }
    else if (alignment === "Independent") {
      return "#c7ce48";
    }
    else {
      return "#808080";
    }
}

export function SmallRoleList(props) {
  const includeSearchBar = props.includeSearchBar || false;

  const [searchVal, setSearchVal] = useState("");

  var roles = props.roles;
  if (!Array.isArray(props.roles)) {
    roles = Object.keys(props.roles);
  }

  const roleList = roles.map((role) => {
    if (searchVal && role && !role.toLowerCase().includes(searchVal))
      return null;
    return (
      <RoleCount
        role={role}
        makeRolePrediction={props.makeRolePrediction}
        count={props.roles[role]}
        small={true}
        gameType={props.gameType}
        showSecondaryHover
        key={role}
        otherRoles={props.otherRoles ? props.otherRoles : props.setup?.roles}
      />
    );
  });

  function onSearchInput(query) {
    setSearchVal(query.toLowerCase());
  }

  return (
    <Stack direction="column" spacing={1}>
      {includeSearchBar && (
        <SearchBar
          value={searchVal}
          placeholder="🔎 Role Name"
          onInput={onSearchInput}
        />
      )}
      <div
        className="small-role-list"
        style={{
          borderTop: includeSearchBar ? undefined : "1px solid #d6d6d6",
        }}
      >
        {props.title} {roleList}
      </div>
    </Stack>
  );
}

const ALIGNMENT_ORDER = [
  "Village", "Independent", "Mafia", "Cult"
];

const INDEXED_ROLE_GROUP_LABELS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD",
  "AE", "AF", "AG", "AH", "AI", "AJ", "AK", "AL", "AM", "AN",
  "AO", "AP", "AQ", "AR", "AS", "AT", "AU", "AV", "AW", "AX",
];

export function FullRoleList({ setup }) {
  const roles = setup.roles;
  const gameType = setup.gameType;

  const siteInfo = useContext(SiteInfoContext);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
 
  var rolesDividedByAlignment = {};
  const events = [];
  for (let i in roles) {
    for (let role in roles[i]) {
      let roleName = role.split(":")[0];

      for (let roleObj of siteInfo.roles[gameType]) {
        if (roleObj.name === roleName) {
          const alignment = roleObj.alignment;

          if (alignment === "Event") {
            events[role] = roles[i][role];
            continue;
          }

          if (!rolesDividedByAlignment[i]) rolesDividedByAlignment[i] = {};
          if (!rolesDividedByAlignment[i][alignment]) rolesDividedByAlignment[i][alignment] = {};

          rolesDividedByAlignment[i][alignment][role] = roles[i][role];
        }
      }
    }
  }

  // holy fricken FREAK this is a 3-dimensional effort
  const rolesetAlignments = Object.keys(rolesDividedByAlignment).map(i => {
    const alignmentKeys = Object.keys(rolesDividedByAlignment[i]);
    const gridItemSize = isSmallScreen ? 12 : (12 / alignmentKeys.length);
    var sectionName = setup.roles.length > 1 ? INDEXED_ROLE_GROUP_LABELS[i] : null;
    if (sectionName && setup.useRoleGroups) {
      sectionName += `:${setup.roleGroupSizes[i]}`;
    }

    const alignmentRoles = ALIGNMENT_ORDER.map(alignment => {
      if (rolesDividedByAlignment[i][alignment] === undefined) {
        return <></>;
      }

      const alignmentColor = getAlignmentColor(alignment);
      const roles = Object.keys(rolesDividedByAlignment[i][alignment]).map(role => (<RoleCount
        role={role}
        count={rolesDividedByAlignment[i][alignment][role]}
        small={true}
        gameType={gameType}
        showSecondaryHover
        key={role}
      />));

      return (<Grid item xs={12} md={gridItemSize}>
        <Stack direction="row" spacing={0} sx={{
          p: 1,
          height: "100%",
          flexWrap: "wrap",
          border: `4px solid ${alignmentColor}`,
          borderRadius: "4px",
          boxSizing: "border-box",
        }}>
          {roles}
        </Stack>
      </Grid>);
    });

    return (
    <Stack direction={isSmallScreen ? "column" : "row"} sx={{
      alignItems: "center",
    }}>
      {sectionName && (<Typography sx={{
        width: "54px",
        fontSize: "24px",
        fontWeight: "600",
        textAlign: "center",
      }}>
        {sectionName}
      </Typography>)}
      <Grid container columns={12} spacing={1}>
        {alignmentRoles}
      </Grid>
    </Stack>
    );
  });

  const eventRoles = Object.keys(events).map(role => (<RoleCount
    role={role}
    count={events[role]}
    small={true}
    gameType={gameType}
    showSecondaryHover
    key={role}
  />));

  return (<Stack
    direction="column"
    spacing={1}
    divider={<Divider orientation="horizontal" flexItem />}
  >
    {rolesetAlignments}
    {eventRoles.length > 0 && (<Stack direction="row" spacing={0} sx={{
      p: 1,
      height: "100%",
      flexWrap: "wrap",
      border: `4px solid #ff481aff`,
      borderRadius: "4px",
      boxSizing: "border-box",
    }}>
      {eventRoles}
    </Stack>)}
  </Stack>);
}

export function GameIcon(props) {
  const gameIconRef = useRef();
  const gameType = hyphenDelimit(props.gameType);

  const revealPopover = () => props.revealPopover({ ref: gameIconRef });
  return (
    <div
      ref={gameIconRef}
      onClick={revealPopover}
      onMouseOver={revealPopover}
      className={`game-icon ${gameType}`}
    />
  );
}

export function GameStateIcon(props) {
  var iconName;

  if (props.state === "Day") iconName = "sun";
  else if (props.state === "Night") iconName = "moon";

  return <i className={`fa-${iconName} fas state-icon`} />;
}
