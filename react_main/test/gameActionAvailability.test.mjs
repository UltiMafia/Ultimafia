import test from "node:test";
import assert from "node:assert/strict";
import {
  getGameActionAvailability,
  isGameActionSelection,
} from "../src/utils/gameActionAvailability.js";

// Same personalized meeting/history shape as the game protocol and the
// redesign fixture, without importing React, transport or server modules.
function makeInput(meetingChanges = {}, inputChanges = {}) {
  const meeting = {
    id: "village",
    amMember: true,
    voting: true,
    canVote: true,
    votes: {},
    ...meetingChanges,
  };
  return {
    meeting,
    history: {
      currentState: 1,
      states: { 1: { name: "Day 1", meetings: { village: meeting } } },
    },
    stateViewing: 1,
    self: "p0",
    ...inputChanges,
  };
}

function assertBlocked(input, reason) {
  const result = getGameActionAvailability(input);
  assert.equal(result.canAct, false);
  assert.equal(result.reason, reason);
  return result;
}

test("a permitted current meeting is actionable", () => {
  assert.deepEqual(getGameActionAvailability(makeInput()), {
    canAct: true,
    reason: null,
    isCurrentState: true,
    hasVoted: false,
  });
});

test("missing input and missing meeting are unavailable", () => {
  assertBlocked(undefined, "This action is unavailable.");
  assertBlocked(makeInput({}, { meeting: null }), "This action is unavailable.");
});

for (const [name, history] of [
  ["missing history", undefined],
  ["null history", null],
  ["missing current state", {}],
  ["null current state", { currentState: null }],
]) {
  test(`${name} cannot allow an action`, () => {
    assertBlocked(makeInput({}, { history }), "The current phase is unavailable.");
  });
}

for (const stateViewing of [undefined, null]) {
  test(`a ${stateViewing} viewed state is unavailable`, () => {
    assertBlocked(makeInput({}, { stateViewing }), "No phase is selected.");
  });
}

test("two missing or null states do not count as current", () => {
  for (const state of [undefined, null]) {
    const result = assertBlocked(
      makeInput({}, { history: { currentState: state }, stateViewing: state }),
      "The current phase is unavailable."
    );
    assert.equal(result.isCurrentState, false);
  }
});

for (const stateViewing of [0, 2, "1"]) {
  test(`viewing ${JSON.stringify(stateViewing)} does not match current state 1`, () => {
    const result = assertBlocked(
      makeInput({}, { stateViewing }),
      "View the current phase to act."
    );
    assert.equal(result.isCurrentState, false);
  });
}

for (const currentState of [0, -1, -2]) {
  test(`permitted current state ${currentState} remains actionable`, () => {
    const input = makeInput(
      { id: currentState === -2 ? "kudos" : "village" },
      { history: { currentState }, stateViewing: currentState }
    );
    assert.equal(getGameActionAvailability(input).canAct, true);
  });
}

test("viewing an old phase after game end remains read-only", () => {
  assertBlocked(
    makeInput({}, { history: { currentState: -2 } }),
    "View the current phase to act."
  );
});

test("review is read-only even for a permitted current postgame meeting", () => {
  for (const currentState of [1, -2]) {
    assertBlocked(
      makeInput({}, { history: { currentState }, stateViewing: currentState, review: true }),
      "Game review is read-only."
    );
  }
});

test("review remains read-only while meeting data is missing", () => {
  assertBlocked({ review: true }, "Game review is read-only.");
});

for (const meetingChanges of [
  { finished: true },
  { finished: true, instant: true, instantButChangeable: true },
  { finished: true, repeatable: true },
]) {
  test(`a finished meeting is unavailable: ${JSON.stringify(meetingChanges)}`, () => {
    assertBlocked(makeInput(meetingChanges), "This action has finished.");
  });
}

test("a finished postgame meeting is unavailable", () => {
  assertBlocked(
    makeInput({ finished: true }, { history: { currentState: -2 }, stateViewing: -2 }),
    "This action has finished."
  );
});

for (const amMember of [false, undefined]) {
  test(`membership ${amMember} cannot act even if listed among members`, () => {
    assertBlocked(
      makeInput({ amMember, members: [{ id: "p0", canVote: true }] }),
      "You are not a member of this meeting."
    );
  });
}

for (const canVote of [false, undefined]) {
  test(`canVote ${canVote} cannot act`, () => {
    assertBlocked(makeInput({ canVote }), "You cannot vote in this meeting.");
  });
}

test("an unanswered instant meeting is actionable", () => {
  assert.equal(getGameActionAvailability(makeInput({ instant: true })).canAct, true);
});

test("a nonchangeable instant response is locked", () => {
  assertBlocked(
    makeInput({ instant: true, votes: { p0: "p1" } }),
    "Your response cannot be changed."
  );
});

test("an instantButChangeable response remains actionable", () => {
  assert.equal(
    getGameActionAvailability(makeInput({
      instant: true,
      instantButChangeable: true,
      votes: { p0: "p1" },
    })).canAct,
    true
  );
});

test("a regular response can be changed", () => {
  assert.equal(getGameActionAvailability(makeInput({ votes: { p0: "p1" } })).canAct, true);
});

test("noUnvote permits a first response but locks an existing response", () => {
  assert.equal(getGameActionAvailability(makeInput({ noUnvote: true })).canAct, true);
  assertBlocked(
    makeInput({ noUnvote: true, votes: { p0: "p1" } }),
    "Your response cannot be changed."
  );
});

test("noUnvote also locks instantButChangeable meetings", () => {
  assertBlocked(
    makeInput({
      instant: true,
      instantButChangeable: true,
      noUnvote: true,
      votes: { p0: "p1" },
    }),
    "Your response cannot be changed."
  );
});

for (const response of [false, 0, "", null, ["p1"], [false], [0]]) {
  test(`existing response ${JSON.stringify(response)} locks an instant meeting`, () => {
    const result = assertBlocked(
      makeInput({ instant: true, votes: { p0: response } }),
      "Your response cannot be changed."
    );
    assert.equal(result.hasVoted, true);
  });
}

for (const [name, votes] of [
  ["missing votes", undefined],
  ["null votes", null],
  ["absent own response", { p1: "p2" }],
  ["undefined response", { p0: undefined }],
  ["empty multi-selection", { p0: [] }],
]) {
  test(`${name} does not lock a meeting`, () => {
    const result = getGameActionAvailability(makeInput({ instant: true, noUnvote: true, votes }));
    assert.equal(result.canAct, true);
    assert.equal(result.hasVoted, false);
  });
}

test("explicit server true locks anonymous, absent and empty responses", () => {
  for (const votes of [{ anonymous: "p1" }, {}, { p0: [] }, { p0: undefined }]) {
    const result = assertBlocked(
      makeInput({ playerHasVoted: true, instant: true, votes }),
      "Your response cannot be changed."
    );
    assert.equal(result.hasVoted, true);
  }
});

test("explicit server false overrides stale visible or hidden responses", () => {
  for (const response of ["p1", null, false, 0, ["p1"]]) {
    const result = getGameActionAvailability(makeInput({
      playerHasVoted: false,
      instant: true,
      noUnvote: true,
      votes: { p0: response },
    }));
    assert.equal(result.canAct, true);
    assert.equal(result.hasVoted, false);
  }
});

test("null or undefined server response state falls back to vote data", () => {
  for (const playerHasVoted of [null, undefined]) {
    assert.equal(getGameActionAvailability(makeInput({ playerHasVoted, votes: { p0: false } })).hasVoted, true);
  }
});

test("inherited votes and missing self are not responses", () => {
  const inheritedVotes = Object.create({ p0: "p1" });
  assert.equal(getGameActionAvailability(makeInput({ votes: inheritedVotes })).hasVoted, false);
  const input = makeInput({ votes: { undefined: "p1", null: "p1" } }, { self: undefined });
  assert.equal(getGameActionAvailability(input).hasVoted, false);
  assert.equal(getGameActionAvailability({ ...input, self: null }).hasVoted, false);
});

test("text actions do not require targets or target-list membership", () => {
  for (const targets of [undefined, [], ["listed response"]]) {
    const input = makeInput({
      inputType: "text",
      targets,
      textOptions: { minLength: 1, maxLength: 50 },
      votes: { p0: "arbitrary constrained response" },
    });
    assert.equal(getGameActionAvailability(input).canAct, true);
  }
});

test("selection matching preserves false, zero and empty text responses", () => {
  for (const selection of [false, 0, "", "p1"]) {
    assert.equal(isGameActionSelection({ meeting: { votes: { p0: selection } }, self: "p0", selection }), true);
  }
  assert.equal(isGameActionSelection({ meeting: { votes: { p0: 0 } }, self: "p0", selection: false }), false);
  assert.equal(isGameActionSelection({ meeting: { votes: { p0: "0" } }, self: "p0", selection: 0 }), false);
});

test("multi-selection matching uses raw elements with strict equality", () => {
  const input = { meeting: { votes: { p0: [false, 0, "p1"] } }, self: "p0" };
  for (const selection of [false, 0, "p1"]) {
    assert.equal(isGameActionSelection({ ...input, selection }), true);
  }
  for (const selection of ["0", "p2", null, undefined]) {
    assert.equal(isGameActionSelection({ ...input, selection }), false);
  }
});

test("hidden, absent and empty responses never select a target", () => {
  assert.equal(isGameActionSelection(), false);
  for (const response of [null, undefined, [], [null]]) {
    for (const selection of [null, undefined, false, 0, "p1"]) {
      assert.equal(isGameActionSelection({ meeting: { votes: { p0: response } }, self: "p0", selection }), false);
    }
  }
  assert.equal(isGameActionSelection({ meeting: { playerHasVoted: true }, self: "p0", selection: "p1" }), false);
});

test("selection matching respects explicit server false and own vote entries", () => {
  assert.equal(isGameActionSelection({ meeting: { playerHasVoted: false, votes: { p0: "p1" } }, self: "p0", selection: "p1" }), false);
  assert.equal(isGameActionSelection({ meeting: { votes: Object.create({ p0: "p1" }) }, self: "p0", selection: "p1" }), false);
  assert.equal(isGameActionSelection({ meeting: { votes: { undefined: "p1" } }, selection: "p1" }), false);
});

test("helpers do not mutate frozen input or response arrays", () => {
  const response = Object.freeze([false, "p1"]);
  const meeting = Object.freeze({ amMember: true, canVote: true, votes: Object.freeze({ p0: response }) });
  const input = Object.freeze({ meeting, history: Object.freeze({ currentState: 1 }), stateViewing: 1, self: "p0" });
  assert.equal(getGameActionAvailability(input).canAct, true);
  assert.equal(isGameActionSelection({ ...input, selection: false }), true);
  assert.deepEqual(response, [false, "p1"]);
});
