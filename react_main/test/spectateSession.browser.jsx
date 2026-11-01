// Browser fixture for test/run-spectate-session.cjs: the real
// useHostedGameSession hook plus a fake Game keyed the way Main keys it.
// Buttons simulate the lobby's Join/Spectate links (fresh session state),
// ordinary in-app links to the same game (no state), and a server-confirmed
// membership update that rewrites the URL without remounting.
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useHostedGameSession } from "../src/hooks/useHostedGameSession";
import {
  joinGameSessionState,
  spectateGameSessionState,
} from "../src/shared/hostedGameSession";

let nextInstance = 0;

function FakeGame({ gameId, joinSearch }) {
  const [instance] = useState(() => ++nextInstance);
  useEffect(() => {
    window.__sessionMounts = (window.__sessionMounts || 0) + 1;
    window.__sessionInstance = instance;
  }, [instance]);
  return (
    <div data-testid="game-session">
      {gameId}|{joinSearch}|{instance}
    </div>
  );
}

function Harness() {
  const navigate = useNavigate();
  const {
    inGame,
    hostedGameId,
    hostedGameSearch,
    hostedGameKey,
    hostedGameMembership,
    setHostedGameMembership,
  } = useHostedGameSession();

  function confirmMembership(membership) {
    setHostedGameMembership(membership);
    navigate(
      `/game/g1${membership === "spectator" ? "?spectate=true" : ""}`,
      { replace: true, state: { membershipUpdate: true } }
    );
  }

  return (
    <div>
      <button onClick={() => navigate("/play")}>Play</button>
      <button
        onClick={() =>
          navigate("/game/g1?join=true", { state: joinGameSessionState() })
        }
      >
        Join g1
      </button>
      <button
        onClick={() =>
          navigate("/game/g1?spectate=true", {
            state: spectateGameSessionState(),
          })
        }
      >
        Spectate g1
      </button>
      <button onClick={() => navigate("/game/g2")}>Join g2</button>
      <button onClick={() => navigate("/game/g1?spectate=true")}>
        Plain spectate link g1
      </button>
      <button onClick={() => confirmMembership("spectator")}>
        Confirm spectating
      </button>
      <button onClick={() => confirmMembership("player")}>
        Confirm seated
      </button>
      <div data-testid="in-game">{String(inGame)}</div>
      <div data-testid="membership">{hostedGameMembership || ""}</div>
      {hostedGameId && (
        <FakeGame
          key={hostedGameKey}
          gameId={hostedGameId}
          joinSearch={hostedGameSearch}
        />
      )}
    </div>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <Harness />
  </BrowserRouter>,
  document.getElementById("root"),
  () => {
    window.__sessionReady = true;
  }
);
