// Tutorial bot cast: seats map to snapshotted live ultimafia.com players
// (avatars + nameColor + textColor). Nothing loads from live at runtime.
// Profiles fetched 2026-10-15 from /api/user/<id>/profile.
// Nine seats need unique names; eight come from Vinman's list and the ninth
// villager (v2 / Eli) stays a plain Frontier name without a live avatar.

const CAST = {
  cop: {
    name: "Aspect8445",
    role: "Cop",
    nameColor: "#c6c5ff",
    textColor: "#9b92ff",
    avatar: "/images/tutorial-bots/Aspect8445.webp",
    sourceUserId: "PW4_CkR84",
  },
  journalist: {
    name: "Gauss",
    role: "Journalist",
    nameColor: null,
    textColor: null,
    avatar: "/images/tutorial-bots/Gauss.webp",
    sourceUserId: "p_cyEEDPi",
  },
  sheriff: {
    name: "Giga13",
    role: "Sheriff",
    nameColor: "#ff0000",
    textColor: "#a40000",
    avatar: "/images/tutorial-bots/Giga13.webp",
    sourceUserId: "R-AxKamIn",
  },
  v1: {
    name: "Z",
    role: "Villager",
    nameColor: "#dc686a",
    textColor: "#21d6e1",
    avatar: "/images/tutorial-bots/Z.webp",
    sourceUserId: "Fy2Ee8BH9",
  },
  v2: {
    name: "Eli",
    role: "Villager",
    nameColor: null,
    textColor: null,
    avatar: null,
    sourceUserId: null,
  },
  v3: {
    name: "sure",
    role: "Villager",
    nameColor: "#e2c180",
    textColor: "#e6cba3",
    avatar: "/images/tutorial-bots/sure.webp",
    sourceUserId: "eFUCUv776",
  },
  janitor: {
    name: "Golbolco",
    role: "Janitor",
    nameColor: "#ff8c00",
    textColor: "#ff8c00",
    avatar: "/images/tutorial-bots/Golbolco.webp",
    sourceUserId: "30042g6fX",
  },
  lawyer: {
    name: "Birbtales",
    role: "Lawyer:Loyal",
    nameColor: "#889caa",
    textColor: "#889caa",
    avatar: "/images/tutorial-bots/Birbtales.webp",
    sourceUserId: "CCI9SpAps",
  },
  mafioso: {
    name: "nia",
    role: "Mafioso",
    nameColor: "#b4d660",
    textColor: "#cbeaa3",
    avatar: "/images/tutorial-bots/nia.webp",
    sourceUserId: "adMXgBFAy",
  },
};

module.exports = CAST;
