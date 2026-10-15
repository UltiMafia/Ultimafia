// LAWYER: learn jan codes. The Janitor sets a code in Mafia chat, cleans the
// night kill, and tells you the hidden role in public using the code.

// Phrase the Janitor will drop in town chat for each role.
const CODE = {
  Villager: "nice weather",
  Cop: "storm's coming",
  Journalist: "dusty trail",
  Sheriff: "sunset",
};

const VICTIMS = ["cop", "journalist", "sheriff", "v1", "v2"];

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
      await t.expectVote("Litigate", "mafioso", {
        token: k,
        text: "As Lawyer, Litigate makes someone look like the opposite alignment to investigators. Protect your teammate: in the Litigate box, click Silas.",
      });
      t.guide("Silas will now look innocent if the Cop checks him tonight.");
      await t.advance(k);
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
      });
      await t.chat("Village", [
        ["v1", "Okay. Hattie's been pushing hard all day. Feels off."],
        ["mafioso", "Agreed, Hattie."],
      ], k);
      await t.expectVote("Village", "v3", {
        token: k,
        text: "Your team is pushing the lynch onto Hattie, a Villager. In the Village box, click Hattie.",
        wrongReactions: [
          ["mafioso", "Huh? We were all on Hattie. Why switch now?"],
          ["v3", "Wait, why are you voting THEM, {name}? Suspicious."],
        ],
      });
      for (const key of ["janitor", "mafioso", "v1", "journalist", "cop", "sheriff", "v2"])
        if (key !== victim) t.vote(key, "Village", "v3");
      await t.advance(k);
    },

    async Night2(t, k) {
      const pick = ["cop", "sheriff", "journalist", "v1", "v2"].find(
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
      await t.advance(k);
    },
  },

  epilogue: (t) => [
    "The Mafia won! When the Mafia equals the town, the Mafia wins.",
    `Lesson: a jan code lets the Janitor pass a cleaned role to teammates in plain sight. "${CODE[t.constructor.CAST[t.data.victim].role]}" sounded like small talk, but it told you exactly what ${t.nameOf(t.data.victim)} was.`,
  ],
};
