import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { Avatar } from "../User/User";
import { Loading } from "../../components/Loading";

export default function StockMarket() {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [activeTab, setActiveTab] = useState(0);
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Transaction Modal State
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState("buy"); // "buy" | "sell"
  const [shareCount, setShareCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Fetch stocks listing
  const fetchStocks = useCallback(() => {
    return axios
      .get("/api/stocks")
      .then((res) => {
        setStocks(Array.isArray(res.data) ? res.data : []);
      })
      .catch(errorAlert);
  }, [errorAlert]);

  // Fetch logged in user's portfolio
  const fetchPortfolio = useCallback(() => {
    if (!user.loggedIn) return Promise.resolve();
    return axios
      .get("/api/stocks/portfolio")
      .then((res) => {
        setPortfolio(Array.isArray(res.data) ? res.data : []);
      })
      .catch(errorAlert);
  }, [user.loggedIn, errorAlert]);

  // Refresh user coins balance
  const refreshUserCoins = useCallback(() => {
    if (!user.loggedIn) return;
    axios.get("/api/user/info").then((res) => {
      user.set(res.data);
    });
  }, [user]);

  // Initial load
  useEffect(() => {
    document.title = "Stock Market | UltiMafia";
    setLoading(true);
    Promise.all([fetchStocks(), fetchPortfolio()])
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if current user has an active IPO
  const hasIpoed = useMemo(() => {
    return stocks.some((s) => s.userId === user.id);
  }, [stocks, user.id]);

  // Launch IPO
  const handleLaunchIpo = () => {
    const userCoins = user.coins || 0;
    if (userCoins < 50) {
      siteInfo.showAlert("You need 50 coins to launch an IPO.", "error");
      return;
    }
    setLoading(true);
    axios
      .post("/api/stocks/ipo")
      .then((res) => {
        siteInfo.showAlert(res.data.message || "IPO successful!", "success");
        refreshUserCoins();
        Promise.all([fetchStocks(), fetchPortfolio()])
          .finally(() => setLoading(false));
      })
      .catch((err) => {
        setLoading(false);
        errorAlert(err);
      });
  };

  // Filter stocks by search query
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) =>
      stock.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stocks, searchQuery]);

  // Find owned shares count for selected stock
  const ownedSharesCount = useMemo(() => {
    if (!selectedStock) return 0;
    const holding = portfolio.find((h) => h.subjectId === selectedStock.userId);
    return holding ? holding.sharesOwned : 0;
  }, [selectedStock, portfolio]);

  // Calculate live price previews based on bonding curve
  // P = S^2 / 100
  const tradePreview = useMemo(() => {
    if (!selectedStock || shareCount <= 0) {
      return { price: 0, creatorFee: 0, systemFee: 0, total: 0 };
    }

    const currentSupply = selectedStock.shareSupply;
    let basePrice = 0;

    if (tradeType === "buy") {
      for (let i = 1; i <= shareCount; i++) {
        const S = currentSupply + i;
        basePrice += Math.max(1, Math.floor((S * S) / 100));
      }
      const creatorFee = Math.max(1, Math.round(basePrice * 0.05));
      const systemFee = Math.max(1, Math.round(basePrice * 0.05));
      return {
        price: basePrice,
        creatorFee,
        systemFee,
        total: basePrice + creatorFee + systemFee,
      };
    } else {
      const sellCount = Math.min(shareCount, currentSupply);
      for (let i = 0; i < sellCount; i++) {
        const S = currentSupply - i;
        basePrice += Math.max(1, Math.floor((S * S) / 100));
      }
      const creatorFee = Math.max(1, Math.round(basePrice * 0.05));
      const systemFee = Math.max(1, Math.round(basePrice * 0.05));
      return {
        price: basePrice,
        creatorFee,
        systemFee,
        total: Math.max(0, basePrice - creatorFee - systemFee),
      };
    }
  }, [selectedStock, tradeType, shareCount]);

  const openTradeModal = (stock, type) => {
    setSelectedStock(stock);
    setTradeType(type);
    setShareCount(1);
    setTradeModalOpen(true);
  };

  const handleConfirmTrade = () => {
    if (shareCount <= 0) return;
    setSubmitting(true);

    const endpoint = tradeType === "buy" ? "/api/stocks/buy" : "/api/stocks/sell";
    axios
      .post(endpoint, {
        subjectId: selectedStock.userId,
        shares: shareCount,
      })
      .then((res) => {
        const msg =
          tradeType === "buy"
            ? `Successfully bought ${shareCount} shares for ${res.data.total} coins.`
            : `Successfully sold ${shareCount} shares for ${res.data.totalPayout} coins.`;
        siteInfo.showAlert(msg, "success");
        setTradeModalOpen(false);
        refreshUserCoins();
        Promise.all([fetchStocks(), fetchPortfolio()]);
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  };

  if (loading && stocks.length === 0) {
    return <Loading />;
  }

  return (
    <Box>
      {/* Top Banner & Balance */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
            <Icon icon="lucide:trending-up" /> UltiMafia Stock Market
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Buy and sell player shares using your coins. Earn passive dividends when they win ranked/comp games!
          </Typography>
        </Box>

        {user.loggedIn && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              background: "rgba(255, 215, 0, 0.05)",
              borderColor: "gold",
            }}
          >
            <Icon icon="lucide:coins" style={{ color: "gold", fontSize: "28px" }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                My Coin Balance
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "gold", lineHeight: 1 }}>
                {parseFloat((user.coins || 0).toFixed(2))}
              </Typography>
            </Box>
          </Paper>
        )}
      </Stack>

      {/* Tabs Menu */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab icon={<Icon icon="lucide:line-chart" />} iconPosition="start" label="All Stocks" />
        {user.loggedIn && (
          <Tab icon={<Icon icon="lucide:briefcase" />} iconPosition="start" label="My Portfolio" />
        )}
        {user.loggedIn && !hasIpoed && (
          <Tab icon={<Icon icon="lucide:award" />} iconPosition="start" label="Launch IPO" />
        )}
      </Tabs>

      {/* Tab Content: All Stocks */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Icon icon="lucide:search" style={{ marginRight: 8, color: "gray" }} />,
            }}
          />

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell align="right">Supply</TableCell>
                  <TableCell align="right">Buy Price</TableCell>
                  <TableCell align="right">Sell Price</TableCell>
                  <TableCell align="right">Dividends Distributed</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No players IPO'ed or matching your search.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStocks.map((stock) => {
                    const isSelf = user.loggedIn && user.id === stock.userId;
                    return (
                      <TableRow key={stock.userId} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              hasImage={stock.avatar}
                              id={stock.userId}
                              name={stock.username}
                            />
                            <Typography
                              component="a"
                              href={stock.vanityUrl ? `/user/${stock.vanityUrl}` : `/user/${stock.userId}`}
                              sx={{
                                color: stock.nameColor || "text.primary",
                                textDecoration: "none",
                                fontWeight: "bold",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {stock.username}
                            </Typography>
                            {isSelf && <Chip size="small" label="You" color="primary" variant="outlined" />}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{stock.shareSupply}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main" }}>
                          {stock.buyPrice} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "error.main" }}>
                          {stock.sellPrice} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: "gold" }}>
                          {stock.dividendsPaidOut.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={!user.loggedIn || isSelf}
                              onClick={() => openTradeModal(stock, "buy")}
                            >
                              Buy
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              disabled={!user.loggedIn}
                              onClick={() => openTradeModal(stock, "sell")}
                            >
                              Sell
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}

      {/* Tab Content: My Portfolio */}
      {activeTab === 1 && user.loggedIn && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell align="right">Shares Owned</TableCell>
                <TableCell align="right">Current Single Price</TableCell>
                <TableCell align="right">Estimated Liquid Value</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolio.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      You don't own any shares yet. Buy some from the Market tab!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                portfolio.map((holding) => {
                  const matchingStock = stocks.find((s) => s.userId === holding.subjectId) || { shareSupply: 0 };
                  return (
                    <TableRow key={holding.subjectId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            hasImage={holding.avatar}
                            id={holding.subjectId}
                            name={holding.username}
                          />
                          <Typography
                            component="a"
                            href={holding.vanityUrl ? `/user/${holding.vanityUrl}` : `/user/${holding.subjectId}`}
                            sx={{
                              color: holding.nameColor || "text.primary",
                              textDecoration: "none",
                              fontWeight: "bold",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            {holding.username}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{holding.sharesOwned}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {holding.currentSingleSellPrice} <Icon icon="lucide:coins" />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "gold" }}>
                        {holding.averageSellValue} <Icon icon="lucide:coins" />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            disabled={user.id === holding.subjectId}
                            onClick={() => openTradeModal(matchingStock, "buy")}
                          >
                            Buy More
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => openTradeModal(matchingStock, "sell")}
                          >
                            Sell
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab Content: Launch IPO */}
      {activeTab === 2 && user.loggedIn && !hasIpoed && (
        <Card variant="outlined" sx={{ p: 2, textAlign: "center", maxWidth: "600px", mx: "auto" }}>
          <CardContent>
            <Box sx={{ color: "gold", mb: 2 }}>
              <Icon icon="lucide:rocket" style={{ fontSize: "64px" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
              Start your Initial Public Offering
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              IPOing yourself costs 50 coins. This enables trading of your personal shares on the bonding curve.
              You will automatically receive your first share (owned by you) to kick off the market.
            </Typography>

            <Stack spacing={2} alignItems="center">
              <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 3, background: "rgba(255,255,255,0.02)" }}>
                <Box>
                  <Typography variant="caption" display="block">IPO Fee</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>-50 Coins</Typography>
                </Box>
                <Box sx={{ borderLeft: 1, borderColor: "divider", pl: 3 }}>
                  <Typography variant="caption" display="block">Your Coins After</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: (user.coins || 0) >= 50 ? "success.main" : "error.main" }}>
                    {((user.coins || 0) - 50).toFixed(2)} Coins
                  </Typography>
                </Box>
              </Paper>

              <Button
                variant="contained"
                color="warning"
                size="large"
                disabled={(user.coins || 0) < 50}
                onClick={handleLaunchIpo}
                startIcon={<Icon icon="lucide:coins" />}
                sx={{ px: 4, py: 1.5, fontWeight: "bold" }}
              >
                Launch IPO for 50 Coins
              </Button>
              {(user.coins || 0) < 50 && (
                <Typography variant="caption" color="error">
                  You need {50 - (user.coins || 0)} more coins to start your IPO.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Buy/Sell Transaction Dialog */}
      <Dialog open={tradeModalOpen} onClose={() => setTradeModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: 1, borderColor: "divider", pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {selectedStock && (
              <Avatar
                hasImage={selectedStock.avatar}
                id={selectedStock.userId}
                name={selectedStock.username}
              />
            )}
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                {selectedStock?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current share supply: {selectedStock?.shareSupply}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Stack spacing={3}>
            {/* Buy/Sell selector */}
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
              <ToggleButton value="buy" disabled={selectedStock && user.id === selectedStock.userId}>
                Buy Shares
              </ToggleButton>
              <ToggleButton value="sell">Sell Shares</ToggleButton>
            </ToggleButtonGroup>

            {/* Share Amount Input */}
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
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  You own {ownedSharesCount} shares of this player.
                </Typography>
              )}
            </Box>

            {/* Price Preview */}
            <Paper variant="outlined" sx={{ p: 2, background: "rgba(255,255,255,0.01)" }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Base Price:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {tradePreview.price} Coins
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Creator Fee (5%):</Typography>
                  <Typography variant="body2" color="success.main">
                    +{tradePreview.creatorFee} Coins
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">System Fee (5%):</Typography>
                  <Typography variant="body2" color="warning.main">
                    +{tradePreview.systemFee} Coins
                  </Typography>
                </Stack>
                <Box sx={{ borderTop: 1, borderColor: "divider", my: 1, pt: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: "bold" }}>
                    {tradeType === "buy" ? "Total Cost:" : "Total Payout:"}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "gold" }}>
                    {tradePreview.total} Coins
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Balance after transaction */}
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
                        ? (user.coins || 0) >= tradePreview.total
                          ? "success.main"
                          : "error.main"
                        : "success.main",
                  }}
                >
                  {tradeType === "buy"
                    ? ((user.coins || 0) - tradePreview.total).toFixed(2)
                    : ((user.coins || 0) + tradePreview.total).toFixed(2)}{" "}
                  Coins
                </Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: "divider", p: 2 }}>
          <Button onClick={() => setTradeModalOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={tradeType === "buy" ? "success" : "error"}
            disabled={
              submitting ||
              shareCount <= 0 ||
              (tradeType === "buy" && (user.coins || 0) < tradePreview.total) ||
              (tradeType === "sell" && ownedSharesCount < shareCount)
            }
            onClick={handleConfirmTrade}
            sx={{ px: 3 }}
          >
            {tradeType === "buy" ? "Confirm Buy" : "Confirm Sell"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
