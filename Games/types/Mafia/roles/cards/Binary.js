const Card = require("../../Card");

module.exports = class Binary extends Card {
  constructor(role) {
    super(role);

    const track = this.role.meetings.Track;
    if (track && track.action) {
      const original = track.action.run;
      track.actionName = "Observe for visits";
      track.action.run = function () {
        if (!this.actor.role.hasAbility(["Modifier"])) {
          return original.call(this);
        }

        let info = this.game.createInformation(
          "BinaryTrackerInfo",
          this.actor,
          this.game,
          this.target
        );
        info.processInfo();
        this.actor.queueAlert(`:track: ${info.getInfoFormated()}`);
      };
    }

    const shadow = this.role.meetings.Shadow;
    if (shadow && shadow.action) {
      const original = shadow.action.run;
      shadow.action.run = function () {
        if (!this.actor.role.hasAbility(["Modifier"])) {
          return original.call(this);
        }

        let info = this.game.createInformation(
          "WatcherInfo",
          this.actor,
          this.game,
          this.target
        );
        info.processInfo();
        let info2 = this.game.createInformation(
          "BinaryTrackerInfo",
          this.actor,
          this.game,
          this.target
        );
        info2.processInfo();

        this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
        this.actor.queueAlert(`:track: ${info2.getInfoFormated()}`);
      };
    }
  }
};
