const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class AtheistGame extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Atheist Meeting": {
        actionName: "End Meeting",
        states: ["Night"],
        flags: ["voting", "mustAct"],
        inputType: "boolean",
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT - 5,
          run: function () {
            this.actor.role.data.FakeKill = true;
          },
        },
      },
    };
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          const alivePlayers = this.game.alivePlayers().filter((p) => p != this.actor);
          const allPlayers = this.game.alivePlayers();
          let roles = this.game.PossibleRoles.filter((r) => r);

          let shuffledPlayers = Random.randomizeArray(alivePlayers);

          if(this.actor.role.data.FakeKill){

          if(this.actor.role.data.FakeClean){
          const roleName = shuffledPlayers[0].getRoleAppearance("death");
            this.actor.role.lastCleanedAppearance = roleName;
            shuffledPlayers[0].role.appearance.death = null;
            this.actor.role.lastCleanedWill = shuffledPlayers[0].lastWill;
            shuffledPlayers[0].lastWill = null;

            this.actor.role.cleanedPlayer = shuffledPlayers[0];
            this.actor.role.data.FakeClean = false;
          }
          if (this.dominates(shuffledPlayers[0])) shuffledPlayers[0].kill("basic", this.actor);
          
          if(this.actor.role.data.FakeExtraKill && (Random.randInt(0, 100) <= 10)){
          if (this.dominates(shuffledPlayers[1])) shuffledPlayers[1].kill("basic", this.actor);
          }
          }
          if(this.actor.role.data.FakeVoteKill){
            shuffledPlayers[1].giveEffect("CursedVote", this.actor, Random.randArrayVal(allPlayers),1);
          }
          shuffledPlayers = Random.randomizeArray(alivePlayers);
          if(this.actor.role.data.FakeWordKill){
            this.actor.role.cursedWord = Random.randArrayVal(roles, true).split(":")[0].toLowerCase();
            shuffledPlayers[0].giveEffect("Cursed",this.actor, this.actor.role.cursedWord,1);
          }

          
          this.actor.role.alignment = "Village";
        },
      },
            {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let players = this.game.alivePlayers();
          const alivePlayers = this.game.alivePlayers().filter((p) => p != this.actor);
          let roles = this.game.PossibleRoles.filter((r) => r);

          let shuffledPlayers = Random.randomizeArray(alivePlayers);

          if(this.actor.role.data.FakeMindRot){
            if (this.dominates(shuffledPlayers[0])) {
              this.blockWithMindRot(shuffledPlayers[0]);
            }
          }

          shuffledPlayers = Random.randomizeArray(alivePlayers);
          if(this.actor.role.data.FakeBlocking){
            if (this.dominates(shuffledPlayers[0])) {
              this.blockWithMindRot(shuffledPlayers[0]);
            }
          }

           shuffledPlayers = Random.randomizeArray(alivePlayers);

            if(this.actor.role.data.FakeFalseMode){
              shuffledPlayers[0].giveEffect("FalseMode", 1);
              shuffledPlayers[1].giveEffect("FalseMode", 1);
          }

          let rolesEvil = roles.filter((r) => this.game.getRoleAlignment(r) == "Cult" || this.game.getRoleAlignment(r) == "Mafia");
          rolesEvil = Random.randomizeArray(rolesEvil);
          shuffledPlayers = Random.randomizeArray(alivePlayers);

              shuffledPlayers[0].role.appearance.reveal = rolesEvil[0].split(":");
              shuffledPlayers[0].role.appearance.investigate = rolesEvil[0].split(":");
              shuffledPlayers[0].role.appearance.condemn = rolesEvil[0].split(":");
              shuffledPlayers[0].role.hideModifier = {
                death: false,
                reveal: true,
                investigate: true,
                condemn: true,
              };
              rolesEvil = Random.randomizeArray(rolesEvil);
              this.actor.role.alignment = this.game.getRoleAlignment(rolesEvil[0]);
              this.actor.role.appearance.death = rolesEvil[0].split(":");
              this.actor.role.appearance.reveal = rolesEvil[0].split(":");
              this.actor.role.appearance.investigate = rolesEvil[0].split(":");
              this.actor.role.appearance.condemn = rolesEvil[0].split(":");
              this.actor.role.hideModifier = {
                death: true,
                reveal: true,
                investigate: true,
                condemn: true,
              };


          
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if(player != this.player) return;
      let roles = this.game.PossibleRoles.filter((r) => this.game.getRoleAlignment(r) == "Cult" || this.game.getRoleAlignment(r) == "Mafia");
      let chance = 100;
        if(this.game.setup.closed){
          chance = 45;
        }
        for(let x = 0; x < roles.length; x++){
          let roleTags = this.game.getRoleTags(roles[x]);
          for(let v = 0; v < roleTags.length;v++){
            if(roleTags [v] == "Vote Kills" && (Random.randInt(0, 100) <= chance)){
              this.player.role.data.FakeVoteKill = true;
            }
            if(roleTags [v] == "Role Blocker" && (Random.randInt(0, 100) <= chance)){
              this.player.role.data.FakeBlocking = true;
            }
            if(roleTags [v] == "Mind Rot" && (Random.randInt(0, 100) <= chance)){
              this.player.role.data.FakeMindRot = true;
            }
            if(roleTags [v] == "Clean Night Kill" && (Random.randInt(0, 100) <= chance)){
              this.player.role.data.FakeClean = true;
            }
            if(roleTags [v] == "False Mode" && (Random.randInt(0, 100) <= chance)){
              this.player.role.data.FakeFalseMode = true;
            }
             if(roleTags [v] == "Extra Night Deaths" && (Random.randInt(0, 100) <= chance)){
              this.player.role.data.FakeExtraKill = true;
            }
            if(roleTags [v] == "Word Kill" && (Random.randInt(0, 100) <= chance)){
              this.player.role.data.FakeWordKill = true;
            }

          }

        }
       
      },
      state: function () {
        if (this.game.getStateName() != "Day") return;
        const cleanedPlayer = this.cleanedPlayer;
        if (!cleanedPlayer) return;
        const lastCleanedAppearance = this.player.role.lastCleanedAppearance;
        if (!lastCleanedAppearance) return;

        cleanedPlayer.role.appearance.death = lastCleanedAppearance;
        cleanedPlayer.lastWill = this.player.role.lastCleanedWill;
        this.player.role.lastCleanedAppearance = null;
      },
      death: function (player, killer, killType, instant) {
        let players = this.game.alivePlayers();

        if(players.length <= 2){
          for (let p of this.game.alivePlayers()) {
              p.kill("basic", this.player, instant); 
          }
        }
      },
    };
  }
};
