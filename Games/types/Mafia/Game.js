const Game = require("../../core/Game");
const Utils = require("../../core/Utils");
const Player = require("./Player");
const Event = require("./Event");
const Random = require("../../../lib/Random");
const Queue = require("../../core/Queue");
const Winners = require("./Winners");
const Action = require("./Action");
const stateEventMessages = require("./templates/stateEvents");
const roleData = require("../../../data/roles");
const rolePriority = require("./const/RolePriority");

module.exports = class MafiaGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Mafia";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Dusk",
        length: 1000 * 60,
      },
      {
        name: "Treasure Chest",
        length: 1000 * 60,
      },
      {
        name: "Night",
        length: options.settings.stateLengths["Night"],
      },
      {
        name: "Dawn",
        length: 1000 * 60,
      },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"],
      },
    ];
    this.useObituaries = true;
    this.pregameWaitLength = options.settings.pregameWaitLength;
    this.extendLength = options.settings.extendLength;
    this.broadcastClosedRoles = options.settings.broadcastClosedRoles;
    this.dayCount = 0;
    this.spectatorMeetFilter = {
      Village: true,
      Pregame: true,
      Postgame: true,
    };
    this.stateEventMessages = stateEventMessages;
    this.noDeathLimit = this.setup.noDeathLimit;
    this.statesSinceLastDeath = 0;
    this.resetLastDeath = false;
    this.extensions = 0;
    this.extensionVotes = 0;
    this.hasBeenDay = false;
    this.ForceMustAct = this.setup.ForceMustAct;
    this.currentSwapAmt = 1;
    this.RoomOne = [];
    this.RoomTwo = [];
    this.FinalRound = 3;
    this.CurrentRound = 0;
    this.AdmiralGoodRoles = [];
    this.AdmiralEvilRoles = [];
    this.AdmiralGold = 15;
    this.EventsPerNight = this.setup.EventsPerNight;
    this.GameEndEvent = this.setup.GameEndEvent || "Meteor";
    this.lastNightVisits = [];
    this.infoLog = [];
  }

  rebroadcastSetup() {
    if (this.setup.closed && this.broadcastClosedRoles) {
      this.setup.closed = false;
      this.setup.closedRoles = this.setup.roles;
      this.setup.roles = [
        Object.values(this.originalRoles).reduce((acc, e) => {
          if (!acc[e]) {
            acc[e] = 1;
          } else {
            acc[e]++;
          }
          return acc;
        }, {}),
      ];
      this.broadcast("setup", this.setup);
    }
  }

  assignRoles() {
    super.assignRoles();

    this.rebroadcastSetup();

    if (this.setup.votingDead) {
      this.graveyardParticipation = true;
    }

    this.NightOrder = this.getRoleNightOrder();

    for (let event of this.CurrentEvents) {
      let eventName = event.split(":")[0];
      let data = roleData[this.type][eventName];
      if (data.graveyardParticipation === "all") {
        this.graveyardParticipation = true;
        return;
      }
    }

    for (let playerId in this.originalRoles) {
      let roleName = this.originalRoles[playerId].split(":")[0];
      let data = roleData[this.type][roleName];
      if (data.graveyardParticipation === "all") {
        this.graveyardParticipation = true;
        return;
      }
    }
  }

  async playerLeave(player) {
    await super.playerLeave(player);

    if (this.started && !this.finished) {
      let toRecord =
        player.alive ||
        this.graveyardParticipation ||
        player.requiresGraveyardParticipation();
      if (toRecord) {
        this.recordLeaveStats(player, player.leaveStatsRecorded);
      }

      let action = new Action({
        actor: player,
        target: player,
        priority: -999,
        game: this,
        labels: ["hidden", "absolute", "uncontrollable"],
        run: function () {
          this.target.kill("leave", this.actor, true);
          this.game.exorcisePlayer(this.actor);
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
    if (player.hasEffect("Unveggable")) return;
    this.recordLeaveStats(player, false);
    super.vegPlayer(player);
  }

  start() {
    super.start();

    for (let player of this.players) player.recordStat("totalGames");
  }

  incrementState(index, skipped) {
    super.incrementState(index, skipped);

    if (
      (this.setup.startState == "Night" && this.getStateName() == "Night") ||
      (this.setup.startState == "Day" && this.getStateName() == "Day")
    ) {
      this.dayCount++;
    }
    if (this.getStateName() == "Day") {
      this.infoLog = [];
    var actionVisitDay = new Action({
        game: this,
        priority: 100,
        labels: ["hidden", "absolute"],
        run: function () {
          this.game.hasBeenDay = true;
          if(this.game.IsBloodMoon == true){
            this.game.hasBeenBloodMoonDay = true;
          }
        },
      });

      this.queueAction(actionVisitDay);
    }
    if (this.getStateName() == "Night") {
      var actionVisit = new Action({
        game: this,
        priority: 100,
        labels: ["hidden", "absolute"],
        run: function () {
          if (
            this.game.Necronomicon == "Demonic" ||
            this.game.Necronomicon == "Active"
          ) {
            for (let player of this.game.players) {
              if (
                player.faction == "Cult" &&
                player.role.alignment != "Independent"
              ) {
                player.holdItem("NecroVoting", "Vote for Necronomicon Holder");
              }
            }
          }

          if(this.game.MovieWatchers && this.game.MovieWatchers.length <= 2){
            this.game.MovieWatchers = null;
          }

          this.game.hasBeenNight = true;

          this.game.lastNightVisits = [];
          for (let action of this.game.actions[0]) {
            this.game.lastNightVisits.push(action);
          }
        },
      });

      this.queueAction(actionVisit);
    }
    if (this.getStateName() == "Night" && this.CurrentEvents.length > 0) {
      this.selectedEvent = false;
      for (
        let x = 0;
        x < this.EventsPerNight &&
        this.CurrentEvents.filter(
          (e) => this.checkEvent(e.split(":")[0], e.split(":")[1]) == true
        ).length > 0;
        x++
      ) {
        let event;
        let eventMods;
        let eventName;

        let Events = this.CurrentEvents.filter(
          (e) => this.checkEvent(e.split(":")[0], e.split(":")[1]) == true
        );
        if (Events.length <= 0) {
          break;
        }
        event = Random.randArrayVal(Events);
        eventMods = event.split(":")[1];
        eventName = event.split(":")[0];
        //this.game.queueAlert(`Manager ${eventMods}`);
        event = this.createGameEvent(eventName, eventMods);
        event.doEvent();
        event = null;
      }
      this.selectedEvent = true;
    }
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
      this.statesSinceLastDeath >= this.noDeathLimit &&
      this.getStateName() != "Dusk" &&
      this.getStateName() != "Dawn" &&
      this.ForceMustAct == true;
    return mustAct;
  }

  isMustCondemn() {
    var mustCondemn = super.isMustCondemn();
    mustCondemn |=
      this.statesSinceLastDeath >= this.noDeathLimit &&
      this.getStateName() != "Dusk" &&
      this.getStateName() != "Dawn" &&
      this.ForceMustAct == true;
    return mustCondemn;
  }

  inactivityCheck() {
    var stateName = this.getStateName();

    if (!this.resetLastDeath && (stateName == "Day" || stateName == "Night")) {
      this.statesSinceLastDeath++;

      if (this.statesSinceLastDeath >= this.noDeathLimit) {
        if (this.ForceMustAct == true) {
          this.queueAlert("No one has died for a while, you must act.");
        }
      }
      if (this.statesSinceLastDeath >= this.noDeathLimit - 1) {
        if (stateName == "Night") {
          let event = this.createGameEvent(this.GameEndEvent);
          event.doEvent();
          event = null;
          /*
        this.queueAlert(
          "A giant meteor will destroy the town and no one will win if no one dies today."
        );
        */
        }
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
            if(this.extendLength == 0){
               this.extensions = 99;
            }
        var aliveCount = this.alivePlayers().length;
        var votesNeeded = Math.ceil(aliveCount / 2) + this.extensions;

        if (this.extensionVotes < votesNeeded || this.isTest) break;
        this.timers["main"].extend(this.extendLength * 60 * 1000);
        this.extensions++;
        this.extensionVotes = 0;

        for (let player of this.players){
          player.votedForExtension = false;
      }
        this.sendAlert("Day extended due to a lack of votes.");
      
        return;
      }
    }

    this.extensions = 0;
    this.extensionVotes = 0;

    for (let player of this.players) player.votedForExtension = false;
    /*
    if (
      this.statesSinceLastDeath >= this.noDeathLimit &&
      prevStateName == "Day"
    )
      this.meteorImminent = true;
    */
    super.checkVeg();
  }

  isNoAct() {
    return (
      this.setup.dawn &&
      this.getStateName() == "Night" &&
      (this.dayCount == 0 ||
        (this.dayCount == 1 && this.setup.startState == "Day"))
    );
  }

   isHostileVsMafia(){
   return this.setup.HostileVsMafia;
  }

  isCultVsMafia(){
    return this.setup.CultVsMafia;
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

      for (let effect of player.effects) {
        winQueue.enqueue(effect.winCheck);
      }

      winQueue.enqueue(player.role.winCheck);
      winQueue.enqueue(player.role.winCheckSpecial);
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

    if (this.IsBloodMoon == true && this.hasBeenBloodMoonDay == true) {
      finished = true;
    }

    if (
      this.IsBloodMoon == true &&
      this.hasBeenDay == true &&
      winners.groupAmt() <= 0
    ) {
      winners.addGroup("No one");
    }

    if (finished) {
      this.resetIdentities();
      this.events.emit("handleWinBlockers", winners);
      for (let winCheck of winQueue) {
        if (winCheck.againOnFinished) {
          winCheck.check(counts, winners, aliveCount, true);
        }
      }
      // Roles with braggadocious modifiers will prevent joint wins
      this.events.emit("handleWinBlockers", winners);
      this.events.emit("handleWinWith", winners);
      if (this.MeteorLanded != true) {
        this.events.emit("handleWinSwappers", winners);
      }
      if (winners.groupAmt() <= 0) {
        winners.addGroup("No one");
      }
    }
    //winners.handleBraggadocious();

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
      pregameWaitLength: this.pregameWaitLength,
      broadcastClosedRoles: this.broadcastClosedRoles,
    };
  }

  formatRole(role) {
    var roleName = role.split(":")[0];
    var modifiers = role.split(":")[1];
    return `${roleName}${modifiers ? ` (${modifiers})` : ""}`;
  }

  formatRoleInternal(role, modifiers) {
    if (modifiers == "" || modifiers == null) {
      modifiers = null;
    }
    return `${role}${modifiers ? `:${modifiers}` : ""}`;
  }

  createInformation(infoType, ...args) {
    const infoClass = Utils.importGameClass(this.type, "information", infoType);
    const info = new infoClass(...args);
    return info;
  }

  resetIdentities() {
    if (!this.swaps) return;

    for (let swap of this.swaps) {
      swap[0].swapIdentity(swap[1]);
      delete swap[1].swapped;
    }

    delete this.swaps;
  }

  getRoleNightOrder() {
    var roleName;
    var nightActions = [];
    var nightActionValue = [];
    var MAFIA_IN_GAME = false;
    for (let x = 0; x < this.PossibleRoles.length; x++) {
      roleName = this.PossibleRoles[x].split(":")[0];
      if (this.getRoleAlignment(roleName) == "Mafia") {
        MAFIA_IN_GAME = true;
      }
      if (rolePriority[this.type][roleName]) {
        for (
          let y = 0;
          y < rolePriority[this.type][roleName].ActionNames.length;
          y++
        ) {
          nightActions.push(
            `${roleName}: ${rolePriority[this.type][roleName].ActionNames[y]}`
          );
          nightActionValue.push(
            rolePriority[this.type][roleName].ActionValues[y]
          );
        }
      }
    }
    if (MAFIA_IN_GAME) {
      nightActions.push(`Mafia: Kill`);
      nightActionValue.push(-1);
    }
    let tempValue;
    let text;
    for (let w = 0; w < nightActionValue.length; w++) {
      for (let r = 0; r < nightActionValue.length; r++) {
        if (nightActionValue[w] < nightActionValue[r]) {
          tempValue = nightActionValue[w];
          text = nightActions[w];
          nightActionValue[w] = nightActionValue[r];
          nightActions[w] = nightActions[r];
          nightActionValue[r] = tempValue;
          nightActions[r] = text;
        }
      }
    }
    //let info = rolePriority[this.type][roleName];
    return nightActions.join(", ");
  }
};
