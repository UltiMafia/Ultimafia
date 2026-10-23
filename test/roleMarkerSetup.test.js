const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

// Load the client helper (ES module syntax) without a bundler.
const src = fs
  .readFileSync(path.join(__dirname, "../react_main/src/lib/roleMarkerSetup.js"), "utf8")
  .replace(/export (const|function) /g, "$1 ");
const { roleMarkerSetupSource, roleMarkerRoles } = new Function(
  src + "\nreturn { roleMarkerSetupSource, roleMarkerRoles };"
)();
const TutorialController = require("../Games/core/tutorial/TutorialController");

// Mirrors usePopover(): a Promise path is used as-is, a string goes through
// axios.get; either way the popover reads res.data.
function popoverLoad(source, axiosGet) {
  const promise = source instanceof Promise ? source : axiosGet(source);
  return promise.then((res) => {
    const data = res.data;
    data.roles = roleMarkerRoles(data.roles);
    return data;
  });
}
const noFetch = () => {
  throw new Error("should not fetch");
};

describe("Role marker chooser setup", function () {
  it("tutorial (in-memory) setup: roles and gameType reach the chooser", async function () {
    const setup = TutorialController.setup();
    const data = await popoverLoad(roleMarkerSetupSource(setup), noFetch);
    expect(data.gameType).to.equal("Mafia");
    expect(data.roles).to.include.keys("Cop:", "Lawyer:Loyal", "Mafioso:", "Villager:");
    expect(Object.keys(data.roles)).to.have.length(7);
  });

  it("game setup with roles already as a JSON string works too", async function () {
    const setup = { id: "Z3T6Cq3wrC", gameType: "Mafia", roles: '[{"Cop:":1,"Mafioso:":1}]' };
    const data = await popoverLoad(roleMarkerSetupSource(setup), noFetch);
    expect(data.gameType).to.equal("Mafia");
    expect(data.roles).to.deep.equal({ "Cop:": 1, "Mafioso:": 1 });
  });

  it("normal game without roles on the setup: fetches /api/setup/<id>", async function () {
    const calls = [];
    const axiosGet = (url) => {
      calls.push(url);
      return Promise.resolve({ data: { id: "abc", gameType: "Mafia", roles: '[{"Sheriff:":1,"Janitor:":1}]' } });
    };
    const source = roleMarkerSetupSource({ id: "abc", gameType: "Mafia" });
    expect(source).to.equal("/api/setup/abc");
    const data = await popoverLoad(source, axiosGet);
    expect(calls).to.deep.equal(["/api/setup/abc"]);
    expect(data.gameType).to.equal("Mafia");
    expect(data.roles).to.deep.equal({ "Sheriff:": 1, "Janitor:": 1 });
  });

  it("no setup: an empty list instead of an error", async function () {
    const data = await popoverLoad(roleMarkerSetupSource(null), noFetch);
    expect(data.roles).to.deep.equal({});
  });
});
