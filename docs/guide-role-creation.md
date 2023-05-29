# Role Creation Guide

Firstly, thank you so much for taking the time to contribute to BeyondMafia. You would first need to get your site running by following the project's [README](/README.md).

## Setup

#### 1. Choose a role to implement.

Refer to [this issue](https://github.com/BeyonderMafia/BeyonderMafia/issues/1) for a full list of roles that require implementation. There are also links to mechanic description and system messages. Drop a comment stating which role you want to work on. You may implement roles outside of the list too.

#### 2. Locally, checkout a branch for the role you want to make.

`git checkout -b add-journalist`

## Create Role

#### 1. Add role description in `data/roles.js`. 

Append to the bottom of the respective alignment.

#### 2. Add role class in `Games/core/types/Mafia/roles/<Alignment>`. 

You can refer to other role classes like Arms Dealer in `Games/types/Mafia/roles/Village/ArmsDealer.js` for the template.

#### 3. Add the role card(s) in `Games/core/types/Mafia/roles/cards`.

Some example cards that you can refer to

- Investigative: `AlignmentLearner` (Cop), `RoleLearner` (Seer), `TrackPlayer`
- GiveItems: `ArmorGiver` (Blacksmith)
- Roles can also save state in `this.actor.role.data`, e.g. in `RevealTargetOnDeath` (Oracle) and `Carol`

#### 4. Depending on the role, you might have to add items, effects and meetings in `Games/core/types/Mafia/<items/effects/meetings>`

## Role Mechanics

#### Card

A `Card` is a modular ability that can be easily assigned to roles. For instance, the `RoleLearner` card gives its holder the "Learn Role" ability, and we assign the `RoleLearner` card to a `Seer`. `Card`s are useful because we can consolidate the same ability logic in town-mafia counterparts.

Most roles will bind a `Meeting`s to a card. However, you can also set other properties like:
- `appearance`: How the role appears to yourself or others, e.g. `Humble`.
- `startItems`, `startEffects`
- `meetingMods`: Used by modifiers to give a blanket modification to all meetings the role has, e.g. `Delayed` and `Lone`.

#### Meetings

Meetings are primarily used to vote on a target or talk. For instance, the Capybara has the `OrangeGiver` meeting to decide who she should should use her ability on.

Important properties of meetings:

- `state`: The time of the day where the meeting occurs, most commonly `Day` or `Night`.
- `flags`: Modify the meeting with properties like `anonymous` or `noVeg`. The full list is in `Games/types/Mafia/const/MeetingFlag.js`. You will probably not need to add new flags.
- `action`: Most meetings will have an `Action` to be executed, but it is possible to have actionless meetings like `MeetWithIlluminati`.

- When you put a `Meeting` under and `Item` like `Orange` and `Handcuffs`, then the item holder will have the meeting.
- When you put a `Meeting` under a `Card` like `AlignmentLearner`, then roles with that card will have the meeting.

#### Actions

`Action`s are events that happen in a game, for instance investigating, gifting items or killing.

Most of the actions are tagged to `Meeting`s, where players vote on the action's `target`. Not all actions require a vote for the target, e.g. passive actions tied to a `listener`. More on listeners below.

**Priority**

Most actions will only be resolved at the end of a state, e.g. at the end of the night. 

- Actions are queued based on their priority value, which you can refer to in `Games/types/Mafia/const/Priority.js`.
- As much as possible, use a default priority already available, UNLESS the role has complex interactions with other roles, e.g. roleblock, disguise, swap roles. Complex roles should be unique priority values so the resolution is definite.
- All actions are first enqueued, and once the queue is filled the actions are executed sequentially.

**Instant Action**

Actions can also be executed instantly, such as in `Bomb`.

**Labels**

Labels are used to filter actions. For instance, if we want a specific interaction like "this role cannot receive items", then we can filter for actions with the label "giveItem". 

Most roles with standard mechanics will not need labels. You can create your own custom labels.

#### Listeners

Listeners can be added to `Card`s, `Item`s, `Effect`s to check for specific events in the game. For example, you can listen to `state` changes (shift from day to night), or `death` events.

You can check the `emit` function for the types of events being sent. You might also introduce a new mechanic and emit a new event type.

## Testing Role

#### 1. Add role test in `test/Games/Game.test.js`. This is currently optional, but makes it easy to check if future roles break existing mechanics.

#### 2. Run test games with your new role. [Set up dev mode](/docs/bot-games.md) on your user to allow yourself to play games with bots.

It's not necessary to test all the interactions, but at the very least test that the code compiles and the role works. If possible, test against roles that might interact/ interfere with what you added. E.g. roles that bring players into new night meetings should be tested with `Jailer`.

## Integrating role into UltiMafia

#### 1. Commit your changes to your remote branch.

```
git add *
git commit -m "add journalist implementation"
git push origin add-journalist
```

#### 2. Make a Pull Request from your branch (e.g. `add-journalist`) to the rend's `master` branch.

(Note: in future, you will make the PR to the `dev` branch instead. The site is undergoing rapid development so the dev branch is not available yet.)

#### 3. (skip for now) Once your changes have been merged into the `dev` branch, test the role on `test.ultimafia.com`.

#### 4. Once your changes have been merged into the `master` branch, test your role on `ultimafia.com` and keep a look out for bug reports for it.

#### 5. Send a DM to `ammico` or any moderator to open role icon requests for the role. You can do this step earlier if you wish.

## Pull Request Checklist

- [] Add role description in `data/roles.js`
- [] Add role class in `Games/core/types/Mafia/roles/<Alignment>`
- [] Add role card (ability) in `Games/core/types/Mafia/roles/cards`
- [] (optional) Add role items, effects, meetings `Games/core/types/Mafia/<items/effects/meetings>`
- [] (optional) Add role test in `test/Games/Game.test.js`
- [] Tested the role mechanics

## Final Notes

You may refer to roles that other people have created:

- [Capybara PR](https://github.com/r3ndd/BeyondMafia-Integration/pull/2)
- [Alien PR](https://github.com/r3ndd/BeyondMafia-Integration/pull/11)
- [Associate PR](https://github.com/r3ndd/BeyondMafia-Integration/pull/29)
