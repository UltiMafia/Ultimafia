const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AddHideAndSeek extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addRequiredRole: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        if (this.player.role.name == "Seeker") {
          let players = this.game.players.filter(
            (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
          );
          let shuffledPlayers = Random.randomizeArray(players);
          for (let x = 0; x < shuffledPlayers.length; x++) {
            if (
              shuffledPlayers[x].role.name == "Hider" ||
              shuffledPlayers[x].role.name == "Invader"
            ) {
              return;
            }
          }
          shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
          if (shuffledPlayers.length <= 0) return;
          if (shuffledPlayers[0].role.alignment == "Mafia") {
            for (let item of shuffledPlayers[0].items) {
              item.drop();
            }
            shuffledPlayers[0].setRole(
              "Hider",
              undefined,
              false,
              true,
              null,
              null,
              "RemoveStartingItems"
            );
            shuffledPlayers[0].role.data.reroll = true;
          } else {
            for (let item of shuffledPlayers[0].items) {
              item.drop();
            }
            shuffledPlayers[0].setRole(
              "Invader",
              undefined,
              false,
              true,
              null,
              null,
              "RemoveStartingItems"
            );
            shuffledPlayers[0].role.data.reroll = true;
          }
        } else if (this.player.role.name == "Hider") {
          let players = this.game.players.filter(
            (p) => p.role.alignment == "Village" || p.role.alignment == "Cult"
          );
          let shuffledPlayers = Random.randomizeArray(players);
          for (let x = 0; x < shuffledPlayers.length; x++) {
            if (
              shuffledPlayers[x].role.name == "Seeker" ||
              shuffledPlayers[x].role.name == "Invader"
            ) {
              return;
            }
          }
          shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
          if (shuffledPlayers.length <= 0) return;
          if (shuffledPlayers[0].role.alignment == "Village") {
            for (let item of shuffledPlayers[0].items) {
              item.drop();
            }
            shuffledPlayers[0].setRole(
              "Seeker",
              undefined,
              false,
              true,
              null,
              null,
              "RemoveStartingItems"
            );
            shuffledPlayers[0].role.data.reroll = true;
          } else {
            for (let item of shuffledPlayers[0].items) {
              item.drop();
            }
            shuffledPlayers[0].setRole(
              "Invader",
              undefined,
              false,
              true,
              null,
              null,
              "RemoveStartingItems"
            );
            shuffledPlayers[0].role.data.reroll = true;
          }
        } else if (this.player.role.name == "Invader") {
          let players = this.game.players.filter(
            (p) => p.role.alignment == "Village" || p.role.alignment == "Mafia"
          );
          let shuffledPlayers = Random.randomizeArray(players);
          for (let x = 0; x < shuffledPlayers.length; x++) {
            if (
              shuffledPlayers[x].role.name == "Seeker" ||
              shuffledPlayers[x].role.name == "Hider"
            ) {
              return;
            }
          }
          shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
          if (shuffledPlayers.length <= 0) return;
          if (shuffledPlayers[0].role.alignment == "Village") {
            for (let item of shuffledPlayers[0].items) {
              item.drop();
            }
            shuffledPlayers[0].setRole(
              "Seeker",
              undefined,
              false,
              true,
              null,
              null,
              "RemoveStartingItems"
            );
            shuffledPlayers[0].role.data.reroll = true;
          } else {
            for (let item of shuffledPlayers[0].items) {
              item.drop();
            }
            shuffledPlayers[0].setRole(
              "Hider",
              undefined,
              false,
              true,
              null,
              null,
              "RemoveStartingItems"
            );
            shuffledPlayers[0].role.data.reroll = true;
          }
        }
      },
    };
  }
};
