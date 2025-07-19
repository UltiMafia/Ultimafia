const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class VotingWord extends Card {
  constructor(role) {
    super(role);


    this.meetings = {
      "Choose Phrase (4-10)": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 4,
          maxLength: 10,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Submit",
        },
        action: {
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
          run: function () {
            this.role.cursedWord = this.target;
              for (let player of this.game.players) {
              player.giveEffect("WordTracker", 1, this.actor, player, this.target);
            }
          },
        },
      },
    };
    

    this.listeners = {
      PreVotingPowers: function (meeting) {

        if(this.data.PlayersWhoSaidPhrase == null){
          this.data.PlayersWhoSaidPhrase = [];
        }
        let count = this.data.PlayersWhoSaidPhrase.filter((p) => p.faction == "Village").length;

            if(this.player.hasAbility(["Voting"])){
            this.player.role.VotePower = count;
            }
      },
      state: function () {
        if (this.game.getStateName() == "Day"){
          this.data.PlayersWhoSaidPhrase = [];
          this.VotePower = 1;
        }
        if (this.game.getStateName() == "Night") {
          if(this.data.PlayersWhoSaidPhrase == null){
          this.data.PlayersWhoSaidPhrase = [];
        }
          if(this.player.hasAbility(["Speaking"])){

          var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["effect"],
          run: function () {
            let players = this.role.data.PlayersWhoSaidPhrase;
            for (let player of players) {
              player.giveEffect("SpeakOnlyWhispers", 1);
            }
          },
        });

        this.game.queueAction(action);
          }
        }
      },
    };
  }
};
