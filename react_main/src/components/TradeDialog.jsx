import React, { useState, useMemo, useContext } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  TextField,
  Paper,
  useTheme
} from "@mui/material";
import { UserContext, SiteInfoContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { Avatar } from "pages/User/User"; // Reuse existing custom Avatar component
import { Icon } from "@iconify/react";

export default function TradeDialog({ open, onClose, stock, initialType = "buy", onSuccess }) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  const goldColor = theme.palette.mode === "light" ? "#b8860b" : "gold";

  const [tradeType, setTradeType] = useState(initialType);
  const [shareCount, setShareCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Reset modal state when opening with a new stock
  React.useEffect(() => {
    if (open) {
      setTradeType(initialType || "buy");
      setShareCount(1);
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
    if (shareCount <= 0) return;
    setSubmitting(true);

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
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: "bold", borderBottom: 1, borderColor: "divider", pb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {stock.targetType === "player" ? (
            <Avatar id={stock.id} name={stock.name} hasImage={stock.avatar} size={40} />
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
                ...(stock.avatar ? {
                  backgroundImage: `url(/uploads/${stock.id}_family_avatar.webp?t=${siteInfo?.cacheVal})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                } : {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }),
              }}
            >
              {!stock.avatar && <Icon icon="lucide:users" style={{ fontSize: "20px" }} />}
            </Box>
          )}
          <Box>
            <Typography sx={{ fontWeight: "bold", fontSize: "1.1rem", lineHeight: 1.2 }}>
              {stock.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current share supply: {stock.shareSupply}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={3} sx={{ pt: 1.5 }}>
          <ToggleButtonGroup
            value={tradeType}
            exclusive
            onChange={(e, val) => {
              if (val) {
                setTradeType(val);
                setShareCount(1);
              }
            }}
            fullWidth
            color={tradeType === "buy" ? "success" : "error"}
          >
            <ToggleButton value="buy">
              Buy Shares
            </ToggleButton>
            <ToggleButton value="sell">Sell Shares</ToggleButton>
          </ToggleButtonGroup>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Number of Shares
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                onClick={() => setShareCount((c) => Math.max(1, c - 1))}
                sx={{ minWidth: 48 }}
              >
                -
              </Button>
              <TextField
                fullWidth
                type="number"
                value={shareCount}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (num > 0) setShareCount(Math.floor(num));
                }}
                slotProps={{ htmlInput: { min: 1, style: { textAlign: "center" } } }}
              />
              <Button
                variant="outlined"
                onClick={() => setShareCount((c) => c + 1)}
                sx={{ minWidth: 48 }}
              >
                +
              </Button>
            </Stack>
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

          <Paper variant="outlined" sx={{ p: 2, backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)" }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Base Price:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {tradePreview.price.toFixed(2)} Coins
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  {stock.targetType === "player" 
                    ? `Creator Fee (${((siteInfo.marketConfig?.creatorFeePct ?? 0.015) * 100)}%):` 
                    : `Treasury Fee (${((siteInfo.marketConfig?.creatorFeePct ?? 0.015) * 100)}%):`}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +{tradePreview.creatorFee.toFixed(2)} Coins
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  System Fee ({((siteInfo.marketConfig?.systemFeePct ?? 0.01) * 100)}%):
                </Typography>
                <Typography variant="body2" color="warning.main">
                  +{tradePreview.systemFee.toFixed(2)} Coins
                </Typography>
              </Stack>
              <Box sx={{ borderTop: 1, borderColor: "divider", my: 1, pt: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: "bold" }}>
                  {tradeType === "buy" ? "Total Cost:" : "Total Payout:"}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: goldColor }}>
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
      </DialogContent>

      <DialogActions sx={{ borderTop: 1, borderColor: "divider", p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={tradeType === "buy" ? "success" : "error"}
          onClick={handleConfirmTrade}
          disabled={
            submitting ||
            shareCount <= 0 ||
            (tradeType === "buy" && user.coins < tradePreview.total) ||
            (tradeType === "sell" && stock.sharesOwned < shareCount) ||
            (tradeType === "sell" && stock.shareSupply - shareCount < 1)
          }
        >
          {submitting ? "Trading..." : tradeType === "buy" ? "Buy" : "Sell"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
