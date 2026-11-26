import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { CssBaseline, Popover, ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { SiteInfoContext, UserContext } from "Contexts";
import Miniprofile from "components/Miniprofile";
import { getSiteTheme } from "constants/themes";

axios.defaults.adapter = async (config) => ({ config, data: [], status: 200 });

const params = new URLSearchParams(window.location.search);
const palette = params.get("theme") === "dark" ? "dark" : "light";
const scenario = params.get("stats");
document.documentElement.classList.add(`${palette}-mode`);

const stats = {
  wins: { count: 218, total: 516 },
  abandons: { count: 1 },
  byAlignment: {
    Village: { wins: { count: 101, total: 274 }, abandons: { count: 1 } },
    Mafia: scenario === "missing" ? undefined : { wins: { count: 69, total: 142 } },
  },
};
const profile = {
  id: "fixture",
  name: "SamplePlayer",
  pronouns: "They/Them",
  props: {},
  skillRating: { tier: "Silver", rank: 81, mu: 11, sigma: 3.2 },
  stats: { Mafia: { all: scenario === "empty" ? {} : stats } },
  settings: { hideStatistics: scenario === "private" },
  trophies: [{ id: "1", name: "Ranked trophy", type: "bronze" }],
  kudos: 18,
  karma: 3,
  achievements: Array.from({ length: 17 }),
};

function Fixture() {
  const [anchor, setAnchor] = useState(null);
  const [otherPlayer, setOtherPlayer] = useState(false);
  window.switchProfile = () => setOtherPlayer(true);
  return (
    <BrowserRouter>
      <ThemeProvider theme={getSiteTheme(undefined, palette)} defaultMode={palette}>
        <CssBaseline />
        <SiteInfoContext.Provider value={{ showAlert() {}, achievementsRaw: { Mafia: Array(83).fill(true) } }}>
          <UserContext.Provider value={{ id: "viewer", loggedIn: true, settings: {}, perms: {} }}>
            <button ref={setAnchor} style={{ position: "fixed", top: 24, left: 24 }}>Profile</button>
            <Popover open={Boolean(anchor)} anchorEl={anchor} marginThreshold={16} transitionDuration={0}>
              <Miniprofile user={otherPlayer ? { ...profile, id: "other", name: "AnotherPlayer" } : profile} />
            </Popover>
          </UserContext.Provider>
        </SiteInfoContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

ReactDOM.render(<Fixture />, document.getElementById("root"));
