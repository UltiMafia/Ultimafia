// JANITOR: you fake a Cop claim and frame the real Cop. The Sheriff shoots
// her, she flips Cop, the town lynches you, and your teammates still win.
module.exports = {
  id: "janitor",
  title: "Janitor",
  roleName: "Janitor",
  userSeat: "janitor",
  blurb: "Fake a Cop claim, frame the real Cop, and watch the Mafia fool the town.",
  available: true,
  // Voting in the town lynch is up to you (it doesn't change the story).
  freeVote: (t, meeting) => meeting.name === "Village",
  intro:
    "Welcome to the tutorial! You are the Janitor, on the Mafia team with Flint (Lawyer) and Silas (Mafioso). Nobody else knows who you are. It's Night 1.",

  states: {
    async Night1(t, k) {
      await t.chat("Mafia Meeting", [
        ["mafioso", "Evening, partner. Quiet town. Let's keep it that way."],
        ["lawyer", "Eli's been nosing around. I say he goes tonight."],
      ], k);
      await t.expectVote("Mafia Kill", "v2", {
        token: k,
        text: "The Mafia picks one player to kill each night. In the Mafia Kill box, click Eli.",
        wrong: () => t.guide("Your team agreed on Eli. In the Mafia Kill box, click Eli."),
      });
      t.vote("mafioso", "Mafia Kill", "v2");
      t.vote("lawyer", "Mafia Kill", "v2");
      await t.expectVote("Clean Death", "Yes", {
        token: k,
        label: "Yes",
        text: "As Janitor you can clean tonight's kill: the town won't see Eli's role, but you will. In the Clean Death box, click Yes.",
      });
      await t.say("lawyer", "Mafia Meeting", "Clean as a whistle. Tomorrow we make the Cop look like the liar.", k);
      t.vote("lawyer", "Litigate", "*");
      await t.advance(k, "Good. You'll learn Eli's role privately when the night ends. Tomorrow you'll pretend to be the Cop. Click Continue to start Day 1.");
    },

    async Day1(t, k) {
      await t.chat("Village", [
        ["v1", "Eli's gone and his role is wiped. We've got a Janitor in town."],
        ["v3", "Any power roles want to speak up?"],
      ], k);
      const reactions = {
        wrongRole: [
          ["v3", "Wait, you're claiming WHAT? That doesn't help us at all, {name}."],
          ["v1", "That claim makes zero sense. You're sounding pretty scummy."],
        ],
        wrongTarget: [
          ["journalist", "Why are you naming them? Who did you actually check?"],
          ["v1", "Hold on, that's not what I expected you to say. Be specific."],
        ],
        wrongVerdict: [
          ["v3", "So they're innocent? Then why bring it up?"],
          ["sheriff", "A cleared player doesn't help me. Got anything guilty?"],
        ],
        incomplete: [
          ["sheriff", "Spit it out, {name}. Role and result, please."],
          ["v1", "That's vague. What did you find?"],
        ],
        silence: [
          ["v1", "{name}, you've been awfully quiet. Anything to share?"],
          ["sheriff", "Silence is suspicious, {name}. Talk."],
          ["v3", "{name}?? Hello?"],
        ],
      };
      await t.expectChat({
        token: k,
        meeting: "Village",
        expect: { role: "cop", target: "cop", verdict: "guilty" },
        text: `Fake-claim Cop. In the town chat, type that you're the Cop and that ${t.nameOf("cop")} is guilty.`,
        example: `I'm the Cop. I checked ${t.nameOf("cop")} last night: guilty!`,
        reactions,
        hints: {
          wrongRole: "The town wants a Cop. Claim Cop (not another role) and say who you 'checked'.",
          wrongTarget: `Name ${t.nameOf("cop")} as your guilty check. She's the real Cop, so she's the one to frame.`,
          wrongVerdict: `Say ${t.nameOf("cop")} is GUILTY, not innocent. You're framing her.`,
          incomplete: `Include all three: you're the Cop, ${t.nameOf("cop")}, guilty.`,
          silence: `The town is waiting. Type: "I'm the Cop. ${t.nameOf("cop")} is guilty."`,
        },
        also: [
          {
            id: "randomGuilty",
            label: `Say: “I'm the Cop. Dolly is guilty.” (a random guess)`,
            sample: "I'm the Cop. Dolly is guilty.",
            when: (text, r) => r.problem === "wrongTarget" && r.verdict === "guilty",
            bad: {
              reactions: [
                ["cop", "Funny, I'M the Cop, and I checked Dolly last night: innocent."],
                ["v1", "I'm a Villager! {name} is making it up!"],
                ["sheriff", "Two Cops, and one of them just called a confirmed innocent guilty. Easy call."],
              ],
              consequence: async (t, k) => {
                t.vote("sheriff", "Shoot Gun", "janitor");
                await t.wait(t.timing.beat, k);
              },
              fatal: true,
              lesson:
                "The Sheriff shot you. A random guilty is easy to disprove: the real Cop may have checked that very player. A fake Cop should counter the real Cop directly, framing her, so it's one word against another.",
            },
          },
          {
            id: "claimVillager",
            label: "Say: “Just a Villager here.”",
            sample: "Just a Villager here.",
            when: (text, r) => r.roles.includes("villager"),
            bad: {
              reactions: [
                ["cop", "Then listen up: I'm the Cop. Silas is GUILTY."],
                ["sheriff", "Uncontested Cop with a guilty? If nobody objects, Silas is getting shot."],
              ],
              lesson:
                "If nobody counterclaims, the real Cop's guilty goes uncontested and the Sheriff shoots your teammate. That's why the Mafia usually counterclaims the Cop on Day 1. Try the Cop claim.",
            },
          },
        ],
      });
      await t.chat("Village", [
        ["cop", "That's a LIE. I'M the Cop! I checked Silas last night. Silas is guilty!"],
        ["mafioso", "Ha. Classic counterclaim. You got caught, Cassidy."],
        ["lawyer", "Our Cop spoke first. Cassidy's scrambling."],
        ["v1", "Two Cop claims. One of them is Mafia."],
        ["sheriff", "I'm the Sheriff and I have a gun. I'm not letting a fake Cop walk."],
      ], k);
      t.guide("Two players are claiming Cop. Watch the Sheriff decide who to believe.");
      await t.wait(t.timing.beat, k);
      t.vote("sheriff", "Shoot Gun", "cop");
      await t.wait(t.timing.beat, k);
      t.guide(`${t.nameOf("cop")} was shot. Her role is revealed: she was the real Cop. The town now knows you lied.`);
      await t.chat("Village", [
        ["v3", "She was the REAL Cop!! {human} lied to us!".replace("{human}", t.human().name)],
        ["v1", `Lynch ${t.human().name}. Now.`],
        ["mafioso", `...yeah. ${t.human().name} has to go.`],
        ["lawyer", "Agreed. Cassidy named Silas, but a dead Cop could've been framed too. Let's start with the liar."],
      ], k);
      t.guide("Your teammates are voting against you to look like town. That's called bussing. The town is lynching you; that's okay. Watch how your team keeps fooling everyone.");
      await t.townVote(["journalist", "sheriff", "v1", "v3", "mafioso", "lawyer"], "janitor", k);
      await t.advance(k, "You've been lynched. Click Continue to watch the rest of the game.");
    },

    async Night2(t, k) {
      t.guide("You're dead, but you can still watch. Tonight your team kills Wyatt, the Sheriff.");
      t.vote("mafioso", "Mafia Kill", "sheriff");
      t.vote("lawyer", "Mafia Kill", "sheriff");
      t.vote("lawyer", "Litigate", "*");
      await t.advance(k, "Click Continue when you're ready.");
    },

    async Day2(t, k) {
      await t.chat("Village", [
        ["lawyer", `${t.human().name} lied about Cop, sure. But Cassidy naming Silas could've been a setup too.`],
        ["mafioso", `Dolly was defending ${t.human().name} yesterday. Funny how that works.`],
        ["v1", "I was NOT defending him!"],
        ["v3", "Dolly did hesitate a lot..."],
        ["journalist", "I don't love it, but I'll go with Dolly."],
      ], k);
      t.guide("The Mafia is steering the town onto an innocent Villager. If Dolly goes, the Mafia equals the town and wins.");
      await t.townVote([["journalist", "v1"], ["v3", "v1"], ["mafioso", "v1"], ["lawyer", "v1"], ["v1", "mafioso"]], null, k);
      await t.advance(k, "Click Continue to see how it ends.");
    },
  },

  epilogue: () => [
    "The Mafia won. Even after you were caught, your teammates bussed you, looked trustworthy, and took over the vote.",
    "Lessons: a confident fake claim can get a real power role killed, and Mafia teammates can vote against each other to look like town.",
  ],
};
