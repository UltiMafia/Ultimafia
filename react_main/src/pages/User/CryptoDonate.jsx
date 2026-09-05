import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { SiteInfoContext, UserContext } from "../../Contexts";
import { useErrorAlert } from "../../components/Alerts";

const NETWORKS = [
  {
    id: "bitcoin",
    label: "Bitcoin",
    icon: "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  {
    id: "ethereum",
    label: "Ethereum",
    icon: "https://coin-images.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    id: "solana",
    label: "Solana",
    icon: "https://coin-images.coingecko.com/coins/images/4128/small/solana.png",
  },
];

const TOKEN_ORDER = ["USD1", "USDC", "USDT", "BTC"];

const TOKEN_ICONS = {
  BTC: "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png",
  USD1: "https://coin-images.coingecko.com/coins/images/54977/small/USD1_1000x1000_transparent.png",
  USDC: "https://coin-images.coingecko.com/coins/images/6319/small/USDC.png",
  USDT: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png",
};

function parseUsdAmount(input) {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function formatRemaining(expiresAt, _now) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function CoinIcon({ src, alt }) {
  if (!src) return null;
  return (
    <Box
      component="img"
      src={src}
      alt={alt || ""}
      sx={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        flexShrink: 0,
      }}
    />
  );
}

function OptionLabel({ icon, label }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <CoinIcon src={icon} alt="" />
      <span>{label}</span>
    </Stack>
  );
}

function CopyRow({ label, value }) {
  const siteInfo = useContext(SiteInfoContext);

  function copy() {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => siteInfo.showAlert(`Copied ${label}.`, "success"))
      .catch(() => siteInfo.showAlert("Could not copy.", "error"));
  }

  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            flex: 1,
          }}
        >
          {value}
        </Typography>
        <Button size="small" onClick={copy}>
          Copy
        </Button>
      </Stack>
    </Stack>
  );
}

function InvoiceCard({ invoice, onUpdated, onRemoved }) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [checkCooldownUntil, setCheckCooldownUntil] = useState(0);
  const [busy, setBusy] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const checkCooldownMs = Math.max(0, checkCooldownUntil - nowTick);
  const checkCooldownLabel =
    checkCooldownMs > 0
      ? `Check now (${Math.ceil(checkCooldownMs / 1000)}s)`
      : "Check now";

  async function checkNow() {
    if (!invoice?.id || Date.now() < checkCooldownUntil) return;
    try {
      setCheckCooldownUntil(Date.now() + 5 * 60 * 1000);
      const res = await axios.post(`/api/crypto/invoice/${invoice.id}/check`);
      if (res.data?.status === "completed" && res.data.coins) {
        siteInfo.showAlert(
          `Received ${res.data.coins} coins from your crypto payment.`,
          "success"
        );
        onRemoved(invoice.id);
        return;
      }
      if (res.data?.status === "pending") {
        onUpdated(res.data);
      } else {
        onRemoved(invoice.id);
      }
    } catch (e) {
      errorAlert(e);
    }
  }

  async function cancelInvoice() {
    if (!invoice?.id) return;
    if (!window.confirm("Cancel this invoice? You can still contact staff if you already sent payment.")) {
      return;
    }
    setBusy(true);
    try {
      await axios.post(`/api/crypto/invoice/${invoice.id}/cancel`);
      siteInfo.showAlert("Invoice cancelled.", "success");
      onRemoved(invoice.id);
    } catch (e) {
      errorAlert(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2">
          Status: {invoice.status}
          {invoice.status === "pending"
            ? ` · ${formatRemaining(invoice.expiresAt, nowTick)} left`
            : ""}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <CoinIcon src={TOKEN_ICONS[invoice.asset]} alt={invoice.asset} />
          <CoinIcon
            src={NETWORKS.find((row) => row.id === invoice.chain)?.icon}
            alt={invoice.chainLabel}
          />
          <Typography variant="body2">
            Send exactly {invoice.expectedAmount} {invoice.asset} on{" "}
            {invoice.chainLabel}. {invoice.coins} coins after confirmation.
          </Typography>
        </Stack>
        <CopyRow label="Deposit address" value={invoice.depositAddress} />
        {invoice.mint ? (
          <CopyRow
            label={
              invoice.chain === "ethereum" ? "Token contract" : "Token mint"
            }
            value={invoice.mint}
          />
        ) : null}
        <CopyRow
          label="Exact amount"
          value={`${invoice.expectedAmount} ${invoice.asset}`}
        />
        {invoice.payUri ? (
          <CopyRow label="Payment URI" value={invoice.payUri} />
        ) : null}
        {invoice.payUri ? (
          <Box
            sx={{
              alignSelf: "flex-start",
              bgcolor: "#ffffff",
              p: 1.5,
              borderRadius: 1,
            }}
          >
            <QRCodeSVG
              value={invoice.payUri}
              size={192}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 1, color: "#333333", textAlign: "center" }}
            >
              Scan with a mobile wallet
            </Typography>
          </Box>
        ) : null}
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            onClick={checkNow}
            disabled={checkCooldownMs > 0 || busy}
          >
            {checkCooldownLabel}
          </Button>
          <Button
            size="small"
            color="error"
            onClick={cancelInvoice}
            disabled={busy}
          >
            Cancel invoice
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function CryptoDonate() {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [options, setOptions] = useState(null);
  const [usdAmount, setUsdAmount] = useState("5");
  const [network, setNetwork] = useState("");
  const [token, setToken] = useState("");
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [creating, setCreating] = useState(false);
  const didInitSelection = useRef(false);

  const enabledAssets = useMemo(
    () => (options?.assets || []).filter((row) => row.enabled),
    [options]
  );

  const enabledNetworks = useMemo(() => {
    const ids = new Set(enabledAssets.map((row) => row.chain));
    return NETWORKS.filter((row) => ids.has(row.id));
  }, [enabledAssets]);

  const tokensForNetwork = useMemo(() => {
    const rows = enabledAssets.filter((row) => row.chain === network);
    return TOKEN_ORDER.filter((id) => rows.some((row) => row.asset === id)).map(
      (id) => rows.find((row) => row.asset === id)
    );
  }, [enabledAssets, network]);

  const coinsPerUsd = options?.coinsPerUsd || 5;
  const parsedUsd = parseUsdAmount(usdAmount);
  const coinsPreview = (parsedUsd || 0) * coinsPerUsd;
  const selectedToken = tokensForNetwork.find((row) => row.asset === token);

  useEffect(() => {
    if (!user.loaded || !user.loggedIn) return undefined;
    let cancelled = false;

    axios
      .get("/api/crypto/options")
      .then((res) => {
        if (cancelled) return;
        const assets = (res.data?.assets || []).filter((row) => row.enabled);
        setOptions(res.data);
        if (!didInitSelection.current && assets.length) {
          didInitSelection.current = true;
          setNetwork(assets[0].chain);
          setToken(assets[0].asset);
        }
      })
      .catch((e) => {
        if (!cancelled) errorAlert(e);
      });

    axios
      .get("/api/crypto/mine")
      .then((res) => {
        if (cancelled) return;
        setPendingInvoices(res.data?.invoices || []);
      })
      .catch((e) => {
        if (!cancelled) errorAlert(e);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- errorAlert identity changes every render
  }, [user.loaded, user.loggedIn]);

  useEffect(() => {
    if (!network || !tokensForNetwork.length) return;
    if (!tokensForNetwork.some((row) => row.asset === token)) {
      setToken(tokensForNetwork[0].asset);
    }
  }, [network, tokensForNetwork, token]);

  useEffect(() => {
    if (!pendingInvoices.length) return undefined;
    const interval = setInterval(() => {
      axios
        .get("/api/crypto/mine")
        .then((res) => setPendingInvoices(res.data?.invoices || []))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [pendingInvoices.length]);

  async function createInvoice() {
    if (!parsedUsd) {
      siteInfo.showAlert("Enter a valid positive whole USD amount.", "error");
      return;
    }
    if (!selectedToken) {
      siteInfo.showAlert("Select a network and token.", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post("/api/crypto/invoice", {
        usdAmount: parsedUsd,
        chain: selectedToken.chain,
        asset: selectedToken.asset,
      });
      setPendingInvoices((prev) => [
        res.data,
        ...prev.filter((row) => row.id !== res.data.id),
      ]);
    } catch (e) {
      errorAlert(e);
    } finally {
      setCreating(false);
    }
  }

  function updatePending(next) {
    setPendingInvoices((prev) =>
      prev.map((row) => (row.id === next.id ? next : row))
    );
  }

  function removePending(id) {
    setPendingInvoices((prev) => prev.filter((row) => row.id !== id));
  }

  if (!options) {
    return (
      <Typography variant="body2" color="textSecondary">
        Loading crypto donation options...
      </Typography>
    );
  }

  if (!enabledAssets.length) {
    return (
      <Typography variant="body2" color="textSecondary">
        Crypto donations are not configured yet. Add an Alchemy API key and
        deposit addresses on the server.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        1 USD = {coinsPerUsd} coins. Send the exact invoice amount (includes a
        tiny unique dust so we can match your payment). Unpaid invoices are
        cancelled after 30 minutes.
      </Typography>
      <TextField
        label="USD Amount"
        type="number"
        value={usdAmount}
        onChange={(e) => setUsdAmount(e.target.value)}
        helperText="Whole USD amounts only."
      />
      <TextField
        select
        label="Network"
        value={network}
        onChange={(e) => setNetwork(e.target.value)}
        SelectProps={{
          renderValue: (value) => {
            const row = NETWORKS.find((item) => item.id === value);
            if (!row) return value;
            return <OptionLabel icon={row.icon} label={row.label} />;
          },
        }}
      >
        {enabledNetworks.map((row) => (
          <MenuItem key={row.id} value={row.id}>
            <OptionLabel icon={row.icon} label={row.label} />
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        disabled={!tokensForNetwork.length}
        helperText={
          network === "bitcoin"
            ? "Bitcoin payments use BTC."
            : "USD1, USDC, or USDT on the selected network."
        }
        SelectProps={{
          renderValue: (value) => (
            <OptionLabel icon={TOKEN_ICONS[value]} label={value} />
          ),
        }}
      >
        {tokensForNetwork.map((row) => (
          <MenuItem key={row.id} value={row.asset}>
            <OptionLabel
              icon={TOKEN_ICONS[row.asset]}
              label={row.asset}
            />
          </MenuItem>
        ))}
      </TextField>
      <Typography variant="body2" color="textSecondary">
        Coins to receive: {coinsPreview}
      </Typography>
      <Button
        variant="contained"
        onClick={createInvoice}
        disabled={creating || !parsedUsd || !selectedToken}
      >
        {creating ? "Creating invoice..." : "Create crypto invoice"}
      </Button>

      {pendingInvoices.length > 0 && (
        <Typography variant="subtitle2" sx={{ pt: 1 }}>
          Your unpaid invoices
        </Typography>
      )}
      {pendingInvoices.map((row) => (
        <InvoiceCard
          key={row.id}
          invoice={row}
          onUpdated={updatePending}
          onRemoved={removePending}
        />
      ))}
    </Stack>
  );
}
