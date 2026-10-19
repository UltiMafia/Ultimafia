# Dev bot scripts (Liar's Dice / Secret Dictator)

Drive Developer API test accounts on a dev server.

- `DEVAPI_KEY_FILE` points at a JSON file `{clientId, clientSecret}` (not committed).
- `node host.js <setupId> <bots> [name] [ld|sd]` hosts a lobby and seats `<bots>` test accounts.
- `node driver.js <gameId>` / `node sddriver.js <gameId>` play the seated accounts.
- `node seed.js <gameId> <meetingName> <N>` sends chat messages (respects the speak cooldown).
- `node analyze.js <gameId> <ld|sd>` summarizes frames/bytes per action, chat resends and dice visibility from the game log.
