const Item = require("../Item");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");

module.exports = class HostProfileSelector extends Item {
  constructor(players, deckProfiles) {
    super("HostProfileSelector");
    this.Contestants = players || [];
    this.deckProfiles = deckProfiles || [];
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    let profileNames = this.deckProfiles.map((p) => p.name);
    // Flat target list combining contestant id and profile name.
    let targets = [];
    for (let c of this.Contestants) {
      for (let name of profileNames) {
        targets.push(c.id + ":" + name);
      }
    }
    if (targets.length === 0) targets = ["None"];

    let contestantMeta = this.Contestants.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    this.meetings["Profile Selection"] = {
      actionName: "Profile Selection",
      states: ["Hosting"],
      flags: [
        "voting",
        "noVeg",
        "instant",
        "instantButChangeable",
        "repeatable",
        "optional",
      ],
      inputType: "profileAssignment",
      targets: targets,
      displayOptions: {
        contestants: contestantMeta,
        profileNames: profileNames,
      },
      action: {
        labels: ["investigate"],
        priority: PRIORITY_CONVERT_DEFAULT,
        item: this,
        run: function () {
          if (this.target == "None") return;
          let sepIdx = this.target.indexOf(":");
          if (sepIdx < 0) return;
          let contestantId = this.target.slice(0, sepIdx);
          let profileName = this.target.slice(sepIdx + 1);
          let chosen = this.item.deckProfiles.find(
            (p) => p.name === profileName
          );
          if (!chosen) return;
          if (this.game.HostProfileChanges == null) {
            this.game.HostProfileChanges = {};
          }
          // Clear any previous player assigned this profile so duplicates
          // swap rather than conflict.
          for (let prevId in this.game.HostProfileChanges) {
            if (
              prevId !== contestantId &&
              this.game.HostProfileChanges[prevId].id === chosen.id
            ) {
              delete this.game.HostProfileChanges[prevId];
            }
          }
          this.game.HostProfileChanges[contestantId] = chosen;
        },
      },
    };
  }
};
