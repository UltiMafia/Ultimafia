const Card = require("../../Card");
const { PRIORITY_VILLAGE } = require("../../const/Priority");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        type: "Village",
        states: ["Day"],
        targets: { include: ["alive"], exclude: [cannotBeVoted] },
        flags: ["group", "speech", "voting"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
        action: {
          labels: ["kill", "condemn", "hidden"],
          priority: PRIORITY_VILLAGE,
          power: 3,
          run: function () {
            if (this.dominates()) this.target.kill("condemn", this.actor);
          },
        },
      },
      "Atheist Game": {
        states: ["Day"],
        inputType: "custom",
        targets: ["Proclaim Atheist Game", "No"],
        flags: ["group", "voting"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
        shouldMeet: function () {
          return this.game.AtheistPossible == true;
        },
        action: {
          labels: ["hidden","atheist"],
          priority: PRIORITY_VILLAGE-1,
          power: 3,
          run: function () {

              if(this.target != "Proclaim Atheist Game") return;

              let players = this.game.players.filter((p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult");
              if(players.length > 0){
              for (let p of this.game.alivePlayers()) {
                if (p.role.alignment === "Village" || p.role.name === "Atheist") {
                  p.kill("basic", this.actor, true);
                }
              }
              }
              else{
              for (let p of this.game.players) {
                if (p.role.alignment == "Village" || p.role.name == "Atheist") {
                  p.role.data.AtheistWin = true;
                }
              }
              }
          },
        },
      },
      Graveyard: {
        states: ["Night"],
        flags: ["group", "speech", "liveJoin"],
        whileAlive: false,
        whileDead: true,
        passiveDead: false,
        speakDead: true,
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        if(!this.game.AtheistPossible) return;

        //this.meetings["Village"].targets.push("Proclaim Atheist Game");
      },
    };
  }
};

function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
