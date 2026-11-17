// Local-development forum demo data. Safe to rerun: only records whose IDs
// start with mock- are replaced. Real forum records are never deleted.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const db = require("../db/db");
const models = require("../db/models");
const constants = require("../data/constants");

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const ago = (days, hours = 0) => now - days * day - hours * 60 * 60 * 1000;

function threadContent(intro, sections) {
  return [`## ${intro}`, ...sections].join("\n\n");
}

async function main() {
  await db.promise;
  const users = await models.User.find({})
    .sort({ rank: -1, created: 1 })
    .select("id name rank")
    .limit(5)
    .lean();
  if (users.length < 2) throw new Error("At least two local users are needed for forum mock data.");
  const [first, second, third, fourth, fifth = third] = users;
  const author = (user) => user._id;
  const userId = (user) => user.id;

  // Remove only previous demo records and their references.
  const oldThreads = await models.ForumThread.find({ id: /^mock-thread-/ }).select("_id id").lean();
  const oldReplies = await models.ForumReply.find({ id: /^mock-reply-/ }).select("_id").lean();
  if (oldThreads.length) {
    await models.ForumThread.deleteMany({ _id: { $in: oldThreads.map(thread => thread._id) } });
    await models.ForumReply.deleteMany({ thread: { $in: oldThreads.map(thread => thread._id) } });
  }
  if (oldReplies.length) await models.ForumReply.deleteMany({ _id: { $in: oldReplies.map(reply => reply._id) } });

  const categories = {};
  for (const [name, position] of [["Mafia", 1], ["Community", 2]]) {
    let category = await models.ForumCategory.findOne({ name });
    if (!category) category = await models.ForumCategory.create({ id: `mock-category-${name.toLowerCase()}`, name, rank: 0, position, boards: [] });
    else {
      category.rank = 0;
      category.position = position;
      await category.save();
    }
    categories[name] = category;
  }

  const boardDefinitions = [
    ["mock-board-mafia-discussion", "Mafia discussion", "Mafia", "Roles, setups, claims and the parts of a game that are hard to read in the moment.", 1],
    ["mock-board-setup-lab", "Setup lab", "Mafia", "Share a setup, explain what it tests and ask for feedback before hosting it.", 2],
    ["mock-board-competitive", "Competitive play", "Mafia", "Round notes, standings, opening-day decisions and post-game review.", 3],
    ["mock-board-general", "General discussion", "Community", "Meet other players, talk about the site and share what you are working on.", 1],
    ["mock-board-new-players", "New player questions", "Community", "No question is too basic. Ask about roles, hosting, setups or finding a game.", 2],
  ];
  const boards = {};
  for (const [id, name, categoryName, description, position] of boardDefinitions) {
    let board = await models.ForumBoard.findOne({ id });
    if (!board) board = new models.ForumBoard({ id, name, category: categories[categoryName]._id, description, icon: "chat", rank: 0, position, newestThreads: [], recentReplies: [], threadCount: 0 });
    board.name = name;
    board.category = categories[categoryName]._id;
    board.description = description;
    board.rank = 0;
    board.position = position;
    await board.save();
    boards[id] = board;
    await models.ForumCategory.updateOne({ _id: categories[categoryName]._id }, { $addToSet: { boards: board._id } });
  }

  const threadDefinitions = [
    {
      id: "mock-thread-forum-guide", board: "mock-board-general", author: first,
      title: "Welcome to the forums — how this board works", pinned: true,
      date: ago(9, 2), views: 342, votes: 18,
      content: threadContent("A small guide to the forum", [
        "This is a place for longer discussions than chat allows: setup ideas, game reviews, questions and community projects.",
        "- **Be specific.** Link a setup or thread when you can.\n- **Keep game information in the game.** Do not post live role claims or screenshots from an unfinished game.\n- **Use the board that fits.** Mafia discussion is for play; Setup lab is for authoring and feedback.",
        "If you are new, start with **New player questions**. If you want to review a finished game, use **Mafia discussion** and include the setup name.",
      ]),
    },
    {
      id: "mock-thread-claim-notes", board: "mock-board-mafia-discussion", author: second,
      title: "How do you keep track of claims across days?", pinned: false,
      date: ago(4, 3), views: 186, votes: 12,
      content: threadContent("A practical question about notes", [
        "I usually write down the claim, the day it happened and who repeated it. By day three I have a page of arrows and no idea which one actually changed my read.",
        "What do you track between nights? Do you keep a separate list for role claims and another for votes, or put everything in one timeline?",
      ]),
    },
    {
      id: "mock-thread-after-classic", board: "mock-board-new-players", author: third,
      title: "What should a new player try after Classic?", pinned: false,
      date: ago(2, 5), views: 128, votes: 7,
      content: threadContent("Looking for a second setup", [
        "I have played a few Classic games and understand the basic day/night rhythm. I want something with one or two more decisions without being completely lost on night one.",
        "Would you recommend an open setup first, or a closed setup with a small role pool? Any setup links are welcome.",
      ]),
    },
    {
      id: "mock-thread-competitive-notes", board: "mock-board-competitive", author: fourth,
      title: "Competitive Round 2: opening-day notes", pinned: false,
      date: ago(1, 4), views: 94, votes: 9,
      content: threadContent("Notes from the first day", [
        "The first vote came earlier than I expected, which made the later claims easier to compare. I am more interested in the order of the claims than the exact wording.",
        "Post your opening-day notes here after the round. Keep them spoiler-free until the game is marked complete.",
      ]),
    },
    {
      id: "mock-thread-small-town", board: "mock-board-setup-lab", author: fifth,
      title: "Small-town setup: Cop, Doctor, two Mafia", pinned: false,
      date: ago(3, 1), views: 211, votes: 14,
      content: threadContent("A compact setup for eight players", [
        "I want a setup that gives the village two clear sources of information without making the first night automatic. The current draft is **Cop**, **Doctor**, **4 Villagers** and **2 Mafiosi**.",
        "The open question is whether the Doctor should be able to self-protect. I think no: it makes the Cop claim too safe. I would rather test the version where the Doctor must choose another player.",
        "Feedback on the role count and the night order is welcome. I have not hosted this yet.",
      ]),
    },
    {
      id: "mock-thread-projects", board: "mock-board-general", author: fourth,
      title: "What are you building outside the game?", pinned: false,
      date: ago(5, 4), views: 76, votes: 5,
      content: threadContent("A thread for side projects", [
        "Not everything here has to be about mafia. I am learning to draw small pixel scenes and would like to see what other people are making.",
        "It can be code, art, a setup tool, a spreadsheet or something completely different. A short description is enough; links are optional.",
      ]),
    },
    {
      id: "mock-thread-vote-flip", board: "mock-board-mafia-discussion", author: first,
      title: "Reading the vote after a flip", pinned: false,
      date: ago(6, 2), views: 143, votes: 8,
      content: threadContent("What changes after a flip?", [
        "When a player flips mafia, I go back to the vote record before reading the night results. The people who moved early often explain more than the people who stayed put.",
        "How much weight do you give to the first vote on the wagon? I am never sure whether it is a town read or just the safest place to be.",
      ]),
    },
  ];

  const replyDefinitions = [
    ["mock-reply-guide-1", "mock-thread-forum-guide", second, ago(9, 1), "Thanks for setting this up. A dedicated Setup lab will make it much easier to find feedback."],
    ["mock-reply-guide-2", "mock-thread-forum-guide", third, ago(8, 6), "The note about unfinished games is worth repeating. Please keep live information in the game."],
    ["mock-reply-guide-3", "mock-thread-forum-guide", fourth, ago(7, 2), "I would also add the setup name to review threads. It makes old discussions searchable."],
    ["mock-reply-claims-1", "mock-thread-claim-notes", first, ago(4, 2), "One timeline, but I colour claims by whether they were volunteered or forced. The difference matters more than the exact role name."],
    ["mock-reply-claims-2", "mock-thread-claim-notes", third, ago(4, 0), "I keep a separate vote column. A claim with no vote behind it is usually less useful than a quiet player who keeps joining the same wagon."],
    ["mock-reply-claims-3", "mock-thread-claim-notes", fourth, ago(3, 5), "Do you track retractions? Those are often the most useful part of my notes."],
    ["mock-reply-claims-4", "mock-thread-claim-notes", second, ago(2, 3), "Yes — I add a strikethrough and the day of the retraction. Otherwise the old claim keeps looking current."],
    ["mock-reply-new-1", "mock-thread-after-classic", first, ago(2, 3), "Try an open setup with a small role pool first. You can see what every role is doing and still practise reading votes."],
    ["mock-reply-new-2", "mock-thread-after-classic", fifth, ago(2, 1), "Follow the visits is a good next step if you like comparing night results. It is less punishing than a fully closed setup."],
    ["mock-reply-new-3", "mock-thread-after-classic", fourth, ago(1, 7), "Do not jump straight into a 15-role closed game. The first night is mostly noise if you do not know the role pool."],
    ["mock-reply-comp-1", "mock-thread-competitive-notes", second, ago(1, 2), "The early vote made the later unvotes more informative than the claims. I am saving the order for the review."],
    ["mock-reply-comp-2", "mock-thread-competitive-notes", third, ago(0, 8), "I will post mine after the round closes. The setup choice changes how much the first day tells you."],
    ["mock-reply-comp-3", "mock-thread-competitive-notes", first, ago(0, 3), "Agreed on keeping this spoiler-free until the game is complete."],
    ["mock-reply-town-1", "mock-thread-small-town", second, ago(3, 0), "I would keep the Doctor unable to self-protect. With two Mafia, self-protection gives the village too much room to chain claims."],
    ["mock-reply-town-2", "mock-thread-small-town", third, ago(2, 6), "Have you considered a Sheriff instead of a second Villager? It gives the village a day action without adding another night result."],
    ["mock-reply-town-3", "mock-thread-small-town", first, ago(2, 2), "The eight-player count feels right. I would test it with the Cop before adding another investigative role."],
    ["mock-reply-town-4", "mock-thread-small-town", fifth, ago(1, 3), "Thanks. I will host the no-self-protect version first and post the game link here."],
    ["mock-reply-projects-1", "mock-thread-projects", second, ago(5, 1), "I am slowly building a setup comparison sheet. It is mostly columns and conditional formatting, but it saves a lot of scrolling."],
    ["mock-reply-projects-2", "mock-thread-projects", fifth, ago(4, 5), "Pixel scenes sound useful for setup covers. I would like to see one when it is ready."],
    ["mock-reply-projects-3", "mock-thread-projects", third, ago(4, 0), "I have been writing short game reviews in a notebook. I might turn the useful parts into forum posts."],
    ["mock-reply-flip-1", "mock-thread-vote-flip", third, ago(6, 0), "The first vote is usually the least informative. The second and third votes tell you who was watching the room."],
    ["mock-reply-flip-2", "mock-thread-vote-flip", fourth, ago(5, 3), "I look for a vote that arrives after the flip is already likely. That is where the motivation is easiest to read."],
    ["mock-reply-flip-3", "mock-thread-vote-flip", second, ago(4, 4), "Do you count unvotes separately? A late unvote can be more revealing than the original vote."],
  ];

  const threads = {};
  for (const definition of threadDefinitions) {
    const thread = new models.ForumThread({
      id: definition.id,
      board: boards[definition.board]._id,
      author: author(definition.author),
      title: definition.title,
      content: definition.content,
      postDate: definition.date,
      bumpDate: definition.date,
      replyCount: 0,
      voteCount: definition.votes,
      viewCount: definition.views,
      pinned: !!definition.pinned,
      locked: false,
      deleted: false,
      subscribers: [userId(definition.author)],
      recentReplies: [],
    });
    await thread.save();
    threads[definition.id] = thread;
  }

  const replies = [];
  for (const [id, threadId, replyAuthor, date, content] of replyDefinitions) {
    const thread = threads[threadId];
    const page = Math.ceil((thread.replyCount + 1) / constants.repliesPerPage) || 1;
    const reply = new models.ForumReply({ id, author: author(replyAuthor), thread: thread._id, page, content, postDate: date, voteCount: 0 });
    await reply.save();
    thread.replyCount += 1;
    thread.bumpDate = Math.max(thread.bumpDate, date);
    thread.recentReplies.push(reply._id);
    if (thread.recentReplies.length > constants.boardRecentReplyAmt) thread.recentReplies = thread.recentReplies.slice(-constants.boardRecentReplyAmt);
    await thread.save();
    replies.push({ reply, threadId });
  }

  for (const board of Object.values(boards)) {
    const boardThreads = threadDefinitions.filter(thread => thread.board === board.id).map(thread => threads[thread.id]);
    const boardReplies = replies.filter(entry => boardThreads.some(thread => String(thread._id) === String(entry.reply.thread))).map(entry => entry.reply._id);
    const newest = boardThreads.slice().sort((a, b) => b.postDate - a.postDate)[0];
    board.newestThreads = newest ? [newest._id] : [];
    board.recentReplies = boardReplies.slice(-constants.recentReplyAmt);
    board.threadCount = boardThreads.length;
    await board.save();
  }

  console.log(JSON.stringify({
    users: users.map(user => user.name),
    categories: Object.keys(categories),
    boards: Object.values(boards).map(board => ({ id: board.id, name: board.name, threads: board.threadCount })),
    threads: threadDefinitions.map(thread => ({ id: thread.id, title: thread.title, replies: threads[thread.id].replyCount })),
    replies: replies.length,
  }, null, 2));
}

main().then(async () => { await db.conn.close(); process.exit(0); }).catch(async error => { console.error(error); try { await db.conn.close(); } catch (_) {} process.exit(1); });
