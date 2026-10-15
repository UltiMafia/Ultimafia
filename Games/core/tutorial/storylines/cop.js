// COP: investigate at night, get a guilty result, claim Cop and share it.
// The town lynches the Mafia member you found; a fake Cop claim on Day 2 is
// settled by the Journalist, and the town wins.

const CLAIM_REACTIONS = {
  wrongRole: [
    ["v1", "Wait, now you're claiming THAT? Pick a story, {name}."],
    ["sheriff", "That role wouldn't know anything. Who are you really?"],
  ],
  wrongTarget: [
    ["v3", "Hold on, that's not who you checked last night, is it?"],
    ["journalist", "Who did you actually investigate, {name}? Be exact."],
  ],
  wrongVerdict: [
    ["v1", "Innocent? Then that doesn't help us much."],
    ["sheriff", "A clear doesn't give me anyone to shoot. Anything guilty?"],
  ],
  incomplete: [
    ["sheriff", "Spit it out, {name}. Role and result."],
    ["v3", "That's vague. What did you find?"],
  ],
  silence: [
    ["v1", "{name}, you've been awfully quiet."],
    ["sheriff", "Silence is suspicious, {name}. Talk."],
    ["v3", "{name}?? Anything?"],
  ],
};

function hints(name) {
  return {
    wrongRole: "Claim your real role: Cop. Your result only counts if the town knows you're the Cop.",
    wrongTarget: `Share the right result: you investigated ${name}.`,
    wrongVerdict: `Your result was GUILTY. Say ${name} is guilty.`,
    incomplete: `Include all three: you're the Cop, ${name}, guilty.`,
    silence: `The town is waiting. Type: "I'm the Cop. ${name} is guilty."`,
  };
}

async function lynch(t, k, target, text) {
  await t.expectVote("Village", target, {
    token: k,
    text,
    wrongReactions: [
      ["v1", `You just told us ${t.nameOf(target)} is guilty. Why vote someone else?`],
      ["sheriff", "Vote your own result, {name}."],
    ],
  });
  for (const key of ["journalist", "sheriff", "v1", "v2", "v3"]) t.vote(key, "Village", target);
  await t.advance(k);
}

function mafiaKill(t, target) {
  for (const key of ["mafioso", "lawyer", "janitor"]) t.vote(key, "Mafia Kill", target);
  t.vote("janitor", "Clean Death", "No");
  t.vote("lawyer", "Litigate", "*");
}

module.exports = {
  id: "cop",
  title: "Cop",
  roleName: "Cop",
  userSeat: "cop",
  blurb: "Investigate at night, find the Mafia, and lead the town to them.",
  available: true,
  freeVote: () => false,
  intro:
    "Welcome to the tutorial! You are the Cop, on the town side. Each night you investigate one player and learn whether they're guilty (Mafia) or innocent.",

  states: {
    async Night1(t, k) {
      await t.expectVote("Investigate", "mafioso", {
        token: k,
        text: "Pick someone to investigate. In the Investigate box, click Silas.",
        wrong: () => t.guide("For this tutorial, investigate Silas. Click Silas in the Investigate box."),
      });
      mafiaKill(t, "v2");
      t.guide("Your result arrives at the end of the night. Silas: GUILTY. He's Mafia!");
      await t.advance(k);
    },

    async Day1(t, k) {
      await t.chat("Village", [
        ["v1", "Eli's dead. Anyone have information?"],
        ["v3", "Power roles, now's the time."],
      ], k);
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "cop", target: "mafioso", verdict: "guilty" },
        text: "Share your result. In town chat, claim Cop and say Silas is guilty.",
        example: "I'm the Cop. I investigated Silas last night: GUILTY.",
        reactions: CLAIM_REACTIONS,
        hints: hints("Silas"),
      });
      await t.chat("Village", [
        ["mafioso", "What?! That's a lie!"],
        ["sheriff", "A Cop with a guilty result. That's good enough for me."],
        ["v1", "Silas it is."],
      ], k);
      await lynch(t, k, "mafioso", "The town believes you. In the Village box, vote Silas.");
    },

    async Night2(t, k) {
      await t.expectVote("Investigate", "lawyer", {
        token: k,
        text: "Investigate again. In the Investigate box, click Flint.",
        wrong: () => t.guide("Investigate Flint this time. Click Flint in the Investigate box."),
      });
      mafiaKill(t, "v3");
      t.guide("Result: Flint is GUILTY.");
      await t.advance(k);
    },

    async Day2(t, k) {
      await t.say("v1", "Village", "Hattie's gone. Cop, anything new?", k);
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "cop", target: "lawyer", verdict: "guilty" },
        text: "Share tonight's result: say Flint is guilty.",
        example: "Cop again: I checked Flint last night, GUILTY.",
        reactions: CLAIM_REACTIONS,
        hints: hints("Flint"),
      });
      await t.chat("Village", [
        ["janitor", "Hold on, I'M the real Cop. I checked our 'Cop' here: GUILTY."],
        ["v3", "Two Cops?"],
        ["journalist", "I'm the Journalist. I've been reading the Cop's reports: the guilty results on Silas and Flint were real. Boone is lying."],
        ["sheriff", "Then Boone's the fake. Bang."],
      ], k);
      t.guide("When someone counterclaims your role, other roles can confirm you. The Journalist proved your reports were real, so the Sheriff shot the fake Cop.");
      t.vote("sheriff", "Shoot Gun", "janitor");
      await t.wait(t.timing.beat, k);
      t.guide("Boone was the Janitor, Mafia. One left: Flint.");
      await lynch(t, k, "lawyer", "Finish it: in the Village box, vote Flint.");
    },
  },

  epilogue: () => [
    "The town won!",
    "Lesson: as Cop, share guilty results clearly (role, name, result). If someone counterclaims you, other town roles and your track record can prove you're real.",
  ],
};
