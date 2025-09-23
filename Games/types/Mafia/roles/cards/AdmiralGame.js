const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AdmiralGame extends Card {
  constructor(role) {
    super(role);

    if (role.isExtraRole == true) {
      return;
    }

    this.listeners = {
      ReplaceAlways: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
        this.player.role.data.FalseAdmiralCondemns = 0;
        let players = this.game.players.filter(
          (p) => p.role.data.UnReplaceable != true && p != this.player
        );
        for (let x = 0; x < players.length; x++) {
          for (let item of players[x].items) {
            item.drop();
          }
          if (
            players[x].role.alignment == "Mafia" ||
            players[x].role.alignment == "Cult"
          ) {
            this.game.AdmiralEvilRoles.push(
              `${players[x].role.name}:${players[x].role.modifier}`
            );
          } else if (
            players[x].role.name == "Admiral" ||
            players[x].role.name == "Grouch"
          ) {
          } else {
            this.game.AdmiralGoodRoles.push(
              `${players[x].role.name}:${players[x].role.modifier}`
            );
          }
          players[x].setRole(
            `Grouch`,
            undefined,
            false,
            true,
            null,
            null,
            "RemoveStartingItems"
          );
        }
        this.player.holdItem("TreasureChest", this.player);
      },
      death: function (player, killer, deathType, instant) {
        if (player == this.player) {
          this.game.HaveTreasureChestState = false;
          this.game.AdmiralStateBlock = null;
        }
        if (player.isEvil()) {
          this.game.queueAlert(`${player.name} had ${player.Gold} Gold Bars!`);
          this.player.Gold += player.Gold;
          player.Gold = 0;
          return;
        }
        if (deathType == "condemn") {
          this.player.role.data.FalseAdmiralCondemns += 1;
          this.player.queueAlert(`You Condemned an Innocent player!`);
          if (this.player.role.data.FalseAdmiralCondemns >= 2) {
            for (let p of this.game.alivePlayers()) {
              if (p.faction === this.player.faction) {
                p.kill("basic", this.player, instant);
              }
            }
          } else {
            this.player.queueAlert(
              `If You Condemn another Player who is Innocent, You will lose.`
            );
          }
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          this.game.HaveTreasureChestState = false;
          return;
        }
        let isChest = false;
        for (let player of this.game.alivePlayers()) {
          if (player.hasItem("TreasureChest")) {
            isChest = true;
          }
        }
        if (isChest != true) {
          this.game.HaveTreasureChestState = false;
        }
        if (stateInfo.name.match(/Treasure Chest/)) {
          if (this.game.AdmiralStateBlock == null) {
            if (this.game.isDayStart()) {
              this.game.AdmiralStateBlock = "Day";
            } else {
              this.game.AdmiralStateBlock = "Night";
            }
          }
        }
        if (
          this.game.getStateName() == "Day" &&
          (this.game.AdmiralStateBlock == "Day" ||
            this.game.AdmiralStateBlock == "Dawn")
        ) {
          this.game.AdmiralStateBlock = null;
        }
        if (
          this.game.getStateName() == "Night" &&
          (this.game.AdmiralStateBlock == "Night" ||
            this.game.AdmiralStateBlock == "Dusk")
        ) {
          this.game.AdmiralStateBlock = null;
        }
      },
    };

    this.stateMods = {
      Day: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.game.HaveTreasureChestState == true) {
            return true;
          }
          if (this.game.AdmiralStateBlock == "Night") {
            return true;
          }
          return false;
        },
      },
      Dusk: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.game.HaveTreasureChestState == true) {
            return true;
          }
          if (this.game.AdmiralStateBlock == "Day") {
            return true;
          }
          return false;
        },
      },
      Night: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.game.HaveTreasureChestState == true) {
            return true;
          }
          if (this.game.AdmiralStateBlock == "Day") {
            return true;
          }
          return false;
        },
      },
      Dawn: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.game.HaveTreasureChestState == true) {
            return true;
          }
          if (this.game.AdmiralStateBlock == "Night") {
            return true;
          }
          return false;
        },
      },
    };
  }
};
