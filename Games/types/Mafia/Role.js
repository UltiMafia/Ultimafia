const Role = require("../../core/Role");
const MafiaAction = require("./Action");
const Random = require("../../../lib/Random");
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
      this.modifier &&
      this.modifier.split("/").includes("Excessive") &&
      !this.player.hasEffect("NoModifiers")
    ) {
      let AllRoles = Object.entries(roleData.Mafia)
        .filter((m) => m[1].alignment != "Event" && !m[0].includes("Banished"))
        .map((r) => r[0]);
      return AllRoles.concat(this.game.PossibleRoles);
    } else if (
      this.modifier &&
      this.modifier.split("/").includes("Austere") &&
      !this.player.hasEffect("NoModifiers")
    ) {
      let AllRoles = [];
      for (let player of Random.randomizeArray(this.game.players)) {
        if (player.role != null && player.role.name != null) {
          if (player.role.modifier) {
            AllRoles.push(`${player.role.name}:${player.role.modifier}`);
          } else {
            AllRoles.push(`${player.role.name}:`);
          }
        }
      }
      if (AllRoles.length < this.game.players.length) {
        for (let r of Random.randomizeArray(this.game.StartingRoleset)) {
          AllRoles.push(r);
        }
      }
      AllRoles = Random.randomizeArray(AllRoles);
      if (AllRoles.length <= 0) {
        return this.game.PossibleRoles;
      }
      return AllRoles;
    } else {
      return this.game.PossibleRoles;
    }
  }

  getEvents() {
    let events = this.game.CurrentEvents.filter((r) => r);
    let banishedEvents = this.game.BanishedEvents.filter((r) => r);
    if (this.modifier && this.modifier.split("/").includes("Excessive")) {
      let AllRoles = Object.entries(roleData.Mafia)
        .filter((m) => m[1].alignment == "Event")
        .map((r) => r[0]);
      events = events.concat(AllRoles);
    }
    if (this.modifier && this.modifier.split("/").includes("Unrefined")) {
      events = banishedEvents;
    } else if (this.modifier && this.modifier.split("/").includes("Refined")) {
    } else {
      events;
      for (let event of banishedEvents) {
        events.push(event);
      }
    }
    if (events.length <= 0) {
      events.push(this.game.GameEndEvent);
    }
    return events;
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
      this.isTelevangelistExtra == true &&
      types.includes("Information") != true
    ) {
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
    let playerAlignment = player.role.alignment;
    let playerDemonic = player.isDemonic(true);
    let playerBanished = player.role.data.banished == true;
    let playerVanilla = this.isVanilla(player);
    if (player.hasEffect("Misregistration")) {
      playerAlignment = this.game.getRoleAlignment(
        player.getRoleAppearance().split(" (")[0]
      );
      playerDemonic = player.isDemonic(false);
      playerBanished =
        player.getRoleAppearance().split(" (")[1] &&
        player.getRoleAppearance().split(" (")[1].includes("Banished");
      playerVanilla = this.isAppearanceVanilla(player);
    }
    if (this.modifier != null) {
      if (
        this.modifier.split("/").includes("Loyal") &&
        playerAlignment != this.alignment
      ) {
        return false;
      } else if (
        this.modifier.split("/").includes("Disloyal") &&
        playerAlignment == this.alignment
      ) {
        return false;
      }
      if (this.modifier.split("/").includes("Holy") && playerDemonic) {
        return false;
      } else if (
        this.modifier.split("/").includes("Unholy") &&
        !playerDemonic
      ) {
        return false;
      }
      if (this.modifier.split("/").includes("Refined") && playerBanished) {
        return false;
      } else if (
        this.modifier.split("/").includes("Unrefined") &&
        !playerBanished
      ) {
        return false;
      }
      if (this.modifier.split("/").includes("Simple") && !playerVanilla) {
        return false;
      } else if (
        this.modifier.split("/").includes("Complex") &&
        playerVanilla
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

  isAppearanceVanilla(player) {
    if (
      player.getRoleAppearance().split(" (")[0] == "Villager" ||
      player.getRoleAppearance().split(" (")[0] == "Mafioso" ||
      player.getRoleAppearance().split(" (")[0] == "Cultist" ||
      player.getRoleAppearance().split(" (")[0] == "Grouch"
    ) {
      return true;
    }
    return false;
  }

  giveEffect(player, effectName, ...args) {
    if (!player) {
      player = this.player;
    }
    let effect = player.giveEffect(effectName, ...args);
    effect.source = this;
    return effect;
  }

  canDoSpecialInteractions() {
    if (this.modifier.split("/").includes("Bland")) {
      return false;
    }
    return true;
  }
};
