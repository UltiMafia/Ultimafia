# Developing against a live backend

The client normally talks to the backend in the same Docker Compose project.
You can point the dev server at a live site instead — for example
`https://ultimafia.com` or an internal test deployment — and keep using the
local source tree with hot reload. No backend code or extra proxy process is
needed: the dev server does the proxying.

Everything the browser requests stays on the dev server's own origin (the API,
`/uploads`, the chat socket and the game sockets), so the session cookie, the
`x-csrf` header and the socket auth tokens keep working exactly as they do on
the live site. That is the whole reason the proxy exists — the backend rejects
cross-origin browser sessions, so a plain "API base URL" cannot work.

## What you need

1. A local checkout with the frontend dependencies installed — the Docker
   Compose setup from [the local setup guide](./setup-local-guide.md), or
   `npm start` in `react_main`. You do not need the local backend running.
2. An account on the target site.
3. The target site's **Firebase web configuration**. The client signs you in
   with the Firebase project that the target backend verifies. A separate
   local Firebase project (the normal local setup) will not work, because the
   target server rejects ID tokens from another project.

   Open the live site, DevTools → Sources/Network, open the main
   `index.*.js` bundle, and search for `apiKey`. The six `REACT_APP_FIREBASE_*`
   values are there. They are public by design (they ship to every browser);
   never copy a service account key.

   Signing in only needs those values. Creating a new account also needs the
   target site's `REACT_APP_RECAPTCHA_KEY`, because reCAPTCHA keys are
   restricted to the domains they were issued for.

## Steps

1. In `react_main/.env`, point at the target and use its Firebase project:

   ```
   REACT_APP_REMOTE_BACKEND=https://ultimafia.com

   # Links this client builds for the site itself (for example "link account")
   # should go to the target, not to localhost.
   REACT_APP_URL=https://ultimafia.com

   REACT_APP_FIREBASE_API_KEY=...
   REACT_APP_FIREBASE_AUTH_DOMAIN=...
   REACT_APP_FIREBASE_PROJECT_ID=...
   REACT_APP_FIREBASE_STORAGE_BUCKET=...
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
   REACT_APP_FIREBASE_APP_ID=...
   ```

   Leave `REACT_APP_SOCKET_URI`, `REACT_APP_USE_PORT`, `REACT_APP_CHAT_PORT` and
   `REACT_APP_SOCKET_PROTOCOL` as they are. Remote mode overrides
   `REACT_APP_SOCKET_URI` and `REACT_APP_USE_PORT` so both sockets go through
   the dev server; the protocol stays `ws` for `http://localhost`.

2. Restart the dev server so it re-reads the config and environment:

   ```bash
   docker compose -f docker-compose-core.yml -f docker-compose-dev.yml restart web
   ```

   The startup log prints:

   ```
   [dev] API, uploads and sockets are proxied to the remote backend https://ultimafia.com. Actions taken in this client affect that live site.
   ```

3. Open `http://localhost:3001`, sign in with your account on the target site,
   and play. A yellow "Development client connected to …" banner appears at the
   top of every page while remote mode is on, so this client cannot be mistaken
   for the local sandbox. It can be dismissed for the rest of the browser tab's
   session.

To go back to the local backend, empty `REACT_APP_REMOTE_BACKEND` and restart
the dev server.

## What works

- Sign-in with email/password and with Firebase providers (Google, Discord).
  `localhost` is an authorized domain for Firebase projects by default, so the
  popup flows work from the dev server.
- Normal site traffic: lobby, game lists, profiles, chat, forums, uploads.
- Live games: game and chat WebSockets are proxied, so joining, actions,
  state changes and reconnects behave as on the live site.

## What does not

- **Deployed builds.** The setting is only read by the development server; a
  production build ignores it, because there is no proxy to forward to.
- **Absolute links that the backend generates with its own domain** (email
  links, some share links). They point at the target site, which is correct,
  but they will leave the local client.
- **Push notifications.** They are registered per origin and stay attached to
  the target site.

## Safety

Remote mode is a development client talking to a real site with your real
account:

- Games you join are real. Do not use a dev build to "just look at the UI" in a
  ranked or competitive game, and do not join games you would not want to play.
- Reports, kudos, chat messages, purchases and moderation actions are real.
- Keep the dev server on `localhost`. It holds your session cookie and forwards
  it on your behalf.

## Troubleshooting

- **Proxy errors / 404 from the target**: make sure the value is the site
  origin (`https://ultimafia.com`), not a page URL under it, and that the
  target is reachable from inside the web container
  (`docker exec web wget -qO- https://ultimafia.com/`).
- **Login succeeds but the site shows you signed out**: the API response's
  `Set-Cookie` must reach the browser. Confirm the target sets the cookie for
  its own host and that you are not browsing `127.0.0.1` in one place and
  `localhost` in another.
- **Sockets fail while the site loads**: the game ports are listed in
  `react_main/rsbuild.config.ts` (`FIRST_GAME_PORT`–`LAST_GAME_PORT`) and must
  match the target's nginx configuration. The chat socket is `/chatSocket`.
- **`auth/unauthorized-domain` from Firebase**: the Firebase project does not
  authorize the host you are using. Use `localhost`, which is authorized by
  default.
