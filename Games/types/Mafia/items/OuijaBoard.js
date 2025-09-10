const Item = require("../Item");

module.exports = class OuijaBoard extends Item {
  constructor() {
    super("Ouija Board");

    this.meetings = {
      "Give Clue": {
        actionName: "Give Clue (1-50)",
        states: ["Give Clue"],
        flags: ["voting", "instant"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 50,
          submit: "Confirm",
        },
        action: {
          item: this,
          run: function () {
            this.game.GhostCluesLisited = false;
            if (!this.game.GhostClues) {
              this.game.GhostClues = [];
            }
            this.game.GhostClues.push(`${this.actor.name}: ${this.target}`);
            this.game.sendAlert(`${this.actor.name}: ${this.target}`);
            if (!this.game.PlayersWhoGaveClue) {
              this.game.PlayersWhoGaveClue = [];
            }
            this.game.PlayersWhoGaveClue.push(this.actor);
            let players = this.game
              .alivePlayers()
              .filter((p) => p.role.name != "Host");
            let index = players.indexOf(this.actor);
            for (let x = 0; x < players.length; x++) {
              if (
                !this.game.PlayersWhoGaveClue.includes(
                  players[(index + x + 1) % players.length]
                )
              ) {
                players[(index + x + 1) % players.length].holdItem(
                  "Ouija Board"
                );
                this.item.drop();
                return;
              }
            }
            this.item.drop();
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player == this.holder) {
          let players = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.role.name != "Host" &&
                this.game.PlayersWhoGaveClue.includes(p)
            );
          if (players.length <= 0) {
            return;
          }

          players[0].holdItem("Ouija Board");
        }
      },
    };
  }

  hold(player) {
    super.hold(player);
    player.game.queueAlert(`${player.name} is giving a clue…`);
  }
};
