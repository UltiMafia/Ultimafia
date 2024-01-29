const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class ConquerAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Align With": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            var princeAlignment = this.target.role.alignment;
            if (alignment == "Independent" || alignment == "Hostile") {
              alignment = this.target.role.name;
              return;
            }

            this.actor.role.data.alignment = princeAlignment;
            this.actor.queueAlert(
              `You have thrown in with the ${princeAlignment}; your death will be theirs.`
            );
            this.actor.role.conquered = true;
          },
        },
        shouldMeet() {
          return !this.conquered;
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.queueAlert(
          "You return to your homeland and find that it is in crisis. You must choose which faction you will back, for they will help you ascend the throne."
        );

        this.game.queueAlert(
          `Prince ${this.player.name} has returned from an adventure overseas to find the town in turmoil. They have joined with you, but if they die then all is lost!`,
          0,
          this.game.players.filter(
            (p) => p.role.alignment === this.player.role.princeAlignment
          )
        );
      },
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          if (p.role.alignment === this.player.role.princeAlignment) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.player.alive || !this.data.alignment) {
          return;
        }

        if (
          confirmedFinished &&
          winners.groups[this.data.alignment] &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }

        if (
          aliveCount <= 2 &&
          this.data.alignment != "Village" &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};