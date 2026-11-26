// Exercise the host route's real duration-validation blocks without booting
// Mongo/Redis or registering a game worker. Full request coverage lives in the
// integration test lane; these tests focus on the values handed to createGame.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const constants = require("../data/constants");
const source = fs.readFileSync(path.join(__dirname, "../routes/game.js"), "utf8");
function block(start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `Missing route marker: ${start}`);
  const to = source.indexOf(end, from);
  assert.notEqual(to, -1, `Missing route marker: ${end}`);
  return source.slice(from, to);
}
const durationSource = block("    var configuredStateLengths =", "    if (!req.body.setup)");
function durations(gameType, body) {
  const context = { constants, gameType, req: { body } };
  vm.runInNewContext(durationSource, context);
  return JSON.parse(JSON.stringify(context.stateLengths));
}
const settingsSource = block("const settingsChecks =", "module.exports = router;");
const hostSettingsSource = block("    var settings = settingsChecks[gameType]", "    if (settings.anonymousGame)");
function mafiaSettings(body) {
  const context = {
    constants, gameType: "Mafia", req: { body }, setup: {},
    errors: { badRequest: (_res, message) => { throw new Error(message); } }, res: {},
  };
  // The production block has early returns inside its route handler.
  vm.runInNewContext(settingsSource + durationSource +
    `(function () { ${hostSettingsSource} this.result = settings; }).call(this);`, context);
  return JSON.parse(JSON.stringify(context.result));
}
describe("Host duration policy", function () {
  it("keeps competitive pregame configurable", function () {
    assert.equal(mafiaSettings({ competitive: true, pregameWaitLength: 4, extendLength: 3 }).pregameWaitLength, 4);
  });
  it("ignores custom extension length in ranked games", function () {
    assert.equal(mafiaSettings({ ranked: true, pregameWaitLength: 4, extendLength: 1 }).extendLength,
      constants.competitiveDefaults.Mafia.extendLength);
  });
  for (const [gameType, states] of Object.entries(constants.configurableStates)) {
    for (const mode of ["ranked", "competitive"]) {
      it(`uses standard ${gameType} phases after switching into ${mode}`, function () {
        const stateLengths = Object.fromEntries(Object.entries(states)
          .map(([name, value]) => [name, value.min / 60000]));
        // A stale custom form or rehost payload is submitted with the new mode.
        const actual = durations(gameType, { [mode]: true, stateLengths });
        assert.deepEqual(actual, Object.fromEntries(Object.entries(states)
          .map(([name, value]) => [name, value.default])));
      });
    }
    it(`preserves unrestricted ${gameType} customization`, function () {
      const stateLengths = Object.fromEntries(Object.entries(states)
        .map(([name, value]) => [name, value.min / 60000]));
      assert.deepEqual(durations(gameType, { stateLengths }),
        Object.fromEntries(Object.entries(states).map(([name, value]) => [name, value.min])));
    });
  }
  for (const mode of ["ranked", "competitive"]) {
    it(`keeps ${mode} pregame configurable and extension standard`, function () {
      const actual = mafiaSettings({ [mode]: true, pregameWaitLength: 6, extendLength: 0 });
      assert.equal(actual.pregameWaitLength, 6);
      assert.equal(actual.extendLength, constants.competitiveDefaults.Mafia.extendLength);
    });
    it(`retains pregame range validation in ${mode}`, function () {
      for (const pregameWaitLength of [0, 7]) {
        assert.throws(() => mafiaSettings({ [mode]: true, pregameWaitLength, extendLength: 3 }),
          /Pregame wait length must be between 1 and 6 hours/);
      }
    });
  }
  it("keeps unrestricted extension and pregame customization", function () {
    const actual = mafiaSettings({ pregameWaitLength: 5, extendLength: 1 });
    assert.equal(actual.pregameWaitLength, 5);
    assert.equal(actual.extendLength, 1);
  });
  it("retains invalid-duration fallback and ignores unknown phase names", function () {
    assert.deepEqual(durations("Mafia", { stateLengths: { Day: -1, Night: "bad", Unknown: 1 } }),
      Object.fromEntries(Object.entries(constants.configurableStates.Mafia)
        .map(([name, value]) => [name, value.default])));
  });
  it("ignores customized gameplay phases when ranked is enabled", function () {
    const stateLengths = Object.fromEntries(Object.entries(constants.configurableStates.Mafia)
      .map(([name, value]) => [name, value.min / 60000]));
    const actual = durations("Mafia", { ranked: true, stateLengths });
    for (const [name, value] of Object.entries(constants.configurableStates.Mafia)) {
      assert.equal(actual[name], value.default, name);
    }
  });
});
