const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_WIN_SWAP } = require("../../const/Priority");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class WinSwap extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        this.data.ShouldFlipWinCons = true;
      },
      handleWinSwappers: function (winners) {
        if (!this.player.hasAbility(["Win-Con", "WhenDead"])) {
          return;
        }
        let losers = [];
        if (this.data.ShouldFlipWinCons == true) {
          let AllPlayers = this.game.players.filter((p) => p);
          for (let x = 0; x < AllPlayers.length; x++) {
            if (
              !winners.groups[AllPlayers[x].faction] &&
              !winners.groups[AllPlayers[x].role.name]
            ) {
              losers.push(AllPlayers[x]);
            }
          }
          for (let y = 0; y < AllPlayers.length; y++) {
            if (
              winners.groups[AllPlayers[y].faction] ||
              winners.groups[AllPlayers[y].role.name]
            ) {
              if (
                this.game.getRoleAlignment(AllPlayers[y].role.name) ==
                "Independent"
              ) {
                winners.removeGroup(AllPlayers[y].role.name);
              } else {
                winners.removeGroup(AllPlayers[y].faction);
              }
            }
          }
          for (let r = 0; r < losers.length; r++) {
            if (
              this.game.getRoleAlignment(losers[r].role.name) == "Independent"
            ) {
              winners.addPlayer(losers[r], losers[r].role.name);
            } else {
              winners.addPlayer(losers[r], losers[r].faction);
            }
          }
        }
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["Swap"],
          run: function () {
            this.role.data.ShouldFlipWinCons = true;
          },
        });

        this.game.queueAction(action);

        this.data.ShouldFlipWinCons = false;
      },
    };
  }
};
