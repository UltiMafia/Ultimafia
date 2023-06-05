# Adding New Game Settings

You will have to make the following changes:

### 1. Host Page

- Add Form Field objects
- Add `POST` request fields

### 2. Host Game Route

- Add type constraints and verification
- Pass the fields to the game load balancer
- Do game-specific settings checks

### 3. Set on Game object

- Pass fields to redis
- Pass fields to database storage when the game ends
- Modify the child Game class for game-specific settings (add to `getGametypeOptions()`)

### 4. Game Info route

- Get in db request
- Set on object

### 5. Game List route

- Get in db request
- Set on object

### 6. Set in game info popover
