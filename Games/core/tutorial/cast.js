// Tutorial bot cast. Roles are fixed per seat. The eight live ultimafia.com
// players (snapshotted avatars + nameColor + textColor) always fill the eight
// bot seats; the ninth seat is the human playing the tutorial. Nothing loads
// from live at runtime. Profiles fetched 2026-10-15.
//
// Pinned when those seats are bots (Sheriff tutorial needs this):
//   Cop → Z,  Janitor → Gauss. Remaining roster fills the other bot seats.

const ROLES = {
  cop: "Cop",
  journalist: "Journalist",
  sheriff: "Sheriff",
  v1: "Villager",
  v2: "Villager",
  v3: "Villager",
  janitor: "Janitor",
  lawyer: "Lawyer:Loyal",
  mafioso: "Mafioso",
};

const SEAT_ORDER = [
  "cop",
  "journalist",
  "sheriff",
  "v1",
  "v2",
  "v3",
  "janitor",
  "lawyer",
  "mafioso",
];

const ROSTER = [
  {
    name: "Z",
    nameColor: "#dc686a",
    textColor: "#21d6e1",
    avatar: "/images/tutorial-bots/Z.webp",
    sourceUserId: "Fy2Ee8BH9",
    flexAssets: true, // :ez: :clap: emotes and the Jerry sticker
  },
  {
    name: "nia",
    nameColor: "#b4d660",
    textColor: "#cbeaa3",
    avatar: "/images/tutorial-bots/nia.webp",
    sourceUserId: "adMXgBFAy",
  },
  {
    name: "Birbtales",
    nameColor: "#889caa",
    textColor: "#889caa",
    avatar: "/images/tutorial-bots/Birbtales.webp",
    sourceUserId: "CCI9SpAps",
  },
  {
    name: "Golbolco",
    nameColor: "#ff8c00",
    textColor: "#ff8c00",
    avatar: "/images/tutorial-bots/Golbolco.webp",
    sourceUserId: "30042g6fX",
  },
  {
    name: "Aspect8445",
    nameColor: "#c6c5ff",
    textColor: "#9b92ff",
    avatar: "/images/tutorial-bots/Aspect8445.webp",
    sourceUserId: "PW4_CkR84",
  },
  {
    name: "Gauss",
    nameColor: null,
    textColor: null,
    avatar: "/images/tutorial-bots/Gauss.webp",
    sourceUserId: "p_cyEEDPi",
  },
  {
    name: "sure",
    nameColor: "#e2c180",
    textColor: "#e6cba3",
    avatar: "/images/tutorial-bots/sure.webp",
    sourceUserId: "eFUCUv776",
  },
  {
    name: "Giga13",
    nameColor: "#ff0000",
    textColor: "#a40000",
    avatar: "/images/tutorial-bots/Giga13.webp",
    sourceUserId: "R-AxKamIn",
  },
];

const BY_NAME = Object.fromEntries(ROSTER.map((r) => [r.name, r]));

// Prefer these identities on these seats when the seat is a bot.
const PINNED = { cop: "Z", janitor: "Gauss" };

function buildCast(humanSeat) {
  if (!humanSeat || !ROLES[humanSeat])
    throw new Error("buildCast requires the tutorial human seat.");
  const cast = {};
  const used = new Set();

  for (const key of SEAT_ORDER) {
    const role = ROLES[key];
    if (key === humanSeat) {
      cast[key] = { key, role, name: null };
      continue;
    }
    const pin = PINNED[key];
    if (pin && BY_NAME[pin] && !used.has(pin)) {
      cast[key] = Object.assign({ key, role }, BY_NAME[pin]);
      used.add(pin);
    }
  }

  let i = 0;
  for (const key of SEAT_ORDER) {
    if (cast[key]) continue;
    while (i < ROSTER.length && used.has(ROSTER[i].name)) i++;
    if (i >= ROSTER.length) throw new Error("Roster exhausted.");
    cast[key] = Object.assign({ key, role: ROLES[key] }, ROSTER[i]);
    used.add(ROSTER[i].name);
    i++;
  }

  if (used.size !== ROSTER.length)
    throw new Error(`Expected 8 bots, got ${used.size}.`);
  return cast;
}

const CAST = {};
for (const key of SEAT_ORDER) CAST[key] = { role: ROLES[key] };

module.exports = {
  ROLES,
  ROSTER,
  SEAT_ORDER,
  PINNED,
  buildCast,
  CAST,
};
