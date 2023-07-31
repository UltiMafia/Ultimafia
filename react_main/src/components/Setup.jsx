import React, { useContext, useEffect, useRef, useState } from "react";

import { GameContext, PopoverContext, UserContext } from "../Contexts";
import { RoleCount } from "./Roles";
import { Alignments } from "../Constants";
import { filterProfanity } from "./Basic";
import { hyphenDelimit } from "../utils";

import "../css/setup.css";
import "../css/roles.css";

export default function Setup(props) {
  const user = useContext(UserContext);
  const popover = useContext(PopoverContext);
  const setupRef = useRef();
  const maxRolesCount = props.maxRolesCount || 50;
  const classList = props.classList || "";
  const [setupIndex, setSetupIndex] = useState(0);
  const disablePopover = props.disablePopover;
  const small = props.small ?? true;

  var roleCounts, multi, useRoleGroups;
  var overSize = false;

  useRoleGroups = props.setup.useRoleGroups;

  if (typeof props.setup.roles == "string")
    props.setup.roles = JSON.parse(props.setup.roles);

  if (props.setup.closed && !useRoleGroups) {
    roleCounts = [];

    for (let alignment of Alignments[props.setup.gameType]) {
      roleCounts.push(
        <RoleCount
          closed
          alignment={alignment}
          count={props.setup.count[alignment]}
          gameType={props.setup.gameType}
          key={alignment}
        />
      );
    }
  } else if (useRoleGroups) {
    roleCounts = [];
    for (let roleGroup in props.setup.roles) {
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
        />
      );
    }
  } else {
    multi = props.setup.roles.length > 1 && !useRoleGroups;
    selectSetup(setupIndex);
  }

  function selectSetup(index) {
    let roleNames = Object.keys(props.setup.roles[index]);
    roleCounts = roleNames.map((role) => (
      <RoleCount
        small={small}
        role={role}
        showPopover
        count={props.setup.roles[index][role]}
        gameType={props.setup.gameType}
        key={role}
      />
    ));

    if (roleCounts.length > maxRolesCount) {
      roleCounts = roleCounts.slice(0, maxRolesCount);
      overSize = true;
    }
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

  return (
    <div className={"setup " + classList} ref={setupRef}>
      <GameIcon revealPopover={onClick} gameType={props.setup.gameType} />
      {useRoleGroups && (
        <i
          title={`Role-Groups`}
          onClick={onClick}
          className="multi-setup-icon fas fa-user-friends"
        />
      )}
      {multi && (
        <i onClick={cycleSetups} className="multi-setup-icon fas fa-list-alt" />
      )}
      {roleCounts}
      {overSize && (
        <i
          onClick={onClick}
          gameType={props.setup.gameType}
          className="fas fa-ellipsis-h"
        />
      )}
    </div>
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

  if (props.state == "Day") iconName = "sun";
  else if (props.state == "Night") iconName = "moon";

  return <i className={`fa-${iconName} fas state-icon`} />;
}
