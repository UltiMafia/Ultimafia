const Card = require("../../Card");

module.exports = class AnonymizeFactionMeeting extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Faction: {
        flags: [
          "group",
          "speech",
          "voting",
          "multiActor",
          "anonymous",
          "Important",
        ],
        targets: { include: ["alive"], exclude: [] },
      },
      "Fake Faction": {
        flags: [
          "group",
          "speech",
          "voting",
          "multiActor",
          "anonymous",
          "Important",
        ],
        targets: { include: ["alive"], exclude: [] },
      },
      "Faction Kill": {
        flags: [
          "group",
          "speech",
          "voting",
          "multiActor",
          "anonymous",
          "Important",
        ],
        targets: { include: ["alive"], exclude: [] },
      },
    };

    role.makeAnonymousFaction = true;
    role.toRevertAnonymousFaction = [];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (!player.role.oblivious["Faction"]) {
            player.role.oblivious["Faction"] = true;
            this.toRevertAnonymousFaction.push(player.role);
          }
        }
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          // another role still controlling anonymity
          if (p.role.makeAnonymousFaction) {
            return;
          }
        }

        for (let r of this.toRevertAnonymousFaction) {
          r.oblivious["Faction"] = false;
        }
      },
    };
  }
};
