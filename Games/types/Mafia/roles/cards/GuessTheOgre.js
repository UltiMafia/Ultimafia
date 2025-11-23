const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class GuessTheOgre extends Card {
  constructor(role) {
    super(role);

      this.passiveActions = [
      {
        ability: ["Effect"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BECOME_DEAD_ROLE + 10,
        labels: ["effect"],
        role: role,
        run: function () {
          if (this.role.OgreGuessUsedYesterday == true) {
          this.role.OgreGuessUsedYesterday = false;
          return;
        }
            let players = this.game.alivePlayers().filter((p) => p.isEvil());

            let victim = Random.randArrayVal(players, true);

            victim.queueAlert(
              `You learn there is an Ogre in Town! If you guess who they are they will get condemned.`
            );
            victim.holdItem("GuessPlayer", this.actor);
          },
      },
    ];

  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
