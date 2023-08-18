const Card = require("../../Card");

module.exports = class AnonymizeCult extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Cult: {
        flags: ["group", "speech", "voting", "multiActor", "anonymous"],
        targets: { include: ["alive"], exclude: [] },
      },
    };

    role.makeAnonymousCult = true;
    role.toRevertAnonymousCult = [];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let player of this.game.players) {
          if (!player.role.oblivious["Cult"]) {
            player.role.oblivious["Cult"] = true;
            this.toRevertAnonymousCult.push(player.role);
          }
        }
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          // another role still controlling anonymity
          if (p.role.makeAnonymousCult) {
            return;
          }
        }

        for (let r of this.toRevertAnonymousCult) {
          r.oblivious["Cult"] = false;
        }
      },
    };
  }
};
