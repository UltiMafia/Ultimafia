import test from "node:test";
import assert from "node:assert/strict";
import { legacyObituaryMessages } from "../src/utils/legacyObituaries.js";

const message = {
  id: "2:Night",
  source: "Night",
  time: 123456,
  obituaries: [
    {
      id: "anonymous-one",
      playerInfo: { name: "Anonymous One" },
      snippets: {
        lastWill: ":will: As read from Anonymous One's last will: check Two",
        revealMessage: "Anonymous One's role is Doctor:Insane.",
        deathMessage: "Anonymous One was killed.",
      },
    },
    {
      id: "anonymous-two",
      playerInfo: { name: "Anonymous Two" },
      snippets: {
        deathMessage: ":bomb: Anonymous Two explodes into a thousand pieces.",
        lastWill: ":will: Anonymous Two did not leave a will.",
      },
    },
  ],
};

test("compact obituaries keep each death's public text in one box in death/reveal/will order", () => {
  const original = structuredClone(message);
  const alerts = legacyObituaryMessages(message);
  assert.equal(alerts.length, 2);
  assert.deepEqual(alerts.map((alert) => alert.obituaryLines), [
    [
      "Anonymous One was killed.",
      "Anonymous One's role is Doctor:Insane.",
      ":will: As read from Anonymous One's last will: check Two",
    ],
    [
      ":bomb: Anonymous Two explodes into a thousand pieces.",
      ":will: Anonymous Two did not leave a will.",
    ],
  ]);
  for (const alert of alerts) {
    assert.equal(alert.senderId, "server");
    assert.equal(alert.time, message.time);
    assert.deepEqual(alert.tags, ["important"]);
    assert.equal(alert.obituaries, undefined);
    assert.equal(alert.content, alert.obituaryLines.join("\n"));
  }
  assert.deepEqual(message, original);
});

test("legacy alert IDs are stable and distinct for anonymous players and batches", () => {
  const alerts = legacyObituaryMessages(message);
  assert.deepEqual(legacyObituaryMessages(message), alerts);
  assert.equal(new Set(alerts.map((alert) => alert.id)).size, alerts.length);
  const other = legacyObituaryMessages({ ...message, id: "2:Day" });
  assert.ok(other.every((alert) => !alerts.some((old) => old.id === alert.id)));
});

test("alignment-only and hidden reveals are not inferred from player data", () => {
  for (const revealMessage of ["One's alignment is Mafia.", "", undefined]) {
    const alerts = legacyObituaryMessages({
      ...message,
      obituaries: [{
        id: "one",
        playerInfo: { role: "Doctor" },
        snippets: { deathMessage: "One was killed.", revealMessage },
      }],
    });
    assert.deepEqual(alerts[0].obituaryLines, [
      "One was killed.",
      ...(revealMessage ? [revealMessage] : []),
    ]);
  }
});

test("a peaceful night is a plain alert; other empty batches stay empty", () => {
  for (const source of ["Night", "Day", "Postgame", "Gun"]) {
    const alerts = legacyObituaryMessages({ ...message, source, obituaries: [] });
    assert.deepEqual(alerts.map((alert) => alert.content),
      source === "Night" ? ["No one died last night."] : []);
  }
});
