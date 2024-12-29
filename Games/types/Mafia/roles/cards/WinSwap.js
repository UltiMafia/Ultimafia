const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_WIN_SWAP } = require("../../const/Priority");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class WinSwap extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["Swap"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          this.actor.role.data.ShouldFlipWinCons = true;
        },
      },
    ];

    this.winCheck = {
      priority: PRIORITY_WIN_SWAP,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!confirmedFinished) return;
        let losers = [];
        if (this.player.role.data.ShouldFlipWinCons == true) {
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

        if (
          Object.values(winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          return;
        }

        if (winners.groups[this.player.faction]) {
          winners.addPlayer(this.player, this.player.faction);
        }
      },
    };


    this.listeners = {
      roleAssigned: function (player) {
        
        this.player.role.data.ShouldFlipWinCons = true;
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["save"],
          run: function () {
            this.actor.role.data.ShouldFlipWinCons = true;
          },
        });

        this.game.queueAction(action);


        this.actor.role.data.ShouldFlipWinCons = false;
      },
    };




  }
};
