const Item = require("../Item");

module.exports = class Suit extends Item {
  constructor(options) {
    super("Suit");
    this.type = options?.type;
    this.typeMods = options?.type.split(":")[1];
    this.concealed = options?.concealed;
    if (this.concealed) {
      this.cannotBeSnooped = true;
    }
    this.cannotBeStolen = true;
  }

  hold(player) {
    let tempApp = {
      death: this.type,
      reveal: this.type,
      investigate: this.type,
      condemn: this.type,
    };
    player.role.editAppearance(tempApp);
    player.role.hideModifier = {
      death: true,
      reveal: true,
      investigate: true,
      condemn: true,
    };

    super.hold(player);
  }

  get snoopName() {
    return `Suit (${this.type})`;
  }
};
