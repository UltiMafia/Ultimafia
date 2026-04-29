import React, { useContext, useEffect, useState } from "react";
import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  SettingsMenu,
  PlayerList,
  MobileLayout,
  GameTypeContext,
  TextMeetingLayout,
  ActionList,
} from "./Game";
import { GameContext } from "../../Contexts";
import roleData from "../../../../data/roles";
import "css/game.css";
import "css/gameAcrotopia.css";
const images = require.context('../../images/roles', true, /\.png$/);

export default function SpotItGame(props) {
  const game = useContext(GameContext);
  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;

  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState, updateStateViewing]);

  useEffect(() => {
    if (game.review) updateStateViewing({ type: "first" });
  }, [game.review, updateStateViewing]);

  useSocketListeners((socket) => {
    socket.on("state", () => {
      updateStateViewing({ type: "current" });
    });
    socket.on("winners", () => {});
  }, game.socket);

  const stateIndex = stateViewing < 0 ? history.states.length - 1 : stateViewing;
  const extraInfo = history.states[stateIndex]?.extraInfo;
  const [lastExtraInfo, setLastExtraInfo] = useState(null);

  useEffect(() => {
    if (extraInfo) {
      setLastExtraInfo(extraInfo);
    }
  }, [extraInfo]);

  const activeExtraInfo = extraInfo || lastExtraInfo;
  const scores = activeExtraInfo?.scores;
  const cardStackSizes = activeExtraInfo?.cardStackSizes;
  const isWell = activeExtraInfo?.isWell;

  const renderPlayerMarker = (player) => {
    if (isWell) {
      const stackSize = cardStackSizes?.[player.id];
      return (
        <span className="acrotopia-score-chip acrotopia-player-chip">
          {stackSize === 0 ? "✓" : `${stackSize ?? "?"} left`}
        </span>
      );
    }
    return (
      <span className="acrotopia-score-chip acrotopia-player-chip">
        {scores?.[player.id] ?? 0}
      </span>
    );
  };

  const leftPanel = (
    <>
      <PlayerList renderMarker={extraInfo ? renderPlayerMarker : undefined} />
      <SettingsMenu />
    </>
  );

  return (
    <GameTypeContext.Provider value={{ singleState: true }}>
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={leftPanel}
        centerPanelContent={<SpotItBoard self={self} />}
        rightPanelContent={<TextMeetingLayout />}
      />
      <MobileLayout
        outerLeftContent={leftPanel}
        innerRightContent={<TextMeetingLayout />}
        centerContent={<SpotItBoard self={self} />}
      />
    </GameTypeContext.Provider>
  );
}

function SpotItBoard({ self }) {
  const game = useContext(GameContext);
  const history = game.history;
  const stateViewing = game.stateViewing;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (stateViewing < 0) return <div></div>;

  const extraInfo = history.states[stateViewing]?.extraInfo;
  if (!extraInfo) return <div style={{ padding: "16px" }}>Loading...</div>;

  const { centerCard = [], playerCards = {} } = extraInfo;
  const myCard = playerCards?.[self] || [];

  const handleSymbolClick = (symbolPath) => {
    const meetings = history.states[stateViewing]?.meetings;
    const claimMeeting = meetings && Object.values(meetings).find(m => m.name === "Claim Match");
    if (claimMeeting) {
      game.socket.send("vote", {
        meetingId: claimMeeting.id,
        selection: symbolPath,
      });
    }
  };

  return (
    <div style={{
      padding: "16px",
      paddingTop: isMobile ? "0" : "80px",
      display: "flex",
      gap: isMobile ? "0" : "32px",
      justifyContent: "center",
      alignItems: "flex-start",
      flexDirection: isMobile ? "column" : "row",
      height: "100%",
    }}>
      <div>
        <h3 style={{ textAlign: "center" }}>Center Card</h3>
        <SpotItCard symbols={centerCard} onSymbolClick={handleSymbolClick} isCenter />
      </div>
      <div>
        <h3 style={{ textAlign: "center" }}>Your Card</h3>
        <SpotItCard symbols={myCard} onSymbolClick={handleSymbolClick} />
      </div>
    </div>
  );
}

function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
    return ((h >>> 0) / 0xffffffff);
  };
}

function SpotItCard({ symbols, onSymbolClick, isCenter }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!symbols || !Array.isArray(symbols)) {
    return <div style={{ padding: "16px", textAlign: "center" }}>Loading card...</div>;
  }

  const cardSize = isMobile ? Math.min(window.innerWidth - 40, 250) : 300;
  const center = cardSize / 2;

  // Seed based on the whole card's symbol set so it's stable but unique per card
  const rand = seededRandom(symbols.join(","));
  const placed = [];

  const positions = symbols.map((_, i) => {
    const baseSize = symbols.length > 8 ? 20 : 30;
    let size = baseSize + Math.floor(rand() * 20);

    let x = center, y = center;
    let placed_successfully = false;

    for (let shrink = 0; shrink < 3; shrink++) {
      const r = (size / 2) * Math.SQRT2;
      const maxR = center - r - 6;
      if (maxR <= 0) { size = Math.floor(size * 0.8); continue; }

      for (let attempt = 0; attempt < 300; attempt++) {
        const angle = rand() * 2 * Math.PI;
        const radius = (0.3 + rand() * 0.7) * maxR;
        const tx = center + radius * Math.cos(angle);
        const ty = center + radius * Math.sin(angle);

        let overlaps = false;
        for (const p of placed) {
          const pr = (p.size / 2) * Math.SQRT2;
          const dx = tx - p.x;
          const dy = ty - p.y;
          if (Math.sqrt(dx*dx + dy*dy) < r + pr) { overlaps = true; break; }
        }

        if (!overlaps) {
          x = tx; y = ty;
          placed_successfully = true;
          break;
        }
      }
      if (placed_successfully) break;
      size = Math.max(Math.floor(size * 0.9), 90);
    }

    const rotation = Math.floor(rand() * 360);
    placed.push({ x, y, size });
    return { x, y, size, rotation };
  });

  return (
    <div style={{
      position: "relative",
      background: isCenter ? "#2a2a4a" : "#1a1a2e",
      border: isCenter ? "2px solid #7c7cff" : "2px solid #444",
      borderRadius: "50%",
      width: `${cardSize}px`,
      height: `${cardSize}px`,
      margin: "0 auto",
      overflow: "hidden",
      flexShrink: 0,
      alignSelf: "center",
    }}>
      {symbols.map((symbol, i) => (
        <div key={symbol} style={{
          position: "absolute",
          left: `${positions[i].x}px`,
          top: `${positions[i].y}px`,
          transform: `translate(-50%, -50%) rotate(${positions[i].rotation}deg)`,
          cursor: onSymbolClick ? "pointer" : "default",
          zIndex: 1,
        }}>
          <SymbolIcon
            symbol={symbol}
            onClick={onSymbolClick ? () => onSymbolClick(symbol) : null}
            size={positions[i].size}
          />
        </div>
      ))}
    </div>
  );
}

function SymbolIcon({ symbol, onClick, size }) {
  const roleKey = symbol
    .replace("-vivid.png", "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const roleInfo = roleData?.Mafia?.[roleKey];
  const alignment = (roleInfo?.alignment || "Village").toLowerCase();

  let imageSrc;
  try {
    imageSrc = images(`./${symbol}`);
  } catch (err) {
    console.error("Image not found in src:", `./${alignment}/${symbol}`);
    imageSrc = "";
  }
  
  return (
    <img 
      src={imageSrc} 
      alt={roleKey} 
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px`, borderRadius: "8px" }} 
    />
  );
}