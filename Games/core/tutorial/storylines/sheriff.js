// SHERIFF: two players claim Cop on Day 1. Shoot one now, or hold the shot
// while the town lynches the Cop's guilty, and let the flip tell you who is
// real. Shooting a random quiet player is the bad option.
const WAIT_LESSON = "As Sheriff, waiting to gather info can be better than shooting early.";

const TOWN = ["cop", "journalist", "v1", "v2", "v3"];

function night(t, victim, { check } = {}) {
  for (const key of ["mafioso", "lawyer", "janitor"]) t.vote(key, "Mafia Kill", victim);
  t.vote("janitor", "Clean Death", "No");
  t.vote("lawyer", "Litigate", "*");
  if (check) t.vote("cop", "Investigate", check);
}

module.exports = {
  id: "sheriff",
  title: "Sheriff",
  roleName: "Sheriff",
  userSeat: "sheriff",
  blurb: "Two Cop claims, one gun. Shoot now, or wait for more information?",
  available: true,
  freeVote: (t, meeting) => meeting.name === "Village" && t.data.freeLynch,
  intro:
    "Welcome to the tutorial! You are the Sheriff, on the town side. You have a gun that can kill one player during the day. Nobody's role is known yet. It's Night 1.",

  states: {
    async Night1(t, k) {
      night(t, "v2", { check: "mafioso" });
      await t.advance(k, "You have nothing to do at night. When you've read this, click Continue to start Day 1.");
    },

    async Day1(t, k) {
      await t.chat("Village", [
        ["v1", "Eli's dead. Power roles, anything?"],
        ["cop", "Cop here. I checked Silas last night: Silas is GUILTY."],
        ["janitor", "No, I'M the Cop. I checked Cassidy: GUILTY. She's lying to frame Silas."],
        ["mafioso", "Thank you, Boone. Cassidy is clearly fake."],
        ["v3", "Two Cops?? One of them is Mafia."],
        ["journalist", "Sheriff, if you're out there... careful."],
      ], k);
      t.guide(`Two players claim Cop. ${t.nameOf("cop")} says Silas is guilty. ${t.nameOf("janitor")} says ${t.nameOf("cop")} is guilty. Only one can be the real Cop; the other is Mafia lying.`);
      t.guide("Right now it's one word against another. Nothing proves either claim yet.");
      const choice = await t.decide({
        token: k,
        text: `Your choice. Shoot ${t.nameOf("cop")} or ${t.nameOf("janitor")} (click their name in the Shoot Gun box or a button here), or hold your shot today and see what the lynch reveals.`,
        options: [
          { id: "shootFake", label: `Shoot ${t.nameOf("janitor")}`, vote: { meeting: "Shoot Gun", target: "janitor" } },
          { id: "shootReal", label: `Shoot ${t.nameOf("cop")}`, vote: { meeting: "Shoot Gun", target: "cop" } },
          { id: "wait", label: "Hold your shot for now" },
          {
            id: "shootRandom",
            label: "Shoot Dolly (she's been quiet)",
            vote: { meeting: "Shoot Gun", target: "v1" },
            bad: {
              consequence: async (t, k) => {
                await t.wait(t.timing.beat, k);
                await t.chat("Village", [
                  ["v3", "Dolly was a VILLAGER! Why would you shoot her?!"],
                  ["janitor", "Wow. Our Sheriff just wasted the only gun in town."],
                ], k);
              },
              fatal: true,
              lesson:
                "Dolly was a Villager and your only bullet is gone. Never shoot without a reason: in Frontier Justice the Sheriff's shot belongs on a Cop counterclaim or a confirmed guilty, not on a quiet player.",
            },
          },
        ],
      });
      t.branch = choice;
      if (choice === "wait") return waitDay1(t, k);
      if (choice === "shootReal") return shootRealDay1(t, k);
      return shootFakeDay1(t, k);
    },

    async Night2(t, k) {
      if (t.branch === "shootReal") night(t, "journalist");
      else night(t, "v3", { check: "lawyer" });
      await t.advance(k, "Night passes. Click Continue to start the next day.");
    },

    async Day2(t, k) {
      if (t.branch === "wait") return waitDay2(t, k);
      if (t.branch === "shootFake") return lynchDay(t, k, "lawyer", 2);
    },

    async Night3(t, k) {
      night(t, "v1");
      await t.advance(k);
    },

    async Day3(t, k) {
      return lynchDay(t, k, "mafioso", 3);
    },
  },

  epilogue: (t) =>
    t.branch === "shootReal"
      ? [
          "The Mafia won. You shot the real Cop, so the town lost its best information and the Mafia took over.",
          `Lesson: ${WAIT_LESSON} With one more day, the lynch flip and the real Cop's next report would have shown you who to shoot.`,
        ]
      : t.branch === "wait"
      ? [
          "The town won! Waiting a day gave you the proof you needed.",
          `Lesson: ${WAIT_LESSON}`,
        ]
      : [
          "The town won! You read the fake Cop correctly.",
          `But that was a 50/50 guess. ${WAIT_LESSON} Try the tutorial again and hold your shot to see the difference.`,
        ],
};

async function shootFakeDay1(t, k) {
  await t.wait(t.timing.beat, k);
  t.guide(`${t.nameOf("janitor")} was the Janitor, Mafia! The real Cop is ${t.nameOf("cop")}, so her report on Silas is true.`);
  await t.chat("Village", [
    ["v1", "Boone was Mafia! Cassidy's the real deal."],
    ["cop", "Told you. Silas is guilty."],
    ["mafioso", "This is a setup!"],
  ], k);
  await lynchVote(t, k, "mafioso");
}

async function shootRealDay1(t, k) {
  await t.wait(t.timing.beat, k);
  t.guide(`${t.nameOf("cop")} was the real Cop. That means ${t.nameOf("janitor")} lied, but the town just lost its investigator.`);
  await t.chat("Village", [
    ["v3", "Cassidy was the REAL Cop?! Sheriff, what did you do..."],
    ["janitor", "Uh, she must've been framed by a Lawyer. Anyway, Dolly's been weird all day."],
    ["lawyer", "Yeah, Dolly. Let's go."],
    ["mafioso", "Dolly."],
  ], k);
  t.guide("The Mafia is pushing the town onto Dolly. Without the Cop, the town can't tell who's lying. Vote however you like and watch.");
  t.data.freeLynch = true;
  await t.townVote(["janitor", "lawyer", "mafioso", "journalist", "v3"], "v1", k);
  await t.advance(k, "Click Continue to end the day.");
}

// Holding the shot: the town still lynches (a D1 no-lynch only happens when
// the Sheriff is dead). It goes with the first claim's guilty, and the flip
// is the new information.
async function waitDay1(t, k) {
  t.guide("You held your shot. The town still lynches today; the result is new information.");
  await t.chat("Village", [
    ["v1", "Sheriff's not shooting yet. Then let's lynch the guilty and see what flips."],
    ["journalist", "Agreed. If Silas flips Mafia, Cassidy is real."],
    ["janitor", "Fine, but when Silas flips town, Cassidy's next."],
  ], k);
  await lynchVote(t, k, "mafioso", `The town is testing ${t.nameOf("cop")}'s claim by lynching Silas. Vote Silas.`);
}

async function waitDay2(t, k) {
  await t.chat("Village", [
    ["v1", "Silas flipped MAFIOSO. Cassidy was telling the truth."],
    ["cop", "Checked Flint last night: GUILTY."],
    ["janitor", "I checked, uh... Hattie. Innocent."],
    ["v1", "Boone, Hattie died LAST NIGHT. And Silas flipped Mafia, the guy you defended."],
    ["journalist", "I'm the Journalist: I get the Cop's reports. Last night I received a report on Flint: guilty. Nothing on Hattie."],
  ], k);
  t.guide(`New information! Silas flipped Mafia, which proves ${t.nameOf("cop")}'s Day 1 result. ${t.nameOf("janitor")} also slipped: he 'checked' Hattie, who was killed last night.`);
  t.guide(`${t.nameOf("journalist")}, the Journalist, confirms ${t.nameOf("cop")} checked Flint. ${t.nameOf("cop")} is the real Cop and ${t.nameOf("janitor")} is the fake.`);
  await t.decide({
    token: k,
    text: `Now you know who's lying. Shoot the fake Cop: click ${t.nameOf("janitor")} in the Shoot Gun box (or the button here).`,
    options: [
      { id: "go", label: `Shoot ${t.nameOf("janitor")}`, vote: { meeting: "Shoot Gun", target: "janitor" } },
      {
        id: "shootCop",
        label: `Shoot ${t.nameOf("cop")}`,
        vote: { meeting: "Shoot Gun", target: "cop" },
        bad: {
          consequence: async (t, k) => {
            await t.wait(t.timing.beat, k);
            await t.say("v1", "Village", "She was the REAL Cop, proven twice! What have you done?", k);
          },
          fatal: true,
          lesson: `${t.nameOf("cop")} was proven by the Silas flip and the Journalist. Shooting against the evidence hands the game to the Mafia. When you wait for information, use it.`,
        },
      },
    ],
    wrong: () => {
      t.say("v1", "Village", "Don't you DARE shoot Cassidy, she's been right twice!").catch(() => {});
      t.guide(`${t.nameOf("cop")} is proven. Shoot ${t.nameOf("janitor")}, the fake Cop.`);
    },
  });
  await t.wait(t.timing.beat, k);
  t.guide(`${t.nameOf("janitor")} was the Janitor, Mafia. ${WAIT_LESSON} You shot with proof instead of a guess.`);
  await lynchVote(t, k, "lawyer");
}

async function lynchVote(t, k, target, text) {
  await t.expectVote("Village", target, {
    token: k,
    label: `Vote ${t.nameOf(target)}`,
    text: text || `The Cop said ${t.nameOf(target)} is guilty. Vote ${t.nameOf(target)} in the Village box (or click the button here).`,
    also: [
      {
        id: "noLynch",
        label: "Vote No one",
        vote: { meeting: "Village", target: "*" },
        bad: {
          reactions: [["cop", "No lynch while we have a guilty? Come on, Sheriff."]],
          lesson: "With the Sheriff alive the town almost never skips a lynch: every lynch flips a role and gives information. Vote the guilty.",
        },
      },
    ],
    wrongReactions: [
      ["v1", `Sheriff?! The Cop literally said ${t.nameOf(target)}. Why vote someone else?`],
      ["cop", "Trust the report, {name}. That vote makes you look bad."],
    ],
  });
  await t.townVote(TOWN, target, k);
  await t.advance(k);
}

async function lynchDay(t, k, target, day) {
  await t.chat("Village", [
    ["cop", day === 2 ? "Checked Flint last night: GUILTY." : "Only Silas left. He's the last one."],
  ], k);
  await lynchVote(t, k, target);
}
