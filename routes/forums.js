const axios = require("axios");
const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const logger = require("../modules/logging")(".");

const router = express.Router();

router.get("/categories", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);
    const rank = userId ? await redis.getUserRank(userId) : 0;
    const categories = await models.ForumCategory.find({ rank: { $lte: rank } })
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

    for (const category of categories)
      for (const board of category.boards)
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

router.get("/board/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const sortTypes = ["bumpDate", "postDate", "replyCount", "voteCount"];

    const userId = await routeUtils.verifyLoggedIn(req, true);
    const rank = userId ? await redis.getUserRank(userId) : 0;
    const boardId = String(req.params.id);
    let sortType = String(req.query.sortType);
    const last = Number(req.query.last);
    const first = Number(req.query.first);

    let board = await models.ForumBoard.findOne({ id: boardId })
      .select("id name icon category")
      .populate("category", "id name rank -_id");

    if (!board || board.category.rank > rank) {
      res.status(500);
      res.end("Board not found");
      return;
    }

    const threadFilter = { board: board._id, pinned: false };

    if (!(await routeUtils.verifyPermission(userId, "viewDeleted")))
      threadFilter.deleted = false;

    if (sortTypes.indexOf(sortType) == -1) sortType = "bumpDate";

    let threads = await routeUtils.modelPageQuery(
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

    const pinnedThreads = await models.ForumThread.find({
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

    for (const i in threads) {
      const thread = threads[i].toJSON();
      thread.author = await redis.getBasicUserInfo(thread.author.id, true);
      threads[i] = thread;
    }

    for (const i in pinnedThreads) {
      const thread = pinnedThreads[i].toJSON();
      thread.author = await redis.getBasicUserInfo(thread.author.id, true);
      pinnedThreads[i] = thread;
    }

    const votes = {};
    const threadIds = threads.map((thread) => thread.id);

    if (userId) {
      const voteList = await models.ForumVote.find({
        voter: userId,
        item: { $in: threadIds },
      }).select("item direction");

      for (const vote of voteList) votes[vote.item] = vote.direction;

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

router.get("/thread/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);
    const threadId = String(req.params.id);
    let page = Number(req.query.page) || 1;
    let reply = String(req.query.reply || "");

    if (reply) {
      reply = await models.ForumReply.findOne({ id: reply }).select("page");

      if (reply) page = reply.page;
    }

    let thread = await models.ForumThread.findOne({ id: threadId })
      .populate("board", "id name -_id")
      .populate("author", "id -_id");

    const canViewDeleted = await routeUtils.verifyPermission(
      userId,
      "viewDeleted"
    );

    if (!thread || (thread.deleted && !canViewDeleted)) {
      res.status(500);
      res.send("Thread not found.");
      return;
    }

    let vote;

    if (userId) {
      vote = await models.ForumVote.findOne({
        voter: userId,
        item: threadId,
      }).select("direction");
    }

    const replyFilter = { thread: thread._id, page };

    if (!canViewDeleted) replyFilter.deleted = false;

    const replies = await models.ForumReply.find(replyFilter)
      .select("id author content page postDate voteCount deleted -_id")
      .populate("author", "id -_id")
      .sort("postDate");

    for (const i in replies) {
      const reply = replies[i].toJSON();
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
      for (const reply of replies) {
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

router.post("/category", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const perm = "createCategory";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const name = routeUtils
      .strParseAlphaNum(req.body.name)
      .slice(0, constants.maxCategoryNameLength);
    const rank = Number(req.body.rank) || 0;
    const position = Number(req.body.position) || 0;

    let category = await models.ForumCategory.findOne({
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

router.post("/board", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const perm = "createBoard";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const name = String(req.body.name).slice(0, constants.maxBoardNameLength);
    const categoryName = routeUtils.strParseAlphaNum(req.body.category);
    const description = String(req.body.description).slice(
      0,
      constants.maxBoardDescLength
    );
    const icon = String(req.body.icon || "").slice(0, 50);
    const rank = Number(req.body.rank) || 0;
    const position = Number(req.body.position) || 0;

    const category = await models.ForumCategory.findOne({
      name: new RegExp(categoryName, "i"),
    }).select("_id");

    if (!category) {
      res.status(500);
      res.send("Category does not exist.");
      return;
    }

    const board = new models.ForumBoard({
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

router.post("/board/delete", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const rank = await redis.getUserRank(userId);
    const perm = "deleteBoard";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const name = String(req.body.name);
    await models.ForumBoard.deleteOne({ name, rank: { $lte: rank } }).exec();

    routeUtils.createModAction(userId, "Delete Forum Board", [name]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating board.");
  }
});

router.post("/board/updateDescription", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const perm = "updateBoard";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const name = String(req.body.name);
    const description = String().slice(0, constants.maxBoardDescLength);

    await models.ForumBoard.updateOne(
      { id: boardId },
      { $set: { description } }
    ).exec();

    routeUtils.createModAction(userId, "Update Board Description", [name]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating board.");
  }
});

router.post("/thread", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const boardId = String(req.body.board);
    const perm = "createThread";

    const board = await models.ForumBoard.findOne({ id: boardId }).select(
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

    const title = String(req.body.title);
    const content = String(req.body.content);

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

    const thread = new models.ForumThread({
      id: shortid.generate(),
      board: board._id,
      author: req.session.user._id,
      title,
      content,
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
      const useWebook = alertSettings.find(
        (curWebook) => curWebook.boards.indexOf(board.id) !== -1
      );

      if (useWebook) {
        await axios({
          method: "post",
          url: useWebook.hook,
          data: {
            content: `New thread in ${board.name}`,
            embeds: [
              {
                url: `${process.env.BASE_URL}/community/forums/thread/${thread.id}`,
                title,
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

router.post("/thread/delete", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const threadId = String(req.body.thread);
    const perm1 = "deleteOwnPost";
    const perm2 = "deleteAnyPost";

    const thread = await models.ForumThread.findOne({
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

router.post("/thread/restore", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const threadId = String(req.body.thread);
    const perm = "restoreDeleted";

    const thread = await models.ForumThread.findOne({
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

router.post("/thread/togglePinned", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const threadId = String(req.body.thread);
    const perm = "pinThreads";

    const thread = await models.ForumThread.findOne({
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

router.post("/thread/toggleLocked", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const threadId = String(req.body.thread);
    const perm = "lockThreads";

    const thread = await models.ForumThread.findOne({
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

router.post("/thread/edit", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const threadId = String(req.body.thread);
    const content = String(req.body.content);
    const perm = "editPost";

    const thread = await models.ForumThread.findOne({
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
      { $set: { content } }
    ).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error editing reply.");
  }
});

router.post("/thread/notify", async (req, res) => {
  try {
    const threadId = String(req.body.thread);

    const thread = await models.ForumThread.findOne({
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

router.post("/thread/move", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const threadId = String(req.body.thread);
    const boardName = routeUtils.strParseAlphaNum(req.body.board);
    const perm = "moveThread";

    const thread = await models.ForumThread.findOne({ id: threadId })
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

    const board = await models.ForumBoard.findOne({
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

router.post("/reply", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const userName = await redis.getUserName(userId);
    const threadId = String(req.body.thread);
    const perm = "postReply";

    const thread = await models.ForumThread.findOne({
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

    const page =
      Math.ceil((thread.replyCount + 1) / constants.repliesPerPage) || 1;
    const content = String(req.body.content);

    if (content.length == 0 || content.length > constants.maxReplyLength) {
      res.status(500);
      res.send(
        `Content must be between 1 and ${constants.maxReplyLength} characters.`
      );
      return;
    }

    const reply = new models.ForumReply({
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

    const pingedNames = content.match(/@[\w-]+/g);

    if (pingedNames) {
      const pingedName = new RegExp(
        `^${pingedNames[0].replace("@", "")}$`,
        "i"
      );
      const pingedUser = await models.User.findOne({ name: pingedName }).select(
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

router.post("/reply/delete", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const replyId = String(req.body.reply);
    const perm1 = "deleteOwnPost";
    const perm2 = "deleteAnyPost";

    const reply = await models.ForumReply.findOne({
      id: replyId,
      deleted: false,
    })
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

router.post("/reply/restore", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const replyId = String(req.body.reply);
    const perm = "restoreDeleted";

    const reply = await models.ForumReply.findOne({ id: replyId })
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

router.post("/reply/edit", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const replyId = String(req.body.reply);
    const content = String(req.body.content);
    const perm = "editPost";

    const reply = await models.ForumReply.findOne({
      id: replyId,
      deleted: false,
    })
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
      { $set: { content } }
    ).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error editing reply.");
  }
});

router.post("/vote", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const itemId = String(req.body.item);
    const itemType = String(req.body.itemType);
    const perm = "vote";
    let itemModel;

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

    const item = await itemModel
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

    const requiredRank =
      (item.board && item.board.rank) ||
      (item.thread && item.thread.board && item.thread.board.rank) ||
      0;

    if (!(await routeUtils.verifyPermission(res, userId, perm, requiredRank)))
      return;

    if (!(await routeUtils.rateLimit(userId, "vote", res))) return;

    const direction = Number(req.body.direction);

    if (direction != 1 && direction != -1) {
      res.status(500);
      res.send("Bad vote direction");
      return;
    }

    let vote = await models.ForumVote.findOne({ voter: userId, item: itemId });

    if (!vote) {
      vote = new models.ForumVote({
        voter: userId,
        item: itemId,
        direction,
      });
      await vote.save();

      await itemModel
        .updateOne({ id: itemId }, { $inc: { voteCount: direction } })
        .exec();

      res.send(String(direction));
    } else if (vote.direction != direction) {
      await models.ForumVote.updateOne(
        { voter: userId, item: itemId },
        { $set: { direction } }
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

router.get("/search", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const query = String(req.query.query);
    const user = String(req.query.user);
    const last = String(req.query.last);

    const threads = await models.ForumThread.find({})
      .select("id author title content")
      .populate("author", "id name avatar");
    const replies = await models.ForumReply.find()
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
