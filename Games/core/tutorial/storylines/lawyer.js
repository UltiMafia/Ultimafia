const chatMatch = require("../chatMatch");
// LAWYER: learn jan codes. Day 1 the Sheriff shoots the Janitor but town
// mislynches; Night 2 kill; Day 2 a second mislynch gives Mafia the win.
// Night 2 reminds you to Litigate again (optional, not gated).
// The Lawyer is Loyal: the human's Litigate box lists only Mafia teammates
// (see litigateTargets / TutorialController.restrictLitigate).

const CODE = {
  Villager: "nice weather",
  Cop: "storm's coming",
  Journalist: "dusty trail",
  Sheriff: "sunset",
};

const VICTIMS = ["cop", "journalist", "v1", "v2"];

module.exports = {
  id: "lawyer",
  title: "Lawyer",
  roleName: "Lawyer",
  userSeat: "lawyer",
  blurb: "Learn how the Mafia passes secret info with a jan code.",
  available: true,
  intro: null,

  states: {
    async Night1(t, k) {
      t.guide(
        `Welcome to the tutorial! You are the Lawyer, on the Mafia team with ${t.nameOf("janitor")} (Janitor) and ${t.nameOf("mafioso")} (Mafioso). It's Night 1.`
      );
      const victim =
        t.data.victim || (t.data.victim = VICTIMS[Math.floor(Math.random() * VICTIMS.length)]);
      const victimName = t.nameOf(victim);
      await t.chat("Mafia Meeting", [
        ["janitor", "I'll clean tonight's body. Jan code so you know what they were:"],
        ["janitor", `Tomorrow in town: "${CODE.Villager}" = Villager, "${CODE.Cop}" = Cop, "${CODE.Journalist}" = Journalist, "${CODE.Sheriff}" = Sheriff.`],
        ["mafioso", `Got it. Let's take ${victimName}.`],
      ], k);
      t.guide(
        "That was a jan code. The Janitor will learn the cleaned player's role, but Mafia chat closes during the day, so they'll tell you in public with an innocent-sounding phrase. Remember the code!"
      );
      t.guide(
        "As Lawyer you must do TWO things tonight before Continue unlocks: (1) vote with your team on the Mafia Kill, and (2) use Litigate on a Mafia teammate. Both are required."
      );
      t.guide(
        "This setup's Lawyer is Loyal: Litigate only works on your own Mafia teammates (it makes them look innocent), so only they appear in the Litigate box. A plain (non-Loyal) Lawyer can also make a town player look guilty, but most setups use Loyal."
      );
      await t.expectVote("Mafia Kill", victim, {
        token: k,
        text: `Your team picked ${victimName}. First: in the Mafia Kill box, click ${victimName}.`,
      });
      t.vote("mafioso", "Mafia Kill", victim);
      t.vote("janitor", "Mafia Kill", victim);
      t.vote("janitor", "Clean Death", "Yes");
      t.vote("cop", "Investigate", "mafioso");
      await t.expectVote("Litigate", "mafioso", {
        token: k,
        label: `Litigate: ${t.nameOf("mafioso")}`,
        text: `Second: Litigate makes a teammate look innocent to investigators. The Mafioso is the likeliest Cop check, so protect them: click ${t.nameOf("mafioso")} in the Litigate box.`,
        also: [
          {
            id: "litigateJanitor",
            label: `Litigate: ${t.nameOf("janitor")}`,
            vote: { meeting: "Litigate", target: "janitor" },
            bad: {
              lesson: `${t.nameOf("janitor")} is a teammate too, but the Mafioso is the one most likely to be checked tonight. Protect ${t.nameOf("mafioso")}.`,
            },
          },
        ],
      });
      await t.advance(k, `${t.nameOf("mafioso")} will look innocent to the Cop tonight. Click Continue to start Day 1.`);
    },

    async Day1(t, k) {
      const victim = t.data.victim;
      const victimName = t.nameOf(victim);
      const role = t.constructor.CAST[victim].role.split(":")[0];
      const phrase = CODE[role];
      await t.chat("Village", [
        ["v3", `${victimName} is dead and the role is hidden. There's a Janitor.`],
        ["janitor", `Rough night. At least it's ${phrase} out there today.`],
      ], k);
      if (victim !== "cop") {
        await t.chat("Village", [
          ["cop", `Cop here. I checked ${t.nameOf("mafioso")} last night: innocent.`],
          ["mafioso", "See? Clean."],
        ], k);
        t.guide(`Your Litigate worked: the Cop's check on ${t.nameOf("mafioso")} came back innocent.`);
      }
      t.guide(
        `${t.nameOf("janitor")} just said "${phrase}". By the code, that means ${victimName} was the ${role}. You know it and the town doesn't.`
      );
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "villager" },
        text: "The town wants everyone to claim. Blend in — type that you're a Villager.",
        example: "Just a Villager here, sorry.",
        reactions: {
          wrongRole: [
            ["cop", "You're claiming THAT? Interesting..."],
            ["v3", "That claim doesn't add up, {name}."],
          ],
          incomplete: [["v1", "What's your role, {name}?"]],
          silence: [
            ["v3", "{name}, you haven't said a word. What are you?"],
            ["sheriff", "Quiet ones make me nervous. Claim, {name}."],
          ],
        },
        hints: {
          wrongRole: "Claim Villager: it's the safest cover.",
          incomplete: "Say your role. Claim Villager.",
          silence: 'Type: "I\'m just a Villager."',
        },
        also: [
          {
            id: "leakCode",
            label: `Say: “${victimName} was the ${role}!”`,
            sample: `${victimName} was the ${role}!`,
            when: (text, r) =>
              r.named.includes(victimName) && chatMatch.mentionedRoles(text).includes(role.toLowerCase()),
            bad: {
              reactions: [
                ["v3", `How could you possibly know that? ${victimName}'s role was cleaned!`],
                ["sheriff", "Only the Mafia knows a cleaned role. Thanks, {name}."],
              ],
              consequence: async (t, k) => {
                t.vote("sheriff", "Shoot Gun", "lawyer");
                await t.wait(t.timing.beat, k);
              },
              fatal: true,
              lesson: "The Sheriff shot you. Never reveal what you learned from a jan code.",
            },
          },
        ],
      });
      // Count (9 = 3 Mafia + 6 town): N1 kill -> 8 (3M/5T). D1 the Sheriff
      // shoots the Janitor -> 7 (2M/5T), town mislynches a Villager -> 6
      // (2M/4T). N2 kill -> 5 (2M/3T). D2 mislynch -> 4 (2M/2T): Mafia wins.
      const lynchTarget = ["v1", "v3", "v2"].find(
        (key) => key !== victim && t.player(key) && t.player(key).alive
      ) || "v1";
      t.data.lynch1 = lynchTarget;
      await t.chat("Village", [
        ["sheriff", `${t.nameOf("janitor")}, you're awfully chatty about the weather for someone whose friend just died. Gun's coming out.`],
        ["mafioso", "Wait, Sheriff?!"],
      ], k);
      t.vote("sheriff", "Shoot Gun", "janitor");
      await t.wait(t.timing.beat, k);
      t.guide(`The Sheriff shot ${t.nameOf("janitor")}, your Janitor. The town's gun is spent, but you're down a teammate. Keep your cover: it's you and ${t.nameOf("mafioso")} now.`);
      await t.chat("Village", [
        ["v1", `${t.nameOf("janitor")} was Mafia! Nice shot. Who else?`],
        ["mafioso", `${t.nameOf(lynchTarget)} was defending them all day. ${t.nameOf(lynchTarget)}.`],
        ["v3", `Fine, ${t.nameOf(lynchTarget)}.`],
      ], k);
      await t.expectVote("Village", lynchTarget, {
        token: k,
        label: `Vote ${t.nameOf(lynchTarget)}`,
        text: `${t.nameOf("mafioso")} is steering the town onto ${t.nameOf(lynchTarget)}, a Villager. Vote them in the Village box.`,
        also: [
          {
            id: "voteTeammate",
            label: `Vote ${t.nameOf("mafioso")}`,
            vote: { meeting: "Village", target: "mafioso" },
            bad: {
              reactions: [["mafioso", "Wait, what? I'm clean!"]],
              lesson: "Don't vote your teammate here. Stick with the town mislynch.",
            },
          },
        ],
        wrongReactions: [
          ["mafioso", `Huh? We were on ${t.nameOf(lynchTarget)}.`],
        ],
      });
      await t.everyoneVotes(lynchTarget, k);
      t.guide(`Town lynched ${t.nameOf(lynchTarget)}, a Villager. Two Mafia are left against four town: one more kill and one more mislynch wins it.`);
      await t.advance(k);
    },

    async Night2(t, k) {
      const pick = ["cop", "journalist", "sheriff", "v1", "v2", "v3"].find(
        (key) => key !== t.data.victim && t.player(key) && t.player(key).alive
      );
      t.data.victim2 = pick;
      await t.say("mafioso", "Mafia Meeting", `Just us now. Take ${t.nameOf(pick)} tonight?`, k);
      t.guide(
        "Reminder: you should always use your Lawyer action (Litigate) on a teammate when you have it — even tonight. Only your living teammate shows in the Litigate box. It is NOT required to click Continue this phase, but skipping Litigate in a real game wastes a powerful tool."
      );
      t.data.allowLitigate = true;
      await t.expectVote("Mafia Kill", pick, {
        token: k,
        text: `Click ${t.nameOf(pick)} in Mafia Kill.`,
      });
      t.vote("mafioso", "Mafia Kill", pick);
      await t.advance(k, "Click Continue to end the night. (Using Litigate again was optional but recommended.)");
    },

    async Day2(t, k) {
      const dead = t.data.victim2;
      const target = ["v3", "v2", "v1", "journalist", "cop"].find(
        (key) => key !== t.data.victim && key !== dead && key !== t.data.lynch1 && t.player(key) && t.player(key).alive
      );
      t.data.lynch2 = target;
      await t.chat("Village", [
        ["v1", `${t.nameOf(dead)} is gone too. We have to get this one right.`],
        ["mafioso", `${t.nameOf(target)} pushed ${t.nameOf(t.data.lynch1)} yesterday and was wrong. That's a Mafia move.`],
      ], k);
      await t.expectVote("Village", target, {
        token: k,
        label: `Vote ${t.nameOf(target)}`,
        text: `Back ${t.nameOf("mafioso")}: vote ${t.nameOf(target)} in the Village box. If town lynches a Villager now, Mafia reaches half the players and wins.`,
        also: [
          {
            id: "voteTeammate",
            label: `Vote ${t.nameOf("mafioso")}`,
            vote: { meeting: "Village", target: "mafioso" },
            bad: {
              reactions: [["mafioso", "You're voting ME?"]],
              lesson: "Never vote your last teammate in the endgame. Stay on the town player.",
            },
          },
        ],
        wrongReactions: [["mafioso", `Stay on ${t.nameOf(target)}.`]],
      });
      await t.everyoneVotes(target, k);
      t.guide(`Town lynched ${t.nameOf(target)}, another Villager. That leaves two Mafia and two town. Click Continue to end the day.`);
      await t.advance(k);
    },
  },

  // Loyal Lawyer: Litigate lists only living Mafia teammates (never self).
  litigateTargets: true,

  freeVote: (t, meeting) => meeting.name === "Litigate" && t.data.allowLitigate,

  epilogue: (t) => [
    "The Mafia won! When the Mafia equals the town, the Mafia wins.",
    `Lesson: a jan code passes cleaned roles in plain sight, and you kept your teammate looking innocent with Litigate. Town lost the Janitor to the gun but mislynched twice, and on Day 2 Mafia reached half the players. Always Litigate a teammate when you can, even when the night doesn't force it.`,
  ],
};
