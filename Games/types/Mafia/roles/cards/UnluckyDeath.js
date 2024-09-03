const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class UnluckyDeath extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT+1,
        labels: ["kill"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          const alivePlayers = this.game
            .alivePlayers()
            .filter((p) => p != this.actor);
          const allPlayers = this.game.alivePlayers();
          let roles = this.game.PossibleRoles.filter((r) => r);

          let shuffledPlayers = Random.randomizeArray(alivePlayers);

          if (this.actor.role.data.CanDie) {
            if (Random.randInt(0, 100) <= this.actor.role.data.deathChance){
              if (this.dominates(this.actor)){
                this.actor.kill("basic", this.actor);
              }
            }
            if (
              this.actor.role.data.FakeExtraKill &&
              Random.randInt(0, 100) <= this.actor.role.data.deathChance && this.actor.alive
            ) {
              if (this.dominates(this.actor)){
                this.actor.kill("basic", this.actor);
              }
            }
          }
          if (this.actor.role.data.FakeVoteKill) {
            this.actor.giveEffect(
              "CursedVote",
              this.actor,
              Random.randArrayVal(allPlayers),
              1
            );
          }
          shuffledPlayers = Random.randomizeArray(alivePlayers);
          if (this.actor.role.data.FakeWordKill) {
            this.actor.role.cursedWord = Random.randArrayVal(roles, true)
              .split(":")[0]
              .toLowerCase();
            this.actor.giveEffect(
              "Cursed",
              this.actor,
              this.actor.role.cursedWord,
              1
            );
          }

          this.actor.role.data.deathChance = this.actor.role.data.deathChance+5 ;
          this.actor.role.data.CanDie = true;
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player != this.player) return;
        let roles = this.game.PossibleRoles.filter((r) => r);
        this.player.role.data.deathChance = 0;
        this.player.role.data.CanDie = false;
        let chance = 100;
        if (this.game.setup.closed) {
          chance = 60;
        }
        for (let x = 0; x < roles.length; x++) {
          let roleTags = this.game.getRoleTags(roles[x]);
          for (let v = 0; v < roleTags.length; v++) {
            if (
              roleTags[v] == "Vote Kills" &&
              Random.randInt(0, 100) <= chance
            ) {
              this.player.role.data.FakeVoteKill = true;
            }
            if (
              roleTags[v] == "Extra Night Deaths" &&
              Random.randInt(0, 100) <= chance
            ) {
              this.player.role.data.FakeExtraKill = true;
            }
            if (
              roleTags[v] == "Word Kill" &&
              Random.randInt(0, 100) <= chance
            ) {
              this.player.role.data.FakeWordKill = true;
            }
          }
        }
      },
      state: function () {
        if (this.game.getStateName() != "Day") return;
        let players = this.game.alivePlayers();
        if (players.length == 3) {
          if (Random.randInt(0, 150) <= this.player.role.data.deathChance){
              if (this.dominates(this.actor)){
                this.actor.kill("basic", this.actor);
              }
            }
        }
      },
      death: function (player, killer, killType, instant) {
        let players = this.game.alivePlayers();
          if (Random.randInt(0, 500) <= this.player.role.data.deathChance){
              if (this.dominates(this.actor)){
                this.actor.kill("basic", this.actor);
              }
            }
      },
    };
  }
};
