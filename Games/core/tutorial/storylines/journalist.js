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
    text: text || `Vote ${t.nameOf(target)} in the Village box (or click the button here).`,
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
          lesson: `You confirmed ${t.nameOf("cop")} is the real Cop. Voting her throws away your own proof. Vote ${t.nameOf(target)}.`,
        },
      },
    ],
    wrongReactions: [
      ["v1", `Huh? Everything points at ${t.nameOf(target)}. Why vote someone else?`],
      ["cop", "Stick with the evidence, {name}."],
    ],
  });
  await t.townVote(["cop", "sheriff", "v1", "v2", "v3"], target, k);
  await t.advance(k);
}

// Claiming Cop as the Journalist makes a third Cop claim: the Sheriff shoots.
const FAKE_COP = {
  id: "claimCop",
  label: "Say: “Actually I'm the Cop.”",
  say: "Actually I'm the Cop.",
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

const QUIET = {
  id: "quiet",
  label: "Keep it to yourself for now",
  bad: {
    reactions: [
      ["sheriff", "One word against another and nobody to break the tie. I hate this."],
      ["v1", "If anyone knows anything, now's the time!"],
    ],
    lesson:
      "Two players claim Cop and only you have proof. A Journalist's report is what breaks a counterclaim; holding it lets the Mafia's lie stand. Share it.",
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
        text: `Let's read someone's reports tonight. Click ${t.nameOf(target)} in the Receive Reports box (or the button here).`,
        wrong: () => t.guide(`For this tutorial, read ${t.nameOf(target)}'s reports. Click ${t.nameOf(target)} in the Receive Reports box.`),
      });
      t.vote("cop", "Investigate", "mafioso");
      mafiaKill(t, "v2", true);
      await t.advance(
        k,
        target === "cop"
          ? `Report received: ${t.nameOf("cop")} investigated Silas and learned he is GUILTY. Only a Cop gets investigation results, so ${t.nameOf("cop")} is the real Cop. Click Continue.`
          : `Report received: ${t.nameOf("janitor")} cleaned Eli's body and learned Eli was a Villager. Only the Janitor cleans bodies, so ${t.nameOf("janitor")} is Mafia! Click Continue.`
      );
    },

    async Day1(t, k) {
      // Typical Frontier Justice Day 1: the Cop claims a guilty and the Mafia
      // counterclaims Cop.
      await t.chat("Village", [
        ["v1", "Eli's dead and his role is hidden. There's a Janitor out there."],
        ["cop", "I'm the Cop. I checked Silas last night: GUILTY."],
        ["janitor", "No, I'M the Cop. I checked Cassidy: GUILTY. She's covering for herself."],
        ["mafioso", "Thank you, Boone. Cassidy's the fake."],
        ["sheriff", "Two Cops. One of you is lying and I've got one bullet."],
      ], k);
      t.guide(`Two Cop claims: ${t.nameOf("cop")} (Silas guilty) and ${t.nameOf("janitor")} (${t.nameOf("cop")} guilty). Only one is real.`);
      if (t.branch === "cop") await copDay1(t, k);
      else await janitorDay1(t, k);
      await t.chat("Village", [["cop", "Told you. And Silas is still guilty."], ["mafioso", "This is a setup!"]], k);
      await lynch(t, k, "mafioso", `With ${t.nameOf("janitor")} exposed, ${t.nameOf("cop")}'s guilty on Silas stands. Vote Silas.`);
    },

    async Night2(t, k) {
      // Whichever branch, the Cop claimant left alive is the one to follow.
      await t.expectVote("Receive Reports", "cop", {
        token: k,
        label: `Receive Reports: ${t.nameOf("cop")}`,
        text: `${t.nameOf("cop")} is the Cop claimant still alive. Aim your check at her to get her report tonight and prove her next result. Click ${t.nameOf("cop")} in Receive Reports.`,
        wrong: () => t.guide(`Follow the Cop claim: click ${t.nameOf("cop")} in the Receive Reports box.`),
        also: [
          {
            id: "readVillager",
            label: "Receive Reports: Dolly",
            vote: { meeting: "Receive Reports", target: "v1" },
            bad: {
              lesson: `A Villager gets no reports, so that check would learn nothing. Follow the Cop claim: read ${t.nameOf("cop")}.`,
            },
          },
        ],
      });
      t.vote("cop", "Investigate", "lawyer");
      t.vote("lawyer", "Mafia Kill", "v3");
      t.vote("lawyer", "Litigate", "*");
      await t.advance(k, `Report received: ${t.nameOf("cop")} investigated Flint and learned he is GUILTY. Click Continue.`);
    },

    async Day2(t, k) {
      // Last day: the last Mafia member fakes a power role.
      await t.chat("Village", [
        ["v1", "Hattie's gone. Cop?"],
        ["cop", "Checked Flint last night: GUILTY. He's the last one."],
        ["lawyer", "Convenient. I'm the real Journalist, and I read Cassidy's report: she checked Dolly. Innocent. She's lying about me."],
        ["v1", "Now there are two Journalists?"],
      ], k);
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "journalist", target: "lawyer", verdict: "guilty" },
        text: `By the last day the Mafia often fakes a power role. Flint just claimed YOUR role. You read ${t.nameOf("cop")}'s real report. Call him out.`,
        example: "I'm the real Journalist. I read Cassidy's report: she checked Flint, GUILTY. Flint is lying.",
        reactions: CLAIM_REACTIONS,
        hints: claimHints(t, "Flint"),
        also: [QUIET],
      });
      await t.chat("Village", [["sheriff", "The Journalist has been right every time. Flint goes."]], k);
      await lynch(t, k, "lawyer", "Finish it: vote Flint.");
    },
  },

  epilogue: (t) => [
    "The town won!",
    t.branch === "cop"
      ? "Lesson: reading the real Cop's report let you break the Cop counterclaim, and following her again exposed the Mafia's fake Journalist claim."
      : "Lesson: the Journalist sees every report, including the Janitor's cleaning. One read exposed the fake Cop, and following the real Cop finished the Mafia.",
  ],
};

async function copDay1(t, k) {
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "journalist", target: "mafioso", verdict: "guilty" },
    text: `You read ${t.nameOf("cop")}'s report, so you know she's the real Cop. Claim Journalist and back her up.`,
    example: `I'm the Journalist. I read Cassidy's report: Silas is guilty. Boone is the fake Cop.`,
    reactions: CLAIM_REACTIONS,
    hints: claimHints(t, "Silas"),
    also: [FAKE_COP, QUIET],
  });
  await t.chat("Village", [
    ["janitor", "A 'Journalist' showing up to save her? Convenient!"],
    ["sheriff", "A Journalist confirming a Cop is hard to fake. Boone, you're done."],
  ], k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.guide(`The Sheriff shot ${t.nameOf("janitor")}: he was the Janitor, Mafia. With all three power roles alive, the Sheriff usually shoots between Cop claims. Your report decided it.`);
}

async function janitorDay1(t, k) {
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "journalist", target: "janitor", verdict: "guilty" },
    text: `You read ${t.nameOf("janitor")}'s reports: he cleaned Eli. A real Cop can't clean bodies. Claim Journalist and expose him.`,
    example: `I'm the Journalist. I read Boone's reports: he cleaned Eli. Boone is the Janitor, guilty!`,
    reactions: CLAIM_REACTIONS,
    hints: claimHints(t, t.nameOf("janitor")),
    also: [FAKE_COP, QUIET],
  });
  await t.chat("Village", [
    ["janitor", "That's ridiculous! I'm the Cop!"],
    ["v3", "A Journalist would know who cleaned Eli. That's a hard claim to fake."],
    ["sheriff", "I've got a gun and I trust the Journalist. Sorry, Boone."],
  ], k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.guide(`The Sheriff shot ${t.nameOf("janitor")}: he was the Janitor, Mafia. Your report was right, so ${t.nameOf("cop")} is the real Cop.`);
}
