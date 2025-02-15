const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class PreventFactionJoints extends Card {
  constructor(role) {
    super(role);

    this.startEffects = ["Braggadocious"];
  }
};
