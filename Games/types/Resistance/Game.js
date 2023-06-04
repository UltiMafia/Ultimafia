const Game = require("../../core/Game");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Random = require("../../../lib/Random");

module.exports = class ResistanceGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Resistance";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Team Selection",
        length: options.settings.stateLengths["Team Selection"],
      },
      {
        name: "Team Approval",
        length: options.settings.stateLengths["Team Approval"],
      },
      {
        name: "Mission",
        length: options.settings.stateLengths["Mission"],
        skipChecks: [() => this.currentTeamFail],
      },
    ];
    this.mission = 1;
    this.missionFails = 0;
    this.numMissions = this.setup.numMissions;
    this.currentMissionFails = 0;

    // scorekeeping
    this.currentMissionHistory = null;
    this.missionRecord = {
      missionHistory: [],
      score: { rebels: 0, spies: 0 },
    };

    this.teamFails = 0;
    this.currentTeamFail = false;
    this.teamFailLimit = this.setup.teamFailLimit;

    this.teamSizeSlope =
      (this.setup.lastTeamSize - this.setup.firstTeamSize) / this.numMissions;
    this.teamSizes = [];

    for (let i = 0; i < this.numMissions; i++)
      this.teamSizes.push(
        Math.round(this.setup.firstTeamSize + i * this.teamSizeSlope)
      );

    this.leaderIndex = Random.randInt(0, this.players.length - 1);
    this.hasMerlin = false;
  }

  get currentTeamSize() {
    return this.teamSizes[this.mission - 1];
  }

  get currentLeader() {
    return this.players.at(this.leaderIndex);
  }

  incrementState() {
    // Leaving states
    let previousState = this.getStateInfo().name;

    if (previousState.match(/Mission/)) {
      if (this.currentMissionFails > 0) {
        this.missionFails++;
        var plural = this.currentMissionFails > 1;
        this.queueAlert(
          `Mission ${this.mission} failed due to ${
            this.currentMissionFails
          } team member${plural ? "s" : ""}.`
        );
      } else this.queueAlert(`Mission ${this.mission} succeeded.`);

      this.recordMissionFails(this.currentMissionFails);

      this.mission++;
      this.currentMissionFails = 0;
      this.teamFails = 0;
    } else if (
      previousState.match(/Team Approval/) &&
      this.teamFails >= this.teamFailLimit
    ) {
      this.queueAlert(`Mission ${this.mission} failed due to lack of a team.`);
      this.recordMissionFails(-1);

      this.missionFails++;
      this.mission++;
      this.currentMissionFails = 0;
      this.teamFails = 0;
    } else if (previousState.match(/Team Selection/)) {
      this.currentTeamFail = false;
    }

    super.incrementState();

    //Entering states
    if (this.getStateInfo().name.match(/Team Selection/)) {
      this.leaderIndex++;

      if (this.leaderIndex == this.players.length) this.leaderIndex = 0;

      this.currentLeader.holdItem("Leader", this);
    }
  }

  recordMissionTeam(team) {
    this.currentMissionHistory = {
      mission: this.mission,
      team: team,
    };
  }

  recordMissionFails(numFails) {
    if (numFails === -1) {
      this.currentMissionHistory = {
        mission: this.mission,
        team: [],
      };
    }

    this.currentMissionHistory.numFails = numFails;
    const winningTeam =
      this.currentMissionHistory.numFails === 0 ? "rebels" : "spies";

    // update mission record
    this.missionRecord.missionHistory.push(this.currentMissionHistory);
    this.missionRecord.score[winningTeam] += 1;
    this.currentMissionHistory = null;
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.mission = this.mission;

    if (info.name == "Mission") {
      info = {
        ...info,
        name: `Mission ${this.mission}`,
      };
    }

    info.extraInfo = this.missionRecord;

    return info;
  }

  checkWinConditions() {
    var thresholdToWin = this.numMissions / 2;
    var finished =
      this.missionFails >= thresholdToWin ||
      (this.mission - 1 - this.missionFails >= thresholdToWin &&
        !this.hasMerlin);
    var winners = finished && this.getWinners();

    return [finished, winners];
  }

  getWinners() {
    var winQueue = new Queue();
    var winners = new Winners(this);

    for (let player of this.players) winQueue.enqueue(player.role.winCheck);

    for (let winCheck of winQueue) {
      let stop = winCheck.check(winners);
      if (stop) break;
    }

    winners.determinePlayers();
    return winners;
  }
};
