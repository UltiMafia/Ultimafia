const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class FungalSpores extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Spore: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            // set target
            this.actor.role.data.currentTarget = this.target;
          },
        },
      },
      "Choose Fungus": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        // needs to insert every state
        // targets: currentFungusList,
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.role.data.currentFungus = this.target;
          },
        },
      },
    };

    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["giveEffect", "silence"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentFungus !== "Thrush") return;

          let target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          if (this.dominates(target)) {
            target.giveEffect("Silenced", 1);
          }

          // set cooldown
          var fungus = this.actor.role.data.currentFungus;
          if (this.actor.role.data.fungusCounter) {
            this.actor.role.data.fungusCounter[fungus] =
              this.actor.role.data.fungusCooldown;
          }

          delete this.actor.role.data.currentFungus;
          delete this.actor.role.data.currentTarget;
        },
      },
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["giveEffect", "fiddle"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentFungus !== "Aspergillus") return;

          let target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          if (this.dominates(target)) {
            target.giveEffect("Fiddled", 1);
          }

          // set cooldown
          var fungus = this.actor.role.data.currentFungus;
          if (this.actor.role.data.fungusCounter) {
            this.actor.role.data.fungusCounter[fungus] =
              this.actor.role.data.fungusCooldown;
          }

          delete this.actor.role.data.currentFungus;
          delete this.actor.role.data.currentTarget;
        },
      },
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["giveEffect", "blind"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentFungus !== "Cataracts") return;

          let target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          if (this.dominates(target)) {
            target.giveEffect("Blind", 1);
          }

          // set cooldown
          var fungus = this.actor.role.data.currentFungus;
          if (this.actor.role.data.fungusCounter) {
            this.actor.role.data.fungusCounter[fungus] =
              this.actor.role.data.fungusCooldown;
          }
          delete this.actor.role.data.currentFungus;
          delete this.actor.role.data.currentTarget;
        },
      },
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["giveEffect", "scramble"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          if (this.actor.role.data.currentFungus !== "Hallucinogens") return;

          let target = this.actor.role.data.currentTarget;
          if (!target) {
            return;
          }

          if (this.dominates(target)) {
            target.giveEffect("Scrambled", 1);
          }

          // set cooldown
          var fungus = this.actor.role.data.currentFungus;
          if (this.actor.role.data.fungusCounter) {
            this.actor.role.data.fungusCounter[fungus] =
              this.actor.role.data.fungusCooldown;
          }
          delete this.actor.role.data.currentFungus;
          delete this.actor.role.data.currentTarget;
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.fullFungusList = [
          "Thrush",
          "Aspergillus",
          "Cataracts",
          "Hallucinogens",
        ];
        let cooldown = this.data.fullFungusList.length;
        this.data.fungusCooldown = cooldown;

        let fungusCounter = {};
        for (let fungus of this.data.fullFungusList) {
          fungusCounter[fungus] = 0;
        }
        this.data.fungusCounter = fungusCounter;

        this.data.currentFungus = null;
        this.data.currentTarget = null;
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var currentFungusList = [];
        for (let fungus of this.data.fullFungusList) {
          this.data.fungusCounter[fungus] -= 1;
          if (this.data.fungusCounter[fungus] <= 0) {
            this.data.fungusCounter[fungus] = 0;
            currentFungusList.push(fungus);
          } else {
            this.player.queueAlert(
              `Your ${fungus} fungus will come off cooldown in ${
                this.data.fungusCounter[fungus]
              } turn${this.data.fungusCounter[fungus] <= 0 ? "" : "s"}.`
            );
          }
        }

        this.meetings["Choose Fungus"].targets = currentFungusList;
      },
    };
  }
};
