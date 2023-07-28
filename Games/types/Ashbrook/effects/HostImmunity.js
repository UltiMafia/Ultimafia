const Effect = require("../Effect");

module.exports = class HostImmunity extends Effect {
  constructor(host) {
    super("Host Immunity");

    this.host = host;

    this.immunity["kill"] = Infinity;
    this.immunity["condemn"] = Infinity;

    this.listeners = {
      death: function (player, killer, deathType, instant){
        if (player == this.host){
          this.remove();
        }
      }
    };
  }

  remove() {
    this.player.kill("basic", this.actor);
  }
};
