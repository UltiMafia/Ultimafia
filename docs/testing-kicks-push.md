# Kicks push verification

## Automated regression suite

From the repository root, install dependencies (`npm ci`), configure the usual
server test environment from `.github/workflows/push-notifications.yml`, and start
an isolated MongoDB and Redis. Never point these tests at a production database:
legacy game fixtures write/cancel games. Run:

```sh
npm run test:push
```

This runs the Mocha push transport and recipient tests, real core
Game/User/Player/Meeting integration, then Node's tests against the shipped
`react_main/public/sw.js` and the client deep-link helper. All outbound push calls
are mocked; no subscription or credentials from an actual user are needed.

The dedicated CI job uses its own database and runs exactly this command. The
normal `npm test` also discovers the backend tests. Its preloaded test-only VAPID
fixture is intentional: Mocha reuses parallel workers, so setting keys only inside
a test file is too late if another file already cached Game/pushNotifications.

Coverage includes incomplete vs completed actions, dead/departed/bot/guest players,
spectators, unsubscribe opt-out, partial multi-actions, noVeg games, subscription
survival across game start, same-window retries (including in-flight and failed
sends), later-state dedupe, capture before synchronous state advancement, per-device
failure isolation, separate 404/410 pruning and healthy-device retention, ready
notification compatibility, and kicks notification tag/click routing.

There is no per-kind notification preference in this application. Opt-out here
means removing the account's subscription (the existing unregister/unsubscribe
path), not an invented settings field. Browser permission denial prevents the
subscription from being created; the backend does not receive permission status.

## Manual browser verification (local development only)

Use a separate browser profile and a local development account. Do not use your
production game or change production browser permissions. The local app must serve
this branch's `/sw.js` and game UI. Use `http://localhost:<client-port>` on desktop,
or a trusted HTTPS development origin; an HTTP LAN IP is not a secure context.
Choose a development game that your test account has joined and replace
`LOCAL_GAME_ID` below with its actual ID.

1. Open the local app and its DevTools Console. Register/update the worker and
   grant notification permission with this deliberate, test-only command:

   ```js
   await navigator.serviceWorker.register('/sw.js', {scope: '/'});
   await (await navigator.serviceWorker.ready).update();
   await Notification.requestPermission();
   ```

   Confirm `Notification.permission === 'granted'` and that DevTools Application
   > Service Workers shows the worker activated for this origin. Reload the page
   if needed to ensure it is controlled. Do not enable Offline mode.

2. In Application > Service Workers, replace the Push input's default text with
   this JSON (keep `url` same-origin), then click **Push**:

   ```json
   {"kind":"kicks-reminder","gameId":"LOCAL_GAME_ID","title":"Your game is in kicks","body":"You have not taken your action this phase. Do it now or you may be vegged.","tag":"game-LOCAL_GAME_ID","url":"/game/LOCAL_GAME_ID","state":2}
   ```

   Keep DevTools detached/focused and the app window backgrounded while clicking
   Push. The worker intentionally suppresses system notifications while any app
   window has focus. If no banner appears, inspect the worker console for errors
   and use `await (await navigator.serviceWorker.ready).getNotifications()` in
   the app console after delivering with the app backgrounded. OS Do Not Disturb
   may hide banners even when the browser created the notification.

3. Click the **notification itself** in the OS notification center, not the Push
   button again. With the app on `/play`, the existing tab should navigate to
   `/game/LOCAL_GAME_ID?panel=actions`. With that game already open, the existing
   tab should be reused without a reload; the worker sends a `push-deep-link`
   message selecting Actions. On a phone-sized viewport confirm the **Actions**
   tab is selected and the action/meeting controls are visible. The app may strip
   the query parameter during its normal URL synchronization, so also check the
   selected panel rather than requiring the parameter to remain forever.

4. Repeat Push twice without clicking the notification between pushes. Read back
   `getNotifications()` and confirm there is only one notification with tag
   `game-LOCAL_GAME_ID`, not a growing stack. Change the body on the second push
   to confirm the replacement carries the latest content.

5. Change `kind` to `ready-check`, `title` to `Your game is ready!`, and use a
   fresh notification. Click it from `/play`: it must open the plain
   `/game/LOCAL_GAME_ID` link, with no Actions hint. Repeat without `kind` to check
   compatibility with older payloads. Focus the game page and deliver once more:
   no new system notification should appear while that page has focus.

6. For the closed-app path, deliver with the app backgrounded, close all app tabs
   **without dismissing the notification**, then click that notification. One
   new window/tab should open the kicks deep link. Actual iOS lock-screen
   delivery additionally requires an installed HTTPS PWA and an actual push
   subscription; DevTools simulation does not establish APNs/FCM delivery.

Record browser/OS, origin, game ID, and results for background/open/closed cases.
DevTools simulation tests payload handling and notification clicks, not server
recipient selection or encrypted network delivery; those are covered by the
mock-transport integration suite. An automated synthetic notificationclick is not
an OS click and does not prove focus permission or physical-device UI behavior.
