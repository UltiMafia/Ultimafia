const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class HostChosenProfiles extends Card {
  constructor(role) {
    super(role);

    if (!(role.game.anonymousGame && role.game.deferredAnonymous)) {
      return;
    }

    let deckProfiles = role.game.getDeduplicatedDeckProfiles();
    let contestants = [];
    for (let player of role.game.players) {
      contestants.push(player);
    }
    role.player.holdItem("HostProfileSelector", contestants, deckProfiles);

    this.passiveActions = [
      {
        actor: role.player,
        state: "Hosting",
        game: role.game,
        role: role,
        priority: PRIORITY_CONVERT_DEFAULT + 4,
        labels: ["investigate"],
        run: function () {
          if (!this.game.deferredAnonymous) return;
          let assignments = this.game.HostProfileChanges || {};
          this.game.makeGameAnonymous(assignments);
          this.game.deferredAnonymous = false;
        },
      },
    ];
  }
};
