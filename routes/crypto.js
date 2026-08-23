const express = require("express");
const routeUtils = require("./utils");
const errors = require("../lib/errors");
const logger = require("../modules/logging")(".");
const cryptoPayments = require("../modules/cryptoPayments");

const router = express.Router();
const lastCheckByInvoice = new Map();
const CHECK_COOLDOWN_MS = 5 * 60 * 1000;

function clientError(res, err) {
  const status = err.status || 500;
  if (status >= 500) {
    logger.error(err);
    errors.serverError(res, err.message || "Crypto payment error.");
    return;
  }
  return res.status(status).send(err.message);
}


async function verifyOwner(req, res) {
  const userId = await routeUtils.verifyLoggedIn(req);
  const isOwner = await cryptoPayments.userIsOwner(userId);
  if (!isOwner) {
    errors.forbidden(res, "Owner only.");
    return null;
  }
  return userId;
}

router.get("/admin/invoices", async function (req, res) {
  try {
    const userId = await verifyOwner(req, res);
    if (!userId) return;
    const status = String(req.query.status || "unpaid");
    const page = Number(req.query.page || 1);
    const result = await cryptoPayments.listInvoicesForOwner({
      status: status === "all" ? "" : status,
      page,
    });
    return res.send(result);
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    return clientError(res, e);
  }
});

router.post("/admin/invoices/:id/approve", async function (req, res) {
  try {
    const userId = await verifyOwner(req, res);
    if (!userId) return;
    const invoiceId = String(req.params.id || "").trim();
    const invoice = await cryptoPayments.approveInvoiceByOwner(invoiceId, userId);
    return res.send(invoice);
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    return clientError(res, e);
  }
});

router.post("/admin/invoices/:id/reject", async function (req, res) {
  try {
    const userId = await verifyOwner(req, res);
    if (!userId) return;
    const invoiceId = String(req.params.id || "").trim();
    const invoice = await cryptoPayments.rejectInvoiceByOwner(invoiceId, userId);
    return res.send(invoice);
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    return clientError(res, e);
  }
});

router.get("/options", async function (req, res) {
  try {
    await routeUtils.verifyLoggedIn(req);
    return res.send(cryptoPayments.getPublicOptions());
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    logger.error(e);
    errors.serverError(res, "Could not load crypto donation options.");
  }
});

router.post("/invoice", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const usdAmount = Number(req.body.usdAmount);
    const chain = String(req.body.chain || "solana");
    const asset = String(req.body.asset || "").toUpperCase();

    const invoice = await cryptoPayments.createInvoice({
      userId,
      usdAmount,
      chain,
      assetId: asset,
    });
    return res.send(invoice);
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    return clientError(res, e);
  }
});

router.get("/mine", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const invoices = await cryptoPayments.listMyPendingInvoices(userId);
    return res.send({ invoices });
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    logger.error(e);
    errors.serverError(res, "Could not load invoices.");
  }
});

router.post("/invoice/:id/cancel", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const invoiceId = String(req.params.id || "").trim();
    const invoice = await cryptoPayments.cancelInvoiceByUser(invoiceId, userId);
    return res.send(invoice);
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    return clientError(res, e);
  }
});

router.get("/invoice/:id", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const invoiceId = String(req.params.id || "").trim();
    const doc = await cryptoPayments.getInvoiceForUser(userId, invoiceId);
    if (!doc) {
      return res.status(404).send("Invoice not found.");
    }
    await cryptoPayments.expireInvoice(doc);
    return res.send(cryptoPayments.toPublicInvoice(doc));
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    logger.error(e);
    errors.serverError(res, "Could not load invoice.");
  }
});

router.post("/invoice/:id/check", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const invoiceId = String(req.params.id || "").trim();
    const doc = await cryptoPayments.getInvoiceForUser(userId, invoiceId);
    if (!doc) {
      return res.status(404).send("Invoice not found.");
    }

    const now = Date.now();
    const last = lastCheckByInvoice.get(invoiceId) || 0;
    if (now - last < CHECK_COOLDOWN_MS && doc.status === "pending") {
      await cryptoPayments.expireInvoice(doc);
      return res.send(cryptoPayments.toPublicInvoice(doc));
    }
    lastCheckByInvoice.set(invoiceId, now);

    const updated = await cryptoPayments.checkInvoice(doc);
    return res.send(cryptoPayments.toPublicInvoice(updated));
  } catch (e) {
    if (e.message === "Not logged in") {
      return res.status(401).send("Not logged in");
    }
    logger.error(e);
    errors.serverError(res, "Could not check invoice.");
  }
});

module.exports = router;
