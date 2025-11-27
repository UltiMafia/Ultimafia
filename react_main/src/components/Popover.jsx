import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";

import { GameStates } from "Constants";
import { SiteInfoContext } from "Contexts";
import { Time } from "components/Basic";
import {
  SmallRoleList,
  GameStateIcon,
  FullRoleList,
  getAlignmentColor,
} from "components/Setup";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";

import { Box, Divider, Link, Popover, Stack, Typography } from "@mui/material";
import { usePopoverOpen } from "hooks/usePopoverOpen";
import { GameSettingCount } from "./Roles";
import { KUDOS_ICON } from "pages/User/Profile";

export function PopoverContent({ title, content, page = null, icon = <></> }) {
  let wrappedTitle = (
    <Stack
      direction="row"
      spacing={1}
      className="mui-popover-title"
      sx={{
        p: 1,
        textAlign: "center",
        cursor: page ? "pointer" : "default",
        color: page ? "var(--mui-palette-primary-main)" : undefined,
        "&:hover": page ? { bgcolor: "rgba(12, 12, 12, 0.15)" } : undefined,
      }}
    >
      {icon}
      <Typography variant="h3">{title}</Typography>
    </Stack>
  );

  if (page) {
    wrappedTitle = (
      <Link href={page} target="_blank" rel="noopener noreferrer">
        {wrappedTitle}
      </Link>
    );
  }

  return (
    <Stack direction="column" bgcolor="var(--scheme-color)">
      {wrappedTitle}
      <Stack direction="column" spacing={1} padding={1}>
        {content}
      </Stack>
    </Stack>
  );
}

export const InfoPopover = function ({
  showPopover,
  popoverOpen,
  openByClick,
  anchorEl,
  closePopover,
  page,
  title,
  content,
}) {
  if (content === null) {
    return <></>;
  }

  return useMemo(() => (
    <Popover
      open={showPopover !== false && popoverOpen}
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
      onClose={closePopover}
      disableScrollLock
      disableRestoreFocus
      slotProps={{
        paper: {
          sx: {
            width: "320px",
          },
        },
      }}
    >
      <PopoverContent page={page} title={title} content={content} />
    </Popover>
  ), [openByClick, showPopover, Boolean(content !== null)]);
};

export function usePopover({
  path,
  type,
  postprocessData,
}) {
  const siteInfo = useContext(SiteInfoContext);
  const [content, setContent] = useState(null);

  const {
    popoverOpen,
    openByClick,
    anchorEl,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  const errorAlert = useErrorAlert();

  function ready(data, type) {
    switch (type) {
      case "setup":
        setContent(parseSetupPopover(data, siteInfo));
        break;
      case "deck":
        setContent(parseDeckPopover(data));
        break;
      case "rolePrediction":
        setContent(parseRolePredictionPopover(data));
        break;
      case "role":
        setContent(parseRolePopover(data.roleName, data.modifiers));
        break;
      case "modifier":
        setContent(parseModifierPopover(data.roleName));
        break;
      case "roleGroup":
        setContent(parseRoleGroupPopover(data));
        break;
      case "game":
        setContent(parseGamePopover(data));
        break;
    }
  }

  useEffect(
    function () {
      if (popoverOpen && content === null) {
        let promise;

        if (path instanceof Promise) {
          promise = path;
        } else {
          promise = axios.get(path);
        }
        promise
          .then((res) => {
            if (postprocessData) postprocessData(res.data);
            ready(res.data, type);
          })
          .catch((e) => {
            console.error(e);
            errorAlert(e);
            setContent("Error fetching data");
          });
      }
    },
    [popoverOpen]
  );

  return {
    popoverOpen,
    openByClick,
    anchorEl,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
    content,
  };
}

export function InfoSection({ title, children }) {
  return (
    <Stack
      direction="column"
      divider={<Divider orientation="horizontal" flexItem />}
    >
      <Typography fontWeight="bold">{title}</Typography>
      {children}
    </Stack>
  );
}

export function InfoRow({ title, content, multiRow = false }) {
  if (typeof content === "boolean") {
    content = content ? "☑️" : "❌";
  }

  if (multiRow) {
    return (
      <Stack direction="column">
        <Typography>
          {title}
          {":"}
        </Typography>
        {content}
      </Stack>
    );
  } else {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography>
          {title}
          {":"}
        </Typography>
        <Stack
          direction="row"
          sx={{
            marginLeft: "auto !important",
            minWidth: "1.5rem",
            justifyContent: "center",
          }}
        >
          {content}
        </Stack>
      </Stack>
    );
  }
}

export function parseSetupPopover(setup, siteInfo) {
  const result = [];

  //Creator
  if (setup.creator) {
    const name = (
      <NameWithAvatar
        small
        id={setup.creator.id}
        name={setup.creator.name}
        avatar={setup.creator.avatar}
      />
    );
    result.push(<InfoRow title="Created By" content={name} key="createdBy" />);
  }

  const IMPORTANT_GAME_SETTINGS = ["Whispers"];
  let settings = siteInfo.gamesettings[setup.gameType].map((gameSetting) => {
    let setupValue = setup.gameSettings[gameSetting.name];
    if (setupValue === undefined) {
      setupValue = false;
    }

    if (gameSetting.name.includes("x10")) {
      return;
    }
    if (gameSetting.requires) {
      for (const requirement of gameSetting.requires) {
        if (
          !(requirement in setup.gameSettings) ||
          !setup.gameSettings[requirement]
        ) {
          return;
        }
      }
    }
    if (
      setupValue === false &&
      !IMPORTANT_GAME_SETTINGS.includes(gameSetting.name)
    ) {
      return;
    }

    // Remain as false if setting is disabled otherwise display the icon for the game setting
    const gameSettingCount =
      setupValue === false ? (
        false
      ) : (
        <GameSettingCount
          iconLength={"1.5em"}
          role={gameSetting.name}
          count={typeof setupValue === "number" ? setupValue : 1}
          gameType={setup.gameType}
        />
      );

    return (
      <InfoRow
        title={gameSetting.name}
        content={gameSettingCount}
        key={gameSetting.name}
      />
    );
  });

  // Common settings
  result.push(
    <InfoSection title="Common settings">
      <InfoRow title="Players" content={setup.total} key="players" />
      <InfoRow title="Ranked Allowed" content={setup.ranked} key="ranked" />
      <InfoRow
        title="Competitive Allowed"
        content={setup.competitive}
        key="competitive"
      />
    </InfoSection>
  );
  if (settings) {
    result.push(<InfoSection title="Game Settings">{settings}</InfoSection>);
  }
  /*
      <InfoRow title="Must Act" content={setup.mustAct} key="mustAct" />
      <InfoRow
        title="Must Condemn"
        content={setup.mustCondemn}
        key="mustCondemn"
      />
      <InfoRow
        title="Whispers enabled"
        content={setup.whispers}
        key="whispers"
      />
      {setup.whispers && (
        <InfoRow
          title="Whisper leak rate"
          content={`${setup.leakPercentage}%`}
          key="leakPercentage"
        />
      )}

  */

  switch (setup.gameType) {
    /*
    case "Mafia":
      result.push(
        <InfoSection title="Mafia specific settings">
          <InfoRow
            title="Starting State"
            content={<GameStateIcon state={setup.startState} size="1rem" />}
            key="startState"
          />
          <InfoRow title="Dawn" content={setup.dawn} key="dawn" />
          <InfoRow title="Last Will" content={setup.lastWill} key="lastWill" />
          <InfoRow title="No Reveal" content={setup.noReveal} key="noReveal" />
          <InfoRow
            title="Votes Invisible"
            content={setup.votesInvisible}
            key="votesInvis"
          />
        </InfoSection>
      );
      break;
      */
    case "Resistance":
      result.push(
        <InfoSection title="Resistance specific settings">
          <InfoRow
            title="First Team Size"
            content={setup.firstTeamSize}
            key="firstTeamSize"
          />
          <InfoRow
            title="Last Team Size"
            content={setup.lastTeamSize}
            key="lastTeamSize"
          />
          <InfoRow
            title="Number of Missions"
            content={setup.numMissions}
            key="numMissions"
          />
          <InfoRow
            title="Team Formation Attempts"
            content={setup.teamFailLimit}
            key="teamFailLimit"
          />
        </InfoSection>
      );
      break;
  }

  let rolesetSettings = [];

  //Roles
  if (setup.closed) {
    rolesetSettings.push(
      <InfoRow title="Unique Roles" content={setup.unique} key="uniqueRoles" />
    );

    // Currently, only Mafia supports unique without modifier
    if (setup.unique && setup.gameType === "Mafia") {
      rolesetSettings.push(
        <InfoRow
          title="Unique Without Modifier"
          content={setup.uniqueWithoutModifier}
          key="uniqueRolesWithoutModifier"
        />
      );
    }

    rolesetSettings.push(
      <InfoRow
        title="Role Groups"
        content={setup.useRoleGroups}
        key="useRoleGroups"
      />
    );
  }

  let multiName = setup.useRoleGroups ? "Role Groups" : "Role Sets";
  const sectionName =
    !setup.closed && setup.roles.length > 1 ? multiName : "Roles";
  result.push(
    <InfoSection title={sectionName} key="roles">
      <InfoRow title="Closed roles" content={setup.closed} />
      {rolesetSettings}
    </InfoSection>
  );

  result.push(<FullRoleList setup={setup} key="fullRoleList" />);

  return result;
}

export function parseDeckPopover(deck) {
  const result = [];

  // ID
  result.push(<InfoRow title="ID" content={deck.id} key="id" />);

  //Creator
  if (deck.creator) {
    const name = (
      <NameWithAvatar
        small
        id={deck.creator.id}
        name={deck.creator.name}
        avatar={deck.creator.avatar}
      />
    );
    result.push(<InfoRow title="Created By" content={name} key="createdBy" />);
  }

  // Disabled
  if (deck.disabled) {
    result.push(
      <InfoRow
        title="Disabled"
        content="The deck has been disabled by a moderator and cannot be used."
        key="disabled"
      />
    );
  }

  // Words
  result.push(
    <InfoSection title="Profiles" key="profiles">
      {deck.profiles.map((profile) => {
        return (
          <NameWithAvatar
            noLink={true}
            deckProfile={true}
            small
            id={profile.id}
            name={profile.name}
            avatar={profile.avatar !== undefined}
            avatarId={profile.id}
          />
        );
      })}
    </InfoSection>
  );

  return result;
}

export function parseRolePredictionPopover(data) {
  let roleset = Object.keys(data.roles);
  roleset.unshift(undefined);

  return (
    <SmallRoleList
      roles={roleset}
      makeRolePrediction={data.makeRolePrediction}
      gameType={data.gameType}
      setup={data.setup}
      otherRoles={data.otherRoles}
      includeSearchBar
    />
  );
}

export function parseRoleGroupPopover(data) {
  let roleset = Object.keys(data.roles);

  return (
    <SmallRoleList
      roles={roleset}
      gameType={data.gameType}
      setup={data.setup}
      otherRoles={data.otherRoles}
    />
  );
}

export function parseGamePopover(game) {
  const result = [];

  //Scheduled
  if (game.settings.scheduled)
    result.push(
      <InfoRow
        title="Scheduled For"
        content={new Date(game.settings.scheduled).toLocaleString()}
        key="scheduledFor"
      />
    );

  //Players
  const playerList = [];
  const playerAlignmentMap = JSON.parse(game.playerAlignmentMap || "{}");
  let playerIdMap = JSON.parse(game.playerIdMap || "{}");
  const displayWinners = Object.keys(playerIdMap).length > 0;
  let winnerCount = game.winners ? game.winners.length : 0;

  const totalPlayers = game.totalPlayers
    ? game.totalPlayers
    : game.players.length;
  for (let i = 0; i < totalPlayers; i++) {
    let key = i;
    let userId = null;
    let avatarProps = {};
    let isWinner = false;
    if (i < game.players.length) {
      // Real player
      const player = game.players[i];
      userId = player.id;

      key = userId;
      avatarProps = {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
      };
    } else {
      // Guest
      const idKeys = Object.keys(playerIdMap);
      if (idKeys.length > 0) {
        userId = idKeys[0];
        key = userId;
      } else {
        if (winnerCount > 0) {
          winnerCount--;
          isWinner = true;
        }
      }
      avatarProps = {
        name: "[Guest]",
      };
    }

    if (userId && userId in playerIdMap) {
      if (game.winners && game.winners.includes(playerIdMap[userId])) {
        isWinner = true;
        winnerCount--;
      }
      delete playerIdMap[userId];
    }
    const isKudos = game.kudosReceiver && game.kudosReceiver === userId;
    const alignmentColor = getAlignmentColor(playerAlignmentMap[userId]);

    let trophies = [];
    if (isKudos) {
      trophies.push(
        <img
          src={KUDOS_ICON}
          alt="Kudos"
          width="20px"
          height="20px"
          key="kudos"
        />
      );
    }
    if (displayWinners) {
      if (isWinner) {
        trophies.push(
          <i
            className="fas fa-trophy"
            key="winner"
            style={{ color: "yellow" }}
          />
        );
      }
    }

    trophies = trophies.map((trophy) => (
      <Stack
        direction="row"
        style={{ minWidth: "1.5rem", justifyContent: "center" }}
      >
        {trophy}
      </Stack>
    ));

    playerList.push(
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: alignmentColor,
            borderTopLeftRadius: "var(--mui-shape-borderRadius)",
            borderBottomLeftRadius: "var(--mui-shape-borderRadius)",
            opacity: 0.05,
            zIndex: -1,
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: alignmentColor,
            borderTopLeftRadius: "var(--mui-shape-borderRadius)",
            borderBottomLeftRadius: "var(--mui-shape-borderRadius)",
            alignSelf: "stretch",
            minWidth: "8px",
          }}
        />
        <NameWithAvatar small {...avatarProps} />
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            minHeight: "1.5rem",
            alignItems: "center",
            marginLeft: "auto !important",
          }}
        >
          {trophies}
        </Stack>
      </Stack>
    );
  }

  result.push(
    <InfoSection title="Players" key="players">
      <Stack direction="column" spacing={0.5} paddingTop={0.5}>
        {playerList}
      </Stack>
    </InfoSection>
  );

  result.push(
    <InfoSection title="Time" key="timestamps">
      {game.createTime && (
        <InfoRow
          title="Created"
          content={new Date(game.createTime).toLocaleString()}
          key="createdAt"
        />
      )}
      {game.startTime && (
        <InfoRow
          title="Started"
          content={new Date(game.startTime).toLocaleString()}
          key="startedAt"
        />
      )}
      {game.endTime && (
        <InfoRow
          title="Ended"
          content={new Date(game.endTime).toLocaleString()}
          key="endedAt"
        />
      )}
    </InfoSection>
  );

  //State lengths
  const stateLengths = [];

  for (let stateName of GameStates[game.type]) {
    stateLengths.push(
      <InfoRow
        title={stateName}
        content={<Time millisec={game.settings.stateLengths[stateName]} />}
        key={stateName}
      />
    );
  }

  result.push(
    <InfoSection title="State Lengths" key="stateLengths">
      {stateLengths}
    </InfoSection>
  );

  // Common settings
  result.push(
    <InfoSection title="Common settings">
      <InfoRow title="Ranked" content={game.settings.ranked} key="ranked" />
      <InfoRow
        title="Spectating"
        content={game.settings.spectating}
        key="spectating"
      />
      <InfoRow
        title="Guests Allowed"
        content={game.settings.guests}
        key="guests"
      />
      <InfoRow
        title="Ready Check"
        content={game.settings.readyCheck}
        key="readyCheck"
      />
      <InfoRow title="No Vegging" content={game.settings.noVeg} key="noVeg" />
      <InfoRow
        title="Anonymous"
        content={game.settings.anonymousGame}
        key="anonymous"
      />
      {game.settings.anonymousGame && (
        <InfoRow
          title="Anonymous Deck"
          content={`${game.settings.anonymousDeck
            .map((d) => d.name)
            .join(", ")} (${game.settings.anonymousDeck
            .map((d) => d.id)
            .join(", ")})`}
          key="anonymousDeck"
        />
      )}
    </InfoSection>
  );

  switch (game.type) {
    case "Mafia":
      var extendLength = game.settings.gameTypeOptions.extendLength || 3;
      var pregameWaitLength =
        game.settings.gameTypeOptions.pregameWaitLength || 1;
      var advancedHosting = game.settings.gameTypeOptions.advancedHosting;
      result.push(
        <InfoSection title="Mafia specific settings">
          <InfoRow
            title="Extension Length"
            content={<Time millisec={extendLength * 60 * 1000} />}
            key="extendLength"
          />
          <InfoRow
            title="Pregame Wait Length"
            content={<Time millisec={pregameWaitLength * 60 * 60 * 1000} />}
            key="pregameWaitLength"
          />
          <InfoRow
            title="Advanced Hosting"
            content={advancedHosting}
            key="advancedHosting"
          />
        </InfoSection>
      );
      break;
    case "Jotto":
      const duplicateLetters = game.settings.gameTypeOptions.duplicateLetters;
      const competitiveMode = game.settings.gameTypeOptions.competitiveMode;
      const winOnAnagrams = game.settings.gameTypeOptions.winOnAnagrams;
      result.push(
        <InfoSection title="Jotto specific settings">
          <InfoRow
            title="Duplicate Letters"
            content={duplicateLetters}
            key="duplicateLetters"
          />
          <InfoRow
            title="Competitive Mode"
            content={competitiveMode}
            key="competitiveMode"
          />
          <InfoRow
            title="Win With Anagrams"
            content={winOnAnagrams}
            key="winOnAnagrams"
          />
          {winOnAnagrams && (
            <InfoRow
              title="No. Anagrams Required"
              content={game.settings.gameTypeOptions.numAnagramsRequired}
              key="numAnagramsRequired"
            />
          )}
        </InfoSection>
      );
      break;
    case "Acrotopia":
      const roundAmt = game.settings.gameTypeOptions.roundAmt;
      const acronymSize = game.settings.gameTypeOptions.acronymSize;
      const enablePunctuation = game.settings.gameTypeOptions.enablePunctuation;
      const standardiseCapitalisation =
        game.settings.gameTypeOptions.standardiseCapitalisation;
      result.push(
        <InfoSection title="Acrotopia specific settings">
          <InfoRow title="No. Rounds" content={roundAmt} key="roundAmt" />
          <InfoRow
            title="Acronym Size"
            content={acronymSize}
            key="acronymSize"
          />
          <InfoRow
            title="Enable Punctuation"
            content={enablePunctuation}
            key="enablePunctuation"
          />
          <InfoRow
            title="Standardise Capitalisation"
            content={standardiseCapitalisation}
            key="standardiseCapitalisation"
          />
          {standardiseCapitalisation && (
            <InfoRow
              title="Turn on Caps"
              content={game.settings.gameTypeOptions.turnOnCaps}
              key="turnOnCaps"
            />
          )}
        </InfoSection>
      );
      break;
    case "Wacky Words":
      const roundAmtWW = game.settings.gameTypeOptions.roundAmt;
      const acronymSizeWW = game.settings.gameTypeOptions.acronymSize;
      const enablePunctuationWW =
        game.settings.gameTypeOptions.enablePunctuation;
      const standardiseCapitalisationWW =
        game.settings.gameTypeOptions.standardiseCapitalisation;
      result.push(
        <InfoSection title="Wacky Words specific settings">
          <InfoRow title="No. Rounds" content={roundAmtWW} key="roundAmt" />
          <InfoRow
            title="Acronym Size"
            content={acronymSizeWW}
            key="acronymSize"
          />
          <InfoRow
            title="Enable Punctuation"
            content={enablePunctuationWW}
            key="enablePunctuation"
          />
          <InfoRow
            title="Standardise Capitalisation"
            content={standardiseCapitalisationWW}
            key="standardiseCapitalisation"
          />
          {standardiseCapitalisationWW && (
            <InfoRow
              title="Turn on Caps"
              content={game.settings.gameTypeOptions.turnOnCaps}
              key="turnOnCaps"
            />
          )}
        </InfoSection>
      );
      break;
    case "Liars Dice":
      result.push(
        <InfoSection title="Liars Dice specific settings">
          <InfoRow
            title="Wild Ones"
            content={game.settings.gameTypeOptions.wildOnes}
            key="wildOnes"
          />
          <InfoRow
            title="Spot On"
            content={game.settings.gameTypeOptions.spotOn}
            key="spotOn"
          />
          <InfoRow
            title="Starting Dice"
            content={game.settings.gameTypeOptions.startingDice}
            key="startingDice"
          />
        </InfoSection>
      );
      break;
    case "Texas Hold Em":
      result.push(
        <InfoSection title="Texas Hold Em specific settings">
          <InfoRow
            title="Minimum Bet"
            content={game.settings.gameTypeOptions.minimumBet}
            key="minimumBet"
          />
          <InfoRow
            title="Starting Chips"
            content={game.settings.gameTypeOptions.startingChips}
            key="startingChips"
          />
          <InfoRow
            title="Max Rounds"
            content={game.settings.gameTypeOptions.MaxRounds}
            key="MaxRounds"
          />
        </InfoSection>
      );
      break;
    case "Cheat":
      result.push(
        <InfoSection title="Cheat specific settings">
          <InfoRow
            title="Max Rounds"
            content={game.settings.gameTypeOptions.MaxRounds}
            key="MaxRounds"
          />
        </InfoSection>
      );
      break;
  }

  return result;
}

export function parseRolePopover(role, modifiers) {
  const result = [];

  if (!role) {
    return [];
  }

  //Alignment
  result.push(
    <InfoRow title="Alignment" content={role.alignment} key="alignment" />
  );

  //Description
  const descLines = [];

  for (let i in role.description)
    descLines.push(<li key={i}>{role.description[i]}</li>);

  result.push(
    <InfoRow title="Description" content={<ul>{descLines}</ul>} key="desc" />
  );

  if (modifiers) {
    for (const modifier of modifiers) {
      result.push(
        <InfoRow
          title={`Modifier: ${modifier.name}`}
          content={
            <ul>
              <li key={modifier.name}>
                {role.alignment == "Event" && modifier.eventDescription != null
                  ? modifier.eventDescription
                  : modifier.description}
              </li>
            </ul>
          }
          key={modifier.name}
        />
      );
    }
  }

  return result;
}

export function parseModifierPopover(mod) {
  const result = [];

  if (!mod) {
    return [];
  }

  //Description
  const descLines = [mod.description];

  result.push(
    <InfoRow title="Description" content={<ul>{descLines}</ul>} key="desc" />
  );

  return result;
}
