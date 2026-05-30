const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

const HIDDEN_FROM_SEER = ["Godfather", "Cultist (Respected)"];

module.exports = class MissionGame extends Card {
  constructor(role) {
    super(role);

    if (role.isExtraRole == true) {
      return;
    }

    this.listeners = {
      roleAssigned: function (player) {
        if (this.player !== player) {
          return;
        }

        const setup = this.game.setup;
        this.game.ResistanceMode = true;
        this.game.mission = 1;
        this.game.missionFails = 0;
        this.game.numMissions = Number(setup.numMissions) || 5;
        this.game.currentMissionFails = 0;
        this.game.teamFails = 0;
        this.game.currentTeamFail = false;
        this.game.teamFailLimit = Number(setup.teamFailLimit) || 5;
        this.game.currentMissionHistory = null;
        this.game.missionRecord = {
          missionHistory: [],
          score: { rebels: 0, spies: 0 },
        };

        const firstTeamSize = Number(setup.firstTeamSize) || 2;
        const lastTeamSize = Number(setup.lastTeamSize) || 4;
        this.game.teamSizeSlope =
          (lastTeamSize - firstTeamSize) / this.game.numMissions;
        this.game.teamSizes = [];

        for (let i = 0; i < this.game.numMissions; i++) {
          this.game.teamSizes.push(
            Math.round(firstTeamSize + i * this.game.teamSizeSlope)
          );
        }

        this.game.leaderIndex = Random.randInt(0, this.game.players.length - 1);

        for (let p of this.game.players) {
          p.holdItem("NoVillageMeeting");
          p.holdItem("NoMafiaKill");
          p.holdItem("MissionParticipant");

          if (p.isEvil()) {
            if (HIDDEN_FROM_SEER.includes(p.role.name)) {
              p.role.appearance.merlin = null;
            } else if (p.role.appearance.merlin == null) {
              p.role.appearance.merlin = p.role.alignment;
            }
          }
        }
      },
      start: function () {
        if (!this.game.ResistanceMode) {
          return;
        }

        for (let player of this.game.players) {
          if (player.role.name !== "Seer") {
            continue;
          }

          for (let other of this.game.players) {
            if (other.role.appearance.merlin) {
              other.role.revealToPlayer(player, false, "merlin");
            }
          }
        }
      },
      extraStateCheck: function (stateName) {
        if (!this.game.ResistanceMode) {
          return;
        }
        if (this.game.ExtraStates == null) {
          this.game.ExtraStates = [];
        }
        for (let name of ["Team Approval", "Mission"]) {
          if (stateName == name && !this.game.ExtraStates.includes(name)) {
            this.game.ExtraStates.push(name);
          }
        }
      },
    };

    this.stateMods = {
      Day: {
        type: "shouldSkip",
        shouldSkip: function () {
          return this.game.ResistanceMode;
        },
      },
    };
  }
};
