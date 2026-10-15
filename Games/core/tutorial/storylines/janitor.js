// JANITOR: teach setting a jan code, then clean a night kill. The plot
// branches on who you cleaned: Cop / Journalist / Sheriff / Villager.

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
      const victim =
        t.data.victim || (t.data.victim = VICTIMS[Math.floor(Math.random() * VICTIMS.length)]);
      t.branch = victim;
      await t.chat("Mafia Meeting", [
        ["mafioso", "Evening, partner. Quiet town. Let's keep it that way."],
        ["lawyer", "We need a jan code before we clean anyone — so we can talk about the role in public tomorrow."],
      ], k);
      t.guide(
        "A jan code is a set of innocent phrases that secretly mean roles. You invent it in Mafia chat; tomorrow you'll drop the matching phrase in town so your teammates know what you cleaned."
      );
      await t.expectChat({
        token: k,
        meeting: "Mafia Meeting",
        expect: { role: "cop" },
        text: `Set the code in Mafia chat. Include the phrases for Villager and Cop (and the others if you like). Example below.`,
        example: `Jan code: "${CODE.Villager}"=Villager, "${CODE.Cop}"=Cop, "${CODE.Journalist}"=Journalist, "${CODE.Sheriff}"=Sheriff`,
        reactions: {
          incomplete: [["lawyer", "We need the code written down, {name}. Role words and phrases."]],
          wrongRole: [["mafioso", "Just paste the code, {name}. Don't overthink it."]],
          silence: [["lawyer", "{name}? Drop the jan code so we're all on the same page."]],
        },
        hints: {
          incomplete: `Type a line that includes Cop (and ideally Villager). Example: Jan code: "${CODE.Villager}"=Villager, "${CODE.Cop}"=Cop`,
          wrongRole: "Mention Cop in your code line so teammates know that mapping.",
          silence: "Type the jan code in Mafia chat.",
        },
      });
      await t.chat("Mafia Meeting", [
        ["lawyer", "Got it. I'll listen for those phrases tomorrow."],
        ["mafioso", `Good. Let's take ${t.nameOf(victim)} tonight.`],
      ], k);
      await t.expectVote("Mafia Kill", victim, {
        token: k,
        text: `Your team agreed on ${t.nameOf(victim)}. In the Mafia Kill box, click ${t.nameOf(victim)}.`,
        wrong: () => t.guide(`Your team agreed on ${t.nameOf(victim)}. In the Mafia Kill box, click ${t.nameOf(victim)}.`),
      });
      t.vote("mafioso", "Mafia Kill", victim);
      t.vote("lawyer", "Mafia Kill", victim);
      await t.expectVote("Clean Death", "Yes", {
        token: k,
        label: "Yes",
        text: `As Janitor you can clean tonight's kill: the town won't see ${t.nameOf(victim)}'s role, but you will. In the Clean Death box, click Yes.`,
      });
      t.vote("lawyer", "Litigate", "*");
      if (victim !== "cop") t.vote("cop", "Investigate", "mafioso");
      await t.advance(k, `Good. You'll learn ${t.nameOf(victim)}'s role privately when the night ends. Click Continue to start Day 1.`);
    },

    async Day1(t, k) {
      const victim = t.data.victim;
      const role = roleOf(t, victim);
      const phrase = CODE[role];
      t.guide(`You cleaned ${t.nameOf(victim)}: they were the ${role}. Town only sees a wiped grave.`);
      await t.chat("Village", [
        ["v3", `${t.nameOf(victim)} is gone and their role is wiped. We've got a Janitor in town.`],
        ["v1", "Any power roles want to speak up?"],
      ], k);
      t.guide(`Drop the jan code phrase for ${role} in town chat so your teammates know — without saying the role out loud.`);
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
          incomplete: `Include the phrase "${phrase}" so your team hears the code.`,
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
                ["v3", `How do YOU know that? The role was cleaned!`],
                ["sheriff", "Only Mafia knows a cleaned role. Thanks, {name}."],
              ],
              consequence: async (t, k) => {
                if (t.player("sheriff") && t.player("sheriff").alive) {
                  t.vote("sheriff", "Shoot Gun", "janitor");
                  await t.wait(t.timing.beat, k);
                }
              },
              fatal: true,
              lesson: "Never say the cleaned role out loud. That's what the jan code is for — an innocent phrase only your team understands.",
            },
          },
        ],
      });
      await t.chat("Village", [
        ["lawyer", `Yeah, ${phrase} for sure.`],
        ["mafioso", "Agreed."],
      ], k);
      t.guide("Your teammates heard the code. Now play the Day 1 that fits what you cleaned.");
      if (victim === "cop") return day1JannedCop(t, k);
      if (victim === "journalist") return day1JannedJournalist(t, k);
      if (victim === "sheriff") return day1JannedSheriff(t, k);
      return day1JannedVillager(t, k);
    },

    async Night2(t, k) {
      t.guide("Watch your teammates finish the game.");
      await mafiaNightKill(t, k);
      await t.advance(k, "Click Continue when you're ready.");
    },

    async Day2(t, k) {
      t.guide("The Mafia is steering the remaining vote. When Mafia equals the town, Mafia wins.");
      await mafiaDayPush(t, k);
      await t.advance(k, "Click Continue to see how it ends.");
    },

    async Night3(t, k) {
      await mafiaNightKill(t, k);
      await t.advance(k);
    },

    async Day3(t, k) {
      await mafiaDayPush(t, k);
      await t.advance(k);
    },
  },

  epilogue: (t) => {
    const role = roleOf(t, t.data.victim);
    return [
      "The Mafia won.",
      `Lesson: you set a jan code ("${CODE[role]}" = ${role}), cleaned a ${role}, and passed that info in plain sight. Different cleans change the Day 1 plan: a cleaned Cop means no real Cop claim, a cleaned Sheriff means no gun, a cleaned Journalist removes a check on your reports, and a cleaned Villager is the common case for a fake Cop claim.`,
    ];
  },
};


async function mafiaNightKill(t, k) {
  const victim = ["sheriff", "journalist", "cop", "v3", "v1", "v2"].find(
    (key) => t.player(key) && t.player(key).alive && key !== t.data.victim
  );
  if (!victim) return;
  for (const key of ["mafioso", "lawyer", "janitor"]) {
    if (t.player(key) && t.player(key).alive) t.vote(key, "Mafia Kill", victim);
  }
  if (t.player("janitor") && t.player("janitor").alive) t.vote("janitor", "Clean Death", "No");
  if (t.player("lawyer") && t.player("lawyer").alive) t.vote("lawyer", "Litigate", "*");
}

async function mafiaDayPush(t, k) {
  const push = ["v1", "v3", "journalist", "cop", "sheriff", "v2"].find(
    (key) => t.player(key) && t.player(key).alive
  );
  if (!push) return;
  if (t.player("lawyer") && t.player("lawyer").alive)
    await t.say("lawyer", "Village", `I don't trust ${t.nameOf(push)}.`, k);
  if (t.player("mafioso") && t.player("mafioso").alive)
    await t.say("mafioso", "Village", `${t.nameOf(push)}.`, k);
  await t.everyoneVotes(push, k, "Village", { dissenters: { [push]: "mafioso" } });
}

// --- Day 1 branches ----------------------------------------------------------

async function day1JannedVillager(t, k) {
  t.guide("You cleaned a Villager — common. Fake-claim Cop and frame the real Cop so the Sheriff might shoot them.");
  await claimFakeCop(t, k, "cop");
  await t.chat("Village", [
    ["cop", `That's a LIE. I'M the Cop! I checked ${t.nameOf("mafioso")} last night. ${t.nameOf("mafioso")} is guilty!`],
    ["mafioso", `Ha. Classic counterclaim. You got caught, ${t.nameOf("cop")}.`],
    ["lawyer", "Our Cop spoke first. They're scrambling."],
    ["v1", "Two Cop claims. One of them is Mafia."],
    ["sheriff", "I'm the Sheriff and I have a gun. I'm not letting a fake Cop walk."],
  ], k);
  t.guide("Two players are claiming Cop. Watch the Sheriff decide who to believe.");
  await t.wait(t.timing.beat, k);
  t.vote("sheriff", "Shoot Gun", "cop");
  await t.wait(t.timing.beat, k);
  t.guide(`${t.nameOf("cop")} was shot and flipped Cop. The town now knows you lied.`);
  await t.chat("Village", [
    ["v3", `They were the REAL Cop!! ${t.human().name} lied to us!`],
    ["v1", `Lynch ${t.human().name}. Now.`],
    ["mafioso", `...yeah. ${t.human().name} has to go.`],
    ["lawyer", "Agreed. Let's start with the liar."],
  ], k);
  t.guide("Your teammates are voting against you to look like town. That's called bussing. The town is lynching you; that's okay.");
  await t.everyoneVotes("janitor", k);
  await t.advance(k, "You've been lynched. Click Continue to watch the rest of the game.");
}

async function day1JannedCop(t, k) {
  t.guide("You cleaned the Cop! There is no real Cop left to counterclaim. You can claim Cop safely — but a Journalist who read you could still expose the clean.");
  await claimFakeCop(t, k, "v3");
  await t.chat("Village", [
    ["v1", "Uncontested Cop claim with a guilty?"],
    ["journalist", `Hold on. I'm the Journalist. I read ${t.human().name}'s reports last night: they CLEANED ${t.nameOf("cop")}. That's a Janitor, not a Cop!`],
    ["sheriff", "A Journalist calling out a clean is hard to fake. Gun's out."],
  ], k);
  t.vote("sheriff", "Shoot Gun", "janitor");
  await t.wait(t.timing.beat, k);
  t.guide("The Journalist caught your clean. You flipped Janitor. Your teammates will bus you and keep winning — watch.");
  await t.advance(k, "You've been shot. Click Continue to watch the rest.");
}

async function day1JannedJournalist(t, k) {
  t.guide("You cleaned the Journalist — nobody can read your clean reports now. Fake-claim Cop and frame the real Cop.");
  await claimFakeCop(t, k, "cop");
  await t.chat("Village", [
    ["cop", `Liar! I'M the Cop. ${t.nameOf("mafioso")} is GUILTY.`],
    ["mafioso", "Counterclaim, how original."],
    ["sheriff", "No Journalist to break the tie. I'm shooting the second claim."],
  ], k);
  t.vote("sheriff", "Shoot Gun", "cop");
  await t.wait(t.timing.beat, k);
  t.guide(`Sheriff shot the real Cop. Cleaning the Journalist meant nobody could prove your clean. Town will lynch you next — bus and smile.`);
  await t.everyoneVotes("janitor", k);
  await t.advance(k, "Click Continue.");
}

async function day1JannedSheriff(t, k) {
  t.guide("You cleaned the Sheriff — there is no gun in town. Fake-claim Cop; the town has to lynch without a Sheriff shot.");
  await claimFakeCop(t, k, "cop");
  await t.chat("Village", [
    ["cop", `I'm the real Cop! ${t.nameOf("mafioso")} is guilty!`],
    ["v1", "No Sheriff to shoot anyone. We have to lynch one of the Cop claims."],
    ["lawyer", `Lynch ${t.nameOf("cop")}. Our Cop spoke first.`],
    ["mafioso", `Yeah, ${t.nameOf("cop")}.`],
  ], k);
  t.guide("Without a Sheriff, numbers decide. Your team is pushing the real Cop onto the block.");
  await t.everyoneVotes("cop", k);
  await t.advance(k, `Town lynched ${t.nameOf("cop")}. Click Continue.`);
}

async function claimFakeCop(t, k, guiltyKey) {
  const reactions = {
    wrongRole: [
      ["v3", "Wait, you're claiming WHAT? That doesn't help us at all, {name}."],
      ["v1", "That claim makes zero sense. You're sounding pretty scummy."],
    ],
    wrongTarget: [
      ["v1", "Why are you naming them? Who did you actually check?"],
      ["v3", "Hold on, that's not what I expected you to say. Be specific."],
    ],
    wrongVerdict: [
      ["v3", "So they're innocent? Then why bring it up?"],
      ["v1", "A cleared player doesn't help. Got anything guilty?"],
    ],
    incomplete: [
      ["v1", "Spit it out, {name}. Role and result, please."],
      ["v3", "That's vague. What did you find?"],
    ],
    silence: [
      ["v1", "{name}, you've been awfully quiet. Anything to share?"],
      ["v3", "{name}?? Hello?"],
    ],
  };
  await t.expectChat({
    token: k,
    meeting: "Village",
    expect: { role: "cop", target: guiltyKey, verdict: "guilty" },
    text: `Fake-claim Cop. In town chat, type that you're the Cop and that ${t.nameOf(guiltyKey)} is guilty.`,
    example: `I'm the Cop. I checked ${t.nameOf(guiltyKey)} last night: guilty!`,
    reactions,
    hints: {
      wrongRole: "The town wants a Cop. Claim Cop (not another role) and say who you 'checked'.",
      wrongTarget: `Name ${t.nameOf(guiltyKey)} as your guilty check.`,
      wrongVerdict: `Say ${t.nameOf(guiltyKey)} is GUILTY, not innocent.`,
      incomplete: `Include all three: you're the Cop, ${t.nameOf(guiltyKey)}, guilty.`,
      silence: `Type: "I'm the Cop. ${t.nameOf(guiltyKey)} is guilty."`,
    },
    also: [
      {
        id: "claimVillager",
        label: "Say: “Just a Villager here.”",
        sample: "Just a Villager here.",
        when: (text, r) => r.roles.includes("villager"),
        bad: {
          reactions: [
            ["cop", `Then listen up: I'm the Cop. ${t.nameOf("mafioso")} is GUILTY.`],
            ["v1", "Uncontested Cop with a guilty?"],
          ],
          lesson:
            "If nobody counterclaims, the real Cop's guilty goes uncontested. That's why the Mafia usually counterclaims the Cop on Day 1. Try the Cop claim.",
        },
      },
    ],
  });
}
