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

The fixture isolates the transcript and input. It does not reproduce other game
panels, real server delays, spam limits, or custom/animated avatars. A smooth result
here does not prove the full game is smooth, but a slowdown here gives us a local
reproduction to investigate. It tests the current source, not an A/B comparison
with the old implementation.

## Stop and remove forwarding

Stop the WSL server with Ctrl+C. In Administrator PowerShell:

```powershell
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3002
Remove-NetFirewallRule -DisplayName "Ultimafia chat test 3002"
```
