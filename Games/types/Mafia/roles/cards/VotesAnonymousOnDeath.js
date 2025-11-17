const Card = require("../../Card");

module.exports = class VotesAnonymousOnDeath extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Effect", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: [
          "effect",
          "hidden",
          "absolute",
        ],
        role: role,
        run: function () {
          if(this.role.data.causeVoteAnonymous != true){
            return;
          }
           for (let p of this.game.players) {
              this.role.giveEffect(p, "VoteBlind", 1);
            }

            this.game.queueAlert(
              `The Typist has died! Nobody can publicly record the votes…`
            );
          this.role.data.causeVoteAnonymous = false;
        },
      },
    ];

    this.listeners = {
      death: function (player, killer, killType) {
        if (!this.hasAbility(["Effect", "WhenDead"])) {
          return;
        }
        if (player == this.player) this.data.causeVoteAnonymous = true;
      },
    };
  }
};
