const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the real setup editor handler without mounting its unrelated UI.
const source = fs.readFileSync(path.join(__dirname,
  "../react_main/src/pages/Play/CreateSetup/CreateBrowser.jsx"), "utf8");
const start = source.indexOf("  function changeRoleModifiers(");
const end = source.indexOf("  function changeStep(", start);
assert(start !== -1 && end > start, "setup editor modifier handler exists");

function edit(role, modifiers) {
  const actions = [];
  const context = {
    selectedRoleExists: true,
    selectedRole: { index: 0, role },
    roleData: { roles: [{ [role]: 1 }] },
    siteInfo: { showAlert() { throw new Error("unexpected validation alert"); } },
    updateRoleData(action) { actions.push(action); },
    setSelectedRole() {},
    nextModifiers: modifiers.map((name) => ({ name })),
  };
  vm.runInNewContext(source.slice(start, end) +
    "\nchangeRoleModifiers(nextModifiers);", context);
  return actions[0].nextRole;
}

describe("Setup editor role identity metadata", function () {
  it("preserves inventory definitions when modifiers are edited", function () {
    const items = JSON.stringify([{ type: "Gun", args: [{ label: "a:b" }] }, "Armor"]);
    assert.equal(edit(`Villager:Retired:${items}`, ["Humble"]), `Villager:Humble:${items}`);
  });

  it("preserves inventory when the final modifier is removed", function () {
    assert.equal(edit("Villager:Retired:Gun,Armor", []), "Villager::Gun,Armor");
  });

  it("retains the legacy no-inventory wire format and modifier ordering", function () {
    assert.equal(edit("Villager:", ["Retired", "Humble"]), "Villager:Humble/Retired");
  });
});
