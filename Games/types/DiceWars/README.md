# DiceWars - A Hex Grid Territory Control Game

**DiceWars** is a strategic territory control game inspired by KDice/Dice Wars, implemented for the Ultimafia platform.

## Game Overview

Players compete to conquer a hex-grid map by attacking adjacent territories using dice-based combat. The last player standing wins!

### How to Play

1. **Setup**: Players are assigned territories randomly across a hex grid, each starting with 1-3 dice
2. **Your Turn**:
   - Click one of your territories (with 2+ dice) to select it
   - Click an adjacent enemy territory to attack
   - Roll the dice - higher total wins!
   - Click "End Turn" when done attacking
3. **Combat**:
   - Attacker and defender both roll all their dice
   - Higher total wins the territory
   - Winner keeps (dice - 1), loser reduced to 1 die
4. **End of Turn Bonus**:
   - You receive bonus dice equal to your largest connected region
   - Dice are distributed randomly among your territories (max 8 per territory)
5. **Victory**: Be the last player with territories!

## Game Features

- **Hex Grid**: Authentic hex-based map with proper adjacency
- **Strategic Depth**: Balance expansion with consolidation
- **Dice-Based Combat**: Exciting randomness with calculable odds
- **Connected Regions**: Incentivizes smart territorial expansion
- **2-8 Players**: Scalable for different group sizes
- **Customizable Map**: 15-60 territories

## Files Created

### Backend (Node.js/Express)

#### Core Game Files

- `Games/types/DiceWars/Game.js` - Main game logic, hex map generation, combat system
- `Games/types/DiceWars/Player.js` - Player socket handlers for attacks and turn management
- `Games/types/DiceWars/Role.js` - Base role class
- `Games/types/DiceWars/Action.js` - Action handling
- `Games/types/DiceWars/Card.js` - Card system base
- `Games/types/DiceWars/Item.js` - Item system base
- `Games/types/DiceWars/Meeting.js` - Meeting system base
- `Games/types/DiceWars/Winners.js` - Win condition handler

#### Roles

- `Games/types/DiceWars/roles/Town/General.js` - Main player role
- `Games/types/DiceWars/roles/Host/Host.js` - Game host role
- `Games/types/DiceWars/roles/cards/TownCore.js` - Core card
- `Games/types/DiceWars/roles/cards/AttackTerritory.js` - Attack action card
- `Games/types/DiceWars/roles/cards/EndTurn.js` - End turn card

#### Templates

- `Games/types/DiceWars/templates/death.js` - Death message template

### Frontend (React)

#### Game Components

- `react_main/src/pages/Game/DiceWarsGame.jsx` - Main game container
- `react_main/src/pages/Game/DiceWarsGameDisplay.jsx` - Hex grid rendering and interaction
- `react_main/src/components/gameTypeHostForms/HostDiceWars.js` - Game hosting form

### Configuration Files

#### Data

- `data/constants.js` - Added DiceWars to game types, alignments, start states, and configurable states
- `data/roles.js` - Added General and Host role definitions
- `data/gamesettings.js` - Added DiceWars settings section

#### Routes

- `routes/game.js` - Added settings validation for DiceWars
- `routes/setup.js` - Added player count and options validation

#### Frontend Config

- `react_main/src/pages/Game/Game.jsx` - Registered DiceWarsGame component
- `react_main/src/components/HostGameDialogue.jsx` - Registered HostDiceWars form
- `react_main/src/components/gameTypeHostForms/DefaultValues.js` - Added default settings

## Technical Implementation

### Hex Grid System

- Uses axial coordinate system (q, r) for hex positioning
- Converts to pixel coordinates for rendering
- Proper neighbor detection for all 6 adjacent hexes

### Combat System

- Attacker needs minimum 2 dice to attack
- Both sides roll all their dice
- Higher total wins
- Winner keeps (attacker_dice - 1), loser gets 1 die
- Automatic elimination check after each attack

### Turn-Based Gameplay

- One player active at a time
- Can attack multiple times per turn
- Must end turn manually to receive bonuses
- Turn rotates through all living players

### Bonus Dice System

- Uses BFS algorithm to find connected regions
- Awards dice equal to largest connected region size
- Random distribution to territories (capped at 8 dice)

### Win Condition

- Game ends when only one player has territories
- Automatic detection after each attack
- Players eliminated when they lose all territories

## Asset Reuse

Currently uses Battlesnakes CSS as placeholder:

- `css/gameBattlesnakes.css` - Styling for game layout

## Game Settings

### Host Options

- **Map Size**: 15-60 territories (default: 30)
- **Play Length**: 5-60 minutes (default: 30)
- **Player Count**: 2-8 players
- Standard options: Private, Guests, Spectating, Scheduled, etc.

### State Configuration

- **Play State**: Main game state where all action happens
- Configurable from 5-60 minutes

## Player Roles

### General (Town)

- Main playable role
- Controls territories
- Attacks enemies
- Ends turns

### Host

- Facilitates the game
- Spectator role

## Future Enhancements

Potential improvements:

- Custom hex grid art assets (currently using placeholder styling)
- Territory skins/themes
- Sound effects for attacks and victories
- Animation for dice rolls
- Territory claiming animations
- Different map shapes (circular, rectangular, etc.)
- Game variants (fog of war, different bonus systems, etc.)
- AI players for single-player mode

## Code Quality

✅ No linter errors
✅ Follows Ultimafia architecture patterns
✅ Proper socket communication
✅ State management through game server
✅ Clean separation of concerns

## Testing Recommendations

1. Test with 2-8 players
2. Verify hex adjacency works correctly
3. Test combat with various dice counts
4. Verify bonus dice calculation and distribution
5. Test elimination and win conditions
6. Verify map generation at different sizes
7. Test turn rotation
8. Verify player disconnection handling

---

**Note**: This implementation uses Battlesnakes art assets as placeholders. Custom hex territory graphics would enhance the visual experience.
