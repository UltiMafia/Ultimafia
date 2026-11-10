import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, IconButton, Tooltip } from "@mui/material";
import { useRankedTutorialGate } from "components/TutorialPrompt";
import { UserContext, SiteInfoContext } from "Contexts";
import { filterProfanity } from "components/Basic";
import { useErrorAlert } from "components/Alerts";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import { PlayerCount } from "./PlayerCount";
import UiIcon from "components/ui/UiIcon";
import { getRowStubColor } from "./gameRowColors";

export function GameStatus({ game, tools }) {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const reviewableTesting = game.lobby === "Testing" && game.status === "Finished";
  const full = game.status === "Open" && game.setup && game.players >= game.setup.total;
  const allowed = (user.loggedIn || game.status === "Finished") && !game.broken && (!game.private || reviewableTesting);
  const rankedJoin = game.status === "Open" && (game.ranked || game.competitive);
  let destination = `/game/${game.id}`;
  let label = "Join";
  let membership = { requestedMembership: "player" };
  let disabled = false;

  if (game.status === "In Progress") {
    label = game.spectating ? "Spectate" : "Ongoing";
    destination = game.spectating ? `${destination}?spectate=true` : "/play";
    membership = game.spectating ? { requestedMembership: "spectator" } : undefined;
    disabled = !game.spectating;
  } else if (game.status === "Finished") {
    label = "Review";
    membership = undefined;
  }

  // Navigation intent is applied by the retained game over its current socket.
  // Capacity limits joining, not spectating; do not merge these permission gates.
  const tutorialGate = useRankedTutorialGate(() => navigate(destination, { state: membership }));
  return (
    <div className="game-row-status">
      <PlayerCount game={game} gameId={game.id} anonymousGame={game.anonymousGame}
        status={game.status} numSlotsTaken={game.players} spectatingAllowed={game.spectating}
        spectatorCount={game.spectatorCount} />
      <div className="game-row-actions">
        {allowed && !full && <Button component={Link} to={destination} state={membership}
          onClick={rankedJoin ? tutorialGate.guard : undefined} disabled={disabled}
          variant={label === "Join" ? "contained" : "outlined"} color={label === "Join" ? "primary" : "inherit"}>
          {label}
        </Button>}
        {allowed && game.status === "Open" && game.spectating &&
          <Button component={Link} to={`/game/${game.id}?spectate=true`}
            state={{ requestedMembership: "spectator" }} variant="text" color="inherit">Spectate</Button>}
        {game.broken && <span className="game-access-note">Unavailable</span>}
        {game.private && !reviewableTesting && <span className="game-access-note"><UiIcon name="lock" size={16} /> Private</span>}
        {tools}
      </div>
      {rankedJoin && tutorialGate.dialog}
    </div>
  );
}

export function GameRow({ game, showLobbyName, showGameState, small }) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [hostDialogOpen, setHostDialogOpen] = useState(false);
  const canBreak = user.perms?.breakGame && !game.broken;
  const canRehost = !small && game.status === "Finished" && user.loggedIn;
  if (!game.setup) return null;

  function breakGame() {
    if (!canBreak || !window.confirm("Break this game? This cannot be undone.")) return;
    axios.post("/api/mod/breakGame", { gameId: game.id })
      .then(() => siteInfo.showAlert("Game broken.", "success")).catch(errorAlert);
  }

  const status = game.status === "Open" ? "Open" : game.status === "In Progress" ? (game.gameState || "In progress") : "Finished";
  return (
    <article className={`lobby-game-card${small ? " lobby-game-card--compact" : ""}${game.competitive ? " is-competitive" : game.ranked ? " is-ranked" : ""}`}
      style={{ "--game-category-color": getRowStubColor(game) }}
      data-game-id={game.id} data-status={game.status}>
      <div className="game-row-information">
        <div className="game-row-facts">
          {showGameState && <span className={`game-state-label ${game.status === "Open" ? "is-open" : ""}`}>{status}</span>}
          <span>{game.setup.gameType}</span>
           {game.competitive ? <span className="competitive-label">Competitive</span> : game.ranked ? <span className="ranked-label">Ranked</span> : null}
          {game.anonymousGame && <span>Anonymous</span>}
          <span>{game.lobby}</span>
        </div>
        <Setup setup={game.setup} summary />
        {showLobbyName && <div className="game-row-host">{filterProfanity(game.lobbyName, user.settings)}</div>}
      </div>
      <GameStatus game={game} tools={(canBreak || canRehost) && <div className="game-row-tools">
        {canRehost && <Tooltip title="Host this setup"><IconButton size="small" aria-label="Rehost game" onClick={() => setHostDialogOpen(true)}><UiIcon name="refresh" size={16} /></IconButton></Tooltip>}
        {canBreak && <Tooltip title="Break game"><IconButton size="small" aria-label="Break game" onClick={breakGame}><UiIcon name="warning" size={16} /></IconButton></Tooltip>}
      </div>} />
      <HostGameDialogue open={hostDialogOpen} setOpen={setHostDialogOpen} setup={game.setup} defaultLobby={game.lobby} />
    </article>
  );
}
