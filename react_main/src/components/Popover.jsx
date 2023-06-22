import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import axios from "axios";

import { GameContext, PopoverContext, SiteInfoContext } from "../Contexts";
import { Time } from "./Basic";
import { SmallRoleList, GameStateIcon } from "./Setup";
import { NameWithAvatar } from "../pages/User/User";
import { useErrorAlert } from "./Alerts";
import { GameStates, Alignments } from "../Constants";
import { useOnOutsideClick } from "./Basic";

import "../css/popover.css";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import { tempParseProfilesToWords } from "./Deck";

export default function Popover() {
  const popover = useContext(PopoverContext);
  const popoverRef = useRef();
  const triangleRef = useRef();
  const sideContentRef = useRef();

  useOnOutsideClick([{ current: popover.boundingEl }, popoverRef], () => {
    if (!popover.loadingRef.current) {
      popover.setVisible(false);
      popover.setSideContentVisible(false);
      popover.setBoundingEl(null);
    }
  });

  useLayoutEffect(() => {
    if (!popover.visible) return;

    const boundingRect = popover.boundingEl.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    var triangleLeft = boundingRect.left + boundingRect.width;
    var triangleTop =
      boundingRect.top - 10 + boundingRect.height / 2 + window.scrollY;

    var popoverLeft = boundingRect.left + boundingRect.width + 10;
    var popoverTop =
      boundingRect.top -
      popoverRect.height / 2 +
      boundingRect.height / 2 +
      window.scrollY;
    var popoverHorzShift =
      window.innerWidth - (popoverLeft + popoverRect.width);

    if (popoverTop < window.scrollY) popoverTop = window.scrollY;

    if (popoverHorzShift < 0) {
      if (popoverLeft + popoverHorzShift < 0)
        popoverHorzShift -= popoverLeft + popoverHorzShift;
    } else popoverHorzShift = 0;

    popoverLeft += popoverHorzShift;
    triangleLeft += popoverHorzShift;

    triangleRef.current.style.left = triangleLeft + "px";
    triangleRef.current.style.top = triangleTop + "px";
    triangleRef.current.style.visibility = "visible";

    popoverRef.current.style.top = popoverTop + "px";
    popoverRef.current.style.left = popoverLeft + "px";
    popoverRef.current.style.visibility = "visible";

    if (popover.sideContentVisible) {
      sideContentRef.current.style.width = popoverRect.width + "px"; // Gives consistent styling + just makes loading not funky

      const useLeft =
        popoverRect.x > window.innerWidth - (popoverRect.x + popoverRect.width)
          ? popoverRect.x - popoverRect.width
          : popoverRect.x + popoverRect.width;

      sideContentRef.current.style.top = popover.sideContentMouseY + "px";
      sideContentRef.current.style.left = useLeft + "px";
      sideContentRef.current.style.visibility = "visible";
    }
  });

  return (
    popover.visible && (
      <>
        <div className="triangle triangle-left" ref={triangleRef} />
        <div className={`popover-window`} ref={popoverRef}>
          <div className="popover-title">{popover.title}</div>
          {!popover.loading && (
            <div className="popover-content">{popover.content}</div>
          )}
        </div>
        {popover.sideContentVisible && (
          <div className={`popover-window`} ref={sideContentRef}>
            <div className="popover-title">{popover.sideContentTitle}</div>
            {!popover.sideContentLoading && (
              <div className="popover-content">{popover.sideContent}</div>
            )}
          </div>
        )}
      </>
    )
  );
}

export function usePopover(siteInfo) {
  const [visible, setVisible] = useState(false);
  const [boundingEl, setBoundingEl] = useState();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sideContent, setSideContent] = useState("");
  const [sideContentTitle, setSideContentTitle] = useState("");
  const [sideContentVisible, setSideContentVisible] = useState("");
  const [sideContentLoading, setSideContentLoading] = useState(false);
  const [sideContentMouseY, setSideContentMouseY] = useState(0);

  const loadingRef = useRef();
  const errorAlert = useErrorAlert(siteInfo);

  function close() {
    setVisible(false);
    setSideContentVisible(false);
    setBoundingEl(null);
  }

  function onClick(path, type, _boundingEl, title, dataMod) {
    if (_boundingEl == boundingEl) {
      setVisible(false);
      setSideContentVisible(false);
      setBoundingEl(null);
    } else load(path, type, _boundingEl, title, dataMod);
  }

  function onHover(path, type, _boundingEl, title, dataMod, mouseY) {
    if (!sideContentLoading && title !== sideContentTitle) {
      // using this just so requests aren't massive
      setSideContentMouseY(mouseY);
      load(path, type, _boundingEl, title, dataMod, true);
    }
  }

  function open(boundingEl, title, sideload) {
    if (sideload) {
      setSideContentTitle(title);
      setSideContentLoading(true);
      setSideContentVisible(true);
    } else {
      setBoundingEl(boundingEl);

      setTitle(title);
      setSideContentVisible(false);
      setLoading(true);
      setVisible(true);

      loadingRef.current = true;
    }
  }

  function ready(content, type, title, sideload) {
    switch (type) {
      case "setup":
        content = parseSetupPopover(content, siteInfo.roles);
        break;
      case "deck":
        content = parseDeckPopover(content);
        break;
      case "rolePrediction":
        content = parseRolePredictionPopover(content);
        break;
      case "role":
        content = parseRolePopover(content);
        break;
      case "game":
        content = parseGamePopover(content);
        break;
    }

    if (sideload) {
      setSideContent(content);
      setSideContentTitle(title); // doing this here guarentees the content + title are synced if multiple hovers are firing at once
      setSideContentLoading(false);
    } else {
      setContent(content);
      setLoading(false);
    }
  }

  function load(path, type, boundingEl, title, dataMod, sideload) {
    open(boundingEl, title, sideload);

    axios
      .get(path)
      .then((res) => {
        if (dataMod) dataMod(res.data);

        loadingRef.current = false;
        ready(res.data, type, title, sideload);
      })
      .catch(errorAlert);
  }

  return {
    visible,
    setVisible,
    boundingEl,
    setBoundingEl,
    title,
    setTitle,
    content,
    setContent,
    loading,
    setLoading,
    close,
    onClick,
    onHover,
    open,
    ready,
    load,
    loadingRef,
    sideContent,
    sideContentVisible,
    setSideContentVisible,
    sideContentTitle,
    sideContentLoading,
    sideContentMouseY,
  };
}

function InfoRow(props) {
  return (
    <div className="info-row">
      <div className="title">{props.title}</div>
      <div className="content">{props.content}</div>
    </div>
  );
}

export function parseSetupPopover(setup, roleData) {
  const result = [];

  // setup page
  result.push(
    <InfoRow
      title="Setup Page (Beta)"
      content={
        <Link className="content" to={`/learn/setup/${setup.id}`}>
          [Click to View]
        </Link>
      }
      key="setupPage"
    />
  );

  // ID
  result.push(<InfoRow title="ID" content={setup.id} key="id" />);

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

  //Total
  result.push(<InfoRow title="Players" content={setup.total} key="players" />);

  //Ranked
  result.push(
    <InfoRow
      title="Ranked Allowed"
      content={setup.ranked ? "Yes" : "No"}
      key="ranked"
    />
  );

  //Whispers
  const whisperContent = [];
  whisperContent.push(
    <div key="whispers">{setup.whispers ? "Yes" : "No"}</div>
  );

  if (setup.whispers)
    whisperContent.push(
      <div key="whispersLeak">{setup.leakPercentage}% leak rate</div>
    );

  result.push(
    <InfoRow title="Whispers" content={whisperContent} key="whispers" />
  );

  //Must act
  result.push(
    <InfoRow
      title="Must Act"
      content={setup.mustAct ? "Yes" : "No"}
      key="mustAct"
    />
  );

  //Game settings
  switch (setup.gameType) {
    case "Mafia":
      //Starting state
      result.push(
        <InfoRow
          title="Starting State"
          content={<GameStateIcon state={setup.startState} />}
          key="startState"
        />
      );

      //Dawn
      result.push(
        <InfoRow title="Dawn" content={setup.dawn ? "Yes" : "No"} key="dawn" />
      );

      //Last will
      result.push(
        <InfoRow
          title="Last Will"
          content={setup.lastWill ? "Yes" : "No"}
          key="lastWill"
        />
      );

      //No reveal
      result.push(
        <InfoRow
          title="No Reveal"
          content={setup.noReveal ? "Yes" : "No"}
          key="noReveal"
        />
      );

      //Votes invisible
      result.push(
        <InfoRow
          title="Votes Invisible"
          content={setup.votesInvisible ? "Yes" : "No"}
          key="votesInvis"
        />
      );
      break;
    case "Split Decision":
      //Initial swap amount
      result.push(
        <InfoRow
          title="Initial Swap Amount"
          content={setup.swapAmt}
          key="initSwapAmt"
        />
      );

      //Round amount
      result.push(
        <InfoRow title="Round Amount" content={setup.roundAmt} key="roundAmt" />
      );
      break;
    case "Resistance":
      //First team size
      result.push(
        <InfoRow
          title="First Team Size"
          content={setup.firstTeamSize}
          key="firstTeamSize"
        />
      );

      //Last team size
      result.push(
        <InfoRow
          title="Last Team Size"
          content={setup.lastTeamSize}
          key="lastTeamSize"
        />
      );

      //Number of Missions
      result.push(
        <InfoRow
          title="Number of Missions"
          content={setup.numMissions}
          key="numMissions"
        />
      );

      //Team Formation Attempts
      result.push(
        <InfoRow
          title="Team Formation Attempts"
          content={setup.teamFailLimit}
          key="teamFailLimit"
        />
      );
      break;
    case "One Night":
      //Votes invisible
      result.push(
        <InfoRow
          title="Votes Invisible"
          content={setup.votesInvisible ? "Yes" : "No"}
          key="votesInvis"
        />
      );

      //Excess roles
      result.push(
        <InfoRow
          title="Excess Roles"
          content={setup.excessRoles}
          key="excessRoles"
        />
      );
      break;
  }

  //Roles
  if (setup.closed) {
    result.push(
      <InfoRow
        title="Unique Roles"
        content={setup.unique ? "Yes" : "No"}
        key="uniqueRoles"
      />
    );

    // Currently, only Mafia supports unique without modifier
    if (setup.unique && setup.gameType == "Mafia") {
      result.push(
        <InfoRow
          title="Unique Without Modifier"
          content={setup.uniqueWithoutModifier ? "Yes" : "No"}
          key="uniqueRolesWithoutModifier"
        />
      );
    }

    result.push(
      <InfoRow
        title="Role Groups"
        content={setup.useRoleGroups ? "Yes" : "No"}
        key="useRoleGroups"
      />
    );
  }

  if (setup.closed && !setup.useRoleGroups) {
    const roleset = setup.roles[0];
    var rolesByAlignment = {};

    for (let role in roleset) {
      let roleName = role.split(":")[0];

      for (let roleObj of roleData[setup.gameType]) {
        if (roleObj.name == roleName) {
          let alignment = roleObj.alignment;

          if (!rolesByAlignment[alignment]) rolesByAlignment[alignment] = {};

          rolesByAlignment[alignment][role] = roleset[role];
        }
      }
    }

    for (let alignment in rolesByAlignment) {
      result.push(
        <InfoRow
          title={`${alignment} roles`}
          content={
            <SmallRoleList
              roles={rolesByAlignment[alignment]}
              gameType={setup.gameType}
            />
          }
          key={alignment}
        />
      );
    }
  } else {
    const rolesets = [];
    let multiName = setup.useRoleGroups ? "Role Groups" : "Role Sets";
    const sectionName = setup.roles.length > 1 ? multiName : "Roles";

    for (let i in setup.roles) {
      let roleset = setup.roles[i];
      let title = setup.useRoleGroups ? `(${setup.roleGroupSizes[i]})` : "";

      rolesets.push(
        <SmallRoleList
          title={title}
          roles={roleset}
          gameType={setup.gameType}
          key={i}
        />
      );
    }

    result.push(<InfoRow title={sectionName} content={rolesets} key="roles" />);
  }

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
    result.push(<InfoRow title="Created By" content={deck} key="createdBy" />);
  }

  //Words
  let words = tempParseProfilesToWords(deck.profiles)
  result.push(<InfoRow title="Words" content={words} key="words" />);

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

  result.push(<InfoRow title="Players" content={playerList} key="players" />);

  //State lengths
  const stateLengths = [];

  for (let stateName of GameStates[game.type]) {
    stateLengths.push(
      <div key={stateName}>
        {stateName}: <Time millisec={game.settings.stateLengths[stateName]} />
      </div>
    );
  }

  result.push(
    <InfoRow title="State Lengths" content={stateLengths} key="stateLengths" />
  );

  //Ranked
  result.push(
    <InfoRow
      title="Ranked"
      content={game.settings.ranked ? "Yes" : "No"}
      key="ranked"
    />
  );

  //Spectating
  result.push(
    <InfoRow
      title="Spectating"
      content={game.settings.spectating ? "Yes" : "No"}
      key="spectating"
    />
  );

  //Guests
  result.push(
    <InfoRow
      title="Guests Allowed"
      content={game.settings.guests ? "Yes" : "No"}
      key="guests"
    />
  );

  //Ready Check
  result.push(
    <InfoRow
      title="Ready Check"
      content={game.settings.readyCheck ? "Yes" : "No"}
      key="readyCheck"
    />
  );

  switch (game.type) {
    case "Mafia":
      var extendLength = game.settings.gameTypeOptions.extendLength || 3;
      result.push(
        <InfoRow
          title="Extension Length"
          content={<Time millisec={extendLength * 60 * 1000} />}
          key="extendLength"
        />
      );
      break;
  }

  //Created at
  if (game.createTime)
    result.push(
      <InfoRow
        title="Created At"
        content={new Date(game.createTime).toLocaleString()}
        key="createdAt"
      />
    );

  //Started at
  if (game.startTime)
    result.push(
      <InfoRow
        title="Started At"
        content={new Date(game.startTime).toLocaleString()}
        key="startedAt"
      />
    );

  //Ended at
  if (game.endTime)
    result.push(
      <InfoRow
        title="Ended At"
        content={new Date(game.endTime).toLocaleString()}
        key="endedAt"
      />
    );

  return result;
}

export function parseRolePopover(role) {
  const result = [];

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

  return result;
}
