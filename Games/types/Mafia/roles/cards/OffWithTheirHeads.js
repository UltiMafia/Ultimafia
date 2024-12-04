const Card = require("../../Card");

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
      if (this.player.hasEffect("FalseMode")) {
        this.game.queueAlert(
          "The Queen is fully supporting this rebellion. You have several more days to eliminate them."
        );
      } else {
        this.game.queueAlert(
          "The Queen is putting down this bloody rebellion with extreme prejudice. You must eliminate them today or else you will be beheaded."
        );
      }
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
          this.methods.checkIfShouldStartBeheading();
        }
      },
      start: function () {
        this.methods.checkIfShouldStartBeheading();
      },
      afterActions: function () {
        if (!this.data.startedBeheading || !this.player.alive) {
          return;
        }

        const currentState = this.game.getStateName();
        if (currentState != "Day" && currentState != "Night") {
          return;
        }

        this.data.numStatesSinceBeheading += 1;
        if (this.data.numStatesSinceBeheading >= 2) {
          // kill everyone
          for (let p of this.game.alivePlayers()) {
            if (p != this.player) {
              p.kill("beheading", this.player);
            }
          }
        }
      },
    };
  }
};
