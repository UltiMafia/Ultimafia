// SHERIFF: two players claim Cop. Shoot one now, or hold the shot a day and
// let new information expose the fake.
const WAIT_LESSON = "As Sheriff, waiting to gather info can be better than shooting early.";

module.exports = {
  id: "sheriff",
  title: "Sheriff",
  roleName: "Sheriff",
  userSeat: "sheriff",
  blurb: "Two Cop claims, one gun. Shoot now, or wait for more information?",
  available: true,
  freeVote: () => false,
  intro:
    "Welcome to the tutorial! You are the Sheriff, on the town side. You have a gun that can kill one player during the day. Nobody's role is known yet. It's Night 1.",

  states: {
    async Night1(t, k) {
      t.guide("You have nothing to do at night. The night will pass on its own.");
      t.vote("mafioso", "Mafia Kill", "v2");
      t.vote("lawyer", "Mafia Kill", "v2");
      t.vote("janitor", "Mafia Kill", "v2");
      t.vote("janitor", "Clean Death", "No");
      t.vote("lawyer", "Litigate", "*");
      t.vote("cop", "Investigate", "mafioso");
      await t.advance(k);
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
      const choice = await t.choose(
        [
          { id: "shootFake", label: `Shoot ${t.nameOf("janitor")}`, meeting: "Shoot Gun", target: "janitor" },
          { id: "shootReal", label: `Shoot ${t.nameOf("cop")}`, meeting: "Shoot Gun", target: "cop" },
          { id: "wait", label: "Hold your shot (vote No one in the Village box)", meeting: "Village", target: "*" },
        ],
        {
          token: k,
          text: `Your choice. You can shoot ${t.nameOf("cop")} or ${t.nameOf("janitor")} by clicking their name in the Shoot Gun box, OR hold your shot for a day by clicking "No one" in the Village box. Waiting means one more night, but maybe more information.`,
        }
      );
      t.branch = choice;
      if (choice === "wait") return waitDay1(t, k);
      if (choice === "shootReal") return shootRealDay1(t, k);
      return shootFakeDay1(t, k);
    },

    async Night2(t, k) {
      if (t.branch === "wait") {
        t.vote("mafioso", "Mafia Kill", "v3");
        t.vote("lawyer", "Mafia Kill", "v3");
        t.vote("janitor", "Mafia Kill", "v3");
        t.vote("janitor", "Clean Death", "No");
        t.vote("cop", "Investigate", "lawyer");
        t.guide("Night falls. The real Cop will investigate again tonight.");
      } else if (t.branch === "shootReal") {
        t.vote("mafioso", "Mafia Kill", "journalist");
        t.vote("lawyer", "Mafia Kill", "journalist");
        t.vote("janitor", "Mafia Kill", "journalist");
      } else {
        t.vote("mafioso", "Mafia Kill", "v3");
        t.vote("lawyer", "Mafia Kill", "v3");
        t.vote("cop", "Investigate", "lawyer");
      }
      t.vote("lawyer", "Litigate", "*");
      await t.advance(k);
    },

    async Day2(t, k) {
      if (t.branch === "wait") return waitDay2(t, k);
      if (t.branch === "shootFake") return lynchDay(t, k, "lawyer", 2);
    },

    async Night3(t, k) {
      t.vote("mafioso", "Mafia Kill", "v1");
      t.vote("lawyer", "Mafia Kill", "v1");
      t.vote("lawyer", "Litigate", "*");
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
          `Lesson: ${WAIT_LESSON} With one more day, the real Cop's next report and the fake Cop's slip-ups would have shown you who to shoot.`,
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
  t.guide("The Mafia is pushing the town onto Dolly. Without the Cop, the town can't tell who's lying. Just watch this one.");
  for (const key of ["janitor", "lawyer", "mafioso", "journalist", "v3"]) t.vote(key, "Village", "v1");
  await t.advance(k);
}

async function waitDay1(t, k) {
  t.guide(`You held your shot. ${WAIT_LESSON} Let's see what tomorrow brings.`);
  await t.chat("Village", [
    ["v1", "No clear answer today. Let's sleep on it."],
    ["v3", "Fine. Both Cops, make your checks count tonight."],
  ], k);
  for (const key of ["cop", "journalist", "v1", "v3", "janitor", "lawyer", "mafioso"])
    t.vote(key, "Village", "*");
  await t.advance(k);
}

async function waitDay2(t, k) {
  await t.chat("Village", [
    ["cop", "Checked Flint last night: GUILTY. Silas yesterday, Flint today. Both Mafia."],
    ["janitor", "I checked, uh... Hattie. Innocent."],
    ["v1", "Boone, Hattie died LAST NIGHT. You checked a dead woman?"],
    ["journalist", "I'm the Journalist: I get the Cop's reports. Last night I received a report on Flint: guilty. Nothing on Hattie."],
    ["janitor", "I... meant before. Yesterday."],
  ], k);
  t.guide(`New information! ${t.nameOf("janitor")} claims he checked Hattie, but Hattie was killed last night. That's a slip-up.`);
  t.guide(`${t.nameOf("journalist")}, the Journalist, sees the real Cop's reports, and confirms ${t.nameOf("cop")} checked Flint. So ${t.nameOf("cop")} is the real Cop and ${t.nameOf("janitor")} is the fake.`);
  await t.expectVote("Shoot Gun", "janitor", {
    token: k,
    text: `Now you know who's lying. Shoot the fake Cop: in the Shoot Gun box, click ${t.nameOf("janitor")}.`,
    wrong: () => {
      t.say("v1", "Village", "Don't you DARE shoot Cassidy, she's been right twice!").catch(() => {});
      t.guide(`${t.nameOf("cop")} is proven by the Journalist. Shoot ${t.nameOf("janitor")}, the fake Cop.`);
    },
  });
  await t.wait(t.timing.beat, k);
  t.guide(`${t.nameOf("janitor")} was the Janitor, Mafia. Waiting paid off: you shot with proof instead of a guess.`);
  await lynchVote(t, k, "lawyer");
}

async function lynchVote(t, k, target) {
  await t.expectVote("Village", target, {
    token: k,
    text: `The Cop said ${t.nameOf(target)} is guilty. In the Village box, vote ${t.nameOf(target)} to lynch them.`,
    wrongReactions: [
      ["v1", `Sheriff?! The Cop literally said ${t.nameOf(target)}. Why vote someone else?`],
      ["cop", "Trust the report, {name}. That vote makes you look bad."],
    ],
  });
  for (const key of ["cop", "journalist", "v1", "v2", "v3"]) t.vote(key, "Village", target);
  await t.advance(k);
}

async function lynchDay(t, k, target, day) {
  await t.chat("Village", [
    ["cop", day === 2 ? "Checked Flint last night: GUILTY." : "Only Silas left. He's the last one."],
  ], k);
  await lynchVote(t, k, target);
}
