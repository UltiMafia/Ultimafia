const Card = require("../../Card");

module.exports = class StartWithTriggerHappyGun extends Card {
  constructor(role) {
    super(role);

    this.startItems = [
      {
        type: "Gun",
        args: [{ triggerHappy: true }],
      },
    ];
  }
};
