const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class OffWithTheirHeads extends Card {
  constructor(role) {
    super(role);

    role.data.numStatesSinceBeheading = 0;
    role.methods.checkIfShouldStartBeheading = function () {
      if (this.data.startedBeheading) return;
      if (!this.player.alive) return;

      let aliveMafia = this.game
        .alivePlayers()
        .filter((p) => p.role.alignment == "Mafia");
      if (aliveMafia.length != 1) return;

      this.data.startedBeheading = true;
      this.game.queueAlert(
        "The Queen is putting down this bloody rebellion with extreme prejudice. You must eliminate them today or else you will be beheaded."
      );
    };
    this.listeners = {
      /*
      death: function () {
        this.methods.checkIfShouldStartBeheading();
      },
      */
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (stateInfo.name.match(/Day/)) {
          if (!this.hasAbility(["Kill"])) {
            return;
          }
          this.methods.checkIfShouldStartBeheading();
        }
      },
      start: function () {
        if (!this.hasAbility(["Kill"])) {
          return;
        }
        this.methods.checkIfShouldStartBeheading();
      },
      afterActions: function () {
        if (!this.data.startedBeheading || !this.player.alive) {
          return;
        }

        const currentState = this.game.getStateName();
        if (currentState != "Day" && currentState != "Dusk") {
          return;
        }

        //this.data.numStatesSinceBeheading += 1;
        if (!this.hasAbility(["Kill"])) {
          return;
        }
        // kill everyone
        for (let p of this.game.alivePlayers()) {
          if (p != this.player) {
            let killAction = new Action({
              labels: ["kill"],
              actor: this.player,
              target: p,
              game: this.game,
              run: function () {
                if (this.dominates()) {
                  this.target.kill("beheading", this.actor, true);
                }
              },
            });
            this.game.instantAction(killAction);
            // p.kill("beheading", this.player);
          }
        }
      },
    };
  }
};
