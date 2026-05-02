import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ThreePanelLayout,
  TopBar,
  SettingsMenu,
  PlayerList,
  MobileLayout,
  GameTypeContext,
  TextMeetingLayout,
  ActionList,
} from "./Game";
import { GameContext, SiteInfoContext } from "../../Contexts";
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

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const [liveExtraInfo, setLiveExtraInfo] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  const handlersRef = useRef({});
  handlersRef.current.state = () => {
    updateStateViewing({ type: "current" });
    setLiveExtraInfo(null);
  };
  handlersRef.current.toast = ({ message }) => {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3000);
  };
  handlersRef.current.extraInfo = (info) => setLiveExtraInfo(info);

  const registeredSocketRef = useRef(null);
  useEffect(() => {
    const socket = game.socket;
    if (!socket || !socket.on) return;
    if (registeredSocketRef.current === socket) return;
    registeredSocketRef.current = socket;

    socket.on("state", (...args) => handlersRef.current.state?.(...args));
    socket.on("winners", () => {});
    socket.on("spotItToast", (data) => handlersRef.current.toast?.(data));
    socket.on("spotItExtraInfo", (data) => handlersRef.current.extraInfo?.(data));
  }, [game.socket]);

  const stateIndex = stateViewing < 0 ? history.states.length - 1 : stateViewing;
  const extraInfo = history.states[stateIndex]?.extraInfo;
  const [lastExtraInfo, setLastExtraInfo] = useState(null);

  useEffect(() => {
    if (extraInfo) {
      setLastExtraInfo(extraInfo);
    }
  }, [extraInfo]);

  const activeExtraInfo = liveExtraInfo || extraInfo || lastExtraInfo;
  const scores = activeExtraInfo?.scores;
  const cardStackSizes = activeExtraInfo?.cardStackSizes;
  const isWell = activeExtraInfo?.isWell;
  const disqualifiedIds = activeExtraInfo?.disqualified || [];
  const lastWinnerId = activeExtraInfo?.lastWinner;

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

  const renderPlayerRowEnd = (player) => {
    if (lastWinnerId === player.id) {
      return <i className="fas fa-star" style={{ color: "#ffc107", fontSize: "1.2rem" }} title="Round winner" />;
    }
    if (disqualifiedIds.includes(player.id)) {
      return <i className="fas fa-times-circle" style={{ color: "#e02626", fontSize: "1.2rem" }} title="Disqualified" />;
    }
    return null;
  };

  const leftPanel = (
    <>
      <PlayerList
        renderMarker={extraInfo ? renderPlayerMarker : undefined}
        renderRowEnd={extraInfo ? renderPlayerRowEnd : undefined}
      />
      <SettingsMenu />
    </>
  );

  const board = (
    <div style={{ position: "relative", height: "100%" }}>
      <SpotItBoard self={self} liveExtraInfo={liveExtraInfo} />
      <SpotItToasts toasts={toasts} />
      {showIntro && activeExtraInfo && (
        <SpotItIntro isWell={isWell} onDismiss={() => setShowIntro(false)} />
      )}
    </div>
  );

  return (
    <GameTypeContext.Provider value={{ singleState: true }}>
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={leftPanel}
        centerPanelContent={board}
        rightPanelContent={<TextMeetingLayout />}
      />
      <MobileLayout
        outerLeftNavigationProps={{
          label: "Info",
          value: "players",
          icon: <i className="fas fa-info" />,
        }}
        outerLeftContent={leftPanel}
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-gamepad" />,
        }}
        innerRightContent={board}
        chatTab
        hideInfoTab
      />
    </GameTypeContext.Provider>
  );
}

function SpotItIntro({ isWell, onDismiss }) {
  const title = isWell ? "The Well" : "Tower";
  const tagline = isWell
    ? "Find matches, clear your stack and win!"
    : "Find as many matches from your card to earn points!";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          background: "#222",
          border: "2px solid #444",
          borderRadius: 12,
          padding: "32px",
          maxWidth: 400,
          textAlign: "center",
          color: "#FFF",
          boxShadow: "0 4px 24px #000a",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: "22px" }}>{title}</h2>
        <p style={{ margin: "0 0 24px", fontSize: "15px", lineHeight: 1.5, color: "#CCC" }}>
          {tagline}
        </p>
        <button
          onClick={onDismiss}
          style={{
            padding: "10px 32px",
            fontSize: "16px",
            fontWeight: "bold",
            background: "#4a90d9",
            color: "#FFF",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function SpotItToasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div style={{
      position: "absolute",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      pointerEvents: "none",
      zIndex: 50,
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: "10px 18px",
          borderRadius: "8px",
          background: "rgba(20, 20, 20, 0.9)",
          color: "#fff",
          fontSize: "1.1rem",
          fontWeight: 600,
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.6)",
          animation: "spotit-toast-fade 3s ease-in-out forwards",
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function SpotItBoard({ self, liveExtraInfo }) {
  const game = useContext(GameContext);
  const history = game.history;
  const stateViewing = game.stateViewing;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (stateViewing < 0) return <div></div>;

  const extraInfo = liveExtraInfo || history.states[stateViewing]?.extraInfo;
  if (!extraInfo) return <div style={{ padding: "16px" }}>Loading...</div>;

  const { centerCard = [], playerCards = {} } = extraInfo;
  const myCard = playerCards?.[self] || [];
  const paused = extraInfo.paused;
  const disqualifiedHere = extraInfo.disqualified?.includes(self);

  const handleSymbolClick = (symbolPath) => {
    if (paused || disqualifiedHere) return;
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
      padding: isMobile ? "8px" : "16px",
      paddingTop: isMobile ? "8px" : "80px",
      display: "flex",
      gap: isMobile ? "12px" : "32px",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: isMobile ? "column" : "row",
      height: "100%",
      overflow: "auto",
      boxSizing: "border-box",
    }}>
      <div style={{ width: isMobile ? "100%" : undefined }}>
        <h3 style={{ textAlign: "center", margin: isMobile ? "4px 0" : undefined }}>Center Card</h3>
        <SpotItCard symbols={centerCard} onSymbolClick={handleSymbolClick} isCenter mobile={isMobile} />
      </div>
      <div style={{ width: isMobile ? "100%" : undefined }}>
        <h3 style={{ textAlign: "center", margin: isMobile ? "4px 0" : undefined }}>Your Card</h3>
        <SpotItCard symbols={myCard} onSymbolClick={handleSymbolClick} mobile={isMobile} />
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

function SpotItCard({ symbols, onSymbolClick, isCenter, mobile }) {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!symbols || !Array.isArray(symbols)) {
    return <div style={{ padding: "16px", textAlign: "center" }}>Loading card...</div>;
  }

  const cardWidth = mobile ? Math.min(viewportWidth - 32, 480) : 300;
  const cardHeight = mobile ? 200 : 300;
  const padding = 8;

  const rand = seededRandom(symbols.join(","));
  const placed = [];

  const refDim = mobile ? Math.min(cardWidth, cardHeight) : cardWidth;
  const sizeScale = refDim / 250;
  const cx = cardWidth / 2;
  const cy = cardHeight / 2;
  const circleRadius = Math.min(cardWidth, cardHeight) / 2;

  const positions = symbols.map((_, i) => {
    const baseSize = (symbols.length > 8 ? 22 : 28) * sizeScale;
    let size = Math.round(baseSize + rand() * 14 * sizeScale);

    let x = cx, y = cy;
    let placed_successfully = false;

    for (let shrink = 0; shrink < 5; shrink++) {
      const r = (size / 2) * Math.SQRT2;

      let canPlace = true;
      if (mobile) {
        if (cardWidth - 2 * (r + padding) <= 0 || cardHeight - 2 * (r + padding) <= 0) {
          canPlace = false;
        }
      } else {
        if (circleRadius - r - padding <= 0) canPlace = false;
      }
      if (!canPlace) {
        size = Math.max(Math.floor(size * 0.8), 12);
        continue;
      }

      for (let attempt = 0; attempt < 300; attempt++) {
        let tx, ty;
        if (mobile) {
          tx = (r + padding) + rand() * (cardWidth - 2 * (r + padding));
          ty = (r + padding) + rand() * (cardHeight - 2 * (r + padding));
        } else {
          const maxR = circleRadius - r - padding;
          const angle = rand() * 2 * Math.PI;
          const radius = (0.3 + rand() * 0.7) * maxR;
          tx = cx + radius * Math.cos(angle);
          ty = cy + radius * Math.sin(angle);
        }

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
      size = Math.max(Math.floor(size * 0.85), 12);
    }

    if (!placed_successfully) {
      const r = (size / 2) * Math.SQRT2;
      if (mobile) {
        x = Math.max(r + padding, Math.min(cardWidth - r - padding, x));
        y = Math.max(r + padding, Math.min(cardHeight - r - padding, y));
      } else {
        const maxR = Math.max(circleRadius - r - padding, 0);
        const angle = (i / symbols.length) * 2 * Math.PI;
        x = cx + maxR * Math.cos(angle);
        y = cy + maxR * Math.sin(angle);
      }
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
      borderRadius: mobile ? "16px" : "50%",
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
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
  const siteInfo = useContext(SiteInfoContext);
  const roleKey = symbol
    .replace("-vivid.png", "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const roleInfo = siteInfo?.rolesRaw?.Mafia?.[roleKey];
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