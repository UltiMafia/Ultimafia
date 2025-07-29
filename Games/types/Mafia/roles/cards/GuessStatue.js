const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
module.exports = class GuessAdversaryConvert extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Statue": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["Convert"],
          run: function () {
            /*
            if (this.actor.role.roleToGuess.isArray) {
              if (roleToGuess.indexOf(this.target.role.name) < 0) {
                this.cancel();
                return;
              }
            } else if (this.target.role.name != this.actor.role.roleToGuess) {
              this.cancel();
              return;
            }
            */
            if (this.role.roleToGuess == null) return;
            for (let x = 0; x < this.role.roleToGuess.length; x++) {
              if (this.target.role.name == this.role.roleToGuess[x]) {
                if (this.dominates()){
            let randomVillageRole = Random.randArrayVal(this.role.getAllRoles().filter((r) => this.game.getRoleAlignment(r) == "Village" && !r.split(":")[1]?.includes("Banished") && r.split(":")[0] != "Damsal"));
            if(!randomVillageRole){
            randomVillageRole = "Villager";
            }
            this.target.setRole(
              randomVillageRole,
              null,
              false,
              false,
              false,
              "No Change"
            );
                }
                  //this.target.setRole("Cultist", this.actor);
              }
            }

            //if (this.dominates()) this.target.setRole("Cultist", this.actor);
          },
        },
      },
    };

        this.listeners = {
      addRequiredRole: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

          let players = this.game.players.filter(
            (p) => p.role.alignment == "Village"
          );
          let shuffledPlayers = Random.randomizeArray(players);
          for (let x = 0; x < shuffledPlayers.length; x++) {
            if (
              shuffledPlayers[x].role.name == "Damsal"
            ) {
              return;
            }
          }
          shuffledPlayers = shuffledPlayers.filter((p) => !p.role.data.reroll);
          if (shuffledPlayers.length <= 0) return;
            for (let item of shuffledPlayers[0].items) {
              item.drop();
            }
            shuffledPlayers[0].setRole("Damsal", undefined, false, true, null, null, "RemoveStartingItems");
            shuffledPlayers[0].role.data.reroll = true;
          
        
      },
    };




  }
};
