const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class FungalSpores extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Spore: {
        states: ["Night"],
        flags: ["voting"],
        labels: ["giveEffect"],
        action: {
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            // set target
            this.role.data.currentTarget = this.target;

            if (this.role.data.currentFungus == null) return;
            else if (this.role.data.currentFungus == "Silent") {
              if (this.dominates(this.target)) {
                this.role.giveEffect(this.target, "Silenced", 1);
              }
            } else if (this.role.data.currentFungus == "Deaf") {
              if (this.dominates(this.target)) {
                this.role.giveEffect(this.target, "Fiddled", 1);
              }
            } else if (this.role.data.currentFungus == "Blind") {
              if (this.dominates(this.target)) {
                this.role.giveEffect(this.target, "Blind", 1);
              }
            } else if (this.role.data.currentFungus == "Clueless") {
              if (this.dominates(this.target)) {
                this.role.giveEffect(this.target, "Scrambled", 1);
              }
            }

            // set cooldown
            var fungus = this.role.data.currentFungus;
            if (this.role.data.fungusCounter) {
              this.role.data.fungusCounter[fungus] =
                this.role.data.fungusCooldown;
            }

            delete this.role.data.currentFungus;
            delete this.role.data.currentTarget;
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
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
          run: function () {
            this.role.data.currentFungus = this.target;
          },
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.fullFungusList = ["Silent", "Deaf", "Blind", "Clueless"];
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
