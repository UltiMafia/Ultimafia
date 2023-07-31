const Game = require("../../core/Game");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Action = require("./Action");
const stateEventMessages = require("./templates/stateEvents");
const roleData = require("../../../data/roles");

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
        name: "Night",
        length: options.settings.stateLengths["Night"],
      },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"],
      },
    ];
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
    this.noDeathLimit = 6;
    this.statesSinceLastDeath = 0;
    this.resetLastDeath = false;
    this.extensions = 0;
    this.extensionVotes = 0;
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
      this.getStateName() != "Sunset" &&
      meeting.name != "Village";
    return mustAct;
  }

  isMustCondemn() {
    var mustCondemn = super.isMustCondemn();
    mustCondemn |=
      this.statesSinceLastDeath >= this.noDeathLimit &&
      this.getStateName() != "Sunset" &&
      meeting.name == "Village";
    return mustCondemn;
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
      pregameWaitLength: this.pregameWaitLength,
      broadcastClosedRoles: this.broadcastClosedRoles,
    };
  }
};
