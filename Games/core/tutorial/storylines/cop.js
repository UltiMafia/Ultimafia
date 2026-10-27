// COP: investigate, share a guilty, Sheriff shoots that Mafia, then leads the
// town onto a second Mafia. Night 2 the Cop dies; the Journalist was reading
// them and reveals the last guilty. Autowin is taught before the final condemn.

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

async function condemn(t, k, target, text) {
  await t.expectVote("Village", target, {
    token: k,
    text,
    label: `Vote ${t.nameOf(target)}`,
    also: [
      {
        id: "voteOther",
        vote: { meeting: "Village", target: "*other" },
        bad: {
          reactions: [
            ["v3", "Hold on, you just told us who's guilty, {name}!"],
            ["sheriff", "A Cop voting against their own guilty? That's how fakes act."],
          ],
          lesson: `Vote your own guilty result. Voting someone else makes the town doubt your claim. Vote ${t.nameOf(target)}.`,
        },
      },
    ],
    wrongReactions: [
      ["v1", `You just told us ${t.nameOf(target)} is guilty. Why vote someone else?`],
      ["sheriff", "Vote your own result, {name}."],
    ],
  });
  // Everyone alive votes, including the player being condemned.
  await t.everyoneVotes(target, k, "Village", { fast: true });
  await t.advance(k);
}

function randomGuilty(t, victim) {
  return {
    id: "randomGuilty",
    label: `Say: “I'm the Cop. ${t.nameOf(victim)} is guilty.” (a guess)`,
    sample: `I'm the Cop. ${t.nameOf(victim)} is guilty.`,
    when: (text, r) => r.problem === "wrongTarget" && r.verdict === "guilty",
    bad: {
      reactions: [
        [victim, "WHAT? I'm a Villager! You never checked me!"],
        ["journalist", `I'm the Journalist. I read the Cop's report last night, and it wasn't on ${t.nameOf(victim)}. {name} is lying.`],
        ["sheriff", "A Cop who lies about a result is no Cop. Sorry, {name}."],
      ],
      consequence: async (t, k) => {
        t.vote("sheriff", "Shoot Gun", "cop");
        await t.wait(t.timing.beat, k);
      },
      fatal: true,
      lesson:
        "The Sheriff shot you. A Cop must only share real results: a made-up guilty is caught (here the Journalist had your real report), and the Sheriff shoots liars. Share the result you actually got.",
    },
  };
}

function mafiaKill(t, target) {
  for (const key of ["mafioso", "lawyer", "janitor"]) {
    if (t.player(key) && t.player(key).alive) t.vote(key, "Mafia Kill", target);
  }
  if (t.player("janitor") && t.player("janitor").alive) t.vote("janitor", "Clean Death", "No");
  if (t.player("lawyer") && t.player("lawyer").alive) t.vote("lawyer", "Litigate", "*");
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
        text: `Pick someone to investigate. In the Investigate box, click ${t.nameOf("mafioso")}.`,
        wrong: () => t.guide(`For this tutorial, investigate ${t.nameOf("mafioso")}. Click ${t.nameOf("mafioso")} in the Investigate box.`),
      });
      mafiaKill(t, "v2");
      // Journalist reads the Cop so night 2's report survives the Cop's death.
      t.vote("journalist", "Receive Reports", "cop");
      await t.advance(k, "Done for tonight. Look out for your investigation report in the chat when the day starts. Click Continue to start Day 1.");
    },

    async Day1(t, k) {
      t.guide(`Your report arrived at dawn (see the chat): ${t.nameOf("mafioso")} is GUILTY. They're Mafia!`);
      await t.chat("Village", [
        ["v1", `${t.nameOf("v2")}'s dead. Anyone have information?`],
        ["v3", "Power roles, now's the time."],
      ], k);
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "cop", target: "mafioso", verdict: "guilty" },
        text: `Share your result. In town chat, claim Cop and say ${t.nameOf("mafioso")} is guilty.`,
        example: `I'm the Cop. I investigated ${t.nameOf("mafioso")} last night: GUILTY.`,
        reactions: CLAIM_REACTIONS,
        hints: hints(t.nameOf("mafioso")),
        also: [randomGuilty(t, "v1")],
      });
      await t.chat("Village", [
        ["mafioso", "What?! That's a lie!"],
        ["sheriff", "A Cop with a guilty result. That's good enough for me."],
        ["v1", `${t.nameOf("mafioso")} it is.`],
      ], k);
      t.guide(`The Sheriff believes you. Watch: in Frontier Justice the Sheriff often shoots a confirmed guilty instead of waiting on the condemn.`);
      t.vote("sheriff", "Shoot Gun", "mafioso");
      await t.wait(t.timing.beat, k);
      t.guide(`${t.nameOf("mafioso")} was shot and flipped ${t.constructor.CAST.mafioso.role}: real Mafia. Your report was right.`);
      await t.chat("Village", [
        ["sheriff", `Cop's legit. I'm leading on ${t.nameOf("lawyer")} next — been whispering with ${t.nameOf("mafioso")} all game.`],
        ["journalist", "I'll follow the Sheriff."],
        ["v3", `${t.nameOf("lawyer")} it is.`],
        ["lawyer", "This is ridiculous!"],
      ], k);
      t.guide(`The Sheriff is leading the town onto a second Mafia suspect. Vote with them.`);
      await condemn(t, k, "lawyer", `In the Village box, vote ${t.nameOf("lawyer")}.`);
    },

    async Night2(t, k) {
      await t.expectVote("Investigate", "janitor", {
        token: k,
        text: `Investigate again. In the Investigate box, click ${t.nameOf("janitor")}.`,
        wrong: () => t.guide(`Investigate ${t.nameOf("janitor")} this time. Click ${t.nameOf("janitor")} in the Investigate box.`),
      });
      // Journalist stays on the Cop to catch the last report when the Cop dies.
      t.vote("journalist", "Receive Reports", "cop");
      mafiaKill(t, "cop");
      await t.advance(k, "Done for tonight. Click Continue to start Day 2.");
    },

    async Day2(t, k) {
      t.guide("You were killed by the Mafia last night. You're dead, but you can still watch — and your last report is not lost.");
      await t.chat("Village", [
        ["v1", `Our Cop is dead! Anyone have anything?`],
        ["journalist", `I'm the Journalist. I was reading the Cop's reports. Last night they checked ${t.nameOf("janitor")}: GUILTY.`],
        ["janitor", "Convenient timing for a 'Journalist' claim..."],
        ["sheriff", "The Journalist had the Cop's line. I trust it."],
      ], k);
      t.guide(`Because the Journalist was on you, they received your last report after you died: ${t.nameOf("janitor")} is GUILTY.`);
      t.guide(
        `This is an autowin (the winner is already decided): two of the three Mafia are already dead (${t.nameOf("mafioso")} shot, ${t.nameOf("lawyer")} condemned), and your last report puts the third on ${t.nameOf("janitor")}. Lynching a confirmed guilty who is the last Mafia ends the game.`
      );
      // Dead Cop can't vote; town finishes it.
      await t.everyoneVotes("janitor", k, "Village", { fast: true });
      await t.advance(k, "The town is condemning the last Mafia. Click Continue.");
    },
  },

  epilogue: () => [
    "The town won!",
    "Lesson: share guilty results clearly. The Sheriff can shoot a confirmed guilty. If you die, a Journalist who was reading you still gets your last report, and a guilty on the last Mafia ends the game.",
  ],
};
