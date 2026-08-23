/**
 * Crypto donation catalog.
 * Monitoring is Alchemy (Solana / Ethereum / Bitcoin).
 *
 * Override mints/contracts with env:
 * SOLANA_USDC_MINT, SOLANA_USDT_MINT, SOLANA_USD1_MINT
 * ETH_USDC_CONTRACT, ETH_USDT_CONTRACT, ETH_USD1_CONTRACT
 */

const COINS_PER_USD = 5;
const MIN_PURCHASE_USD = 1;
const MAX_PURCHASE_USD = 200;
const INVOICE_TTL_MS = 30 * 60 * 1000;
const POLL_INTERVAL_MS = 60 * 1000;

const CHAINS = {
  solana: {
    id: "solana",
    label: "Solana",
    explorerTx: "https://solscan.io/tx/",
  },
  ethereum: {
    id: "ethereum",
    label: "Ethereum",
    explorerTx: "https://etherscan.io/tx/",
  },
  bitcoin: {
    id: "bitcoin",
    label: "Bitcoin",
    explorerTx: "https://mempool.space/tx/",
  },
};

const ASSETS = {
  USDC: {
    id: "USDC",
    label: "USDC",
    kind: "stablecoin",
    decimals: {
      solana: 6,
      ethereum: 6,
    },
    chains: ["solana", "ethereum"],
    defaultMints: {
      solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
  },
  USDT: {
    id: "USDT",
    label: "USDT",
    kind: "stablecoin",
    decimals: {
      solana: 6,
      ethereum: 6,
    },
    chains: ["solana", "ethereum"],
    defaultMints: {
      solana: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    },
  },
  USD1: {
    id: "USD1",
    label: "USD1",
    kind: "stablecoin",
    decimals: {
      solana: 6,
      ethereum: 18,
    },
    chains: ["solana", "ethereum"],
    defaultMints: {
      solana: "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB",
      ethereum: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
    },
  },
  BTC: {
    id: "BTC",
    label: "Bitcoin",
    kind: "crypto",
    decimals: {
      bitcoin: 8,
    },
    chains: ["bitcoin"],
    defaultMints: {},
  },
};

module.exports = {
  COINS_PER_USD,
  MIN_PURCHASE_USD,
  MAX_PURCHASE_USD,
  INVOICE_TTL_MS,
  POLL_INTERVAL_MS,
  CHAINS,
  ASSETS,
};
