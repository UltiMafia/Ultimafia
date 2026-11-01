// Browser fixture for test/run-spectate-session.cjs: the real
// useHostedGameSession hook plus a fake Game keyed the way Main keys it.
// Buttons simulate the lobby's Join/Spectate links (fresh session state),
// ordinary in-app links to the same game (no state), and a confirmed role
// switch that rewrites the URL without remounting.
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
    membershipRequest,
    setHostedGameMembership,
    clearMembershipRequest,
    leaveGameSession,
  } = useHostedGameSession();

  useEffect(() => {
    if (
      membershipRequest &&
      membershipRequest.membership === hostedGameMembership
    ) {
      clearMembershipRequest(membershipRequest.nonce);
    }
  }, [
    membershipRequest,
    hostedGameMembership,
    clearMembershipRequest,
  ]);

  function applyRequest() {
    if (!membershipRequest) return;
    const membership = membershipRequest.membership;
    setHostedGameMembership(membership);
    clearMembershipRequest(membershipRequest.nonce);
    navigate(`/game/g1${membership === "spectator" ? "?spectate=true" : ""}`, {
      replace: true,
      state: { membershipUpdate: true },
    });
  }

  return (
    <div>
      <button onClick={() => navigate("/play")}>Play</button>
      <button
        onClick={() =>
          navigate("/game/g1", { state: joinGameSessionState() })
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
      <button onClick={applyRequest}>Apply request</button>
      <button onClick={leaveGameSession}>Leave</button>
      <div data-testid="in-game">{String(inGame)}</div>
      <div data-testid="membership">{hostedGameMembership || ""}</div>
      <div data-testid="request">
        {membershipRequest
          ? `${membershipRequest.membership}:${membershipRequest.nonce}`
          : ""}
      </div>
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
