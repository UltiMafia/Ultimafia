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
import TradeDialog from "../../components/TradeDialog";
import Sparkline from "../../components/Sparkline";

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
  const [tradeType, setTradeType] = useState("buy");

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
    if (userCoins < 100) {
      siteInfo.showAlert("You need 100 coins to launch an IPO.", "error");
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

  const [sortBy, setSortBy] = useState("name"); // "name" | "supply" | "marketCap" | "buyPrice" | "sellPrice" | "dividends"
  const [sortDirection, setSortDirection] = useState("asc");

  // Filter and sort stocks depending on tab selection and sort settings
  const filteredStocks = useMemo(() => {
    let list = [];
    if (marketMode === "player") {
      list = stocks.filter((stock) =>
        stock.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      list = familyStocks.filter((stock) =>
        stock.familyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    list.sort((a, b) => {
      let aVal, bVal;
      const isPlayer = marketMode === "player";
      
      if (sortBy === "name") {
        aVal = isPlayer ? a.username.toLowerCase() : a.familyName.toLowerCase();
        bVal = isPlayer ? b.username.toLowerCase() : b.familyName.toLowerCase();
      } else if (sortBy === "supply") {
        aVal = a.shareSupply;
        bVal = b.shareSupply;
      } else if (sortBy === "marketCap") {
        aVal = a.shareSupply * a.buyPrice;
        bVal = b.shareSupply * b.buyPrice;
      } else if (sortBy === "buyPrice") {
        aVal = a.buyPrice;
        bVal = b.buyPrice;
      } else if (sortBy === "sellPrice") {
        aVal = a.sellPrice;
        bVal = b.sellPrice;
      } else if (sortBy === "dividends") {
        aVal = isPlayer ? a.dividendsPaidOut : a.dividendsPaidOut;
        bVal = isPlayer ? b.dividendsPaidOut : b.dividendsPaidOut;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [stocks, familyStocks, marketMode, searchQuery, sortBy, sortDirection]);

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

  const openTradeModal = (item, type, targetType) => {
    setSelectedStock({ ...item, targetType });
    setTradeType(type);
    setTradeModalOpen(true);
  };

  const renderSortableHeader = (label, fieldKey, align = "left") => {
    const isActive = sortBy === fieldKey;
    const isAsc = sortDirection === "asc";
    
    const handleSort = () => {
      if (isActive) {
        setSortDirection(isAsc ? "desc" : "asc");
      } else {
        setSortBy(fieldKey);
        setSortDirection(fieldKey === "name" ? "asc" : "desc");
      }
    };

    return (
      <TableCell
        align={align}
        onClick={handleSort}
        sx={{
          cursor: "pointer",
          fontWeight: "bold",
          userSelect: "none",
          whiteSpace: "nowrap",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent={align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start"}
        >
          <span>{label}</span>
          {isActive ? (
            <Icon icon={isAsc ? "lucide:chevron-up" : "lucide:chevron-down"} style={{ fontSize: "16px", color: "gold" }} />
          ) : (
            <Icon icon="lucide:chevrons-up-down" style={{ fontSize: "16px", color: "gray", opacity: 0.5 }} />
          )}
        </Stack>
      </TableCell>
    );
  };

  const totalStockValue = useMemo(() => {
    const playerStocksValue = portfolio.reduce((acc, h) => acc + (h.averageSellValue || 0), 0);
    const familyStocksValue = familyPortfolio.reduce((acc, h) => acc + (h.averageSellValue || 0), 0);
    return playerStocksValue + familyStocksValue;
  }, [portfolio, familyPortfolio]);

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Coins
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "gold", lineHeight: 1 }}>
                  {(user.coins || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ height: 30, borderLeft: '1px solid rgba(255, 215, 0, 0.3)' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Stock Value
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "gold", lineHeight: 1 }}>
                  {totalStockValue.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ height: 30, borderLeft: '1px solid rgba(255, 215, 0, 0.3)' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Net Worth
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "gold", lineHeight: 1 }}>
                  {((user.coins || 0) + totalStockValue).toFixed(2)}
                </Typography>
              </Box>
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
                  {renderSortableHeader(marketMode === "player" ? "Player" : "Family Name", "name")}
                  {renderSortableHeader("Supply", "supply", "right")}
                  {marketMode === "family" && <TableCell align="right" sx={{ fontWeight: "bold" }}>Treasury Coins</TableCell>}
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>Trend</TableCell>
                  {renderSortableHeader("Market Cap", "marketCap", "right")}
                  {renderSortableHeader("Buy Price", "buyPrice", "right")}
                  {renderSortableHeader("Sell Price", "sellPrice", "right")}
                  {renderSortableHeader("Dividends", "dividends", "right")}
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={marketMode === "family" ? 9 : 8} align="center">
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
                        <TableCell align="left" sx={{ whiteSpace: "nowrap" }}>
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
                                  whiteSpace: "nowrap",
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
                                  whiteSpace: "nowrap",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {name}
                              </Typography>
                            )}
                            {isSelf && <Chip size="small" label="You" color="primary" variant="outlined" />}
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{stock.shareSupply}</TableCell>
                        {marketMode === "family" && (
                          <TableCell align="right" sx={{ color: "gold", fontWeight: "bold", whiteSpace: "nowrap" }}>
                            {(stock.treasuryCoins || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                          </TableCell>
                        )}
                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                          <Sparkline history={stock.priceHistory} width={100} height={30} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {(stock.shareSupply * (stock.buyPrice || 0)).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main", whiteSpace: "nowrap" }}>
                          {(stock.buyPrice || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "error.main", whiteSpace: "nowrap" }}>
                          {(stock.sellPrice || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: "gold", whiteSpace: "nowrap" }}>
                          {(stock.dividendsPaidOut || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={!user.loggedIn}
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
                <TableCell align="right">Cost Basis</TableCell>
                <TableCell align="right">Liquid Value</TableCell>
                <TableCell align="right">Unrealized P&amp;L</TableCell>
                <TableCell align="right">Dividends Received</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marketMode === "player" ? (
                portfolio.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
                        <TableCell align="right">
                          {(holding.costBasis || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "gold" }}>
                          {(holding.averageSellValue || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: (holding.unrealizedPnL || 0) >= 0 ? "success.main" : "error.main" }}>
                          {(holding.unrealizedPnL || 0) >= 0 ? "+" : ""}{(holding.unrealizedPnL || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: "gold" }}>
                          {(holding.dividendsReceived || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={!user.loggedIn}
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
                        <TableCell align="right">
                          {(holding.costBasis || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "gold" }}>
                          {(holding.averageSellValue || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: (holding.unrealizedPnL || 0) >= 0 ? "success.main" : "error.main" }}>
                          {(holding.unrealizedPnL || 0) >= 0 ? "+" : ""}{(holding.unrealizedPnL || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: "gold" }}>
                          {(holding.dividendsReceived || 0).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
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
                      IPOing yourself costs 100 coins. This enables trading of your personal shares on the bonding curve.
                      You will automatically receive your first share (owned by you) to kick off the market.
                    </Typography>
                  </Box>

                  <Stack spacing={2} alignItems="center">
                    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 3, background: "rgba(255,255,255,0.02)" }}>
                      <Box>
                        <Typography variant="caption" display="block">IPO Fee</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>-100 Coins</Typography>
                      </Box>
                      <Box sx={{ borderLeft: 1, borderColor: "divider", pl: 3 }}>
                        <Typography variant="caption" display="block">Your Coins After</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: (user.coins || 0) >= 100 ? "success.main" : "error.main" }}>
                          {((user.coins || 0) - 100).toFixed(2)} Coins
                        </Typography>
                      </Box>
                    </Paper>

                    <Button
                      variant="contained"
                      color="warning"
                      size="large"
                      disabled={(user.coins || 0) < 100}
                      onClick={handleLaunchIpo}
                      startIcon={<Icon icon="lucide:coins" />}
                      sx={{ px: 4, py: 1.5, fontWeight: "bold" }}
                    >
                      Launch IPO for 100 Coins
                    </Button>
                    {(user.coins || 0) < 100 && (
                      <Typography variant="caption" color="error">
                        You need {(100 - (user.coins || 0)).toFixed(2)} more coins to start your IPO.
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
                        You need {(200 - (user.coins || 0)).toFixed(2)} more coins to launch a Family ETF.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Reusable Buy/Sell Transaction Dialog */}
      <TradeDialog
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        initialType={tradeType}
        stock={selectedStock ? {
          targetType: selectedStock.targetType,
          id: selectedStock.targetType === "player" ? selectedStock.userId : selectedStock.familyId,
          name: selectedStock.targetType === "player" ? selectedStock.username : selectedStock.familyName,
          avatar: selectedStock.avatar,
          shareSupply: selectedStock.shareSupply,
          sharesOwned: ownedSharesCount
        } : null}
        onSuccess={refreshAll}
      />
    </Box>
  );
}
