// The transcript is keyed by message id, so a duplicate entry puts two rows at
// one offset for a frame and shifts everything below it. These cases are the
// shapes duplicates actually arrive in.
const assert = require("node:assert");
const { dedupeMessages } = require("../src/shared/dedupeMessages");

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${name} - ${error.message}`);
  }
}

check("a repeated message id keeps the first entry", () => {
  const first = { id: "m1", content: "first" };
  const second = { id: "m1", content: "second" };
  const result = dedupeMessages([first, second]);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0], first);
});

check("distinct ids and order are preserved", () => {
  const messages = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const result = dedupeMessages(messages);
  assert.deepStrictEqual(
    result.map((message) => message.id),
    ["a", "b", "c"]
  );
});

check("numeric and string ids are the same message", () => {
  const result = dedupeMessages([{ id: 7 }, { id: "7" }]);
  assert.strictEqual(result.length, 1);
});

check("the same server row inserted twice is dropped", () => {
  const alert = { senderId: "server", time: 10 };
  const result = dedupeMessages([{ id: "a" }, alert, { id: "b" }, alert]);
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result.filter((message) => message === alert).length, 1);
});

check("two separate announcements with the same text both stay", () => {
  const first = { senderId: "server", time: 10, content: "Night falls." };
  const second = { senderId: "server", time: 20, content: "Night falls." };
  const result = dedupeMessages([first, second]);
  assert.strictEqual(result.length, 2);
});

check("messages without ids or objects pass through", () => {
  const result = dedupeMessages([null, undefined, { content: "x" }]);
  assert.strictEqual(result.length, 3);
});

check("non-array input is returned untouched", () => {
  assert.strictEqual(dedupeMessages(undefined), undefined);
});

console.log(failures ? `failureCount ${failures}` : "failureCount 0");
process.exit(failures ? 1 : 0);
