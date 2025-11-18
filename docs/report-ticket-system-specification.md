# Report Ticket System - Implementation Specification

## Overview

This document outlines the implementation of an on-site report ticket system that replaces the current Discord webhook-based reporting mechanism. Reports will be stored in the database as tickets that can be assigned, tracked, and resolved by moderators with appropriate permissions.

## Current System Analysis

### Existing Report Flow

**File: `routes/report.js`**
- Reports are currently sent via Discord webhook only
- No database storage of reports
- Reports contain: `game`, `user` (reported), `rule`, `description`
- Validation: Requires logged-in user and both `user` and `rule` fields
- No tracking or resolution mechanism

**Frontend: `react_main/src/components/ReportDialog.jsx`**
- Users submit reports with: game (optional), user reported, rule broken, description (optional)
- Rule selection uses `rulesData` from `react_main/src/constants/rules`
- Success message: "Thank you — your report was delivered to moderators."

### Existing Violation System

**ViolationTicket Schema** (`db/schemas.js` lines 580-599):
- Stores completed violations linked to bans
- Fields: `id`, `userId`, `modId`, `banType`, `violationId`, `violationName`, `violationCategory`, `notes`, `length`, `createdAt`, `expiresAt`, `linkedBanId`
- Created via `routeUtils.createViolationTicket()` when bans are issued

**Violation Creation Flow** (`routes/mod.js`):
- `siteBan` and `gameBan` endpoints create ViolationTickets
- Uses `getValidatedViolation()` to validate violation type against ban type
- **IMPORTANT**: Offense numbers are NOT automatically calculated - admins manually determine which offense number based on previous violations
- Violations are created from `data/violations.js` which defines violation types and their offense penalty structures

### Permission System

**Rank-based Hierarchy** (`modules/redis.js`, `data/constants.js`):
- Users have a `rank` field (Number) - higher rank = higher authority
- Groups also have ranks that contribute to user's effective rank
- Rank hierarchy: Owner (Infinity) > Admin (10) > Liaison (9) > Mod (5) > others (0-1)
- Permission checking: `verifyPermission(userId, perm, rank)` - can specify minimum rank required
- Rank comparison used for actions like banning: `banRank + 1` means you need rank higher than target

**Current Mod Panel Access**:
- Uses `viewModActions` permission to access mod panel (`react_main/src/pages/Community/Moderation.jsx`)
- No specific `seeModPanel` permission exists yet

## Feature Requirements

### Core Functionality

1. **Report Storage**: All reports from `routes/report.js` should create database entries instead of (or in addition to) Discord webhooks
2. **Access Control**: Reports visible only to users with `seeModPanel` permission (or similar)
3. **Assignment System**: 
   - Multiple assignees allowed (unlimited)
   - Self-assignment enabled
   - Higher-rank admins can assign lower-rank admins
4. **Status Tracking**: Three states with color coding:
   - `open` (green) - New report, not yet assigned or in progress
   - `in-progress` (yellow) - Assigned and being worked on
   - `complete` (red) - Resolved with final ruling
5. **Final Ruling**: When marked complete, stores violation details compatible with Typology component
6. **Reopening**: Ability to reopen completed reports back to `open` or `in-progress`

### Violation Creation

When a report is resolved with a violation:
- Create a `ViolationTicket` object using existing `routeUtils.createViolationTicket()`
- Link the report to the created violation ticket
- Create appropriate ban if violation warrants it (using existing ban creation flow)

## Schema Changes

### New Report Schema

**Location**: `db/schemas.js`

```javascript
Report: new mongoose.Schema({
  id: { type: String, index: true, unique: true },  // Unique report ID (shortid)
  reporterId: { type: String, index: true },  // User who filed the report
  reportedUserId: { type: String, index: true },  // User being reported
  gameId: { type: String, index: true },  // Optional game ID if report is game-related
  rule: { type: String, index: true },  // Rule broken (from rulesData - matches current system)
  description: String,  // User-provided description (optional)
  status: { 
    type: String, 
    enum: ["open", "in-progress", "complete"],
    default: "open",
    index: true 
  },
  assignees: [{ type: String, index: true }],  // Array of user IDs assigned to report (no limit)
  createdAt: { type: Number, index: true },  // Timestamp when report was created
  updatedAt: { type: Number, index: true },  // Last update timestamp
  completedAt: { type: Number, index: true },  // When marked complete
  completedBy: { type: String, index: true },  // Admin who completed it (userId)
  // Final ruling when complete (null if dismissed/not actionable):
  finalRuling: {
    violationId: String,  // Violation type ID from data/violations.js
    violationName: String,  // Violation display name
    violationCategory: String,  // "Community" or "Game"
    banType: String,  // "site", "game", "chat", "forum", etc.
    offenseNumber: Number,  // Which offense (1, 2, 3, etc.) - admin determines
    banLength: String,  // Ban length string (e.g., "1 day", "3 weeks", "Permaban")
    banLengthMs: Number,  // Ban length in milliseconds for calculations
    notes: String,  // Admin's notes/explanation
  },
  linkedViolationTicketId: { type: String, index: true },  // Link to ViolationTicket if created
  linkedBanId: { type: String, index: true },  // Link to Ban if created
  reopenedAt: { type: Number },  // Timestamp if reopened from complete
  reopenedBy: { type: String },  // Admin who reopened it (userId)
  reopenedCount: { type: Number, default: 0 },  // Track how many times reopened
  history: [{  // Track all status changes and assignments
    status: String,
    changedBy: String,  // userId
    timestamp: Number,
    action: String,  // "status_change", "assignment", "reopened", "completed"
    note: String,  // Optional note about the change
    assigneesAdded: [String],  // userIds added
    assigneesRemoved: [String],  // userIds removed
  }]
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})
```

**Indexes Required**:
- Primary: `id` (unique)
- Single: `status`, `reporterId`, `reportedUserId`, `gameId`, `completedBy`, `linkedViolationTicketId`, `createdAt`
- Compound: `{ status: 1, createdAt: -1 }` for common queries (open reports, newest first)
- Compound: `{ assignees: 1, status: 1 }` for finding reports assigned to a user
- Compound: `{ reportedUserId: 1, status: 1 }` for finding reports against a user

**Virtual Populates** (for convenience):
```javascript
schemas.Report.virtual("reporter", {
  ref: "User",
  localField: "reporterId",
  foreignField: "id",
  justOne: true,
});

schemas.Report.virtual("reportedUser", {
  ref: "User",
  localField: "reportedUserId",
  foreignField: "id",
  justOne: true,
});
```

## Required Code Changes

### 1. Permission System Updates

**File: `data/constants.js`**

Add new permission:
```javascript
allPerms: {
  // ... existing perms ...
  seeModPanel: true,  // NEW - Access to report ticket system
  // ... rest of perms ...
}
```

Add to default groups that should have access:
```javascript
defaultGroups: {
  Owner: {
    // ... existing ...
    perms: "*",  // Already has all perms
  },
  Admin: {
    // ... existing ...
    perms: [
      // ... existing perms ...
      "seeModPanel",  // NEW
    ],
  },
  Mod: {
    // ... existing ...
    perms: [
      // ... existing perms ...
      "seeModPanel",  // NEW
    ],
  },
  Liaison: {
    // ... existing ...
    perms: [
      // ... existing perms ...
      "seeModPanel",  // NEW (if Liaisons should see reports)
    ],
  },
}
```

### 2. Report Creation - Modify `routes/report.js`

**Current**: Sends to Discord webhook only
**New**: Create Report document in database

```javascript
router.post("/send", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id name");

    const { game, user: reportedUser, rule, description } = req.body;

    if (!reportedUser || !rule) {
      return res
        .status(400)
        .send("User and rule broken are required to file a report.");
    }

    // Validate reported user exists
    const reportedUserDoc = await models.User.findOne({
      id: reportedUser,
      deleted: false,
    }).select("id");

    if (!reportedUserDoc) {
      return res.status(400).send("Reported user does not exist.");
    }

    // Validate game exists if provided
    if (game) {
      const gameDoc = await models.Game.findOne({ id: game }).select("id");
      if (!gameDoc) {
        return res.status(400).send("Game does not exist.");
      }
    }

    // Validate rule exists in rulesData
    const { rulesData } = require("../react_main/src/constants/rules");
    const validRule = rulesData.find(r => r.name === rule);
    if (!validRule) {
      return res.status(400).send("Invalid rule selected.");
    }

    // Rate limiting (optional but recommended)
    if (!(await routeUtils.rateLimit(userId, "fileReport", res))) return;

    // Create report document
    const report = new models.Report({
      id: shortid.generate(),
      reporterId: userId,
      reportedUserId: reportedUser,
      gameId: game || null,
      rule: rule,
      description: description ? String(description).trim().slice(0, 5000) : "",  // Limit length
      status: "open",
      assignees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [{
        status: "open",
        changedBy: userId,
        timestamp: Date.now(),
        action: "created",
        note: "Report created",
      }],
    });

    await report.save();

    // OPTIONAL: Still send to Discord for notification (can be removed later)
    // ... existing Discord webhook code ...

    res.status(200).send("Report has been filed successfully.");
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error filing report.");
  }
});
```

**Add rate limit** to `data/constants.js`:
```javascript
rateLimits: {
  // ... existing ...
  fileReport: 5 * 60 * 1000,  // 5 minutes between reports
}
```

### 3. New Report Management Routes

**File: `routes/mod.js`** (or create `routes/reports.js`)

#### GET `/api/mod/reports` - List Reports
```javascript
router.get("/reports", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel"))) return;

    const status = req.query.status;  // Optional filter: "open", "in-progress", "complete"
    const assignee = req.query.assignee;  // Optional: userId
    const reportedUser = req.query.reportedUser;  // Optional: userId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    let filter = {};
    if (status && ["open", "in-progress", "complete"].includes(status)) {
      filter.status = status;
    }
    if (assignee) {
      filter.assignees = assignee;
    }
    if (reportedUser) {
      filter.reportedUserId = reportedUser;
    }

    const reports = await models.Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await models.Report.countDocuments(filter);

    res.send({
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error loading reports.");
  }
});
```

#### GET `/api/mod/reports/:id` - Get Single Report
```javascript
router.get("/reports/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel"))) return;

    const report = await models.Report.findOne({ id: req.params.id }).lean();

    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    // Populate linked violation ticket if exists
    if (report.linkedViolationTicketId) {
      report.violationTicket = await models.ViolationTicket.findOne({
        id: report.linkedViolationTicketId,
      }).lean();
    }

    res.send(report);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error loading report.");
  }
});
```

#### POST `/api/mod/reports/:id/assign` - Assign Report
```javascript
router.post("/reports/:id/assign", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel"))) return;

    const reportId = req.params.id;
    const { assignees } = req.body;  // Array of userIds to assign

    if (!Array.isArray(assignees)) {
      res.status(400).send("Assignees must be an array.");
      return;
    }

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    // Validate all assignees exist and have seeModPanel permission
    const currentRank = await redis.getUserRank(userId);
    
    for (const assigneeId of assignees) {
      const assigneeExists = await models.User.findOne({
        id: assigneeId,
        deleted: false,
      }).select("id");

      if (!assigneeExists) {
        res.status(400).send(`User ${assigneeId} does not exist.`);
        return;
      }

      // Check if assigner can assign to this user (must have higher or equal rank)
      if (assigneeId !== userId) {  // Self-assignment always allowed
        const assigneeRank = await redis.getUserRank(assigneeId);
        if (assigneeRank === null || currentRank === null || currentRank < assigneeRank) {
          res.status(403).send(`You cannot assign users with rank ${assigneeRank || 0} or higher.`);
          return;
        }
      }

      // Verify assignee has seeModPanel permission
      const hasPermission = await routeUtils.verifyPermission(
        assigneeId,
        "seeModPanel"
      );
      if (!hasPermission) {
        res.status(400).send(`User ${assigneeId} does not have permission to view reports.`);
        return;
      }
    }

    // Track changes
    const added = assignees.filter(a => !report.assignees.includes(a));
    const removed = report.assignees.filter(a => !assignees.includes(a));

    // Update assignees
    report.assignees = [...new Set(assignees)];  // Remove duplicates
    report.updatedAt = Date.now();

    // Update status if needed
    if (report.status === "open" && assignees.length > 0) {
      report.status = "in-progress";
    }

    // Add history entry
    report.history.push({
      status: report.status,
      changedBy: userId,
      timestamp: Date.now(),
      action: "assignment",
      assigneesAdded: added,
      assigneesRemoved: removed,
    });

    await report.save();

    // Send notifications to new assignees
    for (const assigneeId of added) {
      await routeUtils.createNotification(
        {
          content: `You have been assigned to report #${report.id}`,
          icon: "flag",
          link: `/mod/reports/${report.id}`,
        },
        [assigneeId]
      );
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error assigning report.");
  }
});
```

#### POST `/api/mod/reports/:id/status` - Update Status
```javascript
router.post("/reports/:id/status", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel"))) return;

    const reportId = req.params.id;
    const { status } = req.body;

    if (!["open", "in-progress", "complete"].includes(status)) {
      res.status(400).send("Invalid status.");
      return;
    }

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    // Validate status transitions
    if (status === "complete" && report.status !== "complete") {
      // Completing requires finalRuling or explicit dismissal
      const { finalRuling } = req.body;
      if (!finalRuling) {
        res.status(400).send("Final ruling required to complete report.");
        return;
      }
      // Validation happens in complete endpoint
      res.status(400).send("Use /complete endpoint to mark as complete.");
      return;
    }

    if (status === "open" && report.assignees.length > 0) {
      // Warn but allow
    }

    const oldStatus = report.status;
    report.status = status;
    report.updatedAt = Date.now();

    if (status === "in-progress" && report.assignees.length === 0) {
      // Auto-assign to current user
      if (!report.assignees.includes(userId)) {
        report.assignees.push(userId);
      }
    }

    report.history.push({
      status: status,
      changedBy: userId,
      timestamp: Date.now(),
      action: "status_change",
      note: `Changed from ${oldStatus} to ${status}`,
    });

    await report.save();
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error updating status.");
  }
});
```

#### POST `/api/mod/reports/:id/complete` - Complete Report with Ruling
```javascript
router.post("/reports/:id/complete", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel"))) return;

    const reportId = req.params.id;
    const {
      finalRuling,  // { violationId, offenseNumber, banLength, notes, dismissed }
      dismissed,  // boolean - true if no violation
    } = req.body;

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    if (report.status === "complete") {
      res.status(400).send("Report is already complete.");
      return;
    }

    let violationTicket = null;
    let ban = null;

    // If not dismissed, create violation ticket and ban
    if (!dismissed && finalRuling) {
      const { violationDefinitions, violationMapById } = require("../data/violations");
      const violation = violationMapById[finalRuling.violationId];

      if (!violation) {
        res.status(400).send("Invalid violation type.");
        return;
      }

      // Validate violation applies to ban type
      if (!violation.appliesTo.includes(finalRuling.banType)) {
        res.status(400).send("Violation type is not applicable for this ban type.");
        return;
      }

      // Validate offense number (1-based index into offenses array)
      if (finalRuling.offenseNumber < 1 || finalRuling.offenseNumber > violation.offenses.length) {
        res.status(400).send(`Offense number must be between 1 and ${violation.offenses.length}.`);
        return;
      }

      // Get ban length from violation offenses array
      const banLengthStr = violation.offenses[finalRuling.offenseNumber - 1];
      
      // Parse ban length
      let banLengthMs = routeUtils.parseTime(banLengthStr);
      if (banLengthStr.toLowerCase() === "permaban" || banLengthStr.toLowerCase() === "loss of privilege") {
        banLengthMs = Infinity;
      } else if (banLengthStr === "-") {
        banLengthMs = 0;  // No ban for this offense
      }

      // Determine permissions to ban based on banType
      let permissions = [];
      if (finalRuling.banType === "site") {
        permissions = ["signIn"];
      } else if (finalRuling.banType === "game") {
        permissions = ["playGame"];
      } else if (finalRuling.banType === "playRanked") {
        permissions = ["playRanked"];
      } else if (finalRuling.banType === "playCompetitive") {
        permissions = ["playCompetitive"];
      } else if (finalRuling.banType === "chat") {
        permissions = ["publicChat", "privateChat"];
      } else if (finalRuling.banType === "forum") {
        permissions = ["createThread", "postReply"];
      }

      // Check if admin has permission to ban this user
      const targetRank = await redis.getUserRank(report.reportedUserId);
      if (targetRank === null) {
        res.status(400).send("Reported user does not exist.");
        return;
      }

      const adminRank = await redis.getUserRank(userId);
      if (adminRank === null || adminRank <= targetRank) {
        res.status(403).send("You do not have sufficient rank to ban this user.");
        return;
      }

      // Create ban if ban length > 0
      if (banLengthMs > 0 && permissions.length > 0) {
        ban = await routeUtils.banUser(
          report.reportedUserId,
          banLengthMs === Infinity ? 0 : banLengthMs,  // 0 = permanent
          permissions,
          finalRuling.banType,
          userId
        );

        // Update user banned flag for site bans
        if (finalRuling.banType === "site") {
          await models.User.updateOne(
            { id: report.reportedUserId },
            { $set: { banned: true } }
          ).exec();
          await models.Session.deleteMany({ "session.user.id": report.reportedUserId }).exec();
        }
      }

      // Create violation ticket
      violationTicket = await routeUtils.createViolationTicket({
        userId: report.reportedUserId,
        modId: userId,
        banType: finalRuling.banType,
        violationId: violation.id,
        violationName: violation.name,
        violationCategory: violation.category,
        notes: finalRuling.notes || "",
        length: banLengthMs,
        expiresAt: ban ? ban.expires : null,
        linkedBanId: ban ? ban.id : null,
      });

      // Send notification to reported user
      if (banLengthMs > 0) {
        await routeUtils.createNotification(
          {
            content: `You have received a ${violation.name} violation. ${banLengthMs === Infinity ? "You have been permanently banned." : `Ban duration: ${routeUtils.timeDisplay(banLengthMs)}.`}`,
            icon: "ban",
            link: `/user/${report.reportedUserId}`,
          },
          [report.reportedUserId]
        );
      }
    }

    // Update report
    report.status = "complete";
    report.completedAt = Date.now();
    report.completedBy = userId;
    report.updatedAt = Date.now();
    
    if (!dismissed && finalRuling) {
      const violation = violationMapById[finalRuling.violationId];
      report.finalRuling = {
        violationId: violation.id,
        violationName: violation.name,
        violationCategory: violation.category,
        banType: finalRuling.banType,
        offenseNumber: finalRuling.offenseNumber,
        banLength: violation.offenses[finalRuling.offenseNumber - 1],
        banLengthMs: banLengthMs,
        notes: finalRuling.notes || "",
      };
      report.linkedViolationTicketId = violationTicket ? violationTicket.id : null;
      report.linkedBanId = ban ? ban.id : null;
    } else {
      report.finalRuling = null;
    }

    report.history.push({
      status: "complete",
      changedBy: userId,
      timestamp: Date.now(),
      action: "completed",
      note: dismissed ? "Report dismissed - no violation" : `Violation: ${report.finalRuling?.violationName}`,
    });

    await report.save();

    // Create mod action
    await routeUtils.createModAction(
      userId,
      dismissed ? "Complete Report (Dismissed)" : "Complete Report",
      [reportId, report.reportedUserId, report.finalRuling?.violationId || "dismissed"]
    );

    res.send({
      report,
      violationTicket: violationTicket ? violationTicket.toJSON() : null,
      ban: ban ? ban.toJSON() : null,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error completing report.");
  }
});
```

#### POST `/api/mod/reports/:id/reopen` - Reopen Completed Report
```javascript
router.post("/reports/:id/reopen", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel"))) return;

    const reportId = req.params.id;
    const { newStatus } = req.body;  // "open" or "in-progress"

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    if (report.status !== "complete") {
      res.status(400).send("Only completed reports can be reopened.");
      return;
    }

    const targetStatus = newStatus || "in-progress";
    if (!["open", "in-progress"].includes(targetStatus)) {
      res.status(400).send("New status must be 'open' or 'in-progress'.");
      return;
    }

    report.status = targetStatus;
    report.reopenedAt = Date.now();
    report.reopenedBy = userId;
    report.reopenedCount = (report.reopenedCount || 0) + 1;
    report.updatedAt = Date.now();

    // Clear completion fields (but keep finalRuling for reference)
    // Optionally clear assignees if reopening to "open"
    if (targetStatus === "open") {
      report.assignees = [];
    } else if (report.assignees.length === 0) {
      // Auto-assign to reopening user
      report.assignees = [userId];
    }

    report.history.push({
      status: targetStatus,
      changedBy: userId,
      timestamp: Date.now(),
      action: "reopened",
      note: `Reopened from complete. Previous ruling: ${report.finalRuling ? report.finalRuling.violationName : "Dismissed"}`,
    });

    await report.save();

    // Notify previous assignees
    const previousAssignees = report.history
      .filter(h => h.action === "assignment")
      .flatMap(h => h.assigneesAdded || [])
      .filter((id, index, self) => self.indexOf(id) === index);  // Unique

    for (const assigneeId of previousAssignees) {
      if (assigneeId !== userId) {
        await routeUtils.createNotification(
          {
            content: `Report #${report.id} has been reopened`,
            icon: "flag",
            link: `/mod/reports/${report.id}`,
          },
          [assigneeId]
        );
      }
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error reopening report.");
  }
});
```

### 4. Frontend Components

**New Page: `react_main/src/pages/Community/Reports.jsx`**

Main reports list page with:
- Filter by status (open/in-progress/complete)
- Filter by assignee (self/others/all)
- Filter by reported user
- Search by report ID
- Pagination
- Color-coded status indicators (green/yellow/red)
- Quick actions: assign, change status, view details

**New Component: `react_main/src/components/ReportDetail.jsx`**

Report detail view with:
- All report information
- Assignment interface (multi-select with user search)
- Status change controls
- Final ruling form (if completing)
- Typology component display (if complete)
- Reopen button (if complete)
- History timeline

**New Component: `react_main/src/components/ReportTypology.jsx`**

Display final ruling with:
- Violation name and category
- Ban type
- Offense number
- Ban length
- Admin notes
- Links to related ViolationTicket and Ban

### 5. Route Registration

**File: `app.js`** (or wherever routes are registered)

```javascript
// If creating separate reports route file:
const reportsRouter = require("./routes/reports");
app.use("/api/reports", reportsRouter);

// Or add to existing mod router:
app.use("/api/mod", modRouter);  // Should already exist
```

## Security Considerations

### 1. Permission Validation
- **ALL** report endpoints must verify `seeModPanel` permission
- Use `routeUtils.verifyPermission()` consistently
- Never expose reports to unauthorized users

### 2. Assignment Security
- Validate assignees exist and aren't deleted
- Check assigner's rank is >= assignee's rank (except self-assignment)
- Verify assignees have `seeModPanel` permission
- Prevent assigning non-existent or deleted users

### 3. Status Transition Validation
- Prevent invalid status transitions (e.g., complete → open directly - must use reopen)
- Require finalRuling when completing (unless dismissed)
- Validate violation data when completing with ruling

### 4. Ban Creation Security
- Verify admin has sufficient rank to ban target user (current system uses `banRank + 1`)
- Validate violation type applies to ban type
- Validate offense number is within valid range
- Ensure ban length parsing is safe (handle "Permaban", "Loss of privilege", etc.)

### 5. Input Sanitization
- Limit description length (5000 chars recommended)
- Sanitize all string inputs
- Validate rule names against actual rulesData
- Validate game IDs exist if provided
- Validate user IDs exist

### 6. Rate Limiting
- Add rate limit for report creation (5 minutes recommended)
- Consider rate limiting status changes/assignments to prevent abuse
- Use existing `routeUtils.rateLimit()` system

### 7. History Tracking
- Never allow modification of history array directly
- Always add new entries, never edit existing ones
- Include user ID, timestamp, and action in every entry
- This provides audit trail for accountability

### 8. Data Integrity
- Use transactions where possible (if MongoDB supports)
- Validate referential integrity (users, games exist)
- Handle edge cases (deleted users, completed reports, etc.)

## Limitations & Considerations

### 1. Offense Number Calculation
**CRITICAL**: The current system does NOT automatically calculate offense numbers. Admins manually determine which offense number (1st, 2nd, 3rd, etc.) based on their review of previous violations. The report system should:
- Display previous violations for the reported user (by violation type)
- Allow admins to manually select offense number
- Show what ban length each offense number would result in
- **DO NOT** automatically count violations - this is intentional design

### 2. Violation Ticket Linking
- ViolationTickets are created when bans are issued, not when reports are completed
- Reports can be completed without creating violations (if dismissed)
- Reports can be dismissed even if they seem valid (admin discretion)
- A single report might result in multiple violations if behavior warrants it (future enhancement)

### 3. Ban Type Complexity
- Different ban types require different permission arrays
- Site bans require additional user flag updates and session deletion
- "Loss of privilege" bans may require special handling
- Permanent bans use `expires: 0` (not Infinity)

### 4. Reopening Behavior
- Reopened reports keep finalRuling for reference but clear completion fields
- Reopening doesn't undo bans or violation tickets (those remain)
- Reopened reports may need new ruling if situation changes
- Track reopen count to identify problematic reports

### 5. Assignment Notifications
- Notify users when assigned to reports
- Consider digest notifications for users with many assigned reports
- Notification links should go to report detail page

### 6. Performance
- Reports table will grow over time
- Consider archiving old completed reports (move to separate collection after X months)
- Indexes are critical for performance
- Pagination is essential for large result sets

### 7. Discord Integration
- Current Discord webhook can be kept for notifications
- Or removed entirely once on-site system is proven
- Could send notifications for new reports to Discord mod channel
- Link Discord messages to report IDs for reference

### 8. Migration
- No existing report data to migrate (Discord-only currently)
- Consider importing recent Discord reports if possible
- Violation history from ViolationTickets can inform offense numbers

### 9. Typology Component
- Typology component exists in frontend (`react_main/src/pages/User/Profile.jsx` uses it)
- Need to locate exact component or create new one for reports
- Should display all finalRuling fields in readable format
- May need to link to user profile to see violation history

### 10. Game Context
- Game IDs are optional (reports can be site-wide)
- Need to validate game exists if provided
- Could link to game view page if game ID present
- Game-specific reports might need special handling

## Testing Checklist

### Backend
- [ ] Report creation with valid data
- [ ] Report creation with invalid user/game/rule
- [ ] Report listing with filters
- [ ] Assignment with various rank combinations
- [ ] Self-assignment
- [ ] Status transitions (valid and invalid)
- [ ] Report completion with violation
- [ ] Report completion with dismissal
- [ ] Reopening completed reports
- [ ] Permission checks on all endpoints
- [ ] Rate limiting on report creation
- [ ] Input validation and sanitization
- [ ] Violation ticket creation
- [ ] Ban creation from report completion
- [ ] Notification sending

### Frontend
- [ ] Report list displays correctly
- [ ] Filters work properly
- [ ] Status colors display correctly
- [ ] Assignment interface functional
- [ ] Status change controls work
- [ ] Final ruling form validation
- [ ] Typology component displays correctly
- [ ] Reopen functionality
- [ ] History timeline displays
- [ ] Permissions hide/show appropriate UI

### Integration
- [ ] End-to-end report flow
- [ ] Violation ticket links correctly
- [ ] Ban creation works from report
- [ ] Notifications sent to correct users
- [ ] Mod actions created
- [ ] User can see violations on their profile
- [ ] Reports persist correctly

## Future Enhancements

1. **Report Comments/Notes**: Allow admins to add notes without completing
2. **Report Templates**: Pre-fill common violation patterns
3. **Bulk Actions**: Assign multiple reports, change status of multiple
4. **Report Analytics**: Dashboard showing report trends, common violations
5. **Automated Notifications**: Email/Discord notifications for new reports
6. **Report Merging**: Combine duplicate reports
7. **Report Escalation**: Flag reports needing higher-level review
8. **Report Categories**: Tag reports by type/priority
9. **File Attachments**: Allow screenshots/evidence uploads
10. **Report Search**: Full-text search across descriptions

