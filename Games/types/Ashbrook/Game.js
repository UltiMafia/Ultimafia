const Game = require("../../core/Game");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Action = require("./Action");
const Random = require("../../../lib/Random");
const stateEventMessages = require("./templates/stateEvents");
const roleData = require("../../../data/roles");
const passport_steam = require("passport-steam");

module.exports = class AshbrookGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Ashbrook";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Night",
        length: options.settings.stateLengths["Night"],
      },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"],
      },
    ];
    this.extendLength = options.settings.extendLength;
    this.dayCount = 0;
    this.spectatorMeetFilter = {
      Village: true,
      Pregame: true,
      Postgame: true,
    };
    this.stateEventMessages = stateEventMessages;
    this.noDeathLimit = 6;
    this.statesSinceLastDeath = 0;
    this.resetLastDeath = false;
    this.extensions = 0;
    this.extensionVotes = 0;

    this.excessRoles = {};
  
    this.allCharacters = [];
    this.allCharactersByAlignment = {};

    //this.votes = {};
  }

  async playerLeave(player) {
    await super.playerLeave(player);

    if (this.started && !this.finished) {
      let action = new Action({
        actor: player,
        target: player,
        game: this,
        run: function () {
          this.target.kill("leave", this.actor, true);
        },
      });

      this.instantAction(action);
    }
  }

  recordLeaveStats(player, statsRecorded) {
    if (!statsRecorded) {
      player.leaveStatsRecorded = true;
      // player.recordStat("survival", false);
      player.recordStat("abandons", true);
    }
  }

  async vegPlayer(player) {
    this.recordLeaveStats(player, false);
    super.vegPlayer(player);
  }

  start() {
    super.start();

    for (let player of this.players) {
      player.recordStat("totalGames");
      // giving a nominator here doesnt give ot all when someone is killed at night
    }
  }

  incrementState() {
    super.incrementState();

    if (
      (this.setup.startState == "Night" && this.getStateName() == "Night") ||
      (this.setup.startState == "Day" && this.getStateName() == "Day")
    ) {
      this.dayCount++;
    }

    /*if (this.getStateName() == "Night") {
      this.determineVillageVote();
    }*/
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.dayCount = this.dayCount;

    if (info.name != "Pregame" && info.name != "Postgame") {
      info = {
        ...info,
        name: `${info.name} ${this.dayCount}`,
      };
    }

    return info;
  }

  isMustAct() {
    var mustAct = super.isMustAct();
    mustAct |=
      this.statesSinceLastDeath >= this.noDeathLimit;
    return mustAct;
  }

  inactivityCheck() {
    var stateName = this.getStateName();

    if (!this.resetLastDeath && (stateName == "Day" || stateName == "Night")) {
      this.statesSinceLastDeath++;

      if (this.statesSinceLastDeath >= this.noDeathLimit) {
        if (stateName != "Day")
          this.queueAlert("No one has died for a while, you must act.");
        else
          this.queueAlert(
            "A giant meteor will destroy the town and no one will win if no one dies today."
          );
      }
    } else if (this.resetLastDeath) {
      this.statesSinceLastDeath = 0;
      this.resetLastDeath = false;
      this.meteorImminent = false;
    }
  }

  checkVeg() {
    var prevStateName = this.getStateName();

    if (
      (!this.timers["secondary"] || !this.timers["secondary"].done) &&
      prevStateName == "Day"
    ) {
      for (let meeting of this.meetings) {
        if (meeting.name != "Village") continue;

        for (let member of meeting.members)
          if (
            member.canVote &&
            !meeting.votes[member.id] &&
            !member.player.votedForExtension
          )
            this.extensionVotes++;

        var aliveCount = this.alivePlayers().length;
        var votesNeeded = Math.ceil(aliveCount / 2) + this.extensions;

        if (this.extensionVotes < votesNeeded || this.isTest) break;

        this.timers["main"].extend(this.extendLength * 60 * 1000);
        this.extensions++;
        this.extensionVotes = 0;

        for (let player of this.players) player.votedForExtension = false;

        this.sendAlert("Day extended due to a lack of votes.");
        return;
      }
    }

    this.extensions = 0;
    this.extensionVotes = 0;

    for (let player of this.players) player.votedForExtension = false;

    if (
      this.statesSinceLastDeath >= this.noDeathLimit &&
      prevStateName == "Day"
    )
      this.meteorImminent = true;

    super.checkVeg();
  }

  gotoNextState() {
    super.gotoNextState();
  }

  isNoAct() {
    return (
      this.setup.dawn &&
      this.getStateName() == "Night" &&
      (this.dayCount == 0 ||
        (this.dayCount == 1 && this.setup.startState == "Day"))
    );
  }

  checkGameEnd() {
    var finished = super.checkGameEnd();

    if (finished) return finished;

    if (this.meteorImminent && !this.resetLastDeath) {
      this.queueAlert("A giant meteor obliterates the town!");

      var winners = new Winners(this);
      winners.addGroup("No one");
      this.endGame(winners);

      return true;
    }
  }

  checkWinConditions() {
    var finished = false;
    var counts = {};
    var winQueue = new Queue();
    var winners = new Winners(this);
    var aliveCount = this.alivePlayers().length;

    for (let player of this.players) {
      let alignment = player.role.winCount || player.role.alignment;

      if (!counts[alignment]) counts[alignment] = 0;

      if (player.alive) counts[alignment]++;

      winQueue.enqueue(player.role.winCheck);
    }

    for (let winCheck of winQueue) {
      let stop = winCheck.check(counts, winners, aliveCount, false);
      if (stop) break;
    }

    if (winners.groupAmt() > 0) finished = true;
    else if (aliveCount == 0) {
      winners.addGroup("No one");
      finished = true;
    }

    if (finished)
      for (let winCheck of winQueue)
        if (winCheck.againOnFinished)
          winCheck.check(counts, winners, aliveCount, true);

    winners.determinePlayers();
    return [finished, winners];
  }

  async endGame(winners) {
    for (let player of this.players) {
      if (player.won) player.recordStat("wins", true);
      else player.recordStat("wins", false);
    }

    await super.endGame(winners);
  }

  getGameTypeOptions() {
    return {
      extendLength: this.extendLength,
    };
  }

  isGood(target) {
    target = target || this.actor;
    
    return target.role.alignment === "Villager"
    || target.role.alignment === "Outcast";
  }

  assignRoles() {
    if (this.anonymousGame) {
      this.makeGameAnonymous();
    }

    var roleset = this.generateRoleset();
    let players = this.players.array();

    var randomPlayers = Random.randomizeArray(players);

    var i = 0;
    this.originalRoles = {};

    for (let roleName in roleset) {
      for (let j = 0; j < roleset[roleName]; j++) {
        let player = randomPlayers[i];
        player.setRole(roleName, undefined, false, true, true);
        this.originalRoles[player.id] = roleName;
        i++;
      }
    }

    this.players.map((p) => this.events.emit("reroll", p));
    this.rollQueue = [];

    while (this.rollQueue.length < 0){
      this.events.emit("reroll", rollQueue[0]);
      this.rollQueue.shift();
    }

    this.players.map((p) => p.role.revealToSelf(false));

    this.players.map((p) => this.events.emit("roleAssigned", p));
  }

  generateRoleset() {
    this.patchRenamedRoles();
    var roleset;

    roleset = this.generateClosedRoleset();

    return roleset;
  }

  generateClosedRoleset() {
    if (this.setup.useRoleGroups) {
      return this.generateClosedRolesetUsingRoleGroups();
    }

    var roleset = {};
    var rolesByAlignment = {};

    for (let role in this.setup.roles[0]) {
      let roleName = role.split(":")[0];
      let alignment = roleData[this.type][roleName].alignment;

      if (!rolesByAlignment[alignment]) rolesByAlignment[alignment] = [];
      if (!this.excessRoles[alignment]) this.excessRoles[alignment] = [];

      for (let i = 0; i < this.setup.roles[0][role]; i++)
        rolesByAlignment[alignment].push(role);
        this.excessRoles[alignment].push(roleName);
        this.allCharacters.push(roleName);
        if (!this.allCharactersByAlignment[alignment]) this.allCharactersByAlignment[alignment] = [];
        this.allCharactersByAlignment[alignment].push(roleName);
    }

    for (let alignment in rolesByAlignment) {
      for (let i = 0; i < this.setup.count[alignment]; i++) {
        let role = Random.randArrayVal(rolesByAlignment[alignment]);

        if (this.setup.unique && this.setup.uniqueWithoutModifier) {
          rolesByAlignment[alignment] = rolesByAlignment[alignment].filter(
            (_role) => _role.split(":")[0] != role.split(":")[0]
          );
        } else if (this.setup.unique && !this.setup.uniqueWithoutModifier) {
          rolesByAlignment[alignment] = rolesByAlignment[alignment].filter(
            (_role) => _role != role
          );
        }

        if (roleset[role] == null) roleset[role] = 0;

        let roleName = role.split(":")[0];
        let index = this.excessRoles[alignment].indexOf(roleName);
        if (index !== -1) this.excessRoles[alignment].splice(index, 1);

        roleset[role]++;
      }
    }

    return roleset;
  }

  generateClosedRolesetUsingRoleGroups() {
    let finalRoleset = {};

    for (let i in this.setup.roles) {
      let size = this.setup.roleGroupSizes[i];
      let roleset = this.setup.roles[i];

      // has common logic with generatedClosedRoleset, can be refactored in future
      let rolesetArray = [];
      for (let role in roleset) {
        for (let i = 0; i < roleset[role]; i++) {
          rolesetArray.push(role);

          let roleName = role.split(":")[0];
          let roleAlignment = roleData[this.type][roleName].alignment;
          if (!this.excessRoles[roleAlignment]) this.excessRoles[roleAlignment] = [];
          if (finalRoleset[roleName] == null) this.excessRoles[roleAlignment].push(roleName);
          this.allCharacters.push(roleName);
          if (!this.allCharactersByAlignment[alignment]) this.allCharactersByAlignment[alignment] = [];
          this.allCharactersByAlignment[alignment].push(roleName);
          }
        }

      for (let i = 0; i < size; i++) {
        let role = Random.randArrayVal(rolesetArray);

        if (this.setup.unique && this.setup.uniqueWithoutModifier) {
          rolesetArray = rolesetArray.filter(
            (_role) => _role.split(":")[0] != role.split(":")[0]
          );
        } else if (this.setup.unique && !this.setup.uniqueWithoutModifier) {
          rolesetArray = rolesetArray.filter((_role) => _role != role);
        }

        if (finalRoleset[role] == null) finalRoleset[role] = 0;

        let roleName = role.split(":")[0];
        let roleAlignment = roleData[this.type][roleName].alignment;
        let index = this.excessRoles[roleAlignment].indexOf(roleName);
        if (index !== -1) this.excessRoles[roleAlignment].splice(index, 1);

        finalRoleset[role]++;
      }
    }

    return finalRoleset;
  }

  /*determineVillageVote() {
    var aliveCount = this.alivePlayers().length;

    var currentTarget = [];
    var currentCount = 0;

    for (let player in this.votes){
      if (currentCount > this.votes[player].votesYes){
        currentTarget = [this.votes[player].player];
        currentCount = this.votes[player].votesYes;
      if (currentCount == this.votes[player].votesYes){
        currentTarget.append(this.votes[player].player);
        }
      }
    }

    if (currentTarget.length == 1){
      currentTarget[0].kill("condemn", currentTarget[0]);
    }
  };*/

  // for person in the voted list

  // perform their nomination

  // after the nomination, the highest dies

}
