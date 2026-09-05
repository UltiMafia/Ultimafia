/**
 * Archived Helius-based Solana invoice matcher.
 * Production matching uses Alchemy in modules/cryptoPayments.js.
 */

const axios = require("axios");
const shortid = require("shortid");
const models = require("../db/models");
const redis = require("./redis");
const logger = require("./logging")(".");
const Random = require("../lib/Random");
const catalog = require("../data/cryptoPayments");

const PLACEHOLDER_VALUES = new Set([
  "",
  "replace-me",
  "REPLACE_ME",
  "your-helius-api-key",
  "your-solana-address",
]);

function envString(name, fallback = "") {
  const value = process.env[name];
  if (value == null) return fallback;
  return String(value).trim();
}

function isPlaceholder(value) {
  if (value == null) return true;
  const trimmed = String(value).trim();
  if (!trimmed) return true;
  return PLACEHOLDER_VALUES.has(trimmed);
}

function getSolanaConfig() {
  const depositAddress = envString("SOLANA_DEPOSIT_ADDRESS");
  const apiKey = envString("HELIUS_API_KEY");
  const rpcUrl =
    envString("HELIUS_RPC_URL") ||
    (isPlaceholder(apiKey)
      ? ""
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`);

  const mints = {
    USDC: envString("SOLANA_USDC_MINT", catalog.ASSETS.USDC.defaultMints.solana),
    USDT: envString("SOLANA_USDT_MINT", catalog.ASSETS.USDT.defaultMints.solana),
    USD1: envString("SOLANA_USD1_MINT", catalog.ASSETS.USD1.defaultMints.solana),
  };

  return {
    depositAddress,
    apiKey,
    rpcUrl,
    mints,
    configured: !isPlaceholder(depositAddress) && !isPlaceholder(apiKey),
  };
}

function getPublicOptions() {
  const solana = getSolanaConfig();
  const assets = [];

  for (const asset of Object.values(catalog.ASSETS)) {
    for (const chainId of asset.chains) {
      const chain = catalog.CHAINS[chainId];
      if (!chain) continue;
      const enabled =
        chainId === "solana" &&
        asset.kind === "stablecoin" &&
        chain.enabled &&
        solana.configured &&
        !isPlaceholder(solana.mints[asset.id]);
      assets.push({
        asset: asset.id,
        label: asset.label,
        chain: chainId,
        chainLabel: chain.label,
        enabled,
        comingSoon: !enabled,
      });
    }
  }

  return {
    coinsPerUsd: catalog.COINS_PER_USD,
    minUsd: catalog.MIN_PURCHASE_USD,
    maxUsd: catalog.MAX_PURCHASE_USD,
    invoiceTtlMs: catalog.INVOICE_TTL_MS,
    solanaConfigured: solana.configured,
    assets,
  };
}

function getAsset(chain, assetId) {
  const asset = catalog.ASSETS[assetId];
  const chainInfo = catalog.CHAINS[chain];
  if (!asset || !chainInfo) return null;
  if (!asset.chains.includes(chain)) return null;
  return { asset, chainInfo, decimals: asset.decimals[chain] };
}

function formatTokenAmount(raw, decimals) {
  const asStr = BigInt(raw).toString().padStart(decimals + 1, "0");
  const whole = asStr.slice(0, -decimals) || "0";
  const frac = asStr.slice(-decimals);
  return `${whole}.${frac}`;
}

function usdToStableRaw(usdAmount, decimals) {
  return BigInt(usdAmount) * 10n ** BigInt(decimals);
}

async function allocateUniqueAmount({ chain, asset, usdAmount, decimals }) {
  const base = usdToStableRaw(usdAmount, decimals);
  // 1..9999 in the smallest units: unique dust under 0.01 for 6-decimal stables
  const dustCap = 9999;

  for (let attempt = 0; attempt < 25; attempt++) {
    const dust = BigInt(Random.randInt(1, dustCap));
    const expectedAmountRaw = Number(base + dust);
    const clash = await models.CryptoInvoice.findOne({
      chain,
      asset,
      expectedAmountRaw,
      status: "pending",
    })
      .select("_id")
      .lean()
      .exec();
    if (!clash) return expectedAmountRaw;
  }

  throw new Error("Could not allocate a unique invoice amount. Try again.");
}

async function ensureDonorStatus(userId) {
  const [donorGroup, userDoc] = await Promise.all([
    models.Group.findOne({ name: "Donor" }).select("_id").lean().exec(),
    models.User.findOne({ id: userId, deleted: false }).select("_id").lean().exec(),
  ]);

  if (!donorGroup || !userDoc) return false;

  const inGroup = await models.InGroup.findOne({
    user: userDoc._id,
    group: donorGroup._id,
  })
    .select("_id")
    .lean()
    .exec();

  if (!inGroup) {
    await models.InGroup.create({
      user: userDoc._id,
      group: donorGroup._id,
    });
  }

  await Promise.all([
    redis.cacheUserInfo(userId, true),
    redis.cacheUserPermissions(userId),
  ]);
  return true;
}

function toPublicInvoice(doc) {
  if (!doc) return null;
  const chain = catalog.CHAINS[doc.chain];
  return {
    id: doc.invoiceId,
    status: doc.status,
    chain: doc.chain,
    chainLabel: chain ? chain.label : doc.chain,
    asset: doc.asset,
    usd: doc.usd,
    coins: doc.coins,
    depositAddress: doc.depositAddress,
    mint: doc.mint || "",
    expectedAmount: doc.expectedAmount,
    expectedAmountRaw: doc.expectedAmountRaw,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
    txSignature: doc.txSignature || "",
    explorerUrl:
      doc.txSignature && chain
        ? `${chain.explorerTx}${doc.txSignature}`
        : "",
    payUri: doc.payUri || "",
  };
}

async function createInvoice({ userId, usdAmount, chain, assetId }) {
  if (!Number.isInteger(usdAmount)) {
    throw Object.assign(new Error("USD amount must be a whole number."), {
      status: 400,
    });
  }
  if (
    usdAmount < catalog.MIN_PURCHASE_USD ||
    usdAmount > catalog.MAX_PURCHASE_USD
  ) {
    throw Object.assign(
      new Error(
        `USD amount must be between ${catalog.MIN_PURCHASE_USD} and ${catalog.MAX_PURCHASE_USD}.`
      ),
      { status: 400 }
    );
  }

  const resolved = getAsset(chain, assetId);
  if (!resolved) {
    throw Object.assign(new Error("Unsupported asset or network."), {
      status: 400,
    });
  }

  if (chain !== "solana" || resolved.asset.kind !== "stablecoin") {
    throw Object.assign(
      new Error(
        `${resolved.chainInfo.label} ${resolved.asset.label} is not available yet.`
      ),
      { status: 400 }
    );
  }

  const solana = getSolanaConfig();
  if (!solana.configured) {
    throw Object.assign(
      new Error("Solana donations are not configured on this server."),
      { status: 503 }
    );
  }

  const mint = solana.mints[assetId];
  if (isPlaceholder(mint)) {
    throw Object.assign(new Error(`Missing Solana mint for ${assetId}.`), {
      status: 503,
    });
  }

  const pendingOpen = await models.CryptoInvoice.countDocuments({
    userId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
  if (pendingOpen >= 3) {
    throw Object.assign(
      new Error("You already have pending crypto invoices. Wait or let them expire."),
      { status: 429 }
    );
  }

  const expectedAmountRaw = await allocateUniqueAmount({
    chain,
    asset: assetId,
    usdAmount,
    decimals: resolved.decimals,
  });
  const expectedAmount = formatTokenAmount(
    expectedAmountRaw,
    resolved.decimals
  );
  const coins = usdAmount * catalog.COINS_PER_USD;
  const now = new Date();
  const payUri = `solana:${solana.depositAddress}?amount=${expectedAmount}&spl-token=${mint}`;

  const doc = await models.CryptoInvoice.create({
    invoiceId: shortid.generate(),
    userId,
    chain,
    asset: assetId,
    usd: usdAmount,
    coins,
    depositAddress: solana.depositAddress,
    mint,
    expectedAmount,
    expectedAmountRaw,
    decimals: resolved.decimals,
    payUri,
    status: "pending",
    createdAt: now,
    expiresAt: new Date(now.getTime() + catalog.INVOICE_TTL_MS),
  });

  return toPublicInvoice(doc);
}

async function getInvoiceForUser(userId, invoiceId) {
  const doc = await models.CryptoInvoice.findOne({
    invoiceId,
    userId,
  }).exec();
  return doc;
}

async function expireInvoice(doc) {
  if (!doc || doc.status !== "pending") return doc;
  if (doc.expiresAt && doc.expiresAt.getTime() > Date.now()) return doc;

  await models.CryptoInvoice.updateOne(
    { _id: doc._id, status: "pending" },
    { $set: { status: "expired" } }
  ).exec();
  doc.status = "expired";
  return doc;
}

function tokenAmountToRaw(tokenAmount, decimals) {
  if (tokenAmount == null) return null;
  if (typeof tokenAmount === "number" && Number.isFinite(tokenAmount)) {
    return Math.round(tokenAmount * 10 ** decimals);
  }
  const asString = String(tokenAmount).trim();
  if (!asString) return null;
  if (!asString.includes(".")) {
    const n = Number(asString);
    return Number.isFinite(n) ? n : null;
  }
  const [whole, frac = ""] = asString.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  try {
    return Number(BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0"));
  } catch (e) {
    return null;
  }
}

async function fetchSolanaTransfers(solana) {
  if (!solana.configured) return [];

  const url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(
    solana.depositAddress
  )}/transactions`;

  try {
    const res = await axios.get(url, {
      params: {
        "api-key": solana.apiKey,
        limit: 50,
      },
      timeout: 15_000,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    logger.error({
      message: "Helius address history failed",
      status: e?.response?.status,
      data: e?.response?.data || e?.message || e,
    });
    return [];
  }
}

function findMatchingSolanaTx(txs, invoice, depositAddress) {
  for (const tx of txs) {
    const signature = tx?.signature || tx?.transaction?.signatures?.[0];
    if (!signature) continue;
    const transfers = tx.tokenTransfers || [];
    for (const transfer of transfers) {
      if (transfer.mint !== invoice.mint) continue;
      const toOwner = transfer.toUserAccount || transfer.to;
      if (toOwner && toOwner !== depositAddress) continue;
      const raw = tokenAmountToRaw(transfer.tokenAmount, invoice.decimals);
      if (raw == null) continue;
      if (raw === invoice.expectedAmountRaw) {
        return signature;
      }
    }
  }
  return null;
}

async function creditInvoice(doc, txSignature) {
  const claimed = await models.CryptoInvoice.updateOne(
    {
      _id: doc._id,
      status: "pending",
    },
    {
      $set: {
        status: "completed",
        txSignature,
        completedAt: new Date(),
      },
    }
  ).exec();

  const updatedCount =
    claimed.modifiedCount ?? claimed.nModified ?? claimed.matchedCount ?? 0;
  if (!updatedCount) return false;

  await models.User.updateOne(
    { id: doc.userId },
    { $inc: { coins: doc.coins } }
  ).exec();
  await redis.cacheUserInfo(doc.userId, true);
  await ensureDonorStatus(doc.userId);
  return true;
}

async function checkInvoice(doc) {
  if (!doc) return null;
  await expireInvoice(doc);
  if (doc.status !== "pending") return doc;

  if (doc.chain !== "solana") return doc;

  const solana = getSolanaConfig();
  if (!solana.configured) return doc;

  const txs = await fetchSolanaTransfers(solana);
  const signature = findMatchingSolanaTx(txs, doc, solana.depositAddress);
  if (!signature) return doc;

  const alreadyUsed = await models.CryptoInvoice.findOne({
    txSignature: signature,
    invoiceId: { $ne: doc.invoiceId },
  })
    .select("_id")
    .lean()
    .exec();
  if (alreadyUsed) return doc;

  const credited = await creditInvoice(doc, signature);
  if (credited) {
    doc.status = "completed";
    doc.txSignature = signature;
  }
  return doc;
}

async function pollPendingInvoices() {
  try {
    const now = new Date();
    await models.CryptoInvoice.updateMany(
      { status: "pending", expiresAt: { $lte: now } },
      { $set: { status: "expired" } }
    ).exec();

    const solana = getSolanaConfig();
    if (!solana.configured) return;

    const pending = await models.CryptoInvoice.find({
      status: "pending",
      chain: "solana",
      expiresAt: { $gt: now },
    }).exec();

    if (!pending.length) return;

    const txs = await fetchSolanaTransfers(solana);
    for (const invoice of pending) {
      const signature = findMatchingSolanaTx(
        txs,
        invoice,
        solana.depositAddress
      );
      if (!signature) continue;
      const alreadyUsed = await models.CryptoInvoice.findOne({
        txSignature: signature,
        invoiceId: { $ne: invoice.invoiceId },
      })
        .select("_id")
        .lean()
        .exec();
      if (alreadyUsed) continue;
      await creditInvoice(invoice, signature);
    }
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  catalog,
  getPublicOptions,
  getSolanaConfig,
  createInvoice,
  getInvoiceForUser,
  checkInvoice,
  expireInvoice,
  toPublicInvoice,
  pollPendingInvoices,
};
