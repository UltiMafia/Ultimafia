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

  getAllRoles() {
    if (
      this.game
        .getRoleTags(this.game.formatRoleInternal(this.name, this.modifier))
        .includes("Excessive") &&
      !this.player.hasEffect("NoModifiers")
    ) {
      let AllRoles = Object.entries(roleData.Mafia)
        .filter((m) => m[1].alignment != "Event")
        .map((r) => r[0]);
      return AllRoles.concat(this.game.PossibleRoles);
    } else if (
      this.game
        .getRoleTags(this.game.formatRoleInternal(this.name, this.modifier))
        .includes("Austere") &&
      !this.player.hasEffect("NoModifiers")
    ) {
      let AllRoles = [];
      for (let player of this.game.players) {
        if(player.role && player.role.name){
        AllRoles.push(`${player.role.name}:${player.role.modifier}`);
        }
      }
      if(AllRoles.length <= this.game.players.length){
        AllRoles.push(...this.game.StartingRoleset);
      }
      if (AllRoles.length <= 0) {
        return this.game.PossibleRoles;
      }
      return AllRoles;
    } else {
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

  hasAbility(types) {
    if (types == null) {
      types = [];
    }
    let isRestless =
      this.game
        .getRoleTags(this.game.formatRoleInternal(this.name, this.modifier))
        .includes("Restless") && !this.player.hasEffect("NoModifiers");
    if (!isRestless) {
      isRestless =
        this.game
          .getRoleTags(this.game.formatRoleInternal(this.name, this.modifier))
          .includes("Vengeful") &&
        !this.player.hasEffect("NoModifiers") &&
        this.HasBeenNightKilled == true;
    }
    let isTransendant =
      this.game
        .getRoleTags(this.game.formatRoleInternal(this.name, this.modifier))
        .includes("Transcendent") && !this.player.hasEffect("NoModifiers");
    let isRetired =
      this.game
        .getRoleTags(this.game.formatRoleInternal(this.name, this.modifier))
        .includes("Retired") && !this.player.hasEffect("NoModifiers");
    if (this.player.exorcised == true) {
      return false;
    }
    if (this.player.hasEffect("BackUp") && !types.includes("Modifier")) {
      return false;
    }
    if (isRetired == true && !types.includes("Modifier")) {
      return false;
    }
    if (types.includes("OnlyWhenDead") && this.player.alive == true) {
      return false;
    }
    if (types.includes("OnlyWhenAlive") && this.player.alive == false) {
      return false;
    }
    if (this.player.isDelirious() && types.includes("Information") != true) {
      return false;
    }
    if (
      this.player.alive == false &&
      types.includes("OnlyWhenDead") != true &&
      types.includes("WhenDead") != true &&
      isRestless != true &&
      isTransendant != true
    ) {
      return false;
    }
    if (this.player.alive == true && isRestless == true) {
      return false;
    }
    if (types.includes("Modifier") && this.player.hasEffect("NoModifiers")) {
      return false;
    }

    return true;
  }

  canTargetPlayer(player) {
    if (this.modifier != null) {
      if (
        this.modifier.split("/").includes("Loyal") &&
        player.role.alignment != this.alignment
      ) {
        return false;
      } else if (
        this.modifier.split("/").includes("Disloyal") &&
        player.role.alignment == this.alignment
      ) {
        return false;
      }
      if (this.modifier.split("/").includes("Holy") && player.isDemonic(true)) {
        return false;
      } else if (
        this.modifier.split("/").includes("Unholy") &&
        !player.isDemonic(true)
      ) {
        return false;
      }
      if (
        this.modifier.split("/").includes("Refined") &&
        player.role.data.banished == true
      ) {
        return false;
      } else if (
        this.modifier.split("/").includes("Unrefined") &&
        player.role.data.banished != true
      ) {
        return false;
      }
      if (
        this.modifier.split("/").includes("Simple") &&
        !this.isVanilla(player)
      ) {
        return false;
      } else if (
        this.modifier.split("/").includes("Complex") &&
        this.isVanilla(player)
      ) {
        return false;
      }
    }
    return true;
  }

  isVanilla(player) {
    if (
      player.role.name == "Villager" ||
      player.role.name == "Mafioso" ||
      player.role.name == "Cultist" ||
      player.role.name == "Grouch"
    ) {
      return true;
    }
    return false;
  }
};
