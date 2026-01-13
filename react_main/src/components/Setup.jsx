import React, { useContext, useLayoutEffect, useRef, useState } from "react";

import { UserContext, SiteInfoContext } from "Contexts";
import { RoleCount } from "components/Roles";
import { filterProfanity } from "components/Basic";
import { SearchBar } from "components/Nav";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { hyphenDelimit } from "utils";

import {
  Box,
  Card,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  Popover,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import "css/setup.css";
import "css/roles.css";
import { usePopover, InfoPopover } from "components/Popover";
import { usePopoverOpen } from "hooks/usePopoverOpen";
import { PopoverContent } from "./Popover";

export default function Setup(props) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const setupRef = useRef();
  const popoverProps = usePopover({
    path: `/api/setup/${props.setup.id}`,
    type: "setup",
    boundingEl: setupRef.current,
    postprocessData: (data) => (data.roles = JSON.parse(data.roles)),
  });
  const { popoverOpen, handleClick } = popoverProps;

  const iconContainerRef = useRef();
  const [maxIconsPerRow, setMaxIconsPerRow] = useState(null);
  const [setupIndex, setSetupIndex] = useState(0);

  // Allow overflow to vertically stack if the row width is only 2 or less
  const wrapIcons = maxIconsPerRow && maxIconsPerRow <= 2;
  // If wrapIcons is true, limit the icons to three rows
  const maxIconsTotal =
    maxIconsPerRow === null
      ? null
      : wrapIcons
      ? maxIconsPerRow * 3
      : maxIconsPerRow;

  if (typeof props.setup.roles == "string")
    props.setup.roles = JSON.parse(props.setup.roles);

  const backgroundColor = props.backgroundColor || undefined;
  const classList = props.classList || "";
  const disablePopover = props.disablePopover;
  const small = props.small ?? true;
  const useRoleGroups = props.setup.useRoleGroups;
  const multi =
    (!props.setup.closed || useRoleGroups) &&
    !useRoleGroups &&
    props.setup.roles.length > 1;

  // Prevent overflow
  useLayoutEffect(() => {
    if (!iconContainerRef.current.lastChild) {
      return;
    }

    const rContainer = iconContainerRef.current.getBoundingClientRect();
    const rLastChild =
      iconContainerRef.current.lastChild.getBoundingClientRect();

    const containerRightOffset = rContainer.x + rContainer.width;
    const lastChildRightOffset = rLastChild.x + rLastChild.width;

    if (lastChildRightOffset > containerRightOffset) {
      // If true, then component is overflowing. Determine the last child that fits and prune the rest.
      var numFittingIcons = 0;
      for (let child of iconContainerRef.current.children) {
        const rChild = child.getBoundingClientRect();
        const childRightOffset = rChild.x + rChild.width;
        if (childRightOffset <= containerRightOffset) {
          numFittingIcons++;
        }
      }
      setMaxIconsPerRow(numFittingIcons);
    }
  }, [iconContainerRef]);

  // Extract events from all setup types
  const { rolesDividedByAlignment, events, eventsPerRoleset } =
    getRolesByAlignment(siteInfo, props.setup.gameType, props.setup.roles);

  var roleCounts = [];
  var overSize = false;

  if (props.setup.closed && !useRoleGroups) {
    for (let alignment of Object.keys(rolesDividedByAlignment[0])) {
      const count = props.setup.count[alignment];
      if (count > 0) {
        roleCounts.push(
          <RoleCount
            closed
            alignment={alignment}
            roleGroup={rolesDividedByAlignment[0][alignment]}
            count={props.setup.count[alignment]}
            gameType={props.setup.gameType}
            key={alignment}
            otherRoles={props.setup.roles}
          />
        );
      }
    }
  } else if (useRoleGroups) {
    let roleGroupCounter = 0;
    let i = 0;
    for (let roleGroup in props.setup.roles) {
      if (maxIconsTotal !== null && roleCounts.length >= maxIconsTotal) {
        overSize = true;
        break;
      }
      const roleGroupData = props.setup.roles[roleGroup];

      // Filter out events from role group display
      const filteredRoleGroup = {};
      for (let role in roleGroupData) {
        const roleName = role.split(":")[0];
        const roleObj = siteInfo.rolesRaw?.[props.setup.gameType]?.[roleName];
        if (roleObj && roleObj.alignment !== "Event") {
          filteredRoleGroup[role] = roleGroupData[role];
        }
      }

      if (Object.keys(filteredRoleGroup).length === 1) {
        // Don't use the A, B, C, etc. labels if there's only one role in the group
        const roleName = Object.keys(filteredRoleGroup)[0];
        roleCounts.push(
          <RoleCount
            key={i}
            count={props.setup.roleGroupSizes[roleGroup]}
            showPopover
            small={small}
            role={roleName}
            gameType={props.setup.gameType}
            otherRoles={props.setup.roles}
          />
        );
      }
      else {
        roleCounts.push(
          <RoleCount
            key={i}
            count={props.setup.roleGroupSizes[roleGroup]}
            showPopover
            small={small}
            role={INDEXED_ROLE_GROUP_LABELS[roleGroupCounter]}
            roleGroup={filteredRoleGroup}
            gameType={props.setup.gameType}
            otherRoles={props.setup.roles}
          />
        );
        roleGroupCounter++;
      }
      i++;
    }
  } else {
    selectSetup(setupIndex);
  }

  function selectSetup(index) {
    let roleNames = Object.keys(props.setup.roles[index]);
    // Filter out events from role display
    const filteredRoleNames = roleNames.filter((role) => {
      const roleName = role.split(":")[0];
      const roleObj = siteInfo.rolesRaw?.[props.setup.gameType]?.[roleName];
      return roleObj && roleObj.alignment !== "Event";
    });
    roleCounts = filteredRoleNames.map((role) => (
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

  function cycleSetups() {
    if (setupIndex < props.setup.roles.length - 1) {
      setSetupIndex(setupIndex + 1);
    } else {
      setSetupIndex(0);
    }
  }

  // Determine which events to display
  let eventsToDisplay = {};
  if (multi) {
    // For multi-setup, only show events for the currently selected roleset
    eventsToDisplay = eventsPerRoleset[setupIndex] || {};
  } else {
    // For closed setups or single setups, show all events
    eventsToDisplay = events || {};
  }

  // Add Event Pool icon if there are events
  const eventKeys = Object.keys(eventsToDisplay);
  if (eventKeys.length > 0) {
    roleCounts.push(
      <EventPool
        key="event-pool"
        events={eventsToDisplay}
        gameType={props.setup.gameType}
        otherRoles={props.setup.roles}
        small={small}
      />
    );
  }

  if (multi) {
    roleCounts.unshift(
      <i
        onClick={cycleSetups}
        className="fas fa-list-alt"
        key="multi"
        style={{
          fontSize: "1.5rem",
          cursor: "pointer",
        }}
      />
    );
  }

  if (maxIconsTotal !== null && roleCounts.length > maxIconsTotal) {
    overSize = true;
    roleCounts = roleCounts.slice(0, maxIconsTotal);
  }

  if (overSize) {
    roleCounts[maxIconsTotal - 1] = (
      <i
        onClick={handleClick}
        gameType={props.setup.gameType}
        className="fas fa-ellipsis-h"
        style={{
          fontSize: "1.5rem",
          marginLeft: "4px",
          cursor: "pointer",
        }}
        key="ellipses"
      />
    );
  }

  return (
    <>
      <InfoPopover
        {...popoverProps}
        page={`/learn/setup/${props.setup.id}`}
        title={filterProfanity(props.setup.name, user.settings)}
      />
      <Card
        variant="outlined"
        className={"setup " + classList}
        ref={setupRef}
        sx={{
          minWidth: 0,
          width: "100%",
          backgroundColor:
            backgroundColor !== undefined
              ? "background.paper"
              : "var(--scheme-color-sec)",
        }}
      >
        <Stack
          direction="row"
          sx={{
            width: "100%",
            alignItems: "stretch",
            borderRadius: "var(--mui-shape-borderRadius)",
            backgroundColor: backgroundColor,
          }}
        >
          <Stack
            direction="column"
            aria-owns={popoverOpen ? "mouse-over-popover" : undefined}
            aria-haspopup="true"
            onClick={handleClick}
            sx={{
              justifyContent: "center",
              cursor: "pointer",
              borderTopLeftRadius: "var(--mui-shape-borderRadius)",
              borderBottomLeftRadius: "var(--mui-shape-borderRadius)",
              bgcolor: popoverOpen ? "rgba(12, 12, 12, 0.15)" : undefined,
              "&:hover": { bgcolor: "rgba(12, 12, 12, 0.15)" },
            }}
          >
            <GameIcon
              className="role-count-wrap"
              gameType={props.setup.gameType}
            />
          </Stack>
          <Divider orientation="vertical" flexItem />
          <Stack
            direction="column"
            sx={{
              p: 1,
              flex: "1 1",
              alignItems: "stretch",
              overflowX: "hidden",
            }}
          >
            <Typography variant="body2" className="setup-name">
              {filterProfanity(props.setup.name, user.settings)}
            </Typography>
            <Stack
              direction="row"
              ref={iconContainerRef}
              sx={{
                minWidth: "0",
                alignItems: "center",
                flexWrap: wrapIcons ? "wrap" : "nowrap",
              }}
            >
              {roleCounts}
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </>
  );
}

export function determineSetupType(setup) {
  const isMulti = setup.roles.length > 1;
  if (setup.closed) {
    if (setup.useRoleGroups) {
      return "Closed (groups)";
    } else {
      return "Closed (whole)";
    }
  } else {
    if (isMulti) {
      return "Closed (multi-set)";
    } else {
      return "Open";
    }
  }
}

export function getAlignmentColor(alignment) {
  if (alignment === "Village") {
    return "#66adff";
  } else if (alignment === "Mafia") {
    return "#505d66";
  } else if (alignment === "Cult") {
    return "#b161d3";
  } else if (alignment === "Independent") {
    return "#c7ce48";
  } else {
    return "#d3d3d3";
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
        key={role ? role : "null"}
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
          key="searchbar"
        />
      )}
      <div className="small-role-list">
        {props.title} {roleList}
      </div>
    </Stack>
  );
}

const ALIGNMENT_ORDER = ["Village", "Independent", "Mafia", "Cult"];

const INDEXED_ROLE_GROUP_LABELS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "AA",
  "AB",
  "AC",
  "AD",
  "AE",
  "AF",
  "AG",
  "AH",
  "AI",
  "AJ",
  "AK",
  "AL",
  "AM",
  "AN",
  "AO",
  "AP",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AV",
  "AW",
  "AX",
];

function EventPool({ events, gameType, otherRoles, small = false }) {
  const {
    popoverOpen,
    openByClick,
    anchorEl,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  const eventIconRef = useRef();
  const eventKeys = Object.keys(events);
  const hasEvents = eventKeys.length > 0;

  if (!hasEvents) {
    return null;
  }

  const popoverProps = {
    "aria-owns": popoverOpen ? "mouse-over-popover" : undefined,
    "aria-haspopup": "true",
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  const popoverTitle = "Event Pool";
  const popoverContent = (
    <SmallRoleList roles={events} gameType={gameType} otherRoles={otherRoles} />
  );
  const popoverIcon = (
    <div className={`role role-icon-event-pool ${small ? "small" : ""}`} />
  );

  return (
    <>
      <div
        className="role-count-wrap event-pool-wrap"
        ref={eventIconRef}
        {...popoverProps}
        style={{
          cursor: "pointer",
        }}
      >
        <div className={`role role-icon-event-pool ${small ? "small" : ""}`} />
      </div>
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
          icon={popoverIcon}
        />
      </Popover>
    </>
  );
}

function getRolesByAlignment(siteInfo, gameType, roles) {
  let rolesDividedByAlignment = {};
  const events = {};
  const eventsPerRoleset = {};

  for (let i in roles) {
    eventsPerRoleset[i] = {};
    for (let role in roles[i]) {
      let roleName = role.split(":")[0];

      for (let roleObj of siteInfo.roles[gameType]) {
        if (roleObj.name === roleName) {
          const alignment = roleObj.alignment;

          if (alignment === "Event") {
            // Track events per roleset
            if (!eventsPerRoleset[i][role]) {
              eventsPerRoleset[i][role] = 0;
            }
            eventsPerRoleset[i][role] += roles[i][role];

            // Also aggregate events across all rolesets
            if (!events[role]) {
              events[role] = 0;
            }
            events[role] += roles[i][role];
            continue;
          }

          if (!rolesDividedByAlignment[i]) rolesDividedByAlignment[i] = {};
          if (!rolesDividedByAlignment[i][alignment])
            rolesDividedByAlignment[i][alignment] = {};

          rolesDividedByAlignment[i][alignment][role] = roles[i][role];
        }
      }
    }
  }

  return {
    rolesDividedByAlignment: rolesDividedByAlignment,
    events: events,
    eventsPerRoleset: eventsPerRoleset,
  };
}

export function FullRoleList({ setup }) {
  const roles = setup.roles;
  const gameType = setup.gameType;

  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

  const multi =
    (!setup.closed || setup.useRoleGroups) &&
    !setup.useRoleGroups &&
    setup.roles.length > 1;

  const { rolesDividedByAlignment, events, eventsPerRoleset } =
    getRolesByAlignment(siteInfo, gameType, roles);

  // holy fricken FREAK this is a 3-dimensional effort
  const rolesetAlignments = Object.keys(rolesDividedByAlignment).map((i) => {
    const alignmentKeys = Object.keys(rolesDividedByAlignment[i]);
    const gridItemSize = isPhoneDevice ? 12 : 12 / alignmentKeys.length;

    // Determine which events to display
    let eventsToDisplay = {};
    if (multi) {
      // For multi-setup, only show events for the currently selected roleset
      eventsToDisplay = eventsPerRoleset[i] || {};
    } else {
      // For closed setups or single setups, show all events
      eventsToDisplay = events || {};
    }

    const alignmentRoles = ALIGNMENT_ORDER.map((alignment) => {
      if (rolesDividedByAlignment[i][alignment] === undefined) {
        return <></>;
      }

      const alignmentColor = getAlignmentColor(alignment);
      const roles = Object.keys(rolesDividedByAlignment[i][alignment]).map(
        (role) => (
          <RoleCount
            role={role}
            count={rolesDividedByAlignment[i][alignment][role]}
            small={true}
            gameType={gameType}
            showSecondaryHover
            key={role}
            otherRoles={setup.roles}
          />
        )
      );

      return (
        <Grid item xs={12} md={gridItemSize}>
          <Stack
            direction="row"
            spacing={0}
            sx={{
              p: 1,
              height: "100%",
              flexWrap: "wrap",
              border: `4px solid ${alignmentColor}`,
              borderRadius: "4px",
              alignContent: "flex-start",
            }}
          >
            {roles}
          </Stack>
        </Grid>
      );
    });

    return (
      <Stack
        direction={isPhoneDevice ? "column" : "row"}
        sx={{
          alignItems: "center",
        }}
      >
        {setup.roles.length > 1 && (
          <RoleCount
            key={i}
            count={setup.roleGroupSizes[i]}
            showPopover={false}
            role={INDEXED_ROLE_GROUP_LABELS[i]}
            roleGroup={setup.roles[i]}
            gameType={gameType}
          />
        )}
        <Grid container columns={12} spacing={1}>
          {alignmentRoles}
        </Grid>
        {Object.keys(eventsToDisplay).length > 0 && (
          <Box
            sx={{
              width: "var(--role-icon-size)",
              height: "var(--role-icon-size)",
              ml: 0.5,
            }}
          >
            <EventPool
              key="event-pool"
              events={eventsToDisplay}
              gameType={setup.gameType}
              otherRoles={setup.roles}
            />
          </Box>
        )}
      </Stack>
    );
  });

  return (
    <Stack
      direction="column"
      spacing={1}
      divider={<Divider orientation="horizontal" flexItem />}
    >
      {rolesetAlignments}
    </Stack>
  );
}

export function GameIcon(props) {
  const gameType = hyphenDelimit(props.gameType);

  return <div className={`game-icon ${gameType}`} />;
}

export function GameStateIcon(props) {
  const state = props.state;
  const size = props.size;

  var iconName;
  if (state === "Day") iconName = "sun";
  else if (state === "Night") iconName = "moon";

  return (
    <i
      className={`fa-${iconName} fas state-icon`}
      style={{
        fontSize: size ? size : undefined,
      }}
    />
  );
}

export function SetupManipulationButtons(props) {
  const user = useContext(UserContext);

  const isOwner = props.setup.creator?.id === user.id;
  const favIconFormat = props.setup.favorite ? "fas" : "far";

  const missingOwnershipStyle = {
    opacity: !isOwner ? "20%" : undefined,
    cursor: !isOwner ? "not-allowed" : undefined,
  };

  return (
    <Grid container sx={{ width: "8rem" }}>
      <Grid item xs={3}>
        <IconButton aria-label="favorite">
          <i
            className={`setup-btn fav-setup fa-star ${favIconFormat}`}
            onClick={() => props.onFav(props.setup)}
          />
        </IconButton>
      </Grid>
      <Grid item xs={3}>
        <IconButton
          aria-label="edit"
          disabled={!isOwner}
          sx={missingOwnershipStyle}
        >
          <i
            className={`setup-btn edit-setup fa-pen-square fas`}
            onClick={() => props.onEdit(props.setup)}
          />
        </IconButton>
      </Grid>
      <Grid item xs={3}>
        <IconButton aria-label="copy">
          <i
            className={`setup-btn copy-setup fa-copy fas`}
            onClick={() => props.onCopy(props.setup)}
          />
        </IconButton>
      </Grid>
      <Grid item xs={3}>
        <IconButton
          aria-label="delete"
          disabled={!isOwner}
          sx={missingOwnershipStyle}
        >
          <i
            className={`setup-btn del-setup fa-times-circle fas`}
            onClick={() => props.onDel(props.setup)}
          />
        </IconButton>
      </Grid>
    </Grid>
  );
}
