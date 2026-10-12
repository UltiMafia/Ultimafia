# Test game chat performance on a phone

The standalone fixture uses the real `TextMeetingLayout`, `SpeechInput`, message
components, and history reducer. Messages are generated locally, and an in-memory
transport echoes what you type. No login, Docker, Firebase configuration, or game
server is required. Nothing is sent to other players.

## Start in WSL

From the repository root:

```bash
cd react_main
npm run perf:chat
```

This builds an optimized production bundle and serves it on port **3002**.
Leave the terminal running. Dependencies must already be installed in
`react_main/node_modules`; otherwise run `npm ci` there first. This test uses a
separate build directory and is not included in the ordinary site build.

Open http://localhost:3002 on Windows to check that it is running.
Re-run the command after changing source code; this is not a live-reloading server.

## Reach it from the iPhone

For WSL 2's default NAT networking, run this in **Windows PowerShell as
Administrator**, not in WSL. Change `Ubuntu` if your distribution has another name.

```powershell
$chatWslIp = ((wsl -d Ubuntu hostname -I).Trim() -split '\s+')[0]
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3002 connectaddress=$chatWslIp connectport=3002
New-NetFirewallRule -DisplayName "Ultimafia chat test 3002" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3002 -RemoteAddress LocalSubnet -Profile Any
Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" | Select-Object IPAddress
```

On the phone, open **http://YOUR-WINDOWS-WIFI-IP:3002** in Safari. Use the Windows
Wi-Fi address, not `localhost` or WSL's `172.x` address. Both devices must be on a
network that allows devices to communicate; guest Wi-Fi isolation can block this.

The WSL IP may change after WSL restarts. Re-run the first two commands if it does;
the firewall rule only needs creating once. If Windows itself cannot open
localhost:3002, fix the test server before investigating the phone connection.

This follows Microsoft's [WSL LAN access instructions](https://learn.microsoft.com/en-us/windows/wsl/networking#accessing-a-wsl-2-distribution-from-your-local-area-network-lan).
Mirrored networking or Docker Desktop port publishing may already provide LAN
access; if the Wi-Fi URL works directly, no port proxy is needed.

## Test sequence

1. Start with **Load 100**, type a sentence, and press the keyboard's Return/Done
   key. Check typing responsiveness and how quickly the input clears.
2. Repeat with **Load 1,000**, **Load 5,000**, and optionally **Load 10,000**. Wait
   for each bulk load to settle first. Bulk creation is deliberately expensive;
   the important measurement is sending *after* the history has loaded.
3. Send several messages at each size. The **Append → next frame** number is a
   rough local rendering/frame-delay measurement; it includes two animation-frame
   waits and is not network latency or a precise browser paint measurement.
4. Try **Stream 2/sec** while typing, then stop it. Scroll up and check that incoming
   messages do not pull you back to the bottom. Scroll back down and check that
   following new messages resumes.
5. Match your usual message layout. Long-press a message on a phone to toggle its
   pin (the counter changes); double-click a message on desktop to append a quote.

Record device/browser, layout, history size, several frame-delay readings, and
whether typing or input clearing visibly pauses. A screenshot of the controls is
enough to share the readings; a Mac debugger is unnecessary.

The fixture uses the real panel layout, transcript, input, sidebar names, and
optional animated name cosmetics. It does not reproduce the full live-game UI,
real server delays, spam limits, or custom/animated avatars. A smooth result
here does not prove the full game is smooth, but a slowdown here gives us a local
reproduction to investigate. It tests the current source, not an A/B comparison
with the old implementation.

## Stop and remove forwarding

Stop the WSL server with Ctrl+C. In Administrator PowerShell:

```powershell
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3002
Remove-NetFirewallRule -DisplayName "Ultimafia chat test 3002"
```


## Animated long-day regression (Linux/macOS only)

Open `http://localhost:3002/?count=2214&nameplates=1717&cosmetic=mixed` to
match the reported transcript/nameplate counts. The desktop fixture includes the
real three-panel layout and sidebar names. Narrow/touch viewports show the real
transcript/input directly; this is not the entire mobile game shell. The default
without query parameters keeps ordinary, unanimated names.

The automated runner builds on those real components and checks idle layout,
offscreen animation suspension, visible cosmetics, typing, socket-echo clearing,
follow-scroll/reading older messages, all four message layouts, pins, quotes, and
a 390×844 Chromium viewport. It retains every message; it does not virtualize or
hide the history. Phone emulation is not a Safari test.

Build with `npx rsbuild build --config rsbuild.chat-perf.config.ts`, then run from `react_main`:

```bash
npm install --prefix /tmp/ultimafia-chat-e2e --no-save --no-package-lock playwright
PLAYWRIGHT_BROWSERS_PATH=/tmp/ultimafia-chat-e2e/browsers /tmp/ultimafia-chat-e2e/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/ultimafia-chat-e2e/node_modules/playwright PLAYWRIGHT_BROWSERS_PATH=/tmp/ultimafia-chat-e2e/browsers node perf/chat-animations.e2e.cjs build-chat-perf
```

The runner owns a loopback-only server on port 3048 and closes its browser/server
on exit. It refuses Windows before importing Playwright: fresh-profile Windows
Chrome launches caused account lockouts during the earlier investigation.
Dependencies stay outside the shared project install.

Optional environment variables:
- `CHAT_TEST_HEADED=1`: use a graphical browser.
- `CHAT_TEST_GL=1`: request ANGLE/OpenGL.
- `CHAT_TEST_REQUIRE_GPU=1`: require browser-reported hardware compositing and
  an active page layer tree; fail instead of accepting software-rendering evidence.
  On this WSL host, `GALLIUM_DRIVER=d3d12` plus all three settings used its Radeon GPU.

Timing budgets are performance checks, not universal hardware guarantees. Record
browser/GPU and compare on the same machine. This is local simulated transport,
not proof of real-server latency or Windows Chrome performance. A live long-game
check remains required before declaring the original report completely resolved.


### Glow appearance regression

With the same isolated Playwright install, run
`PLAYWRIGHT_MODULE=/tmp/ultimafia-chat-e2e/node_modules/playwright PLAYWRIGHT_BROWSERS_PATH=/tmp/ultimafia-chat-e2e/browsers node perf/chat-glow.e2e.cjs`
from `react_main`. The same headed/GPU options apply;
`CHAT_TEST_CHROMIUM_PATH` optionally selects an existing Linux/macOS Chromium.
This test requires Node 22.12+ and freezes the original and patched glow at five matching phases
with opaque neutral/blue text and translucent blue text. It compares halo intensity outside the glyphs and
pixel error, and rejects restoring animated text-shadow. It is a visual
regression check, not a frame-rate benchmark or an exact pixel-equivalence claim.

Optionally set `CHAT_TEST_FIXTURE_URL` to a running loopback chat fixture
(for example `http://127.0.0.1:3002/?count=12&nameplates=12&cosmetic=glow`)
to check that real name components inherit the correct glow color. This option
allows only localhost/127.0.0.1 and does not launch or stop the fixture server.

Run `node perf/name-glow-style.test.cjs` from `react_main` for the browser-free
color parsing and inline-style cleanup/priority regression.
