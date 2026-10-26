const chai = require("chai"),
  should = chai.should();
const fs = require("fs");
const path = require("path");

// Each game type view rings its bell from its socket "state" handler with
// nextStateBell(lastId, state). That `state` has to be the handler's own
// parameter: the views have no `state` in scope there, so a handler written
// as `() => { nextStateBell(..., state) }` throws "state is not defined".
// The socket replays already-received events to a listener when it
// subscribes, inside a React effect, so the throw happens while the view
// mounts and the whole game page goes black (Draw It, Cheat, Ratscrew and
// Wacky Words did this).
const gameDir = path.join(__dirname, "../react_main/src/pages/Game");
const handlerPattern = /socket\.on\(\s*"state"\s*,\s*\(([^)]*)\)\s*=>\s*\{/g;

function stateBellHandlers() {
  const handlers = [];
  for (const file of fs.readdirSync(gameDir)) {
    if (!file.endsWith(".jsx")) continue;
    const source = fs.readFileSync(path.join(gameDir, file), "utf8");
    for (const match of source.matchAll(handlerPattern)) {
      const body = source.slice(match.index + match[0].length).split(/socket\.on\(/)[0];
      const bell = body.match(/nextStateBell\(\s*[^,]+,\s*([A-Za-z_$][\w$]*)\s*\)/);
      if (!bell) continue;
      const params = match[1].split(",").map((p) => p.trim()).filter(Boolean);
      handlers.push({ file, params, arg: bell[1] });
    }
  }
  return handlers;
}

describe("Game type state bell handlers", function () {
  const handlers = stateBellHandlers();

  it("finds the bell handler in every game type view", function () {
    const files = handlers.map((h) => h.file);
    for (const file of [
      "MafiaGame.jsx",
      "DrawItGame.jsx",
      "CheatGame.jsx",
      "RatscrewGame.jsx",
      "WackyWordsGame.jsx",
    ])
      files.should.include(file);
  });

  it("passes the received state, not an out-of-scope name, to nextStateBell", function () {
    const broken = handlers
      .filter((h) => !h.params.includes(h.arg))
      .map((h) => `${h.file}: (${h.params.join(", ")}) uses ${h.arg}`);
    broken.should.deep.equal([]);
  });
});
