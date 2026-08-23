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
  "your-alchemy-api-key",
]);

const ataCache = new Map();

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

function envOrDefault(name, fallback = "") {
  const value = envString(name);
  if (isPlaceholder(value)) return fallback;
  return value;
}

function getAlchemyConfig() {
  const apiKey = envString("ALCHEMY_API_KEY");
  const solanaUrl =
    envString("ALCHEMY_SOLANA_URL") ||
    (isPlaceholder(apiKey)
      ? ""
      : `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`);
  const ethUrl =
    envString("ALCHEMY_ETH_URL") ||
    (isPlaceholder(apiKey)
      ? ""
      : `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`);
  const btcUrl =
    envString("ALCHEMY_BTC_URL") ||
    (isPlaceholder(apiKey)
      ? ""
      : `https://bitcoin-mainnet.g.alchemy.com/v2/${apiKey}`);

  const solanaAddress = envOrDefault(
    "SOLANA_DEPOSIT_ADDRESS",
    catalog.CHAINS.solana.defaultDepositAddress
  );
  const ethAddress = envOrDefault(
    "ETH_DEPOSIT_ADDRESS",
    catalog.CHAINS.ethereum.defaultDepositAddress
  );
  const btcAddress = envOrDefault(
    "BITCOIN_DEPOSIT_ADDRESS",
    catalog.CHAINS.bitcoin.defaultDepositAddress
  );

  const solanaMints = {
    USDC: envString("SOLANA_USDC_MINT", catalog.ASSETS.USDC.defaultMints.solana),
    USDT: envString("SOLANA_USDT_MINT", catalog.ASSETS.USDT.defaultMints.solana),
    USD1: envString("SOLANA_USD1_MINT", catalog.ASSETS.USD1.defaultMints.solana),
  };
  const ethContracts = {
    USDC: envString(
      "ETH_USDC_CONTRACT",
      catalog.ASSETS.USDC.defaultMints.ethereum
    ),
    USDT: envString(
      "ETH_USDT_CONTRACT",
      catalog.ASSETS.USDT.defaultMints.ethereum
    ),
    USD1: envString(
      "ETH_USD1_CONTRACT",
      catalog.ASSETS.USD1.defaultMints.ethereum
    ),
  };

  const hasKey = !isPlaceholder(apiKey);
  return {
    apiKey,
    solanaUrl,
    ethUrl,
    btcUrl,
    solanaAddress,
    ethAddress,
    btcAddress,
    solanaMints,
    ethContracts,
    solanaConfigured: hasKey && !isPlaceholder(solanaAddress) && !!solanaUrl,
    ethConfigured: hasKey && !isPlaceholder(ethAddress) && !!ethUrl,
    btcConfigured: hasKey && !isPlaceholder(btcAddress) && !!btcUrl,
  };
}

function getPublicOptions() {
  const alchemy = getAlchemyConfig();
  const assets = [];

  for (const asset of Object.values(catalog.ASSETS)) {
    for (const chainId of asset.chains) {
      const chain = catalog.CHAINS[chainId];
      if (!chain) continue;
      let enabled = false;
      if (chainId === "solana") {
        enabled =
          alchemy.solanaConfigured &&
          !isPlaceholder(alchemy.solanaMints[asset.id]);
      } else if (chainId === "ethereum") {
        enabled =
          alchemy.ethConfigured &&
          !isPlaceholder(alchemy.ethContracts[asset.id]);
      } else if (chainId === "bitcoin") {
        enabled = alchemy.btcConfigured && asset.id === "BTC";
      }
      assets.push({
        id: `${chainId}:${asset.id}`,
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
    alchemyConfigured: Boolean(alchemy.apiKey && !isPlaceholder(alchemy.apiKey)),
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

function rawEqual(a, b) {
  try {
    return BigInt(String(a)) === BigInt(String(b));
  } catch (e) {
    return false;
  }
}

function btcValueToSats(value) {
  const s = String(value).trim();
  if (!s) return "0";
  if (!s.includes(".")) return s;
  const [whole, frac = ""] = s.split(".");
  const fracPadded = (frac + "00000000").slice(0, 8);
  return (BigInt(whole || "0") * 10n ** 8n + BigInt(fracPadded || "0")).toString();
}

async function allocateUniqueAmount({ chain, asset, baseRaw }) {
  const base = BigInt(baseRaw);
  const dustCap = 9999n;

  for (let attempt = 0; attempt < 25; attempt++) {
    const dust = BigInt(Random.randInt(1, Number(dustCap)));
    const expectedAmountRaw = (base + dust).toString();
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

async function fetchBtcUsdPrice() {
  const res = await axios.get("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
    timeout: 10_000,
  });
  const price = Number(res.data?.data?.amount);
  if (!Number.isFinite(price) || price <= 0) {
    throw Object.assign(new Error("Could not fetch BTC price."), { status: 502 });
  }
  return price;
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
    expectedAmountRaw: String(doc.expectedAmountRaw),
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

function buildPayUri({ chain, depositAddress, mint, expectedAmount, expectedAmountRaw }) {
  if (chain === "solana" && mint) {
    return `solana:${depositAddress}?amount=${expectedAmount}&spl-token=${mint}`;
  }
  if (chain === "ethereum" && mint) {
    return `ethereum:${depositAddress}@1/transfer?address=${mint}&uint256=${expectedAmountRaw}`;
  }
  if (chain === "bitcoin") {
    return `bitcoin:${depositAddress}?amount=${expectedAmount}`;
  }
  return "";
}

async function alchemyRpc(url, method, params) {
  const res = await axios.post(
    url,
    { jsonrpc: "2.0", id: 1, method, params },
    { timeout: 15_000, headers: { "Content-Type": "application/json" } }
  );
  if (res.data?.error) {
    throw new Error(res.data.error.message || `${method} failed`);
  }
  return res.data.result;
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

  const alchemy = getAlchemyConfig();
  let depositAddress = "";
  let mint = "";
  let baseRaw;

  if (chain === "solana") {
    if (!alchemy.solanaConfigured) {
      throw Object.assign(new Error("Solana donations are not configured."), {
        status: 503,
      });
    }
    depositAddress = alchemy.solanaAddress;
    mint = alchemy.solanaMints[assetId];
    if (isPlaceholder(mint)) {
      throw Object.assign(new Error(`Missing Solana mint for ${assetId}.`), {
        status: 503,
      });
    }
    baseRaw = BigInt(usdAmount) * 10n ** BigInt(resolved.decimals);
  } else if (chain === "ethereum") {
    if (!alchemy.ethConfigured) {
      throw Object.assign(new Error("Ethereum donations are not configured."), {
        status: 503,
      });
    }
    depositAddress = alchemy.ethAddress;
    mint = alchemy.ethContracts[assetId];
    if (isPlaceholder(mint)) {
      throw Object.assign(new Error(`Missing Ethereum contract for ${assetId}.`), {
        status: 503,
      });
    }
    baseRaw = BigInt(usdAmount) * 10n ** BigInt(resolved.decimals);
  } else if (chain === "bitcoin") {
    if (!alchemy.btcConfigured || assetId !== "BTC") {
      throw Object.assign(new Error("Bitcoin donations are not configured."), {
        status: 503,
      });
    }
    depositAddress = alchemy.btcAddress;
    const btcUsd = await fetchBtcUsdPrice();
    const sats = BigInt(Math.round((usdAmount / btcUsd) * 1e8));
    if (sats <= 0n) {
      throw Object.assign(new Error("BTC amount too small. Increase USD."), {
        status: 400,
      });
    }
    baseRaw = sats;
  } else {
    throw Object.assign(new Error("Unsupported network."), { status: 400 });
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
    baseRaw,
  });
  const expectedAmount = formatTokenAmount(
    expectedAmountRaw,
    resolved.decimals
  );
  const coins = usdAmount * catalog.COINS_PER_USD;
  const now = new Date();
  const payUri = buildPayUri({
    chain,
    depositAddress,
    mint,
    expectedAmount,
    expectedAmountRaw,
  });

  const doc = await models.CryptoInvoice.create({
    invoiceId: shortid.generate(),
    userId,
    chain,
    asset: assetId,
    usd: usdAmount,
    coins,
    depositAddress,
    mint: mint || "",
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
  return models.CryptoInvoice.findOne({ invoiceId, userId }).exec();
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

async function resolveSolanaAta(alchemy, mint) {
  const key = `${alchemy.solanaAddress}:${mint}`;
  if (ataCache.has(key)) return ataCache.get(key);

  const result = await alchemyRpc(alchemy.solanaUrl, "getTokenAccountsByOwner", [
    alchemy.solanaAddress,
    { mint },
    { encoding: "jsonParsed" },
  ]);
  const pubkey = result?.value?.[0]?.pubkey || null;
  if (pubkey) ataCache.set(key, pubkey);
  return pubkey;
}

function solanaIncomingRaw(tx, mint, owner) {
  const meta = tx?.meta;
  if (!meta || meta.err) return null;
  const pre = meta.preTokenBalances || [];
  const post = meta.postTokenBalances || [];
  for (const after of post) {
    if (after.mint !== mint) continue;
    if (after.owner && after.owner !== owner) continue;
    const before = pre.find((row) => row.accountIndex === after.accountIndex);
    const postAmt = BigInt(after.uiTokenAmount?.amount || "0");
    const preAmt = BigInt(before?.uiTokenAmount?.amount || "0");
    const delta = postAmt - preAmt;
    if (delta > 0n) return delta.toString();
  }
  return null;
}

async function findSolanaMatch(alchemy, invoice) {
  const ata = await resolveSolanaAta(alchemy, invoice.mint);
  const watchAddress = ata || alchemy.solanaAddress;
  const sigs = await alchemyRpc(alchemy.solanaUrl, "getSignaturesForAddress", [
    watchAddress,
    { limit: 25 },
  ]);
  for (const row of sigs || []) {
    const signature = row.signature;
    if (!signature || row.err) continue;
    const tx = await alchemyRpc(alchemy.solanaUrl, "getTransaction", [
      signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
    ]);
    const incoming = solanaIncomingRaw(tx, invoice.mint, alchemy.solanaAddress);
    if (incoming && rawEqual(incoming, invoice.expectedAmountRaw)) {
      return signature;
    }
  }
  return null;
}

async function findEthMatch(alchemy, invoice) {
  const result = await alchemyRpc(alchemy.ethUrl, "alchemy_getAssetTransfers", [
    {
      toAddress: alchemy.ethAddress,
      contractAddresses: [invoice.mint],
      category: ["erc20"],
      order: "desc",
      maxCount: "0x20",
      excludeZeroValue: true,
    },
  ]);
  const transfers = result?.transfers || [];
  for (const transfer of transfers) {
    const contract = (transfer.rawContract?.address || "").toLowerCase();
    if (contract !== String(invoice.mint).toLowerCase()) continue;
    const hex = transfer.rawContract?.value;
    if (!hex) continue;
    let incoming;
    try {
      incoming = BigInt(hex).toString();
    } catch (e) {
      continue;
    }
    if (rawEqual(incoming, invoice.expectedAmountRaw)) {
      return transfer.hash;
    }
  }
  return null;
}

async function findBtcMatch(alchemy, invoice) {
  const url = `${alchemy.btcUrl.replace(/\/+$/, "")}/api/v2/address/${encodeURIComponent(
    alchemy.btcAddress
  )}`;
  const res = await axios.get(url, {
    params: { details: "txs", pageSize: 25 },
    timeout: 15_000,
  });
  const txs = res.data?.transactions || res.data?.txs || [];
  if (!Array.isArray(txs)) return null;
  const deposit = alchemy.btcAddress;
  for (const tx of txs) {
    const txid = tx.txid || tx.txId || tx.hash;
    if (!txid) continue;
    const vouts = tx.vout || tx.outputs || [];
    for (const vout of vouts) {
      const addresses = vout.addresses || [];
      if (addresses.length && !addresses.includes(deposit)) continue;
      if (vout.value == null) continue;
      const incoming = btcValueToSats(vout.value);
      if (rawEqual(incoming, invoice.expectedAmountRaw)) {
        return txid;
      }
    }
  }
  return null;
}

async function findMatchingTx(doc) {
  const alchemy = getAlchemyConfig();
  if (doc.chain === "solana" && alchemy.solanaConfigured) {
    return findSolanaMatch(alchemy, doc);
  }
  if (doc.chain === "ethereum" && alchemy.ethConfigured) {
    return findEthMatch(alchemy, doc);
  }
  if (doc.chain === "bitcoin" && alchemy.btcConfigured) {
    return findBtcMatch(alchemy, doc);
  }
  return null;
}

async function creditInvoice(doc, txSignature) {
  const claimed = await models.CryptoInvoice.updateOne(
    { _id: doc._id, status: "pending" },
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

  let signature = null;
  try {
    signature = await findMatchingTx(doc);
  } catch (e) {
    logger.error({
      message: "Alchemy invoice check failed",
      chain: doc.chain,
      invoiceId: doc.invoiceId,
      error: e?.response?.data || e?.message || e,
    });
    return doc;
  }
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

    const pending = await models.CryptoInvoice.find({
      status: "pending",
      expiresAt: { $gt: now },
    }).exec();

    for (const invoice of pending) {
      await checkInvoice(invoice);
    }
  } catch (e) {
    logger.error(e);
  }
}

const UNPAID_STATUSES = ["pending", "expired", "failed"];

async function userIsOwner(userId) {
  const userDoc = await models.User.findOne({ id: userId, deleted: false })
    .select("_id")
    .lean()
    .exec();
  if (!userDoc) return false;
  const ownerGroup = await models.Group.findOne({ name: /^Owner$/i })
    .select("_id")
    .lean()
    .exec();
  if (!ownerGroup) return false;
  const inGroup = await models.InGroup.findOne({
    user: userDoc._id,
    group: ownerGroup._id,
  })
    .select("_id")
    .lean()
    .exec();
  return Boolean(inGroup);
}

async function listInvoicesForOwner({ status, page = 1, limit = 50 }) {
  const query = {};
  if (status === "unpaid") {
    query.status = { $in: UNPAID_STATUSES };
  } else if (status) {
    query.status = status;
  }

  const skip = Math.max(0, (Number(page) || 1) - 1) * limit;
  const [rows, total] = await Promise.all([
    models.CryptoInvoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    models.CryptoInvoice.countDocuments(query),
  ]);

  const userIds = [...new Set(rows.map((row) => row.userId).filter(Boolean))];
  const users = await models.User.find({ id: { $in: userIds } })
    .select("id name avatar")
    .lean()
    .exec();
  const userMap = {};
  for (const u of users) userMap[u.id] = u;

  return {
    total,
    page: Number(page) || 1,
    pageSize: limit,
    invoices: rows.map((row) => {
      const user = userMap[row.userId] || {};
      return {
        ...toPublicInvoice(row),
        userName: user.name || row.userId,
        userAvatar: Boolean(user.avatar),
        canReview: UNPAID_STATUSES.includes(row.status),
        reviewedBy: row.reviewedBy || "",
        reviewedAt: row.reviewedAt || null,
      };
    }),
  };
}

async function approveInvoiceByOwner(invoiceId, ownerUserId) {
  const doc = await models.CryptoInvoice.findOne({ invoiceId }).exec();
  if (!doc) {
    throw Object.assign(new Error("Invoice not found."), { status: 404 });
  }
  if (doc.status === "completed") {
    throw Object.assign(new Error("Invoice is already completed."), {
      status: 409,
    });
  }
  if (!UNPAID_STATUSES.includes(doc.status)) {
    throw Object.assign(new Error("Only unpaid invoices can be approved."), {
      status: 400,
    });
  }

  const claimed = await models.CryptoInvoice.updateOne(
    { _id: doc._id, status: { $in: UNPAID_STATUSES } },
    {
      $set: {
        status: "completed",
        txSignature: `manual:${invoiceId}`,
        completedAt: new Date(),
        reviewedBy: ownerUserId,
        reviewedAt: new Date(),
      },
    }
  ).exec();
  const updatedCount =
    claimed.modifiedCount ?? claimed.nModified ?? claimed.matchedCount ?? 0;
  if (!updatedCount) {
    throw Object.assign(new Error("Invoice could not be approved."), {
      status: 409,
    });
  }

  await models.User.updateOne(
    { id: doc.userId },
    { $inc: { coins: doc.coins } }
  ).exec();
  await redis.cacheUserInfo(doc.userId, true);
  await ensureDonorStatus(doc.userId);
  const fresh = await models.CryptoInvoice.findOne({ invoiceId }).lean().exec();
  return toPublicInvoice(fresh);
}

async function rejectInvoiceByOwner(invoiceId, ownerUserId) {
  const doc = await models.CryptoInvoice.findOne({ invoiceId }).exec();
  if (!doc) {
    throw Object.assign(new Error("Invoice not found."), { status: 404 });
  }
  if (!UNPAID_STATUSES.includes(doc.status)) {
    throw Object.assign(new Error("Only unpaid invoices can be rejected."), {
      status: 400,
    });
  }

  const claimed = await models.CryptoInvoice.updateOne(
    { _id: doc._id, status: { $in: UNPAID_STATUSES } },
    {
      $set: {
        status: "rejected",
        reviewedBy: ownerUserId,
        reviewedAt: new Date(),
      },
    }
  ).exec();
  const updatedCount =
    claimed.modifiedCount ?? claimed.nModified ?? claimed.matchedCount ?? 0;
  if (!updatedCount) {
    throw Object.assign(new Error("Invoice could not be rejected."), {
      status: 409,
    });
  }
  const fresh = await models.CryptoInvoice.findOne({ invoiceId }).lean().exec();
  return toPublicInvoice(fresh);
}

module.exports = {
  catalog,
  getPublicOptions,
  getAlchemyConfig,
  createInvoice,
  getInvoiceForUser,
  checkInvoice,
  expireInvoice,
  toPublicInvoice,
  pollPendingInvoices,
  userIsOwner,
  listInvoicesForOwner,
  approveInvoiceByOwner,
  rejectInvoiceByOwner,
};
