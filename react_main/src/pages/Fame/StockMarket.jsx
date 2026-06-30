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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { Avatar } from "../User/User";
import { Loading } from "../../components/Loading";

// Custom Avatar component that handles both Player and Family ETF avatars
function StockAvatar({ targetType, id, name, avatar, siteInfo }) {
  if (targetType === "player") {
    return <Avatar hasImage={avatar} id={id} name={name} />;
  }

  if (avatar) {
    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundImage: `url(/uploads/${id}_family_avatar.webp?t=${siteInfo?.cacheVal || 0})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        color: "text.secondary",
      }}
    >
      <Icon icon="lucide:users" style={{ fontSize: "20px" }} />
    </Box>
  );
}

// Render a sleek sparkline trend curve based on historical price ticks
function Sparkline({ history }) {
  const points = useMemo(() => {
    let prices = Array.isArray(history) ? history : [];
    if (prices.length === 0) prices = [1, 1];
    if (prices.length === 1) prices = [prices[0], prices[0]];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;

    const width = 100;
    const height = 30;
    const padding = 3;

    return prices.map((val, idx) => {
      const x = (idx / (prices.length - 1)) * (width - padding * 2) + padding;
      const y = height - (((val - min) / range) * (height - padding * 2) + padding);
      return `${x},${y}`;
    }).join(" ");
  }, [history]);

  const isUp = useMemo(() => {
    let prices = Array.isArray(history) ? history : [];
    if (prices.length < 2) return true;
    return prices[prices.length - 1] >= prices[prices.length - 2];
  }, [history]);

  const strokeColor = isUp ? "#4caf50" : "#f44336"; // Green vs red

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <svg width="100" height="30" style={{ overflow: "visible" }}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </Box>
  );
}

export default function StockMarket() {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [activeTab, setActiveTab] = useState(0);
  const [marketMode, setMarketMode] = useState("player"); // "player" | "family"
  
  // Data States
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [familyStocks, setFamilyStocks] = useState([]);
  const [familyPortfolio, setFamilyPortfolio] = useState([]);
  const [eligibleFamilies, setEligibleFamilies] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Transaction Modal State
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState("buy"); // "buy" | "sell"
  const [shareCount, setShareCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Fetch individual player stocks
  const fetchStocks = useCallback(() => {
    return axios
      .get("/api/stocks")
      .then((res) => {
        setStocks(Array.isArray(res.data) ? res.data : []);
      })
      .catch(errorAlert);
  }, [errorAlert]);

  // Fetch logged in user's player stock portfolio
  const fetchPortfolio = useCallback(() => {
    if (!user.loggedIn) return Promise.resolve();
    return axios
      .get("/api/stocks/portfolio")
      .then((res) => {
        setPortfolio(Array.isArray(res.data) ? res.data : []);
      })
      .catch(errorAlert);
  }, [user.loggedIn, errorAlert]);

  // Fetch family ETF stocks
  const fetchFamilyStocks = useCallback(() => {
    return axios
      .get("/api/stocks/families")
      .then((res) => {
        setFamilyStocks(Array.isArray(res.data) ? res.data : []);
      })
      .catch(errorAlert);
  }, [errorAlert]);

  // Fetch logged in user's family ETF portfolio
  const fetchFamilyPortfolio = useCallback(() => {
    if (!user.loggedIn) return Promise.resolve();
    return axios
      .get("/api/stocks/families/portfolio")
      .then((res) => {
        setFamilyPortfolio(Array.isArray(res.data) ? res.data : []);
      })
      .catch(errorAlert);
  }, [user.loggedIn, errorAlert]);

  // Fetch families eligible for IPO
  const fetchEligibleFamilies = useCallback(() => {
    if (!user.loggedIn) return Promise.resolve();
    return axios
      .get("/api/stocks/families/eligible")
      .then((res) => {
        const families = Array.isArray(res.data) ? res.data : [];
        setEligibleFamilies(families);
        if (families.length > 0 && !selectedFamilyId) {
          setSelectedFamilyId(families[0].id);
        }
      })
      .catch(errorAlert);
  }, [user.loggedIn, selectedFamilyId, errorAlert]);

  // Refresh user balance info
  const refreshUserCoins = useCallback(() => {
    if (!user.loggedIn) return;
    axios.get("/api/user/info").then((res) => {
      user.set({
        ...res.data,
        loggedIn: true,
        loaded: true
      });
    });
  }, [user]);

  // Refresh all dashboard metrics
  const refreshAll = useCallback(() => {
    setLoading(true);
    refreshUserCoins();
    Promise.all([
      fetchStocks(),
      fetchPortfolio(),
      fetchFamilyStocks(),
      fetchFamilyPortfolio(),
      fetchEligibleFamilies(),
    ]).finally(() => setLoading(false));
  }, [fetchStocks, fetchPortfolio, fetchFamilyStocks, fetchFamilyPortfolio, fetchEligibleFamilies, refreshUserCoins]);

  // Initial load
  useEffect(() => {
    document.title = "Stock Market | UltiMafia";
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if current user has IPOed themselves
  const hasIpoed = useMemo(() => {
    return stocks.some((s) => s.userId === user.id);
  }, [stocks, user.id]);

  // Launch Player IPO
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
        refreshAll();
      })
      .catch((err) => {
        setLoading(false);
        errorAlert(err);
      });
  };

  // Launch Family ETF IPO
  const handleLaunchFamilyIpo = () => {
    if (!selectedFamilyId) {
      siteInfo.showAlert("Please select a family to launch.", "error");
      return;
    }
    const userCoins = user.coins || 0;
    if (userCoins < 200) {
      siteInfo.showAlert("You need 200 coins to launch a Family ETF.", "error");
      return;
    }
    setLoading(true);
    axios
      .post("/api/stocks/families/ipo", { familyId: selectedFamilyId })
      .then((res) => {
        siteInfo.showAlert(res.data.message || "Family ETF launched successfully!", "success");
        setSelectedFamilyId("");
        refreshAll();
      })
      .catch((err) => {
        setLoading(false);
        errorAlert(err);
      });
  };

  // Filter stocks depending on tab selection
  const filteredStocks = useMemo(() => {
    if (marketMode === "player") {
      return stocks.filter((stock) =>
        stock.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return familyStocks.filter((stock) =>
        stock.familyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }, [stocks, familyStocks, marketMode, searchQuery]);

  // Find owned shares count for selected stock in modal
  const ownedSharesCount = useMemo(() => {
    if (!selectedStock) return 0;
    if (selectedStock.targetType === "player") {
      const holding = portfolio.find((h) => h.subjectId === selectedStock.userId);
      return holding ? holding.sharesOwned : 0;
    } else {
      const holding = familyPortfolio.find((h) => h.familyId === selectedStock.familyId);
      return holding ? holding.sharesOwned : 0;
    }
  }, [selectedStock, portfolio, familyPortfolio]);

  // Calculate live pricing previews on bonding curve
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

  const openTradeModal = (item, type, targetType) => {
    setSelectedStock({ ...item, targetType });
    setTradeType(type);
    setShareCount(1);
    setTradeModalOpen(true);
  };

  const handleConfirmTrade = () => {
    if (shareCount <= 0 || !selectedStock) return;
    setSubmitting(true);

    const isPlayer = selectedStock.targetType === "player";
    const endpoint = isPlayer
      ? (tradeType === "buy" ? "/api/stocks/buy" : "/api/stocks/sell")
      : (tradeType === "buy" ? "/api/stocks/families/buy" : "/api/stocks/families/sell");

    const payload = isPlayer
      ? { subjectId: selectedStock.userId, shares: shareCount }
      : { familyId: selectedStock.familyId, shares: shareCount };

    axios
      .post(endpoint, payload)
      .then((res) => {
        const msg =
          tradeType === "buy"
            ? `Successfully bought ${shareCount} shares for ${res.data.total} coins.`
            : `Successfully sold ${shareCount} shares for ${res.data.totalPayout} coins.`;
        siteInfo.showAlert(msg, "success");
        setTradeModalOpen(false);
        refreshAll();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  };

  if (loading && stocks.length === 0 && familyStocks.length === 0) {
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
            <Icon icon="lucide:trending-up" /> Player & Family Stock Market
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trade player shares or Family ETFs. Earn passive dividends when they win ranked/competitive matches!
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
        onChange={(e, val) => {
          setActiveTab(val);
          setSearchQuery("");
        }}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab icon={<Icon icon="lucide:line-chart" />} iconPosition="start" label="All Markets" />
        {user.loggedIn && (
          <Tab icon={<Icon icon="lucide:briefcase" />} iconPosition="start" label="My Portfolio" />
        )}
        {user.loggedIn && (!hasIpoed || eligibleFamilies.length > 0) && (
          <Tab icon={<Icon icon="lucide:award" />} iconPosition="start" label="Launch IPO" />
        )}
      </Tabs>

      {/* Market Mode Toggles for All Markets / Portfolio tabs */}
      {activeTab < 2 && (
        <Stack direction="row" justifyContent="flex-start" sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={marketMode}
            exclusive
            onChange={(e, val) => {
              if (val) {
                setMarketMode(val);
                setSearchQuery("");
              }
            }}
            size="small"
            color="primary"
          >
            <ToggleButton value="player" sx={{ px: 3 }}>
              <Icon icon="lucide:user" style={{ marginRight: 6 }} /> Player Stocks
            </ToggleButton>
            <ToggleButton value="family" sx={{ px: 3 }}>
              <Icon icon="lucide:users" style={{ marginRight: 6 }} /> Family ETFs (Index Funds)
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}

      {/* Tab Content: All Markets */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={marketMode === "player" ? "Search players..." : "Search families..."}
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
                  <TableCell>{marketMode === "player" ? "Player" : "Family Name"}</TableCell>
                  <TableCell align="right">Supply</TableCell>
                  {marketMode === "family" && <TableCell align="right">Treasury Coins</TableCell>}
                  <TableCell align="center">Trend</TableCell>
                  <TableCell align="right">Buy Price</TableCell>
                  <TableCell align="right">Sell Price</TableCell>
                  <TableCell align="right">Dividends Distributed</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={marketMode === "family" ? 8 : 7} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No records match your search query.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStocks.map((stock) => {
                    const isSelf = user.loggedIn && marketMode === "player" && user.id === stock.userId;
                    const name = marketMode === "player" ? stock.username : stock.familyName;
                    const key = marketMode === "player" ? stock.userId : stock.familyId;
                    
                    return (
                      <TableRow key={key} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <StockAvatar
                              targetType={marketMode}
                              id={key}
                              name={name}
                              avatar={stock.avatar}
                              siteInfo={siteInfo}
                            />
                            {marketMode === "player" ? (
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
                                {name}
                              </Typography>
                            ) : (
                              <Typography
                                component="a"
                                href={`/user/family/${stock.familyId}`}
                                sx={{
                                  color: "text.primary",
                                  textDecoration: "none",
                                  fontWeight: "bold",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {name}
                              </Typography>
                            )}
                            {isSelf && <Chip size="small" label="You" color="primary" variant="outlined" />}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{stock.shareSupply}</TableCell>
                        {marketMode === "family" && (
                          <TableCell align="right" sx={{ color: "gold", fontWeight: "bold" }}>
                            {stock.treasuryCoins} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                          </TableCell>
                        )}
                        <TableCell align="center">
                          <Sparkline history={stock.priceHistory} />
                        </TableCell>
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
                              onClick={() => openTradeModal(stock, "buy", marketMode)}
                            >
                              Buy
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              disabled={!user.loggedIn}
                              onClick={() => openTradeModal(stock, "sell", marketMode)}
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
                <TableCell>{marketMode === "player" ? "Player" : "Family Name"}</TableCell>
                <TableCell align="right">Shares Owned</TableCell>
                <TableCell align="right">Current Single Price</TableCell>
                <TableCell align="right">Estimated Liquid Value</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marketMode === "player" ? (
                portfolio.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        You don't own any player shares yet.
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
                            <StockAvatar
                              targetType="player"
                              id={holding.subjectId}
                              name={holding.username}
                              avatar={holding.avatar}
                              siteInfo={siteInfo}
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
                              onClick={() => openTradeModal(matchingStock, "buy", "player")}
                            >
                              Buy More
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => openTradeModal(matchingStock, "sell", "player")}
                            >
                              Sell
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
              ) : (
                // Family Portfolio Rendering
                familyPortfolio.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        You don't own any Family ETF shares yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  familyPortfolio.map((holding) => {
                    const matchingStock = familyStocks.find((s) => s.familyId === holding.familyId) || { shareSupply: 0 };
                    return (
                      <TableRow key={holding.familyId} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <StockAvatar
                              targetType="family"
                              id={holding.familyId}
                              name={holding.familyName}
                              avatar={holding.avatar}
                              siteInfo={siteInfo}
                            />
                            <Typography
                              component="a"
                              href={`/user/family/${holding.familyId}`}
                              sx={{
                                color: "text.primary",
                                textDecoration: "none",
                                fontWeight: "bold",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {holding.familyName}
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
                              onClick={() => openTradeModal(matchingStock, "buy", "family")}
                            >
                              Buy More
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => openTradeModal(matchingStock, "sell", "family")}
                            >
                              Sell
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab Content: Launch IPO */}
      {activeTab === 2 && user.loggedIn && (
        <Grid container spacing={3}>
          {/* Card 1: Player IPO */}
          {!hasIpoed && (
            <Grid item xs={12} md={eligibleFamilies.length > 0 ? 6 : 12}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", height: "100%" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  <Box>
                    <Box sx={{ color: "gold", mb: 2 }}>
                      <Icon icon="lucide:rocket" style={{ fontSize: "64px" }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                      Start your Player IPO
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      IPOing yourself costs 50 coins. This enables trading of your personal shares on the bonding curve.
                      You will automatically receive your first share (owned by you) to kick off the market.
                    </Typography>
                  </Box>

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
            </Grid>
          )}

          {/* Card 2: Family ETF IPO */}
          {eligibleFamilies.length > 0 && (
            <Grid item xs={12} md={!hasIpoed ? 6 : 12}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", height: "100%" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  <Box>
                    <Box sx={{ color: "info.main", mb: 2 }}>
                      <Icon icon="lucide:users" style={{ fontSize: "64px" }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                      Launch Family ETF (Index Fund)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Only family Founders or Leaders can launch a Family ETF. It costs 200 coins. 
                      This allows players to buy shares in your family's collective wins. The 5% Creator Fee is paid directly into your Family Treasury!
                    </Typography>
                  </Box>

                  <Stack spacing={3} alignItems="center">
                    <FormControl fullWidth variant="outlined" sx={{ maxWidth: 300, textAlign: "left" }}>
                      <InputLabel id="select-family-label">Select Family</InputLabel>
                      <Select
                        labelId="select-family-label"
                        value={selectedFamilyId}
                        onChange={(e) => setSelectedFamilyId(e.target.value)}
                        label="Select Family"
                      >
                        {eligibleFamilies.map((fam) => (
                          <MenuItem key={fam.id} value={fam.id}>
                            {fam.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 3, background: "rgba(255,255,255,0.02)" }}>
                      <Box>
                        <Typography variant="caption" display="block">IPO Fee</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>-200 Coins</Typography>
                      </Box>
                      <Box sx={{ borderLeft: 1, borderColor: "divider", pl: 3 }}>
                        <Typography variant="caption" display="block">Your Coins After</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: (user.coins || 0) >= 200 ? "success.main" : "error.main" }}>
                          {((user.coins || 0) - 200).toFixed(2)} Coins
                        </Typography>
                      </Box>
                    </Paper>

                    <Button
                      variant="contained"
                      color="info"
                      size="large"
                      disabled={(user.coins || 0) < 200 || !selectedFamilyId}
                      onClick={handleLaunchFamilyIpo}
                      startIcon={<Icon icon="lucide:coins" />}
                      sx={{ px: 4, py: 1.5, fontWeight: "bold", color: "white" }}
                    >
                      Launch ETF for 200 Coins
                    </Button>
                    {(user.coins || 0) < 200 && (
                      <Typography variant="caption" color="error">
                        You need {200 - (user.coins || 0)} more coins to launch a Family ETF.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Buy/Sell Transaction Dialog */}
      <Dialog open={tradeModalOpen} onClose={() => setTradeModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: 1, borderColor: "divider", pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {selectedStock && (
              <StockAvatar
                targetType={selectedStock.targetType}
                id={selectedStock.targetType === "player" ? selectedStock.userId : selectedStock.familyId}
                name={selectedStock.targetType === "player" ? selectedStock.username : selectedStock.familyName}
                avatar={selectedStock.avatar}
                siteInfo={siteInfo}
              />
            )}
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                {selectedStock?.targetType === "player" ? selectedStock?.username : selectedStock?.familyName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current ETF share supply: {selectedStock?.shareSupply}
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
              <ToggleButton value="buy" disabled={selectedStock && selectedStock.targetType === "player" && user.id === selectedStock.userId}>
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
                  You own {ownedSharesCount} shares.
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
                  <Typography variant="body2">
                    {selectedStock?.targetType === "player" ? "Creator Fee (5%):" : "Treasury Fee (5%):"}
                  </Typography>
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
