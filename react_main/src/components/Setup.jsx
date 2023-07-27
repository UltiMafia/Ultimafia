import React, { useContext, useEffect, useRef, useState } from "react";

import {
  GameContext,
  PopoverContext,
  SiteInfoContext,
  UserContext,
} from "../Contexts";
import { RoleCount } from "./Roles";
import { Alignments } from "../Constants";
import { filterProfanity } from "./Basic";
import { hyphenDelimit } from "../utils";

import "../css/setup.css";
import "../css/roles.css";
import "../css/vRoles.css";

export default function Setup(props) {
  const user = useContext(UserContext);
  const popover = useContext(PopoverContext);
  const siteInfo = useContext(SiteInfoContext);
  const setupRef = useRef();
  const maxRolesCount = props.maxRolesCount || 50;
  const classList = props.classList || "";
  const [setupIndex, setSetupIndex] = useState(0);
  const disablePopover = props.disablePopover;
  const small = props.small ?? true;

  var roleCounts, multi;
  var overSize = false;

  if (typeof props.setup.roles == "string")
    props.setup.roles = JSON.parse(props.setup.roles);

  if (props.setup.closed) {
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
  } else {
    multi = props.setup.roles.length > 1;
    selectSetup(setupIndex);
  }

  function selectSetup(index) {
    let roleNames = sortRoles(
      Object.keys(props.setup.roles[index]),
      props.setup.gameType,
      siteInfo
    );

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

  function onClick() {
    if (disablePopover) {
      return;
    }
    popover.onClick(
      `/setup/${props.setup.id}`,
      "setup",
      setupRef.current,
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
      <GameIcon
        title={props.setup.gameType}
        onClick={onClick}
        gameType={props.setup.gameType}
      />
      <span title={`Slots`} onClick={onClick} className={`setup-total-count`}>
        {props.setup.total}
      </span>
      {multi && (
        <i
          title={`Multi-Setup`}
          onClick={cycleSetups}
          className="multi-setup-icon fas fa-list-alt"
        />
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

function sortRoles(roleList, gameType, siteInfo) {
  const alignments = Alignments[gameType];
  const listCopy = roleList.slice();
  listCopy.sort((a, b) => {
    let [roleNameA, modifiersA] = a.split(":");
    let [roleNameB, modifiersB] = b.split(":");
    let roleA = siteInfo.roles[gameType].find((e) => e.name === roleNameA);
    let roleB = siteInfo.roles[gameType].find((e) => e.name === roleNameB);
    let modA = modifiersA
      ?.split("/")
      .filter((e) => e)
      .map((e) => siteInfo.modifiers[gameType].find((x) => x.name === e))
      .find((e) => e.alignment);
    let modB = modifiersB
      ?.split("/")
      .filter((e) => e)
      .map((e) => siteInfo.modifiers[gameType].find((x) => x.name === e))
      .find((e) => e.alignment);

    if (!roleA || !roleB) return 0;
    let alignmentA = modA?.alignment || roleA.alignment;
    let alignmentB = modB?.alignment || roleB.alignment;
    if (alignmentA === alignmentB) return 0;
    if (alignments.indexOf(alignmentA) > alignments.indexOf(alignmentB)) {
      return 1;
    } else {
      return -1;
    }
  });
  return listCopy;
}

export function SmallRoleList(props) {
  const siteInfo = useContext(SiteInfoContext);
  var roles;

  if (Array.isArray(props.roles)) {
    roles = sortRoles(props.roles, props.gameType, siteInfo).map((role) => (
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
    roles = sortRoles(Object.keys(props.roles), props.gameType, siteInfo).map(
      (role) => (
        <RoleCount
          role={role}
          count={props.roles[role]}
          small={true}
          gameType={props.gameType}
          showSecondaryHover
          key={role}
        />
      )
    );

  return <div className="small-role-list">{roles}</div>;
}

export function GameIcon(props) {
  const gameType = hyphenDelimit(props.gameType);
  return (
    <div onClick={props.onClick} className={`game-icon ${gameType}`}></div>
  );
}

export function GameStateIcon(props) {
  var iconName;

  if (props.state == "Day") iconName = "sun";
  else if (props.state == "Night") iconName = "moon";

  return <i className={`fa-${iconName} fas state-icon`} />;
}
