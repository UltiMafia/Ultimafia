const { expect } = require("chai");
const Meeting = require("../../Games/core/Meeting");
const roleIdentity = require("../../lib/roleIdentity");

function allRolesTarget(possibleRoles, extra = {}) {
  const meeting = Object.create(Meeting.prototype);
  Object.assign(meeting, {
    game: { PossibleRoles: possibleRoles, AddedRoles: [], players: [] },
    AllRolesFilters: [],
    mustAct: true,
    ...extra,
  });
  return meeting.getAllRolesTargets("AllRoles");
}

describe("role object wire boundary", function () {
  it("keeps unmodified, inventory-free AllRoles choices as legacy bare names", function () {
    const choices = allRolesTarget(["Cop", { name: "Cop", modifiers: [], items: [] }]);
    expect(choices).to.include("Cop");
    expect(choices).not.to.include("Cop:");
    expect(choices.filter((choice) => choice === "Cop")).to.have.length(1);
  });

  it("keeps modifier and custom-inventory choices as complete canonical keys", function () {
    const modified = { name: "Cop", modifiers: ["Humble"], items: [] };
    const equipped = { name: "Cop", modifiers: [], items: ["Magnifying Glass"] };
    const choices = allRolesTarget([modified, equipped]);
    expect(choices).to.include(roleIdentity.roleKey(modified));
    expect(choices).to.include(roleIdentity.roleKey(equipped));
    expect(choices).to.have.length(2);
  });
});
