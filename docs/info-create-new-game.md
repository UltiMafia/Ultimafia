# Adding a new Game Mode

We currently have eleven game modes: Mafia, Resistance, Secret Dictator, Acrotopia, Jotto, Wacky Words, Liars Dice, Battlesnakes, Texas Hold Em, Cheat, and Connect Four. To create a new game,

- Make child classes of core
- Update constants.js and constants.jsx
- Update setup checks in setup.js
- Update settings checks in game.js
- Add roles to role data
- Add roles to role css
- Add game type host fields to react_main/components/gameTypeHostForms
- Add game type default host fields to react_main/components/gameTypeHostForms/DefaultValues.js
