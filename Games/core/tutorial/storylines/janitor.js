// JANITOR: set a jan code, clean a kill, then (on the common Villager clean)
// fake-claim Cop with a guilty on the Lawyer. Cop is shot, you are lynched D1,
// Sheriff dies N2, town lynches the confirmed Lawyer, final 3-way Mafioso wins.

const CODE = {
  Villager: "nice weather",
  Cop: "storm's coming",
  Journalist: "dusty trail",
  Sheriff: "sunset",
};

const VICTIMS = ["cop", "journalist", "sheriff", "v1"];

function roleOf(t, key) {
  return t.constructor.CAST[key].role.split(":")[0];
}

module.exports = {
  id: "janitor",
  title: "Janitor",
  roleName: "Janitor",
  userSeat: "janitor",
  blurb: "Set a jan code, clean a kill, and fool the town as Mafia.",
  available: true,
  freeVote: (t, meeting) => meeting.name === "Village",
  intro: null,

  states: {
    async Night1(t, k) {
      t.guide(
        `Welcome to the tutorial! You are the Janitor, on the Mafia team with ${t.nameOf("lawyer")} (Lawyer) and ${t.nameOf("mafioso")} (Mafioso). Nobody else knows who you are. It's Night 1.`
      );
      // Prefer villager clean for the main scripted arc; still allow RNG among
      // power cleans for variety when forced via opts.victim.
      const victim =
        t.data.victim ||
        (t.data.victim = VICTIMS[Math.floor(Math.random() * VICTIMS.length)]);
      t.branch = victim;
      await t.chat("Mafia Meeting", [
        ["mafioso", "Evening, partner. Quiet town."],
        ["lawyer", "We need a jan code before we clean anyone."],
      ], k);
      t.guide(
        "A jan code is innocent phrases that secretly mean roles. You invent it in Mafia chat; tomorrow you drop the matching phrase in town."
      );
      await t.expectChat({
        token: k,
        meeting: "Mafia Meeting",
        expect: { role: "cop" },
        text: "Set the code in Mafia chat. Include the phrases for Villager and Cop.",
        example: `Jan code: "${CODE.Villager}"=Villager, "${CODE.Cop}"=Cop, "${CODE.Journalist}"=Journalist, "${CODE.Sheriff}"=Sheriff`,
        reactions: {
          incomplete: [["lawyer", "We need the code written down, {name}."]],
          wrongRole: [["mafioso", "Just paste the code, {name}."]],
          silence: [["lawyer", "{name}? Drop the jan code."]],
        },
        hints: {
          incomplete: `Type a line that includes Cop. Example: Jan code: "${CODE.Villager}"=Villager, "${CODE.Cop}"=Cop`,
          wrongRole: "Mention Cop in your code line.",
          silence: "Type the jan code in Mafia chat.",
        },
      });
      await t.chat("Mafia Meeting", [
        ["lawyer", "Got it."],
        ["mafioso", `Good. Let's take ${t.nameOf(victim)} tonight.`],
      ], k);
      await t.expectVote("Mafia Kill", victim, {
        token: k,
        text: `In the Mafia Kill box, click ${t.nameOf(victim)}.`,
        wrong: () => t.guide(`Click ${t.nameOf(victim)} in Mafia Kill.`),
      });
      t.vote("mafioso", "Mafia Kill", victim);
      t.vote("lawyer", "Mafia Kill", victim);
      await t.expectVote("Clean Death", "Yes", {
        token: k,
        label: "Yes",
        text: `Clean tonight's kill: click Yes in Clean Death.`,
      });
      t.vote("lawyer", "Litigate", "*");
      if (victim !== "cop") t.vote("cop", "Investigate", "lawyer");
      // When the Cop is cleaned, the Journalist was reading you: tomorrow they
      // have your clean report (see day1JannedCop).
      else t.vote("journalist", "Receive Reports", "janitor");
      await t.advance(k, `You'll learn ${t.nameOf(victim)}'s role when the night ends. Click Continue.`);
    },

    async Day1(t, k) {
      const victim = t.data.victim;
      const role = roleOf(t, victim);
      const phrase = CODE[role];
      t.guide(`You cleaned ${t.nameOf(victim)}: they were the ${role}.`);
      await t.chat("Village", [
        ["v3", `${t.nameOf(victim)} is gone and their role is wiped. We've got a Janitor.`],
        ["v1", "Any power roles want to speak up?"],
      ], k);
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: {},
        match: (text) => String(text).toLowerCase().includes(phrase.toLowerCase()),
        text: `In town chat, say something natural that includes "${phrase}" (your code for ${role}).`,
        example: `Rough night. At least it's ${phrase} out there today.`,
        reactions: {
          incomplete: [["mafioso", "…"]],
          silence: [["lawyer", "Quiet morning."]],
        },
        hints: {
          incomplete: `Include "${phrase}" so your team hears the code.`,
          silence: `Type a line with "${phrase}" in it.`,
        },
        also: [
          {
            id: "leakRole",
            label: `Say: “${t.nameOf(victim)} was the ${role}!”`,
            sample: `${t.nameOf(victim)} was the ${role}!`,
            when: (text, r) =>
              (r.named || []).includes(t.nameOf(victim)) && (r.roles || []).includes(role.toLowerCase()),
            bad: {
              reactions: [
                ["v3", "How do YOU know that? The role was cleaned!"],
                ["sheriff", "Only Mafia knows a cleaned role. Thanks, {name}."],
              ],
              consequence: async (t, k) => {
                if (t.player("sheriff") && t.player("sheriff").alive) {
                  t.vote("sheriff", "Shoot Gun", "janitor");
                  await t.wait(t.timing.beat, k);
                }
              },
              fatal: true,
              lesson: "Never say the cleaned role out loud. Use the jan code phrase instead.",
            },
          },
        ],
      });
      await t.chat("Village", [
        ["lawyer", `Yeah, ${phrase} for sure.`],
        ["mafioso", "Agreed."],
      ], k);
      if (victim === "cop") return day1JannedCop(t, k);
      if (victim === "journalist") return day1JannedJournalist(t, k);
      if (victim === "sheriff") return day1JannedSheriff(t, k);
      return day1JannedVillager(t, k);
    },

    async Night2(t, k) {
      if (t.data.diedDay1) {
        t.guide("You're dead — keep watching. Your teammates still have a path to win.");
      } else {
        t.guide("Night 2. Mafia is thinning the town.");
      }
      // Prefer killing the Sheriff so town has no gun.
      const victim = ["sheriff", "journalist", "cop", "v3", "v1", "v2"].find(
        (key) => t.player(key) && t.player(key).alive
      );
      if (victim) {
        for (const key of ["mafioso", "lawyer", "janitor"]) {
          if (t.player(key) && t.player(key).alive) t.vote(key, "Mafia Kill", victim);
        }
        if (t.player("lawyer") && t.player("lawyer").alive) t.vote("lawyer", "Litigate", "*");
      }
      await t.advance(k, "Click Continue.");
    },

    async Day2(t, k) {
      // Main arc (villager clean, you got bussed): town lynches the Lawyer on the
      // Cop's old guilty. Other branches: just push a townie to tighten numbers.
      if (t.branch === "v1" && t.player("lawyer") && t.player("lawyer").alive) {
        t.guide(
          `The Sheriff is dead. Town still has the Cop's guilty on ${t.nameOf("lawyer")} — they're about to lynch the confirmed Lawyer.`
        );
        await t.chat("Village", [
          ["v1", `Sheriff's gone. The Cop said ${t.nameOf("lawyer")} was guilty before dying.`],
          ["v3", `${t.nameOf("lawyer")} it is.`],
          ["mafioso", `…yeah. ${t.nameOf("lawyer")}.`],
          ["journalist", "I'll go with the Cop's report."],
        ], k);
        await t.everyoneVotes("lawyer", k, "Village", { fast: true });
      } else {
        const push = ["v1", "v3", "journalist", "cop", "sheriff", "v2"].find(
          (key) => t.player(key) && t.player(key).alive
        );
        if (push) {
          t.guide(`Town is lost without clear info. They lynch ${t.nameOf(push)}.`);
          await t.everyoneVotes(push, k, "Village", {
            dissenters: { [push]: "mafioso" },
            fast: true,
          });
        }
      }
      await t.advance(k, "Click Continue.");
    },

    async Night3(t, k) {
      t.guide("Final night. Mafia is lining up the last numbers.");
      const victim = ["journalist", "cop", "sheriff", "v3", "v1", "v2"].find(
        (key) => t.player(key) && t.player(key).alive
      );
      if (victim) {
        for (const key of ["mafioso", "lawyer", "janitor"]) {
          if (t.player(key) && t.player(key).alive) t.vote(key, "Mafia Kill", victim);
        }
        if (t.player("lawyer") && t.player("lawyer").alive) t.vote("lawyer", "Litigate", "*");
      }
      await t.advance(k);
    },

    async Day3(t, k) {
      const townLeft = ["v1", "v3", "v2", "journalist", "cop", "sheriff"].filter(
        (key) => t.player(key) && t.player(key).alive
      );
      const push = townLeft[0];
      t.guide(
        "This is a 3-way (or near it). Your Mafioso teammate will win it for Mafia — watch the last lynch."
      );
      if (push) {
        await t.chat("Village", [
          ["mafioso", `End it. ${t.nameOf(push)}.`],
          ["v3", "I don't like this..."],
        ], k);
        await t.everyoneVotes(push, k, "Village", {
          dissenters: { [push]: "mafioso" },
          fast: true,
        });
      }
      // If still not over (too many town left), keep lynching.
      await t.advance(k, "Click Continue to see the win.");
    },

    async Night4(t, k) {
      const victim = ["v1", "v3", "v2", "journalist", "cop", "sheriff"].find(
        (key) => t.player(key) && t.player(key).alive
      );
      if (victim) {
        for (const key of ["mafioso", "lawyer", "janitor"]) {
          if (t.player(key) && t.player(key).alive) t.vote(key, "Mafia Kill", victim);
        }
      }
      await t.advance(k);
    },

    async Day4(t, k) {
      const push = ["v1", "v3", "v2", "journalist", "cop", "sheriff"].find(
        (key) => t.player(key) && t.player(key).alive
      );
      if (push) {
        await t.everyoneVotes(push, k, "Village", {
          dissenters: { [push]: "mafioso" },
          fast: true,
        });
      }
      await t.advance(k, "Click Continue to see the win.");
    },
  },

  epilogue: (t) => {
    const role = roleOf(t, t.data.victim);
    const what = {
      v1: "The Sheriff shot the real Cop, the town lynched you (your team voted with them: bussing), the Sheriff died Night 2, town lynched the Lawyer on the Cop's guilty, and the Mafioso closed it out.",
      cop: "The Journalist was reading you and exposed your clean, so the Sheriff shot you. With the real Cop already gone, your teammates outlasted the town.",
      journalist: "With the Journalist gone nobody could break the Cop tie, so the Sheriff shot the real Cop and the town lynched you. Your teammates finished the game.",
      sheriff: "With no gun in town, the town lynched the real Cop instead of you, and your team took it from there.",
    }[t.data.victim] || "Your teammates finished the game.";
    return [
      "The Mafia won.",
      `Lesson: you set a jan code ("${CODE[role]}" = ${role}) and cleaned a ${role}. When you fake-claimed Cop you named the Lawyer (Mafia) as your 'guilty': a Loyal Lawyer can't frame town, so a Villager 'guilty' would be exposed by their flip, while the Lawyer guilty was true.`,
      what,
    ];
  },
};

async function claimFakeCopOnLawyer(t, k) {
  const reactions = {
    wrongRole: [
      ["v3", "Wait, you're claiming WHAT?"],
      ["v1", "That claim makes zero sense."],
    ],
    wrongTarget: [
      ["v1", "Why are you naming them?"],
      ["v3", "Be specific."],
    ],
    wrongVerdict: [
      ["v3", "So they're innocent? Then why bring it up?"],
    ],
    incomplete: [
      ["v1", "Role and result, please."],
    ],
    silence: [
      ["v1", "{name}, anything to share?"],
      ["v3", "{name}??"],
    ],
  };
  // The Cop's 'guilty' you invent is the Lawyer — NOT a Villager. The Lawyer is
  // Loyal and can't frame town, so a real Cop's guilty is always real Mafia; a
  // Villager 'guilty' is exposed the moment they flip town.
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "cop", target: "lawyer", verdict: "guilty" },
    text: `Fake-claim Cop. Name ${t.nameOf("lawyer")} as GUILTY (the Mafia Lawyer) — not a Villager. Here the Lawyer is Loyal and can't make town look guilty, so a Villager 'guilty' falls apart the moment they flip town. A guilty on the Lawyer is true, so it survives the flip.`,
    example: `I'm the Cop. I checked ${t.nameOf("lawyer")} last night: guilty!`,
    reactions,
    hints: {
      wrongRole: "Claim Cop.",
      wrongTarget: `Name ${t.nameOf("lawyer")} — the Lawyer — as your guilty.`,
      wrongVerdict: `Say ${t.nameOf("lawyer")} is GUILTY.`,
      incomplete: `Include: Cop, ${t.nameOf("lawyer")}, guilty.`,
      silence: `Type: "I'm the Cop. ${t.nameOf("lawyer")} is guilty."`,
    },
    also: [
      {
        id: "claimVillager",
        label: "Say: “Just a Villager here.”",
        sample: "Just a Villager here.",
        when: (text, r) => r.roles.includes("villager"),
        bad: {
          reactions: [
            ["cop", `Then listen: I'm the Cop. ${t.nameOf("lawyer")} is GUILTY.`],
          ],
          lesson: "Counterclaim the Cop. Try the Cop claim with a guilty on the Lawyer.",
        },
      },
      {
        id: "guiltyVillager",
        label: `Say: “I'm the Cop. ${t.nameOf("v1")} is guilty.”`,
        sample: `I'm the Cop. ${t.nameOf("v1")} is guilty.`,
        when: (text, r) => r.problem === "wrongTarget" && r.verdict === "guilty" && r.roles.includes("cop"),
        bad: {
          reactions: [
            ["v1", "I'm a Villager!"],
            ["cop", `Funny — I'M the Cop. The Lawyer can't frame town in this setup, so a guilty on a Villager means you're lying.`],
          ],
          lesson: `A fake Cop should put the guilty on the Lawyer (${t.nameOf("lawyer")}), not a Villager. A Loyal Lawyer can't frame town, so a Villager 'guilty' is disproved by their flip. The Lawyer is a real guilty, so naming them holds up (a plain, non-Loyal Lawyer could frame town, but most setups use Loyal).`,
        },
      },
    ],
  });
}

async function day1JannedVillager(t, k) {
  t.guide(
    `You cleaned a Villager. Fake-claim Cop and put your 'guilty' on ${t.nameOf("lawyer")} (Mafia Lawyer), not a Villager.`
  );
  await claimFakeCopOnLawyer(t, k);
  await t.chat("Village", [
    ["cop", `That's a LIE. I'M the Cop! I really did check ${t.nameOf("lawyer")} last night, and yes, GUILTY. ${t.human().name} is copying my result.`],
    ["mafioso", `Ha. Classic counterclaim.`],
    ["lawyer", "Our Cop spoke first."],
    ["sheriff", "I'm the Sheriff. One of these Cops is Mafia."],
  ], k);
  t.guide("Watch the Sheriff decide.");
  await t.wait(t.timing.beat, k);
  t.vote("sheriff", "Shoot Gun", "cop");
  await t.wait(t.timing.beat, k);
  t.guide(`${t.nameOf("cop")} flipped Cop. Town knows you lied — they're lynching you. That's okay: you're about to be bussed.`);
  await t.chat("Village", [
    ["v3", `Real Cop!! Lynch ${t.human().name}!`],
    ["v1", `Now.`],
    ["mafioso", `…yeah. ${t.human().name}.`],
    ["lawyer", "Agreed. Start with the liar."],
  ], k);
  await t.everyoneVotes("janitor", k);
  t.data.diedDay1 = true;
  await t.advance(k, "You've been lynched. Click Continue to watch the rest — system narration will keep teaching.");
}

async function day1JannedCop(t, k) {
  t.guide("You cleaned the Cop. Fake-claim Cop with a guilty on the Lawyer.");
  await claimFakeCopOnLawyer(t, k);
  await t.chat("Village", [
    ["journalist", `Hold on. I read ${t.human().name}: they CLEANED ${t.nameOf("cop")}. That's a Janitor!`],
    ["sheriff", "Gun's out."],
  ], k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.data.diedDay1 = true;
  t.guide("Journalist caught your clean. Watch your teammates continue — system narration will keep teaching.");
  await t.advance(k, "Click Continue.");
}

async function day1JannedJournalist(t, k) {
  t.guide("You cleaned the Journalist. Fake-claim Cop; name the Lawyer guilty.");
  await claimFakeCopOnLawyer(t, k);
  await t.chat("Village", [
    ["cop", `Liar! I'M the Cop.`],
    ["sheriff", "No Journalist to break the tie. Shooting the second claim."],
  ], k);
  t.vote("sheriff", "Shoot Gun", "cop");
  await t.wait(t.timing.beat, k);
  t.guide("Sheriff shot the real Cop. Town will lynch you next.");
  await t.everyoneVotes("janitor", k);
  t.data.diedDay1 = true;
  await t.advance(k, "Click Continue.");
}

async function day1JannedSheriff(t, k) {
  t.guide("You cleaned the Sheriff — no gun. Fake-claim Cop; name the Lawyer guilty.");
  await claimFakeCopOnLawyer(t, k);
  await t.chat("Village", [
    ["cop", `I'm the real Cop!`],
    ["v1", "No Sheriff. We have to lynch a Cop claim."],
    ["lawyer", `Lynch ${t.nameOf("cop")}.`],
    ["mafioso", t.nameOf("cop")],
  ], k);
  await t.everyoneVotes("cop", k);
  await t.advance(k, "Click Continue.");
}
