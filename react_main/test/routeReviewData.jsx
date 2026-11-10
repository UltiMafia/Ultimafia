// Explicit synthetic contracts for production route components. No live data.
import { violationDefinitions } from "../../data/violations";
import fullMafiaRoles from "./routeReviewRoles.json";
export const fixtureTime = Date.UTC(2026, 10, 8, 16);
export const people = ["NightOwl", "Juniper", "Moth", "Rook", "Velvet", "Sol"].map((name, i) => ({
  id: `fixture-person-${i}`, name, avatar: i === 1, groups: [],
  settings: {}, joined: fixtureTime - 86400000 * 400, status: "online",
}));
const roleRecords = Object.entries(fullMafiaRoles).map(([name, role]) => ({ name, ...role }));
export const rolesRaw = { Mafia: Object.fromEntries(roleRecords.map(role => [role.name, role])) };
export const modifiers = { Mafia: [
  { name: "Armed", description: "Start with [X] gun.", tags: [], category: "Items", allowDuplicate: true, maxCount: 3 },
  { name: "Bulletproof", description: "Survive [X] attempt on your life.", tags: [], category: "Protection", allowDuplicate: true, maxCount: 3 },
] };
export const setups = ["Classic", "Follow the visits", "A small town", "Night investigation", "Open discussion"].map((name, i) => ({
  id: `fixture-setup-${i}`, name, gameType: "Mafia", total: 7 + i, closed: false,
  roles: [{ "Villager:": 3 + i, "Cop:": 1, "Doctor:": 1, "Mafioso:": 2 }],
  count: { Village: 5 + i, Mafia: 2 }, gameSettings: {}, creator: i === 1 ? people[0] : people[1],
  ranked: i === 0, competitive: false, vote: 0, voteCount: 17 - i, favorites: 12,
  playedCount: 124 + i, played: 124 + i, useRoleGroups: false, roleGroupSizes: [7 + i],
  version: 1, setupVersion: { timestamp: fixtureTime - 86400000 * 10, played: 124, changelog: "[]" },
  description: "A familiar open setup for practicing claims, investigation results, and voting.\n\nDiscuss before choosing a target.",
  stats: null, createDate: fixtureTime - 86400000 * 30,
}));

// Same list contract as routes/game.js and the existing homepage fixture. All
// writes/join operations remain blocked; these are not live available seats.
const lobbyGames = [
  { id: "fixture-game-open", status: "Open", players: 4 },
  { id: "fixture-game-full", status: "Open", players: 7, ranked: true },
  { id: "fixture-game-live", status: "In Progress", players: 7, competitive: true, gameState: "Day 2" },
  { id: "fixture-game-finished", status: "Finished", players: 7, endTime: fixtureTime - 900000 },
].map((game, index) => ({ lobby: "Main", lobbyName: `${people[index].name}'s lobby`, spectating: true,
  spectatorCount: 2, setup: { ...setups[0] }, ...game }));
const lobbyPoll = { id: "fixture-poll", question: "Which setup would you like to play?", lobby: "Main",
  options: ["Classic", "Follow the visits"], voteCounts: [7, 4], completed: false,
  created: fixtureTime - 86400000, expiresAt: fixtureTime + 86400000, userVote: null };

const fixtureGranular = {
  alignment: [{ key: "Village", winRate: 0.57, totalGames: 63 }, { key: "Mafia", winRate: 0.43, totalGames: 63 }],
  role: [{ key: "Cop", winRate: 0.61, totalGames: 31 }, { key: "Mafioso", winRate: 0.39, totalGames: 32 }],
  averageLengthMs: 720000,
};
setups[0].stats = { hasGranular: true, totalVegs: 3, granular: { all: fixtureGranular, ranked: fixtureGranular, unranked: fixtureGranular, competitive: fixtureGranular } };

const manyRoleSet = Object.fromEntries(Object.keys(fullMafiaRoles).slice(0, 120).map(name => [`${name}:`, 1]));
export const manyRoleSetup = {
  ...setups[0], id: "fixture-setup-many", name: "Many roles", total: 120,
  roles: [manyRoleSet], roleGroupSizes: [120], count: { Village: 0, Mafia: 0 },
};

export const words = "apple river mountain forest lantern compass island garden thunder library bridge meadow winter harbor orchard silver willow castle feather planet summer ocean bicycle marble".split(" ");
const deckProfiles = people.map((person, i) => ({ id: `fixture-card-${i}`, name: person.name,
  avatar: i % 2 ? "/fixture-person-1_avatar.webp" : "", color: "#719db5", deck: "fixture-deck-0", deathMessage: "", }));
const decks = ["Harbor residents", "Library visitors", "Forest travelers"].map((name, i) => ({
  id: `fixture-deck-${i}`, name, creator: people[1], profileCount: 12 + i * 4,
  profiles: deckProfiles, profilePreviews: deckProfiles.slice(0, 4), vote: 0, voteCount: 8 + i,
  coverPhoto: i === 0 ? "/fixture-cover.svg" : "", featured: true,
}));
const wordDecks = ["Everyday words", "Nature and places", "Things in a house"].map((name, i) => ({
  id: `fixture-word-${i}`, name, description: "Common words suitable for a shared guessing game.",
  words, wordCount: words.length, wordPreview: words.slice(i, i + 5), creator: people[1],
  coverPhoto: i === 1 ? "/fixture-cover.svg" : "", isDefault: false,
}));
const statsBucket = { totalGames: 63, wins: { count: 36, total: 63 },
  abandons: { count: 0, total: 63 }, bySetup: {}, byRole: {}, byAlignment: {} };
export function profile(id) {
  const minimal = id === "fixture-minimal";
  const person = minimal ? { id, name: "NewPlayer", avatar: false } : id === "fixture-default" ? { id, name: "ArianeSachi62", avatar: false } : { ...(people.find(person => person.id === id) || people[1]), id };
  return {
    ...person, banner: !minimal, bannerExt: "svg", profileBackground: false,
    settings: { disableMediaAutoplay: true, autoplay: false, collapseMedia: true, avatarShape: "circle", profileColor: "#233b43", ...(id === "fixture-custom" ? { backgroundColor: "#203e47" } : {}) },
    bio: minimal ? "" : "## About me\nI enjoy open setups and comparing investigation results.\n\n- Usually available for a short game\n- Favorite roles: Cop and Doctor\n\nPlease keep game discussion in the game.\n\n[Read the rules](/policy/rules)",
    pronouns: minimal ? "" : "they/them", games: minimal ? [] : [
      { id: "fixture-finished", status: "Finished", type: "Mafia", players: 7, setup: setups[0], lobby: "Main", endTime: fixtureTime - 3600000, winners: ["Village"] },
    ], archivedGames: [], setups: minimal ? [] : setups.slice(0, 2), friends: [], friendRequests: [],
    maxGamesPage: 1, maxSetupsPage: 1, stats: minimal ? undefined : { Mafia: { all: statsBucket, ranked: statsBucket, unranked: statsBucket, competitive: statsBucket } },
    totalGames: minimal ? 0 : 63, kudos: minimal ? 0 : 42, points: minimal ? 0 : 135,
    pointsNegative: 0, championshipPoints: 0, karmaInfo: { vote: 0, voteCount: minimal ? 0 : 128 },
    karma: minimal ? 0 : 128, groups: [], love: {}, currentLove: {}, achievements: [],
    favoriteRoles: minimal ? [] : ["Mafia:Cop", "Mafia:Doctor"], roleIconCredits: [], trophies: [], stamps: [], hiddenStamps: [],
    joined: fixtureTime - 86400000 * (minimal ? 2 : 400), status: minimal ? "offline" : "online",
    lastActive: fixtureTime - 600000, inGame: id === "fixture-default" ? "fixture-game" : null, saved: false, isFriend: false, isFriendRequested: false,
    family: minimal ? null : { id: "fixture-family", name: "The Harbor", avatar: false },
  };
}
const replies = ["We should compare the claims before the next vote.", "Agreed. The order of night actions matters here.", "Thanks for the explanation; the role details helped."].map((content, i) => ({
  id: `fixture-reply-${i}`, author: people[(i + 2) % people.length], content,
  postDate: fixtureTime - (4 - i) * 3600000, vote: 0, voteCount: 3 - i, reactions: [],
}));
const threads = ["How do you organize your investigation notes?", "Weekly setup discussion", "New player questions", "Finding a good seven-player setup"].map((title, i) => ({
  id: `fixture-thread-${i}`, title, author: people[1 + i], content: "## Discussion\nWhat information do you keep track of during a game?\n\nI write down claims and votes by phase, then compare them with the night results.",
  postDate: fixtureTime - 86400000 * (i + 1), bumpDate: fixtureTime - 3600000,
  recentReplies: replies.slice(0, 2), viewCount: 245 - i * 20, replyCount: 12 + i,
  replies, board: { id: "fixture-board", name: "Mafia discussion" }, page: 1, pageCount: 1,
  vote: 0, voteCount: 8, pinned: false, locked: false, restricted: false, reactions: [],
  rosterUsers: [], tagPresets: [], mutedTags: [],
}));
const comments = replies.map((reply, i) => ({ ...reply, id: `fixture-comment-${i}`, date: reply.postDate, location: "fixture-person-1" }));
const rankingUsers = people.map((person, i) => ({ ...person, userId: person.id, username: person.name,
  rank: i + 1, skillTier: "Silver", skillRating: 34 - i, skillMu: 42 - i, skillSigma: 3,
  skillGamesPlayed: 120 - i * 5, trophies: [], kudos: 40 - i, karma: 100 - i, achievementsCount: 8, scrapbookCompletion: 12, trophyScore: 3,
  wins: 70 - i * 3, losses: 50 - i * 2,
}));
const standings = people.map((person, i) => ({ userId: person.id, ranking: i, points: 21 - i * 2, tiebreakerPoints: 150 - i * 10 }));
const competitiveUsers = Object.fromEntries(people.map((person, i) => [person.id, { user: person, points: 8 - i, gamesPlayed: 4, games: [] }]));
const round = { number: 2, currentDay: 3, startDate: fixtureTime - 86400000 * 3, dateCompleted: fixtureTime + 86400000 * 2, setups: [0, 1], games: [] };
const stocks = people.map((person, i) => ({ ...person, _id: `fixture-stock-${i}`, userId: person.id, username: person.name,
  buyPrice: 2.4 + i, sellPrice: 2.1 + i, marketCap: 120 + i * 40, treasuryCoins: 24,
  dividendsPaidOut: 8.5, shareSupply: 50, priceHistory: [1.8, 2.1, 1.9, 2.2, 2.4].map(price => price + i),
}));
export function makeUser(mode = "member") {
  const staff = mode === "staff" || mode === "owner";
  return {
    ...people[0], loggedIn: mode !== "guest", loaded: true, rank: mode === "owner" ? "Infinity" : staff ? 3 : 0,
    state: {}, settings: { disableSnowstorm: true, disableMediaAutoplay: true, roleSkins: "", siteColorScheme: "dark", minimumContrast: "none", fontSize: "16", fontFamily: "default" },
    perms: { createSetup: true, createThread: true, postReply: true, vote: true, playGame: true,
      playRanked: true, seeModPanel: staff, viewModActions: staff,
       whitelist: staff, approveGithubLinks: staff, giveGroup: staff,
      manageCompetitive: staff, unban: staff, devApi: mode === "developer" || mode === "owner" },
    itemsOwned: { customProfile: 1, textColors: 1, avatarShape: 1, wordDeck: 3, customEmotes: [], customStickers: [] },
    groups: mode === "owner" ? [{ name: "Owner", rank: "Infinity" }] : [], blockedUsers: [], redHearts: 12, goldHearts: 3, coins: 48.5, inGame: null,
    canPlayRanked: true, gamesPlayed: 63, autoContrastColor: color => color,
    dailyChallenges: ["Basic1:0:Mafia", "Advanced2:0:Cop"],
  };
}
export function makeSiteInfo(record) {
  return {
    cacheVal: 1, rolesRaw, roles: { Mafia: roleRecords }, modifiers,
    gamesettings: { Mafia: [{ name: "Day Start", description: "The game begins during the day.", tags: [], allowDuplicate: false }] },
    gameSettings: { Mafia: {} }, items: { Mafia: [] }, tags: { Mafia: [{ name: "Village" }, { name: "Deception" }] },
    learnGameDescriptionByType: { Mafia: [{ type: "paragraph", content: "Mafia is a social deduction game. The village discusses claims and votes during the day; the mafia meets at night." }] },
    achievements: {}, notifsBumpToken: 0,
    showAlert: (message, severity) => record("alert", { message: typeof message === "string" ? message : "React alert content", severity }),
    hideAllAlerts: () => {}, refreshNotifs: () => record("refreshNotifs", {}), clearCache: () => record("clearCache", {}),
  };
}

// Each supported read has an explicit contract. Unknown reads fail loudly in
// the browser report; there is no successful catch-all empty response.
export function readFixture(url, user) {
  const p = decodeURIComponent(url.pathname);
  if (p === "/api/game/list") return lobbyGames;
  if (p === "/api/game/openCounts") return { counts: { All: 2, Main: 2 }, hasOpen: true };
  if (p === "/api/game/mostPlayedRecently") return setups.slice(0, 3).map((setup, index) => ({ _id: setup.id, count: 20 - index * 5, percentage: (20 - index * 5) / 45, setupDetails: setup }));
  if (p === "/api/chat/connect") return ""; // No real chat socket is authorized by this read-only fixture.
  if (p.startsWith("/api/poll/list/")) return { currentPoll: lobbyPoll, activePolls: [lobbyPoll], polls: [] };
  if (p === "/api/stampTrades/open") return [{ id: "fixture-offer", initiator: people[1], initiatorRole: "Cop", initiatorGameType: "Mafia" }];
  if (p === "/api/stampTrades/recent") return [{ id: "fixture-trade", initiator: people[1], recipient: people[2], initiatorRole: "Cop", initiatorGameType: "Mafia", recipientRole: "Doctor", recipientGameType: "Mafia" }];
  if (p === "/api/notifs/unreadCount") return { count: 3 };
  if (p === "/api/mod/announcements") return [];
  if (p === "/api/site/violations") return violationDefinitions;
  if (p === "/api/user/info") return user;
  // Public identifiers and synthetic invoice records only. No client secrets,
  // tokens, wallet addresses or real payment/account data are supplied.
  if (p === "/api/dev/keys" || p === "/api/dev/owner/keys") return [
    { clientId: "fixture-client-1", name: "Local read-only statistics integration", userId: people[0].id, createdAt: fixtureTime - 86400000 * 20, expiresAt: fixtureTime + 86400000 * 30, lastUsedAt: fixtureTime - 3600000 },
    { clientId: "fixture-client-2", name: "Archived local integration", userId: people[1].id, createdAt: fixtureTime - 86400000 * 60, expiresAt: fixtureTime - 86400000 * 30, lastUsedAt: null, revokedAt: fixtureTime - 86400000 * 40 },
  ];
  if (p === "/api/crypto/admin/invoices") return { total: 6, pageSize: 50, invoices: ["unpaid", "pending", "expired", "completed", "rejected", "failed"].map((status, index) => ({ id: `fixture-invoice-${index}`, userId: people[index].id, userName: people[index].name, userAvatar: people[index].avatar, chain: "fixture-network", chainLabel: "Synthetic network", asset: "TEST", usd: 10 + index, expectedAmount: "1.000000", coins: 100 + index, status, createdAt: fixtureTime - 3600000 * index })) };
  if (/^\/api\/user\/[^/]+\/info$/.test(p)) return people.find(person => person.id === p.split("/")[3]) || { id: p.split("/")[3], name: "Unknown player", avatar: false };
  if (p === "/api/site/contributors" || p === "/api/site/donors") return people.map((person, i) => ({ ...person, types: i % 2 ? ["art", "design"] : ["code"], github: i % 2 ? null : { username: `fictional-${person.name.toLowerCase()}`, lines: 12345 }, bio: "I help maintain the site and enjoy discussing open setups." }));
  if (p === "/api/game/tutorial/storylines") return [{ id: "cop", role: "Cop", title: "Cop", available: true, blurb: "Investigate at night and compare your information with other players." }, { id: "sheriff", role: "Sheriff", title: "Sheriff", available: true, blurb: "Learn how day actions work in a guided game." }];
  if (/^\/api\/family\/fixture-family[^/]*\/profile$/.test(p)) {
    const leader = p.includes("leader");
    return { id: p.split('/')[3], name: "The Harbor and a longer family name", bio: "## About our family\nWe organize evening games and discuss setups.", founder: people[0], leader: people[0], avatar: false, banner: false, background: false,
      members: people.map((person, i) => ({ ...person, name: i === 5 ? "MeyeroffHudgens33" : person.name, role: i === 0 ? "leader" : i === 1 ? "officer" : "member", isFounder: i === 0, isLeader: i === 0 })),
      isLeader: leader, userRole: leader ? "leader" : null, canManageApplications: leader, applicationsOpen: true, hasPendingApplication: p.includes("pending"), joinFee: 2, treasury: 123.5, memberLimit: 20,
      perks: [{ key: "memberSlots", name: "More members", description: "Increase the family member limit.", cost: 10, price: 10, owned: true }, { key: "musicPlayer", name: "Music player", description: "Play music on the family page.", cost: 10, owned: false }], quests: [], trophies: [], hasMusicPlayer: false,
      stockInfo: { shareSupply: 50, sharesOwned: 0, buyPrice: 26.65, marketCap: 1250, dividendsPaidOut: 8, priceHistory: [10,12,15,20,25] } };
  }
  if (/^\/api\/family\/fixture-family[^/]*\/pendingInvite$/.test(p)) return { hasPendingInvite: false };
  if (/^\/api\/family\/fixture-family[^/]*\/ledger$/.test(p)) return { ledger: [{ id: "fixture-ledger-1", type: "deposit", description: "Family treasury deposit", amount: 20, user: people[0] }, { id: "fixture-ledger-2", type: "perk", description: "Family perk purchase", amount: 10, user: people[0] }], maxPage: 1 };
  if (/^\/api\/family\/fixture-family[^/]*\/applications$/.test(p)) return { applications: [{ id: "fixture-application", applicant: people[2], message: "I would like to discuss setups and join evening games.", joinFee: 2 }] };
  if (p === "/api/user/online" || p === "/api/user/newest") return people;
  if (p === "/api/user/searchName") return people.filter(person => person.name.toLowerCase().includes((url.searchParams.get("query") || "").toLowerCase()));
  if (p === "/api/family/discover") {
    const families = ["The Harbor", "A family with a longer descriptive name", "Night watch"].map((name, i) => ({
      id: `fixture-family-${i}`, name, avatar: false, leader: people[i], applicationsOpen: i !== 1,
      memberCount: 6 + i, memberLimit: 20, treasury: 42 + i, trophyCount: i, perkCount: 2,
      bioPreview: "We organize evening games and welcome players who enjoy discussing setups.",
    })).filter(family => family.name.toLowerCase().includes((url.searchParams.get("search") || "").toLowerCase()) && (url.searchParams.get("openOnly") !== "true" || family.applicationsOpen));
    return { families, total: families.length };
  }
  if (p === "/api/setup/search") {
    const query = (url.searchParams.get("query") || "").toLowerCase();
    const option = url.searchParams.get("option");
    const matches = setups.filter(setup => (setup.name + JSON.stringify(setup.roles)).toLowerCase().includes(query)
      && (option !== "Yours" || setup.creator.id === user.id)
      && (option !== "Ranked" || setup.ranked)
      && (option !== "Competitive" || setup.competitive)
      && (!url.searchParams.get("creatorId") || setup.creator.id === url.searchParams.get("creatorId"))
      && setup.total >= Number(url.searchParams.get("minSlots") || 1)
      && setup.total <= Number(url.searchParams.get("maxSlots") || 50));
    return { setups: matches, pages: matches.length ? 2 : 1 };
  }
  if (p === "/api/setup/fixture-setup-many") return { ...manyRoleSetup, roles: JSON.stringify(manyRoleSetup.roles) };
  if (p === "/api/setup/featuredSetup") return setups[0];
  if (p === "/api/setup/fixture-created") return { ...setups[0], id: "fixture-created", roles: JSON.stringify(setups[0].roles) };
  if (/^\/api\/setup\/fixture-setup-\d+$/.test(p)) return { ...setups[Number(p.split("-").at(-1)) || 0], roles: JSON.stringify(setups[0].roles) };
  if (/^\/api\/setup\/fixture-setup-\d+\/version\/\d+$/.test(p)) return { ...setups[0].setupVersion, manifest: JSON.stringify(setups[0].roles), stats: null };
  if (p.endsWith("/lineage")) return { copiedFrom: null, copiedTo: [] };
  if (p === "/api/strategy") return [{ id: "fixture-strategy", title: "Comparing claims with night results", content: "Keep a record by phase and compare claims before voting.", author: people[1], vote: 0, voteCount: 6, createdAt: fixtureTime - 86400000, updatedAt: fixtureTime - 3600000 }];
  if (p === "/api/deck/slots/info" || p === "/api/wordDeck/slots/info") return { owned: 1, purchased: 3 };
  if (/^\/api\/deck\/(featured|popular|yours|search|id)$/.test(p)) return { decks: decks.filter(deck => deck.name.toLowerCase().includes((url.searchParams.get("query") || "").toLowerCase())), pages: 1 };
  if (/^\/api\/wordDeck\/(featured|popular|yours|search|id)$/.test(p)) return { decks: wordDecks.filter(deck => deck.name.toLowerCase().includes((url.searchParams.get("query") || "").toLowerCase())), pages: 1 };
  if (p.startsWith("/api/deck/fixture-deck-")) return decks[Number(p.split("-").at(-1)) || 0];
  if (p.startsWith("/api/wordDeck/fixture-word-")) return wordDecks[Number(p.split("-").at(-1)) || 0];
  if (/^\/api\/user\/[^/]+\/profile$/.test(p)) return profile(p.split("/")[3]);
  if (/^\/api\/user\/[^/]+\/reports$/.test(p)) return { reports: [] };
  if (/^\/api\/user\/[^/]+\/friends$/.test(p)) return p.includes("fixture-minimal") ? [] : people.slice(2, 5);
  if (p === "/api/family/user/family") return { family: null };
  if (p === "/api/user/settings/data") return { ...user.settings, username: user.name, pronouns: "they/them", customEmotes: [], customStickers: [] };
  if (p === "/api/user/accounts") return [];
  if (p === "/api/user/account/auth") return { email: "fixture@example.invalid", providers: ["password"], emailVerified: true };
  if (p === "/api/user/github") return { username: "fictional-review-user", status: "pending" };
  if (p === "/api/user/me/favorite-roles") return ["Mafia:Cop"];
  if (p === "/api/site/contributors/art") return [];
  if (p.startsWith("/api/votes/role/")) return { vote: 0, voteCount: 14 };
  if (p === "/api/fanart") return [];
  if (p === "/api/comment") return { comments: url.searchParams.get("location") === "fixture-minimal" ? [] : comments, page: 1, maxPage: 1 };
  if (p === "/api/forums/categories") return [
    { id: "fixture-category", name: "Community", position: 0, boards: [
      { id: "fixture-board", name: "Mafia discussion", description: "Roles, setups, and learning from completed games.", position: 0, icon: "comments", newestThreads: threads.slice(0, 1), recentReplies: replies.map(reply => ({ ...reply, thread: threads[0] })) },
      { id: "fixture-board-2", name: "General discussion", description: "Meet other players and share ideas.", position: 1, icon: "comment", newestThreads: threads.slice(1, 2), recentReplies: replies.slice(0, 1).map(reply => ({ ...reply, thread: threads[1] })) },
    ] },
  ];
  if (p.startsWith("/api/forums/board/")) return { id: "fixture-board", name: "Mafia discussion", threads, pinnedThreads: [{ ...threads[1], pinned: true }], icon: "comments" };
  if (p.startsWith("/api/forums/thread/")) return threads[0];
  if (p.startsWith("/api/poll/thread/")) return null;
  if (p === "/api/shop/info") return { balance: 48.5, shopItems: [
    { key: "textColors", name: "Name and Text Colors", desc: "Set the colors of your name and text in games and chat.", price: 20, limit: 1, category: "game" },
    { key: "customNameFont", name: "Custom Name Font", desc: "Choose a custom font for your name in games.", price: 100, limit: 1, category: "game" },
    { key: "animatedNameColors", name: "Animated Name Colors", desc: "Animate the colors of your name in games.", price: 100, limit: 1, category: "game" },
    { key: "tricolorGradient", name: "Tricolor Animated Gradient", desc: "Use a three-color animated gradient on your name.", price: 250, limit: 1, category: "game" },
    { key: "customDeathMessage", name: "Custom Death Message", desc: "Set the message shown when you die.", price: 50, limit: 1, category: "game" },
    { key: "deathMessageChange", name: "Death Message Change", desc: "Change your custom death message again.", price: 25, limit: 1, category: "game" },
    { key: "customDeathSound", name: "Custom Death Sound", desc: "Upload a short sound played when you die.", price: 50, limit: 1, category: "game" },
    { key: "customProfile", name: "Profile Customization", desc: "Customize your profile colors and background.", price: 15, limit: 1, category: "profile" },
    { key: "animatedBanner", name: "Animated Profile Banner", desc: "Use an animated GIF or WebP as your profile banner.", price: 100, limit: 1, category: "profile" },
    { key: "animatedAvatar", name: "Animated Profile Picture", desc: "Use an animated GIF or WebP as your avatar.", price: 100, limit: 1, category: "profile" },
    { key: "profileBackground", name: "Profile Background", desc: "Set a custom background for your profile.", price: 150, limit: 1, category: "profile" },
    { key: "forumBanner", name: "Forum Banner", desc: "Show a banner beside your forum posts.", price: 100, limit: 1, category: "profile" },
    { key: "nameChange", name: "Name Change", desc: "Change your account name.", price: 50, limit: 1, category: "site" },
    { key: "username3", name: "3 Character Username", desc: "Shorten your username to three characters.", price: 100, limit: 1, category: "site" },
    { key: "username2", name: "2 Character Username", desc: "Shorten your username to two characters.", price: 200, limit: 1, category: "site" },
    { key: "username1", name: "1 Character Username", desc: "Shorten your username to one character.", price: 500, limit: 1, category: "site" },
    { key: "vanityUrl", name: "Vanity URL", desc: "Set a custom URL for your profile.", price: 100, limit: 1, category: "site" },
    { key: "customPrimaryColor", name: "Custom Site Primary Color", desc: "Choose the site accent color you see.", price: 100, limit: 1, category: "site" },
    { key: "iconFilter", name: "Icon Filter", desc: "Apply a custom filter to site icons.", price: 50, limit: 1, category: "site" },
    { key: "archivedGames", name: "Archived Games", desc: "Keep finished games in your archive.", price: 50, limit: 1, category: "site" },
    { key: "maxArchivedGames", name: "Maximum Archived Games", desc: "Increase the number of games you can archive.", price: 25, limit: 5, category: "site" },
    { key: "createFamily", name: "Create Family", desc: "Create your own family.", price: 500, limit: 1, category: "site" },
    { key: "stamp", name: "Scrapbook Stamp", desc: "Add a stamp to your scrapbook.", price: 10, limit: 10, category: "site" },
    { key: "anonymousDeck", name: "Anonymous Deck", desc: "Create an anonymous character deck.", price: 50, limit: 5, category: "decksEmotes" },
    { key: "wordDeck", name: "Word Deck Slot", desc: "Create an additional word deck.", price: 5, limit: 20, category: "decksEmotes" },
    { key: "customEmotes", name: "Custom Emotes", desc: "Add custom emotes to your collection.", price: 100, limit: 1, category: "decksEmotes" },
    { key: "moreCustomEmotes", name: "MORE Custom Emotes", desc: "Increase your custom emote limit.", price: 100, limit: 1, category: "decksEmotes" },
    { key: "stickerSlot", name: "Sticker Slot", desc: "Add a custom sticker slot.", price: 10, limit: 10, category: "decksEmotes" },
  ] };
  if (p === "/api/shop/paypal-client-id") return { clientId: "" };
  if (p === "/api/notifs/inbox") return { currentPage: 1, totalPages: 2, totalNotifications: 9, unreadCount: 3,
    notifications: ["Juniper replied to your comment.", "Your setup received an upvote.", "A new competitive round has started.", "Moth mentioned you in a forum thread."].map((content, i) => ({ id: `fixture-notif-${i}`, content, message: content, title: i === 2 ? "Competitive" : "Community", icon: "comment", date: fixtureTime - i * 3600000, read: i > 1, link: "/community/forums/thread/fixture-thread-0" })) };
  if (p === "/api/hall-of-fame") return { users: rankingUsers, total: rankingUsers.length, page: 1, totalPages: 1, pageCount: 1, pageSize: 25 };
  if (p === "/api/competitive/roundInfo") return { seasonNumber: 1, round, standings, users: competitiveUsers, nextEvent: { type: "complete", date: fixtureTime + 86400000 * 2 }, setupPlayCounts: {} };
  if (p === "/api/competitive/season/1") return { number: 1, standings, users: competitiveUsers, setupOrder: [[0], [0, 1]], setups };
  if (p === "/api/competitive/seasons") return [{ number: 1, rounds: [{ number: 1 }, { number: 2 }] }];
  if (p === "/api/stocks") return stocks;
  if (["/api/stocks/portfolio", "/api/stocks/families", "/api/stocks/families/portfolio", "/api/stocks/families/eligible"].includes(p)) return [];
  if (p === "/api/stocks/transactions") return { transactions: [], total: 0 };
  if (p === "/api/site-activity/summary") return { gamesHosted: 68, dau: 142, newSignups: 12, commentsCreated: 39, threadsCreated: 7, setupsEdited: 15, reportsFiled: 4, modActionsTaken: 8 };
  if (p === "/api/site-activity/games") return { mafiaGames: [{ label: "ranked", count: 30 }, { label: "unranked", count: 22 }, { label: "competitive", count: 8 }], gameTypes: [{ label: "Mafia", count: 60 }, { label: "Liars Dice", count: 8 }], topSetups: setups.slice(0, 3).map((s, i) => ({ name: s.name, count: 17 - i * 3 })) };
  if (p === "/api/site-activity/feed") return { hasMore: false, items: people.map((person, i) => ({ id: `fixture-activity-${i}`, type: i % 2 ? "setupCreate" : "comment", category: i % 2 ? "setups" : "comments", actorId: person.id, actorName: person.name, actorAvatar: person.avatar, timestamp: fixtureTime - (i + 1) * 300000, targetLabel: i % 2 ? "Setup: Classic" : "Role: Cop", link: i % 2 ? "/learn/setup/fixture-setup-0" : "/learn/role/Cop", contentPreview: "Comparing claims and results from the last game." })) };
  if (p === "/api/user/flagged") return people.slice(2, 5).map(person => ({ ...person, joined: fixtureTime - 86400000, signupFlagged: true, signupReason: "Synthetic review record" }));
  if (p === "/api/mod/groups") return ["Owner", "Admin", "Moderator"].map((name, i) => ({ name, rank: 3 - i, badge: null, members: people.slice(0, i + 1) }));
  if (p === "/api/mod/actions") return [
    { id: "fixture-mod-action-1", name: "Ban", mod: people[0], date: fixtureTime - 3600000, args: [people[2].id, "7", "Repeated rule violation"] },
    { id: "fixture-mod-action-2", name: "ClearLeavePenalty", mod: people[1], date: fixtureTime - 7200000, args: [people[3].id] },
  ];
  if (p === "/api/mod/githubLinks") return people.slice(1, 4).map(person => ({ ...person, github: { username: `fictional-${person.name.toLowerCase()}`, requestedAt: fixtureTime - 86400000 } }));
  if (/^\/api\/mod\/reports\/[^/]+$/.test(p)) return { id: p.split("/").at(-1), status: "open", rule: "Harassment", reportedUserId: people[2].id, reportedUserName: people[2].name, reporterId: people[1].id, reporterName: people[1].name, assignees: [], createdAt: fixtureTime - 3600000, description: "Repeated targeted messages after a game.", reporterInfo: [{ id: people[1].id, name: people[1].name, avatar: false }], assigneeInfo: [] };
  if (p === "/api/mod/reports") return { reports: [
    { id: "R-1042", status: "open", rule: "Harassment", reportedUserId: people[2].id, reportedUserName: people[2].name, reporterId: people[1].id, reporterName: people[1].name, assignees: [], createdAt: fixtureTime - 3600000, reporterInfo: [{ id: people[1].id, name: people[1].name, avatar: false }] },
    { id: "R-1041", status: "in-progress", rule: "Outside game information", reportedUserId: people[3].id, reportedUserName: people[3].name, reporterId: people[0].id, reporterName: people[0].name, assignees: [people[0].id], assigneeInfo: [people[0]], createdAt: fixtureTime - 7200000, reporterInfo: [{ id: people[0].id, name: people[0].name, avatar: false }] },
  ], totalPages: 1 };
  if (p === "/api/competitive/current") return { setups: setups.slice(0, 2), setupOrder: [[0], [1]] };
  if (p === "/api/mod/banAppeals/access") return { allowed: true };
  if (p === "/api/mod/banAppeals") return [{ id: "case1", username: people[2].name, userId: people[2].id, status: "pending", filedAt: fixtureTime - 86400000, ban: { label: "Site ban", active: true, permanent: false, issuedAt: fixtureTime - 86400000 * 2, expires: fixtureTime + 86400000 * 5 }, tally: { admins: 2, accept: 0, acceptAt: 2, deny: 0, denyAt: 1 }, myVote: null }];
  if (p === "/api/mod/banAppeals/case1") return { id: "case1", username: people[2].name, userId: people[2].id, status: "pending", filedAt: fixtureTime - 86400000, text: "I believe this ban was a misunderstanding. I have read the rules and will follow them.", tally: { admins: 2, accept: 0, acceptAt: 2, deny: 0, denyAt: 1 }, canVote: true, myVote: null, maxJustificationLength: 1000, ban: { label: "Site ban", active: true, permanent: false, issuedAt: fixtureTime - 86400000 * 2, expires: fixtureTime + 86400000 * 5, reason: "Repeated harassment after warnings.", scope: { label: "Site" }, bannedBy: people[0] }, reports: [{ id: "R-1042", status: "complete", reportedUserId: people[2].id, reportedUserName: people[2].name, rule: "Harassment", createdAt: fixtureTime - 86400000 * 2, reporterCount: 2, linkedBy: "ban" }], modActions: [], votes: [] };
  throw new Error(`Unresolved fixture GET contract: ${p}`);
}

export const routeCases = [
  { name: "lobby", route: "/play", selector: ".lobby-browser" },
  { name: "new-page-contract", route: "/audit/new-page", text: "Shared page geometry" },
  { name: "players", route: "/community/users", text: "Search players" },
  { name: "families", route: "/community/families", text: "The Harbor" },
  { name: "host", route: "/play/host?game=Mafia", text: "Classic" },
  { name: "create-setup", route: "/play/create?game=Mafia&copy=fixture-setup-0", text: "Villager" },
  { name: "character-decks", route: "/play/decks?game=Mafia", text: "Harbor residents" },
  { name: "character-deck-editor", route: "/play/createDeck?game=Mafia&edit=fixture-deck-0", selector: 'input[value="Harbor residents"]' },
  { name: "word-decks", route: "/play/wordDecks?game=Mafia", text: "Everyday words" },
  { name: "word-deck-editor", route: "/play/createWordDeck?game=Mafia&edit=fixture-word-0", selector: 'input[value="Everyday words"]' },
  { name: "learn-games", route: "/learn/games", text: "Villager" },
  { name: "glossary", route: "/learn/glossary", text: "Glossary" },
  { name: "role-detail", route: "/learn/role/Cop", text: "Each night, you can choose to visit one player" },
  { name: "setup-detail", route: "/learn/setup/fixture-setup-0", text: "Classic" },
  { name: "forum-categories", route: "/community/forums", text: "Mafia discussion" },
  { name: "forum-board", route: "/community/forums/board/fixture-board", text: "How do you organize" },
  { name: "forum-thread", route: "/community/forums/thread/fixture-thread-0", text: "I write down claims" },
  { name: "profile-minimal", route: "/user/fixture-minimal", text: "NewPlayer" },
  { name: "profile-default", route: "/user/fixture-default", text: "ArianeSachi62" },
  { name: "profile-self", route: "/user/fixture-person-0", text: "NightOwl" },
  { name: "profile-rich", route: "/user/fixture-person-1", text: "About me" },
  { name: "profile-custom", route: "/user/fixture-custom", text: "About me" },
  { name: "settings-site", route: "/user/settings/site", text: "Site Color Scheme" },
  { name: "settings-profile", route: "/user/settings/profile", text: "Banner" },
  { name: "settings-game", route: "/user/settings/game", text: "Death" },
  { name: "settings-account", route: "/user/settings/account", text: "Password" },
  { name: "settings-github", route: "/user/settings/github", text: "GitHub Username" },
  { name: "settings-cookies", route: "/user/settings/cookies", text: "Essential Cookies" },
  { name: "settings-family", route: "/user/settings/family", text: "No family." },
  { name: "shop", route: "/user/shop", text: "Name and Text Colors" },
  { name: "notifications", route: "/user/notifications", text: "Juniper replied" },
  { name: "rankings", route: "/fame/hall-of-fame", text: "NightOwl" },
  { name: "competitive", route: "/fame/competitive", text: "Season 1 standings" },
  { name: "stocks", route: "/fame/stocks", text: "All Markets" },
  { name: "activity-metrics", route: "/activity/metrics", text: "Games hosted" },
  { name: "activity-feed", route: "/activity/livefeed", text: "Comparing claims" },
  { name: "rules", route: "/policy/rules", text: "Rules" },
  { name: "terms", route: "/policy/tos", text: "Terms" },
  { name: "privacy", route: "/policy/privacy", text: "Privacy" },
  { name: "invoices", route: "/policy/invoices", mode: "owner", text: "Invoices" },
  { name: "invoices-denied", route: "/policy/invoices", text: "UltiMafia Rules" },
  { name: "developer", route: "/user/developer", mode: "developer", text: "Developer API" },
  { name: "developer-owner", route: "/user/developer", mode: "owner", text: "Developer API" },
  { name: "developer-denied", route: "/user/developer", text: "Only developers" },
  { name: "staff-handbook", route: "/policy/moderation/handbook", mode: "staff", text: "Staff Handbook" },
  { name: "admin-github", route: "/policy/moderation/github-links", mode: "staff", text: "fictional-juniper" },
  { name: "admin-intake", route: "/policy/moderation/flagged-intake", mode: "staff", text: "Moth" },
  { name: "moderation-log", route: "/policy/moderation", mode: "staff", text: "Recent actions" },
  { name: "moderation-tools", route: "/policy/moderation/tools", mode: "staff", text: "Run a moderation action" },
  { name: "moderation-groups", route: "/policy/moderation/groups", mode: "staff", text: "Staff groups" },
  { name: "moderation-reports", route: "/policy/moderation/reports", mode: "staff", text: "Report R-1042" },
  { name: "moderation-github", route: "/policy/moderation/github-links", mode: "staff", text: "fictional-juniper" },
  { name: "moderation-volunteer", route: "/policy/moderation/volunteer", mode: "staff", text: "Submit application" },
  { name: "moderation-competitive", route: "/policy/moderation/competitive", mode: "staff", text: "Competitive" },
  { name: "moderation-ban-appeals", route: "/policy/moderation/ban-appeals", mode: "staff", text: "Moth" },
  { name: "moderation-ban-case", route: "/policy/moderation/ban-appeals/case1", mode: "staff", text: "Appeal from" },
  { name: "authentication", route: "/auth/login", mode: "guest", selector: 'input[type="password"]' },
  { name: "welcome", route: "/welcome", mode: "guest", selector: 'input[type="password"]' },
  { name: "feedback", route: "/community/feedback", text: "Describe your feedback" },
  { name: "feedback-guest", route: "/community/feedback", mode: "guest", text: "Feedback" },
  { name: "contributors", route: "/fame/contributors", text: "Contributors" },
  { name: "donors", route: "/fame/donors", text: "Donors" },
  { name: "donors-management", route: "/fame/donors", mode: "staff", text: "Donors" },
  { name: "competitive-faq", route: "/fame/competitive/faq", text: "Competitive" },
  { name: "tutorial", route: "/play/tutorial", text: "Choose your role" },
  { name: "family-profile", route: "/user/family/fixture-family", text: "The Harbor and a longer family name" },
  { name: "family-leader", route: "/user/family/fixture-family-leader", text: "The Harbor and a longer family name" },
  { name: "tutorial-failure", route: "/play/tutorial?fixtureFailRead=/api/game/tutorial/storylines", text: "Could not load tutorial roles" },
  { name: "contributors-failure", route: "/fame/contributors?fixtureFailRead=/api/site/contributors", text: "Could not load contributors" },
  { name: "family-failure", route: "/user/family/fixture-family?fixtureFailRead=/api/family/fixture-family/profile", text: "Family unavailable" },
  { name: "family-pending", route: "/user/family/fixture-family-pending", text: "Pending Application" },
  { name: "family-applications-failure", route: "/user/family/fixture-family-leader?fixtureFailRead=/api/family/fixture-family-leader/applications", text: "Could not load family applications" },
  { name: "family-history-failure", route: "/user/family/fixture-family?fixtureFailRead=/api/family/fixture-family/ledger", text: "Could not load family history" },
];
