const roleData = {
  Mafia: {
    //Village

    //basic roles
    Villager: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Wins when no Mafia, Cult, or Hostiles remain.",
        "Other roles appear as Villager to investigative roles, upon death, and to themself.",
      ],
    },
    Bleeder: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Will die one day after being targeted for a kill or shot.",
      ],
    },
    Celebrity: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Identity is publicly revealed to all players at the start of the game.",
      ],
    },
    Commuter: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Blocks all visitors during the night from performing any actions.",
      ],
    },
    Deputy: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Starts with a gun.",
        "This gun never reveals the deputy when shot.",
      ],
    },
    Loudmouth: {
      alignment: "Village",
      category: "Basic",
      newlyAdded: true,
      description: [
        "When visited, will announce the name of their visitors.",
        "When whispering, will read their whispers aloud.",],
    },
    Miller: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Appears as Villager to self.",
        "Appears as Mafioso to investigative roles.",
        "Appears as Mafioso upon being condemned.",
        "Appears as Miller upon being killed.",
      ],
    },
    Occultist: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Appears as Villager to self.",
        "Appears as Cultist to investigative roles.",
        "Appears as Cultist upon being condemned.",
        "Appears as Occultist upon being killed.",
      ],
    },
    "Party Host": {
      alignment: "Village",
      category: "Basic",
      description: [
        "Chooses to host a party during day meeting for everyone to attend once per game on the following night.",
        "Everyone will share a party meeting at night.",
      ],
    },
    Sapling: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Chooses whether or not to grow into a tree at night.",
        "Tree is immune to most ways of dying.",
        "Tree cannot vote.",
      ],
    },
    Sheriff: {
      alignment: "Village",
      category: "Basic",
      description: [
        "Starts with a gun.",
        "This gun always reveals the sheriff when shot.",
      ],
    },
    Sleepwalker: {
      alignment: "Village",
      category: "Basic",
      description: ["Visits a random player each night."],
    },
    //protective roles
    Bodyguard: {
      alignment: "Village",
      category: "Protective",
      description: [
        "Guards one player every night",
        "If the target was attacked, the Bodyguard will kill one attacker and die.",
        "If the target was the Celebrity, the Bodyguard will kill all attackers and die.",
      ],
    },
    Doctor: {
      alignment: "Village",
      category: "Protective",
      description: ["Saves another player from dying each night."],
    },
    Martyr: {
      alignment: "Village",
      category: "Protective",
      description: [
        "Can choose to sacrifice themself and be condemned in the place of the player currently being condemned.",
      ],
    },
    Medic: {
      alignment: "Village",
      category: "Protective",
      description: [
        "Visits two players each night.",
        "If the first player is targeted for a night kill and dies, the second player gains an extra life.",
      ],
    },
    Nurse: {
      alignment: "Village",
      category: "Protective",
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
    },
    Resurrectionist: {
      alignment: "Village",
      category: "Protective",
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      graveyardParticipation: "all",
    },
    Shrink: {
      alignment: "Village",
      category: "Protective",
      description: [
        "Prevents their target from being converted to another role.",
        "If their target was a Hostile, the target will become a Villager.",
      ],
    },
    Surgeon: {
      alignment: "Village",
      category: "Protective",
      description: [
        "Each night, operates on one player to prevent them from dying or being converted.",
        "If attacked, kills one of their killers",
      ],
    },
    "Tea Lady": {
      alignment: "Village",
      category: "Protective",
      description: [
        "If both of the Tea Lady's neighbors are aligned with the Village, the neighbors can't die.",
      ],
    },
    //gifting roles
    Baker: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "When baker is present in the game, all players start with two breads. A famine will start.",
        "Gives out up to two breads each night.",
        "Bread is consumed each night, staving off the famine for another phase. Running out will eventually starve the player to death.",
      ],
    },
    Blacksmith: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out armor to one player each night.",
        "Armor will protect from one attack before breaking.",
    ],
    },
    Chandler: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a candle to one player each night.",
        "Candles will tell a player the names of their visitors from the previous night.",
      ],
    },
    Cutler: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a knife each night.",
        "Knives can be used to attack another player, causing them to bleed.",
      ],
    },
    Demolitionist: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out bomb to one player each night.",
        "If a player holding a bomb is attacked, their attacker will die along with them.",
      ],
    },
    Falconer: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a falcon to one player each night.",
        "Falcons can be used to track another player's movements during the night.",
    ],
    },
    Funsmith: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a gun each night.",
        "Gives out a gun to all visitors at night.",
      ],
    },
    Gemcutter: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a crystal ball to a player each night.",
        "If a player holding the crystal ball dies, their target's role will be revealed.",
    ],
    },
    Gunsmith: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a gun each night.",
        "Guns can be used to shoot and kill someone during the day.",
      ],
    },
    Keymaker: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a key to one player each night.",
        "Keys can be used to lock a player in the next night; they cannot be visited, but also cannot perform any actions.",
    ],
    },
    Mailman: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out an envelope to one player each night.",
        "Envelopes can be used to send an anonymous message to another player at night.",
    ],
    },
    Missionary: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a tract to one player each night.",
        "Tracts will prevent one conversion attempt.",
      ],
    },
    Quartermaster: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a rifle each night.",
        "Unlike guns, rifles can be shot multiple times if they are used against members of the opposite alignment. If a player shoots one of their same alignment, the rifle will backfire and kill them.",
      ],
    },
    Pharmacist: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a bottle of whiskey each night.",
        "Whiskey can be used to distract another player, preventing them from acting the next night.",
    ],
    },
    Reanimator: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Gives out a syringe each night.",
        "Syringes can be used on dead players to resurrect them.",
      ],
      graveyardParticipation: "all",
    },
    Santa: {
      alignment: "Village",
      category: "Gifting",
      description: [
        "Visits a player each night to learn their role alignment.",
        "If not visited during the night, will learn whether that player is naughty or nice.",
        "Gives out a Gun, Knife, Armor, Bomb, Crystal, Whiskey, Bread, Key, Falcon, Tract, or Syringe each night.",
      ],
      graveyardParticipation: "all",
    },
    //investigative roles
    Bloodhound: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    Cop: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Investigates one player each night and learns their alignment.",
        "Some other roles appear as Cop to themself.",
      ],
    },
    "Insane Cop": {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Investigates one player each night and learns their alignment (alignment will be reversed).",
        "Appears as normal cop upon death.",
      ],
    },
    "Naive Cop": {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Investigates one player each night and learns their alignment (alignments will always appear innocent).",
        "Appears as normal cop upon death.",
      ],
    },
    "Paranoid Cop": {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Investigates one player each night and learns their alignment (alignments will always appear guilty).",
        "Appears as normal cop upon death.",
      ],
    },
    "Confused Cop": {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Investigates one player each night and learns their alignment (alignments will always be random).",
        "Appears as normal cop upon death.",
      ],
    },
    Coroner: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Chooses to visit a dead player at night and learns their role identity.",
      ],
    },
    Detective: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Investigates one player each night and learns their role.",
      ],
    },
    Empath: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Each night learns how many of their alive neighbors are evil.",
      ],
    },
    Journalist: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
    },
    Justice: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Investigates two players at night and learns if they share an alignment.",
      ],
    },
    Manhunter: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Chooses a player and a role and learns if they are that role or not.",
      ],
    },
    Pathologist: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Each night, visits one dead player.",
        "Will receive a list of all visitors that player ever received, but not specific actions or days.",
      ],
    },
    Psychic: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Each night, reads the mind of someone and learns their true alignment.",
        "Will learn nothing if disturbed at night.",
      ],
    },
    Snoop: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Visits a player each night and learns what items they are carrying.",
      ],
    },
    Tracker: {
      alignment: "Village",
      category: "Investigative",
      description: ["Tracks a player each night and learns who they visited."],
    },
    Voyeur: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
    },
    Watcher: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
    },
    Witness: {
      alignment: "Village",
      category: "Investigative",
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
    },
    //night-acting roles
    Avenger: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Each night, chooses someone to avenge.",
        "Gets a gun if their chosen target dies.",
      ],
    },
    Caroler: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Each night, sings a carol to a player about 3 players, at least one of whom is Mafia, Cult, or Hostile.",
        "The carol is not heard if the player chosen visits at night.",
        "Cannot choose the same player consecutively.",
      ],
    },
    Comedian: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Each night, tells a joke to a player about 3 roles, and a different player who is one of the roles.",
        "The joke is not heard if the target chosen visits at night.",
        "Cannot choose same the target consecutively.",
      ],
    },
    Drunk: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Guard: {
      alignment: "Village",
      category: "Night-acting",
      description: ["Each night, protects one player from all visits."],
    },
    Marathoner: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Once per game, visits every other player during the night.",
      ],
    },
    Mechanic: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Once per night, fixes the target's item(s).",
        "Can undo an item's fabricated/sabotaged status, and can turn Gunrunner guns into normal guns and Freischutz guns into normal guns.",
        "Each phase, fixes their own item(s).",
      ],
    },
    Mime: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Chooses a player at night and attempts to mime their role.",
        "If player is Village, Mime steals their role and that player becomes a villager.",
        "If player is Mafia, Mime becomes villager.",
        "If player is Independent, Hostile, or Cult, Mime becomes Amnesiac.",
      ],
    },
    Impersonator: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Chooses a role each night to imitate.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
    },
    Neighbor: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Chooses a player each night to reveal their identity as neighbor.",
      ],
    },
    Oracle: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Visits one player each night whose role will be revealed upon death.",
      ],
    },
    Penguin: {
      alignment: "Village",
      category: "Night-acting",
      description: ["Each night, waddles up to someone to tell them a secret."],
    },
    "Robin Hood": {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Chooses one player to steal from each night and another player to receive their items.",
        "If the player chosen to receive an item is mafia, the steal will not go through.",
      ],
    },
    Visitor: {
      alignment: "Village",
      category: "Night-acting",
      description: [
        "Pays a visit to another player at night.",
        "Annoyingly, this visit has no effect.",
        "Town roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Waitress: {
      alignment: "Village",
      category: "Night-acting",
      description: ["Chooses a player to steal an item from each night."],
    },
    //sacrificial roles
    Butterfly: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "When they die all players are reset to the role they had at the start of the game.",
      ],
    },
    Hunter: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "Chooses a player to kill when condemned by town during the day.",
      ],
    },
    Lightkeeper: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "Following their death, causes an eclipse during the day",
        "During an eclipse all speech and votes are anonymous.",
      ],
    },
    Schoolmarm: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "If killed, all Village-aligned players convert to Villager.",
      ],
    },
    Secretary: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "If killed at night, voting is completely disabled the next day.",
      ],
    },
    Sheep: {
      alignment: "Village",
      category: "Sacrificial",
      newlyAdded: true,
      description: ["If one Sheep dies, all Sheep die."],
    },
    Turncoat: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "When killed by the Mafia, will turn into a Traitor instead.",
      ],
    },
    Typist: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "On the day following their death, all votes will be anonymous.",
      ],
    },
    Virgin: {
      alignment: "Village",
      category: "Sacrificial",
      description: [
        "If condemned by the village, no one will die the following night.",
        "If visited by Hooker, gets turned into Villager.",
      ],
    },
    //voting roles
    Attorney: {
      alignment: "Village",
      category: "Voting",
      description: ["Vote weight is worth 2 votes in day meeting."],
    },
    Governor: {
      alignment: "Village",
      category: "Voting",
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation.",
        "Choosing no one or the original target preserves the Governor's override ability.",
      ],
    },
    King: {
      alignment: "Village",
      category: "Voting",
      description: [
        "Village meeting vote overrides other voters and determines condemnation.",
      ],
    },
    Kingmaker: {
      alignment: "Village",
      category: "Voting",
      description: [
        "Gives out a sceptre each night.",
        "Sceptres give the player final say in the village vote for one turn.",
      ],
    },
    Troublemaker: {
      alignment: "Village",
      category: "Voting",
      description: [
        "Once per game during the day, can force the next night phase to skip and two day phases to occur consecutively.",
      ],
    },
    Whistleblower: {
      alignment: "Village",
      category: "Voting",
      description: [
        "Every night, chooses one player and prevents them from voting and from being voted.",
        "Cannot blow the whistle on themselves.",
      ],
    },
    //manipulative roles
    Coward: {
      alignment: "Village",
      category: "Manipulative",
      description: [
        "Each night, chooses one player to redirect all visitors to.",
      ],
    },
    Chauffeur: {
      alignment: "Village",
      category: "Manipulative",
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be role blocked.",
      ],
    },
    Monkey: {
      alignment: "Village",
      category: "Manipulative",
      description: [
        "Copies the actions of a player and performs them on another player each night.",
      ],
    },
    Trickster: {
      alignment: "Village",
      category: "Manipulative",
      description: [
        "Gives out an item each night to a random player.",
        "The item can be a Gun, Knife, Armor, Whiskey, or Crystal.",
        "The item has a 50% chance to be Cursed.",
        "Cursed items will misfire or be otherwise ineffective.",
      ],
    },
    //meeting roles
    Capybara: {
      alignment: "Village",
      category: "Meeting",
      description: [
        "Chooses a player to invite to a hot springs relaxation by giving them a Yuzu Orange each night.",
        "When holding a Yuzu Orange, player can choose during the day to anonymously meet with the Capybara and other Yuzu Orange holders the following night.",
        "Multiple Capybaras share a night meeting.",
      ],
    },
    Chef: {
      alignment: "Village",
      category: "Meeting",
      description: [
        "Chooses two players during the day to attend a banquet the following evening.",
        "Players chosen to attend the banquet meet anonymously with their roles revealed to one another.",
      ],
    },
    Freemason: {
      alignment: "Village",
      category: "Meeting",
      description: [
        "Converts one player into a Freemason each night.",
        "Shares a night meeting with other Freemasons.",
        "All Freemasons die if they attempt to convert a member of the Mafia.",
        "Attempting to convert a Whig into a Freemason will fail.",
        "All Cultists die if targeted by a Freemason meeting.",
      ],
    },
    "Invisible Man": {
      alignment: "Village",
      category: "Meeting",
      description: [
        "Chooses one player during the day to follow at night.",
        "Views all messages from that player's meetings that night.",
      ],
    },
    Matron: {
      alignment: "Village",
      category: "Meeting",
      description: [
        "Passively invites visitors to the common room, where  they share a meeting.",
      ],
    },
    Templar: {
      alignment: "Village",
      category: "Meeting",
      description: ["Shares a night meeting with other Templars."],
    },
    //reflexive roles
    Apothecary: {
      alignment: "Village",
      category: "Reflexive",
      description: [
        "When visited, cleanses all effects currently possessed by the visiting player.",
      ],
    },
    Clinician: {
      alignment: "Village",
      category: "Reflexive",
      description: ["When visited, heals the visiting player."],
    },
    Dreamer: {
      alignment: "Village",
      category: "Reflexive",
      description: [
        "Dreams about 3 players, at least one of whom is Mafia, Cult, or Hostile; or about 1 player who is Village aligned.",
        "Does not dream if visited at night.",
      ],
    },
    Farmer: {
      alignment: "Village",
      category: "Reflexive",
      description: [
        "When visited, gives a loaf of bread to each visitor.",
        "Starts a famine when present in the game.",
      ],
    },
    Painter: {
      alignment: "Village",
      category: "Reflexive",
      description: [
        "Paints portraits of their visitors every night.",
        "Upon their death, the portraits will be unveiled in a grand auction.",
      ],
    },
    Priest: {
      alignment: "Village",
      category: "Reflexive",
      description: ["Learns the roles of those who visited them."],
    },
    //killing roles
    Firebrand: {
      alignment: "Village",
      category: "Killing",
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
    },
    Granny: {
      alignment: "Village",
      category: "Killing",
      description: [
        "Kills all players who visit during the night.",
        "Cannot be killed or converted at night.",
        "Can only be killed by village condemnation.",
      ],
    },
    Jailer: {
      alignment: "Village",
      category: "Killing",
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
    },
    Seeker: {
      alignment: "Village",
      category: "Killing",
      description: [
        "Attempts to guess the identity of the Hider each night.",
        "Kills the Hider if guess is correct.",
      ],
    },
    Trapper: {
      alignment: "Village",
      category: "Killing",
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Preferentially kills Mafia, Cult, Independents, Hostiles, then Villagers.",
        "Other visitors will learn the identity of the Trapper.",
      ],
    },
    Vigilante: {
      alignment: "Village",
      category: "Killing",
      description: ["Kills one player each night."],
    },
    //speaking roles
    Agent: {
      alignment: "Village",
      category: "Speaking",
      description: [
        "Can anonymously contact any non-Village role during the day.",
      ],
    },
    Medium: {
      alignment: "Village",
      category: "Speaking",
      description: [
        "Holds a seance with a dead player once per night.",
        "Identity is not revealed to the dead player.",
      ],
      graveyardParticipation: "all",
    },
    Mourner: {
      alignment: "Village",
      category: "Speaking",
      description: [
        "Can ask players in the graveyard a question every night.",
        "The players can answer with yes or no.",
        "The mourner will receive the results of the vote.",
      ],
      graveyardParticipation: "all",
    },
    "Town Crier": {
      alignment: "Village",
      category: "Speaking",
      description: ["Can anonymously broadcast messages during the day."],
    },
    //essential roles
    President: {
      alignment: "Village",
      category: "Essential",
      description: [
        "All villagers will know who the President is.",
        "When the President dies, the Mafia will win.",
      ],
    },
    Seer: {
      alignment: "Village",
      category: "Essential",
      description: [
        "Knows all of the Mafia and Cult at the start of the game.",
        "When condemned, Mafia and Cult have a chance to guess who the Seer is.",
        "On a correct guess, the Seer dies and the Mafia or Cult wins.",
        "Appears as villager on death.",
      ],
    },
    Senator: {
      alignment: "Village",
      category: "Essential",
      description: [
        "If half or more the number of Senators in play die, Mafia wins.",
      ],
    },
    Soldier: {
      alignment: "Village",
      category: "Essential",
      description: [
        "If the number of living Soldiers equals half of all living players, the Village wins.",
      ],
    },
    //linked roles
    Begum: {
      alignment: "Village",
      category: "Linked",
      featured: true,
      description: [
        "Is randomly paired up with another player.",
        "Learns who this player visits and is visited by each night.",
        "Can find out who this player is, at the cost of no longer receiving this info about their target.",
      ],
    },
    Mistress: {
      alignment: "Village",
      category: "Linked",
      featured: true,
      description: [
        "Once per game during the day, can open the door.",
        "The opening of the door will be publicly announced without revealing the identity of the Mistress.",
        "When the door is opened, they will learn the identity of an evil player, regardless of appearance, etc.",
        "Dies the next day if not visited that night by a town-aligned player.",
      ],
    },
    Suitress: {
      alignment: "Village",
      category: "Linked",
      featured: true,
      description: [
        "During the day, can make an anonymous proposal to another player.",
        "The player has to publicly accept or deny the proposal.",
        "Once a proposal is accepted, the Suitress cannot make another proposal.",
      ],
    },

    //Mafia
    Mafioso: {
      alignment: "Mafia",
      category: "Basic",
      description: ["Wins when the mafia outnumbers all other players."],
    },
    //basic roles
    Godfather: {
      alignment: "Mafia",
      category: "Basic",
      description: [
        "Leads the mafia kill each night.",
        "Appears as Villager to investigative roles.",
      ],
    },
    Gramps: {
      alignment: "Mafia",
      category: "Basic",
      description: [
        "Learns role of any player who visits them.",
        "Cannot be killed normally.",
      ],
    },
    Prosecutor: {
      alignment: "Mafia",
      category: "Basic",
      description: ["Vote weight is worth 2 votes in village meeting."],
    },
    Sniper: {
      alignment: "Mafia",
      category: "Basic",
      description: [
        "Starts with a gun.",
        "Gun does not reveal identity when fired.",
      ],
    },
    //killing roles
    Arsonist: {
      alignment: "Mafia",
      category: "Killing",
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
    },
    Caporegime: {
      alignment: "Mafia",
      category: "Killing",
      description: [
        "Gives the kiss of death to someone each night.",
        "Target will die if visited by a non-Mafia player that night.",
      ],
    },
    Hider: {
      alignment: "Mafia",
      category: "Killing",
      description: [
        "Attempts to guess the identity of the Seeker each night.",
        "Kills the Seeker if guess is correct.",
      ],
    },
    Hitman: {
      alignment: "Mafia",
      category: "Killing",
      description: ["Kills one player each night."],
    },
    Jinx: {
      alignment: "Mafia",
      category: "Killing",
      description: [
        "Curses a player with a forbidden word each night.",
        "If the player speaks the word the next day, they will die.",
      ],
    },
    Poisoner: {
      alignment: "Mafia",
      category: "Killing",
      description: [
        "Concocts a deadly poison and administers it to one player each night.",
        "The poisoned target will die at the end of the following night unless saved.",
      ],
    },
    Queen: {
      alignment: "Mafia",
      category: "Killing",
      description: [
        "If the Queen is the only mafia alive, they will declare a beheading.",
        "Once the beheading is declared, the entire town (except the Queen) will be obliterated at the end of the next phase.",
      ],
    },
    "Rottweiler": {
      alignment: "Mafia",
      category: "Killing",
      recentlyUpdated: true,
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Other visitors will learn the identity of the Rottweiler.",
      ],
    },
    Terrorist: {
      alignment: "Mafia",
      category: "Killing",
      description: [
        "Once per game, can rush at another player during the day, killing them both.",
      ],
    },
    //investigative roles
    Actress: {
      alignment: "Mafia",
      category: "Investigative",
      description: [
        "Visits a player to appears as their role.",
        "Learns chosen player's role.",
      ],
    },
    Bondsman: {
      alignment: "Mafia",
      category: "Investigative",
      description: [
        "Chooses a player and a role and learns if they are that role or not.",
      ],
    },
    Busybody: {
      alignment: "Mafia",
      category: "Investigative",
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
    },
    Caser: {
      alignment: "Mafia",
      category: "Investigative",
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
    },
    Informant: {
      alignment: "Mafia",
      category: "Investigative",
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
    },
    Lookout: {
      alignment: "Mafia",
      category: "Investigative",
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
    },
    Lurker: {
      alignment: "Mafia",
      category: "Investigative",
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    Revisionist: {
      alignment: "Mafia",
      category: "Investigative",
      newlyAdded: true,
      description: [
        "Each night, visits one dead player.",
        "Will receive all system messages the player ever received.",
      ],
    },
    Scout: {
      alignment: "Mafia",
      category: "Investigative",
      description: ["Tracks a player each night and learns who they visited."],
    },
    Stalker: {
      alignment: "Mafia",
      category: "Investigative",
      description: ["Stalks one player each night and learns their role."],
    },
    //unsorted
    Hooker: {
      alignment: "Mafia",
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Don: {
      alignment: "Mafia",
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation on a Mafia-aligned player.",
        "Choosing no one or the original target preserves the Don's override ability.",
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
        "Chooses one player every night.",
        "Chooses who the player will perform their actions on.",
      ],
    },
    Snitch: {
      alignment: "Mafia",
      description: [
        "Chooses one player every night to snitch on.",
        "Chooses another player to divert attention from and redirect their visitors to the first target.",
      ],
    },
    Ninja: {
      alignment: "Mafia",
      description: [
        "Does not get detected by watchers and trackers.",
        "Kills bomb without setting off the explosion.",
      ],
    },
    Vizier: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "While alive, the Mafia's kill is replaced with a Coronation meeting.",
        "One player is picked to be King for the next day. Their vote is the sole decider of the condemnation.",
        "The Vizier cannot pick the same player to be King twice in a row.",
        "Upon death, the Mafia reverts to killing.",
      ],
    },
    Santista: {
      alignment: "Mafia",
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
    Janitor: {
      alignment: "Mafia",
      description: [
        "Chooses to clean a mafia kill once per game.",
        "Player's role will be hidden from the town if kill is successful.",
        "Learns the cleaned player's role.",
      ],
    },
    Undertaker: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Chooses to clean a condemnation once per game.",
        "Player's role will be hidden from the town if condemnation is successful.",
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
    Tailor: {
      alignment: "Mafia",
      description: [
        "Gives out a suit each night that disguises the wearer's role identity.",
        "Suits can be selected from any role within the current game.",
      ],
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
      featured: true,
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
    Graverobber: {
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
    Illusionist: {
      alignment: "Mafia",
      description: [
        "Starts with a gun.",
        "Chooses one player each night to frame as the shooter of any guns or rifles shot by the Illusionist.",
      ],
    },
    Librarian: {
      alignment: "Mafia",
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
    Scrutineer: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
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
    Bookie: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Each night, predicts the village vote.",
        "If they successfully predict the village vote, they gain a bonus kill.",
      ],
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
    Quack: {
      alignment: "Mafia",
      description: ["Saves another player from dying each night."],
    },
    Homeopath: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
    },
    Enforcer: {
      alignment: "Mafia",
      description: [
        "Each night, counsels one player and heals their insanity.",
        "Prevents their target from being converted.",
        "If their target was a Hostile, the target will become a Traitor.",
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
        "Every night, can block all sent and received whispers of the target.",
      ],
    },
    Gossiper: {
      alignment: "Mafia",
      recentlyUpdated: true,
      description: [
        "Every night, can make a player leaky the next day.",
        "Leaky players will always read their whispers aloud.",],
    },
    Paralyzer: {
      alignment: "Mafia",
      description: [
        "Once per game, can paralyze votes in the village meeting. Players are not able to unvote.",
      ],
    },
    Electrician: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Once per game, can cause an eclipse during the day.",
        "During an eclipse all speech and votes are anonymous.",
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
        "Each night, visits one player.",
        "Village roles convert to Villager. Cult roles convert to CUltist. Independent and Hostile roles convert to Grouch.",
      ],
    },
    Prizefighter: {
      alignment: "Mafia",
      description: [
        "Each night, converts another Mafia teammate into a random Mafia-aligned role.",
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
    Rat: {
      alignment: "Mafia",
      description: [
        "Each night, chooses one player to redirect all visitors to.",
      ],
    },
    Cannoneer: {
      alignment: "Mafia",
      description: [
        "Will gain a gun once per game if Mafia chose to abstain from killing the previous night.",
        "Gun will always reveal the shooter.",
      ],
    },
    Imposter: {
      alignment: "Mafia",
      newlyAdded: true,
      description: [
        "Chooses a role each night to imitate.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
    },

    //Cult
    Werewolf: {
      alignment: "Cult",
      description: [
        "Each night, bites a non-Cult player and turns them into a Lycan.",
        "Lycans retain their original roles, but they unknowingly kill a random non-Cult player on full moons.",
        "Invincible during full moons, except for when visiting the Apothecary.",
      ],
    },
    Witch: {
      alignment: "Cult",
      description: [
        "Chooses one player to control.",
        "Chooses who that player will perform their actions on.",
        "Redirection cannot be role blocked.",
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
    Necromancer: {
      alignment: "Cult",
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's role identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      graveyardParticipation: "all",
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
      description: [
        "Chooses a player each night.",
        "If that player was targeted by a kiling role, that player is saved and converts to Cultist.",
        "All Cultists die if the Witch Doctor dies.",
      ],
    },
    Freischütz: {
      alignment: "Cult",
      description: [
        "Gives out a magic gun each night.",
        "If a player not aligned with the Cult is shot, they will survive and convert to Cultist.",
        "If a player aligned with the Cult is shot, they will be killed.",
        "The gunned player does not know if the gun is a magic gun.",
      ],
    },
    Gremlin: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Once per night, corrupts the target's gun(s) into magic guns that convert their targets into Cultists.",
      ],
    },
    Doomsayer: {
      alignment: "Cult",
      description: [
        "Converts all players who visit during the night.",
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
        "The first player is killed while the second player gains an extra life.",
      ],
    },
    Changeling: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Each night, converts another Cult teammate into a random Cult-aligned role.",
      ],
    },
    Bogeyman: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Pays a visit to another player at night.",
        "Annoyingly, this visit has no effect.",
        "Cult roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Imp: {
      alignment: "Cult",
      newlyAdded: true,
      description: [
        "Each night, chooses one player to redirect all visitors to.",
      ],
    },

    //Independent
    Fool: {
      alignment: "Independent",
      description: [
        "Fools around at night, visiting another player with no effect.",
        "Wins if condemned by the town.",
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
        "Wins if shot and killed with a gun.",
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
        "Cannot win the game as Amnesiac.",
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
        "Cannot win the game as Old Maid.",
      ],
    },
    Traitor: {
      alignment: "Independent",
      description: [
        "Wins with Mafia.",
        "Does not count towards mafia win count.",
      ],
    },
    Clown: {
      alignment: "Independent",
      recentlyUpdated: true,
      description: [
        "Clowns around at night, visiting another player. The visit does nothing.",
        "The Mafia will be alerted that there is a Clown they must condemn in order to win.",
        "Wins with Mafia if they are condemned and the Mafia wins.",
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
    "Panda Bear": {
      alignment: "Independent",
      featured: true,
      description: [
        "Walks around at night, visiting another player with no effect.",
        "When present in the game, the Village cannot win unless the Panda Bear visits another Panda Bear and they mate.",
        "Wins instead of Village if the Panda Bears survive without mating.",
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
      featured: true,
      description: [
        "Falls in love with another player once per game.",
        "Both players die if either of them are killed.",
        "Wins if both players survive until the end of the game.",
      ],
    },
    Prophet: {
      alignment: "Independent",
      description: [
        "Once per game, predicts which day/night cycle the game will end on.",
        "Wins if guess is correct.",
      ],
    },
    Fatalist: {
      alignment: "Independent",
      newlyAdded: true,
      description: [
        "Once per game, predicts which day/night cycle they will be killed on.",
        "Wins if guess is correct.",
      ],
    },
    Doppelgänger: {
      alignment: "Independent",
      newlyAdded: true,
      description: [
        "Must visit one player during the first night to ally with.",
        "Copies the actions of their ally and performs them on another player every night after the first",
        "Wins instead of their ally if alive when they would win.",
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
      recentlyUpdated: true,
      description: [
        "Chooses a player to kill once during the night and convert to their role.",
        "The killed player will have their role hidden upon death, and instead reveal as their alignment.",
        "Cannot win the game as Phantom.",
      ],
    },
    Prince: {
      alignment: "Independent",
      newlyAdded: true,
      description: [
        "Once per game, visits a player and joins their alignment.",
        "If the Prince dies, everyone of that alignment dies.",
        "Wins if their chosen alignment wins.",
      ],
    },
    Nomad: {
      alignment: "Independent",
      recentlyUpdated: true,
      description: [
        "Must visit another player every night.",
        "Cannot choose the same player consecutively.",
        "Wins if they are alive when the last player they visited wins.",
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
        "Cannot be added to ranked or competitive games",
      ],
    },
    Siren: {
      alignment: "Independent",
      description: [
        "Beckons a player each night.",
        "If the beckoned player visits the Siren that night, the player dies.",
        "Wins if successfully kills two players.",
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
    Astrologer: {
      alignment: "Independent",
      featured: true,
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
    Warlock: {
      alignment: "Independent",
      recentlyUpdated: true,
      description: [
        "Each night chooses one person.",
        "If that person is condemned the next day, the Warlock has predicted correctly.",
        "The Warlock wins if they predict the condemnation correctly twice.",
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
      description: [
        "Will become the guardian angel for one player in the game.",
        "Once per game while alive or dead, can turn on sacrificial powers and protect their target from all kills",
        "Wins if their target is alive at the end of the game.",
      ],
    },
    Emperor: {
      alignment: "Independent",
      newlyAdded: true,
      description: [
        "Chooses two players each night to force into a duel.",
        "During the following day, only the two duelists may be voted.",
        "Must predict during the sunrise which duelist will survive.",
        "Wins if they predict correctly twice.",
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
      featured: true,
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
    Pyromaniac: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
        "Wins if among last two alive.",
      ],
    },
    Dentist: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Gasses one player with anesthetic each night.",
        "If that player acts the next night, they die.",
        "Anesthetic attack can be cured by not acting.",
        "Wins if among last two alive.",
      ],
    },
    Hellhound: {
      alignment: "Hostile",
      description: [
        "Chooses to hunt at night by choosing a player and guessing their role.",
        "If guessed correct, becomes immortal for the following day.",
        "If guessed incorrect, identity will be revealed to all.",
        "Wins if among the last two alive.",
      ],
    },
    Shinigami: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "At the beginning of the game, one player randomly receives a notebook.",
        "That player can kill during the night.",
        "The holder of the notebook must pass it to another player each day.",
        "The Shinigami guesses the current holder of the notebook each night. If they guess correctly once, they win.",
      ],
    },
    Ripper: {
      alignment: "Hostile",
      description: [
        "Kills one player every night.",
        "Wins when all other hostile third parties are dead.",
      ],
    },
    Blob: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Absorbs one person each night, killing them and cleaning their deaths.",
        "Absorbed players may speak amongst themselves inside of the Blob.",
        "For each absorbed player, the Blob gains an extra life.",
        "Upon death, everyone absorbed by the Blob is regurgitated.",
        "Wins if among the last two alive.",
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
      featured: true,
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
        "If it finds another Leprechaun, will kill them and steal all their items.",
        "Wins if holding three four-leaf clovers.",
      ],
    },
    Anarchist: {
      alignment: "Hostile",
      description: [
        "Gives out a timebomb each night.",
        "The timebomb can be passed around during the day, randomly exploding.",
        "Wins if two players die to the timebomb given out by them, or they are among the last two alive.",
        "Timebomb reveals Anarchist when exploded on themself.",
      ],
    },
    Communist: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Visits one player each night.",
        "Turns that player into their alignment's vanilla role.",
        "Wins if alive when all other players are vanilla.",
      ],
    },
    Gambler: {
      alignment: "Hostile",
      description: [
        "Each night, challenges a player to a game of Rock, Paper, Scissors. Game is played during the day.",
        "If the Gambler wins, the Challenger dies.",
        "Wins the game when they have 2 gamble wins, or are among the last two standing.",
      ],
    },
    "Grizzly Bear": {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Visits one player each night.",
        "Any player to visit the Grizzly Bear's target will be killed. If the Grizzly Bear's target does not visit that night, they will be killed as well.",
        "Wins if among last two alive.",
      ],
    },
    "Polar Bear": {
      alignment: "Hostile",
      description: [
        "Visits two players each night, polarising them.",
        "A polarised player visiting another polarised player will kill both of them.",
        //"If visited by a Penguin, will eat it.",
        "Wins if four polarised players die or if majority is attained.",
      ],
    },
    Snowman: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Each night, may declare a snowball fight.",
        "Half of all players will receive a snowball.",
        "Throwing a snowball at someone freezes them.",
        "A frozen player cannot vote or take any action at night. To be unfrozen, they must be visited by another player.",
        "Wins if all living players have been frozen.",
      ],
    },
    Judge: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Can anonymously broadcast messages during the day.",
        "Twice per game, may declare a court session.",
        "During court, all players but the Judge speak and vote anonymously as the jury.",
        "The Judge's vote counts for three.",
        "Wins among the last two standing.",
      ],
    },
    Diviner: {
      alignment: "Hostile",
      newlyAdded: true,
      description: [
        "Each night, predicts the village vote.",
        "If guessed correct, they will become immortal for the following day.",
        "While immortal, their previous night's target will be killed/condemned in their place.",
        "Wins if the last one standing.",
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
        "Knows the alignment of all spies.",
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
      description: ["Can choose a word.", "Can guess another player's word."],
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
      description: ["Appears as Fascist if investigated."],
    },
  },
  "Secret Hitler": {},
  "Wacky Words": {
    Player: {
      alignment: "Town",
      description: ["Can answer prompts and vote for answers."],
    },
    Alien: {
      alignment: "Town",
      description: [
        "Can answer prompts and vote for answers.",
        "Turns game into a reverse game, where players create prompts to answer responses.",
      ],
    },
    Neighbor: {
      alignment: "Town",
      description: [
        "Can answer prompts and vote for answers.",
        "Turns game into a Wacky People game, where players answer personal questions.",
      ],
    },
  },
};

module.exports = roleData;
