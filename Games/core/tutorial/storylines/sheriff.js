// SHERIFF: Z is always the real Cop; Gauss is the Janitor fake-claiming Cop.
// Shoot Gauss → Z flexes (EZ Clap, Jerry sticker, LMAO!). Shoot the Lawyer Z
// reported guilty → the flip proves Z and the town condemns Gauss. Hold the
// shot and the condemn flip proves Z. If Z survives Day 1, Mafia kills Z Night 2 and the
// Journalist (who was on Z) shares Z's final guilty.

const WAIT_LESSON = "As Sheriff, waiting to gather info can be better than shooting early.";
const GUN_HINT =
  "Still looking? Your gun is an item: open your Inventory (in the Actions tab on a phone, on the right on a computer), click the gun, then pick the player in Shoot Gun. To vote instead, use the Village box.";

function night(t, victim, { check, journalistOn } = {}) {
  for (const key of ["mafioso", "lawyer", "janitor"]) {
    if (t.player(key) && t.player(key).alive) t.vote(key, "Mafia Kill", victim);
  }
  if (t.player("janitor") && t.player("janitor").alive) t.vote("janitor", "Clean Death", "No");
  if (t.player("lawyer") && t.player("lawyer").alive) t.vote("lawyer", "Litigate", "*");
  if (check && t.player("cop") && t.player("cop").alive) t.vote("cop", "Investigate", check);
  if (journalistOn && t.player("journalist") && t.player("journalist").alive)
    t.vote("journalist", "Receive Reports", journalistOn);
}

module.exports = {
  id: "sheriff",
  title: "Sheriff",
  roleName: "Sheriff",
  userSeat: "sheriff",
  blurb: "Two Cop claims, one gun. Shoot now, or wait for more information?",
  available: true,
  freeVote: (t, meeting) => meeting.name === "Village" && t.data.freeCondemn,
  intro:
    "Welcome to the tutorial! You are the Sheriff, on the town side. You have a gun that can kill one player during the day. Nobody's role is known yet. It's Night 1.",

  states: {
    async Night1(t, k) {
      // Real Cop (Z) finds the Lawyer. Fake Cop (Gauss) will claim a Villager.
      // Journalist sits on the Cop so they can carry Z's final report if Z dies N2.
      night(t, "v2", { check: "lawyer", journalistOn: "cop" });
      await t.advance(k, "You have nothing to do at night. When you've read this, click Continue to start Day 1.");
    },

    async Day1(t, k) {
      const copN = t.nameOf("cop");
      const janN = t.nameOf("janitor");
      const lawN = t.nameOf("lawyer");
      const vilN = t.nameOf("v1");
      await t.chat("Village", [
        ["v1", `${t.nameOf("v2")}'s dead. Power roles, anything?`],
        ["cop", `Cop here. I checked ${lawN} last night: ${lawN} is GUILTY.`],
        ["janitor", `No, I'M the Cop. I checked ${vilN}: GUILTY. ${copN} is lying to frame ${lawN}.`],
        ["mafioso", `Thank you, ${janN}. ${copN} is clearly fake.`],
        ["v3", "Two Cops?? One of them is Mafia."],
        ["journalist", "Sheriff, if you're out there... careful."],
      ], k);
      t.guide(`Two players claim Cop. ${copN} says ${lawN} (not the other Cop) is guilty. ${janN} says ${vilN} (also not the other Cop) is guilty. Only one can be the real Cop; the other is Mafia lying.`);
      t.guide("Right now it's one word against another. Nothing proves either claim yet.");
      const choice = await t.decide({
        token: k,
        text: `Your choice. Your gun is in your Inventory: click it to open Shoot Gun. Shoot one of the Cop claims (${copN} or ${janN}), or shoot ${lawN}, the player ${copN} reported guilty. OR hold your shot: vote ${lawN} in the Village box to test ${copN}'s claim with a condemn.`,
        idleHint: GUN_HINT,
        options: [
          { id: "shootFake", label: `Shoot ${janN}`, vote: { meeting: "Shoot Gun", target: "janitor" } },
          { id: "shootReal", label: `Shoot ${copN}`, vote: { meeting: "Shoot Gun", target: "cop" } },
          // Acting on the Cop's guilty is a real play: the Lawyer flips Mafia,
          // which proves the Cop and exposes the fake claim.
          { id: "shootGuilty", label: `Shoot ${lawN}`, vote: { meeting: "Shoot Gun", target: "lawyer" } },
          { id: "wait", vote: { meeting: "Village", target: "lawyer" } },
          {
            id: "shootRandom",
            vote: { meeting: "Shoot Gun", target: "*other" },
            bad: {
              consequence: async (t, k) => {
                await t.wait(t.timing.beat, k);
                const shot = t.lastShot();
                t.data.shotRole = shot ? shot.role : "Villager";
                t.data.shotName = shot ? shot.name : "them";
                const mafia = /Mafioso|Lawyer|Janitor/.test(t.data.shotRole);
                await t.chat("Village", mafia
                  ? [
                      ["v3", `${t.data.shotName} flipped ${t.data.shotRole}?! Lucky shot... but on what evidence?`],
                      ["cop", "We still don't know which Cop claim is real."],
                    ]
                  : [
                      ["v3", `${t.data.shotName} was a ${t.data.shotRole.toUpperCase()}! Why would you shoot them?!`],
                      ["janitor", "Wow. Our Sheriff just wasted the only gun in town."],
                    ], k);
              },
              fatal: true,
              lesson:
                "Never shoot without a reason: in Frontier Justice the Sheriff's shot belongs on a Cop counterclaim or a confirmed guilty, not on a quiet player. Even when a blind shot hits Mafia it's luck, and your only bullet is gone while two Cop claims are still unresolved.",
            },
          },
        ],
      });
      t.branch = choice;
      if (choice === "wait") return waitDay1(t, k);
      if (choice === "shootReal") return shootRealDay1(t, k);
      if (choice === "shootGuilty") return shootGuiltyDay1(t, k);
      return shootFakeDay1(t, k);
    },

    async Night2(t, k) {
      if (t.branch === "shootReal") {
        // Cop already dead; Mafia just kills down numbers.
        night(t, "journalist");
      } else if (t.player("cop") && t.player("cop").alive) {
        // Z survived Day 1 → Mafia kills Z. Cop's last check is mafioso;
        // Journalist (still on Z) will carry that report tomorrow.
        t.data.copDiedN2 = true;
        night(t, "cop", { check: "mafioso", journalistOn: "cop" });
      } else {
        night(t, "v3", { check: "mafioso" });
      }
      await t.advance(k, "Night passes. Click Continue to start the next day.");
    },

    async Day2(t, k) {
      if (t.branch === "wait") return waitDay2(t, k);
      if (t.branch === "shootFake" || t.branch === "shootGuilty") {
        if (t.data.copDiedN2) return afterCopDiedDay2(t, k, "mafioso");
        return condemnDay(t, k, "mafioso", 2);
      }
    },

    async Night3(t, k) {
      night(t, "v1");
      await t.advance(k);
    },

    async Day3(t, k) {
      return condemnDay(t, k, "mafioso", 3);
    },
  },

  epilogue: (t) =>
    t.branch === "shootReal"
      ? [
          "The Mafia won. You shot the real Cop, so the town lost its best information and the Mafia took over.",
          `Lesson: ${WAIT_LESSON} With one more day, the condemn flip and the real Cop's next report would have shown you who to shoot.`,
        ]
      : t.branch === "shootGuilty"
      ? [
          "The town won! You shot on the Cop's guilty: the Lawyer flip proved the real Cop and exposed the fake Cop claim, and the town condemned them.",
          `A guilty from a Cop claim is a fair reason to shoot, though you were still trusting one claim over another. ${WAIT_LESSON}`,
        ]
      : t.branch === "wait"
      ? [
          "The town won! Waiting a day gave you the proof you needed.",
          `Lesson: ${WAIT_LESSON} And when the Cop died Night 2, the Journalist who had been reading them still had the last report — that's how town kept the info alive.`,
        ]
      : [
          "The town won! You read the fake Cop correctly.",
          `But that was a 50/50 guess. ${WAIT_LESSON} Try the tutorial again and hold your shot to see the difference.`,
        ],
};

async function shootFakeDay1(t, k) {
  await t.wait(t.timing.beat, k);
  const role = t.constructor.CAST.janitor.role;
  // Z flexes on Gauss getting shot.
  await t.ezClapFlex(k);
  t.guide(`${t.nameOf("janitor")} flipped ${role}, Mafia! The real Cop is ${t.nameOf("cop")}, so their report on ${t.nameOf("lawyer")} is true.`);
  await t.chat("Village", [
    ["v1", `${t.nameOf("janitor")} was Mafia! ${t.nameOf("cop")}'s the real deal.`],
    ["cop", `Told you. ${t.nameOf("lawyer")} is guilty.`],
    ["lawyer", "This is a setup!"],
  ], k);
  await condemnVote(t, k, "lawyer");
}

async function shootGuiltyDay1(t, k) {
  await t.wait(t.timing.beat, k);
  const lawRole = t.constructor.CAST.lawyer.role.split(":")[0];
  const copN = t.nameOf("cop");
  const janN = t.nameOf("janitor");
  t.guide(`${t.nameOf("lawyer")} flipped ${lawRole}, Mafia! ${copN}'s report was true, so ${copN} is the real Cop and ${janN} lied about being the Cop.`);
  await t.chat("Village", [
    ["v1", `${t.nameOf("lawyer")} was Mafia! ${copN}'s the real Cop.`],
    ["cop", `Told you. Which makes ${janN} the fake Cop.`],
    ["janitor", "Hold on, I can explain..."],
    ["v3", `Explain to the noose. ${janN}.`],
  ], k);
  await condemnVote(t, k, "janitor", `${janN} fake-claimed Cop, so they're Mafia. Vote ${janN} in the Village box.`);
}

async function shootRealDay1(t, k) {
  await t.wait(t.timing.beat, k);
  const role = t.constructor.CAST.cop.role;
  t.guide(`${t.nameOf("cop")} flipped ${role} — the real Cop. That means ${t.nameOf("janitor")} lied, but the town just lost its investigator.`);
  await t.chat("Village", [
    ["v3", `${t.nameOf("cop")} was the REAL Cop?! Sheriff, what did you do...`],
    ["janitor", `Okay, I was wrong about them. Anyway, ${t.nameOf("v1")}'s been weird all day.`],
    ["lawyer", `Yeah, ${t.nameOf("v1")}. Let's go.`],
    ["mafioso", t.nameOf("v1")],
  ], k);
  t.guide("The Mafia is pushing the town onto a Villager. Without the Cop, the town can't tell who's lying. Vote however you like and watch.");
  t.data.freeCondemn = true;
  await t.everyoneVotes("v1", k, "Village", {
    dissenters: { v1: "mafioso" },
  });
  await t.advance(k, "Click Continue to end the day.");
}

async function waitDay1(t, k) {
  t.guide("You held your shot. The town still condemns today; the result is new information.");
  await t.chat("Village", [
    ["v1", `Sheriff's not shooting yet. Then let's condemn ${t.nameOf("lawyer")} and see what flips.`],
    ["journalist", `Agreed. If ${t.nameOf("lawyer")} flips Mafia, ${t.nameOf("cop")} is real.`],
    ["janitor", `Fine, but when ${t.nameOf("lawyer")} flips town, ${t.nameOf("cop")}'s next.`],
  ], k);
  await t.everyoneVotes("lawyer", k);
  await t.advance(k);
}

async function waitDay2(t, k) {
  const lawRole = t.constructor.CAST.lawyer.role;
  if (t.data.copDiedN2) {
    await t.chat("Village", [
      ["v1", `${t.nameOf("lawyer")} flipped ${lawRole.toUpperCase()}. ${t.nameOf("cop")} was telling the truth — and now ${t.nameOf("cop")} is dead too.`],
      ["journalist", `I'm the Journalist: I was reading ${t.nameOf("cop")}. Their last check was ${t.nameOf("mafioso")}: GUILTY.`],
      ["janitor", `Convenient that the 'Journalist' shows up after the Cop is gone...`],
      ["v1", `${t.nameOf("lawyer")} flipped Mafia, the one you defended. And ${t.nameOf("journalist")} has the Cop's last report.`],
    ], k);
    t.guide(
      `New information! ${t.nameOf("lawyer")} flipped ${lawRole}, which proves ${t.nameOf("cop")}'s Day 1 result. Mafia killed ${t.nameOf("cop")} last night — but ${t.nameOf("journalist")} was reading them and still has the final guilty on ${t.nameOf("mafioso")}.`
    );
  } else {
    await t.chat("Village", [
      ["v1", `${t.nameOf("lawyer")} flipped ${lawRole.toUpperCase()}. ${t.nameOf("cop")} was telling the truth.`],
      ["cop", `Checked ${t.nameOf("mafioso")} last night: GUILTY.`],
      ["janitor", `I checked, uh... ${t.nameOf("v3")}. Innocent.`],
      ["v1", `${t.nameOf("janitor")}, ${t.nameOf("v3")} died LAST NIGHT. And ${t.nameOf("lawyer")} flipped Mafia, the one you defended.`],
      ["journalist", `I'm the Journalist: I get the Cop's reports. Last night I received a report on ${t.nameOf("mafioso")}: guilty.`],
    ], k);
    t.guide(`New information! ${t.nameOf("lawyer")} flipped ${lawRole}, which proves ${t.nameOf("cop")}'s Day 1 result.`);
  }
  t.guide(`${t.nameOf("journalist")} confirms the Cop's line. ${t.nameOf("cop")} was the real Cop and ${t.nameOf("janitor")} is the fake.`);
  const shootOpts = [
    { id: "go", label: `Shoot ${t.nameOf("janitor")}`, vote: { meeting: "Shoot Gun", target: "janitor" } },
  ];
  // Only offer shooting the Cop if they're still alive (Z died N2 on the usual path).
  if (t.player("cop") && t.player("cop").alive) {
    shootOpts.push({
      id: "shootCop",
      label: `Shoot ${t.nameOf("cop")}`,
      vote: { meeting: "Shoot Gun", target: "cop" },
      bad: {
        consequence: async (t, k) => {
          await t.wait(t.timing.beat, k);
          await t.say("v1", "Village", "They were the REAL Cop, proven twice! What have you done?", k);
        },
        fatal: true,
        lesson: `${t.nameOf("cop")} was proven by the ${t.nameOf("lawyer")} flip and the Journalist. Shooting against the evidence hands the game to the Mafia. When you wait for information, use it.`,
      },
    });
  }
  await t.decide({
    token: k,
    text: `Now you know who's lying. Shoot the fake Cop: open your gun in your Inventory and pick ${t.nameOf("janitor")} in Shoot Gun.`,
    idleHint: GUN_HINT,
    options: shootOpts,
    wrong: () => {
      t.say("v1", "Village", `Don't you DARE shoot anyone but the fake Cop!`).catch(() => {});
      t.guide(`Shoot ${t.nameOf("janitor")}, the fake Cop.`);
    },
  });
  await t.wait(t.timing.beat, k);
  const janRole = t.constructor.CAST.janitor.role;
  t.guide(`${t.nameOf("janitor")} flipped ${janRole}, Mafia. ${WAIT_LESSON} You shot with proof instead of a guess.`);
  await condemnVote(t, k, "mafioso");
}

// Shoot-fake path after Mafia killed Z Night 2: Journalist carries the last guilty.
async function afterCopDiedDay2(t, k, target) {
  await t.chat("Village", [
    ["v1", `Our Cop (${t.nameOf("cop")}) is dead!`],
    ["journalist", `I'm the Journalist — I was on ${t.nameOf("cop")}. Their last check: ${t.nameOf(target)} GUILTY.`],
    ["v3", "Trust the Journalist. Finish it."],
  ], k);
  t.guide(
    `Mafia killed ${t.nameOf("cop")} last night. ${t.nameOf("journalist")} was reading them and still has the final report: ${t.nameOf(target)} is guilty.`
  );
  await condemnVote(t, k, target, `Vote ${t.nameOf(target)} — the Cop's last guilty, carried by the Journalist.`);
}

async function condemnVote(t, k, target, text, fast = true) {
  await t.expectVote("Village", target, {
    token: k,
    label: `Vote ${t.nameOf(target)}`,
    text: text || `The Cop said ${t.nameOf(target)} is guilty. Vote ${t.nameOf(target)} in the Village box.`,
    also: [
      {
        id: "noCondemn",
        label: "Vote No one",
        vote: { meeting: "Village", target: "*" },
        bad: {
          reactions: [["cop", "No condemn while we have a guilty? Come on, Sheriff."]],
          lesson: "With the Sheriff alive the town almost never skips a condemn: every condemn flips a role and gives information. Vote the guilty.",
        },
      },
    ],
    wrongReactions: [
      ["v1", `Sheriff?! The Cop literally said ${t.nameOf(target)}. Why vote someone else?`],
      ["journalist", "Trust the report, {name}. That vote makes you look bad."],
    ],
  });
  await t.everyoneVotes(target, k, "Village", { fast });
  await t.advance(k);
}

async function condemnDay(t, k, target, day) {
  await t.chat("Village", [
    ["cop", day === 2 ? `Checked ${t.nameOf("mafioso")} last night: GUILTY.` : `Only ${t.nameOf(target)} left.`],
  ], k);
  await condemnVote(t, k, target);
}
