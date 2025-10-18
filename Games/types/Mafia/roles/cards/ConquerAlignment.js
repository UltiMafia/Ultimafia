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
          role: this.role,
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            var princeAlignment = this.target.faction;
            if (princeAlignment == "Independent") {
              princeAlignment = this.target.role.name;
            }

            this.actor.faction = princeAlignment;
            this.actor.queueAlert(
              `You have thrown your lot in with the ${princeAlignment}; your death will be their deaths.`
            );
            this.game.queueAlert(
              `Prince ${this.actor.name} has returned from an adventure overseas to find the town in turmoil. They have joined with you, but if they die then all is lost!`,
              0,
              this.game.players.filter(
                (p) =>
                  p.faction === this.actor.faction ||
                  p.role.name == this.actor.faction
              )
            );
            this.role.conquered = true;
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
      },
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }

        if (
          this.player.role.alignment == "Cult" ||
          this.player.faction == "Cult"
        ) {
          var devotion = this.game.players.filter((p) =>
            p.hasEffect("DevotionEffect")
          );
          if (devotion.length > 0) {
            var backUpTarget = devotion.filter((p) =>
              p.hasEffect("DevoteeEffect")
            );
            if (backUpTarget.length > 0) {
              backUpTarget.setRole(
                `${this.player.role.name}:${this.player.role.modifier}`,
                this.player.role.data,
                false,
                false,
                false,
                "No Change"
              );
              return;
            }
            this.game.events.emit("Devotion", this.player);
            return;
          }
        }

        for (let p of this.game.alivePlayers()) {
          if (
            p.faction === this.player.faction ||
            p.role.name == this.player.faction
          ) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
