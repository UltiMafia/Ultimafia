const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const {
  PRIORITY_KILL_DEFAULT,
  PRIORITY_NIGHT_SAVER,
  PRIORITY_INVESTIGATIVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class PotionCaster extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Cast Potion": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_NIGHT_SAVER - 1,
          run: function () {
            // set target
            this.role.data.currentTarget = this.target;
          },
        },
      },
      "Choose Potion": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        // needs to insert every state
        // targets: currentPotionList,
        action: {
          role: this.role,
          priority: PRIORITY_NIGHT_SAVER - 2,
          run: function () {
            this.role.data.currentPotion = this.target;
          },
        },
      },
    };
    /*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentPotion !== "Damaging") return;

          let target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          if (this.dominates(target)) {
            target.kill("basic", this.actor);
          }

          // set cooldown
          var potion = this.actor.role.data.currentPotion;
          if (this.actor.role.data.potionCounter) {
            this.actor.role.data.potionCounter[potion] =
              this.actor.role.data.potionCooldown;
          }

          delete this.actor.role.data.currentPotion;
          delete this.actor.role.data.currentTarget;
        },
      },
      {
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentPotion !== "Restoring") return;

          let target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          this.heal(1, target);

          // set cooldown
          var potion = this.actor.role.data.currentPotion;
          if (this.actor.role.data.potionCounter) {
            this.actor.role.data.potionCounter[potion] =
              this.actor.role.data.potionCooldown;
          }

          delete this.actor.role.data.currentPotion;
          delete this.actor.role.data.currentTarget;
        },
      },
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentPotion !== "Elucidating") return;

          let target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          let role = target.getRoleAppearance();

          if (this.actor.hasEffect("FalseMode")) {
            let wrongPlayers = this.game
              .alivePlayers()
              .filter(
                (p) => p.getRoleAppearance().split(" (")[0] != target.role.name
              );
            role = Random.randArrayVal(wrongPlayers).getRoleAppearance();
          }

          this.actor.queueAlert(
            `:invest: You learn that ${target.name}'s role is ${role}.`
          );

          // set cooldown
          var potion = this.actor.role.data.currentPotion;
          if (this.actor.role.data.potionCounter) {
            this.actor.role.data.potionCounter[potion] =
              this.actor.role.data.potionCooldown;
          }
          delete this.actor.role.data.currentPotion;
          delete this.actor.role.data.currentTarget;
        },
      },
    ];
*/
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.fullPotionList = ["Damaging", "Restoring", "Elucidating"];
        let cooldown = this.data.fullPotionList.length;
        this.data.potionCooldown = cooldown;

        let potionCounter = {};
        for (let potion of this.data.fullPotionList) {
          potionCounter[potion] = 0;
        }
        this.data.potionCounter = potionCounter;

        this.data.currentPotion = null;
        this.data.currentTarget = null;
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var currentPotionList = [];
        for (let potion of this.data.fullPotionList) {
          this.data.potionCounter[potion] -= 1;
          if (this.data.potionCounter[potion] <= 0) {
            this.data.potionCounter[potion] = 0;
            currentPotionList.push(potion);
          } else {
            this.player.queueAlert(
              `Your ${potion} potion will come off cooldown in ${
                this.data.potionCounter[potion]
              } turn${this.data.potionCounter[potion] <= 0 ? "" : "s"}.`
            );
          }
        }

        this.meetings["Choose Potion"].targets = currentPotionList;

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_SAVER,
          labels: ["save"],
          role: this.role,
          run: function () {
            if (this.role.data.currentPotion !== "Restoring") return;

            let target = this.role.data.currentTarget;
            if (!target) {
              return;
            }

            this.heal(1, target);

            // set cooldown
            var potion = this.role.data.currentPotion;
            if (this.role.data.potionCounter) {
              this.role.data.potionCounter[potion] =
                this.role.data.potionCooldown;
            }

            delete this.role.data.currentPotion;
            delete this.role.data.currentTarget;
          },
        });

        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill"],
          role: this.role,
          run: function () {
            if (this.role.data.currentPotion !== "Damaging") return;

            let target = this.role.data.currentTarget;
            if (!target) {
              return;
            }

            if (this.dominates(target)) {
              target.kill("basic", this.actor);
            }

            // set cooldown
            var potion = this.role.data.currentPotion;
            if (this.role.data.potionCounter) {
              this.role.data.potionCounter[potion] =
                this.role.data.potionCooldown;
            }

            delete this.role.data.currentPotion;
            delete this.role.data.currentTarget;
          },
        });

        var action3 = new Action({
          actor: this.player,
          game: this.player.game,
          role: this.role,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            if (this.role.data.currentPotion !== "Elucidating") return;

            let target = this.role.data.currentTarget;
            if (!target) {
              return;
            }

            let info = this.game.createInformation(
              "RoleInfo",
              this.actor,
              this.game,
              target
            );
            info.processInfo();
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);

            // set cooldown
            var potion = this.role.data.currentPotion;
            if (this.role.data.potionCounter) {
              this.role.data.potionCounter[potion] =
                this.role.data.potionCooldown;
            }
            delete this.role.data.currentPotion;
            delete this.role.data.currentTarget;
          },
        });

        this.game.queueAction(action);
        this.game.queueAction(action2);
        this.game.queueAction(action3);
      },
    };
  }
};
