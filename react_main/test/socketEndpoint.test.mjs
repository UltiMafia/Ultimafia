import test from "node:test";
import assert from "node:assert/strict";
import { socketEndpoint } from "../src/utils/socketEndpoint.mjs";

const phone = { protocol: "https:", host: "dev.example.ts.net:8443", hostname: "dev.example.ts.net" };
test("opt-in tailnet development sockets preserve HTTPS and the external port", () => {
  assert.equal(socketEndpoint({ location: phone, configuration: { sameOrigin: "true" }, kind: "chat", port: 2999 }), "wss://dev.example.ts.net:8443/ws/chat");
  assert.equal(socketEndpoint({ location: phone, configuration: { sameOrigin: "true" }, kind: "game", port: 3010 }), "wss://dev.example.ts.net:8443/ws/game/3010");
});
test("same-origin local HTTP development uses ws and validates game ports", () => {
  assert.equal(socketEndpoint({ location: { ...phone, protocol: "http:", host: "localhost:3001" }, configuration: { sameOrigin: "true" }, kind: "game", port: 3010 }), "ws://localhost:3001/ws/game/3010");
  assert.throws(() => socketEndpoint({ location: phone, configuration: { sameOrigin: "true" }, kind: "game", port: "../../admin" }));
});
test("production configured-host, port-host and path routing remain unchanged", () => {
  const configuration = { protocol: "wss", host: "socket.example.org", usePort: "false" };
  assert.equal(socketEndpoint({ location: phone, configuration, kind: "chat", port: 2999 }), "wss://socket.example.org/chatSocket");
  assert.equal(socketEndpoint({ location: phone, configuration: { ...configuration, portHost: "game.example.org" }, kind: "game", port: 3010 }), "wss://game.example.org/3010");
  assert.equal(socketEndpoint({ location: phone, configuration: { protocol: "ws", host: "localhost", usePort: "true" }, kind: "game", port: 3010 }), "ws://dev.example.ts.net:3010");
});
