const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class LearnAboutPlayerAndRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Select Players": {
        actionName: "Select Player",
        states: ["Day"],
        flags: ["voting", "instant"],
        targets: { include: ["alive","self"]},
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 2,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Select Relation": {
        actionName: "Select Relation",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [
          "Is",
          "Neighbors",
          "Was Visited By",
          "Has Visited",
        ],
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRealation = this.target;
          },
        },
      },
      "Select Role": {
        actionName: "Select Role",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "custom",
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetRole = this.target;
          },
        },
      },
      "Ask Question": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            if (this.target === "No") return;

            if(!this.actor.role.data.targetPlayer) return;
            if(!this.actor.role.data.targetRealation) return;
            if(!this.actor.role.data.targetRole) return;
            if(this.actor.role.data.targetPlayer == "No One") return;
            if(this.actor.role.data.targetRole == "None") return;

            let isCorrect = true;
            let question = "";

            if(this.actor.role.data.targetRealation == "Is"){
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Is ${this.actor.role.data.targetRole}?`;
              let playerRole = this.actor.role.data.targetPlayer.role.name;
              if(this.actor.role.data.targetRole == playerRole){
                isCorrect = true;
              }
              else{
                isCorrect = false;
              }
            }
            else if(this.actor.role.data.targetRealation == "Neighbors"){
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Neighbors ${this.actor.role.data.targetRole}?`;
              let alivePlayers = this.game.alivePlayers();
              let index  = alivePlayers.indexOf(this.actor.role.data.targetPlayer);
              let rightIdx = (index + 1) % alivePlayers.length;
              let leftIdx = (index - 1 + alivePlayers.length) % alivePlayers.length;
              let neighborRoles = [
                    alivePlayers[rightIdx].role.name,
                    alivePlayers[leftIdx].role.name,
                  ];
              if(this.actor.role.data.targetRole == neighborRoles[0] || this.actor.role.data.targetRole == neighborRoles[1]){
                isCorrect = true;
              }
              else{
                isCorrect = false;
              }
            }
            else if(this.actor.role.data.targetRealation == "Was Visited By"){
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Was Visited By ${this.actor.role.data.targetRole}?`;
              
              let lastVisitorsAll = this.actor.role.data.LastNightVisitors;
              let nightPlayers = this.actor.role.data.LastNightPlayers;
              let indexOfTarget = nightPlayers.indexOf(this.actor.role.data.targetPlayer);
              let lastVisitors = lastVisitorsAll [indexOfTarget];
              isCorrect = false;

              for(let y = 0;y<lastVisitors.length;y++){
                if(lastVisitors[y].name == this.actor.role.data.targetRole){
                  isCorrect = true;
                }
              }
            }
            else if(this.actor.role.data.targetRealation == "Has Visited"){
              question = `You ask if ${this.actor.role.data.targetPlayer.name} Has Visited ${this.actor.role.data.targetRole}?`;
              
              let lastVisitsAll = this.actor.role.data.LastNightVisits;
              let nightPlayers = this.actor.role.data.LastNightPlayers;
              let indexOfTarget = nightPlayers.indexOf(this.actor.role.data.targetPlayer);
              let lastVisits = lastVisitsAll [indexOfTarget];
              isCorrect = false;

              for(let y = 0;y<lastVisits.length;y++){
                if(lastVisits[y].name == this.actor.role.data.targetRole){
                  isCorrect = true;
                }
              }
            }


            this.actor.queueAlert(question);
            this.actor.queueAlert(`If the Answer is yes you will kill a random player Tonight.`);
            this.actor.role.data.WasStatementTrue = isCorrect;
            delete this.actor.role.data.targetPlayer;
            delete this.actor.role.data.targetRealation;
            delete this.actor.role.data.targetRole;
          }
          }
      },
    },

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["hidden","absolute","investigate"],
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;

          let alivePlayers = this.game.players.filter((p) => p.role);
          let allVisits = [];
          let allVisitors = [];

          for(let x = 0; x<alivePlayers.length;x++){
          let visits = this.getVisits(alivePlayers[x]);
          let visitNames = visits.map((p) => p.role);
          let visitors = this.getVisitors(alivePlayers[x]);
          let visitorNames = visitors.map((p) => p.role);
          allVisits.push(visitNames);
          allVisitors.push(visitorNames);
          }

        this.actor.role.data.LastNightVisits = allVisits;
        this.actor.role.data.LastNightVisitors = allVisitors;
        this.actor.role.data.LastNightPlayers = alivePlayers;
        

        },
      },
      {
        priority: PRIORITY_KILL_DEFAULT-2,
        labels: ["hidden","kill"],
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          if(this.actor.role.data.WasStatementTrue != true){
            return;
          }

          let alivePlayers = this.game.players.filter((p) => p.role);
          let goodPlayers = alivePlayers.filter((p) => p.role.alignment == "Village" || p.role.alignment == "Independent");
          let shuffledPlayers = Random.randomizeArray(goodPlayers);

          shuffledPlayers[0].kill("basic", this.actor);
        

        },
      },
    ];

      
      this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.ConvertOptions = this.game.PossibleRoles.map((r) => r.split(":")[0]);
        
      },
      // refresh cooldown
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        var ConvertOptions = this.data.ConvertOptions;
        ConvertOptions.push("None");

        this.meetings["Select Role"].targets = ConvertOptions;
      },
    };

        }
    };
