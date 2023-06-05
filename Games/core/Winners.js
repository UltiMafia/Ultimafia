module.exports = class Winners {
  constructor(game) {
    this.game = game;
    this.groups = {};
    this.players = [];
  }

  addPlayer(player, group) {
    group = group || player.role.alignment;

    if (!this.groups[group]) this.groups[group] = [];

    this.groups[group].push(player);
  }

  addGroup(group) {
    if (!this.groups[group]) this.groups[group] = [];
  }

  removeGroup(group) {
    delete this.groups[group];
  }

  groupAmt() {
    return Object.keys(this.groups).length;
  }

  determinePlayers() {
    var players = {};

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

  queueAlerts() {
    for (let group in this.groups) {
      let plural = group[group.length - 1] == "s";
      this.game.queueAlert(`${group} win${plural ? "" : "s"}!`);
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
