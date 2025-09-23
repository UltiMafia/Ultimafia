import React, { useState, useEffect, useContext } from "react";
import axios from "axios";

import { GameStates } from "Constants";
import { SiteInfoContext } from "Contexts";
import { Time } from "components/Basic";
import { SmallRoleList, GameStateIcon, FullRoleList } from "components/Setup";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";

import { Divider, Popover, Stack, Typography } from "@mui/material";
import { usePopoverOpen } from "hooks/usePopoverOpen";

export function usePopover({
  path,
  page,
  type,
  boundingEl,
  title,
  postprocessData,
}) {
  const siteInfo = useContext(SiteInfoContext);
  const [content, setContent] = useState(null);

  const {
    popoverOpen,
    popoverClasses,
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
        setContent(parseSetupPopover(data, siteInfo.roles));
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

  const InfoPopover = function ({ showPopover }) {
    if (content === null) {
      return <></>;
    }

    return (
      <Popover
        open={showPopover !== false && popoverOpen}
        sx={popoverClasses}
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
        <Stack direction="column" bgcolor="var(--scheme-color)">
          <a href={page} target="_blank" rel="noopener noreferrer">
            <Typography
              className="mui-popover-title"
              sx={{
                p: 1,
                textAlign: "center",
                cursor: page !== undefined ? "pointer" : "default",
                color:
                  page !== undefined
                    ? "var(--mui-palette-primary-main)"
                    : undefined,
                "&:hover":
                  page !== undefined
                    ? { bgcolor: "rgba(12, 12, 12, 0.15)" }
                    : undefined,
              }}
            >
              {title}
            </Typography>
          </a>
          <Stack direction="column" spacing={1} padding={1}>
            {content}
          </Stack>
        </Stack>
      </Popover>
    );
  };

  return {
    InfoPopover,
    popoverOpen,
    popoverClasses,
    anchorEl,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
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

export function parseSetupPopover(setup, roleData) {
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

  let settings = setup.gameSettings[0].map((s, i) => (
    <InfoRow
      title={Array.isArray(s) ? s[0] : s}
      content={Array.isArray(s) ? s.length : true}
      key={i}
    />
  ));

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

  //Roles
  if (setup.closed) {
    result.push(
      <InfoRow title="Unique Roles" content={setup.unique} key="uniqueRoles" />
    );

    // Currently, only Mafia supports unique without modifier
    if (setup.unique && setup.gameType === "Mafia") {
      result.push(
        <InfoRow
          title="Unique Without Modifier"
          content={setup.uniqueWithoutModifier}
          key="uniqueRolesWithoutModifier"
        />
      );
    }

    result.push(
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
      <FullRoleList setup={setup} />
    </InfoSection>
  );

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
      makeRolePrediction={data.toggleRolePrediction}
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

  for (let i = 0; i < game.players.length; i++) {
    playerList.push(
      <NameWithAvatar
        small
        id={game.players[i].id}
        name={game.players[i].name}
        avatar={game.players[i].avatar}
        key={game.players[i].id}
      />
    );
  }

  while (playerList.length < game.totalPlayers) {
    playerList.push(
      <NameWithAvatar small name="[Guest]" key={playerList.length} />
    );
  }

  result.push(
    <InfoSection title="Players" key="players">
      <div>{playerList}</div>
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
      var broadcastClosedRoles =
        game.settings.gameTypeOptions.broadcastClosedRoles;
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
            title="Broadcast Closed Roles"
            content={broadcastClosedRoles}
            key="broadcastClosedRoles"
          />
        </InfoSection>
      );
      break;
    case "Ghost":
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
