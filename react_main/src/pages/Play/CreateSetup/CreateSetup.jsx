import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";

import CreateMafiaSetup from "./CreateMafiaSetup";
import CreateJottoSetup from "./CreateJottoSetup";
import CreateAcrotopiaSetup from "./CreateAcrotopiaSetup";
import CreateSecretDictatorSetup from "./CreateSecretDictatorSetup";
import CreateWackyWordsSetup from "./CreateWackyWordsSetup";
import CreateDrawItSetup from "./CreateDrawItSetup";
import CreateLiarsDiceSetup from "./CreateLiarsDiceSetup";
import CreateTexasHoldEmSetup from "./CreateTexasHoldEmSetup";
import CreateCheatSetup from "./CreateCheatSetup";
import CreateRatscrewSetup from "./CreateRatscrewSetup";
import CreateBattlesnakesSetup from "./CreateBattlesnakesSetup";
import CreateDiceWarsSetup from "./CreateDiceWarsSetup";
import CreateConnectFourSetup from "./CreateConnectFourSetup";
import CreateSpotItSetup from "./CreateSpotItSetup";
import CreateBattleshipSetup from "./CreateBattleshipSetup";
import CreateChessSetup from "./CreateChessSetup";

import { ActiveGameTypes } from "Constants";
import { UiField, UiDialog, UiAction } from "components/ui";

export default function CreateSetup(props) {
  const defaultGameType = "Mafia";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestedGameType =
    params.get("game") || localStorage.getItem("gameType") || defaultGameType;
  const [gameType, setGameType] = useState(
    ActiveGameTypes.includes(requestedGameType) ? requestedGameType : defaultGameType
  );
  const [pendingGameType, setPendingGameType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const gameParam = new URLSearchParams(location.search).get("game");
    if (ActiveGameTypes.includes(gameParam) && gameParam !== gameType) {
      setGameType(gameParam);
      localStorage.setItem("gameType", gameParam);
    }
  }, [location.search]);

  const handleListItemClick = (newValue) => {
    setGameType(newValue);
    localStorage.setItem("gameType", newValue);
    const params = new URLSearchParams(location.search);
    params.set("game", newValue);
    // A source setup belongs to its game type, never carry it into a different editor.
    params.delete("copy");
    params.delete("edit");
    // Replace, not push: picking a game type filters this page, it is not a
    // navigation, and a pushed entry would need extra Back presses to leave.
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: true }
    );
  };

  function CreatePage() {
    switch (gameType) {
      case "Mafia":
        return <CreateMafiaSetup />;
      case "Jotto":
        return <CreateJottoSetup />;
      case "Acrotopia":
        return <CreateAcrotopiaSetup />;
      case "Secret Dictator":
        return <CreateSecretDictatorSetup />;
      case "Wacky Words":
        return <CreateWackyWordsSetup />;
      case "Draw It":
        return <CreateDrawItSetup />;
      case "Liars Dice":
        return <CreateLiarsDiceSetup />;
      case "Texas Hold Em":
        return <CreateTexasHoldEmSetup />;
      case "Cheat":
        return <CreateCheatSetup />;
      case "Ratscrew":
        return <CreateRatscrewSetup />;
      case "Battlesnakes":
        return <CreateBattlesnakesSetup />;
      case "Dice Wars":
        return <CreateDiceWarsSetup />;
      case "Connect Four":
        return <CreateConnectFourSetup />;
      case "Spot It":
        return <CreateSpotItSetup />;
      case "Battleship":
        return <CreateBattleshipSetup />;
      case "Chess":
        return <CreateChessSetup />;
      default:
        return <CreateMafiaSetup />;
    }
  }

  return (
    <>
      <header className="page-heading setup-editor-heading">
        <h1>{params.has("edit") ? "Edit setup" : params.has("copy") ? "Copy setup" : "Create a setup"}</h1>
        <UiField select size="small" label="Game type" InputLabelProps={{ shrink: true }} SelectProps={{ native: true }} value={gameType} onChange={event => setPendingGameType(event.target.value)}>{ActiveGameTypes.map(game => <option key={game}>{game}</option>)}</UiField>
      </header>
      {CreatePage()}
      <UiDialog open={!!pendingGameType} title="Change game type?" onClose={() => setPendingGameType(null)} actions={<><UiAction onClick={() => setPendingGameType(null)}>Cancel</UiAction><UiAction variant="primary" onClick={() => { handleListItemClick(pendingGameType); setPendingGameType(null); }}>Change game type</UiAction></>}><p>Changing to {pendingGameType} opens a different setup editor. Unsaved changes in this editor will be lost.</p></UiDialog>
    </>
  );
}
