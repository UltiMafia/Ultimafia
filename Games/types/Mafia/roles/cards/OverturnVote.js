const Card = require("../../Card");
const Player = require("../../../../core/Player");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class OverturnVote extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Overturn Vote": {
        meetingName: "Overturn",
        states: ["Dusk"],
        flags: ["group", "voting", "anonymousVotes"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        shouldMeet: function () {
          //skip if town is trying to condemn mafia under don
          if (this.player.alive && this.player.role.name == "Don") {
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabel("condemn") &&
                action.target.getRoleAlignment() == "Mafia"
              ) {
                return false;
              }
              //don cannot OT away from don
              if (
                action.hasLabel("condemn") &&
                action.target.role.name == "Don"
              ) {
                return false;
              }
            }
            //return true;
          }

          if (!this.overturnsLeft) {
            return false;
          }
          if (!this.player.alive) {
            return false;
          }

          let isNoVote = true;
          for (let action of this.game.actions[0]) {
            if (
              action.hasLabel("condemn") &&
              !action.hasLabel("overthrow") &&
              action.target instanceof Player
            ) {
              isNoVote = false;
              break;
            }
          }

          if (isNoVote) {
            return false;
          }
          /*
          for (let player of this.game.players) {
            if (!player.hasItem("OverturnSpectator")) {
              player.holdItem("OverturnSpectator");
            }
          }
          */
          return true;
        },
        leader: true,
        action: {
          power: 3,
          labels: ["kill", "condemn", "overthrow"],
          role: this.role,
          priority: PRIORITY_OVERTHROW_VOTE,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
                if (action.target === this.target) {
                  return;
                }

                // Only one village vote can be overthrown
                action.cancel(true);
                break;
              }
            }

            if (this.dominates()) {
              this.target.kill("condemn", this.actor);
            }

            --this.role.overturnsLeft;
          },
        },
      },
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      /*
      Overturn: {
        type: "add",
        index: 4,
        length: 1000 * 30,
        shouldSkip: function () {
          //skip if town is trying to condemn mafia under don
          if (this.player.alive && this.player.role.name == "Don") {
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabel("condemn") &&
                action.target.alignment == "Mafia"
              ) {
                return true;
              }
              //don cannot OT away from don
              if (
                action.hasLabel("condemn") &&
                action.target.role.name == "Don"
              ) {
                return true;
              }
            }
            return false;
          }

          if (!this.overturnsLeft) {
            return true;
          }
          if (!this.player.alive) {
            return true;
          }

          let isNoVote = true;
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn")) {
              isNoVote = false;
              break;
            }
          }

          if (isNoVote) {
            return true;
          }

          for (let player of this.game.players) {
            if (!player.hasItem("OverturnSpectator")) {
              player.holdItem("OverturnSpectator");
            }
          }
          return false;
        },
      },
      */
    };
  }
};
