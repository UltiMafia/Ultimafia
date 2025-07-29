const Role = require("../../core/Role");
const MafiaAction = require("./Action");
const roleData = require("../../../data/roles");

module.exports = class MafiaRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);

    this.Action = MafiaAction;
    this.VotePower = 1;
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

  getAllRoles(){
    if(this.game.getRoleTags(this.game.formatRoleInternal(this.name, this.modifier)).includes("Excessive") && !this.player.hasEffect("NoModifiers")){
      let AllRoles = Object.entries(roleData.Mafia).filter((m) => m[1].alignment != "Event").map((r) => r[0]);
      return AllRoles.concat(this.game.PossibleRoles);
    }
    else{
      return this.game.PossibleRoles;
    }
  }

  editAppearance(newAppearance, newAppearanceMods) {
    let oldAppearance = {
      self: this.appearance["self"],
      reveal: this.appearance["reveal"],
      condemn: this.appearance["condemn"],
      death: this.appearance["death"],
      investigate: this.appearance["investigate"],
    };
    let oldAppearanceMods = this.appearanceMods;
    if (newAppearance != null) {
      this.appearance = {
        self:
          newAppearance["self"] != null
            ? newAppearance["self"]
            : oldAppearance["self"],
        reveal:
          newAppearance["reveal"] != null
            ? newAppearance["reveal"]
            : oldAppearance["reveal"],
        condemn:
          newAppearance["condemn"] != null
            ? newAppearance["condemn"]
            : oldAppearance["condemn"],
        death:
          newAppearance["death"] != null
            ? newAppearance["death"]
            : oldAppearance["death"],
        investigate:
          newAppearance["investigate"] != null
            ? newAppearance["investigate"]
            : oldAppearance["investigate"],
      };
    }
    if (newAppearanceMods != null) {
      this.appearanceMods = {
        self:
          newAppearanceMods["self"] != null
            ? newAppearanceMods["self"]
            : oldAppearanceMods["self"],
        reveal:
          newAppearanceMods["reveal"] != null
            ? newAppearanceMods["reveal"]
            : oldAppearanceMods["reveal"],
        condemn:
          newAppearanceMods["condemn"] != null
            ? newAppearanceMods["condemn"]
            : oldAppearanceMods["condemn"],
        death:
          newAppearanceMods["death"] != null
            ? newAppearanceMods["death"]
            : oldAppearanceMods["death"],
        investigate:
          newAppearanceMods["investigate"] != null
            ? newAppearanceMods["investigate"]
            : oldAppearanceMods["investigate"],
      };
    }
  }

  getRevealText(roleName, modifiers, revealType) {
    if (
      (revealType == "death" ||
        revealType == "condemn" ||
        revealType == "self") &&
      this.game.formatRoleInternal(roleName, modifiers) ==
        this.game.formatRoleInternal(this.name, this.modifier)
    ) {
      if (this.player.faction != this.alignment) {
        if (modifiers == null || modifiers == "" || modifiers == undefined) {
          return `${roleName} [${this.player.faction}-Aligned]`;
        }
        return `${roleName}${modifiers ? ` (${modifiers})` : ""} [${
          this.player.faction
        }-Aligned]`;
      }
    }
    if (modifiers == null || modifiers == "" || modifiers == undefined) {
      return `${roleName}`;
    }
    return `${roleName}${modifiers ? ` (${modifiers})` : ""}`;
  }
};
