const roleData = {
  Mafia: {
    //Village

    //basic roles
    Villager: {
      alignment: "Village",
      description: [
        "Wins when no Mafia, Cult, or Hostiles remain.",
        "Other roles appear as Villager to investigative roles, upon death, and to themself.",
      ],
    },
    Celebrity: {
      alignment: "Village",
      description: [
        "Identity is publicly revealed to all players at the start of the game.",
      ],
    },
    Deputy: {
      alignment: "Village",
      description: [
        "Starts with a gun.",
        "This gun never reveals the deputy when shot.",
      ],
    },
    Miller: {
      alignment: "Village",
      description: [
        "Appears as Villager to self.",
        "Appears as Mafioso to investigative roles.",
        "Appears as Mafioso upon being condemned.",
        "Appears as Miller upon being killed.",
      ],
    },
    Occultist: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "Appears as Villager to self.",
        "Appears as Cultist to investigative roles.",
        "Appears as Cultist upon being condemned.",
        "Appears as Occultist upon being killed.",
      ],
    },
    Sheriff: {
      alignment: "Village",
      description: [
        "Starts with a gun.",
        "This gun always reveals the sheriff when shot.",
      ],
    },
    //protective roles
    Doctor: {
      alignment: "Village",
      recentlyUpdated: true,
      description: ["Saves another player from dying each night."],
    },
    Medic: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "Visits two players each night.",
        "If the first person is targeted for a night kill and dies, the second person gains an extra life.",
      ],
    },
    Nurse: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "Visits one player each night and cleanses them of effects (eg. bleeding, poison, insanity).",
      ],
    },
    //crafting roles
    Blacksmith: {
      alignment: "Village",
      description: [
        "Gives out armor to one player each night.",
        "Armor blocks a single attack.",
      ],
    },
    Funsmith: {
      alignment: "Village",
      description: [
        "Gives out a gun each night.",
        "Gives out a gun to all visitors at night.",
      ],
    },
    Gunsmith: {
      alignment: "Village",
      description: ["Gives out a gun each night."],
    },
    //investigatory roles
    Bloodhound: {
      alignment: "Village",
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    Cop: {
      alignment: "Village",
      description: [
        "Investigates one player each night and learns their alignment.",
        "Some other roles appear as Cop to themself.",
      ],
    },
    "Insane Cop": {
      alignment: "Village",
      description: [
        "Investigates one player each night and learns their alignment (alignment will be reversed).",
        "Appears as normal cop upon death.",
      ],
    },
    "Naive Cop": {
      alignment: "Village",
      description: [
        "Investigates one player each night and learns their alignment (alignments will always appear innocent).",
        "Appears as normal cop upon death.",
      ],
    },
    "Paranoid Cop": {
      alignment: "Village",
      description: [
        "Investigates one player each night and learns their alignment (alignments will always appear guilty).",
        "Appears as normal cop upon death.",
      ],
    },
    "Confused Cop": {
      alignment: "Village",
      description: [
        "Investigates one player each night and learns their alignment (alignments will always be random).",
        "Appears as normal cop upon death.",
      ],
    },
    Detective: {
      alignment: "Village",
      description: [
        "Investigates one player each night and learns their role.",
      ],
    },
    Tracker: {
      alignment: "Village",
      description: ["Tracks a player each night and learns who they visited."],
    },
    Voyeur: {
      alignment: "Village",
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
    },
    Watcher: {
      alignment: "Village",
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
    },
    Witness: {
      alignment: "Village",
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
    },
    //night-acting roles
    Drunk: {
      alignment: "Village",
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Neighbor: {
      alignment: "Village",
      description: [
        "Chooses a player each night to reveal their identity as neighbor.",
      ],
    },
    Oracle: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "Visits one player each night whose role will be revealed upon death.",
      ],
    },
    //sacrificial roles
    Hunter: {
      alignment: "Village",
      description: [
        "Chooses a player to kill when condemned by town during the day.",
      ],
    },
    //voting roles
    Governor: {
      alignment: "Village",
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation.",
        "Choosing no one or the original target preserves the Governor's override ability.",
      ],
    },
    //redirecting roles
    Monkey: {
      alignment: "Village",
      description: [
        "Copies the actions of a player and performs them on another player each night.",
      ],
    },
    //meeting roles
    Capybara: {
      alignment: "Village",
      description: [
        "Chooses a player to invite to a hot springs relaxation by giving them a Yuzu Orange each night.",
        "When holding a Yuzu Orange, player can choose during the day to anonymously meet with the Capybara and other Yuzu Orange holders the following night.",
        "Multiple Capybaras share a night meeting.",
      ],
    },
    Freemason: {
      alignment: "Village",
      description: [
        "Converts one player into a Freemason each night.",
        "Shares a night meeting with other Freemasons.",
        "All Freemasons die if they attempt to convert a member of the Mafia.",
        "Attempting to convert a Whig into a Freemason will fail.",
        "All Cultists die if targeted by a Freemason meeting.",
      ],
    },
    Templar: {
      alignment: "Village",
      description: ["Shares a night meeting with other Templars."],
    },
    //reflexive roles
    Apothecary: {
      alignment: "Village",
      newlyAdded: true,
      description: [
        "When visited, cleanses all effects currently possessed by the visiting player.",
      ],
    },
    Priest: {
      alignment: "Village",
      recentlyUpdated: true,
      description: ["Learns the roles of those who visited them."],
    },
    //killing roles
    Granny: {
      alignment: "Village",
      description: [
        "Kills all players who visit during the night.",
        "Cannot be killed or converted at night.",
        "Can only be killed by village condemnation.",
      ],
    },
    Jailer: {
      alignment: "Village",
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
    },
    Seeker: {
      alignment: "Village",
      description: [
        "Attempts to guess the identity of the Hider each night.",
        "Kills the Hider if guess is correct.",
      ],
    },
    Vigilante: {
      alignment: "Village",
      description: ["Kills one player each night."],
    },
    //speaking roles
    Agent: {
      alignment: "Village",
      description: [
        "Can anonymously contact any non-Village role during the day.",
      ],
    },
    "Town Crier": {
      alignment: "Village",
      description: ["Can anonymously broadcast messages during the day."],
    },
    //unsorted
    Surgeon: {
      alignment: "Village",
      description: [
        "Each night, operates on one player to prevent them from dying or being converted.",
        "If attacked, kills one of their killers",
      ],
    },
    Commuter: {
      alignment: "Village",
      description: [
        "Blocks all visitors during the night from performing any actions.",
      ],
    },
    Caroler: {
      alignment: "Village",
      description: [
        "Sings a carol to a player about 3 people, at least one of whom is Mafia, Cult, or Hostile.",
        "The carol is not heard if the player chosen visits at night.",
        "Cannot choose same the player consecutively.",
      ],
    },
    Dreamer: {
      alignment: "Village",
      description: [
        "Dreams about 3 people, at least one of whom is Mafia, Cult, or Hostile; or about 1 player who is Village aligned.",
        "Does not dream if visited at night.",
      ],
    },
    Chef: {
      alignment: "Village",
      description: [
        "Chooses two players during the day to attend a banquet the following evening.",
        "Players chosen to attend the banquet meet anonymously with their roles revealed to one another.",
      ],
    },
    Journalist: {
      alignment: "Village",
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
    },
    Cutler: {
      alignment: "Village",
      description: [
        "Gives out a knife each night.",
        "Knives can be used to attack a player during the day and will result in that players death the following day.",
      ],
    },
    Pharmacist: {
      alignment: "Village",
      description: [
        "Gives out a bottle of whiskey each night.",
        "Whiskey can be passed to a player during the day and will block their actions the following night.",
      ],
    },
    Snoop: {
      alignment: "Village",
      description: [
        "Visits a player each night and learns what items they are carrying.",
      ],
    },
    Justice: {
      alignment: "Village",
      description: [
        "Investigates two players at night and learns if they share an alignment.",
      ],
    },
    "Invisible Man": {
      alignment: "Village",
      description: [
        "Chooses one player during the day to follow at night.",
        "Views all messages from that player's meetings that night.",
      ],
    },
    Chauffeur: {
      alignment: "Village",
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be role blocked.",
        "Dies if visited by Drunk.",
      ],
    },
    Sapling: {
      alignment: "Village",
      description: [
        "Chooses whether or not to grow into a tree at night.",
        "Tree is immune to most ways of dying.",
        "Tree cannot vote.",
      ],
    },
    Tree: {
      alignment: "Village",
      disabled: true,
      description: [
        "Tree is immune to most ways of dying.",
        "Tree cannot vote.",
      ],
    },
    Baker: {
      alignment: "Village",
      description: [
        "When baker is present in the game, all players start with two breads. A famine will start.",
        "Gives out up to two breads each night.",
      ],
    },
    Virgin: {
      alignment: "Village",
      description: [
        "If condemned by the village, no one will die the following night.",
        "If visited by Hooker, gets turned into Villager.",
      ],
    },
    Schoolmarm: {
      alignment: "Village",
      newlyAdded: true,
      description: [
        "If condemned by the village, all Village-aligned players convert to Villager.",
      ],
    },
    Mimic: {
      alignment: "Village",
      description: [
        "Chooses a player at night and attempt to mimic their role.",
        "If player is Village, mimic steals their role and that player becomes a villager.",
        "If player is Mafia, mimic becomes villager.",
        "If player is independent, Hostile, or Cult, mimic becomes amnesiac.",
      ],
    },
    Attorney: {
      alignment: "Village",
      description: ["Vote weight is worth 2 votes in day meeting."],
    },
    "Party Host": {
      alignment: "Village",
      description: [
        "Chooses to host a party during day meeting for everyone to attend once per game on the following night.",
        "Everyone will share a party meeting at night.",
      ],
    },
    Ghost: {
      alignment: "Village",
      description: [
        "Appears as villager to self, until dead.",
        "Once dead, chooses to block one player each night.",
      ],
      graveyardParticipation: "self",
    },
    Lightkeeper: {
      alignment: "Village",
      description: [
        "Following their death, causes an eclipse during the day",
        "During an eclipse all speech and votes are anonymous.",
      ],
    },
    Leader: {
      alignment: "Village",
      description: [
        "On the day following their death, all votes will be anonymous",
      ],
    },
    Resurrectionist: {
      alignment: "Village",
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      graveyardParticipation: "all",
    },
    Trickster: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "Gives out an item each night to a random player.",
        "The item can be a Gun, Knife, Armor, Whiskey, or Crystal.",
        "The item has a 50% chance to be Cursed.",
        "Cursed items will misfire or be otherwise ineffective.",
      ],
    },
    Medium: {
      alignment: "Village",
      description: [
        "Holds a seance with a dead player once per night.",
        "Identity is not revealed to the dead player.",
      ],
      graveyardParticipation: "all",
    },
    "Robin Hood": {
      alignment: "Village",
      description: [
        "Chooses one player to steal from each night and another player to receive their items.",
        "If the player chosen to receive an item is mafia, the steal will not go through.",
      ],
    },
    Gemcutter: {
      alignment: "Village",
      description: [
        "Gives out a crystal ball to a player during the night, once per game.",
        "Crystal balls reveal the chosen player's role identity upon the holder's death.",
      ],
    },
    Inventor: {
      alignment: "Village",
      description: [
        "Creates an item if not visited by anyone during the night.",
        "Created item can be a Gun, Knife, Armor, Crystal Ball or Whiskey.",
      ],
    },
    Coroner: {
      alignment: "Village",
      description: [
        "Chooses to visit a dead player at night and learns their role identity.",
      ],
    },
    Mourner: {
      alignment: "Village",
      description: [
        "Can ask players in the graveyard a question every night.",
        "The players can answer with yes or no.",
        "The mourner will receive the results of the vote.",
      ],
      graveyardParticipation: "all",
    },
    Santa: {
      alignment: "Village",
      description: [
        "Visits a player each night to learn their role alignment.",
        "If not visited during the night, will learn whether that player is naughty or nice.",
        "Gives out a Gun, Knife, Armor, Crystal, Whiskey, or Bread, each night.",
      ],
    },
    Tinkerer: {
      alignment: "Village",
      description: [
        "Crafts a gun if not visited during the night.",
        "If killed, the killer will find a gun that always reveals.",
      ],
    },
    Mechanic: {
      alignment: "Village",
      description: [
        "Once per night, fixes the target's item(s).",
        "Every phase, fixes their own item(s).",
      ],
    },
    King: {
      alignment: "Village",
      recentlyUpdated: true,
      description: ["Vote overrides others in village meeting."],
    },
    Suitress: {
      alignment: "Village",
      description: [
        "During the day, can make an anonymous proposal to another player.",
        "The player has to publicly accept or deny the proposal.",
        "Once a proposal is accepted, the Suitress cannot make another proposal.",
      ],
    },
    Sleepwalker: {
      alignment: "Village",
      recentlyUpdated: true,
      description: ["Visits a random player each night."],
    },
    Messenger: {
      alignment: "Village",
      description: [
        "Sends an anonymous message to a player of choice during the night.",
      ],
    },
    Visitor: {
      alignment: "Village",
      description: [
        "Pays a visit to another player at night.",
        "Annoyingly, this visit has no effect.",
        "Town roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Waitress: {
      alignment: "Village",
      description: [
        "Visits a player and blocks them from performing actions at night.",
        "Steals any items they are holding.",
      ],
    },
    Crafter: {
      alignment: "Village",
      description: [
        "Gives out a Gun, Knife, Armor, Crystal, or Whiskey, or a Cursed version of any of these items each night.",
      ],
    },
    Keymaker: {
      alignment: "Village",
      description: ["Gives out a key to one player each night."],
    },
    Fabulist: {
      alignment: "Village",
      description: [
        "Composes a fake system message, given to a player of their choice, at night.",
      ],
    },
    Stalwart: {
      alignment: "Village",
      description: [
        "Cannot be converted.",
        "Kills anyone who tries to convert them at night.",
        "Can kill a maximum of 2 people",
      ],
    },
    President: {
      alignment: "Village",
      description: [
        "All villagers will know who president is.",
        "When President dies, the Mafia wins.",
      ],
    },
    Dignitary: {
      alignment: "Village",
      description: [
        "If half or more the number of Dignitaries in play die, Mafia wins.",
      ],
    },
    Soldier: {
      alignment: "Village",
      description: [
        "If the number of living Soldiers equals half of all living players, the Village wins.",
      ],
    },
    Gunslinger: {
      alignment: "Village",
      description: [
        "When shot, has an 80% chance of surviving and stealing the gun.",
      ],
    },
    Bodyguard: {
      alignment: "Village",
      description: [
        "Guards one player every night",
        "If the target was attacked, the Bodyguard will kill one attacker and die.",
        "If the target was the Celebrity, the Bodyguard will kill all attackers and die.",
      ],
    },
    Penguin: {
      alignment: "Village",
      description: ["Each night, waddles up to someone to tell them a secret."],
    },
    Butterfly: {
      alignment: "Village",
      description: [
        "When they die all players are reset to the role they had at the start of the game.",
      ],
    },
    Comedian: {
      alignment: "Village",
      description: [
        "Each night, tells a joke about 3 roles in the game, and a player who is in the joke.",
      ],
    },
    Trapper: {
      alignment: "Village",
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Preferentially kills Mafia, Cult, Independents, Hostiles, then Villagers.",
        "Other visitors will learn the identity of the Trapper.",
      ],
    },
    Pathologist: {
      alignment: "Village",
      description: [
        "Each night, visits one dead player.",
        "Will receive all system messages the player ever received.",
      ],
    },
    Scapegoat: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "When the Scapegoat receives the majority of the Village vote, they will not be condemned.",
        "Will get frustrated and die if it has a non-zero minority Village vote.",
      ],
    },
    Demolitionist: {
      alignment: "Village",
      description: [
        "Gives out bomb to one player each night.",
        "The bomb will kill any attacker, but will be deactivated the night next.",
      ],
    },
    Psychic: {
      alignment: "Village",
      description: [
        "Each night, reads the mind of someone and learn their true alignment.",
        "Will learn nothing if disturbed at night.",
      ],
    },
    Shrink: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "Each night, counsels one player and heals their insanity.",
        "Prevents their target from being converted.",
        "If their target was a Hostile, the target will become a Villager.",
      ],
    },
    Turncoat: {
      alignment: "Village",
      description: [
        "When killed by the Mafia, will turn into a Traitor instead.",
      ],
    },
    Chandler: {
      alignment: "Village",
      description: [
        "Gives out a candle to one player each night.",
        "The candle allows the player to see all their visitors.",
      ],
    },
    Falconer: {
      alignment: "Village",
      description: [
        "Gives out a falcon to one player each night.",
        "The falcon allows the player to track another player.",
      ],
    },
    Coward: {
      alignment: "Village",
      description: [
        "Each night, chooses one player.",
        "If killed, the chosen player dies instead.",
        "Only able to redirect the kill once.",
      ],
    },
    Avenger: {
      alignment: "Village",
      description: [
        "Each night, chooses someone to avenge.",
        "Gets a gun if their chosen target dies.",
      ],
    },
    Secretary: {
      alignment: "Village",
      description: [
        "If killed at night, voting is completely disabled the next day.",
      ],
    },
    Whistleblower: {
      alignment: "Village",
      recentlyUpdated: true,
      description: [
        "Every night, chooses one player and prevents them from voting and from being voted.",
        "Cannot blow the whistle on themselves.",
      ],
    },
    Psyche: {
      alignment: "Village",
      description: [
        "Is randomly paired up with another player.",
        "Psyche learns who this player visits and is visited by each night.",
        "Psyche can find out who this player is at the cost of not receiving this info.",
      ],
    },
    "Bluebeard's Wife": {
      alignment: "Village",
      description: [
        "Once per game during the day, can open the door",
        "The opening of the door will be publicly announced without revealing the identity of Bluebeard's Wife",
        "When the door is opened, they will learn the identity of an evil, regardless of appearance, etc.",
        "Dies the next day if not visited that night by a town-aligned player.",
      ],
    },
    Firebrand: {
      alignment: "Village",
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
    },
    Checker: {
      alignment: "Village",
      description: [
        "Visits one player every night. Will know if their visit was successful or not.",
        "A visit fails when the Checker is roleblocked, or their target is is otherwise untargetable, such as being locked",
      ],
    },
    Bleeder: {
      alignment: "Village",
      description: [
        "Will die one day after being targeted for a kill or shot.",
      ],
    },
    Empath: {
      alignment: "Village",
      description: [
        "Each night learns how many of their alive neighbors are evil.",
      ],
    },
    Guard: {
      alignment: "Village",
      description: ["Each night, protects one player from all visits."],
    },
    Martyr: {
      alignment: "Village",
      description: [
        "Can choose to save a player if targeted for a kill by sacrificing themself.",
      ],
    },
    Troublemaker: {
      alignment: "Village",
      description: [
        "Once per game, during the day can force a night phase skip.",
      ],
    },
    Seer: {
      alignment: "Village",
      description: [
        "Knows all of the Mafia and Cult at the start of the game.",
        "When condemned, Mafia and Cult have a chance to guess who the Seer is.",
        "On a correct guess, the Seer dies and the Mafia or Cult wins.",
        "Appears as villager on death.",
      ],
    },
    Marathoner: {
      alignment: "Village",
      description: [
        "Once per game, visits every other player during the night.",
      ],
    },
    "Tea Lady": {
      alignment: "Village",
      description: [
        "If both of the Tea Lady's neighbors are aligned with the Village, the neighbors can't die.",
      ],
    },

    //Mafia
    Mafioso: {
      alignment: "Mafia",
      description: ["Wins when the mafia outnumbers all other players."],
    },
    Poisoner: {
      alignment: "Mafia",
      description: [
        "Concocts a deadly poison and administers it to one player each night.",
        "The poisoned target will die at the end of the following night unless saved.",
      ],
    },
    Stalker: {
      alignment: "Mafia",
      description: ["Stalks one player each night and learns their role."],
    },
    Hooker: {
      alignment: "Mafia",
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Godfather: {
      alignment: "Mafia",
      description: [
        "Leads the mafia kill each night.",
        "Appears as Villager to investigative roles.",
      ],
    },
    Don: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation on a Mafia-aligned player.",
        "Choosing no one or the original target preserves the Don's override ability.",
      ],
    },
    Caporegime: {
      alignment: "Mafia",
      description: [
        "Gives the kiss of death to someone each night.",
        "Target will die if visited by a non-Mafia player that night.",
      ],
    },
    Driver: {
      alignment: "Mafia",
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be roleblocked.",
        "Dies if visited by Drunk.",
      ],
    },
    Gondolier: {
      alignment: "Mafia",
      description: [
        "Chooses one passenger every night.",
        "Chooses who the passenger will perform their actions on.",
      ],
    },
    Hider: {
      alignment: "Mafia",
      recentlyUpdated: true,
      description: [
        "Attempts to guess the identity of the Seeker each night.",
        "Kills the Seeker if guess is correct.",
      ],
    },
    Ninja: {
      alignment: "Mafia",
      description: [
        "Does not get detected by watchers and trackers.",
        "Kills bomb without setting off the explosion.",
      ],
    },
    Santista: {
      alignment: "Mafia",
      newlyAdded: true,
      description: ["Shares a night meeting with the Freemasons."],
    },
    Lawyer: {
      alignment: "Mafia",
      description: [
        "Chooses a player each night and flips their alignment to investigative roles.",
      ],
    },
    Disguiser: {
      alignment: "Mafia",
      description: [
        "Chooses to steal the identity of the Mafia kill each night.",
        "Cannot be targeted while disguised as another player.",
      ],
    },
    Sniper: {
      alignment: "Mafia",
      description: [
        "Starts with a gun.",
        "Gun does not reveal identity when fired.",
      ],
    },
    Janitor: {
      alignment: "Mafia",
      description: [
        "Chooses to clean a mafia kill once per game.",
        "Player's role will be hidden from the town if kill is successful.",
        "Learns the cleaned player's role.",
      ],
    },
    Strongman: {
      alignment: "Mafia",
      description: [
        "Once per game can use strength.",
        "Strength guarantees that kills go through.",
        "Works through roleblocking and protection.",
      ],
    },
    Spy: {
      alignment: "Mafia",
      description: ["Can anonymously contact any role during the day."],
    },
    Gunrunner: {
      alignment: "Mafia",
      description: [
        "Gives out a tommy gun each night.",
        "Tommy gun will only kill the target if not aligned with the Mafia.",
        "The gunned player will not know the gun is a tommy gun.",
      ],
    },
    Gramps: {
      alignment: "Mafia",
      description: [
        "Learns role of any player who visits them.",
        "Cannot be killed normally.",
      ],
    },
    Lookout: {
      alignment: "Mafia",
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
    },
    Scout: {
      alignment: "Mafia",
      description: ["Tracks a player each night and learns who they visited."],
    },
    Busybody: {
      alignment: "Mafia",
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
    },
    Lurker: {
      alignment: "Mafia",
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    Caser: {
      alignment: "Mafia",
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
    },
    Arsonist: {
      alignment: "Mafia",
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
    },
    Terrorist: {
      alignment: "Mafia",
      description: [
        "Once per game, can rush at another player during the day, killing them both.",
      ],
    },
    Tailor: {
      alignment: "Mafia",
      description: [
        "Gives out a suit each night that disguises the wearer's role identity.",
        "Suits can be selected from any role within the current game.",
      ],
    },
    Actress: {
      alignment: "Mafia",
      description: [
        "Visits a player to appears as their role.",
        "Learns chosen player's role.",
      ],
    },
    Prosecutor: {
      alignment: "Mafia",
      description: ["Vote weight is worth 2 votes in village meeting."],
    },
    Fabricator: {
      alignment: "Mafia",
      description: [
        "Gives out a cursed item once per night.",
        "Cursed Guns and Knives will backfire against the player who used them.",
        "Cursed Armor, Crystal balls, and Whiskey will be ineffective.",
      ],
    },
    Saboteur: {
      alignment: "Mafia",
      description: ["Once per night, sabotages the target's item(s)."],
    },
    Heartbreaker: {
      alignment: "Mafia",
      description: [
        "Falls in love with another player once per game.",
        "Both players will die if Heartbreaker dies.",
      ],
    },
    Yakuza: {
      alignment: "Mafia",
      description: [
        "Chooses to sacrifice self once per game to convert another player to Mafioso.",
      ],
    },
    Necromancer: {
      alignment: "Mafia",
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's role identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      graveyardParticipation: "all",
    },
    Mummy: {
      alignment: "Mafia",
      description: [
        "Everyone who visits the mummy while the mummy is dead will die.",
      ],
    },
    Poltergeist: {
      alignment: "Mafia",
      description: [
        "Once dead, visits one player each night and roleblock them.",
      ],
      graveyardParticipation: "self",
    },
    Informant: {
      alignment: "Mafia",
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
    },
    Jinx: {
      alignment: "Mafia",
      description: [
        "Curses a player with a forbidden word each night.",
        "If the player speaks the word the next day, they will die.",
      ],
    },
    Clown: {
      alignment: "Mafia",
      description: [
        "Fools around at night, visiting another player.",
        "Will kill their visit target.",
        "Appears as Fool to self.",
      ],
    },
    Graverobber: {
      alignment: "Mafia",
      description: [
        "Visits a dead player every night.",
        "Learns the role of that player and takes any items they were holding.",
      ],
    },
    Illusionist: {
      alignment: "Mafia",
      description: [
        "Starts with a gun.",
        "Chooses one player each night to frame as the shooter of any guns shot by the Illusionist.",
      ],
    },
    Librarian: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Once per game, calls for the Town to meet at the Library.",
        "While in a Library meeting, players can only whisper instead of speaking aloud.",
      ],
    },
    Slasher: {
      alignment: "Mafia",
      description: [
        "Receives a knife if not visited during the night.",
        "Slasher knives do not reveal.",
      ],
    },
    Courier: {
      alignment: "Mafia",
      description: [
        "Sends an anonymous message at night to a player of choice.",
      ],
    },
    Trespasser: {
      alignment: "Mafia",
      description: [
        "Chooses to trespass on another player's property at night.",
        "Annoyingly, this visit has no effect.",
        "Mafia roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Housekeeper: {
      alignment: "Mafia",
      description: [
        "Visits a player and clear their will, once per game.",
        "Steals any items the player is holding.",
      ],
    },
    Thief: {
      alignment: "Mafia",
      description: ["Chooses a player to steal an item from each night."],
    },
    Crank: {
      alignment: "Mafia",
      description: [
        "Chooses a dead player once per night and holds a seance with that player.",
        "Identity is not revealed to the dead player.",
      ],
      graveyardParticipation: "all",
    },
    Interrogator: {
      alignment: "Mafia",
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
    },
    Hitman: {
      alignment: "Mafia",
      description: ["Kills one player each night."],
    },
    Ape: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Copies the actions of a player and performs them on another player each night.",
      ],
    },
    Apprentice: {
      alignment: "Mafia",
      description: [
        "Chooses to become the role of a dead Mafia-aligned player once per game.",
      ],
    },
    Hoaxer: {
      alignment: "Mafia",
      description: [
        "Composes a fake system message, given to a player of their choice, at night.",
      ],
    },
    Ventriloquist: {
      alignment: "Mafia",
      description: [
        "Can speak as any player during the day.",
        "That player won't be able to see messages said and quoted via this ability.",
      ],
    },
    Fiddler: {
      alignment: "Mafia",
      description: [
        "Serenades a player each night, causing them to be unable to hear anything the next day.",
      ],
    },
    Silencer: {
      alignment: "Mafia",
      description: [
        "Can silence someone each night, causing them to be unable to speak the next day.",
      ],
    },
    Scrambler: {
      alignment: "Mafia",
      description: [
        "Scrambles a player each night, causing them to see messages from random players the next day.",
      ],
    },
    Sharpshooter: {
      alignment: "Mafia",
      description: [
        "When shot, has an 80% chance of surviving and stealing the gun.",
      ],
    },
    Interceptor: {
      alignment: "Mafia",
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Other visitors will learn the identity of the Interceptor.",
      ],
    },
    Paparazzo: {
      alignment: "Mafia",
      description: [
        "If condemned, can choose to reveal the role of one player to the Mafia.",
      ],
    },
    Filibuster: {
      alignment: "Mafia",
      description: [
        "Can only be condemned when every town role votes for them.",
      ],
    },
    Rainmaker: {
      alignment: "Mafia",
      description: [
        "Once a game, can make it rain and prevent everyone from voting at the village meeting.",
      ],
    },
    Toreador: {
      alignment: "Mafia",
      description: ["Each night, attracts a player to visit them."],
    },
    Blinder: {
      alignment: "Mafia",
      description: [
        "Each night, blinds a player.",
        "Blinded players are unable to see the names of players typing the next day.",
      ],
    },
    Eve: {
      alignment: "Mafia",
      description: [
        "If Eve is the only mafia alive, they will take the forbidden apple.",
        "Once the apple is taken, the entire town (except Eve) will be obliterated at the end of the next phase.",
      ],
    },
    Quack: {
      alignment: "Mafia",
      description: ["Saves another player from dying each night."],
    },
    Enforcer: {
      alignment: "Mafia",
      recentlyUpdated: true,
      description: [
        "Each night, counsels one player and heals their insanity.",
        "Prevents their target from being converted.",
        "If their target was a Hostile, the target will become a Traitor.",
      ],
    },
    Tagger: {
      alignment: "Mafia",
      description: [
        "Visits one player every night. Will know if their visit was successful or not.",
        "A visit fails when the Tagger is roleblocked, or their target is otherwise untargetable, such as being locked",
      ],
    },
    Forger: {
      alignment: "Mafia",
      description: [
        "Once per night can forge the will of another player.",
        "Learns that player's real will on the next day.",
      ],
    },
    Bouncer: {
      alignment: "Mafia",
      description: ["Each night, protects one player from all visits."],
    },
    Plumber: {
      alignment: "Mafia",
      description: [
        "Every night, can choose to either leak or block all sent and received whispers of the target.",
      ],
    },
    Gossiper: {
      alignment: "Mafia",
      description: ["All whispers involving the gossiper are leaked."],
    },
    Paralyzer: {
      alignment: "Mafia",
      description: [
        "Once per game, can paralyze votes in the village meeting. Players are not able to unvote.",
      ],
    },
    Cyclist: {
      alignment: "Mafia",
      description: [
        "Once per game, visits every other player during the night.",
      ],
    },
    Lobotomist: {
      alignment: "Mafia",
      description: [
        "Each night, convert another player to the aligned vanilla role.",
      ],
    },
    Bartender: {
      alignment: "Mafia",
      description: [
        "Each night, serves a non-Mafia player and turns them into an Alcoholic.",
        "Alcoholics retain their original roles, but they unknowingly roleblock a random non-Mafia player during the night.",
        "If an Alcoholic player visits an Apothecary, they are cured.",
      ],
    },

    //Cult
    Werewolf: {
      alignment: "Cult",
      description: [
        "Each night, bites a non-Cult player and turns them into a Lycan.",
        "Lycans retain their original roles, but they unknowingly kill a random non-Cult player on full moons.",
        "Invincible during full moons, except for when visiting the Apothecary.",
        "Cult roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Witch: {
      alignment: "Cult",
      description: [
        "Chooses one player to control.",
        "Chooses who that player will perform their actions on.",
        "Redirection cannot be role blocked.",
        "Causes an eclipse during the day following their death.",
        "All votes and speech are anonymous during an eclipse.",
      ],
    },
    "Cult Leader": {
      alignment: "Cult",
      description: [
        "Converts one player into a Cultist each night.",
        "All Cultists die if the Cult Leader dies.",
      ],
    },
    Cultist: {
      alignment: "Cult",
      description: [
        "Meets with the Cult during the night.",
        "Cultists die if targeted by a Freemason meeting.",
      ],
    },
    Cthulhu: {
      alignment: "Cult",
      description: [
        "All players who visit Cthulhu go insane.",
        "Insane players speak gibberish for the rest of the game.",
      ],
    },
    Leech: {
      alignment: "Cult",
      description: [
        "Is bloodthirsty.",
        "During the night, can attach to a player and leech from them, stealing 50% of their blood.",
        "If the player dies from leeching, the leech also gains an additional 50% of blood.",
        "Gains an extra life after draining 150% blood.",
      ],
    },
    Baphomet: {
      alignment: "Cult",
      description: ["Meets with both the Cult and the Templars."],
    },
    "Accursed Doll": {
      alignment: "Cult",
      description: [
        "If visited at night by a non-Cult player, gains a knife the next day.",
        "Knows who visits but not their roles.",
      ],
    },
    Alchemist: {
      alignment: "Cult",
      description: [
        "Can choose between three potions to cast at night.",
        "A damaging potion, which attacks the target.",
        "A restoring potion, which heals the target.",
        "An elucidating potion, which reveals the target's role.",
        "Once a potion has been concocted, it cannot be brewed again for the next two nights.",
      ],
    },
    Mindwarper: {
      alignment: "Cult",
      description: [
        "Visits a player each night.",
        "If that player is not visited by a non-Cult player during the next night, they will go insane.",
      ],
    },
    Fungoid: {
      alignment: "Cult",
      description: [
        "Can choose between four fungi to cast at night.",
        "Thrush, which silences the target.",
        "Aspergillus, which deafens the target.",
        "Cataracts, which blinds the target.",
        "Hallucinogens, which scrambles the target.",
        "Once a fungus has been used, it cannot be spored again for the next two nights.",
      ],
    },
    Gorgon: {
      alignment: "Cult",
      description: [
        "Chooses to turn all visitors from the previous night into stone, once per game, during the day.",
        "Players turned to stone are killed.",
      ],
    },
    Selkie: {
      alignment: "Cult",
      description: [
        "Each night, chooses two players who are forced to target each other.",
      ],
    },
    "Queen Bee": {
      alignment: "Cult",
      description: [
        "Every night, visits a player and covers them with sticky honey.",
        "Delays their action by one day/night cycle.",
      ],
    },
    Cannibal: {
      alignment: "Cult",
      description: [
        "When a non-Cult player is voted off, the Cannibal can cook the player.",
        "The cooked player is then served as two Stew to every member of the Cult.",
        "If the stew is stolen by non-Cult players and then eaten, they will get poisoned.",
      ],
    },
    Druid: {
      alignment: "Cult",
      description: [
        "Visits a dead player during the night.",
        "That player will be resurrected as a Tree the following day.",
      ],
    },
    "Snow Queen": {
      alignment: "Cult",
      description: [
        "During the day, once per game, can choose to start a snowstorm.",
        "Everyone is forced to pass the next night snowed in together.",
        "During the next night, only Cult actions will go through.",
      ],
    },
    "Cat Lady": {
      alignment: "Cult",
      description: [
        "Chooses a player to send them a cat, each day.",
        "The player can choose to let the cat in during the night, or chase it out.",
        "If the cat is let in, the player is blocked from performing night actions.",
        "If the cat is chased out, the Cat Lady will learn the player's role.",
      ],
    },
    Diabolist: {
      alignment: "Cult",
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
    },
    Inquisitor: {
      alignment: "Cult",
      recentlyUpdated: true,
      description: [
        "Kills a player each night.",
        "If the victim is night-saved, they will convert to Cultist.",
      ],
    },
    Invader: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Attempts to guess the identities of the Hider and Seeker each night.",
        "Converts the Hider and Seeker to Cultist if guess is correct.",
      ],
    },
    "Witch Doctor": {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Chooses a player each night.",
        "If that player was targeted by a kiling role, that player is saved and converts to Cultist.",
        "All Cultists die if the Witch Doctor dies.",
      ],
    },
    Freischütz: {
      alignment: "Cult",
      recentlyUpdated: true,
      description: [
        "Gives out a magic gun each night.",
        "If a player not aligned with the Cult is shot, they will survive and convert to Cultist.",
        "If a player aligned with the Cult is shot, they will be killed.",
        "The gunned player does not know if the gun is a magic gun.",
      ],
    },
    Doomsayer: {
      alignment: "Cult",
      description: [
        "Convert all players who visit during the night.",
        "All Cultists die if the Doomsayer dies.",
      ],
    },
    Succubus: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Shadow: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Visits a player each night.",
        "Can see who that player visits as well as everyone who visits that player.",
      ],
    },
    Ritualist: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Visits two Cult-aligned players each night.",
        "The first player is killed while the second person gains an extra life.",
      ],
    },

    //Independent
    Fool: {
      alignment: "Independent",
      description: [
        "Fools around at night, visiting another player with no effect.",
        "Wins if condemned by the town.",
        "No one else wins if the Fool wins.",
        "Clown appears as this role to self.",
        "Independent roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Executioner: {
      alignment: "Independent",
      description: [
        "Randomly assigned a Village/Independent player as a target.",
        "Wins if their target player is condemned in Village meeting while alive.",
      ],
    },
    Dodo: {
      alignment: "Independent",
      description: [
        "Wins if shot with a gun.",
        "Flocks around at night, giving their target a gun.",
        "No one else wins if the Dodo wins.",
      ],
    },
    Joker: {
      alignment: "Independent",
      description: [
        "Wins if killed at Night.",
        "No one else wins if the Joker wins.",
      ],
    },
    Admirer: {
      alignment: "Independent",
      description: [
        "Attached to Killing Independents.",
        "Knows who their Killer is, but Killers don't know who their Admirers are.",
        "When a Killer dies, one of their Admirers becomes a Killer.",
        "Appears as Villager when investigated.",
        "Wins if among last two alive.",
      ],
    },
    Amnesiac: {
      alignment: "Independent",
      description: [
        "Chooses to become the role of a dead player once per game.",
      ],
    },
    Survivor: {
      alignment: "Independent",
      description: ["Wins if alive at the end of the game."],
    },
    "Old Maid": {
      alignment: "Independent",
      description: [
        "Chooses a player to swap roles with each night.",
        "Chosen player becomes the Old Maid.",
        "Cannot win the game.",
      ],
    },
    Traitor: {
      alignment: "Independent",
      description: [
        "Wins with Mafia.",
        "Does not count towards mafia win count.",
      ],
    },
    Autocrat: {
      alignment: "Independent",
      description: ["Wins instead of Village and counts toward their total."],
    },
    Palladist: {
      alignment: "Independent",
      description: [
        "If there are no Freemasons, converts a player to Freemason.",
        "Anonymizes Freemason meetings and forces them to act.",
        "Immune to conversions.",
        "Wins instead of Village if there is a Freemason majority and counts toward their total.",
      ],
    },
    "Vice President": {
      alignment: "Independent",
      description: [
        "If the President dies, converts to President and the game continues.",
        "Cannot win if the President does not die.",
      ],
    },
    Politician: {
      alignment: "Independent",
      description: [
        "Vote weight is worth 2 votes.",
        "Gets assigned to random alignment on game start.",
        "Every day, switches alignment between Mafia and Village.",
        "Wins if their current alignment wins.",
      ],
    },
    Lover: {
      alignment: "Independent",
      description: [
        "Falls in love with another player once per game.",
        "Both players die if either of them are killed.",
        "Wins if both players survive until the end of the game.",
      ],
    },
    Prophet: {
      alignment: "Independent",
      description: [
        "Once per game, predict which day/night cycle the game will end on.",
        "Wins if guess is correct.",
      ],
    },
    "Vengeful Spirit": {
      alignment: "Independent",
      description: [
        "If murdered by another player, gains the ability to kill each night from the graveyard.",
        "Does not gain the ability if condemned by village vote.",
        "Wins if they kill all of their murderers.",
      ],
      graveyardParticipation: "self",
    },
    Phantom: {
      alignment: "Independent",
      description: ["Wins if in the graveyard when the game ends"],
    },
    Nomad: {
      alignment: "Independent",
      description: [
        "Chooses to follow the ways of another player at night, aligning with their alignmemt.",
        "Wins if they are alive when the last alignment they are aligned with wins.",
      ],
    },
    "Creepy Girl": {
      alignment: "Independent",
      description: [
        "Can give out one doll at night",
        "The doll can be passed to someone else each night.",
        "Wins if the player holding the doll dies.",
      ],
    },
    Host: {
      alignment: "Independent",
      description: [
        "Always assigned to the first player(s) in the list.",
        "Cannot die.",
        // TODO
        "If in the game, whispers will not leak.",
        "Cannot be added to ranked games",
      ],
    },
    Warlock: {
      alignment: "Independent",
      description: [
        "Each night, predicts the village vote.",
        "Wins if successfully predicted the village vote twice.",
      ],
    },
    Siren: {
      alignment: "Independent",
      description: [
        "Beckons a player each night.",
        "If the beckoned player visits the Siren that night, the player dies.",
        "Wins if successfully kills two people.",
      ],
    },
    "Gingerbread Man": {
      alignment: "Independent",
      description: [
        "Each night, hides behind a player and becomes immune to death.",
        "Will get eaten if the player visits them. That player will gain an extra life.",
        "Wins if alive at the end of the game.",
      ],
    },
    Cupid: {
      alignment: "Independent",
      description: [
        "Chooses two players and makes them fall in love with each other.",
        "Wins if their chosen lovers are alive at the end of the game.",
      ],
    },
    Grouch: {
      alignment: "Independent",
      description: ["Wins if alive when Village loses."],
    },
    Sidekick: {
      alignment: "Independent",
      description: [
        "Assigned to a random independent player at game start.",
        "Wins if their teammate wins.",
      ],
    },
    Supervillain: {
      alignment: "Independent",
      description: ["Wins if they are the sole remaining Independent player."],
    },
    Monk: {
      alignment: "Independent",
      description: [
        "Has no voting power.",
        "Each night, can save one player and also grant them condemn immunity the following day.",
        "Wins from two saves, or if no deaths happen in 2 days and 2 nights.",
      ],
    },
    Rival: {
      alignment: "Independent",
      description: [
        "At game start, is assigned to another rival.",
        "Wins if the rival survives and their rival does not.",
      ],
    },
    Picciotto: {
      alignment: "Independent",
      description: [
        "Every night, can visit a player.",
        "If that player is mafia, the Picciotto will be notified.",
        "When the Picciotto has visited all the living mafia, they are converted into a random mafia.",
        "Does not win if not converted to mafia.",
      ],
    },
    Angel: {
      alignment: "Independent",
      graveyardParticipation: "self",
      recentlyUpdated: true,
      description: [
        "Will become the guardian angel for one player in the game.",
        "Once per game while alive or dead, can turn on sacrificial powers and protect their target from all kills",
        "Wins if their target is alive at the end of the game.",
      ],
    },
    //Hostile
    "Serial Killer": {
      alignment: "Hostile",
      description: [
        "Must kill a player each night.",
        "Wins if among last two alive.",
      ],
    },
    Yandere: {
      alignment: "Hostile",
      description: [
        "Falls in love with another player once per game.",
        "The beloved will not be alerted. If the beloved dies, the Yandere dies. If the Yandere dies, the beloved will not die.",
        "Must kill a player each night.",
        "Wins if the Yandere and their beloved are the last two alive.",
      ],
    },
    Clockmaker: {
      alignment: "Hostile",
      description: [
        "Has a clock that starts at 6 o'clock.",
        "Choosing to kill a player each night changes the time based on that player's alignment.",
        "Clock goes up by 1 hour for village, 2 hours for Mafia or Cult, and down by 3 hours for Independent/Hostile.",
        "Dies instantly at 3 o'clock.",
        "Gains an extra life at 9 o'clock.",
        "Wins when clock strikes 12 o'clock.",
      ],
    },
    Hellhound: {
      alignment: "Hostile",
      recentlyUpdated: true,
      description: [
        "Chooses to hunt at night by choosing a player and guessing their role.",
        "If guessed correct, becomes immortal for the following day.",
        "If guessed incorrect, identity will be revealed to all.",
        "Wins if among the last two alive.",
      ],
    },
    Ripper: {
      alignment: "Hostile",
      description: [
        "Kills one player every night.",
        "Wins when all other hostile third parties are dead.",
      ],
    },
    Mastermind: {
      alignment: "Hostile",
      description: [
        "Mafia meeting is anonymous if Mastermind is present in the game.",
        "Wins instead of mafia and counts toward their total.",
      ],
    },
    Usurper: {
      alignment: "Hostile",
      description: [
        "Meets with the Mafia, makes their night meeting anonymous.",
        "Each night, chooses a player. If the player is sided with the mafia, they become a Mafioso.",
        "Wins when all mafia-aligned players are Mafiosos.",
      ],
    },
    Mutineer: {
      alignment: "Hostile",
      description: [
        "Can kill one player per night.",
        "Appears as Mafia on investigation.",
        "Attends Mafia meetings, makes them anonymous and cannot vote in them.",
        "Wins if alive alone or the final two, and the other is not a mafia",
      ],
    },
    Nyarlathotep: {
      alignment: "Hostile",
      description: [
        "Cult meeting is anonymous if Nyarlathotep is present in the game.",
        "All players who visit Nyarlathotep go insane.",
        "Wins instead of Cult and counts toward their total.",
      ],
    },
    Alien: {
      alignment: "Hostile",
      description: [
        "Chooses one player to probe each night.",
        "Wins if all players left alive have been probed.",
      ],
    },
    Matchmaker: {
      alignment: "Hostile",
      description: [
        "Each night chooses two players to go on a date. If they are the same alignment, the date will be succesful.",
        "Wins if all players left alive have went on a successful date.",
      ],
    },
    Tofurkey: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "The game begins with a famine, with each player starting with four bread.",
        "Tofurkeys are immune to the famine.",
        "If a Tofurkey dies, each remaining player loses one meal.",
        "Appears as Turkey to investigators.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Turkey: {
      alignment: "Hostile",
      featured: true,
      description: [
        "The game begins with a famine, with each player starting with four bread.",
        "Turkeys are immune to the famine.",
        "If a Turkey dies, each remaining player gets one meal.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Leprechaun: {
      alignment: "Hostile",
      description: [
        "When present in the game, four-leaf clovers are randomly assigned to players.",
        "Each night, steals a random item from their target, preferentially stealing Clovers.",
        "If a it finds another Leprechaun, will kill them and steal all their items.",
        "Wins if holding three four-leaf clovers.",
      ],
    },
    Anarchist: {
      alignment: "Hostile",
      description: [
        "Gives out a timebomb each night.",
        "The timebomb can be passed around during the day, randomly exploding.",
        "Wins if two people die to the timebomb given out by them, or they are among the last two alive.",
        "Timebomb reveals Anarchist when exploded on themself.",
      ],
    },
    Gambler: {
      alignment: "Hostile",
      description: [
        "Each night, challenges a player to a game of Rocks, Paper, Scissors. Game is played during the day.",
        "If the Gambler wins, the Challenger dies.",
        "Wins the game when they have 2 gamble wins, or are among the last two standing.",
      ],
    },
    "Polar Bear": {
      alignment: "Hostile",
      description: [
        "Visits two players each night, polarising them.",
        "A polarised player visiting another polarised player will kill both of them.",
        "If visited by a Penguin, will eat it.",
        "Wins if four polarised players die or if majority is attained.",
      ],
    },
    Benandante: {
      alignment: "Hostile",
      description: [
        "Participates in both the Mafia and Cult meetings.",
        "If alive during a Mafia victory, the Cult joint-wins with the Mafia and vice-versa.",
      ],
    },
  },

  "Split Decision": {
    //Blue
    "Blue Member": {
      alignment: "Blue",
      description: [
        "Wins if the President is not in the same room as the Bomber at the end of the game.",
      ],
    },
    President: {
      alignment: "Blue",
      description: [
        "The Blue team wins if they are in a different room from the Bomber at the end of the game.",
      ],
    },
    //Red
    "Red Member": {
      alignment: "Red",
      description: [
        "Wins if the President is in the same room as the Bomber at the end of the game.",
      ],
    },
    Bomber: {
      alignment: "Red",
      description: [
        "The Red team wins if they are in the same room as the Bomber at the end of the game.",
      ],
    },
    //Independent
    Gambler: {
      alignment: "Independent",
      description: [
        "Guesses which team will win after the last round and wins if correct.",
      ],
    },
  },
  Resistance: {
    //Resistance
    Rebel: {
      alignment: "Resistance",
      description: ["Wins if a certain number of missions are successful."],
    },
    Merlin: {
      alignment: "Resistance",
      description: [
        "Kowns the alignment of all spies.",
        "If the Rebels would win, the spies can guess who Merlin is to win instead.",
      ],
    },
    Percival: {
      alignment: "Resistance",
      description: ["Knows who is Merlin."],
    },
    //Spies
    Spy: {
      alignment: "Spies",
      description: ["Wins if a certain number of missions fail."],
    },
    Oberon: {
      alignment: "Spies",
      description: [
        "Does not know who the other spies are and spies do not know them.",
      ],
    },
    Morgana: {
      alignment: "Spies",
      description: ["Appears as Merlin to Percival."],
    },
  },
  "One Night": {
    //Village
    Villager: {
      alignment: "Village",
      description: [
        "Wins if at least one Werewolf dies or if no one dies if no Werewolves are present.",
      ],
    },
    Hunter: {
      alignment: "Village",
      description: [
        "If condemned, the player they voted to condemn is also killed.",
      ],
    },
    Mason: {
      alignment: "Village",
      description: [
        "Learns who the other Masons were at the beginning of the night.",
      ],
    },
    Seer: {
      alignment: "Village",
      description: [
        "At the beginning of the night, learns either one player's role or two excess roles.",
      ],
    },
    Robber: {
      alignment: "Village",
      description: [
        "At 12:00, can choose to exchange roles with another player and learn their new role.",
        "Does not perform the action of their new role.",
      ],
    },
    Troublemaker: {
      alignment: "Village",
      description: [
        "At 1:00, can swap the roles of two other players.",
        "Those players do not perform the actions of their new roles.",
      ],
    },
    Insomniac: {
      alignment: "Village",
      description: ["Learns what their role is after the night is over."],
    },
    //Werewolves
    Werewolf: {
      alignment: "Werewolves",
      description: [
        "Learns who the other Werewolves were at the beginning of the night.",
        "If there are no other Werewolves, learns one excess role.",
        "Wins if Werewolves are present but no Werewolves die.",
      ],
    },
    Minion: {
      alignment: "Werewolves",
      description: [
        "Learns who the Werewolves are at the beginning of the night.",
        "Wins with the Werewolves, and wins if a non-minion player dies when no Werewolves are present.",
      ],
    },
    //Independent
    Drunk: {
      alignment: "Independent",
      description: ["Becomes a random excess role at the end of the night."],
    },
    Tanner: {
      alignment: "Independent",
      description: [
        "Wins if they die.",
        "The Werewolves do not win if they die.",
        "The Village does not win if they die and no Werewolves are present.",
      ],
    },
    Doppelganger: {
      alignment: "Independent",
      description: [
        "At the beginning of the night, copies and becomes the role of another player.",
        "Performs the actions of that role, unless another Doppelganger was chosen.",
        "Their new actions are performed before the player's whose role was copied.",
      ],
    },
  },
  Ghost: {
    Villager: {
      alignment: "Town",
      description: ["Knows the hidden word."],
    },
    Fool: {
      alignment: "Town",
      description: [
        "Knows the decoy word, which has the same number of letters as the hidden word.",
        "Appears to self as Town, and does not know that their word is the decoy word.",
      ],
    },
    Ghost: {
      alignment: "Ghost",
      description: [
        "Knows other Ghosts.",
        "Only knows the number of letters in the hidden word.",
        "Must blend in and guess the hidden word.",
      ],
    },
    Host: {
      alignment: "Host",
      description: ["Knows both words.", "Facilitates the game."],
    },
  },
  Jotto: {
    Player: {
      alignment: "Town",
      description: ["Jotto player."],
    },
  },
  Acrotopia: {
    Player: {
      alignment: "Town",
      description: ["Can make and vote for acronyms."],
    },
  },
  "Secret Dictator": {
    // Liberals
    Liberal: {
      alignment: "Liberals",
      description: [
        "Wins if 5 Liberal Policies are enacted or Dictator is assassinated.",
      ],
    },
    // Liberals
    Fascist: {
      alignment: "Fascists",
      description: [
        "Wins if 6 Fascist Policies are enacted or Dictator is elected Chancellor after 3rd Fascist Policy enacted.",
      ],
    },
    Dictator: {
      alignment: "Fascists",
      description: ["Appear as Fascist if investigated."],
    },
  },
  "Secret Hitler": {},
};

module.exports = roleData;
