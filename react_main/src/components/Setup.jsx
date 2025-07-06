import React, { useContext, useRef, useState } from "react";

import { PopoverContext, UserContext } from "../Contexts";
import { RoleCount } from "./Roles";
import { Alignments } from "../Constants";
import { filterProfanity } from "./Basic";
import { hyphenDelimit } from "../utils";

import { Box, Card, Divider, Grid, Stack, Typography } from "@mui/material";

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
  const multi = (!props.setup.closed || useRoleGroups) && !useRoleGroups && (props.setup.roles.length > 1);

  // Calculate the width if fixedWidth is set. This must be adjusted every time that the layout is adjusted.
  var width = null;
  if (fixedWidth) {
    // Two instances of padding
    // maxRolesCount instances of role icons
    // one instance of ellipses icon plus 5px of its margin
    width = (ICON_LIST_PADDING * 2) + (ICON_WIDTH * maxRolesCount) + 5;
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
      `/setup/${props.setup.id}`,
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
      <i
        onClick={cycleSetups}
        className="fas fa-list-alt"
        key="multi"
      />
    );
  }

  if (roleCounts.length > maxRolesCount) {
    roleCounts = roleCounts.slice(0, maxRolesCount);
    overSize = true;
  }

  if (overSize) {
    roleCounts[maxRolesCount-1] = (
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
    )
  });

  return (
    <Card variant="outlined" className={"setup " + classList} ref={setupRef} style={{ backgroundColor: backgroundColor }}>
      <GameIcon revealPopover={onClick} gameType={props.setup.gameType} />
      <Divider orientation="vertical" flexItem />
      <Box sx={{
        width: width ? `${width}px` : undefined,
      }}>
        <Stack direction="column" sx={{
          padding: "8px",
        }}>
          <Typography variant="body2" className="setup-name">
            {filterProfanity(props.setup.name, user.settings)}
          </Typography>
          <Grid container>
            {displayedIcons}
          </Grid>
        </Stack>
      </Box>
    </Card>
  );
}

export function SmallRoleList(props) {
  var roles;

  if (Array.isArray(props.roles)) {
    roles = props.roles.map((role) => (
      <RoleCount
        small
        role={role}
        makeRolePrediction={props.makeRolePrediction}
        key={role || "null"}
        showSecondaryHover
        gameType={props.gameType}
        otherRoles={props.setup?.roles}
      />
    ));
  } else
    roles = Object.keys(props.roles).map((role) => (
      <RoleCount
        role={role}
        count={props.roles[role]}
        small={true}
        gameType={props.gameType}
        showSecondaryHover
        key={role}
        otherRoles={props.setup?.roles}
      />
    ));

  return (
    <div className="small-role-list">
      {props.title} {roles}
    </div>
  );
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
