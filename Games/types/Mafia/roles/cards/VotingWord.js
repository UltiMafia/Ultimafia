const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class VotingWord extends Card {
  constructor(role) {
    super(role);


    this.meetings = {
      "Choose Phrase (7-20)": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 7,
          maxLength: 20,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Submit",
        },
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
          run: function () {
            this.actor.role.cursedWord = this.target;
              for (let player of this.game.players) {
              player.giveEffect("WordTracker", 1, this.actor);
            }
          },
        },
      },
    };
    

    this.listeners = {
      PreVotingPowers: function (meeting) {

        if(this.data.PlayersWhoSaidPhrase == null){
          this.data.PlayersWhoSaidPhraseCount = [];
        }
        let count = this.data.PlayersWhoSaidPhraseCount.filter((p) => p.faction == "Village").length;

            if(this.player.hasAbility(["Voting"])){
            this.player.role.VotePower = this.data.PlayersWhoSaidPhrase;
            }
      },
      state: function () {
        if (this.game.getStateName() == "Night") {
          if(this.data.PlayersWhoSaidPhrase == null){
          this.data.PlayersWhoSaidPhrase = [];
        }
          if(this.player.hasAbility(["Speaking"])){

          var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["effect"],
          run: function () {
            let players = this.actor.role.data.PlayersWhoSaidPhrase;
            for (let player of players) {
              player.giveEffect("SpeakOnlyWhispers", 1);
            }
          },
        });

        this.game.queueAction(action);
            
        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["effect"],
          run: function () {
            for (let player of this.game.players) {
              player.giveEffect("WordTracker", 1, this.actor);
            }
          },
        });

        this.game.queueAction(action2);
          }
          this.player.role.VotePower = 1;
          this.data.PlayersWhoSaidPhrase = [];
        }
      },
    };
  }
};
