// Isolated synthetic history, real mobile layout/transcript/navigation/reducer.
// No backend, account, or session data is used by this fixture.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import { GameTypeContext, IsPhoneDeviceContext, MobileLayout, TextMeetingLayout, useSettingsReducer, useStateViewingReducer } from "../src/pages/Game/Game";
import StateSwitcher from "../src/components/gameComponents/StateSwitcher";
import { useIsPhoneDevice } from "../src/hooks/useIsPhoneDevice";
import { getSiteTheme } from "../src/constants/themes";
import "../src/css/main.css";

const params = new URLSearchParams(location.search);
const mode = params.get("theme") || "dark";
const finished = params.has("finished");
const singleState = params.has("single");
const noop = () => {};
const socket = { send: noop };
const players = {
  a: { id: "a", name: "Alex", avatar: false, alive: true },
  b: { id: "b", name: "Morgan", avatar: false, alive: true },
};
const states = Object.fromEntries([
  [-1, "Pregame"], [0, "Day 1"], [1, "Night 1"], [3, "Day 2"], ...(finished ? [[-2, "Postgame"]] : []),
].map(([id, name]) => [id, {
  name, selTab: "village", alerts: [], obituaries: {}, dead: {}, exorcised: {},
  ...(id === -2 ? { winners: { groups: ["Village"] } } : {}),
  meetings: { village: {
    id: "village", name: "Village", speech: true, amMember: false, canTalk: false,
    members: ["a", "b"], speechAbilities: [], voteRecord: [],
    messages: Array.from({ length: 45 }, (_, i) => ({
      id: `${id}:message:${i}`, meetingId: "village", senderId: i % 2 ? "a" : "b",
      content: `${name}: ${i % 2 ? "What do you think about the vote?" : "I'm checking the earlier messages before deciding."}`,
      time: Date.now() - (45 - i) * 30000, alive: true, quotable: true,
    })),
  } },
}]));
const history = { states, currentState: finished ? -2 : 3 };
const user = { id: "fixture-viewer", name: "Fixture Viewer", settings: {}, perms: {}, autoContrastColor: c => c };
const siteInfo = { roles: {}, showAlert: noop };

function Fixture() {
  const [settings, updateSettings] = useSettingsReducer();
  const [stateViewing, updateStateViewing] = useStateViewingReducer(history);
  const [selectedPanel, setSelectedPanel] = useState("chat");
  const isPhone = useIsPhoneDevice();
  const game = {
    gameId: "state-switcher-fixture", history, stateViewing, updateStateViewing,
    updateHistory: noop, settings, updateSettings, players, spectators: {}, socket,
    selectedPanel, setSelectedPanel, review: params.has("review"), options: {},
    self: "fixture-viewer", isSpectator: true, isParticipant: false, unresolvedActionCount: 0,
    isolationEnabled: false, isolatedPlayers: new Set(),
    getSetupGameSetting: noop, playAudio: noop, setup: { total: 2 },
    pinnedMessages: {}, isMessagePinned: () => false, onPinMessage: noop,
    onMessageQuote: noop, onLeaveGameClick: noop,
  };
  return <GameContext.Provider value={game}>
    <GameTypeContext.Provider value={{ singleState }}>
      <IsPhoneDeviceContext.Provider value={isPhone}>
        <div className={`game ${mode}-mode`} style={{ height: "100dvh", minHeight: 0, display: "flex", flexDirection: "column" }}>
          {isPhone ? <MobileLayout
            outerLeftContent={<div style={{ padding: 24 }}>Players fixture</div>}
            innerRightContent={<div style={{ padding: 24 }}>Actions fixture</div>}
            innerRightNavigationProps={{ label: "Actions", value: "actions", icon: <i className="fas fa-bolt" /> }}
            additionalInfoContent={<div style={{ padding: 24 }}>Info fixture</div>}
            centerContent={<TextMeetingLayout seatActions={false} />}
          /> : <>
            {!singleState && <div data-testid="desktop-state-control"><StateSwitcher /></div>}
            <TextMeetingLayout seatActions={false} />
          </>}
        </div>
      </IsPhoneDeviceContext.Provider>
    </GameTypeContext.Provider>
  </GameContext.Provider>;
}

ReactDOM.render(<BrowserRouter>
  <ThemeProvider theme={getSiteTheme()} defaultMode={mode} noSsr>
    <CssBaseline />
    <SiteInfoContext.Provider value={siteInfo}>
      <UserContext.Provider value={user}><Fixture /></UserContext.Provider>
    </SiteInfoContext.Provider>
  </ThemeProvider>
</BrowserRouter>, document.getElementById("root"));
