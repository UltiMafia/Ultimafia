// Tutorial bot cast. Roles are fixed per seat. The eight live ultimafia.com
// players (snapshotted avatars + nameColor + textColor) always fill the eight
// bot seats; the ninth seat is the human playing the tutorial. Nothing loads
// from live at runtime. Profiles fetched 2026-10-15.

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

// Vinman's eight live players. Always used as the eight bots.
const ROSTER = [
  {
    name: "Z",
    nameColor: "#dc686a",
    textColor: "#21d6e1",
    avatar: "/images/tutorial-bots/Z.webp",
    sourceUserId: "Fy2Ee8BH9",
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

// Assign every roster entry to a bot seat. The human seat keeps only its role
// (the human's own name/avatar/colors are used in-game).
function buildCast(humanSeat) {
  if (!humanSeat || !ROLES[humanSeat])
    throw new Error("buildCast requires the tutorial human seat.");
  const cast = {};
  let i = 0;
  for (const key of SEAT_ORDER) {
    const role = ROLES[key];
    if (key === humanSeat) {
      cast[key] = { key, role, name: null };
      continue;
    }
    if (i >= ROSTER.length)
      throw new Error("Roster exhausted: expected exactly 8 bots.");
    cast[key] = Object.assign({ key, role }, ROSTER[i++]);
  }
  if (i !== ROSTER.length)
    throw new Error(`Expected 8 bots, assigned ${i}.`);
  return cast;
}

// Role-only view for storylines that read CAST[seat].role (names come from
// the per-game cast via nameOf).
const CAST = {};
for (const key of SEAT_ORDER) CAST[key] = { role: ROLES[key] };

module.exports = {
  ROLES,
  ROSTER,
  SEAT_ORDER,
  buildCast,
  CAST,
};
