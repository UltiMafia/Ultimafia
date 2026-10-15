const chatMatch = require("../chatMatch");
// LAWYER: learn jan codes. The Janitor sets a code in Mafia chat, cleans the
// night kill, and tells you the hidden role in public using the code.

// Phrase the Janitor will drop in town chat for each role.
const CODE = {
  Villager: "nice weather",
  Cop: "storm's coming",
  Journalist: "dusty trail",
  Sheriff: "sunset",
};

// The Sheriff stays alive: with a gun in town, the D1 lynch always happens.
// A janned power role is possible but not certain, as in real FJ games.
const VICTIMS = ["cop", "journalist", "v1", "v2"];

module.exports = {
  id: "lawyer",
  title: "Lawyer",
  roleName: "Lawyer",
  userSeat: "lawyer",
  blurb: "Learn how the Mafia passes secret info with a jan code.",
  available: true,
  freeVote: () => false,
  intro:
    "Welcome to the tutorial! You are the Lawyer, on the Mafia team with Boone (Janitor) and Silas (Mafioso). It's Night 1.",

  states: {
    async Night1(t, k) {
      const victim =
        t.data.victim || (t.data.victim = VICTIMS[Math.floor(Math.random() * VICTIMS.length)]);
      const victimName = t.nameOf(victim);
      await t.chat("Mafia Meeting", [
        ["janitor", "I'll clean tonight's body. Jan code so you know what they were:"],
        ["janitor", `Tomorrow in town: "${CODE.Villager}" = Villager, "${CODE.Cop}" = Cop, "${CODE.Journalist}" = Journalist, "${CODE.Sheriff}" = Sheriff.`],
        ["mafioso", `Got it. Let's take ${victimName}.`],
      ], k);
      t.guide(
        "That was a jan code. The Janitor will learn the cleaned player's role, but Mafia chat closes during the day, so he'll tell you in public with an innocent-sounding phrase. Remember the code!"
      );
      await t.expectVote("Mafia Kill", victim, {
        token: k,
        text: `Your team picked ${victimName}. In the Mafia Kill box, click ${victimName}.`,
      });
      t.vote("mafioso", "Mafia Kill", victim);
      t.vote("janitor", "Mafia Kill", victim);
      t.vote("janitor", "Clean Death", "Yes");
      t.vote("cop", "Investigate", "mafioso");
      await t.expectVote("Litigate", "mafioso", {
        token: k,
        label: "Litigate: Silas",
        text: "As Lawyer, Litigate makes someone look like the opposite alignment to investigators. Protect your teammate: click Silas in the Litigate box.",
        also: [
          {
            id: "litigateTown",
            vote: { meeting: "Litigate", target: "*other" },
            bad: {
              lesson: "Litigating a town player makes them look GUILTY, which can be useful, but tonight the Cop may check your teammate. Protect Silas first.",
            },
          },
        ],
      });
      await t.advance(k, "Silas will look innocent to the Cop tonight. Click Continue to start Day 1.");
    },

    async Day1(t, k) {
      const victim = t.data.victim;
      const victimName = t.nameOf(victim);
      const role = t.constructor.CAST[victim].role;
      const phrase = CODE[role];
      await t.chat("Village", [
        ["v3", `${victimName} is dead and the role is hidden. There's a Janitor.`],
        ["janitor", `Rough night. At least it's ${phrase} out there today.`],
      ], k);
      if (victim !== "cop") {
        await t.chat("Village", [
          ["cop", "Cop here. I checked Silas last night: innocent."],
          ["mafioso", "See? Clean."],
        ], k);
        t.guide("Your Litigate worked: the Cop's check on Silas came back innocent, so the Cop just cleared a Mafia member in public.");
      }
      t.guide(
        `Boone just said "${phrase}". By the code, that means ${victimName} was the ${role}. You know it and the town doesn't.`
      );
      const reactions = {
        wrongRole: [
          ["cop", "You're claiming THAT? Interesting... I'm watching you, {name}."],
          ["v3", "That claim doesn't add up, {name}."],
        ],
        incomplete: [["v1", "What's your role, {name}?"]],
        silence: [
          ["v3", "{name}, you haven't said a word. What are you?"],
          ["sheriff", "Quiet ones make me nervous. Claim, {name}."],
        ],
      };
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "villager" },
        text:
          "The town wants everyone to claim. Don't reveal what you learned; blend in. Type in town chat that you're a Villager.",
        example: "Just a Villager here, sorry.",
        reactions,
        hints: {
          wrongRole: "Claiming a power role invites a counterclaim. Claim Villager: it's the safest cover.",
          incomplete: "Say your role. Claim Villager.",
          silence: 'Type something like: "I\'m just a Villager."',
        },
        also: [
          {
            id: "leakCode",
            label: `Say: “${victimName} was the ${role}!”`,
            sample: `${victimName} was the ${role}!`,
            // Names the cleaned player together with their hidden role.
            when: (text, r) =>
              r.named.includes(victimName) && chatMatch.mentionedRoles(text).includes(role.toLowerCase()),
            bad: {
              reactions: [
                ["v3", `How could you possibly know that? ${victimName}'s role was cleaned!`],
                ["sheriff", "Only the Mafia knows a cleaned role. Thanks for telling me, {name}."],
              ],
              consequence: async (t, k) => {
                t.vote("sheriff", "Shoot Gun", "lawyer");
                await t.wait(t.timing.beat, k);
              },
              fatal: true,
              lesson: "The Sheriff shot you. A cleaned role is hidden from the town, so only the Mafia can know it. Never reveal what you learned from a jan code.",
            },
          },
        ],
      });
      await t.chat("Village", [
        ["v1", "Okay. Hattie's been pushing hard all day. Feels off."],
        ["mafioso", "Agreed, Hattie."],
      ], k);
      await t.expectVote("Village", "v3", {
        token: k,
        label: "Vote Hattie",
        also: [
          {
            id: "voteTeammate",
            label: "Vote Silas",
            vote: { meeting: "Village", target: "mafioso" },
            bad: {
              reactions: [["mafioso", "Wait, what? I'm clean, the Cop said so!"]],
              lesson: "Voting your own teammate here would get Mafia lynched for nothing. Stick with your team's push onto Hattie.",
            },
          },
        ],
        text: "Your team is pushing the lynch onto Hattie, a Villager. Vote Hattie in the Village box.",
        wrongReactions: [
          ["mafioso", "Huh? We were all on Hattie. Why switch now?"],
          ["v3", "Wait, why are you voting THEM, {name}? Suspicious."],
        ],
      });
      await t.townVote(
        ["janitor", "mafioso", "v1", "journalist", "cop", "sheriff", "v2"].filter((key) => key !== victim),
        "v3",
        k
      );
      await t.advance(k);
    },

    async Night2(t, k) {
      const pick = ["sheriff", "cop", "journalist", "v1", "v2"].find(
        (key) => key !== t.data.victim && t.player(key) && t.player(key).alive
      );
      t.data.victim2 = pick;
      await t.say("janitor", "Mafia Meeting", `One more and the town's ours. ${t.nameOf(pick)}?`, k);
      await t.expectVote("Mafia Kill", pick, {
        token: k,
        text: `Three Mafia against three town after tonight. Click ${t.nameOf(pick)} in Mafia Kill to finish it.`,
      });
      t.vote("mafioso", "Mafia Kill", pick);
      t.vote("janitor", "Mafia Kill", pick);
      t.vote("janitor", "Clean Death", "No");
      await t.advance(k, "Click Continue to end the night.");
    },
  },

  epilogue: (t) => [
    "The Mafia won! When the Mafia equals the town, the Mafia wins.",
    `Lesson: a jan code lets the Janitor pass a cleaned role to teammates in plain sight. "${CODE[t.constructor.CAST[t.data.victim].role]}" sounded like small talk, but it told you exactly what ${t.nameOf(t.data.victim)} was.`,
  ],
};
