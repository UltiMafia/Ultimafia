const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveSnowballs extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Call a Snowball Fight?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT,        
          run: function () {
            if (this.target == "Yes") {
              let eligiblePlayers = this.game.players.length;
      
              // half of all players
              let numSnowballsToSpawn = (this.game.players.length / 2);
              // at most game size
              numSnowballsToSpawn = Math.min(
                numSnowballsToSpawn,
                this.game.players.length
              );
      
              if (eligiblePlayers.length < numSnowballsToSpawn) {
                eligiblePlayers = this.game.players.array();
              }
      
              eligiblePlayers = Random.randomizeArray(eligiblePlayers);
              for (let i = 0; i < numSnowballsToSpawn; i++) {
                eligiblePlayers[i].holdItem("Snowball");
                eligiblePlayers[i].queueAlert(":snowman: Someone calls a snowball fight!");
              }
              this.game.cloversSpawned = true;
            }
          },
        },
      },
    };
  }
};
