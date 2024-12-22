const Information = require("../Information");
const Random = require("../../../../lib/Random");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class RoleInfo extends Information {
  constructor(creator, game, target, investType) {
    super("Role Info", creator, game);
    if (investType == null) {
      investType = "investigate";
    }
    this.investType = investType;
    if (target == null) {
      this.randomTarget = true;
      target = Random.randArrayVal(this.game.alivePlayers());
    }
    this.target = target;

    this.targetRole = target.getRoleAppearance(this.investType, true);

    let role = target.getRoleAppearance(this.investType);
    let trueRole = this.game.formatRoleInternal(
      target.role.name,
      target.role.modifier
    );
    this.trueRole = this.game.formatRole(trueRole);
    this.mainInfo = role;

    //this.game.queueAlert(`:invest: Main ${this.mainInfo} Invest ${target.getRoleAppearance("investigate")} Real ${this.trueRole}.`);
  }

  getInfoRaw() {
    super.getInfoRaw();
    return this.mainInfo;
  }

  getInfoFormated() {
    super.getInfoRaw();
    return `You Learn that your ${this.target.name}'s Role is ${this.mainInfo}`;
    //return `You Learn that your Target's Role is ${this.mainInfo}`
  }

  isTrue() {
    if (this.trueRole == this.mainInfo) {
      return true;
    } else {
      return false;
    }
  }
  isFalse() {
    if (this.trueRole != this.mainInfo) {
      return true;
    } else {
      return false;
    }
  }
  isFavorable() {
    if (
      this.game.getRoleAlignment(this.targetRole) == this.creator.alignment ||
      (this.isEvil(this.creator) && this.mainInfo == "Villager")
    ) {
      return true;
    } else {
      return false;
    }
  }
  isUnfavorable() {
    if (
      this.game.getRoleAlignment(this.targetRole) == this.creator.role.alignment
    ) {
      return false;
    } else {
      return true;
    }
  }

  makeTrue() {
    this.mainInfo = this.trueRole;
    this.targetRole = this.target.role.name;
  }
  makeFalse() {
    if (!this.game.setup.closed) {
      let randomPlayers = Random.randomizeArray(
        this.game.players.filter(
          (p) =>
            p != this.creator &&
            p != this.target &&
            !this.game.getRoleTags(p.role.name).includes("No Investigate") &&
            !this.game.getRoleTags(p.role.name).includes("Exposed")
        )
      );
      if (randomPlayers.length <= 0) {
        randomPlayers = Random.randomizeArray(this.game.players);
      }
      for (let player of randomPlayers) {
        if (player.getRoleAppearance(this.investType) != this.trueRole) {
          this.mainInfo = player.getRoleAppearance(this.investType);
          this.targetRole = player.getRoleAppearance(this.investType, true);
          return;
        }
      }
    }
    let roles = this.game.PossibleRoles.filter(
      (r) =>
        r !=
          this.game.formatRoleInternal(
            this.target.role.name,
            this.target.role.modifier
          ) &&
        !this.game.getRoleTags(r).includes("No Investigate") &&
        !this.game.getRoleTags(r).includes("Exposed")
    );
    roles = Random.randomizeArray(roles);
    this.mainInfo = this.game.formatRole(roles[0]);
    this.targetRole = roles[0].split(":")[0];
  }
  makeFavorable() {
    if (this.isEvil(this.creator.faction)) {
      let villagers = this.game.players.filter(
        (p) => p.role.name == "Villager"
      );
      if (villagers.length > 1) {
        this.mainInfo = "Villager";
        this.targetRole = "Villager";
        return;
      }
    }

    if (!this.game.setup.closed) {
      let randomPlayers = Random.randomizeArray(
        this.game.players.filter(
          (p) =>
            p != this.creator &&
            p.role.alignment == this.creator.alignment &&
            !this.game.getRoleTags(p.role.name).includes("No Investigate") &&
            !this.game.getRoleTags(p.role.name).includes("Exposed")
        )
      );
      if (randomPlayers.length <= 0) {
        randomPlayers = Random.randomizeArray(
          this.game.players.filter(
            (p) => p.role.alignment == this.creator.alignment
          )
        );
      }
      if (randomPlayers.length)
        for (let player of randomPlayers) {
          if (
            this.game.getRoleAlignment(
              player.getRoleAppearance(this.investType, true)
            ) == this.creator.role.alignment
          ) {
            this.mainInfo = player.getRoleAppearance(this.investType);
            this.targetRole = player.getRoleAppearance(this.investType, true);
            return;
          }
        }
    }

    let roles = this.game.PossibleRoles.filter(
      (r) =>
        this.game.getRoleAlignment(r) ==
          this.game.getRoleAlignment(
            this.game.formatRoleInternal(
              this.creator.role.name,
              this.creator.role.modifier
            )
          ) &&
        !this.game.getRoleTags(r).includes("No Investigate") &&
        !this.game.getRoleTags(r).includes("Exposed")
    );
    roles = Random.randomizeArray(roles);
    this.mainInfo = this.game.formatRole(roles[0]);
    this.targetRole = roles[0].split(":")[0];
  }
  makeUnfavorable() {
    if (!this.game.setup.closed) {
      let randomPlayers = Random.randomizeArray(
        this.game.players.filter(
          (p) =>
            p != this.creator &&
            p.role.alignment != this.creator.role.alignment &&
            !this.game.getRoleTags(p.role.name).includes("No Investigate") &&
            !this.game.getRoleTags(p.role.name).includes("Exposed")
        )
      );
      if (randomPlayers.length <= 0) {
        randomPlayers = Random.randomizeArray(
          this.game.players.filter(
            (p) => p.role.alignment != this.creator.role.alignment
          )
        );
      }
      for (let player of randomPlayers) {
        if (
          this.game.getRoleAlignment(
            player.getRoleAppearance(this.investType, true)
          ) != this.creator.role.alignment
        ) {
          this.mainInfo = player.getRoleAppearance(this.investType);
          this.targetRole = player.getRoleAppearance(this.investType, true);
          return;
        }
      }
    }

    let roles = this.game.PossibleRoles.filter(
      (r) =>
        this.game.getRoleAlignment(r) !=
          this.game.getRoleAlignment(
            this.game.formatRoleInternal(
              this.creator.role.name,
              this.creator.role.modifier
            )
          ) &&
        !this.game.getRoleTags(r).includes("No Investigate") &&
        !this.game.getRoleTags(r).includes("Exposed")
    );
    roles = Random.randomizeArray(roles);
    this.mainInfo = this.game.formatRole(roles[0]);
    this.targetRole = roles[0].split(":")[0];
  }
};
