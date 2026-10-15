// JOURNALIST: each night you pick a player and receive the reports they get.
// The tutorial picks Cassidy (the real Cop) or Boone (the Janitor) at random.
// Cop branch: you back up the real Cop's reports and the town follows her.
// Janitor branch: Boone's cleaning report exposes him and the Sheriff shoots.

const CLAIM_REACTIONS = {
  wrongRole: [
    ["v1", "Wait, you're claiming THAT now? Pick a story, {name}."],
    ["cop", "That's not a role that would know this. Who are you really?"],
  ],
  wrongTarget: [
    ["v3", "Hold on, that's not who we're talking about. Who did you read?"],
    ["sheriff", "Get the name right, {name}. I'm not shooting on a guess."],
  ],
  wrongVerdict: [
    ["v1", "Innocent? Then why are you bringing it up?"],
    ["sheriff", "That doesn't line up with anything. Try again."],
  ],
  incomplete: [
    ["sheriff", "Spit it out, {name}. What are you and what did you see?"],
    ["v3", "That's vague. Role and what you learned, please."],
  ],
  silence: [
    ["v1", "{name}, you've been awfully quiet."],
    ["sheriff", "Quiet folks make me nervous. Talk, {name}."],
    ["v3", "{name}?? Anything?"],
  ],
};

function claimHints(t, what) {
  return {
    wrongRole: "Claim your real role: Journalist. That's what makes your info believable.",
    wrongTarget: `Name the right player: ${what}.`,
    wrongVerdict: "Say they're GUILTY. That's what the report showed.",
    incomplete: `Include both: you're the Journalist, and ${what} is guilty.`,
    silence: `The town is waiting. Claim Journalist and say ${what} is guilty.`,
  };
}

function mafiaKill(t, target, clean) {
  for (const key of ["mafioso", "lawyer", "janitor"]) t.vote(key, "Mafia Kill", target);
  t.vote("janitor", "Clean Death", clean ? "Yes" : "No");
  t.vote("lawyer", "Litigate", "*");
}

async function lynch(t, k, target, text) {
  await t.expectVote("Village", target, {
    token: k,
    text: text || `In the Village box, vote ${t.nameOf(target)}.`,
    wrongReactions: [
      ["v1", `Huh? Everything points at ${t.nameOf(target)}. Why vote someone else?`],
      ["cop", "Stick with the evidence, {name}."],
    ],
  });
  for (const key of ["cop", "sheriff", "v1", "v2", "v3"]) t.vote(key, "Village", target);
  await t.advance(k);
}

module.exports = {
  id: "journalist",
  title: "Journalist",
  roleName: "Journalist",
  userSeat: "journalist",
  blurb: "Read another player's reports and use them to catch the Mafia.",
  available: true,
  freeVote: () => false,
  intro:
    "Welcome to the tutorial! You are the Journalist, on the town side. Each night you pick one player and receive every report they get that night: investigation results, cleaned roles, anything.",

  states: {
    async Night1(t, k) {
      const target = t.data.target || (t.data.target = Math.random() < 0.5 ? "cop" : "janitor");
      t.branch = target;
      await t.expectVote("Receive Reports", target, {
        token: k,
        text: `Let's read someone's reports tonight. In the Receive Reports box, click ${t.nameOf(target)}.`,
        wrong: () => t.guide(`For this tutorial, read ${t.nameOf(target)}'s reports. Click ${t.nameOf(target)} in the Receive Reports box.`),
      });
      t.vote("cop", "Investigate", "mafioso");
      mafiaKill(t, "v2", true);
      if (target === "cop")
        t.guide(`Report received: ${t.nameOf("cop")} investigated Silas and learned he is GUILTY. Only a Cop gets investigation results, so ${t.nameOf("cop")} is the real Cop.`);
      else
        t.guide(`Report received: ${t.nameOf("janitor")} cleaned Eli's body and learned Eli was a Villager. Only the Janitor cleans bodies, so ${t.nameOf("janitor")} is Mafia!`);
      await t.advance(k);
    },

    async Day1(t, k) {
      await t.chat("Village", [
        ["v1", "Eli's dead and his role is hidden. There's a Janitor out there."],
        ["v3", "Any power roles with info?"],
      ], k);
      if (t.branch === "cop") return copDay1(t, k);
      return janitorDay1(t, k);
    },

    async Night2(t, k) {
      if (t.branch === "cop") {
        await t.expectVote("Receive Reports", "cop", {
          token: k,
          text: `Keep following the real Cop. In the Receive Reports box, click ${t.nameOf("cop")}.`,
        });
        t.vote("cop", "Investigate", "lawyer");
        mafiaKill(t, "v3", false);
        t.guide(`Report received: ${t.nameOf("cop")} investigated Flint and learned he is GUILTY.`);
      } else {
        t.guide("Night falls. The Cop is investigating again.");
        t.vote("cop", "Investigate", "lawyer");
        for (const key of ["lawyer"]) t.vote(key, "Mafia Kill", "v3");
        t.vote("lawyer", "Litigate", "*");
      }
      await t.advance(k);
    },

    async Day2(t, k) {
      if (t.branch === "cop") return copDay2(t, k);
      await t.chat("Village", [
        ["cop", "Checked Flint last night: GUILTY. He's the last one."],
        ["lawyer", "That's... a lie."],
      ], k);
      t.guide(`${t.nameOf("cop")} has been right every time. Flint is the last Mafia member.`);
      await lynch(t, k, "lawyer", "Finish it: in the Village box, vote Flint.");
    },
  },

  epilogue: (t) => [
    "The town won!",
    t.branch === "cop"
      ? "Lesson: following the real Cop let you confirm her results, and that exposed a fake Cop claim. A Journalist turns one player's info into proof."
      : "Lesson: the Journalist sees every report, including the Janitor's cleaning results. One night's reading exposed a Mafia member.",
  ],
};

async function copDay1(t, k) {
  await t.chat("Village", [["cop", "I'm the Cop. I checked Silas: GUILTY."], ["mafioso", "Lies. Who's going to back that up?"]], k);
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "journalist", target: "mafioso", verdict: "guilty" },
    text: `Back up ${t.nameOf("cop")}. In town chat, claim Journalist and say you saw her report: Silas is guilty.`,
    example: `I'm the Journalist. I read Cassidy's report: Silas is guilty.`,
    reactions: CLAIM_REACTIONS,
    hints: claimHints(t, "Silas"),
  });
  await t.chat("Village", [
    ["v1", "A Journalist confirming the Cop? That's solid."],
    ["sheriff", "I believe them. Silas goes."],
    ["mafioso", "You're all making a mistake!"],
  ], k);
  await lynch(t, k, "mafioso", "The town believes the Cop. In the Village box, vote Silas.");
}

async function copDay2(t, k) {
  await t.chat("Village", [
    ["cop", "Checked Flint last night: GUILTY."],
    ["janitor", "Actually I'M the real Cop, and Cassidy is the one lying. I checked her: guilty."],
    ["v1", "Two Cops now? Journalist, who's real?"],
  ], k);
  t.guide(`You've read ${t.nameOf("cop")}'s reports two nights in a row. She's the real Cop, so ${t.nameOf("janitor")} is lying.`);
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "journalist", target: "janitor", verdict: "guilty" },
    text: `Expose the liar. In town chat, say you're the Journalist and ${t.nameOf("janitor")} is guilty (a fake Cop).`,
    example: `Journalist here: I've read Cassidy's reports both nights. Boone is a fake Cop, he's guilty.`,
    reactions: CLAIM_REACTIONS,
    hints: claimHints(t, t.nameOf("janitor")),
  });
  await t.say("sheriff", "Village", "That's enough for me. Boone, you're done.", k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.guide(`The Sheriff shot ${t.nameOf("janitor")}: he was the Janitor. Now finish with Flint, who the Cop found guilty.`);
  await lynch(t, k, "lawyer", "In the Village box, vote Flint.");
}

async function janitorDay1(t, k) {
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "journalist", target: "janitor", verdict: "guilty" },
    text: `You know who cleaned Eli. In town chat, claim Journalist and say ${t.nameOf("janitor")} is guilty (he's the Janitor).`,
    example: `I'm the Journalist. I read Boone's reports: he cleaned Eli. Boone is the Janitor, guilty!`,
    reactions: CLAIM_REACTIONS,
    hints: claimHints(t, t.nameOf("janitor")),
  });
  await t.chat("Village", [
    ["janitor", "That's ridiculous! I'm a Villager!"],
    ["v3", "A Journalist would know. That's a hard claim to fake."],
    ["sheriff", "I've got a gun and I trust the Journalist. Sorry, Boone."],
  ], k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.guide(`The Sheriff shot ${t.nameOf("janitor")}: he was the Janitor, Mafia. Your report was right.`);
  await t.chat("Village", [["cop", "And I'm the Cop: I checked Silas last night. GUILTY."]], k);
  await lynch(t, k, "mafioso", "The Cop found Silas guilty. In the Village box, vote Silas.");
}
