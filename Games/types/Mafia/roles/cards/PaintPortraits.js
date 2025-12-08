const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_PREKILL_ACTION } = require("../../const/Priority");

module.exports = class PaintPortraits extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_PREKILL_ACTION,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);
          for (let visitor of visitors) {
            this.actor.data.portraits.push(visitor);
          }
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.data.portraits = [];
      },
      death: function (player, killer, deathType) {
        if (player === this.player) {
          let portraits = this.player.data.portraits;
          function unique(arr) {
            const result = [];

            for (const i of arr) {
              let noRepeat = true;

              for (const j of result) {
                if (i.name === j.name) {
                  noRepeat = false;
                  break;
                }
              }

              if (noRepeat) {
                result.push(i);
              }
            }

            return result;
          }
          let uniquePortraits = unique(portraits);

          let info = this.game.createInformation(
            "PlayerArrayInfo",
            this.player,
            this.game,
            uniquePortraits
          );
          info.processInfo();

          let painterAuction = `:paintbrush: ${
            this.player.name
          }'s extensive collection of paintings have gone up for auction. Among them are portraits of ${info
            .getInfoRaw()
            .map((p) => p.name)
            .join(", ")}.`;
          this.game.queueAlert(painterAuction);
        }
      },
    };
  }
};
