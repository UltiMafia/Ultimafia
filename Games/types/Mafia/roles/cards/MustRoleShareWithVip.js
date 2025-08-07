const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class MustRoleShareWithVip extends Card {
  constructor(role) {
    super(role);

    role.data.playersSharedWith = [];

    this.listeners = {
      ShareRole: function (PlayerA, PlayerB, isAlignmentShare) {
        if (
          (PlayerA == this.player || PlayerB == this.player) &&
          !isAlignmentShare
        ) {
          let thisPlayer;
          let otherPlayer;
          if (PlayerA == this.player) {
            thisPlayer = PlayerA;
            otherPlayer = PlayerB;
          } else {
            thisPlayer = PlayerB;
            otherPlayer = PlayerA;
          }

          this.data.playersSharedWith.push(otherPlayer);
        }
      },
      handleWinBlockers: function (winners) {
        if (!this.hasAbility(["Win-Con"])) {
          return;
        }

        let hasFailed = false;
        if (this.player.role.name == "Vice President") {
          for (let player of this.game.players) {
            if (
              player.role.name == "President" &&
              !this.data.playersSharedWith.includes(player)
            ) {
              hasFailed = true;
            }
            if (
              player.role.name == "Senator" &&
              !this.data.playersSharedWith.includes(player)
            ) {
              hasFailed = true;
            }
            if (
              this.game
                .getRoleTags(
                  this.game.formatRoleInternal(
                    player.role.name,
                    player.role.modifier
                  )
                )
                .includes("Linchpin") &&
              !this.data.playersSharedWith.includes(player)
            ) {
              hasFailed = true;
            }
          }
        }
        if (this.player.role.name == "Advisor") {
          for (let player of this.game.players) {
            if (
              player.role.name == "Assassin" &&
              !this.data.playersSharedWith.includes(player)
            ) {
              hasFailed = true;
            }
            if (
              player.role.name == "Queen" &&
              !this.data.playersSharedWith.includes(player)
            ) {
              hasFailed = true;
            }
            if (
              this.game
                .getRoleTags(
                  this.game.formatRoleInternal(
                    this.player.role.name,
                    this.player.role.modifiers
                  )
                )
                .includes("Linchpin") &&
              !this.data.playersSharedWith.includes(player)
            ) {
              hasFailed = true;
            }
          }
        }
        if (hasFailed == true) {
          winners.removeGroup(this.player.faction);
        }
      },
    };
  }
};
