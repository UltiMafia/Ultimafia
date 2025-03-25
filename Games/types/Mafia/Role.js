const Role = require("../../core/Role");
const MafiaAction = require("./Action");

module.exports = class MafiaRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);

    this.Action = MafiaAction;


    this.appearance = {
      self: "real",
      reveal: "real",
      condemn: "real",
      death: "real",
      investigate: "real",
    };
    this.appearanceMods = {
      self: "real",
      reveal: "real",
      condemn: "real",
      death: "real",
      investigate: "real",
    };
  }


  getRevealText(roleName, modifiers, revealType) {
    if((revealType == "death" || revealType == "condemn" || revealType == "self") &&
    this.game.formatRoleInternal(roleName, modifiers) == this.game.formatRoleInternal(this.name, this.modifier)){
      if(this.player.faction != this.alignment){

      if (modifiers == null || modifiers == "" || modifiers == undefined) {
      return `${roleName} [${this.player.faction}-Aligned]`;
      }
      return `${roleName}${modifiers ? ` (${modifiers})` : ""} [${this.player.faction}-Aligned]`;
      } 
    }
    if (modifiers == null || modifiers == "" || modifiers == undefined) {
      return `${roleName}`;
    }
    return `${roleName}${modifiers ? ` (${modifiers})` : ""}`;
  }


};
