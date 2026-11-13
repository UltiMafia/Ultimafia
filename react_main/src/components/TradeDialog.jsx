import React, { useState, useMemo, useContext } from "react";
import axios from "axios";
import {
  Stack,
  Box,
  Typography,
  Paper,
  useTheme
} from "@mui/material";
import { UserContext, SiteInfoContext } from "Contexts";
import { Avatar } from "pages/User/UserWidgets"; // Reuse existing custom Avatar component
import { FamilyAvatarImage } from "utils/avatarUrl";
import { UiDialog, UiAction, UiIcon, UiField } from "./ui";
import { boundedShareCount, MAX_SHARES_PER_TRADE } from "../utils/stockTradeInput.mjs";

export default function TradeDialog({ open, onClose, stock, initialType = "buy", onSuccess }) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const theme = useTheme();

  const goldColor = theme.palette.mode === "light" ? "#b8860b" : "gold";

  const [tradeType, setTradeType] = useState(initialType);
  const [shareCount, setShareCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState("");

  // Reset modal state when opening with a new stock
  React.useEffect(() => {
    if (open) {
      setTradeType(initialType || "buy");
      setShareCount(1);
      setTradeError("");
    }
  }, [open, stock, initialType]);

  // Calculate pricing preview for modal on bonding curve
  const tradePreview = useMemo(() => {
    if (!stock || shareCount <= 0) {
      return { price: 0, creatorFee: 0, systemFee: 0, total: 0 };
    }

    const creatorFeePct = siteInfo.marketConfig?.creatorFeePct ?? 0.015;
    const systemFeePct = siteInfo.marketConfig?.systemFeePct ?? 0.01;

    const currentSupply = stock.shareSupply;
    let basePrice = 0;

    if (tradeType === "buy") {
      for (let i = 1; i <= shareCount; i++) {
        const S = currentSupply + i;
        basePrice += Math.max(1, Math.floor((S * S) / 100));
      }
      const creatorFee = parseFloat((basePrice * creatorFeePct).toFixed(2));
      const systemFee = parseFloat((basePrice * systemFeePct).toFixed(2));
      return {
        price: basePrice,
        creatorFee,
        systemFee,
        total: parseFloat((basePrice + creatorFee + systemFee).toFixed(2)),
      };
    } else {
      const sellCount = Math.min(shareCount, currentSupply);
      for (let i = 0; i < sellCount; i++) {
        const S = currentSupply - i;
        basePrice += Math.max(1, Math.floor((S * S) / 100));
      }
      const creatorFee = parseFloat((basePrice * creatorFeePct).toFixed(2));
      const systemFee = parseFloat((basePrice * systemFeePct).toFixed(2));
      return {
        price: basePrice,
        creatorFee,
        systemFee,
        total: Math.max(0, parseFloat((basePrice - creatorFee - systemFee).toFixed(2))),
      };
    }
  }, [stock, tradeType, shareCount, siteInfo.marketConfig]);

  if (!stock) return null;

  const handleConfirmTrade = () => {
    if (submitting || !user.loggedIn || shareCount < 1 || shareCount > MAX_SHARES_PER_TRADE) return;
    setSubmitting(true);
    setTradeError("");

    const isPlayer = stock.targetType === "player";
    const endpoint = isPlayer
      ? (tradeType === "buy" ? "/api/stocks/buy" : "/api/stocks/sell")
      : (tradeType === "buy" ? "/api/stocks/families/buy" : "/api/stocks/families/sell");

    const payload = isPlayer
      ? { subjectId: stock.id, shares: shareCount }
      : { familyId: stock.id, shares: shareCount };

    axios
      .post(endpoint, payload)
      .then((res) => {
        const msg =
          tradeType === "buy"
            ? `Successfully bought ${shareCount} shares for ${res.data.total} coins.`
            : `Successfully sold ${shareCount} shares for ${res.data.totalPayout} coins.`;
        siteInfo.showAlert(msg, "success");
        onClose();
        if (onSuccess) onSuccess();
      })
      .catch(error => setTradeError(typeof error.response?.data === "string" && error.response.data.length <= 200 ? error.response.data : "Could not complete this trade. Please try again."))
      .finally(() => setSubmitting(false));
  };


  return (
    <UiDialog open={open} onClose={submitting ? undefined : onClose} title="Trade shares" maxWidth="xs"
      actions={<><UiAction onClick={onClose} disabled={submitting}>Cancel</UiAction><UiAction variant="primary" busy={submitting} onClick={handleConfirmTrade} disabled={!user.loggedIn || shareCount < 1 || shareCount > MAX_SHARES_PER_TRADE || (tradeType === "buy" && user.coins < tradePreview.total) || (tradeType === "sell" && (stock.sharesOwned < shareCount || stock.shareSupply - shareCount < 1))}>{tradeType === "buy" ? "Buy" : "Sell"}</UiAction></>}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {stock.targetType === "player" ? (
            <Avatar id={stock.id} name={stock.name} hasImage={stock.avatar} size={40} />
          ) : (
            stock.avatar ? (
              <FamilyAvatarImage
                id={stock.id}
                size={40}
                cacheVal={siteInfo?.cacheVal}
                extraStyle={{ border: "1px solid rgba(255, 255, 255, 0.12)" }}
              />
            ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }}
            >
              <UiIcon name="people" size={24} />
            </Box>
            )
          )}
          <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", lineHeight: 1.2 }}>
              {stock.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current share supply: {stock.shareSupply}
            </Typography>
          </Box>
        </Stack>
        <Stack spacing={3} sx={{ pt: 1.5 }}>
          {tradeError && <p role="alert">{tradeError}</p>}
          <div role="group" aria-label="Transaction type" style={{ display: "flex", gap: 8 }}>
            {["buy", "sell"].map(type => <UiAction key={type} disabled={submitting} aria-pressed={tradeType === type} onClick={() => { setTradeType(type); setShareCount(1); }}>{type === "buy" ? "Buy shares" : "Sell shares"}</UiAction>)}
          </div>

          <Box>
            <Typography component="label" htmlFor="stock-trade-shares" variant="subtitle2" sx={{ display: "block", mb: 1 }}>
              Number of shares
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <UiAction iconOnly aria-label="Decrease shares" disabled={submitting || shareCount === 1} onClick={() => setShareCount(count => boundedShareCount(count - 1))}><UiIcon name="remove" /></UiAction>
              <UiField
                id="stock-trade-shares"
                fullWidth
                type="number"
                value={shareCount}
                onChange={(e) => {
                  setShareCount(boundedShareCount(e.target.value));
                }}
                disabled={submitting}
                slotProps={{ htmlInput: { min: 1, max: MAX_SHARES_PER_TRADE, step: 1, "aria-describedby": "stock-trade-share-limit", style: { textAlign: "center" } } }}
              />
              <UiAction iconOnly aria-label="Increase shares" disabled={submitting || shareCount === MAX_SHARES_PER_TRADE} onClick={() => setShareCount(count => boundedShareCount(count + 1))}><UiIcon name="add" /></UiAction>
            </Stack>
            <Typography id="stock-trade-share-limit" variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>1–{MAX_SHARES_PER_TRADE} shares per trade</Typography>
            {tradeType === "sell" && (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  You own {stock.sharesOwned} shares.
                </Typography>
                {stock.shareSupply - shareCount < 1 && (
                  <Typography variant="caption" color="error.main" display="block">
                    At least 1 share must remain in circulation.
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)" }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography variant="body2">Base Price:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                  {tradePreview.price.toFixed(2)} Coins
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography variant="body2">
                  {stock.targetType === "player" 
                    ? `Creator Fee (${((siteInfo.marketConfig?.creatorFeePct ?? 0.015) * 100)}%):` 
                    : `Treasury Fee (${((siteInfo.marketConfig?.creatorFeePct ?? 0.015) * 100)}%):`}
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ whiteSpace: "nowrap" }}>
                  {tradeType === "buy" ? "+" : "−"}{tradePreview.creatorFee.toFixed(2)} Coins
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography variant="body2">
                  System Fee ({((siteInfo.marketConfig?.systemFeePct ?? 0.01) * 100)}%):
                </Typography>
                <Typography variant="body2" color="warning.main" sx={{ whiteSpace: "nowrap" }}>
                  {tradeType === "buy" ? "+" : "−"}{tradePreview.systemFee.toFixed(2)} Coins
                </Typography>
              </Stack>
              <Box sx={{ borderTop: 1, borderColor: "divider", my: 1, pt: 1 }} />
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography sx={{ fontWeight: "bold" }}>
                  {tradeType === "buy" ? "Total Cost:" : "Total Payout:"}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: goldColor, whiteSpace: "nowrap" }}>
                  {tradePreview.total.toFixed(2)} Coins
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {user.loggedIn && (
            <Stack direction="row" justifyContent="space-between" sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Coins After Trade:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  color:
                    tradeType === "buy"
                      ? user.coins >= tradePreview.total
                        ? "success.main"
                        : "error.main"
                      : "success.main",
                }}
              >
                {tradeType === "buy"
                  ? (user.coins - tradePreview.total).toFixed(2)
                  : (user.coins + tradePreview.total).toFixed(2)}{" "}
                Coins
              </Typography>
            </Stack>
          )}
        </Stack>
    </UiDialog>
  );
}
