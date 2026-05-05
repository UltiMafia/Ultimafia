const axios = require("axios");
const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const { getBasicUserInfo } = require("../modules/redis");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
const router = express.Router();

router.get("/categories", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
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
            select:
              "id author title postDate viewCount replyCount deleted -_id",
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
    errors.serverError(res, "Failed to load forum categories. Please refresh and try again.");
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
      errors.notFound(res, "That board does not exist. It may have been removed.");
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
    errors.serverError(res, "Failed to load board. Please refresh and try again.");
  }
});

router.get("/thread/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var threadId = String(req.params.id);
    var page = Number(req.query.page) || 1;
    var reply = String(req.query.reply || "");

    // First, get the thread to calculate page count
    var thread = await models.ForumThread.findOne({ id: threadId })
      .populate("board", "id name -_id")
      .populate("author", "id -_id");

    if (!thread) {
      errors.notFound(res, "That thread does not exist. It may have been removed.");
      return;
    }

    // Handle "last" page parameter
    if (req.query.page === "last") {
      page = Math.ceil(thread.replyCount / constants.repliesPerPage) || 1;
    }

    if (reply) {
      reply = await models.ForumReply.findOne({ id: reply }).select("page");

      if (reply) page = reply.page;
    }

    var canViewDeleted = await routeUtils.verifyPermission(
      userId,
      "viewDeleted"
    );

    if (thread.deleted && !canViewDeleted) {
      errors.notFound(res, "That thread does not exist. It may have been removed.");
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

      // Add subscription status for current user
      var subscribers = thread.subscribers || [];
      thread.isSubscribed = subscribers.indexOf(userId) !== -1;

      // Get subscriber user info for popover
      thread.subscriberUsers = await Promise.all(
        subscribers.map(async (subId) => {
          return await redis.getBasicUserInfo(subId, true);
        })
      );
    }

    res.send(thread);

    if (req.query.page != null && req.query.reply == null) return;

    await models.ForumThread.updateOne(
      { id: threadId },
      { $inc: { viewCount: 1 } }
    ).exec();
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load thread. Please refresh and try again.");
  }
});

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
      errors.conflict(res, "A category with this name already exists.");
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
    errors.serverError(res, "Could not create category. Please try again.");
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
      errors.notFound(res, "That category does not exist.");
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
    errors.serverError(res, "Could not create board. Please try again.");
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
    errors.serverError(res, "Could not delete board. Please try again.");
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
    errors.serverError(res, "Could not update board description. Please try again.");
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
      errors.notFound(res, "That board does not exist. It may have been removed.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, board.rank)))
      return;

    if (!(await routeUtils.rateLimit(userId, "createThread", res))) return;

    var title = String(req.body.title);
    var content = String(req.body.content);

    if (title.length == 0 || title.length > constants.maxThreadTitleLength) {
      errors.unprocessable(
        res,
        `Title must be between 1 and ${constants.maxThreadTitleLength} characters.`
      );
      return;
    }

    if (
      content.length == 0 ||
      content.length > constants.maxThreadContentLength
    ) {
      errors.unprocessable(
        res,
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

    // Create poll if poll data is provided
    if (req.body.poll) {
      const pollData = req.body.poll;

      // Validate poll data
      if (
        !pollData.question ||
        !pollData.options ||
        !Array.isArray(pollData.options)
      ) {
        // Don't fail thread creation, just skip poll
        logger.warn("Invalid poll data provided for thread", thread.id);
      } else if (pollData.options.length < 2 || pollData.options.length > 10) {
        logger.warn("Invalid poll option count for thread", thread.id);
      } else {
        // Parse expiration time
        var expiresAt = null;
        if (pollData.expiration) {
          var expirationLength = routeUtils.parseTime(
            String(pollData.expiration)
          );
          if (expirationLength && expirationLength !== Infinity) {
            expiresAt = Date.now() + expirationLength;
          }
        }

        var poll = new models.Poll({
          id: shortid.generate(),
          threadId: thread.id,
          lobby: null, // Thread polls don't have lobbies
          title: pollData.question,
          question: pollData.question,
          options: pollData.options,
          creator: userId,
          created: Date.now(),
          expiresAt: expiresAt,
        });
        await poll.save();
      }
    }

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
    errors.serverError(res, "Could not create thread. Please try again.");
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
      errors.notFound(res, "That thread does not exist. It may have been removed.");
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
    errors.serverError(res, "Could not delete thread. Please try again.");
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
      errors.notFound(res, "That thread does not exist. It may have been removed.");
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
    errors.serverError(res, "Could not restore thread. Please try again.");
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
      errors.notFound(res, "That thread does not exist. It may have been removed.");
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
    errors.serverError(res, "Could not toggle pin on this thread. Please try again.");
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
      errors.notFound(res, "That thread does not exist. It may have been removed.");
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
    errors.serverError(res, "Could not toggle lock on this thread. Please try again.");
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
      errors.notFound(res, "That thread does not exist. It may have been removed.");
      return;
    }

    if (
      thread.author.id != userId ||
      !(await routeUtils.verifyPermission(res, userId, perm, thread.board.rank))
    ) {
      errors.forbidden(res, "You are unable to edit this thread.");
      return;
    }

    if (
      content.length == 0 ||
      content.length > constants.maxThreadContentLength
    ) {
      errors.unprocessable(
        res,
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
    errors.serverError(res, "Could not edit thread. Please try again.");
  }
});

router.post("/thread/notify", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var threadId = String(req.body.thread);

    var thread = await models.ForumThread.findOne({
      id: threadId,
      deleted: false,
    }).select("author subscribers replyNotify");

    if (!thread) {
      errors.notFound(res, "That thread does not exist. It may have been removed.");
      return;
    }

    // Check if user is the author
    var isAuthor = String(thread.author) === String(req.session.user._id);
    var subscribers = thread.subscribers || [];
    var isSubscribed = subscribers.indexOf(userId) !== -1;

    if (isAuthor) {
      // Author toggles replyNotify (backward compatibility)
      await models.ForumThread.updateOne(
        { id: threadId },
        { $set: { replyNotify: !thread.replyNotify } }
      ).exec();
    } else {
      // Non-author toggles subscription
      if (isSubscribed) {
        await models.ForumThread.updateOne(
          { id: threadId },
          { $pull: { subscribers: userId } }
        ).exec();
      } else {
        await models.ForumThread.updateOne(
          { id: threadId },
          { $addToSet: { subscribers: userId } }
        ).exec();
      }
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not update notification settings. Please try again.");
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
      errors.notFound(res, "That thread does not exist. It may have been removed.");
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
      errors.notFound(res, "That board does not exist. It may have been removed.");
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
    errors.serverError(res, "Could not move thread. Please try again.");
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
      .select("board author replyCount locked replyNotify subscribers")
      .populate("board", "id rank")
      .populate("author", "id");

    if (!thread) {
      errors.notFound(res, "That thread does not exist. It may have been removed.");
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
      errors.forbidden(res, "Thread is locked.");
      return;
    }

    var page =
      Math.ceil((thread.replyCount + 1) / constants.repliesPerPage) || 1;
    var content = String(req.body.content);

    if (content.length == 0 || content.length > constants.maxReplyLength) {
      errors.unprocessable(
        res,
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

    // Notify thread author if they have notifications enabled
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

    // Notify all subscribers (excluding the reply author)
    var subscribers = thread.subscribers || [];
    var subscribersToNotify = subscribers.filter(
      (subId) => subId !== userId && subId !== thread.author.id
    );

    if (subscribersToNotify.length > 0) {
      routeUtils.createNotification(
        {
          content: `${userName} replied to a thread you're following.`,
          icon: "reply",
          link: `/community/forums/thread/${threadId}?reply=${reply.id}`,
        },
        subscribersToNotify
      );
    }

    // Notify users whose replies were quoted in this post.
    // Quote links are inserted as:
    // /community/forums/thread/<threadId>?reply=<replyId>
    const quotedReplyIds = Array.from(
      new Set(
        [...content.matchAll(/\/community\/forums\/thread\/[^)\s?]+\?reply=([\w-]+)/g)]
          .map((match) => match[1])
          .filter(Boolean)
      )
    );

    if (quotedReplyIds.length > 0) {
      const quotedReplies = await models.ForumReply.find({
        id: { $in: quotedReplyIds },
      })
        .select("id author")
        .populate("author", "id");

      const quotedUserIds = Array.from(
        new Set(
          quotedReplies
            .map((quotedReply) => quotedReply.author?.id)
            .filter((quotedUserId) => quotedUserId && quotedUserId !== userId)
        )
      );

      if (quotedUserIds.length > 0) {
        routeUtils.createNotification(
          {
            content: `${userName} quoted your post.`,
            icon: "quote-left",
            link: `/community/forums/thread/${threadId}?reply=${reply.id}`,
          },
          quotedUserIds
        );
      }
    }

    res.send(String(page));
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not post reply. Please try again.");
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
      errors.notFound(res, "That reply does not exist. It may have been removed.");
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
    errors.serverError(res, "Could not delete reply. Please try again.");
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
      errors.notFound(res, "That reply does not exist. It may have been removed.");
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
    errors.serverError(res, "Could not restore reply. Please try again.");
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
      errors.notFound(res, "That reply does not exist. It may have been removed.");
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
      errors.forbidden(res, "You are unable to edit this reply.");
      return;
    }

    if (content.length == 0 || content.length > constants.maxReplyLength) {
      errors.unprocessable(
        res,
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
    errors.serverError(res, "Could not edit reply. Please try again.");
  }
});

router.get("/search", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var rank = userId ? await redis.getUserRank(userId) : 0;
    var canViewDeleted = await routeUtils.verifyPermission(
      userId,
      "viewDeleted"
    );

    var query = String(req.query.query || "");
    var username = String(req.query.username || "");
    var boardId = String(req.query.boardId || "");
    var page = Number(req.query.page) || 1;
    var limit = Number(req.query.limit) || 20;
    var skip = (page - 1) * limit;

    // Build search filters
    var threadFilter = {};
    var replyFilter = {};

    // Board filter
    if (boardId) {
      var board = await models.ForumBoard.findOne({ id: boardId })
        .select("_id rank")
        .populate("category", "rank");

      if (!board || board.category.rank > rank) {
        errors.notFound(res, "That board does not exist or you don't have access.");
        return;
      }

      threadFilter.board = board._id;
      replyFilter.thread = {
        $in: await models.ForumThread.find({ board: board._id }).select("_id"),
      };
    }

    // User filter
    if (username) {
      var user = await models.User.findOne({
        name: new RegExp(username, "i"),
      }).select("_id");
      if (user) {
        threadFilter.author = user._id;
        replyFilter.author = user._id;
      } else {
        // If user not found, return empty results
        res.send({
          threads: [],
          replies: [],
          totalThreads: 0,
          totalReplies: 0,
          page: page,
          totalPages: 0,
        });
        return;
      }
    }

    // Content search filter
    if (query) {
      var contentRegex = new RegExp(
        query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      threadFilter.$or = [{ title: contentRegex }, { content: contentRegex }];
      replyFilter.content = contentRegex;
    }

    // Deleted content filter
    if (!canViewDeleted) {
      threadFilter.deleted = false;
      replyFilter.deleted = false;
    }

    // Get threads
    var threads = await models.ForumThread.find(threadFilter)
      .select(
        "id author title content postDate bumpDate replyCount voteCount viewCount board -_id"
      )
      .populate("author", "id name avatar -_id")
      .populate("board", "id name -_id")
      .sort("-bumpDate")
      .skip(skip)
      .limit(limit);

    // Get replies
    var replies = await models.ForumReply.find(replyFilter)
      .select("id author thread content postDate voteCount -_id")
      .populate("author", "id name avatar -_id")
      .populate({
        path: "thread",
        select: "id title board -_id",
        populate: {
          path: "board",
          select: "id name -_id",
        },
      })
      .sort("-postDate")
      .skip(skip)
      .limit(limit);

    // Get total counts for pagination
    var totalThreads = await models.ForumThread.countDocuments(threadFilter);
    var totalReplies = await models.ForumReply.countDocuments(replyFilter);

    // Process results
    for (let i in threads) {
      let thread = threads[i].toJSON();
      thread.author = await redis.getBasicUserInfo(thread.author.id, true);
      threads[i] = thread;
    }

    for (let i in replies) {
      let reply = replies[i].toJSON();
      reply.author = await redis.getBasicUserInfo(reply.author.id, true);
      replies[i] = reply;
    }

    res.send({
      threads: threads,
      replies: replies,
      totalThreads: totalThreads,
      totalReplies: totalReplies,
      page: page,
      totalPages: Math.ceil(Math.max(totalThreads, totalReplies) / limit),
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to search forums. Please refresh and try again.");
  }
});

router.get("/search/boards", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var rank = userId ? await redis.getUserRank(userId) : 0;

    var boards = await models.ForumBoard.find({})
      .select("id name category -_id")
      .populate("category", "id name rank -_id")
      .sort("name");

    // Filter boards by user rank
    boards = boards.filter((board) => board.category.rank <= rank);

    res.send(boards);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load boards. Please refresh and try again.");
  }
});

module.exports = router;
