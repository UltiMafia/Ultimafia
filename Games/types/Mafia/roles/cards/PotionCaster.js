const Card = require("../../Card");
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
          priority: PRIORITY_NIGHT_SAVER - 1,
          run() {
            // set target
            this.actor.role.data.currentTarget = this.target;
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
          priority: PRIORITY_NIGHT_SAVER - 2,
          run() {
            this.actor.role.data.currentPotion = this.target;
          },
        },
      },
    };

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill"],
        run() {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentPotion !== "Damaging") return;

          const target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          if (this.dominates(target)) {
            target.kill("basic", this.actor);
          }

          // set cooldown
          const potion = this.actor.role.data.currentPotion;
          this.actor.role.data.potionCounter[potion] =
            this.actor.role.data.potionCooldown;

          delete this.actor.role.data.currentPotion;
          delete this.actor.role.data.currentTarget;
        },
      },
      {
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
        run() {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentPotion !== "Restoring") return;

          const target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          this.heal(1, target);

          // set cooldown
          const potion = this.actor.role.data.currentPotion;
          this.actor.role.data.potionCounter[potion] =
            this.actor.role.data.potionCooldown;

          delete this.actor.role.data.currentPotion;
          delete this.actor.role.data.currentTarget;
        },
      },
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run() {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentPotion !== "Elucidating") return;

          const target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          const role = target.getAppearance("investigate", true);
          this.actor.queueAlert(
            `:sy0d: You learn that ${target.name}'s role is ${role}.`
          );

          // set cooldown
          const potion = this.actor.role.data.currentPotion;
          this.actor.role.data.potionCounter[potion] =
            this.actor.role.data.potionCooldown;

          delete this.actor.role.data.currentPotion;
          delete this.actor.role.data.currentTarget;
        },
      },
    ];

    this.listeners = {
      roleAssigned(player) {
        if (player !== this.player) {
          return;
        }

        this.data.fullPotionList = ["Damaging", "Restoring", "Elucidating"];
        const cooldown = this.data.fullPotionList.length;
        this.data.potionCooldown = cooldown;

        const potionCounter = {};
        for (const potion of this.data.fullPotionList) {
          potionCounter[potion] = 0;
        }
        this.data.potionCounter = potionCounter;

        this.data.currentPotion = null;
        this.data.currentTarget = null;
      },
      // refresh cooldown
      state(stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        const currentPotionList = [];
        for (const potion of this.data.fullPotionList) {
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
      },
    };
  }
};
