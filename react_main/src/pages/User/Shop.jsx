import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

import {
  Box,
  Button,
  Typography,
  Card,
  TextField,
  Stack,
  Paper,
  Grid2,
  CardActionArea,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from "@mui/material";

import { Loading } from "../../components/Loading";

import coin from "images/umcoin.png";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

const SHOP_CATEGORIES = [
  { key: "profile", label: "Profile" },
  { key: "decksEmotes", label: "Decks & Emotes" },
  { key: "game", label: "Game" },
  { key: "site", label: "Site" },
];

function parseGameId(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/\/game\/([^/?\s]+)/);
  if (match) return match[1];
  // If no URL pattern, treat the whole input as a raw game ID (no slashes/spaces)
  if (/^[^\s/]+$/.test(trimmed)) return trimmed;
  return "";
}

function parseUsdAmount(input) {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function Shop(props) {
  const [shopInfo, setShopInfo] = useState({ shopItems: [], balance: 0 });
  const [loaded, setLoaded] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [stampGameUrl, setStampGameUrl] = useState("");
  const [stampDialogOpen, setStampDialogOpen] = useState(false);
  const [stampSuggestions, setStampSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState("shop");
  const [payPalClientId, setPayPalClientId] = useState("");
  const [payPalScriptReady, setPayPalScriptReady] = useState(false);
  const [payPalLoading, setPayPalLoading] = useState(false);
  const [purchaseUsd, setPurchaseUsd] = useState("5");
  const payPalButtonsRef = useRef(null);
  const payPalButtonsInstanceRef = useRef(null);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();
  const location = useLocation();
  const [autoBuyTriggered, setAutoBuyTriggered] = useState(false);

  useEffect(() => {
    document.title = "Shop | UltiMafia";
  }, []);

  useEffect(() => {
    if (user.loaded && user.loggedIn) {
      axios
        .get("/api/shop/info")
        .then((res) => {
          setShopInfo(res.data);
          setLoaded(true);
        })
        .catch(errorAlert);
    }
  }, [user.loaded]);

  useEffect(() => {
    if (!loaded || autoBuyTriggered) return;
    const params = new URLSearchParams(location.search);
    const buyKey = params.get("buy");
    if (!buyKey) return;
    const index = shopInfo.shopItems.findIndex((item) => item.key === buyKey);
    if (index < 0) return;
    const item = shopInfo.shopItems[index];
    const numOwned = user.itemsOwned[item.key] || 0;
    if (item.disabled || numOwned === item.limit) return;
    setAutoBuyTriggered(true);
    onBuyItem(index);
  }, [loaded, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "manage") {
      setActiveTab("manage");
    }
  }, [location.search]);

  useEffect(() => {
    if (!user.loaded || !user.loggedIn) return;
    axios
      .get("/api/shop/paypal-client-id")
      .then((res) => {
        if (res.data?.clientId) {
          setPayPalClientId(res.data.clientId);
        }
      })
      .catch(errorAlert);
  }, [user.loaded, user.loggedIn]);

  useEffect(() => {
    if (!payPalClientId) return;

    const existingScript = document.querySelector(
      `script[data-paypal-client-id="${payPalClientId}"]`
    );
    if (existingScript && window.paypal) {
      setPayPalScriptReady(true);
      return;
    }

    setPayPalScriptReady(false);
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      payPalClientId
    )}&currency=USD&intent=capture`;
    script.async = true;
    script.dataset.paypalClientId = payPalClientId;
    script.onload = () => setPayPalScriptReady(true);
    script.onerror = () =>
      siteInfo.showAlert("Failed to load PayPal.", "error");
    document.body.appendChild(script);
  }, [payPalClientId]);

  useEffect(() => {
    const usdAmount = parseUsdAmount(purchaseUsd);
    if (
      activeTab !== "manage" ||
      !payPalScriptReady ||
      !payPalButtonsRef.current ||
      !usdAmount
    ) {
      return;
    }
    if (!window.paypal || typeof window.paypal.Buttons !== "function") {
      return;
    }

    if (payPalButtonsInstanceRef.current) {
      payPalButtonsInstanceRef.current.close();
      payPalButtonsInstanceRef.current = null;
    }
    payPalButtonsRef.current.innerHTML = "";

    const buttons = window.paypal.Buttons({
      createOrder: () =>
        axios
          .post("/api/shop/paypal/create-order", { amountUsd: usdAmount })
          .then((res) => res.data.orderID),
      onApprove: (data) => {
        setPayPalLoading(true);
        return axios
          .post("/api/shop/paypal/capture-order", { orderID: data.orderID })
          .then((res) => {
            const { coinsAdded, balance } = res.data || {};
            if (Number.isFinite(balance)) {
              setShopInfo((prev) => ({
                ...prev,
                balance,
              }));
            } else if (Number.isFinite(coinsAdded) && coinsAdded > 0) {
              setShopInfo((prev) => ({
                ...prev,
                balance: prev.balance + coinsAdded,
              }));
            }
            if (coinsAdded > 0) {
              siteInfo.showAlert(
                `${coinsAdded} coins added to your account.`,
                "success"
              );
            } else {
              siteInfo.showAlert("Payment already processed.", "success");
            }
          })
          .catch(errorAlert)
          .finally(() => setPayPalLoading(false));
      },
      onError: () => {
        siteInfo.showAlert("PayPal checkout failed.", "error");
      },
    });

    payPalButtonsInstanceRef.current = buttons;
    buttons.render(payPalButtonsRef.current).catch(() => {
      siteInfo.showAlert("Could not render PayPal buttons.", "error");
    });

    return () => {
      if (payPalButtonsInstanceRef.current) {
        payPalButtonsInstanceRef.current.close();
        payPalButtonsInstanceRef.current = null;
      }
    };
  }, [activeTab, payPalScriptReady, purchaseUsd]);

  const handleTransferCoins = () => {
    if (!recipient || !amount) {
      siteInfo.showAlert("Please fill out all fields.", "error");
      return;
    }

    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      siteInfo.showAlert(
        "Please enter a valid positive integer amount.",
        "error"
      );
      return;
    }

    axios
      .post("/api/shop/transferCoins", {
        recipientUsername: recipient,
        amount: parsedAmount,
      })
      .then(() => {
        siteInfo.showAlert("Coins transferred.", "success");
        setShopInfo((prev) => ({
          ...prev,
          balance: Math.max(0, prev.balance - parsedAmount),
        }));
        setRecipient("");
        setAmount("");
      })
      .catch((err) => {
        errorAlert(err);
      });
  };

  function onBuyItem(index) {
    const item = shopInfo.shopItems[index];
    const shouldBuy = window.confirm(
      `Are you sure you wish to buy ${item.name} for ${item.price} coins?`
    );

    if (!shouldBuy) return;

    axios
      .post("/api/shop/spendCoins", { item: index })
      .then(() => {
        siteInfo.showAlert("Item purchased.", "success");

        setShopInfo(
          update(shopInfo, {
            balance: {
              $set: shopInfo.balance - item.price,
            },
          })
        );

        let itemsOwnedChanges = {
          [item.key]: {
            $set: user.itemsOwned[item.key] + 1,
          },
        };

        for (let k in item.propagateItemUpdates) {
          let change = item.propagateItemUpdates[k];
          itemsOwnedChanges[k] = {
            $set: user.itemsOwned[k] + change,
          };
        }

        user.set(
          update(user.state, {
            itemsOwned: itemsOwnedChanges,
          })
        );
      })
      .catch(errorAlert);
  }

  const itemsByCategory = useMemo(() => {
    const map = Object.fromEntries(
      SHOP_CATEGORIES.map((c) => [c.key, []])
    );
    shopInfo.shopItems.forEach((item, i) => {
      const cat = item.category && map[item.category] ? item.category : SHOP_CATEGORIES[0].key;
      map[cat].push({ item, index: i });
    });
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const aOwned = user.itemsOwned?.[a.item.key] || 0;
        const bOwned = user.itemsOwned?.[b.item.key] || 0;
        const aDisabled = a.item.disabled || aOwned === a.item.limit;
        const bDisabled = b.item.disabled || bOwned === b.item.limit;
        return Number(aDisabled) - Number(bDisabled);
      });
    }
    return map;
  }, [shopInfo.shopItems, user.itemsOwned]);

  const handleItemClick = (item, i) => {
    if (item.key === "stamp") {
      setStampDialogOpen(true);
      setShowSuggestions(true);
      axios.get("/api/shop/stampSuggestions")
        .then((res) => setStampSuggestions(res.data))
        .catch(() => setStampSuggestions([]));
    } else {
      onBuyItem(i);
    }
  };

  const renderShopRow = ({ item, index: i }) => {
    const numOwned = user.itemsOwned[item.key] || 0;
    const disabled = item.disabled || numOwned === item.limit;
    const ownedLabel =
      item.limit != null ? `${numOwned} / ${item.limit}` : `${numOwned}`;

    return (
      <Card
        key={item.key}
        variant="outlined"
        sx={{
          opacity: disabled ? 0.5 : 1,
          borderRadius: 1,
        }}
      >
        <CardActionArea
          disabled={disabled}
          onClick={() => handleItemClick(item, i)}
          sx={{ px: 1.5, py: 1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ width: "100%" }}
          >
            <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.25}>
              <Stack
                direction="row"
                alignItems="baseline"
                spacing={1}
                flexWrap="wrap"
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, lineHeight: 1.25 }}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  Owned {ownedLabel}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.35,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  minHeight: "calc(2 * 1.35em)",
                }}
              >
                {item.desc}
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                flexShrink: 0,
                minWidth: isPhoneDevice ? 56 : 72,
                justifyContent: "flex-end",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {item.price}
              </Typography>
              <img
                src={coin}
                alt="coin"
                style={{ width: 28, height: 28 }}
              />
            </Stack>
          </Stack>
        </CardActionArea>
      </Card>
    );
  };

  if (user.loaded && !user.loggedIn) return <Navigate to="/play" />;

  if (!loaded) return <Loading small />;

  return (
    <Stack direction="column" spacing={1}>
      <Paper sx={{ p: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "center",
          }}
        >
          <Typography variant="h3" className="balance">
            You have: {shopInfo.balance}
          </Typography>
          <img
            className="um-coin"
            src={coin}
            style={{ width: "20px", height: "20px" }}
            alt="Coin Icon"
          />
        </Stack>
      </Paper>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        centered
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tab value="shop" label="Shop" />
        <Tab value="manage" label="Manage Coins" />
      </Tabs>

      {activeTab === "shop" && (
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {SHOP_CATEGORIES.map((c) => {
            const entries = itemsByCategory[c.key] || [];
            if (entries.length === 0) return null;
            return (
              <Box key={c.key}>
                <Typography
                  variant="h3"
                  sx={{
                    pb: 0.5,
                    mb: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  {c.label}
                </Typography>
                <Grid2 container spacing={0.75}>
                  {entries.map((entry) => (
                    <Grid2 key={entry.item.key} size={{ xs: 12, md: 6 }}>
                      {renderShopRow(entry)}
                    </Grid2>
                  ))}
                </Grid2>
              </Box>
            );
          })}
        </Stack>
      )}

      {activeTab === "manage" && (
        <Grid2 container spacing={1}>
          <Grid2
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={1}>
                <Typography variant="h3">Transfer coins</Typography>
                <TextField
                  label="Recipient Username"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
                <TextField
                  label="Amount to Transfer"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button onClick={handleTransferCoins}>Transfer</Button>
              </Stack>
            </Paper>
          </Grid2>

          <Grid2
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={1}>
                <Typography variant="h3">Donate</Typography>
                <Typography variant="body2">1 USD = 5 coins.</Typography>
                <TextField
                  label="USD Amount"
                  type="number"
                  value={purchaseUsd}
                  onChange={(e) => setPurchaseUsd(e.target.value)}
                  helperText="Whole USD amounts only."
                />
                <Typography variant="body2" color="textSecondary">
                  Coins to receive:{" "}
                  {(parseUsdAmount(purchaseUsd) || 0) * 5}
                </Typography>
                {!payPalClientId && (
                  <Typography variant="body2" color="textSecondary">
                    Loading PayPal configuration...
                  </Typography>
                )}
                {payPalClientId && !payPalScriptReady && (
                  <Typography variant="body2" color="textSecondary">
                    Loading PayPal checkout...
                  </Typography>
                )}
                {parseUsdAmount(purchaseUsd) ? null : (
                  <Typography variant="body2" color="error">
                    Enter a valid positive whole USD amount.
                  </Typography>
                )}
                <Box
                  ref={payPalButtonsRef}
                  sx={{
                    minHeight: "45px",
                    opacity: parseUsdAmount(purchaseUsd) ? 1 : 0.4,
                    pointerEvents: parseUsdAmount(purchaseUsd)
                      ? "auto"
                      : "none",
                  }}
                />
                {payPalLoading && (
                  <Typography variant="caption" color="textSecondary">
                    Finalizing payment...
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid2>
        </Grid2>
      )}

      <Dialog
        open={stampDialogOpen}
        onClose={() => {
          setStampDialogOpen(false);
          setStampGameUrl("");
          setSelectedSuggestion(null);
          setStampSuggestions([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Buy Scrapbook Stamp</DialogTitle>
        <DialogContent sx={{ overflow: "visible" }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the URL or ID of a Mafia game you won. You will receive a
            stamp of the role you played.
          </Typography>
          <Box sx={{ position: "relative" }}>
            <TextField
              autoFocus
              fullWidth
              label="Game URL or ID"
              value={stampGameUrl}
              onChange={(e) => {
                setStampGameUrl(e.target.value);
                setSelectedSuggestion(null);
                setShowSuggestions(false);
              }}
              placeholder="e.g. https://ultimafia.com/game/abc123 or abc123"
              InputProps={stampSuggestions.length > 0 ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowSuggestions((v) => !v)}
                    >
                      <i
                        className={`fas fa-chevron-${showSuggestions ? "up" : "down"}`}
                        style={{ fontSize: "12px" }}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              } : undefined}
            />
            {showSuggestions && stampSuggestions.length > 0 && (
              <Paper
                sx={{
                  position: "absolute",
                  zIndex: 1301,
                  left: 0,
                  right: 0,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {stampSuggestions.map((s) => (
                  <Box
                    key={s.gameId}
                    sx={{
                      px: 2,
                      py: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setStampGameUrl(s.gameId);
                      setSelectedSuggestion(s);
                      setShowSuggestions(false);
                    }}
                  >
                    <Typography variant="body2">
                      {s.gameId} — {s.role}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
          {selectedSuggestion && (
            <Typography
              variant="caption"
              sx={{ mt: 1, display: "block" }}
              color="success.main"
            >
              Stamp role: {selectedSuggestion.role}
            </Typography>
          )}
          {!selectedSuggestion && stampGameUrl.trim() && (
            <Typography
              variant="caption"
              sx={{ mt: 1, display: "block" }}
              color={parseGameId(stampGameUrl) ? "textSecondary" : "error"}
            >
              {parseGameId(stampGameUrl)
                ? `Game ID: ${parseGameId(stampGameUrl)}`
                : "Could not parse a game ID from this input."}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setStampDialogOpen(false);
              setStampGameUrl("");
              setSelectedSuggestion(null);
              setStampSuggestions([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!parseGameId(stampGameUrl)}
            onClick={() => {
              const gameId = parseGameId(stampGameUrl);
              if (!gameId) {
                siteInfo.showAlert("Could not parse a game ID.", "error");
                return;
              }
              const stampIndex = shopInfo.shopItems.findIndex((si) => si.key === "stamp");
              const stampItem = shopInfo.shopItems[stampIndex];
              axios
                .post("/api/shop/checkStampEligibility", { gameId })
                .then((eligibility) => {
                  const shouldBuy = window.confirm(
                    `You will receive a stamp for ${eligibility.data.role}. Purchase for ${stampItem.price} coins?`
                  );
                  if (!shouldBuy) return;
                  return axios.post("/api/shop/spendCoins", {
                    item: stampIndex,
                    gameId: eligibility.data.gameId,
                  });
                })
                .then((res) => {
                  if (!res) return;
                  siteInfo.showAlert(
                    `Stamp purchased: ${res.data.role}!`,
                    "success"
                  );
                  setStampGameUrl("");
                  setSelectedSuggestion(null);
                  setStampSuggestions([]);
                  setStampDialogOpen(false);
                  setShopInfo((prev) => ({
                    ...prev,
                    balance: prev.balance - stampItem.price,
                  }));
                })
                .catch(errorAlert);
            }}
          >
            Check Eligibility
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
