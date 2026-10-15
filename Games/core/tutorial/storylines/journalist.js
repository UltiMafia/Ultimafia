// JOURNALIST: each night you pick a player and receive the reports they get.
// The tutorial picks the real Cop or the Janitor at random.
// Cop branch: you back up the real Cop's reports and the town follows them.
// Janitor branch: cleaning report exposes them and the Sheriff shoots.

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
  for (const key of ["mafioso", "lawyer", "janitor"]) {
    if (t.player(key) && t.player(key).alive) t.vote(key, "Mafia Kill", target);
  }
  if (t.player("janitor") && t.player("janitor").alive) t.vote("janitor", "Clean Death", clean ? "Yes" : "No");
  if (t.player("lawyer") && t.player("lawyer").alive) t.vote("lawyer", "Litigate", "*");
}

async function lynch(t, k, target, text) {
  await t.expectVote("Village", target, {
    token: k,
    text: text || `Vote ${t.nameOf(target)} in the Village box.`,
    label: `Vote ${t.nameOf(target)}`,
    also: [
      {
        id: "voteCop",
        label: `Vote ${t.nameOf("cop")}`,
        vote: { meeting: "Village", target: "cop" },
        bad: {
          reactions: [
            ["cop", "Me?! You just read my reports, {name}!"],
            ["v1", "Why would the Journalist vote the Cop they confirmed? Weird."],
          ],
          lesson: `You confirmed ${t.nameOf("cop")} is the real Cop. Voting them throws away your own proof. Vote ${t.nameOf(target)}.`,
        },
      },
    ],
    wrongReactions: [
      ["v1", `Huh? Everything points at ${t.nameOf(target)}. Why vote someone else?`],
      ["cop", "Stick with the evidence, {name}."],
    ],
  });
  await t.everyoneVotes(target, k, "Village", { fast: true });
  await t.advance(k);
}

const FAKE_COP = {
  id: "claimCop",
  label: "Say: “Actually I'm the Cop.”",
  sample: "Actually I'm the Cop.",
  when: (text, r) => r.roles.includes("cop") && !r.roles.includes("journalist"),
  bad: {
    reactions: [
      ["v3", "A THIRD Cop? Come on."],
      ["sheriff", "Three Cops and only one is real. You're the easiest to rule out, {name}."],
    ],
    consequence: async (t, k) => {
      t.vote("sheriff", "Shoot Gun", "journalist");
      await t.wait(t.timing.beat, k);
    },
    fatal: true,
    lesson:
      "The Sheriff shot you. Never claim a role you aren't: a fake Cop claim on top of a Cop counterclaim just looks like Mafia. Your real role, Journalist, is what makes your report believable.",
  },
};

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
        label: `Receive Reports: ${t.nameOf(target)}`,
        text: `Let's read someone's reports tonight. Click ${t.nameOf(target)} in the Receive Reports box.`,
        wrong: () => t.guide(`For this tutorial, read ${t.nameOf(target)}'s reports. Click ${t.nameOf(target)} in the Receive Reports box.`),
      });
      t.vote("cop", "Investigate", "mafioso");
      mafiaKill(t, "v2", true);
      await t.advance(k, `Done for tonight. Whatever reports ${t.nameOf(target)} gets tonight will come to you too: look out for them in the chat when the day starts. Click Continue.`);
    },

    async Day1(t, k) {
      t.guide(
        t.branch === "cop"
          ? `Your report arrived at dawn: ${t.nameOf("cop")} investigated ${t.nameOf("mafioso")} and learned they are GUILTY. Only a Cop gets investigation results, so ${t.nameOf("cop")} is the real Cop.`
          : `Your report arrived at dawn: ${t.nameOf("janitor")} cleaned ${t.nameOf("v2")}'s body and learned ${t.nameOf("v2")} was a Villager. Only the Janitor cleans bodies, so ${t.nameOf("janitor")} is Mafia!`
      );
      await t.chat("Village", [
        ["v1", `${t.nameOf("v2")} is dead and their role is hidden. There's a Janitor out there.`],
        ["cop", `I'm the Cop. I checked ${t.nameOf("mafioso")} last night: GUILTY.`],
        ["janitor", `No, I'M the Cop. I checked ${t.nameOf("cop")}: GUILTY. They're covering for themself.`],
        ["mafioso", `Thank you, ${t.nameOf("janitor")}. ${t.nameOf("cop")}'s the fake.`],
        ["sheriff", "Two Cops. One of you is lying and I've got one bullet."],
      ], k);
      t.guide(`Two Cop claims: ${t.nameOf("cop")} (${t.nameOf("mafioso")} guilty) and ${t.nameOf("janitor")} (${t.nameOf("cop")} guilty). Only one is real.`);
      if (t.branch === "cop") await copDay1(t, k);
      else await janitorDay1(t, k);
      await t.chat("Village", [["cop", `Told you. And ${t.nameOf("mafioso")} is still guilty.`], ["mafioso", "This is a setup!"]], k);
      await lynch(t, k, "mafioso", `With ${t.nameOf("janitor")} exposed, ${t.nameOf("cop")}'s guilty on ${t.nameOf("mafioso")} stands. Vote ${t.nameOf("mafioso")}.`);
    },

    async Night2(t, k) {
      await t.expectVote("Receive Reports", "cop", {
        token: k,
        label: `Receive Reports: ${t.nameOf("cop")}`,
        text: `${t.nameOf("cop")} is the Cop claimant still alive. Aim your check at them to get their report tonight and prove their next result. Click ${t.nameOf("cop")} in Receive Reports.`,
        wrong: () => t.guide(`Follow the Cop claim: click ${t.nameOf("cop")} in the Receive Reports box.`),
        also: [
          {
            id: "readVillager",
            vote: { meeting: "Receive Reports", target: "*other" },
            bad: {
              lesson: `That player isn't a Cop claimant, so their reports won't prove anything. Follow the Cop claim: read ${t.nameOf("cop")}.`,
            },
          },
        ],
      });
      t.vote("cop", "Investigate", "lawyer");
      t.vote("lawyer", "Mafia Kill", "v3");
      t.vote("lawyer", "Litigate", "*");
      await t.advance(k, `Done for tonight. Look out for ${t.nameOf("cop")}'s report in the chat when the day starts. Click Continue.`);
    },

    async Day2(t, k) {
      t.guide(`Your report arrived at dawn: ${t.nameOf("cop")} investigated ${t.nameOf("lawyer")} and learned they are GUILTY.`);
      await t.chat("Village", [
        ["v1", `${t.nameOf("v3")}'s gone. Cop?`],
        ["cop", `Checked ${t.nameOf("lawyer")} last night: GUILTY. They're the last one.`],
        ["lawyer", `Convenient. I'm the real Journalist, and I read ${t.nameOf("cop")}'s report: they checked ${t.nameOf("v1")}. Innocent. They're lying about me.`],
        ["v1", "Now there are two Journalists?"],
      ], k);
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "journalist", target: "lawyer", verdict: "guilty" },
        text: `By the last day the Mafia often fakes a power role. ${t.nameOf("lawyer")} just claimed YOUR role. You read ${t.nameOf("cop")}'s real report. Call them out.`,
        example: `I'm the real Journalist. I read ${t.nameOf("cop")}'s report: they checked ${t.nameOf("lawyer")}, GUILTY. ${t.nameOf("lawyer")} is lying.`,
        reactions: CLAIM_REACTIONS,
        hints: claimHints(t, t.nameOf("lawyer")),
      });
      await t.chat("Village", [["sheriff", `The Journalist has been right every time. ${t.nameOf("lawyer")} goes.`]], k);
      t.guide(
        "Autowin: you have confirmed town from earlier, plus a guilty on the last Mafia. Lynching between the last unresolved players with that information guarantees a town win."
      );
      await lynch(t, k, "lawyer", `Finish it: vote ${t.nameOf("lawyer")}.`);
    },
  },

  epilogue: (t) => [
    "The town won!",
    t.branch === "cop"
      ? "Lesson: reading the real Cop's report let you break the Cop counterclaim, and following them again exposed the Mafia's fake Journalist claim."
      : "Lesson: the Journalist sees every report, including the Janitor's cleaning. One read exposed the fake Cop, and following the real Cop finished the Mafia.",
  ],
};

async function copDay1(t, k) {
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "journalist", target: "mafioso", verdict: "guilty" },
    text: `You read ${t.nameOf("cop")}'s report, so you know they're the real Cop. Claim Journalist and back them up.`,
    example: `I'm the Journalist. I read ${t.nameOf("cop")}'s report: ${t.nameOf("mafioso")} is guilty. ${t.nameOf("janitor")} is the fake Cop.`,
    reactions: CLAIM_REACTIONS,
    hints: claimHints(t, t.nameOf("mafioso")),
    also: [FAKE_COP],
  });
  await t.chat("Village", [
    ["janitor", "A 'Journalist' showing up to save them? Convenient!"],
    ["sheriff", `A Journalist confirming a Cop is hard to fake. ${t.nameOf("janitor")}, you're done.`],
  ], k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.guide(`The Sheriff shot ${t.nameOf("janitor")}: they were the Janitor, Mafia. With all three power roles alive, the Sheriff usually shoots between Cop claims. Your report decided it.`);
}

async function janitorDay1(t, k) {
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "journalist", target: "janitor", verdict: "guilty" },
    text: `You read ${t.nameOf("janitor")}'s reports: they cleaned ${t.nameOf("v2")}. A real Cop can't clean bodies. Claim Journalist and expose them.`,
    example: `I'm the Journalist. I read ${t.nameOf("janitor")}'s reports: they cleaned ${t.nameOf("v2")}. ${t.nameOf("janitor")} is the Janitor, guilty!`,
    reactions: CLAIM_REACTIONS,
    hints: claimHints(t, t.nameOf("janitor")),
    also: [FAKE_COP],
  });
  await t.chat("Village", [
    ["janitor", "That's ridiculous! I'm the Cop!"],
    ["v3", "A Journalist would know who cleaned the body. That's a hard claim to fake."],
    ["sheriff", `I've got a gun and I trust the Journalist. Sorry, ${t.nameOf("janitor")}.`],
  ], k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.guide(`The Sheriff shot ${t.nameOf("janitor")}: they were the Janitor, Mafia. Your report was right, so ${t.nameOf("cop")} is the real Cop.`);
}
