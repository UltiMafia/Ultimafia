const roleData = {
    "Mafia": {
        //Village
        "Villager": {
            alignment: "Village",
            description: [
                "Wins when no mafia or malevolent independents remain.",
                "Other roles appear as Villager to investigative roles, upon death, and to themself."
            ],
        },
        "Doctor": {
            alignment: "Village",
            description: [
                "Saves another player from dying each night.",
            ],
        },
        "Gunsmith": {
            alignment: "Village",
            description: [
                "Gives out a gun each night."
            ],
        },
        "Cop": {
            alignment: "Village",
            description: [
                "Investigates one player each night and learns their alignment.",
                "Multiple cops share a night meeting.",
                "Some other roles appear as Cop to themself."
            ],
        },
        "Insane Cop": {
            alignment: "Village",
            description: [
                "Investigates one player each night and learns their alignment (alignment will be reversed).",
                "Appears as normal cop upon death.",
                "Multiple insane cops share a night meeting."
            ],
        },
        "Naive Cop": {
            alignment: "Village",
            description: [
                "Investigates one player each night and learns their alignment (alignments will always appear innocent).",
                "Appears as normal cop upon death.",
                "Multiple naive cops share a night meeting."
            ],
        },
        "Paranoid Cop": {
            alignment: "Village",
            description: [
                "Investigates one player each night and learns their alignment (alignments will always appear guilty).",
                "Appears as normal cop upon death.",
                "Multiple paranoid cops share a night meeting."
            ],
        },
        "Oracle": {
            alignment: "Village",
            description: [
                "Chooses one player each night whose role will be revealed upon death."
            ],
        },
        "Vigilante": {
            alignment: "Village",
            description: [
                "Kills one player each night."
            ],
        },
        "Detective": {
            alignment: "Village",
            description: [
                "Investigates one player each night and learns their role.",
            ],
        },
        "Drunk": {
            alignment: "Village",
            description: [
                "Visits one player each night and blocks them from performing any night actions.",
                "Some actions cannot be blocked."
            ],
        },
        "Blacksmith": {
            alignment: "Village",
            description: [
                "Gives out armor to one player each night.",
                "Armor blocks a single attack."
            ],
        },
        "Hunter": {
            alignment: "Village",
            description: [
                "Chooses a player to kill when executed by town during the day."
            ],
        },
        "Watcher": {
            alignment: "Village",
            description: [
                "Watches a player each night and learns who visited them.",
                "Doesn't visit its target."
            ],
        },
        "Tracker": {
            alignment: "Village",
            description: [
                "Tracks a player each night and learns who they visited.",
            ],
        },
        "Governor": {
            alignment: "Village",
            description: [
                "Overrides village execution once per game.",
                "Cannot cancel a village execution." ,
                "Choosing no one or the original target preserves the governor's override ability."
            ],
        },
        "Monkey": {
            alignment: "Village",
            description: [
                "Steals the actions of a player to do for themselves each night.",
                "The action stolen can be blocked.",
                "Steal cannot be blocked." ,
                
            ],
        },
        "Seeker": {
            alignment: "Village",
            description: [
                "Attempts to guess the identity of the Spy each night.",
                "Kills the Spy if guess is correct."
            ],
        },
        "Sheriff": {
            alignment: "Village",
            description: [
                "Starts with a gun.",
                "This gun always reveals the sheriff when shot."
            ],
        },
        "Deputy": {
            alignment: "Village",
            description: [
                "Starts with a gun.",
                "This gun never reveals the deputy when shot."
            ],
        },
        "Bulletproof": {
            alignment: "Village",
            description: [
                "Starts with armor.",
                "Armor blocks a single attack."
            ],
        },
        "Bomb": {
            alignment: "Village",
            description: [
                "Starts with a bomb.",
                "Bomb goes off when player is killed, targeting the attacker.",
                "Bomb does not go off when executed by village.",
            ],
        },
        "Village Idiot": {
            alignment: "Village",
            description: [
                "Sees all speech as coming from random people.",
                "Appears as Villager to self."
            ],
        },
        "Medic": {
            alignment: "Village",
            description: [
                "Saves one player from dying each night.",
                "Can save self."
            ],
        },
        "Granny": {
            alignment: "Village",
            description: [
                "Kills all players who visit during the night.",
                "Cannot be killed or converted at night.",
                "Can only be killed by village execution."
            ],
        },
        "Templar": {
            alignment: "Village",
            description: [
                "Shares a night meeting with other Templars."
            ],
        },
        "Miller": {
            alignment: "Village",
            description: [
                "Appears as Villager to self.",
                "Appears as Mafioso to investigative roles.",
                "Appears as Mafioso upon being executed.",
                "Appears as Miller upon being killed.",
            ],
        },
        "Celebrity": {
            alignment: "Village",
            description: [
                "Identity is publicly revealed to all players at the start of the game.",
            ],
        },
        "Priest": {
            alignment: "Village",
            description: [
                "Cleanses werewolves when visited by them.",
                "Kills Lycan when visited by them."
            ],
        },
        "Mason": {
            alignment: "Village",
            description: [
                "Converts one player into a Mason each night.",
                "Shares a night meeting with other Masons.",
                "All Masons die if they attempt to convert a member of the Mafia.",
            ],
        },
        "Jailer": {
            alignment: "Village",
            description: [
                "Chooses a player to jail each day meeting.",
                "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings.",
                "Decides whether or not the prisoner should be executed.",
            ],
        },
        "Agent": {
            alignment: "Village",
            description: [
                "Can anonymously contact any non-Village role during the day.",
            ],
        },
        "Funsmith": {
            alignment: "Village",
            description: [
                "Gives out a gun each night.",
                "Gives out a gun to all visitors at night.",
            ],
        },
        "Town Crier": {
            alignment: "Village",
            description: [
                "Can anonymously broadcast messages during the day.",
            ],
        },
        "Capybara": {
            alignment: "Village",
            description: [
                "Chooses a player to invite to a hot springs relaxation by giving them a Yuzu OrangeZ each night.",
                "When holding a Yuzu OrangeZ, player can choose during the day to anonymously meet with the Capybara and other Yuzu OrangeZ holders the following night.",
                "Multiple Capybaras share a night meeting.",
            ],
        },
        "Neighbor": {
            alignment: "Village",
            description: [
                "Chooses a player each night to reveal their identity as neighbor.",
            ],
        },
        "Nurse": {
            alignment: "Village",
            description: [
                "Saves one player each night from dying and blocks them from performing night actions.",
                "Cannot save self."
            ],
        },
        "Surgeon": {
            alignment: "Village",
            description: [
                "Each night, operates on one player to prevent them from dying or being converted.",
                "If attacked, kills one of their killers",
            ],        
        },
        "Commuter": {
            alignment: "Village",
            description: [
                "Blocks all visitors during the night from performing any actions.",
            ],
        },
        "Caroler": {
            alignment: "Village",
            description: [
                "Sings a carol to a player about 3 people, at least one of whom is Mafia aligned.",
                "The carol is not heard if the player chosen visits at night.",
                "Cannot choose same the player consecutively.",
            ],
        },
        "Dreamer": {
            alignment: "Village",
            description: [
                "Dreams about 3 people, at least one of whom is Mafia aligned, or about 1 person who is Village aligned.",
                "Does not dream if visited at night.",
            ],
        },
        "Chef": {
            alignment: "Village",
            description: [
                "Chooses two players during the day to attend a banquet the following evening.",
                "Players chosen to attend the banquet meet anonymously with their roles revealed to one another.",
            ],
        },
        "Journalist": {
            alignment: "Village",
            description: [
                "Chooses a player each night and views any reports they receive the following day."
            ],
        },
        "Cutler": {
            alignment: "Village",
            description: [
                "Gives out a knife each night.",
                "Knives can be used to attack a player during the day and will result in that players death the following day."
            ],
        },
        "Snowman": {
            alignment: "Village",
            description: [
                "Gives out a snowball each night.",
                "Snowballs can be thrown at a player during the day and will block their actions the following night.",
                "Snowballs thrown at the Snowman will have no effect."
            ],
        },
        "Snoop": {
            alignment: "Village",
            description: [
                "Visits a player each night and learns what items they are carrying.",
            ],
        },
        "Justice": {
            alignment: "Village",
            description: [
                "Investigates two players at night and learns if they share an alignment."
            ],
        },
        "Invisible Man": {
            alignment: "Village",
            description: [
                "Chooses one player during the day to follow at night.",
                "Views all messages from that player's meetings that night.",
                ],
        },
        "Cyclist": {
            alignment: "Village",
            description: [
                "Chooses two players, A and B, each night.",
                "Players who visit A will be redirected to B.",
                "Players who visit B will be redirected to A.",
                "Redirection cannot be role blocked."
            ],
        },
        "Sapling": {
            alignment: "Village",
            description: [
                "Chooses whether or not to grow into a tree at night.",
                "Tree is immune to most ways of dying.",
                "Tree cannot vote."
                ],
        },
        "Tree": {
            alignment: "Village",
            disabled: true,
            description: [
                "Tree is immune to most ways of dying.",
                "Tree cannot vote."
                ],
        },
        "Baker": {
            alignment: "Village",
            description: [
                "When baker is present in the game, all players start with two breads.",
                "Gives out up to two breads each night.",
                "If all bakers die, a famine will start."
            ],
        },
        "Virgin": {
            alignment: "Village",
            description: [
                "If executed by the village, no one will die the following night.",
            ],
        },
        "Mimic": {
            alignment: "Village",
            description: [
                "Chooses a player at night and attempt to mimic their role.",
                "If player is town, mimic steals their role and that player becomes a villager.",
                "If player is mafia, mimic becomes villager.",
                "If player is independent or monster, mimic becomes amnesiac."
            ],
        },
        "Judge": {
            alignment: "Village",
            description: [
                "Vote weight is worth 2 votes in day meeting."
            ],
        },
        "Party Host": {
            alignment: "Village",
            description: [
                "Chooses to host a party during day meeting for everyone to attend once per game on the following night.",
                "Everyone will share a party meeting at night."
            ],
        },
        "Loudmouth": {
            alignment: "Village",
            description: [
                "If visited, cries out the identity of players who visited them during the night.",
                "Appears as villager to self.",
                "Immune to silencing."
            ],
        },      
        "Ghost": {
            alignment: "Village",
            description: [
                "Appears as villager to self, until dead.",
                "Once dead, chooses to block one player each night."
            ],
            graveyardParticipation: "self",
        },
        "Lightkeeper": {
            alignment: "Village",
            description: [
                "Following their death, causes an eclipse during the day",
                "During an eclipse all speech and votes are anonymous."
            ],
        },
        "Leader": {
            alignment: "Village",
            description: [
                "On the day following their death, all votes will be anonymous",
            ],
        },
        "Resurrectionist": {
            alignment: "Village",
            description: [
                "Visits a dead player during the night once per game.",
                "That player will be resurrected the following day.",
                "If player's identity was revealed upon death, they will remain revealed when resurrected."
            ],
            graveyardParticipation: "all",
        },
        "Trickster": {
            alignment: "Village",
            description: [
                "Gives out an item each night to a random player.",
                "The item can be a Gun, Knife, Armor, Snowball, or Crystal.",
                "The item has a 50% chance to be Cursed.",
                "Cursed items will misfire or be otherwise ineffective.",
                "Appears as Villager to self."
            ],
        },
        "Medium": {
            alignment: "Village",
            description: [
                "Holds a seance with a dead player once per night.",
                "Identity is not revealed to the dead player."
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
        "Enchantress": {
            alignment: "Village",
            description: [
                "Gives out a crystal to a player during the night, once per game.",
                "Crystals reveal the chosen player's role identity upon the holder's death."
            ],
        },
        "Forager": {
            alignment: "Village",
            description: [
                "Forages for an item if not visited by anyone during the night.",
                "Foraged item can be a Gun, Knife, Armor, Crystal or Snowball.",
            ],
        },
        "Mortician": {
            alignment: "Village",
            description: [
                "Chooses to visit a dead player at night and learns their role identity."
            ],
        },
        "Mourner": {
            alignment: "Village",
            description: [
                "Can ask players in the graveyard a question every night.",
                "The players can answer with yes or no.",
                "The mourner will receive the results of the vote.",
            ],
            graveyardParticipation: "all",
        },
        "Santa": {
            alignment: "Village",
            description: [
                "Visits a player each night to learn their role alignment.",
                "If not visited during the night, will learn whether that player is naughty or nice.",
                "Gives out a Gun, Knife, Armor, Crystal, Snowball, or Bread, each night."
            ],
        },
        "Tinkerer": {
            alignment: "Village",
            description: [
                "Crafts a gun if not visited during the night.",
                "If killed, the killer will find a gun that always reveals.",
            ],
        },
        "King": {
            alignment: "Village",
            description: [
                "Vote overrides others in village meeting.",
                "Appears as Villager to self."
            ],
        },
        "Bride": {
            alignment: "Village",
            description: [
                "During the day, can make an anonymous proposal to another player.",
                "The player has to publicly accept or deny the proposal.",
                "Once a proposal is accepted, the Bride cannot make another proposal."
            ],
        },
        "Sleepwalker": {
            alignment: "Village",
            description: [
                "Visits a random player each night.",
                "Appears as Villager to self.",
            ],
        },
        "Messenger": {
            alignment: "Village",
            description: [
                "Sends an anonymous message to a player of choice during the night.",
            ],
        },
        "Visitor": {
            alignment: "Village",
            description: [
                "Pays a visit to another player at night.",
                "Annoyingly, this visit has no effect.",
                "Town roles with the Scatterbrained modifier appear as this role to self."
            ],
        },
        "Waitress": {
            alignment: "Village",
            description: [
                "Visits a player and blocks them from performing actions at night.",
                "Steals any items they are holding.",
            ],
        },
        "Crafter": {
            alignment: "Village",
            description: [
                "Gives out a Gun, Knife, Armor, Crystal, or Snowball, or a Cursed version of any of these items each night.",
            ],
        },
        "Keymaker": {
            alignment: "Village",
            description: [
                "Gives out a key to one player each night."
            ],
        },
        "Fabulist": {
            alignment: "Village",
            description: [
                "Composes a fake system message, given to a player of their choice, at night.",
            ],
        },
        "Samurai": {
            alignment: "Village",
            description: [
                "Cannot be converted.",
                "Kills anyone who tries to convert them at night.",
                "Can kill a maximum of 2 people",
            ],
        },
        "President": {
            alignment: "Village",
            description: [
                "All villagers will know who president is.",
                "When President dies, all villagers will die.",
                ],
        },
        "Gunslinger": {
            alignment: "Village",
            description: [
                "When shot, has an 80% chance of surviving and stealing the gun.",
            ],
        },
        "Bodyguard": {
            alignment: "Village",
            description: [
                "Guards one person every night",
                "If the target was attacked, the Bodyguard will kill one attacker and die.",
                "If the target was the Celebrity, the Bodyguard will kill all attackers and die."
            ],        
        },
        "Penguin": {
            alignment: "Village",
            description: [
                "Each night, waddles up to someone to tell them a secret.",
            ],        
        },
        "Butterfly": {
            alignment: "Village",
            description: [
                "When they die all players are reset to the role they had at the start of the game.",
            ],        
        },
        "Comedian": {
            alignment: "Village",
            description: [
                "Each night, tells a joke about 3 roles in the game, and a person who is in the joke.",
            ],        
        },
        "Trapper": {
            alignment: "Village",
            description: [
                "Each night, visits one player and kills one of their visitors.",
                "Preferentially kills Mafia, Monsters, Independents then Villagers.",
                "Other visitors will learn the identity of the Trapper.",
            ],        
        },
        "Pathologist": {
            alignment: "Village",
            description: [
                "Each night, visits one dead player.",
                "Will receive all system messages the player ever received."
            ],        
        },
        "Gallis": {
            alignment: "Village",
            description: [
                "Appears to self as Villager.",
                "When the gallis receives the majority of the Village vote, it will not get executed.",
                "Will get frustrated and die if it has a non-zero minority Village vote.",
            ],        
        },
        "Demolitionist": {
            alignment: "Village",
            description: [
                "Gives out bomb to one player each night.",
                "The bomb will kill any attacker, but will be deactivated the night next.",
            ],        
        },
        "Psychic": {
            alignment: "Village",
            description: [
                "Each night, reads the mind of someone and learn their true alignment.",
                "Will learn nothing if disturbed at night.",
            ],        
        },
        "Shrink": {
            alignment: "Village",
            description: [
                "Each night, counsels one person and heals their insanity.",
                "Prevents their target from being converted.",
                "If their target was a Serial Killer, the target will become a Villager.",
            ],        
        },
        "Turncoat": {
            alignment: "Village",
            description: [
                "Appears as Villager to self.",
                "When killed by the Mafia, will turn into a Traitor instead.",
            ],        
        },
        "Chandler": {
            alignment: "Village",
            description: [
                "Gives out a candle to one player each night.",
                "The candle allows the player to see all their visitors.",
            ],        
        },

        //Mafia
        "Mafioso": {
            alignment: "Mafia",
            description: [
                "Wins when the mafia outnumbers all other players.",
            ],
        },
        "Poisoner": {
            alignment: "Mafia",
            description: [
                "Concocts a deadly poison and administers it to one person each night.",
                "The poisoned target will die at the end of the following night unless saved.",
            ],
        },
        "Stalker": {
            alignment: "Mafia",
            description: [
                "Stalks one person each night and learns their role.",
            ],
        },
        "Hooker": {
            alignment: "Mafia",
            description: [
                "Blocks a player each night from performing any actions.",
            ],
        },
        "Godfather": {
            alignment: "Mafia",
            description: [
                "Leads the mafia kill each night.",
                "Appears as Villager to investigative roles.",
            ],
        },
        "Driver": {
            alignment: "Mafia",
            description: [
                "Chooses two players, A and B, each night.",
                "Players who visit A will be redirected to B.",
                "Players who visit B will be redirected to A.",
                "Redirection cannot be roleblocked."
            ],
        },
        "Inquisitor": {
            alignment: "Mafia",
            description: [
                "Attempts to guess the identity of the Agent each night.",
                "Kills the Agent if guess is correct."
            ],
        },
        "Ninja": {
             alignment: "Mafia",
             description: [
                 "Does not get detected by watchers and trackers.",
                 "Kills bomb without setting off the explosion."
         
            ],
        },
        "Lawyer": {
            alignment: "Mafia",
            description: [
                "Chooses a fellow mafia member each night to appear as a Villager to investigative roles."
            ],
        },
        "Disguiser": {
            alignment: "Mafia",
            description: [
                "Chooses to steal the identity of the Mafia kill each night.",
                "Cannot be targeted while disguised as another player."
            ],
        },
        "Sniper": {
            alignment: "Mafia",
            description: [
                "Starts with a gun.",
                "Gun does not reveal identity when fired.",
                "Does not attend the Mafia meeting."
            ],
        },
        "Janitor": {
            alignment: "Mafia",
            description: [
                "Chooses to clean a mafia kill once per game.",
                "Player's role will be hidden from the town if kill is successful.",
                "Learns the cleaned player's role.",
            ],
        },
        "Spy": {
            alignment: "Mafia",
            description: [
                "Can anonymously contact any role during the day.",
            ],
        },
        "Associate": {
            alignment: "Mafia",
            description: [
                "Gives out a gun each night.",
                "Gun will only kill the target if not aligned with the Mafia.",
            ],
        },
        "Gramps": {
            alignment: "Mafia",
            description: [
                "Learns role of any player who visits him.",
                "Cannot be killed normally."
            ],
        },
        "Lookout": {
            alignment: "Mafia",
            description: [
                "Watches a player each night and learns who visited them.",
                "Doesn't visit its target."
            ],
        },
        "Scout": {
            alignment: "Mafia",
            description: [
                "Tracks a player each night and learns who they visited.",
            ],
        },
        "Arsonist": {
            alignment: "Mafia",
            description: [
                "Douses one player with Gasoline each night.",
                "Chooses to light a match during the day to burn doused players to ashes."
            ],
        },
        "Killer Bee": {
            alignment: "Mafia",
            description: [
                "Once per game, can fatally sting another player during the day, killing them both."
            ],
        },
        "Diabolist": {
            alignment: "Mafia",
            description: [
                "Chooses a player to be a victim and a target each night.",
                "If the victim votes for the target in the village meeting the following day, the victim will die."
            ]
        },
        "Tailor": {
            alignment: "Mafia",
            description: [
                "Gives out a suit each night that disguises the wearer's role identity.",
                "Suits can be selected from any role within the current game."
            ],
        },
        "Actress": {
            alignment: "Mafia",
            description: [
                "Visits a player to appears as their role.",
                "Learns chosen player's role."
            ],
        },
        "Prosecutor": {
            alignment: "Mafia",
            description: [
                "Vote weight is worth 2 votes in village meeting."
            ],
        },
        "Fabricator": {
            alignment: "Mafia",
            description: [
                "Gives out a cursed item once per night.",
                "Cursed Guns and Knives will backfire against the player who used them.",
                "Cursed Armor, Crystals and Snowballs will be ineffective."
            ],
        },
        "Heartbreaker": {
            alignment: "Mafia",
            description: [
                "Falls in love with another player once per game.",
                "Both players will die if Heartbreaker dies.",
            ],
        },
        "Yakuza": {
            alignment: "Mafia",
            description: [
                "Chooses to sacrifice self once per game to convert another player to Mafioso.",
            ],
        },
        "Necromancer": {
            alignment: "Mafia",
            description: [
                "Visits a dead player during the night once per game.",
                "That player will be resurrected the following day.",
                "If player's role identity was revealed upon death, they will remain revealed when resurrected."
            ],
            graveyardParticipation: "all",
        },
        "Mummy": {
            alignment: "Mafia",
            description: [
                "Everyone who visits the mummy while the mummy is dead will die.",
            ],
        },
        "Poltergeist": {
            alignment: "Mafia",
            description: [
                "Once dead, visits one player each night and roleblock them.",
           ],
           graveyardParticipation: "self",
        },
        "Informant": {
            alignment: "Mafia",
            description: [
                "Chooses a player each night and views any reports they receive the following day."
            ],
         },
        "Jinx": {
            alignment: "Mafia",
            description: [
                "Curses a player with a forbidden word each night.",
                "If the person speaks the word the next day, they will die."
            ],
        },
        "Clown": {
            alignment: "Mafia",
            description: [
                "Fools around at night, visiting another player.",
                "Will kill their visit target.",
                "Appears as Fool to self."
            ],
        },
        "Graverobber": {
            alignment: "Mafia",
            description: [
                "Visits a dead player every night.",
                "Learns the role of that player and takes any items they were holding.",
            ],
        },
        "Medusa": {
            alignment: "Mafia",
            description: [
                "Chooses to turn all visitors from the previous night into stone, once per game, during the day.",
                "Players turned to stone are killed."
                ],
        },
        "Illusionist": {
            alignment: "Mafia",
            description: [
                "Starts with a gun.",
                "Chooses one player each night to frame as the shooter of any guns shot by the Illusionist."
            ],
        },
        "Cat Lady": {
            alignment: "Mafia",
            description: [
                "Chooses a player to send them a cat, each day.",
                "The player can choose to let the cat in during the night, or chase it out.",
                "If the cat is let in, the player is blocked from performing night actions.",
                "If the cat is chased out, the Cat Lady will learn the player's role."
            ],
        },
        "Slasher": {
            alignment: "Mafia",
            description: [
                "Receives a knife if not visited during the night.",
                "Slasher knives do not reveal.",
            ],
        },
        "Courier": {
            alignment: "Mafia",
            description: [
                "Sends an anonymous message at night to a player of choice."
            ],
        },
        "Trespasser": {
            alignment: "Mafia",
            description: [
                "Chooses to trespass on another player's property at night.",
                "Annoyingly, this visit has no effect.",
                "Mafia roles with the Scatterbrained modifier appear as this role to self."
            ],
        },
        "Housekeeper": {
            alignment: "Mafia",
            description: [
                "Visits a player and clear their will, once per game.",
                "Steals any items the player is holding."
            ]
        },
        "Thief": {
            alignment: "Mafia",
            description: [
                "Chooses a player to steal an item from each night.",
                "Does not attend Mafia meetings.",
            ],
        },
        "Crank": {
            alignment: "Mafia",
            description: [
                "Chooses a dead player once per night and holds a seance with that player.",
                "Identity is not revealed to the dead player.",
                "Does not attend the Mafia meeting."
            ],
            graveyardParticipation: "all",
        },
        "Interrogator": {
            alignment: "Mafia",
            description: [
                "Chooses a player to jail each day meeting.",
                "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings.",
                "Decides whether or not the prisoner should be executed.",
            ],
        },
        "Hitman": {
            alignment: "Mafia",
            description: [
                "Kills one player each night.",
                "Does not attend the Mafia meeting."
            ],
        },
        "Framer": {
            alignment: "Mafia",
            description: [
                "Chooses a living player each night to appear as a member of the Mafia to investigative roles.", 
            ],
        },
        "Apprentice": {
            alignment: "Mafia",
            description: [
                "Chooses to become the role of a dead Mafia-aligned player once per game.", 
            ],
        },
        "Butler": {
            alignment: "Mafia",
            description: [
                "Appears as a Villager upon death.", 
            ],
        },
        "Hoaxer": {
            alignment: "Mafia",
            description: [
                "Composes a fake system message, given to a player of their choice, at night.",
            ],
        },
        "Ventriloquist": {
            alignment: "Mafia",
            description: [
                "Can speak as any player during the day.", 
            ],
        },
        "Fiddler": {
            alignment: "Mafia",
            description: [
                "Serenades a player each night, causing them to be unable to hear anything the next day.", 
            ],
        },
        "Silencer": {
            alignment: "Mafia",
            description: [
                "Can silence someone each night, causing them to be unable to speak the next day.", 
            ],
        },
        "Sharpshooter": {
            alignment: "Mafia",
            description: [
                "When shot, has an 80% chance of surviving and stealing the gun.",
            ],
        },
        "Interceptor": {
            alignment: "Mafia",
            description: [
                "Each night, visits one player and kills one of their visitors.",
                "Other visitors will learn the identity of the Interceptor.",
            ],        
        },
        "Paparazzi": {
            alignment: "Mafia",
            description: [
                "If executed, can choose to reveal the role of one player to the Mafia.",
            ],        
        },
        "Whistleblower": {
            alignment: "Mafia",
            description: [
                "Every night, chooses one person and prevents them from voting and from being voted.",
                "Cannot blow the whistle on themselves."
            ],        
        },

        //Monsters
        "Lycan": {
            alignment: "Monsters",
            description: [
                "Each night, bites a non-monster player and turns them into a Werewolf.",
                "Werewolves retain their original roles, but they unknowingly kill a random non-monster player on full moons.",
                "Invincible during full moons, except for when visiting the Priest."
            ],
        },
        "Witch": {
            alignment: "Monsters",
            description: [
                "Chooses one player to control.",
                "Chooses who that player will perform their actions on.",
                "Redirection cannot be role blocked.",
                "Causes an eclipse during the day following her death.",
                "All votes and speech are anonymous during an eclipse."
            ],
        },
        "Cultist": {
            alignment: "Monsters",
            description: [
                "Meets with other Cultists and Monsters during the night.",
                "Cultists convert one player into a Cultist each night.",
                "All Cultists die if their leader (original Cultist) dies.",
            ],
        },
        "Cthulhu": {
            alignment: "Monsters",
            description: [
                "All players who visit the Cthulhu go insane.",
                "Insane players speak gibberish for the rest of the game."
            ],
        },
        "The Thing": {
            alignment: "Monsters",
            description: [
                "Chooses to hunt at night by choosing a player and guessing their role.",
                "If guessed correct, becomes immortal for the following day.",
                "If guessed incorrect, identity will be revealed to all."
            ],
        },
        "Leech": {
            alignment: "Monsters",
            description: [
                "Is bloodthirsty.",
                "During the night, can attach to a player and leech from them, stealing 50% of their blood.",
                "If the player dies from leeching, the leech also gains an additional 50% of blood.",
                "Gains an extra life after draining 150% blood."
            ],
        },
        "Accursed Doll": {
            alignment: "Monsters",
            description: [
                "If visited at night by a non-monster, gains a knife the next day.",
                "Knows who visits but not their roles.",
            ],
        },
        "Alchemist": {
            alignment: "Monsters",
            description: [
                "Can choose between three potions to cast at night.",
                "A damaging potion, which attacks the target.",
                "A restoring potion, which heals the target.",
                "An elucidating potion, which reveals the target's role.",
                "Once a potion has been concocted, it cannot be brewed again for the next two nights."
            ],
        },
        "Mindwarper": {
            alignment: "Monsters",
            description: [
                "Visits a player each night.",
                "If that player is not visited by a non-Monster player during the next night, they will go insane."
            ],
        },

        //Independent
        "Fool": {
            alignment: "Independent",
            description: [
                "Fools around at night, visiting another player with no effect.",
                "Wins if executed by the town.",
                "No one else wins if the Fool wins.",
                "Clown appears as this role to self.",
            ],
        },
        "Executioner": {
            alignment: "Independent",
            description: [
                "Randomly assigned a Village/Independent player as a target.",
                "Wins if their target player is executed in Village meeting while alive.",
            ],
        },
        "Serial Killer": {
            alignment: "Independent",
            description: [
                "Must kill a player each night.",
                "Wins if among last two alive."
            ],
        },
        "Amnesiac": {
            alignment: "Independent",
            description: [
                "Chooses to become the role of a dead player once per game."
            ],
        },
        "Survivor": {
            alignment: "Independent",
            description: [
                "Wins if alive at the end of the game."
            ],
        },
        "Alien": {
            alignment: "Independent",
            description: [
                "Chooses one player to probe each night.",
                "Wins if all players left alive have been probed."
            ],
        },
        "Old Maid": {
            alignment: "Independent",
            description: [
                "Chooses a player to swap roles with each night.",
                "Chosen player becomes the Old Maid.",
                "Cannot win the game.",
            ],
        },
        "Traitor": {
            alignment: "Independent",
            description: [
                "Wins with mafia.",
                "Does not count towards mafia win count.",
            ],
        },
        "Mastermind": {
            alignment: "Independent",
            description: [
                "Mafia meeting is anonymous if Mastermind is present in the game.",
                "Wins instead of mafia and counts toward their total.",
                ],
        },
        "Autocrat": {
            alignment: "Independent",
            description: [
                "Wins instead of village and counts toward their total.",
                ],
        },
        "Lover": {
            alignment: "Independent",
            description: [
                "Falls in love with another player once per game.",
                "Both players die if either of them are killed.",
                "Wins if both players survive until the end of the game.",
            ],
        },
        "Mistletoe": {
            alignment: "Independent",
            description: [
                "Each night chooses two players to go on a date. If they are the same alignment, they will fall in love.",
                "Wins if all players left alive are in love.",
            ],
        },
        "Turkey": {
            alignment: "Independent",
            description: [
                "The game begins with a famine, with each player starting with four bread.",
                "Turkeys are immune to the famine.",
                "Whenever a turkey dies, the village turns it into 2 turkey meals to survive the famine.",
                "The turkeys win if they survive to the end of the game and everyone else dies of famine.",
            ],
        },
        "Prophet": {
            alignment: "Independent",
            description: [
                "Predict once per game, the day/night cycle the game will end.",
                "Wins if guess is correct.",
            ],
        },
        "Vengeful Spirit": {
            alignment: "Independent",
            description: [
                "If murdered by another player, gains the ability to kill each night from the graveyard.",
                "Does not gain the ability if executed by village vote.",
                "Wins if they kill all of their murderers.",
            ],
            graveyardParticipation: "self",
        },
        "Clockmaker": {
            alignment: "Independent",
            description: [
                "Has a clock that starts at 6 o'clock.",
                "Choosing to kill a player each night changes the time based on that player's alignment.",
                "Clock goes up by 1 hour for village, 2 hours for Mafia or Monster, and down by 3 hours for Independent.",
                "Dies instantly at 3 o'clock.",
                "Gains an extra life at 9 o'clock.",
                "Wins when clock strikes 12 o'clock."
                
                ],
        },
        "Phantom": {
            alignment: "Independent",
            description: [
                "Wins if in the graveyard when the game ends",
            ],
        },
        "Nomad": {
            alignment: "Independent",
            description: [
                "Chooses to follow the ways of another player at night, aligning with their alignmemt.",
                "Wins if they are alive when the last alignment they are aligned with wins."
            ],
        },       
        "Anarchist": {
            alignment: "Independent",
            description: [
                "Gives out a ticking bomb each night.",
                "The ticking bomb can be passed around during the day, randomly exploding.",
                "Wins if two people die to the ticking bomb given out by them, or they are the last one alive.",
            ],
        },
        "Creepy Girl": {
            alignment: "Independent",
            description: [
                "Can give out one doll at night",
                "The doll can be passed to someone else each night.",
                "Wins if the player holding the doll dies."
            ],
        },
        "Host": {
            alignment: "Independent",
            description: [
                "Always assigned to the first player(s) in the list.",
                "Cannot die.",
                // TODO
                "If in the game, whispers will not leak.",
                "Cannot be added to ranked games",
            ],
        },
    },
    "Split Decision": {
        //Blue
        "Blue Member": {
            alignment: "Blue",
            description: [
                "Wins if the President is not in the same room as the Bomber at the end of the game."
            ]
        },
        "President": {
            alignment: "Blue",
            description: [
                "The Blue team wins if he is in a different room from the Bomber at the end of the game."
            ]
        },
        //Red
        "Red Member": {
            alignment: "Red",
            description: [
                "Wins if the President is in the same room as the Bomber at the end of the game."
            ]
        },
        "Bomber": {
            alignment: "Red",
            description: [
                "The Red team wins if he is in the same room as the Bomber at the end of the game."
            ]
        },
        //Independent
        "Gambler": {
            alignment: "Independent",
            description: [
                "Guesses which team will win after the last round and wins if correct."
            ]
        },
    },
    "Resistance": {
        //Resistance
        "Rebel": {
            alignment: "Resistance",
            description: [
                "Wins if a certain number of missions are successful."
            ]
        },
        "Merlin": {
            alignment: "Resistance",
            description: [
                "Kowns the alignment of all spies.",
                "If the Rebels would win, the spies can guess who Merlin is to win instead."
            ]
        },
        "Percival": {
            alignment: "Resistance",
            description: [
                "Knows who is Merlin."
            ]
        },
        //Spies
        "Spy": {
            alignment: "Spies",
            description: [
                "Wins if a certain number of missions fail."
            ]
        },
        "Oberon": {
            alignment: "Spies",
            description: [
                "Does not know who the other spies are and spies do not know him."
            ]
        },
        "Morgana": {
            alignment: "Spies",
            description: [
                "Appears as Merlin to Percival."
            ]
        },
    },
    "One Night": {
        //Village
        "Villager": {
            alignment: "Village",
            description: [
                "Wins if at least one Werewolf dies or if no one dies if no Werewolves are present."
            ]
        },
        "Hunter": {
            alignment: "Village",
            description: [
                "If executed, the person he voted to execute is also killed."
            ]
        },
        "Mason": {
            alignment: "Village",
            description: [
                "Learns who the other Masons were at the beginning of the night."
            ]
        },
        "Seer": {
            alignment: "Village",
            description: [
                "At the beginning of the night, learns either one player's role or two excess roles."
            ]
        },
        "Robber": {
            alignment: "Village",
            description: [
                "At 12:00, can choose to exchange roles with another player and learn his new role.",
                "Does not perform the action of his new role.",
            ]
        },
        "Troublemaker": {
            alignment: "Village",
            description: [
                "At 1:00, can swap the roles of two other players.",
                "Those players do not perform the actions of their new roles.",
            ]
        },
        "Insomniac": {
            alignment: "Village",
            description: [
                "Learns what her role is after the night is over.",
            ]
        },
        //Werewolves
        "Werewolf": {
            alignment: "Werewolves",
            description: [
                "Learns who the other Werewolves were at the beginning of the night.",
                "If there are no other Werewolves, learns one excess role.",
                "Wins if Werewolves are present but no Werewolves die.",
            ]
        },
        "Minion": {
            alignment: "Werewolves",
            description: [
                "Learns who the Werewolves are at the beginning of the night.",
                "Wins with the Werewolves, and wins if a non-minion player dies when no Werewolves are present.",
            ]
        },
        //Independent
        "Drunk": {
            alignment: "Independent",
            description: [
                "Becomes a random excess role at the end of the night.",
            ]
        },
        "Tanner": {
            alignment: "Independent",
            description: [
                "Wins if he dies.",
                "The Werewolves do not win if he dies.",
                "The Village does not win if he dies and no Werewolves are present.",
            ]
        },
        "Doppelganger": {
            alignment: "Independent",
            description: [
                "At the beginning of the night, copies and becomes the role of another player.",
                "Performs the actions of that role, unless another Doppelganger was chosen.",
                "Her new actions are performed before the player's whose role was copied."
            ]
        },
    },
    "Ghost": {
        "Town": {
            alignment: "Town",
            description: [
                "Knows the hidden word."
            ]
        },
        "Fool": {
            alignment: "Town",
            description: [
                "Knows the decoy word, which has the same number of letters as the hidden word.",
                "Appears to self as Town, and does not know that their word is the decoy word.",
            ]
        },
        "Ghost": {
            alignment: "Ghost",
            description: [
                "Knows other Ghosts.",
                "Only knows the number of letters in the hidden word.",
                "Must blend in and guess the hidden word.",
            ]
        },
    }
};

module.exports = roleData;
