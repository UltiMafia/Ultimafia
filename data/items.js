const modifierData = {
  Mafia: {
    //Killing
    Gun: {
      internal: ["Gun"],
      tags: ["Day Killer"],
      description: "Can be shot once during the day to kill a specific player.",
    },
    Rifle: {
      internal: ["Rifle"],
      tags: ["Day Killer", "alignment"],
      description:
        "Can be shot once during the day to kill a specific player. If target shares alignment with shooter, shooter will die too. If target is of an opposing alignment, shooter gains another rifle. Otherwise, nothing happens.",
    },
    Knife: {
      internal: ["Knife"],
      tags: ["Day Killer", "Bleeding"],
      description:
        "Can be used once during the day to stab a specific player, who will bleed out and die the following night.",
    },
    Stake: {
      internal: ["Stake"],
      tags: ["Day Killer", "alignment"],
      description:
        "Can be used once during the day to stab a specific player, That player will die if evil",
    },
    //Reflexive/Protective
    Armor: {
      internal: ["Armor"],
      tags: ["Armor"],
      description:
        "Saves a player from being killed one time, not including being condemned.",
    },
    Key: {
      internal: ["Key"],
      tags: ["Role Blocker"],
      description:
        "Can be used once during the night to make the player untargetable. All actions on the player are cancelled.",
    },
    Tract: {
      internal: ["Tract"],
      tags: ["Tract"],
      description: "Saves a player from being converted one time",
    },
    Bomb: {
      internal: ["Bomb"],
      tags: ["Night Killer"],
      description:
        "When a player is killed while holding a bomb, the player who killed them will also die.",
    },
    Shield: {
      internal: ["Armor"],
      tags: ["Armor"],
      description:
        "Can be used at night to redirect kill targeting the holder on to a random player of the same alignment if possible",
    },
    "Crystal Ball": {
      internal: ["CrystalBall"],
      tags: ["Reveal"],
      description:
        "The holder of the crystal ball can choose a person each night and if they die, their target's role will be revealed.",
    },
    //Info
    Candle: {
      internal: ["Candle"],
      tags: ["Visits"],
      description: "Allows the holder to see all their visitors at night.",
    },
    Falcon: {
      internal: ["Falcon"],
      tags: ["Visits"],
      description: "Can be used to track another player during the night.",
    },
    Envelope: {
      internal: ["Envelope"],
      tags: ["Message"],
      description:
        "Can be used at night to send an anonymous letter to another player.",
    },
    //Other Town Items
    Syringe: {
      internal: ["Syringe"],
      tags: ["Revive"],
      description:
        "Can be shot once during the day to resurrect a specific player.",
    },
    Sceptre: {
      internal: ["Sceptre"],
      tags: ["Voting"],
      description:
        "Can be used to overrides other voters and determine the condemnation.",
    },
    Whiskey: {
      internal: ["Whiskey"],
      tags: ["RoleBlock"],
      description:
        "Can be used once during the day on a specific player, who will be roleblocked the following night.",
    },
    Bread: {
      internal: ["Bread"],
      tags: ["Famine"],
      description: "Counts as 1 ration for each phase in a famine.",
    },
    "Yuzu Orange": {
      internal: ["Orange"],
      tags: ["Famine", "Meeting"],
      description:
        "Given out by the Capybara to invite players to relax at the hot springs. Counts as 1 ration for each phase in a famine.",
    },
    Coffee: {
      internal: ["Coffee"],
      tags: ["actions"],
      description:
        "Can be used at night to use role abilities an additional time.",
    },
    //Non Town Items
    Suit: {
      internal: ["Suit"],
      tags: ["Deception"],
      description:
        "A suit determines what role a user will appear as once dead.",
    },
    Match: {
      internal: ["Match"],
      tags: ["Killing"],
      description: "Can be used to ignite everyone doused with gasoline.",
    },
    Timebomb: {
      internal: ["Timebomb"],
      tags: ["Killing"],
      description:
        "Players pass the timebomb around during the day. The timebomb will randomly explode between 10 and 30 seconds and kill the person holding the bomb.",
    },
    Revolver: {
      internal: ["Revolver"],
      tags: ["Killing"],
      description:
        "One chamber of 6 chambers has a bullet. Players must shoot or spin and shoot the revolver. Spinning will randomize which chamber the gun is on. Shooting an empty chamber passes the Revolver to player below them on the list.",
    },
    Sockpuppet: {
      internal: ["Sockpuppet"],
      tags: ["Message"],
      description:
        "Can be used to fake a message from a player of your choice.",
    },
    Kite: {
      internal: ["Kite"],
      tags: ["Killing", "alignment"],
      description:
        "Can be used to kill a random player who shares an alignment with the Holder.",
    },
    "Shaving Cream": {
      internal: ["ShavingCream"],
      tags: ["Conversion"],
      description:
        "Can be used at night to switch two players roles, Their alignments will not change.",
    },
    "Fishing Rod": {
      internal: ["FishingRod"],
      tags: ["Fishing"],
      description: "Can be used to Fish instead of playing mafia.",
    },
    Snowball: {
      internal: ["Snowball"],
      tags: ["Conversion"],
      description:
        "Can be used once during the day on a specific player, who will be roleblocked and unable to vote until visited.",
    },

    //Win Con Items
    "Four-leaf Clover": {
      internal: ["Clover"],
      tags: ["Win Con"],
      description: "If a Leprechaun has 3 or more Four Leaf Clovers they Win.",
    },
    Doll: {
      internal: ["Doll"],
      tags: ["Win Con"],
      description:
        "Can be passed around at night, If the player holding the doll dies, Creepy Girl wins.",
    },
  },
  Resistance: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Wacky Words": {},
  "Liars Dice": {
    Gun: {
      internal: ["Gun"],
      tags: ["Dice Remover"],
      description:
        "Can be shot once during the day to make a player lose a dice.",
    },
  },
  "Texas Hold Em": {},
  Cheat: {},
  "Connect Four": {},
};

module.exports = modifierData;
