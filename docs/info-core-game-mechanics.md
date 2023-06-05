# Core Game Mechanics

## Event Flow

### Pregame

- start
- \[holdItem*, applyEffect*\], starting items and effects are given
- roleAssigned

### In-game

- state, progresses to the next state
- stateMods
- meeting\*, meetings are created and joined
- \[message*, vote*, instantAction\*\]
- actionsNext
- \[holdItem*, applyEffect*\]
- afterActions

### Postgame

- gameOver

## Core Mechanics

### Meetings Instances

| **prop**          | **description**                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`            | Meeting class to instantiate if creating new meeting. Default: Base Meeting class for game type                                                |
| `meetingName`     | Display name of this meeting for this player Default: Base meeting name                                                                        |
| `actionName`      | Name of the action for this meeting Default: `meetingName`                                                                                     |
| `states`          | States to join this meeting                                                                                                                    |
| `flags`           | Flags to set to true on the meeting                                                                                                            |
| `targets`         | Set the targets for the meeting. Can only be set if not a group meeting. Includes are calculated first, then excludes can override inclusions. |
| `times`           | Number of unique times to join this meeting. Default: `Infinity`                                                                               |
| `whileAlive`      | Default: `true`                                                                                                                                |
| `whileDead`       | Default: `false`                                                                                                                               |
| `unique`          | Whether to create a new meeting instance regardless if an existing meeting of the same name exists.                                            |
| `noGroup`         | Do not join existing groups for this meeting                                                                                                   |
| `voteWeight`      | Default: `1`                                                                                                                                   |
| `canVote`         | The player is a voting member of the meeting. Default: `true`                                                                                  |
| `canUpdateVote`   | The player is able to change their vote in the meeting. Requires `canVote` to be `true`. Default: `true`                                       |
| `canUnvote`       | The player is able to remove their vote in the meeting. Requires `canVote` to be `true`. Default: `true`                                       |
| `canTalk`         | Default: `true`                                                                                                                                |
| `speechAbilities` |                                                                                                                                                |
| `leader`          | Whether to make this player the leader of the meeting. Default: `false`                                                                        |
| `action`          | The action to take when the meeting is resolved.                                                                                               |

Note on `unique` meetings:

- For group meetings this means the player will not join an existing group.
- For solo meetings this means the player will create a new instance of the meeting even if they’re in one with the same name.
- Default is to not do anything if player has already joined a meeting with the same name or join an existing group if it exists.
- Cannot be unique and `whileAlive` and `whileDead`.

## `this` binding

- Action: Action
- Role/Card listener: Role
- WinCheck: Role
- Effect listener: Effect
- Item listener: Item
- Targets include/exclude: Player
