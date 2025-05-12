module.exports = class Winners {
  constructor(game) {
    this.game = game;
    this.groups = {};
    this.players = [];
  }

  addPlayer(player, group) {
    group = group || player.role.alignment;

    if (!this.groups[group]) this.groups[group] = [];

    if (!this.groups[group].includes(player)) {
      this.groups[group].push(player);
    }
  }

  addGroup(group) {
    if (!this.groups[group]) this.groups[group] = [];
  }

  removePlayer(player, group) {
    group = group || player.role.alignment;

    if (!this.groups[group]) return;

    if (this.groups[group].includes(player)) {
      this.groups[group].splice(this.groups[group].indexOf(player), 1);
    }
  }

  removeGroup(group) {
    delete this.groups[group];
  }

  groupAmt() {
    return Object.keys(this.groups).length;
  }

  determinePlayers() {
    var players = {};

    if (this.groupAmt() > 1) {
      this.removeGroup("No one");
    }

    for (let group in this.groups) {
      for (let player of this.groups[group]) {
        players[player.id] = player;
        if (!player.leaveStatsRecorded) {
          player.won = true;
        }
      }
    }

    this.players = Object.values(players);
  }

  getGroupWinMessage(group, plural) {
    return `${group} win${plural ? "" : "s"}!`;
  }

  queueAlerts() {
    for (let group in this.groups) {
      let plural = group[group.length - 1] == "s";
      const uniqueGroupPlayers = [...new Set(this.groups[group])];

      if (this.queueShortAlert || uniqueGroupPlayers.length == 0) {
        this.game.queueAlert(`${group} win${plural ? "" : "s"}!`);
        continue;
      }

      this.game.queueAlert(
        `${this.getGroupWinMessage(group, plural)} (${uniqueGroupPlayers
          .map((p) => p.name)
          .join(", ")})`
      );
    }
  }

  getWinnersInfo() {
    return {
      groups: Object.keys(this.groups),
      players: this.players.map((p) => p.id),
    };
  }

  getPlayers() {
    return this.players.map((p) => p.id);
  }
};
