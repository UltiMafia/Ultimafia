const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class DeliriateNeighbors extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      /*
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

            let players = this.game.alivePlayers();
            var indexOfActor = players.indexOf(this.player);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var foundUp = 0;
            var foundDown = 0;

            for (let x = 0; x < players.length; x++) {
              leftIdx =
                (indexOfActor - distance - 1 + players.length) % players.length;
              rightIdx = (indexOfActor + distance + 1) % players.length;
              leftAlign = players[leftIdx].role.alignment;
              rightAlign = players[rightIdx].role.alignment;

              if (
                rightAlign == "Village" &&
                !players[rightIdx].role.data.banished &&
                foundUp == 0
              ) {
                foundUp = players[rightIdx];
              }
              if (
                leftAlign == "Village" &&
                !players[leftIdx].role.data.banished &&
                foundDown == 0
              ) {
                foundDown = players[leftIdx];
              }
              if (foundUp == 0 || foundDown == 0) {
                distance = x;
              } else {
                break;
              }
            }

            let victims = [foundUp, foundDown];
            this.startingNeighbors = victims;

        
      },
      */
        AbilityToggle: function (player) {
        if (this.DeliriumNeighborEffects == null) {
          this.DeliriumNeighborEffects = [];
        }
        for (let x = 0; x < this.DeliriumNeighborEffects.length; x++) {
          if (this.DeliriumNeighborEffects[x].player) {
            var index = this.passiveEffects.indexOf(
              this.DeliriumNeighborEffects[x]
            );
            if (index != -1) {
              this.passiveEffects.splice(index, 1);
            }
            this.DeliriumNeighborEffects[x].remove();
          }
        }
        this.DeliriumNeighborEffects = [];
        if (this.hasAbility(["Deception"])) {
          if(this.startingNeighbors == null){
            let players = this.game.alivePlayers();
            var indexOfActor = players.indexOf(this.player);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var foundUp = 0;
            var foundDown = 0;

            for (let x = 0; x < players.length; x++) {
              leftIdx =
                (indexOfActor - distance - 1 + players.length) % players.length;
              rightIdx = (indexOfActor + distance + 1) % players.length;
              leftAlign = players[leftIdx].role.alignment;
              rightAlign = players[rightIdx].role.alignment;

              if (
                rightAlign == "Village" &&
                !players[rightIdx].role.data.banished &&
                foundUp == 0
              ) {
                foundUp = players[rightIdx];
              }
              if (
                leftAlign == "Village" &&
                !players[leftIdx].role.data.banished &&
                foundDown == 0
              ) {
                foundDown = players[leftIdx];
              }
              if (foundUp == 0 || foundDown == 0) {
                distance = x;
              } else {
                break;
              }
            }

            let victims = [foundUp, foundDown];
            this.startingNeighbors = victims;
          }
          for (let player of this.startingNeighbors) {
            let effect = player.giveEffect("Delirious", this.player, Infinity, this);
            this.passiveEffects.push(effect);
            this.DeliriumNeighborEffects.push(effect);
          }
        }
      },
    };
  }
};
