import assert from "node:assert/strict";
import test from "node:test";

import { stripEmotes, summariseState } from "../src/utils/stateHighlights.js";

function obituary(id, name, deathMessage, revealMessage) {
  return {
    id,
    playerInfo: { id, name },
    snippets: { deathMessage, revealMessage },
  };
}

function state(
  name,
  { deaths = [], alerts = [], roles = {}, sources = {}, winners = null } = {}
) {
  const obituaries = {};
  for (const source of Object.keys(sources)) {
    obituaries[source] = {
      source,
      time: sources[source].time,
      obituaries: sources[source].deaths,
    };
  }
  if (deaths.length) {
    obituaries["instant-100"] = {
      source: "instant-100",
      time: 100,
      obituaries: deaths,
    };
  }

  return { name, alerts, obituaries, roles, winners };
}

test("strips emotes and collapses whitespace", () => {
  assert.equal(stripEmotes(":gun: Alice  was :bomb: hit. "), "Alice was hit.");
  assert.equal(stripEmotes(""), "");
  assert.equal(stripEmotes(null), "");
});

test("a phase gets the deaths that resolved at its end", () => {
  const states = {
    1: state("Night 1"),
    2: state("Day 1", {
      sources: {
        Night: {
          time: 500,
          deaths: [obituary("a", "Alice", "Alice was killed.")],
        },
      },
      roles: { a: "Villager:" },
    }),
  };

  // The night's kill is announced on the following day, but it belongs to the
  // night that caused it.
  const night = summariseState(states, 1);
  assert.deepEqual(night.events, [
    {
      time: 500,
      kind: "death",
      id: "a",
      name: "Alice",
      detail: "was killed.",
      role: "Villager",
    },
  ]);

  // The day that only announces it has no events of its own.
  assert.equal(summariseState(states, 2).isEmpty, true);
});

test("a day owns its condemnation and its own instant events", () => {
  const states = {
    1: state("Day 1"),
    2: state("Night 1", {
      sources: {
        Day: {
          time: 900,
          deaths: [
            obituary("b", "Bob", "Bob has been condemned to the gallows."),
          ],
        },
      },
      roles: { b: "Mafioso:" },
    }),
  };

  const day = summariseState(states, 1);
  assert.deepEqual(day.events, [
    {
      time: 900,
      kind: "death",
      id: "b",
      name: "Bob",
      detail: "has been condemned to the gallows.",
      role: "Mafioso",
    },
  ]);
  assert.equal(summariseState(states, 2).isEmpty, true);
});

test("events are ordered by the time the game recorded them", () => {
  const states = {
    1: state("Day 1", {
      sources: {
        "instant-300": {
          time: 300,
          deaths: [
            obituary("c", "Carol", "Carol collapsed to the ground from a gunshot wound."),
          ],
        },
        "instant-100": {
          time: 100,
          deaths: [obituary("a", "Alice", "Alice was killed.")],
        },
      },
      alerts: [{ time: 150, content: ":gun: Dave pulls a gun and shoots at Bob!" }],
    }),
  };

  const events = summariseState(states, 1).events;
  assert.deepEqual(
    events.map((event) => event.name || event.text),
    [
      "Alice",
      "Dave pulls a gun and shoots at Bob!",
      "Carol",
    ]
  );
  assert.deepEqual(
    events.map((event) => (event.kind === "death" ? event.detail : event.text)),
    [
      "was killed.",
      "Dave pulls a gun and shoots at Bob!",
      "collapsed to the ground from a gunshot wound.",
    ]
  );
});

test("a state does not repeat the deaths it only announces", () => {
  const states = {
    1: state("Night 1"),
    2: state("Day 1", {
      sources: {
        Night: { time: 200, deaths: [obituary("a", "Alice", "Alice was killed.")] },
      },
    }),
    3: state("Night 2", {
      sources: {
        Day: { time: 300, deaths: [obituary("b", "Bob", "Bob was condemned.")] },
      },
    }),
  };

  // Night 1 owns Alice's death, which Day 1 announces.
  assert.deepEqual(
    summariseState(states, 1).events.map((event) => event.name),
    ["Alice"]
  );
  // Day 1 owns Bob's death, which Night 2 announces, and does not repeat
  // Alice's announcement from its own obituaries.
  assert.deepEqual(
    summariseState(states, 2).events.map((event) => event.name),
    ["Bob"]
  );
  // Night 2 only announces Day 1's death.
  assert.equal(summariseState(states, 3).isEmpty, true);
});

test("a game-ending action belongs to the final state", () => {
  const states = {
    4: state("Day 3"),
    "-2": state("Postgame", {
      sources: {
        Postgame: {
          time: 700,
          deaths: [obituary("x", "Alice", "Alice has been condemned to the gallows.")],
        },
      },
      winners: { groups: ["Village"] },
    }),
  };

  assert.deepEqual(summariseState(states, 4).events.map((event) => event.name), [
    "Alice",
  ]);
  assert.equal(summariseState(states, 4).result, null);

  const postgame = summariseState(states, "-2");
  assert.equal(postgame.events.length, 0);
  assert.equal(postgame.result, "Village win");
});

test("does not infer deaths from votes", () => {
  const states = {
    1: state("Day 1", {
      sources: {},
      roles: {},
    }),
  };
  // A village vote exists, but the game recorded no death for it.
  states[1].meetings = {
    village: { speech: true, voting: true, votes: { a: "x", b: "x" } },
  };

  assert.equal(summariseState(states, 1).isEmpty, true);
});

test("keeps the player name when a custom death message drops it", () => {
  const states = {
    1: state("Day 1", {
      deaths: [obituary("a", "Alice", "The ground opened up.")],
    }),
  };

  const [event] = summariseState(states, 1).events;
  assert.equal(event.name, "Alice");
  assert.equal(event.detail, "The ground opened up.");
});

test("a death follows the shot that announced it even if timestamped first", () => {
  const states = {
    1: state("Day 1", {
      sources: {
        "instant-100": {
          time: 100,
          deaths: [
            obituary("a", "old", "old collapsed to the ground from a gunshot wound."),
          ],
        },
      },
      alerts: [{ time: 200, content: ":gun: RetroRodgney pulls a gun and shoots at old!" }],
    }),
  };

  const events = summariseState(states, 1).events;
  assert.deepEqual(
    events.map((event) => event.kind),
    ["shot", "death"]
  );
});

test("a death follows a shot recorded in the same millisecond", () => {
  const states = {
    1: state("Day 1", {
      sources: {
        "instant-100": {
          time: 100,
          deaths: [
            obituary("a", "old", "old collapsed to the ground from a gunshot wound."),
          ],
        },
      },
      alerts: [{ time: 100, content: ":gun: RetroRodgney pulls a gun and shoots at old!" }],
    }),
  };

  const events = summariseState(states, 1).events;
  assert.deepEqual(
    events.map((event) => event.kind),
    ["shot", "death"]
  );
});

test("an unrelated death keeps its recorded position", () => {
  const states = {
    1: state("Day 1", {
      sources: {
        "instant-100": {
          time: 100,
          deaths: [obituary("a", "Alice", "Alice was killed.")],
        },
      },
      alerts: [{ time: 200, content: ":gun: Bob pulls a gun and shoots at Carol!" }],
    }),
  };

  const events = summariseState(states, 1).events;
  assert.deepEqual(
    events.map((event) => event.name || event.text),
    ["Alice", "Bob pulls a gun and shoots at Carol!"]
  );
});

test("alerts and obituaries accept missing data", () => {
  const states = {
    "-1": { name: "Pregame" },
    0: { name: "Night 1", alerts: ["plain string alert"] },
  };

  assert.deepEqual(summariseState(states, -1), {
    name: "Pregame",
    events: [],
    result: null,
    isEmpty: true,
  });
  assert.equal(summariseState(states, 0).isEmpty, true);
  assert.equal(summariseState(states, 99).name, "Unknown state");
  assert.equal(summariseState(null, 0).isEmpty, true);
});

test("modifier roles keep their suffix", () => {
  const states = {
    1: state("Day 1", {
      deaths: [obituary("a", "Alice", "Alice was killed.")],
      roles: { a: "Villager:Charismatic" },
    }),
  };

  assert.equal(summariseState(states, 1).events[0].role, "Villager (Charismatic)");
});
