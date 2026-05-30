const axios = require("axios");
const shortid = require("shortid");
const models = require("../db/models");
const routeUtils = require("../routes/utils");
const redis = require("./redis");
const logger = require("./logging")(".");
const { violationDefinitions } = require("../data/violations");

/**
 * Escapes characters for a regular expression.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Helper to extract JSON from model responses that might contain markdown blocks.
 */
function parseResponseText(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "");
    cleaned = cleaned.replace(/```$/, "");
    cleaned = cleaned.trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Gathers context about the report from game logs (if gameId is present)
 * and the reported user's recent global/room chat messages.
 */
async function gatherContext(report) {
  let context = "";

  // 1. Gather game history if gameId is present
  if (report.gameId) {
    try {
      const game = await models.Game.findOne({ id: report.gameId });
      if (game && game.history) {
        let history;
        try {
          history = JSON.parse(game.history);
        } catch (parseErr) {
          logger.error(`Error parsing game history for game ${report.gameId}:`, parseErr);
        }

        if (history) {
          context += `Game ID: ${game.id}\n`;
          context += `Game Type: ${game.type || "Unknown"}\n`;
          context += `Lobby Name: ${game.lobbyName || ""}\n`;
          context += `Players in game: ${game.names ? game.names.join(", ") : ""}\n`;
          context += `Winners Info: ${game.winnersInfo ? JSON.stringify(game.winnersInfo) : ""}\n\n`;

          // Map userIds to playerIds and vice-versa
          let reportedPlayerId = report.reportedUserId;
          const playerIdToName = {};

          if (game.playerIdMap) {
            try {
              const idMap = JSON.parse(game.playerIdMap);
              if (idMap[report.reportedUserId]) {
                reportedPlayerId = idMap[report.reportedUserId];
              }
            } catch (err) {
              logger.warn("Could not parse playerIdMap:", err);
            }
          }

          if (game.players && game.names) {
            for (let i = 0; i < game.players.length; i++) {
              playerIdToName[game.players[i]] = game.names[i];
            }
          }

          // Parse and append player roles and alignments
          if (game.playerRoleMap) {
            try {
              const roleMap = JSON.parse(game.playerRoleMap);
              const alignmentMap = game.playerAlignmentMap ? JSON.parse(game.playerAlignmentMap) : {};
              let rolesBlock = "--- Player Roles & Alignments ---\n";
              
              const idMap = game.playerIdMap ? JSON.parse(game.playerIdMap) : {};

              for (const uId in roleMap) {
                const pId = idMap[uId] || uId;
                const name = playerIdToName[pId] || pId;
                const role = roleMap[uId];
                const alignment = alignmentMap[uId] || "Unknown";
                rolesBlock += `- ${name} (${pId}): Role: ${role}, Alignment: ${alignment}\n`;
              }
              context += rolesBlock + "\n";
            } catch (err) {
              logger.warn("Could not parse playerRoleMap:", err);
            }
          }

          // Extract game messages from history states
          let messages = [];

          // The history object maps state numbers directly at the top level
          for (const key in history) {
            const state = history[key];
            if (state && typeof state === "object" && (state.meetings || state.alerts)) {
              const stateName = state.name || `State ${key}`;

              // Extract from meetings
              if (state.meetings) {
                for (const meetingId in state.meetings) {
                  const meeting = state.meetings[meetingId];
                  if (meeting && meeting.messages && Array.isArray(meeting.messages)) {
                    for (const msg of meeting.messages) {
                      messages.push({
                        senderId: msg.senderId,
                        content: msg.content,
                        time: msg.time || 0,
                        stateName: stateName,
                        meetingName: meeting.name || meetingId,
                      });
                    }
                  }
                }
              }

              // Extract from alerts (global announcements or messages)
              if (state.alerts && Array.isArray(state.alerts)) {
                for (const alert of state.alerts) {
                  if (alert && (alert.content || alert.message)) {
                    messages.push({
                      senderId: alert.senderId || "server",
                      content: alert.content || alert.message,
                      time: alert.time || 0,
                      stateName: stateName,
                      meetingName: "Alerts",
                    });
                  }
                }
              }
            }
          }

          // Sort messages chronologically
          messages.sort((a, b) => a.time - b.time);

          // Find indices of messages sent by reported user
          const targetIndices = [];
          messages.forEach((msg, idx) => {
            if (msg.senderId === reportedPlayerId) {
              targetIndices.push(idx);
            }
          });

          // Collect message indices with up to 5 preceding and 5 succeeding messages for context
          const messageSet = new Set();
          targetIndices.forEach((idx) => {
            const start = Math.max(0, idx - 5);
            const end = Math.min(messages.length - 1, idx + 5);
            for (let i = start; i <= end; i++) {
              messageSet.add(i);
            }
          });

          const selectedMessages = Array.from(messageSet)
            .sort((a, b) => a - b)
            .map((idx) => messages[idx]);

          context += `--- Game Chat Logs (Reported User & Conversational Context) ---\n`;
          if (selectedMessages.length > 0) {
            selectedMessages.forEach((msg) => {
              const senderName = playerIdToName[msg.senderId] || msg.senderId;
              context += `[State: ${msg.stateName}, Meeting: ${msg.meetingName}] ${senderName} (${msg.senderId}): "${msg.content}"\n`;
            });
          } else {
            context += `No game chat messages found for reported user.\n`;
          }
        }
      }
    } catch (e) {
      logger.error(`Error gathering game context for report ${report.id}:`, e);
    }
  }

  // 2. Gather recent ChatMessages (Global / Room Chats) from the reported user
  try {
    const chatMessages = await models.ChatMessage.find({
      senderId: report.reportedUserId,
    })
      .sort({ date: -1 })
      .limit(30);

    if (chatMessages && chatMessages.length > 0) {
      context += `\n--- Recent Global/Room Chat Messages by Reported User ---\n`;
      // Reverse to chronological order
      chatMessages.reverse().forEach((msg) => {
        context += `[Channel: ${msg.channel}] User ${msg.senderId}: "${msg.content}" (at ${new Date(msg.date).toISOString()})\n`;
      });
    }
  } catch (e) {
    logger.error(`Error gathering general chat context for report ${report.id}:`, e);
  }

  // 3. Gather previous violation tickets (rap sheet) of the reported user
  try {
    const pastTickets = await models.ViolationTicket.find({
      userId: report.reportedUserId,
    }).sort({ createdAt: -1 });

    if (pastTickets && pastTickets.length > 0) {
      context += `\n--- Reported User's Previous Violations (Rap Sheet) ---\n`;
      pastTickets.forEach((ticket, idx) => {
        const dateStr = new Date(ticket.createdAt).toISOString();
        context += `${idx + 1}. Date: ${dateStr}\n`;
        context += `   Violation: ${ticket.violationName}\n`;
        context += `   Category: ${ticket.violationCategory || "Community"}\n`;
        context += `   Ban Type: ${ticket.banType}\n`;
        context += `   Length: ${ticket.length === Infinity || ticket.length === 0 ? "Permanent" : (ticket.length / 3600000) + " hours"}\n`;
        context += `   Notes: "${ticket.notes || ""}"\n`;
      });
    } else {
      context += `\n--- Reported User has no previous violations (Clean Rap Sheet) ---\n`;
    }
  } catch (err) {
    logger.error(`Error gathering rap sheet for user ${report.reportedUserId}:`, err);
  }

  return context;
}

/**
 * Calls the designated LLM provider API with the generated prompt.
 */
async function callLLM(provider, model, apiKey, prompt) {
  if (!apiKey) {
    throw new Error(`API key is missing for provider: ${provider}`);
  }

  // Define JSON schema for Gemini (uppercase types)
  const geminiSchema = {
    type: "OBJECT",
    properties: {
      isViolation: { type: "BOOLEAN", description: "Whether a rule violation has occurred." },
      confidence: { type: "NUMBER", description: "Confidence score between 0.0 and 1.0." },
      rule: { type: "STRING", description: "Exact name of the rule violated, or null if no violation." },
      category: { type: "STRING", description: "Category of the rule ('Community', 'Game', or null)." },
      reasoning: { type: "STRING", description: "Detailed explanation of your reasoning." },
      recommendedAction: { type: "STRING", description: "Recommended action ('dismiss', 'warning', or 'ban')." },
      banType: { type: "STRING", description: "Ban type if recommending a ban: 'forum', 'chat', 'game', 'ranked', 'competitive', 'site', or null." },
      banLength: { type: "STRING", description: "Ban duration string from the rule's offenses list, or null." },
      notes: { type: "STRING", description: "Public moderation note explaining the verdict." }
    },
    required: [
      "isViolation",
      "confidence",
      "rule",
      "category",
      "reasoning",
      "recommendedAction",
      "banType",
      "banLength",
      "notes"
    ]
  };

  // Define JSON schema for OpenAI (strict schema)
  const openaiSchema = {
    type: "object",
    properties: {
      isViolation: { type: "boolean" },
      confidence: { type: "number" },
      rule: { type: ["string", "null"] },
      category: { type: ["string", "null"] },
      reasoning: { type: "string" },
      recommendedAction: { type: "string", enum: ["dismiss", "warning", "ban"] },
      banType: { type: ["string", "null"], enum: ["forum", "chat", "game", "ranked", "competitive", "site", null] },
      banLength: { type: ["string", "null"] },
      notes: { type: "string" }
    },
    required: [
      "isViolation",
      "confidence",
      "rule",
      "category",
      "reasoning",
      "recommendedAction",
      "banType",
      "banLength",
      "notes"
    ],
    additionalProperties: false
  };

  switch (provider.toLowerCase()) {
    case "gemini": {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-3.5-flash"}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: geminiSchema,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE",
            },
          ],
        },
        { timeout: 15000 }
      );
      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts[0]
      ) {
        return response.data.candidates[0].content.parts[0].text;
      }
      throw new Error(`Invalid response structure from Gemini API: ${JSON.stringify(response.data)}`);
    }

    case "openai": {
      const url = "https://api.openai.com/v1/chat/completions";
      const response = await axios.post(
        url,
        {
          model: model || "gpt-5.5",
          messages: [
            {
              role: "system",
              content: "You are a moderation assistant. You must respond in the exact JSON format requested.",
            },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "moderation_response",
              strict: true,
              schema: openaiSchema,
            }
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );
      if (
        response.data &&
        response.data.choices &&
        response.data.choices[0] &&
        response.data.choices[0].message
      ) {
        return response.data.choices[0].message.content;
      }
      throw new Error(`Invalid response structure from OpenAI API: ${JSON.stringify(response.data)}`);
    }

    case "anthropic": {
      const url = "https://api.anthropic.com/v1/messages";
      const response = await axios.post(
        url,
        {
          model: model || "claude-sonnet-4-6",
          max_tokens: 4000,
          system: "You are a moderation assistant. You must respond with a JSON object.",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );
      if (
        response.data &&
        response.data.content &&
        response.data.content[0]
      ) {
        return response.data.content[0].text;
      }
      throw new Error(`Invalid response structure from Anthropic API: ${JSON.stringify(response.data)}`);
    }

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Executes warning, ban, or dismissal ruling on the report.
 */
async function executeAutoResolution(report, recommendation) {
  const altAccountIds = await routeUtils.getAltAccountIds(report.reportedUserId);
  const reportedUserInfo = await redis.getBasicUserInfo(report.reportedUserId);
  const reportedName = reportedUserInfo?.name || report.reportedUserId;
  const reporterIds = routeUtils
    .getReportReporters(report)
    .map((r) => r.userId)
    .filter((id, i, arr) => arr.indexOf(id) === i);

  const { recommendedAction, rule, notes, banType, banLength } = recommendation;
  const now = Date.now();

  if (recommendedAction === "dismiss" || !recommendation.isViolation) {
    // Dismiss report
    report.finalRuling = notes
      ? { notes: notes }
      : { notes: "Dismissed automatically by AI Moderator (no violation detected)." };
    report.status = "complete";
    report.completedAt = now;
    report.completedBy = "AI Moderator";
    report.updatedAt = now;
    report.assignees = ["AI Moderator"];

    report.history.push({
      status: "complete",
      changedBy: "AI Moderator",
      timestamp: now,
      action: "completed",
      note: notes ? `Report dismissed - no violation. Notes: ${notes}` : "Report dismissed - no violation",
    });

    await report.save();

    await routeUtils.createModAction("AI Moderator", "Complete Report (Dismissed)", [
      report.id,
      reportedName,
      "dismissed",
    ]);

    await routeUtils.createNotification(
      {
        content: `Your report on ${reportedName} has been completed. No violation was issued.`,
        icon: "flag",
      },
      reporterIds
    );

    logger.info(`Report ${report.id} auto-dismissed by AI Moderator.`);
    return;
  }

  if (recommendedAction === "warning") {
    // Issue Warning
    const warningNotes = notes || "Issued automatically by AI Moderator.";
    report.finalRuling = {
      warning: true,
      notes: warningNotes,
    };
    report.status = "complete";
    report.completedAt = now;
    report.completedBy = "AI Moderator";
    report.updatedAt = now;
    report.assignees = ["AI Moderator"];

    report.history.push({
      status: "complete",
      changedBy: "AI Moderator",
      timestamp: now,
      action: "completed",
      note: `Warning issued. Notes: ${warningNotes}`,
    });

    await report.save();

    await routeUtils.createModAction("AI Moderator", "Complete Report (Warning)", [
      report.id,
      reportedName,
      "warning",
    ]);

    await routeUtils.createNotification(
      {
        content: `Your report on ${reportedName} has been completed. A warning was issued.`,
        icon: "flag",
      },
      reporterIds
    );

    // Notify reported user and their alt accounts
    await routeUtils.createNotification(
      {
        content: `You have received a warning violation. Notes: ${warningNotes}`,
        icon: "ban",
        link: `/user/${report.reportedUserId}`,
      },
      altAccountIds
    );

    logger.info(`Warning auto-issued on report ${report.id} by AI Moderator.`);
    return;
  }

  if (recommendedAction === "ban") {
    const validBanTypes = ["forum", "chat", "game", "ranked", "competitive", "site"];
    const resolvedBanType = validBanTypes.includes(banType) ? banType : "site";

    // Validate that rule is valid
    const violationDef = violationDefinitions.find((v) => v.name === rule || v.id === rule);
    if (!violationDef) {
      throw new Error(`AI resolved an invalid rule name: ${rule}`);
    }

    const ruleName = violationDef.name;
    const category = violationDef.category || "Community";

    // Stop auto-bans of staff
    const targetRank = await redis.getUserRank(report.reportedUserId);
    if (targetRank !== null && targetRank > 0) {
      throw new Error(`Reported user ${report.reportedUserId} is staff (rank ${targetRank}). Aborting automatic ban.`);
    }

    // Determine offense number based on active/previous violation tickets
    const existingTicketsCount = await models.ViolationTicket.countDocuments({
      userId: report.reportedUserId,
      violationName: new RegExp("^" + escapeRegExp(ruleName), "i"),
    });
    const offenseNumber = existingTicketsCount + 1;

    const ordinalSuffixes = ["th", "st", "nd", "rd"];
    const getOrdinal = (n) => {
      const v = n % 100;
      return n + (ordinalSuffixes[(v - 20) % 10] || ordinalSuffixes[v] || ordinalSuffixes[0]);
    };
    const violationName = `${ruleName} (${getOrdinal(offenseNumber)} Offense)`;
    const violationId = shortid.generate();

    // Determine ban length
    const offenseIndex = Math.min(offenseNumber - 1, violationDef.offenses.length - 1);
    const banLengthStr = banLength || violationDef.offenses[offenseIndex] || "24 hours";

    let banLengthMs = 0;
    if (
      banLengthStr.toLowerCase() === "permaban" ||
      banLengthStr.toLowerCase() === "permanent" ||
      banLengthStr.toLowerCase() === "loss of privilege" ||
      banLengthStr === "-"
    ) {
      banLengthMs = 0; // permanent in banUser
    } else {
      const match = banLengthStr.match(/^(\d+)\s+(hour|day|week|month)s?$/i);
      if (match) {
        const amount = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        const unitMs = {
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
        };
        banLengthMs = amount * (unitMs[unit] || 24 * 60 * 60 * 1000);
      } else {
        banLengthMs = 24 * 60 * 60 * 1000; // default 24h
      }
    }

    const banPermissions = {
      forum: ["vote", "createThread", "postReply", "deleteOwnPost", "editPost"],
      chat: ["publicChat", "privateChat"],
      game: ["playGame"],
      ranked: ["playRanked", "playCompetitive"],
      competitive: ["playCompetitive"],
      site: ["signIn"],
    };
    const banDbTypes = {
      forum: "forum",
      chat: "chat",
      game: "game",
      ranked: "playRanked",
      competitive: "playCompetitive",
      site: "site",
    };

    const permissions = banPermissions[resolvedBanType] || [];
    const banDbType = banDbTypes[resolvedBanType] || "site";

    // Issue bans for all alt accounts
    let primaryBan = null;
    let bans = [];
    if (banLengthMs >= 0 && permissions.length > 0) {
      const banPromises = altAccountIds.map((altUserId) =>
        routeUtils.banUser(
          altUserId,
          banLengthMs,
          permissions,
          banDbType,
          "AI Moderator"
        )
      );
      bans = await Promise.all(banPromises);
      primaryBan = bans[0];

      const modActionNames = {
        forum: "Forum Ban",
        chat: "Chat Ban",
        game: "Game Ban",
        ranked: "Ranked Ban",
        competitive: "Competitive Ban",
        site: "Site Ban",
      };

      await routeUtils.createModAction("AI Moderator", modActionNames[resolvedBanType], [
        reportedName,
        banLengthStr,
      ]);

      if (resolvedBanType === "site") {
        await models.User.updateMany(
          { id: { $in: altAccountIds } },
          { $set: { banned: true } }
        ).exec();
        await models.Session.deleteMany({
          "session.user.id": { $in: altAccountIds },
        }).exec();
      }
    }

    // Create violation tickets for all accounts
    const activityPeriodMs =
      category === "Game"
        ? 3 * 30 * 24 * 60 * 60 * 1000 // 3 months
        : 6 * 30 * 24 * 60 * 60 * 1000; // 6 months
    const activeUntil = now + activityPeriodMs;

    const ticketPromises = altAccountIds.map((altUserId, index) => {
      const linkedBan = bans && index < bans.length ? bans[index] : primaryBan;
      return routeUtils.createViolationTicket({
        userId: altUserId,
        modId: "AI Moderator",
        banType: resolvedBanType,
        violationId: violationId,
        violationName: violationName,
        violationCategory: category,
        notes: notes || "",
        length: banLengthMs === 0 ? Infinity : banLengthMs,
        expiresAt: linkedBan ? linkedBan.expires : null,
        activeUntil: activeUntil,
        linkedBanId: linkedBan ? linkedBan.id : null,
      });
    });

    const tickets = await Promise.all(ticketPromises);
    const primaryTicket = tickets[0];

    // Notify reported user + alts
    const banExpires = primaryBan && primaryBan.expires > 0 ? new Date(primaryBan.expires) : null;
    const banMessage =
      banLengthMs === 0 || banLengthMs === Infinity
        ? "You have been permanently banned."
        : `Ban expires on ${banExpires ? banExpires.toLocaleString() : "N/A"}.`;

    await routeUtils.createNotification(
      {
        content: `You have received a ${violationName} violation. ${banMessage}`,
        icon: "ban",
        link: `/user/${report.reportedUserId}`,
      },
      altAccountIds
    );

    // Save final ruling details on the report
    report.finalRuling = {
      violationId: violationId,
      violationName: violationName,
      violationCategory: category,
      banType: resolvedBanType,
      banLength: banLengthStr,
      banLengthMs: banLengthMs === 0 ? Infinity : banLengthMs,
      notes: notes || "",
    };
    report.linkedViolationTicketId = primaryTicket ? primaryTicket.id : null;
    report.linkedBanId = primaryBan ? primaryBan.id : null;
    report.status = "complete";
    report.completedAt = now;
    report.completedBy = "AI Moderator";
    report.updatedAt = now;
    report.assignees = ["AI Moderator"];

    report.history.push({
      status: "complete",
      changedBy: "AI Moderator",
      timestamp: now,
      action: "completed",
      note: `Violation: ${violationName}`,
    });

    await report.save();

    await routeUtils.createModAction("AI Moderator", "Complete Report", [
      report.id,
      reportedName,
      violationId,
    ]);

    // Notify reporters
    const verdictSentence =
      banLengthMs === 0
        ? `A violation was issued and the user has been ${resolvedBanType} banned permanently.`
        : `A violation was issued and the user has been ${resolvedBanType} banned for ${banLengthStr}.`;

    await routeUtils.createNotification(
      {
        content: `Your report on ${reportedName} has been completed. ${verdictSentence}`,
        icon: "flag",
      },
      reporterIds
    );

    logger.info(`Report ${report.id} auto-resolved with BAN by AI Moderator.`);
  }
}

/**
 * Core function to moderate a report using the configured LLM.
 */
async function moderateReport(reportId) {
  const enabled = process.env.AI_MOD_ENABLED === "true";
  if (!enabled) {
    logger.debug(`AI Moderation is disabled. Skipping report ${reportId}`);
    return;
  }

  try {
    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      logger.error(`AI Moderation: Report ${reportId} not found in database.`);
      return;
    }

    if (report.status === "complete") {
      logger.debug(`AI Moderation: Report ${reportId} is already completed. Skipping.`);
      return;
    }

    if (report.aiRecommendation && report.aiRecommendation.evaluatedAt) {
      logger.debug(`AI Moderation: Report ${reportId} has already been evaluated by AI. Skipping.`);
      return;
    }

    if (report.gameId) {
      const game = await models.Game.findOne({ id: report.gameId });
      if (!game) {
        logger.info(`AI Moderation: Game ${report.gameId} for Report ${reportId} has not completed yet. Deferring evaluation.`);
        return;
      }
    }

    const provider = process.env.AI_MOD_PROVIDER || "gemini";
    let model = "";
    let apiKey = "";

    if (provider === "gemini") {
      apiKey = process.env.GEMINI_API_KEY;
      model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    } else if (provider === "openai") {
      apiKey = process.env.OPENAI_API_KEY;
      model = process.env.OPENAI_MODEL || "gpt-5.5";
    } else if (provider === "anthropic") {
      apiKey = process.env.ANTHROPIC_API_KEY;
      model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    } else {
      logger.error(`AI Moderation: Unknown provider ${provider}. Skipping.`);
      return;
    }

    logger.info(`AI Moderation: Starting evaluation for Report ${reportId} using ${provider} (${model})...`);

    // Gather conversational and game contexts
    const contextText = await gatherContext(report);

    // Format prompt
    const prompt = generatePrompt(report, contextText);

    // Call LLM
    const rawResultText = await callLLM(provider, model, apiKey, prompt);

    // Parse recommendation JSON
    let recommendation;
    try {
      recommendation = parseResponseText(rawResultText);
    } catch (parseError) {
      logger.error(`AI Moderation: Failed to parse LLM JSON response. Raw output: ${rawResultText}`, parseError);
      return;
    }

    logger.info(`AI Moderation recommendation for Report ${reportId}:`, JSON.stringify(recommendation));

    // Save AI Recommendation to Report
    report.aiRecommendation = {
      isViolation: recommendation.isViolation || false,
      confidence: recommendation.confidence || 0,
      rule: recommendation.rule || null,
      category: recommendation.category || null,
      reasoning: recommendation.reasoning || "",
      recommendedAction: recommendation.recommendedAction || "dismiss",
      banType: recommendation.banType || null,
      banLength: recommendation.banLength || null,
      notes: recommendation.notes || "",
      evaluatedAt: Date.now(),
      provider: provider,
      model: model,
    };

    const autoResolve = process.env.AI_MOD_AUTO_RESOLVE === "true";
    const minConfidence = parseFloat(process.env.AI_MOD_MIN_CONFIDENCE || "0.85");

    if (autoResolve && recommendation.confidence >= minConfidence) {
      logger.info(`AI Moderation: Executing auto-resolution on Report ${reportId} (confidence ${recommendation.confidence} >= threshold ${minConfidence})`);
      await executeAutoResolution(report, recommendation);
    } else {
      // Save the recommendation and add a history entry for human moderators to see
      report.history.push({
        status: report.status,
        changedBy: "AI Moderator",
        timestamp: Date.now(),
        action: "ai_evaluated",
        note: `AI Evaluator (${provider}/${model}) completed review. Confidence: ${recommendation.confidence}. Recommendation: ${recommendation.recommendedAction.toUpperCase()}`,
      });
      await report.save();

      const reportedUserInfo = await redis.getBasicUserInfo(report.reportedUserId);
      const reportedName = reportedUserInfo?.name || report.reportedUserId;

      await routeUtils.createModAction("AI Moderator", "Evaluate Report", [
        report.id,
        reportedName,
        recommendation.recommendedAction,
      ]);

      logger.info(`AI Moderation: Recommendation saved for Report ${reportId}. Human review is required.`);
    }
  } catch (err) {
    logger.error(`AI Moderation error processing report ${reportId}:`, err);
  }
}

/**
/**
 * Formats a description which could be a string or an array of paragraph/list objects.
 */
function formatDescription(desc) {
  if (typeof desc === "string") {
    return desc;
  }
  if (Array.isArray(desc)) {
    return desc
      .map((d) => {
        if (typeof d === "string") return d;
        if (d && d.type === "paragraph") return d.content;
        if (d && d.type === "list") return d.items.map((item) => `- ${item}`).join("\n");
        return "";
      })
      .join("\n");
  }
  return "";
}

/**
 * Formats the prompt using violation definitions and gathered context.
 */
function generatePrompt(report, contextText) {
  const rulesListText = violationDefinitions
    .map((v, i) => {
      const descText = formatDescription(v.description);
      return `${i + 1}. Rule Name: "${v.name}"
   Rule ID: "${v.id}"
   Category: "${v.category || "Community"}"
   Applies To: ${JSON.stringify(v.appliesTo)}
   Description:
   ${descText}
   Offenses (punishments in order of occurrence): ${JSON.stringify(v.offenses)}`;
    })
    .join("\n\n");

  return `You are the AI Moderator for UltiMafia, a multiplayer online game platform.
Your task is to review a moderation report submitted by a user and determine if there has been a rule violation.
You MUST evaluate the behavior against the platform's official rules.

Here are the official rules (violation definitions):
=========================================
${rulesListText}
=========================================

Below are the details of the filed report:
- Report ID: ${report.id}
- Reported User ID: ${report.reportedUserId}
- Selected Rule Broken (chosen by Reporter): "${report.rule}"
- Reporter Description/Evidence: "${report.description}"
- Number of reporters for this case: ${report.reporters ? report.reporters.length : 1}
${
  report.reporters
    ? `Reporter Details:\n` +
      report.reporters
        .map((r, i) => `  Reporter ${i + 1}: selected rule "${r.rule}", description "${r.description}"`)
        .join("\n")
    : ""
}

Here is the gathered context of the incident (this includes game details, game chat logs, and/or general chat logs if available):
=========================================
${contextText || "No chat/game context could be retrieved."}
=========================================

Instructions:
1. Determine if a violation of the rules has occurred (\`isViolation\`). Be objective and fair.
2. Select the most appropriate rule from the official rules list. The selected rule name must EXACTLY match the "name" of one of the rules listed above (e.g. "Personal Attacks & Harassment (PA)", "Intolerance", etc.).
3. Choose the appropriate recommendation (\`recommendedAction\`):
   - "dismiss": If there is no violation.
   - "warning": For minor first-time offenses or behaviors that don't warrant a ban but need a warning.
   - "ban": For clear, explicit violations of rules that warrant a ban according to the rule offenses.
4. If recommending a "ban", specify:
   - \`banType\`: Must be one of ["forum", "chat", "game", "ranked", "competitive", "site"]. Choose the level of restriction that is appropriate.
   - \`banLength\`: You should output \`null\` to let the system automatically escalate the ban length based on the player's previous violations (rap sheet) and the rule's offenses list. However, if the rule has no offenses list, or you want to recommend a specific custom ban length, you may specify it (e.g., "12 hours", "24 hours", "48 hours", "Permaban").
5. Provide a detailed reasoning for your decision, outlining how the evidence matches the rule.
6. Provide a concise, clear note (\`notes\`) that will serve as the official explanation in the violation ticket or dismissal message. Keep it professional.

CRITICAL ZERO-TOLERANCE GUIDELINES:
- **Intolerance & Slurs**: The use of severe slurs (e.g., the n-word, Homophobic, Transphobic, Xenophobic slurs) has a ZERO-TOLERANCE policy on UltiMafia. If you detect any such slur in the chat logs or description, you MUST rule this as a violation of the "Intolerance" rule (\`isViolation: true\`). You MUST recommend a "ban" (\`recommendedAction: "ban"\`). Do NOT dismiss the report or issue a simple warning for the use of severe slurs, regardless of context. A confidence score of 1.0 must be given.
- **Evidence Source**: The primary evidence is the attached chat logs (\`contextText\`). Scan the logs carefully. Do not just rely on the description provided by the reporter; if the log confirms that the reported user used a slur, it is a violation.

You MUST respond with a single valid JSON object. Do not wrap your response in markdown code blocks.
Response JSON Schema:
{
  "isViolation": boolean,
  "confidence": number, // a float between 0.0 and 1.0 representing your confidence
  "rule": string | null, // exact rule Name (e.g., "Intolerance") or null if no violation
  "category": "Community" | "Game" | null, // category of the rule or null
  "reasoning": string, // internal reasoning for the decision
  "recommendedAction": "dismiss" | "warning" | "ban",
  "banType": "forum" | "chat" | "game" | "ranked" | "competitive" | "site" | null,
  "banLength": string | null, // recommended: null to use automatic escalation based on offenses list and rap sheet, otherwise specify custom length (e.g. "24 hours", "Permaban")
  "notes": string // public moderation note explaining the verdict
}`;
}

module.exports = {
  moderateReport,
  gatherContext,
};
