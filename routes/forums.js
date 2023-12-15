const axios = require("axios");
const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const {getBasicUserInfo} = require("../modules/redis");
const logger = require("../modules/logging")(".");
const router = express.Router();

router.get("/categories", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var rank = userId ? await redis.getUserRank(userId) : 0;
    var categories = await models.ForumCategory.find({ rank: { $lte: rank } })
      .select("id name position boards -_id")
      .populate({
        path: "boards",
        select: "id name description icon newestThreads recentReplies -_id",
        populate: [
          {
            path: "newestThreads",
            select: "id author title viewCount replyCount deleted -_id",
            match: { deleted: false },
            populate: {
              path: "author",
              select: "id name avatar -_id",
            },
          },
          {
            path: "recentReplies",
            select: "id author thread postDate -_id",
            populate: [
              {
                path: "author",
                select: "id name avatar -_id",
              },
              {
                path: "thread",
                select: "id title deleted -_id",
              },
            ],
          },
        ],
      })
      .sort("-position");

    for (let category of categories)
      for (let board of category.boards)
        for (let i = 0; i < board.recentReplies.length; i++)
          if (board.recentReplies[i].thread.deleted)
            board.recentReplies.splice(i--, 1);

    res.send(categories);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading categories.");
  }
});

router.get("/board/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const sortTypes = ["bumpDate", "postDate", "replyCount", "voteCount"];

    var userId = await routeUtils.verifyLoggedIn(req, true);
    var rank = userId ? await redis.getUserRank(userId) : 0;
    var boardId = String(req.params.id);
    var sortType = String(req.query.sortType);
    var last = Number(req.query.last);
    var first = Number(req.query.first);

    var board = await models.ForumBoard.findOne({ id: boardId })
      .select("id name icon category")
      .populate("category", "id name rank -_id");

    if (!board || board.category.rank > rank) {
      res.status(500);
      res.end("Board not found");
      return;
    }

    var threadFilter = { board: board._id, pinned: false };

    if (!(await routeUtils.verifyPermission(userId, "viewDeleted")))
      threadFilter.deleted = false;

    if (sortTypes.indexOf(sortType) == -1) sortType = "bumpDate";

    var threads = await routeUtils.modelPageQuery(
      models.ForumThread,
      threadFilter,
      sortType,
      last,
      first,
      "id title author postDate bumpDate replyCount voteCount viewCount recentReplies pinned locked deleted -_id",
      constants.threadsPerPage,
      ["author", "id -_id"],
      {
        path: "recentReplies",
        select: "id author postDate -_id",
        populate: {
          path: "author",
          select: "id name avatar -_id",
        },
      }
    );

    var pinnedThreads = await models.ForumThread.find({
      board: board._id,
      pinned: true,
    })
      .select(
        "id title author postDate bumpDate replyCount voteCount viewCount recentReplies pinned locked deleted -_id"
      )
      .populate("author", "id -_id")
      .populate({
        path: "recentReplies",
        select: "id author postDate -_id",
        populate: {
          path: "author",
          select: "id name avatar -_id",
        },
      })
      .sort("-bumpDate");

    for (let i in threads) {
      let thread = threads[i].toJSON();
      thread.author = await redis.getBasicUserInfo(thread.author.id, true);
      threads[i] = thread;
    }

    for (let i in pinnedThreads) {
      let thread = pinnedThreads[i].toJSON();
      thread.author = await redis.getBasicUserInfo(thread.author.id, true);
      pinnedThreads[i] = thread;
    }

    var votes = {};
    var threadIds = threads.map((thread) => thread.id);

    if (userId) {
      var voteList = await models.ForumVote.find({
        voter: userId,
        item: { $in: threadIds },
      }).select("item direction");

      for (let vote of voteList) votes[vote.item] = vote.direction;

      threads = threads.map((thread) => {
        thread.vote = votes[thread.id] || 0;
        return thread;
      });
    }

    board = board.toJSON();
    board.threads = threads;
    board.pinnedThreads = pinnedThreads;
    delete board._id;

    res.send(board);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading board.");
  }
});

router.get("/thread/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var threadId = String(req.params.id);
    var page = Number(req.query.page) || 1;
    var reply = String(req.query.reply || "");

    if (reply) {
      reply = await models.ForumReply.findOne({ id: reply }).select("page");

      if (reply) page = reply.page;
    }

    var thread = await models.ForumThread.findOne({ id: threadId })
      .populate("board", "id name -_id")
      .populate("author", "id -_id");

    var canViewDeleted = await routeUtils.verifyPermission(
      userId,
      "viewDeleted"
    );

    if (!thread || (thread.deleted && !canViewDeleted)) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    var vote;

    if (userId) {
      vote = await models.ForumVote.findOne({
        voter: userId,
        item: threadId,
      }).select("direction");
    }

    var replyFilter = { thread: thread._id, page: page };

    if (!canViewDeleted) replyFilter.deleted = false;

    var replies = await models.ForumReply.find(replyFilter)
      .select("id author content page postDate voteCount deleted -_id")
      .populate("author", "id -_id")
      .sort("postDate");

    for (let i in replies) {
      let reply = replies[i].toJSON();
      reply.author = await redis.getBasicUserInfo(reply.author.id, true);
      replies[i] = reply;
    }

    thread = thread.toJSON();
    thread.author = await redis.getBasicUserInfo(thread.author.id, true);
    thread.vote = (vote && vote.direction) || 0;
    thread.replies = replies;
    thread.pageCount =
      Math.ceil(thread.replyCount / constants.repliesPerPage) || 1;
    thread.page = page;

    delete thread._id;
    delete thread.replyCount;

    if (userId) {
      for (let reply of replies) {
        vote = await models.ForumVote.findOne({
          voter: userId,
          item: reply.id,
        }).select("direction");
        reply.vote = (vote && vote.direction) || 0;
      }
    }

    res.send(thread);

    if (req.query.page != null && req.query.reply == null) return;

    await models.ForumThread.updateOne(
      { id: threadId },
      { $inc: { viewCount: 1 } }
    ).exec();
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading thread.");
  }
});

router.get("/vote/:id/:direction?", async function(req, res)  {
  try {
      const userId = await routeUtils.verifyLoggedIn(req);
      if (!(await routeUtils.verifyPermission(res, userId, "viewVotes")))
          return;

      const search = {
          item: req.params.id
      }
      if (req.params.direction) {
          search.direction = parseInt(req.params.direction);
      }
      const votes = await models.ForumVote.aggregate([
          {$match:search},
          {$project:{voter:1, direction:1}}
      ]);

      const mappedVotes = await Promise.all(votes.map(async e => {
          e.voter = await getBasicUserInfo(e.voter, true)
          return e;
      }));
      res.status(200);
      res.send(votes);
  } catch (e) {
      res.status(500);
      res.send("Error getting votes.");
  }
})

router.post("/category", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "createCategory";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var name = routeUtils
      .strParseAlphaNum(req.body.name)
      .slice(0, constants.maxCategoryNameLength);
    var rank = Number(req.body.rank) || 0;
    var position = Number(req.body.position) || 0;

    var category = await models.ForumCategory.findOne({
      name: new RegExp(name, "i"),
    }).select("_id");

    if (category) {
      res.status(500);
      res.send("A category with this name already exists.");
      return;
    }

    category = new models.ForumCategory({
      id: shortid.generate(),
      name,
      rank,
      position,
    });
    await category.save();

    routeUtils.createModAction(userId, "Create Forum Category", [
      name,
      String(position),
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating category.");
  }
});

router.post("/board", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "createBoard";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var name = String(req.body.name).slice(0, constants.maxBoardNameLength);
    var categoryName = routeUtils.strParseAlphaNum(req.body.category);
    var description = String(req.body.description).slice(
      0,
      constants.maxBoardDescLength
    );
    var icon = String(req.body.icon || "").slice(0, 50);
    var rank = Number(req.body.rank) || 0;
    var position = Number(req.body.position) || 0;

    var category = await models.ForumCategory.findOne({
      name: new RegExp(categoryName, "i"),
    }).select("_id");

    if (!category) {
      res.status(500);
      res.send("Category does not exist.");
      return;
    }

    var board = new models.ForumBoard({
      id: shortid.generate(),
      name,
      category: category._id,
      description,
      icon,
      rank,
      position,
    });
    await board.save();

    await models.ForumCategory.updateOne(
      { name: new RegExp(categoryName, "i") },
      { $push: { boards: board._id } }
    ).exec();

    routeUtils.createModAction(userId, "Create Forum Board", [name]);
    res.send(board.id);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating board.");
  }
});

router.post("/board/delete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var rank = await redis.getUserRank(userId);
    var perm = "deleteBoard";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var name = String(req.body.name);
    await models.ForumBoard.deleteOne({ name, rank: { $lte: rank } }).exec();

    routeUtils.createModAction(userId, "Delete Forum Board", [name]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating board.");
  }
});

router.post("/board/updateDescription", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "updateBoard";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var name = String(req.body.name);
    var description = String().slice(0, constants.maxBoardDescLength);

    await models.ForumBoard.updateOne(
      { id: boardId },
      { $set: { description: description } }
    ).exec();

    routeUtils.createModAction(userId, "Update Board Description", [name]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating board.");
  }
});

router.post("/thread", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var boardId = String(req.body.board);
    var perm = "createThread";

    var board = await models.ForumBoard.findOne({ id: boardId }).select(
      "rank name id"
    );

    if (!board) {
      res.status(500);
      res.send("Board not found.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, board.rank)))
      return;

    if (!(await routeUtils.rateLimit(userId, "createThread", res))) return;

    var title = String(req.body.title);
    var content = String(req.body.content);

    if (title.length == 0 || title.length > constants.maxThreadTitleLength) {
      res.status(500);
      res.send(
        `Title must be between 1 and ${constants.maxThreadTitleLength} characters.`
      );
      return;
    }

    if (
      content.length == 0 ||
      content.length > constants.maxThreadContentLength
    ) {
      res.status(500);
      res.send(
        `Content must be between 1 and ${constants.maxThreadContentLength} characters.`
      );
      return;
    }

    var thread = new models.ForumThread({
      id: shortid.generate(),
      board: board._id,
      author: req.session.user._id,
      title: title,
      content: content,
      postDate: Date.now(),
      bumpDate: Date.now(),
    });
    await thread.save();

    await models.ForumBoard.updateOne(
      { id: boardId },
      {
        $push: {
          newestThreads: {
            $each: [thread._id],
            $slice: -1 * constants.newestThreadAmt,
          },
        },
        $inc: { threadCount: 1 },
      }
    ).exec();

    try {
      const alertSettings = JSON.parse(process.env.FORUM_DISCORD_WEBHOOOKS);
      const useWebook = alertSettings.find((curWebook) => {
        return curWebook.boards.indexOf(board.id) !== -1;
      });

      if (useWebook) {
        await axios({
          method: "post",
          url: useWebook.hook,
          data: {
            content: "New thread in " + board.name,
            embeds: [
              {
                url:
                  process.env.BASE_URL +
                  "/community/forums/thread/" +
                  thread.id,
                title: title,
              },
            ],
          },
        });
      }
    } catch (e) {
      // error stack is pretty untracable with the error, and i didn't want to modify the error object itself,
      // so I'm just posting 2 warnings to the logger
      logger.warn("Error posting forum thread to webhook");
      logger.warn(e);
    }

    res.send(thread.id);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating thread.");
  }
});

router.post("/thread/delete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var threadId = String(req.body.thread);
    var perm1 = "deleteOwnPost";
    var perm2 = "deleteAnyPost";

    var thread = await models.ForumThread.findOne({
      id: threadId,
      deleted: false,
    })
      .select("author board")
      .populate("author", "id")
      .populate("board", "rank");

    if (!thread) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    if (
      thread.author.id != userId ||
      !(await routeUtils.verifyPermission(userId, perm1, thread.board.rank))
    )
      if (
        !(await routeUtils.verifyPermission(
          res,
          userId,
          perm2,
          thread.board.rank
        ))
      )
        return;

    await models.ForumThread.updateOne(
      { id: threadId },
      { $set: { deleted: true } }
    ).exec();

    if (thread.author.id != userId)
      routeUtils.createModAction(userId, "Delete Forum Thread", [threadId]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting thread.");
  }
});

router.post("/thread/restore", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var threadId = String(req.body.thread);
    var perm = "restoreDeleted";

    var thread = await models.ForumThread.findOne({
      id: threadId,
      deleted: true,
    })
      .select("board")
      .populate("board", "rank");

    if (!thread) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    if (
      !(await routeUtils.verifyPermission(res, userId, perm, thread.board.rank))
    )
      return;

    await models.ForumThread.updateOne(
      { id: threadId },
      { $set: { deleted: false } }
    ).exec();

    routeUtils.createModAction(userId, "Restore Forum Thread", [threadId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error restoring thread.");
  }
});

router.post("/thread/togglePinned", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var threadId = String(req.body.thread);
    var perm = "pinThreads";

    var thread = await models.ForumThread.findOne({
      id: threadId,
      deleted: false,
    })
      .select("board pinned")
      .populate("board", "rank");

    if (!thread) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    if (
      !(await routeUtils.verifyPermission(res, userId, perm, thread.board.rank))
    )
      return;

    await models.ForumThread.updateOne(
      { id: threadId },
      { $set: { pinned: !thread.pinned } }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Forum Thread Pin", [threadId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error pinning thread.");
  }
});

router.post("/thread/toggleLocked", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var threadId = String(req.body.thread);
    var perm = "lockThreads";

    var thread = await models.ForumThread.findOne({
      id: threadId,
      deleted: false,
    })
      .select("board locked")
      .populate("board", "rank");

    if (!thread) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    if (
      !(await routeUtils.verifyPermission(res, userId, perm, thread.board.rank))
    )
      return;

    await models.ForumThread.updateOne(
      { id: threadId },
      { $set: { locked: !thread.locked } }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Forum Thread Lock", [threadId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error locking thread.");
  }
});

router.post("/thread/edit", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var threadId = String(req.body.thread);
    var content = String(req.body.content);
    var perm = "editPost";

    var thread = await models.ForumThread.findOne({
      id: threadId,
      deleted: false,
    })
      .select("author board")
      .populate("author", "id")
      .populate("board", "rank");

    if (!thread) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    if (
      thread.author.id != userId ||
      !(await routeUtils.verifyPermission(res, userId, perm, thread.board.rank))
    ) {
      res.status(500);
      res.send("You are unable to edit this thread.");
      return;
    }

    if (
      content.length == 0 ||
      content.length > constants.maxThreadContentLength
    ) {
      res.status(500);
      res.send(
        `Content must be between 1 and ${constants.maxThreadContentLength} characters.`
      );
      return;
    }

    await models.ForumThread.updateOne(
      { id: threadId },
      { $set: { content: content } }
    ).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error editing reply.");
  }
});

router.post("/thread/notify", async function (req, res) {
  try {
    var threadId = String(req.body.thread);

    var thread = await models.ForumThread.findOne({
      id: threadId,
      author: req.session.user._id,
      deleted: false,
    }).select("replyNotify");

    if (!thread) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    await models.ForumThread.updateOne(
      { id: threadId },
      { $set: { replyNotify: !thread.replyNotify } }
    ).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error modifying notification settings.");
  }
});

router.post("/thread/move", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var threadId = String(req.body.thread);
    var boardName = routeUtils.strParseAlphaNum(req.body.board);
    var perm = "moveThread";

    var thread = await models.ForumThread.findOne({ id: threadId })
      .select("board")
      .populate("board", "rank");

    if (!thread) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    if (
      !(await routeUtils.verifyPermission(res, userId, perm, thread.board.rank))
    )
      return;

    var board = await models.ForumBoard.findOne({
      name: new RegExp(boardName, "i"),
    }).select("_id");

    if (!board) {
      res.status(500);
      res.send("Board not found.");
      return;
    }

    await models.ForumThread.updateOne(
      { id: threadId },
      { $set: { board: board._id } }
    ).exec();

    routeUtils.createModAction(userId, "Move Forum Thread", [
      threadId,
      boardName,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error modifying notification settings.");
  }
});

router.post("/reply", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userName = await redis.getUserName(userId);
    var threadId = String(req.body.thread);
    var perm = "postReply";

    var thread = await models.ForumThread.findOne({
      id: threadId,
      deleted: false,
    })
      .select("board author replyCount locked replyNotify")
      .populate("board", "id rank")
      .populate("author", "id");

    if (!thread) {
      res.status(500);
      res.send("Thread does not exist.");
      return;
    }

    if (
      !(await routeUtils.verifyPermission(res, userId, perm, thread.board.rank))
    )
      return;

    if (!(await routeUtils.rateLimit(userId, "postReply", res))) return;

    if (
      thread.locked &&
      !(await routeUtils.verifyPermission(
        userId,
        "postInLocked",
        thread.board.rank
      ))
    ) {
      res.status(500);
      res.send("Thread is locked.");
      return;
    }

    var page =
      Math.ceil((thread.replyCount + 1) / constants.repliesPerPage) || 1;
    var content = String(req.body.content);

    if (content.length == 0 || content.length > constants.maxReplyLength) {
      res.status(500);
      res.send(
        `Content must be between 1 and ${constants.maxReplyLength} characters.`
      );
      return;
    }

    var reply = new models.ForumReply({
      id: shortid.generate(),
      author: req.session.user._id,
      thread: thread._id,
      postDate: Date.now(),
      page,
      content,
    });
    await reply.save();

    await models.ForumThread.updateOne(
      { id: threadId },
      {
        lastReply: reply._id,
        bumpDate: Date.now(),
        $inc: { replyCount: 1 },
        $push: {
          recentReplies: {
            $each: [reply._id],
            $slice: -1 * constants.boardRecentReplyAmt,
          },
        },
      }
    ).exec();

    await models.ForumBoard.updateOne(
      { id: thread.board.id },
      {
        $push: {
          recentReplies: {
            $each: [reply._id],
            $slice: -1 * constants.recentReplyAmt,
          },
        },
      }
    ).exec();

    var pingedNames = content.match(/@[\w-]+/g);

    if (pingedNames) {
      var pingedName = new RegExp(`^${pingedNames[0].replace("@", "")}$`, "i");
      var pingedUser = await models.User.findOne({ name: pingedName }).select(
        "id"
      );

      if (pingedUser && pingedUser.id != userId) {
        routeUtils.createNotification(
          {
            content: `${userName} mentioned you in a reply.`,
            icon: "at",
            link: `/community/forums/thread/${threadId}?reply=${reply.id}`,
          },
          [pingedUser.id]
        );
      }
    }

    if (thread.replyNotify && thread.author.id != userId) {
      routeUtils.createNotification(
        {
          content: `${userName} replied to your thread.`,
          icon: "reply",
          link: `/community/forums/thread/${threadId}?reply=${reply.id}`,
        },
        [thread.author.id]
      );
    }

    res.send(String(page));
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error posting reply.");
  }
});

router.post("/reply/delete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var replyId = String(req.body.reply);
    var perm1 = "deleteOwnPost";
    var perm2 = "deleteAnyPost";

    var reply = await models.ForumReply.findOne({ id: replyId, deleted: false })
      .select("author thread")
      .populate("author", "id")
      .populate({
        path: "thread",
        select: "board",
        populate: {
          path: "board",
          select: "rank",
        },
      });

    if (!reply) {
      res.status(500);
      res.send("Reply not found.");
      return;
    }

    if (
      reply.author.id != userId ||
      !(await routeUtils.verifyPermission(
        userId,
        perm1,
        reply.thread.board.rank
      ))
    )
      if (
        !(await routeUtils.verifyPermission(
          res,
          userId,
          perm2,
          reply.thread.board.rank
        ))
      )
        return;

    await models.ForumReply.updateOne(
      { id: replyId },
      { $set: { deleted: true } }
    ).exec();

    if (reply.author.id != userId)
      routeUtils.createModAction(userId, "Delete Forum Reply", [replyId]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting reply.");
  }
});

router.post("/reply/restore", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var replyId = String(req.body.reply);
    var perm = "restoreDeleted";

    var reply = await models.ForumReply.findOne({ id: replyId })
      .select("thread")
      .populate({
        path: "thread",
        select: "board",
        populate: {
          path: "board",
          select: "rank",
        },
      });

    if (!reply) {
      res.status(500);
      res.send("Reply not found.");
      return;
    }

    if (
      !(await routeUtils.verifyPermission(
        res,
        userId,
        perm,
        reply.thread.board.rank
      ))
    )
      return;

    await models.ForumReply.updateOne(
      { id: replyId },
      { $set: { deleted: false } }
    ).exec();

    routeUtils.createModAction(userId, "Restore Forum Reply", [replyId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error restoring reply.");
  }
});

router.post("/reply/edit", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var replyId = String(req.body.reply);
    var content = String(req.body.content);
    var perm = "editPost";

    var reply = await models.ForumReply.findOne({ id: replyId, deleted: false })
      .select("author thread")
      .populate("author", "id")
      .populate({
        path: "thread",
        select: "board",
        populate: {
          path: "board",
          select: "rank",
        },
      });

    if (!reply) {
      res.status(500);
      res.send("Reply not found.");
      return;
    }

    if (
      reply.author.id != userId ||
      !(await routeUtils.verifyPermission(
        res,
        userId,
        perm,
        reply.thread.board.rank
      ))
    ) {
      res.status(500);
      res.send("You are unable to edit this reply.");
      return;
    }

    if (content.length == 0 || content.length > constants.maxReplyLength) {
      res.status(500);
      res.send(
        `Content must be between 1 and ${constants.maxReplyLength} characters.`
      );
      return;
    }

    await models.ForumReply.updateOne(
      { id: replyId },
      { $set: { content: content } }
    ).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error editing reply.");
  }
});

router.post("/vote", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var itemId = String(req.body.item);
    var itemType = String(req.body.itemType);
    var perm = "vote";
    var itemModel;

    switch (itemType) {
      case "thread":
        itemModel = models.ForumThread;
        break;
      case "reply":
        itemModel = models.ForumReply;
        break;
      case "comment":
        itemModel = models.Comment;
        break;
      default:
        res.status(500);
        res.send("Invalid item type.");
        return;
    }

    var item = await itemModel
      .findOne({ id: itemId })
      .select("board thread")
      .populate("board", "rank")
      .populate({
        path: "thread",
        select: "board",
        populate: {
          path: "board",
          select: "rank",
        },
      });

    if (!item) {
      res.status(500);
      res.send("Item does not exist.");
    }

    var requiredRank =
      (item.board && item.board.rank) ||
      (item.thread && item.thread.board && item.thread.board.rank) ||
      0;

    if (!(await routeUtils.verifyPermission(res, userId, perm, requiredRank)))
      return;

    if (!(await routeUtils.rateLimit(userId, "vote", res))) return;

    var direction = Number(req.body.direction);

    if (direction != 1 && direction != -1) {
      res.status(500);
      res.send("Bad vote direction");
      return;
    }

    var vote = await models.ForumVote.findOne({ voter: userId, item: itemId });

    if (!vote) {
      vote = new models.ForumVote({
        voter: userId,
        item: itemId,
        direction: direction,
      });
      await vote.save();

      await itemModel
        .updateOne({ id: itemId }, { $inc: { voteCount: direction } })
        .exec();

      res.send(String(direction));
    } else if (vote.direction != direction) {
      await models.ForumVote.updateOne(
        { voter: userId, item: itemId },
        { $set: { direction: direction } }
      ).exec();

      await itemModel
        .updateOne({ id: itemId }, { $inc: { voteCount: 2 * direction } })
        .exec();

      res.send(String(direction));
    } else {
      await models.ForumVote.deleteOne({ voter: userId, item: itemId }).exec();

      await itemModel
        .updateOne({ id: itemId }, { $inc: { voteCount: -1 * direction } })
        .exec();

      res.send("0");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error voting.");
  }
});

router.get("/search", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var query = String(req.query.query);
    var user = String(req.query.user);
    var last = String(req.query.last);

    var threads = await models.ForumThread.find({})
      .select("id author title content")
      .populate("author", "id name avatar");
    var replies = await models.ForumReply.find()
      .select("id author thread content")
      .populate("author", "id name avatar")
      .populate("thread", "title");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error voting.");
  }
});

module.exports = router;
