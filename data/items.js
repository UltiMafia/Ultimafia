//Common Tag is for any item that can be used by Santa, Fab, exc.
//Party is for
const modifierData = {
  Mafia: {
    //Killing
    Gun: {
      internal: ["Gun"],
      tags: ["Day Killer", "Common"],
      description:
        "A Gun can be used during the day to kill a player.",
    },
    Rifle: {
      internal: ["Rifle"],
      tags: ["Day Killer", "Alignment", "Common"],
      description: `A Rifle can be used during the day to kill a player. If a Rifle kills a player of same alignment as its holder, its holder dies. If a "Rifle" kills a player of different alignment to its holder, its holder is given a Rifle at the end of the day.`,
    },
    Knife: {
      internal: ["Knife"],
      tags: ["Day Killer", "Bleeding", "Common"],
      description: `A Knife can be used during the day to make a player start "Bleeding".`,
    },
    //Reflexive/Protective
    Armor: {
      internal: ["Armor"],
      tags: ["Armor", "Common"],
      description: `Armor will protect its holder from one attack.`,
    },
    Key: {
      internal: ["Key"],
      tags: ["Role Blocker", "Common"],
      description: `A Key can be used at night to block the actions of anyone visits its holder.`,
    },
    Tract: {
      internal: ["Tract"],
      tags: ["Tract", "Common"],
      description: `A Tract will prevent its holder from being converted one time.`,
    },
    Bomb: {
      internal: ["Bomb"],
      tags: ["Night Killer", "Common"],
      description: `If a Bomb's holder is killed, their killer is killed.`,
    },
    Shield: {
      internal: ["Shield"],
      tags: ["Shield", "Common"],
      description: `If possible, A Shield will protect its holder from one attack by redirecting it to another player who is not the attacker.`,
    },
    "Crystal Ball": {
      internal: ["CrystalBall"],
      tags: ["Reveal", "Common"],
      description: `Crystal Ball allows its holder to select a player each night. If the holder dies, the last selected player will be revealed.`,
    },
    //Info
    Candle: {
      internal: ["Candle"],
      tags: ["Visits", "Common"],
      description: `A Candle will tell its holder who visited them during the night.`,
    },
    Falcon: {
      internal: ["Falcon"],
      tags: ["Visits", "Common"],
      description: `A Falcon can be used at night to learn who a player visits.`,
    },
    Envelope: {
      internal: ["Envelope"],
      tags: ["Message", "Common"],
      description: `An Envelope can be used at anytime to send a message to a player.`,
    },
    //Other Town Items
    Syringe: {
      internal: ["Syringe"],
      tags: ["Revive", "Common"],
      description: `A Syringe can be used during the day to revive a dead player.`,
    },
    Sceptre: {
      internal: ["Sceptre"],
      tags: ["Voting", "Common"],
      description: `A Sceptre can be used during the day to gain 10000 voting power.`,
    },
    Whiskey: {
      internal: ["Whiskey"],
      tags: ["RoleBlock", "Common"],
      description: `Whiskey can be used during the day to block a player's actions next night.`,
    },
    Bread: {
      internal: ["Bread"],
      tags: ["Famine", "Common"],
      description: `Bread is consumed during a famine to prevent death.`,
    },
    Food: {
      internal: ["Food"],
      tags: ["Famine", "Common"],
      description: `Food is consumed during a famine to prevent death.`,
    },
    "Yuzu Orange": {
      internal: ["Orange"],
      tags: ["Famine", "Meeting", "Common"],
      description: `An Orange can be used during the day to meet with Capybaras at night. When meeting with Capybaras no night actions can be performed.`,
    },
    Coffee: {
      internal: ["Coffee"],
      tags: ["Common"],
      description: `Coffee can be used at night to perform their role's actions an additional time.`,
    },
    "Jack-In-The-Box": {
      internal: ["JackInTheBox"],
      tags: ["Banished Interaction", "Common"],
      description: `A Jack-In-The-Box can be used at night to gain the abilites of a Village-aligned Banished role until the next night.`,
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
      description: `A Timebomb can be passed around during the day, it will explode after 10-30 seconds.`,
    },
    Revolver: {
      internal: ["Revolver"],
      tags: ["Killing"],
      description: `A Revolver has 6 chambers one of which has full. A Revolver must be used during the day to fire the selected chamber or a random chamber. Then pass it to another player if the chamber was empty or die if the chamber was full.`,
    },
    Sockpuppet: {
      internal: ["Sockpuppet"],
      tags: ["Message"],
      description:
        "Can be used to fake a message from a player of your choice.",
    },
    Kite: {
      internal: ["Kite"],
      tags: ["Killing", "Alignment"],
      description:
        "Can be used to kill a random player who shares an alignment with the Holder.",
    },
    "Haunted Mask": {
      internal: ["HauntedMask"],
      tags: ["Protection"],
      description:
        "A Haunted Mask will protect its holder from one attack and kill the attacker. The holder will then and steal the attacker's identity.",
    },
    "Shaving Cream": {
      internal: ["ShavingCream"],
      tags: ["Conversion"],
      description: `Shaving Cream can be used at night to make two selected players swap roles but not alignments. A switch fails if one of the players is an Independent role.`,
    },
    "Fishing Rod": {
      internal: ["FishingRod"],
      tags: ["Fishing"],
      description: "Can be used to Fish instead of playing mafia.",
    },
    Snowball: {
      internal: ["Snowball"],
      tags: ["Conversion"],
      description: `Snowballs can be used during the day to make a player "Frozen".`,
    },
    "Ice Cream": {
      internal: ["IceCream"],
      tags: ["Vanilla"],
      description:
        "Can be used at night to become the Vanilla role from their alignment.",
    },

    //Host Items?
    "Poll Ballot": {
      internal: ["PollBallot"],
      tags: ["Conversion"],
      description: "Can be used to vote in poll hosted by the Host.",
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
  Ratscrew: {},
  "Connect Four": {},
};

module.exports = modifierData;
