# Ultimafia

Web-based chat mafia game platform (ultimafia.com). Node.js backend with React frontend, real-time gameplay via Socket.io.

## Tech Stack

- **Backend:** Node.js 22.17.0, Express, Socket.io, PM2 (3 processes: games, www, chat)
- **Frontend:** React 17, Rsbuild, Material-UI, D3.js (in `react_main/`)
- **Database:** MongoDB 8.0 (Mongoose ODM), Redis 8.0 (sessions, game state, pub/sub)
- **Auth:** Firebase Auth + Passport.js (Discord, Google, Twitch, Steam)
- **Containerization:** Docker Compose

## Project Structure

```
Games/                  # Game engine
  core/                 # Core classes: Game, Player, Role, Meeting, Action, Card, Effect, Item
  core/types/Mafia/     # Mafia game type (primary)
    roles/              # 100+ roles organized by alignment (Village, Mafia, Cult, Independent)
    cards/              # Modular ability cards attached to roles
    items/              # In-game items
    effects/            # Status effects
    meetings/           # Vote/action meetings
    const/              # Constants (Priority.js, MeetingFlag.js)
  types/                # Other game types (Resistance, TexasHoldEm, SecretDictator, etc.)
routes/                 # Express API endpoints (~25 route files)
modules/                # Server modules (chat.js, redis.js, competitive.js, session.js, logging.js)
lib/                    # Utilities (sockets.js, Translator.js, Utils.js)
db/                     # MongoDB connection, Mongoose schemas, models
data/                   # Game data (roles.js, modifiers.js, constants.js, Achievements.js)
react_main/             # Frontend React app
  src/                  # Components (~22 directories)
test/                   # Mocha tests
  Games/                # Game tests (Mafia, Utils, History, Queue)
docs/                   # Setup guides, role creation guide, game mechanics docs
```

## Development Setup

### Prerequisites
- Node.js 22.17.0 (via nvm)
- Docker Desktop running

### Quick Start
```bash
# Install dependencies
npm install
cd react_main && npm install && cd ..

# Copy env files from docs/ templates
cp docs/server_env .env
cp docs/client_env react_main/.env
# Edit both .env files with your Firebase API keys

# Start dev environment
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml up -d

# Site available at http://localhost:3001
# First time: visit http://localhost:3001/auth/login to create an account
# (Use `localhost`, not `127.0.0.1` — Firebase Auth only authorizes `localhost`. Use port 3001, not 80.)
```

### Dev Environment Notes
- The web container mounts `./` into `/home/um/`, so host file changes are reflected immediately
- If `react_main/node_modules` has platform issues (rspack bindings), run `npm install` inside the container:
  ```bash
  docker run --rm -v "$(pwd):/home/um" -w /home/um/react_main ultimafia-web:latest sh -c "npm install"
  ```
- Backend runs via PM2 inside Docker with 3 processes: `games` (port 3010), `www` (port 3000), `chat` (port 2999)

## Commands

```bash
# Backend
npm test                    # Run Mocha tests (parallel)

# Frontend
cd react_main
npm start                   # Rsbuild dev server (port 3001)
npm run build               # Production build
npm run lint                # ESLint

# Docker (dev)
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml up -d
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml down
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml logs --tail=30
```

## Game Architecture

### Mafia Game Event Flow
1. **Pregame:** start -> holdItem/applyEffect -> roleAssigned
2. **In-game:** state -> stateMods -> meetings -> [message/vote/instantAction] -> actionsNext -> holdItem/applyEffect -> afterActions
3. **Postgame:** gameOver

### Key Concepts
- **Role** = base class + one or more **Cards** (modular abilities)
- **Card** binds **Meetings** (voting/talking), **Actions** (kill/investigate/etc), and **Listeners** (event hooks)
- **Actions** resolve at end of state, ordered by **Priority** (`Games/core/types/Mafia/const/Priority.js`)
- **Items** and **Effects** can also have meetings, actions, and listeners
- `this` binding: Action->Action, Role/Card listener->Role, WinCheck->Role, Effect listener->Effect, Item listener->Item

### Adding a New Role
1. Add role description in `data/roles.js`
2. Add role class in `Games/core/types/Mafia/roles/<Alignment>/`
3. Add card(s) in `Games/core/types/Mafia/roles/cards/`
4. Optionally add items/effects/meetings in `Games/core/types/Mafia/<items|effects|meetings>/`
5. Add tests in `test/Games/`
6. See `docs/guide-role-creation.md` for full details

## Testing

- **Framework:** Mocha + Chai
- **Run:** `npm test` (uses `--recursive --parallel --exit`)
- **Test helpers:** `makeUser()`, `makeGame(setup, stateLength)`, `getRoles(game)`, `addListenerToPlayer()`
- **Bot testing:** Enable "dev" mode on your user in MongoDB, then use the test tube icon in-game to spawn bots
- **CI:** GitHub Actions runs tests on PR and push to master

## Environment Variables

Server `.env` — see `docs/server_env` for template. Key vars:
- `MONGO_URL`, `MONGO_DB`, `MONGO_USER`, `MONGO_PW` (default: mongodb/ultimafia/admin/password)
- `FIREBASE_*` keys (required — create a Firebase project)
- `GAME_PORTS=[3010]`, `CHAT_PORT=2999`

Frontend `react_main/.env` — see `docs/client_env` for template. Key vars:
- `REACT_APP_FIREBASE_*` keys
- `REACT_APP_URL=http://localhost:3000`

## Git Conventions

- **Main branch:** master
- **Branch naming:** `add-<role-name>` for roles, descriptive names for features
- **Commit prefixes:** feat, fix, chore, doc
- **PRs:** Target master branch, require review before merge, always use empty description (`--body ""`)
