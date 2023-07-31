# Developer Documentation: Mafia Constants

## Alignments

There are currently four alignments in the game.

| Alignment   |
| ----------- |
| Village     |
| Mafia       |
| Independent |
| Cult        |

## States

The game alternately cycles between Night and Day. Games start on "Night 1", then cycle to "Day 1". When the daystart option is enabled, the first "Night 1" phase is skipped.

Sunset is used for the Hunter interaction.

| States   |
| -------- |
| Day      |
| Night    |
| Sunset   |
| Any (\*) |

## Meeting Flags

| Meeting Flag  | Description                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| liveJoin      | Informs other meeting members about the join. Currently only used by the village core.                                                     |
| exclusive     | Players can only join one exclusive meeting every night. Non-exclusive meetings can only be joined if they have a higher meeting priority. |
| voting        | Meeting members will vote for the meeting target, which is then piped to the corresponding action as action.target.                        |
| mustAct       | Unable to select "no one" as a target, not including village meeting.                                                                                          |
| mustCondemn   | Unable to select "no one" as the village meeting target.                                                                                           |
| instant       | The game will process the actions immediately. E.g. Gun, KillerBee                                                                         |
| noVeg         | Does not cause veg when the timer is up.                                                                                                   |
| group         | Multiple people share the same meeting.                                                                                                    |
| speech        | Meeting members can talk to each other.                                                                                                    |
| anonymous     | Speech and votes are anonymous.                                                                                                            |
| anonymousVote | Votes are anonymous.                                                                                                                       |

## Action Labels

### Core Labels

| Action Label   | Description                        |
| -------------- | ---------------------------------- |
| kill           | Action kills target.               |
| save           | Action gives kill immunity.        |
| revive         | Action revives a player.           |
| condemn        | Village elimination.               |
| hidden         | Action does not appear as a visit. |
| absolute       | Action cannot be roleblocked.      |
| uncontrollable | Action cannot be controlled.       |
| block          | Action cancels other actions.      |
| giveItem       | Action gives an item.              |
| giveEffect     | Action gives an effect.            |
| investigate    | Action gathers information.        |
| alignment      | Sub-label for investigate.         |
| role           | Sub-label for investigate.         |
| convert        | Action changes roles.              |

### Role-specific Labels

Labels are helpful to manage two or more roles interacting with each other.

| Kill Power      | Power                   |
| --------------- | ----------------------- |
| gun             | Item: Gun               |
| armor           | Item: Armour            |
| bomb            | Item: Bomb, Bomb        |
| orange          | Item: Orange            |
| match           | Item: Match             |
| gasoline        | Item: Gasoline          |
| knife           | Item: Knife             |
| cat             | Item: Cat               |
| probe           | Effect: Probe           |
| poison          | Effect: Poison          |
| seppuku         | Yakuza                  |
| carol           | Caroler                 |
| dream           | Dreamer                 |
| cultist         | Cultist                 |
| mason, mismason | Mason                   |
| werwolf         | Werewolf, Priest        |
| wolfBite        | Werewolf, Lycan         |
| cleanse         | Werewolf, Lycan, Priest |
| clean           | Janitor                 |
| sting           | Killer Bee              |
| curse           | Diabolist, Jinx         |
| cursed          | Fabricator              |
| stealIdentity   | Disguiser               |
| famine          | Baker                   |
| snowball, throw | Snowball                |
| ignite, match   | Arsonist                |

## Immunity

Actions can have immunity (>=0) and power (>=0)

Malignant actions (e.g. kill, poison) have a power. The action is executed if `action.power > immunity[action.type]`.

| Action             | Power |
| ------------------ | ----- |
| Kill: Basic        | 1     |
| Immunity: Armor    | 1     |
| Kill: Curse        | 2     |
| Immunity: Heal     | 2     |
| Kill: condemn      | 3     |
| Immunity: TheThing | 3     |
| Immunity: Virgin   | 5     |

Role block actions also have a power. The roleblock is successfull if `roleBlockAction.power >= otherAction.power`

## Death Types

| Death Type     | Description                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------- |
| leave          | Player exits the game before they died. Forfeits rank mode.                                         |
| veg            | Player did not take an action after the timer went up. The engine kicks the player out of the game. |
| basic          | Player died due to in-game kills.                                                                   |
| condemn        | Player died from a village elimination                                                              |
| gun            | Player died from a gunshot in the day.                                                              |
| bomb           | Player died when they killed an explosive victim.                                                   |
| condemnRevenge | Player died from the hunter's revenge elimination                                                   |
| burn           | Player died from an arsonist's ignition.                                                            |
| poison         | Player died from the poison effect.                                                                 |
