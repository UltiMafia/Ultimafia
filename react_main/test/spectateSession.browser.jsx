// Browser fixture for test/run-spectate-session.cjs: the real
// useHostedGameSession hook plus a fake Game keyed the way Main keys it.
// Buttons simulate the lobby's Join/Spectate links (fresh session state) and
// ordinary in-app links to the same game (no state).
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useHostedGameSession } from "../src/hooks/useHostedGameSession";
import { FRESH_GAME_SESSION_STATE } from "../src/shared/hostedGameSession";

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
  } = useHostedGameSession();

  return (
    <div>
      <button onClick={() => navigate("/play")}>Play</button>
      <button
        onClick={() => navigate("/game/g1", { state: FRESH_GAME_SESSION_STATE })}
      >
        Join g1
      </button>
      <button
        onClick={() =>
          navigate("/game/g1?spectate=true", {
            state: FRESH_GAME_SESSION_STATE,
          })
        }
      >
        Spectate g1
      </button>
      <button onClick={() => navigate("/game/g2")}>Join g2</button>
      <button onClick={() => navigate("/game/g1?spectate=true")}>
        Plain spectate link g1
      </button>
      <div data-testid="in-game">{String(inGame)}</div>
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
