import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
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
  useMediaQuery,
  useTheme,
  Pagination,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useErrorAlert } from "../../components/Alerts";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { Avatar } from "../User/User";
import { resolveDisplayNameColor } from "../../utils/accessibleNameColors";
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
          backgroundImage: `url(/uploads/${id}_family_avatar.webp?t=${siteInfo?.cacheVal})`,
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
  const theme = useTheme();
  const isMobile = useIsPhoneDevice();

  const goldColor = theme.palette.mode === "light" ? "#b8860b" : "gold";

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

  // Transaction State
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txSearch, setTxSearch] = useState("");
  const [debouncedTxSearch, setDebouncedTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all"); // "all" | "buy" | "sell"

  // Debounce transaction search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTxSearch(txSearch);
      setTxPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [txSearch]);

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

  // Fetch all stock/family transactions with pagination
  const fetchTransactions = useCallback(() => {
    setTxLoading(true);
    return axios
      .get("/api/stocks/transactions", {
        params: {
          marketMode,
          page: txPage,
          limit: 20,
          search: debouncedTxSearch,
          type: txTypeFilter === "all" ? "" : txTypeFilter
        }
      })
      .then((res) => {
        ReactDOM.unstable_batchedUpdates(() => {
          setTransactions(res.data.transactions || []);
          setTxTotal(res.data.total || 0);
          setTxLoading(false);
        });
      })
      .catch((err) => {
        ReactDOM.unstable_batchedUpdates(() => {
          setTxLoading(false);
        });
        errorAlert(err);
      });
  }, [marketMode, txPage, debouncedTxSearch, txTypeFilter, errorAlert]);

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

  // Check if current user has IPOed themselves
  const hasIpoed = useMemo(() => {
    return stocks.some((s) => s.userId === user.id);
  }, [stocks, user.id]);

  // Define tabs dynamically
  const tabs = useMemo(() => {
    const list = [{ label: "All Markets", icon: "lucide:line-chart" }];
    if (user.loggedIn) {
      list.push({ label: "My Portfolio", icon: "lucide:briefcase" });
    }
    list.push({ label: "Transactions", icon: "lucide:history" });
    if (user.loggedIn && (!hasIpoed || eligibleFamilies.length > 0)) {
      list.push({ label: "Launch IPO", icon: "lucide:award" });
    }
    return list;
  }, [user.loggedIn, hasIpoed, eligibleFamilies]);

  const currentTabLabel = tabs[activeTab]?.label;

  // Refresh all dashboard metrics
  const refreshAll = useCallback(() => {
    setLoading(true);
    refreshUserCoins();
    const promises = [
      fetchStocks(),
      fetchPortfolio(),
      fetchFamilyStocks(),
      fetchFamilyPortfolio(),
      fetchEligibleFamilies(),
    ];
    if (currentTabLabel === "Transactions") {
      promises.push(fetchTransactions());
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [fetchStocks, fetchPortfolio, fetchFamilyStocks, fetchFamilyPortfolio, fetchEligibleFamilies, refreshUserCoins, currentTabLabel, fetchTransactions]);

  // Initial load
  useEffect(() => {
    document.title = "Stock Market | UltiMafia";
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch transactions when tab active, page, mode, search, or type changes
  useEffect(() => {
    if (currentTabLabel === "Transactions") {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTabLabel, marketMode, txPage, debouncedTxSearch, txTypeFilter]);

  // Reset transactions page and filters when mode changes
  useEffect(() => {
    setTxPage(1);
    setTxSearch("");
    setDebouncedTxSearch("");
    setTxTypeFilter("all");
  }, [marketMode]);

  // Clamp active tab index
  useEffect(() => {
    if (activeTab >= tabs.length) {
      setActiveTab(0);
    }
  }, [tabs, activeTab]);

  // Launch Player IPO
  const handleLaunchIpo = () => {
    const userCoins = user.coins;
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
    const userCoins = user.coins;
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
        aVal = a.marketCap;
        bVal = b.marketCap;
      } else if (sortBy === "buyPrice") {
        aVal = a.buyPrice;
        bVal = b.buyPrice;
      } else if (sortBy === "sellPrice") {
        aVal = a.sellPrice;
        bVal = b.sellPrice;
      } else if (sortBy === "treasury") {
        aVal = isPlayer ? 0 : a.treasuryCoins;
        bVal = isPlayer ? 0 : b.treasuryCoins;
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

  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const paginatedStocks = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredStocks.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredStocks, page, rowsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [marketMode, searchQuery, sortBy, sortDirection]);

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

  const renderSortableHeader = (label, fieldKey, align = "left", extraSx = {}) => {
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
            backgroundColor: "action.hover",
          },
          ...extraSx
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
            <Icon icon={isAsc ? "lucide:chevron-up" : "lucide:chevron-down"} style={{ fontSize: "16px", color: goldColor }} />
          ) : (
            <Icon icon="lucide:chevrons-up-down" style={{ fontSize: "16px", color: "gray", opacity: 0.5 }} />
          )}
        </Stack>
      </TableCell>
    );
  };

  const totalStockValue = useMemo(() => {
    const playerStocksValue = portfolio.reduce((acc, h) => acc + (h.liquidValue || 0), 0);
    const familyStocksValue = familyPortfolio.reduce((acc, h) => acc + (h.liquidValue || 0), 0);
    return playerStocksValue + familyStocksValue;
  }, [portfolio, familyPortfolio]);

  if (loading && stocks.length === 0 && familyStocks.length === 0) {
    return <Loading />;
  }

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden', textAlign: 'left' }}>
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
              p: { xs: 1.5, sm: 2 },
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
              background: theme.palette.mode === "light" ? "rgba(184, 134, 11, 0.05)" : "rgba(255, 215, 0, 0.05)",
              borderColor: goldColor,
              overflowX: "auto",
              maxWidth: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mr: { xs: 0.5, sm: 0 } }}>
              <Icon icon="lucide:coins" style={{ color: goldColor, fontSize: "28px" }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, flex: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Box sx={{ flex: { xs: 1, sm: 'initial' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Coins
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: goldColor, lineHeight: 1 }}>
                  {user.coins.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ height: 30, borderLeft: '1px solid rgba(255, 215, 0, 0.3)' }} />
              <Box sx={{ flex: { xs: 1, sm: 'initial' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Stock Value
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: goldColor, lineHeight: 1 }}>
                  {totalStockValue.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ height: 30, borderLeft: '1px solid rgba(255, 215, 0, 0.3)' }} />
              <Box sx={{ flex: { xs: 1, sm: 'initial' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Net Worth
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: goldColor, lineHeight: 1 }}>
                  {(user.coins + totalStockValue).toFixed(2)}
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
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        {tabs.map((t) => (
          <Tab key={t.label} icon={<Icon icon={t.icon} />} iconPosition="start" label={t.label} />
        ))}
      </Tabs>

      {/* Market Mode Toggles for All Markets / Portfolio / Transactions tabs */}
      {(currentTabLabel === "All Markets" || currentTabLabel === "My Portfolio" || currentTabLabel === "Transactions") && (
        <Stack direction="row" justifyContent="flex-start" sx={{ mb: 3, width: '100%', minWidth: 0 }}>
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
            sx={{ flexWrap: 'wrap' }}
          >
            <ToggleButton value="player" sx={{ px: { xs: 1, sm: 3 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              <Icon icon="lucide:user" style={{ marginRight: 6 }} /> Player Stocks
            </ToggleButton>
            <ToggleButton value="family" sx={{ px: { xs: 1, sm: 3 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              <Icon icon="lucide:users" style={{ marginRight: 6 }} /> {isMobile ? "Family ETFs" : "Family ETFs (Index Funds)"}
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}

      {/* Tab Content: All Markets */}
      {currentTabLabel === "All Markets" && (
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

          {isMobile ? (
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="flex-end" mb={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="supply">Supply</MenuItem>
                    <MenuItem value="marketCap">Market Cap</MenuItem>
                    <MenuItem value="buyPrice">Buy Price</MenuItem>
                    <MenuItem value="sellPrice">Sell Price</MenuItem>
                    {marketMode === "player" ? (
                      <MenuItem value="dividends">Dividends</MenuItem>
                    ) : (
                      <MenuItem value="treasury">Treasury</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <Button onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")} sx={{ minWidth: 0, px: 2 }}>
                  <Icon icon={sortDirection === "asc" ? "lucide:arrow-up" : "lucide:arrow-down"} />
                </Button>
              </Stack>
              {paginatedStocks.map((stock) => {
                const isSelf = user.loggedIn && marketMode === "player" && stock.userId === user.id;
                const name = marketMode === "player" ? stock.username : stock.familyName;
                return (
                  <Card key={stock._id || stock.familyId} variant="outlined" sx={{ backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(0, 0, 0, 0.2)" }}>
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <StockAvatar
                            targetType={marketMode}
                            id={marketMode === "player" ? stock.userId : stock.familyId}
                            name={name}
                            avatar={stock.avatar}
                            siteInfo={siteInfo}
                          />
                          <Box>
                            <Typography
                              component="a"
                              href={marketMode === "player" ? (stock.vanityUrl ? `/user/${stock.vanityUrl}` : `/user/${stock.userId}`) : `/user/family/${stock.familyId}`}
                              sx={{
                                color: resolveDisplayNameColor({
                                  accessibleNameColors: user.settings?.accessibleNameColors,
                                  rawNameColor: stock.nameColor,
                                  autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                  theme
                                }) || "text.primary",
                                textDecoration: "none",
                                fontWeight: "bold",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {name}
                            </Typography>
                            {isSelf && <Chip size="small" label="You" color="primary" variant="outlined" sx={{ ml: 1, height: 20 }} />}
                          </Box>
                        </Stack>
                        <Box sx={{ width: 60, height: 20 }}>
                          <Sparkline history={stock.priceHistory} width={60} height={20} />
                        </Box>
                      </Stack>
                       <Grid container spacing={1} mb={2}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" display="block">Buy Price</Typography>
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {stock.buyPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" display="block">Sell Price</Typography>
                          <Typography variant="body2" color="error.main" fontWeight="bold">
                            {stock.sellPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary" display="block">Supply</Typography>
                          <Typography variant="body2" color="text.primary" fontWeight="bold">
                            {stock.shareSupply}
                          </Typography>
                        </Grid>
                        {marketMode === "player" ? (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Market Cap</Typography>
                              <Typography variant="body2" color="text.primary" fontWeight="bold">
                                {(stock.marketCap).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Dividends</Typography>
                              <Typography variant="body2" color={goldColor} fontWeight="bold">
                                {stock.dividendsPaidOut.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                          </>
                        ) : (
                          <>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Market Cap</Typography>
                              <Typography variant="body2" color="text.primary" fontWeight="bold">
                                {(stock.marketCap).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Treasury</Typography>
                              <Typography variant="body2" color={goldColor} fontWeight="bold">
                                {stock.treasuryCoins.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Dividends</Typography>
                              <Typography variant="body2" color={goldColor} fontWeight="bold">
                                {stock.dividendsPaidOut.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                      <Stack direction="row" spacing={1}>
                        <Button fullWidth variant="contained" color="success" size="small" disabled={!user.loggedIn} onClick={() => openTradeModal(stock, "buy", marketMode)}>Buy</Button>
                        <Button fullWidth variant="contained" color="error" size="small" disabled={!user.loggedIn} onClick={() => openTradeModal(stock, "sell", marketMode)}>Sell</Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredStocks.length === 0 && <Typography color="text.secondary" align="center">No markets found.</Typography>}
            </Stack>
          ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              width: '100%',
              overflowX: 'auto',
              backgroundColor: "background.paper",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {renderSortableHeader(marketMode === "player" ? "Player" : "Family Name", "name")}
                  {renderSortableHeader("Supply", "supply", "right", { display: { xs: 'none', md: 'table-cell' } })}
                  {marketMode === "family" && renderSortableHeader("Treasury Coins", "treasury", "right", { display: { xs: 'none', md: 'table-cell' } })}
                  <TableCell align="center" sx={{ fontWeight: "bold", display: { xs: 'none', lg: 'table-cell' } }}>Trend</TableCell>
                  {renderSortableHeader("Market Cap", "marketCap", "right", { display: { xs: 'none', md: 'table-cell' } })}
                  {renderSortableHeader("Buy Price", "buyPrice", "right")}
                  {renderSortableHeader("Sell Price", "sellPrice", "right", { display: { xs: 'none', sm: 'table-cell' } })}
                  {renderSortableHeader("Dividends", "dividends", "right", { display: { xs: 'none', sm: 'table-cell' } })}
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
                  paginatedStocks.map((stock) => {
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
                                  color: resolveDisplayNameColor({
                                    accessibleNameColors: user.settings?.accessibleNameColors,
                                    rawNameColor: stock.nameColor,
                                    autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                    theme
                                  }) || "text.primary",
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
                        <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{stock.shareSupply}</TableCell>
                        {marketMode === "family" && (
                          <TableCell align="right" sx={{ fontWeight: "bold", color: goldColor, display: { xs: 'none', md: 'table-cell' } }}>
                            {stock.treasuryCoins.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                          </TableCell>
                        )}
                        <TableCell align="center" sx={{ whiteSpace: "nowrap", display: { xs: 'none', lg: 'table-cell' } }}>
                          <Sparkline history={stock.priceHistory} width={100} height={30} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", whiteSpace: "nowrap", display: { xs: 'none', md: 'table-cell' } }}>
                          {(stock.marketCap).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main", whiteSpace: "nowrap" }}>
                          {stock.buyPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "error.main", whiteSpace: "nowrap", display: { xs: 'none', sm: 'table-cell' } }}>
                          {stock.sellPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: goldColor, whiteSpace: "nowrap", display: { xs: 'none', sm: 'table-cell' } }}>
                          {stock.dividendsPaidOut.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
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
          )}
          {filteredStocks.length > 0 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={Math.ceil(filteredStocks.length / rowsPerPage)}
                page={page}
                onChange={(e, val) => setPage(val)}
                color="primary"
              />
            </Box>
          )}
        </Stack>
      )}

      {/* Tab Content: My Portfolio */}
      {currentTabLabel === "My Portfolio" && user.loggedIn && (
        isMobile ? (
            <Stack spacing={2}>
              {marketMode === "player" ? (
                portfolio.length === 0 ? (
                  <Typography color="text.secondary" align="center">You don't own any player shares yet.</Typography>
                ) : (
                  portfolio.map((holding) => {
                    const matchingStock = stocks.find((s) => s.userId === holding.subjectId) || { shareSupply: 0 };
                    return (
                      <Card key={holding.subjectId} variant="outlined" sx={{ backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(0, 0, 0, 0.2)" }}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                            <StockAvatar targetType="player" id={holding.subjectId} name={holding.username} avatar={holding.avatar} siteInfo={siteInfo} />
                            <Typography
                              component="a"
                              href={holding.vanityUrl ? `/user/${holding.vanityUrl}` : `/user/${holding.subjectId}`}
                              sx={{
                                color: resolveDisplayNameColor({
                                  accessibleNameColors: user.settings?.accessibleNameColors,
                                  rawNameColor: holding.nameColor,
                                  autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                  theme
                                }) || "text.primary",
                                textDecoration: "none",
                                fontWeight: "bold"
                              }}
                            >
                              {holding.username}
                            </Typography>
                          </Stack>
                          <Grid container spacing={1} mb={2}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Shares</Typography>
                              <Typography variant="body2" fontWeight="bold">{holding.sharesOwned}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">Avg Cost/Share: {holding.averageBuyPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "9px" }} /></Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Liquid Value</Typography>
                              <Typography variant="body2" color={goldColor} fontWeight="bold">{holding.liquidValue.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} /></Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">P&L</Typography>
                              <Typography variant="body2" color={holding.unrealizedPnL >= 0 ? "success.main" : "error.main"} fontWeight="bold">
                                {holding.unrealizedPnL >= 0 ? "+" : ""}{holding.unrealizedPnL.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Cost Basis</Typography>
                              <Typography variant="body2" color="text.primary" fontWeight="bold">
                                {holding.costBasis.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Dividends Earned</Typography>
                              <Typography variant="body2" color={goldColor} fontWeight="bold">
                                {holding.dividendsReceived.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                          </Grid>
                          <Stack direction="row" spacing={1}>
                            <Button fullWidth variant="contained" color="success" size="small" disabled={!user.loggedIn} onClick={() => openTradeModal(matchingStock, "buy", "player")}>Buy More</Button>
                            <Button fullWidth variant="contained" color="error" size="small" disabled={!user.loggedIn} onClick={() => openTradeModal(matchingStock, "sell", "player")}>Sell</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })
                )
              ) : (
                familyPortfolio.length === 0 ? (
                  <Typography color="text.secondary" align="center">You don't own any Family ETFs yet.</Typography>
                ) : (
                  familyPortfolio.map((holding) => {
                    const matchingStock = familyStocks.find((s) => s.familyId === holding.familyId) || { shareSupply: 0 };
                    return (
                      <Card key={holding.familyId} variant="outlined" sx={{ backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(0, 0, 0, 0.2)" }}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                            <StockAvatar targetType="family" id={holding.familyId} name={holding.familyName} avatar={holding.avatar} siteInfo={siteInfo} />
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
                          <Grid container spacing={1} mb={2}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Shares</Typography>
                              <Typography variant="body2" fontWeight="bold">{holding.sharesOwned}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">Avg Cost/Share: {holding.averageBuyPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "9px" }} /></Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Liquid Value</Typography>
                              <Typography variant="body2" color={goldColor} fontWeight="bold">{holding.liquidValue.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} /></Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">P&L</Typography>
                              <Typography variant="body2" color={holding.unrealizedPnL >= 0 ? "success.main" : "error.main"} fontWeight="bold">
                                {holding.unrealizedPnL >= 0 ? "+" : ""}{holding.unrealizedPnL.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Cost Basis</Typography>
                              <Typography variant="body2" color="text.primary" fontWeight="bold">
                                {holding.costBasis.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Dividends Earned</Typography>
                              <Typography variant="body2" color={goldColor} fontWeight="bold">
                                {holding.dividendsReceived.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                              </Typography>
                            </Grid>
                          </Grid>
                          <Stack direction="row" spacing={1}>
                            <Button fullWidth variant="contained" color="success" size="small" disabled={!user.loggedIn} onClick={() => openTradeModal(matchingStock, "buy", "family")}>Buy More</Button>
                            <Button fullWidth variant="contained" color="error" size="small" disabled={!user.loggedIn} onClick={() => openTradeModal(matchingStock, "sell", "family")}>Sell</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })
                )
              )}
            </Stack>
        ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            width: '100%',
            overflowX: 'auto',
            backgroundColor: "background.paper",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{marketMode === "player" ? "Player" : "Family Name"}</TableCell>
                <TableCell align="right">Shares</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Cost Basis</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Liquid Value</TableCell>
                <TableCell align="right">P&amp;L</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Dividends</TableCell>
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
                                color: resolveDisplayNameColor({
                                  accessibleNameColors: user.settings?.accessibleNameColors,
                                  rawNameColor: holding.nameColor,
                                  autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                  theme
                                }) || "text.primary",
                                textDecoration: "none",
                                fontWeight: "bold",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {holding.username}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          {holding.sharesOwned}
                          <Typography variant="caption" color="text.secondary" display="block">
                            Avg Cost/Share: {holding.averageBuyPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "9px" }} />
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {holding.costBasis.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: goldColor, display: { xs: 'none', sm: 'table-cell' } }}>
                          {holding.liquidValue.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: holding.unrealizedPnL >= 0 ? "success.main" : "error.main" }}>
                          {holding.unrealizedPnL >= 0 ? "+" : ""}{holding.unrealizedPnL.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: goldColor, display: { xs: 'none', sm: 'table-cell' } }}>
                          {holding.dividendsReceived.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
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
                        <TableCell align="right">
                          {holding.sharesOwned}
                          <Typography variant="caption" color="text.secondary" display="block">
                            Avg Cost/Share: {holding.averageBuyPrice.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "9px" }} />
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {holding.costBasis.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: goldColor, display: { xs: 'none', sm: 'table-cell' } }}>
                          {holding.liquidValue.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: holding.unrealizedPnL >= 0 ? "success.main" : "error.main" }}>
                          {holding.unrealizedPnL >= 0 ? "+" : ""}{holding.unrealizedPnL.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: goldColor, display: { xs: 'none', sm: 'table-cell' } }}>
                          {holding.dividendsReceived.toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
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
        )
      )}

      {/* Tab Content: Launch IPO */}
      {currentTabLabel === "Launch IPO" && user.loggedIn && (
        <Grid container spacing={3}>
          {/* Card 1: Player IPO */}
          {!hasIpoed && (
            <Grid item xs={12} md={eligibleFamilies.length > 0 ? 6 : 12}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", height: "100%", backgroundColor: "background.paper" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  <Box>
                    <Box sx={{ color: goldColor, mb: 2 }}>
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
                    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 3, backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)" }}>
                      <Box>
                        <Typography variant="caption" display="block">IPO Fee</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>-100 Coins</Typography>
                      </Box>
                      <Box sx={{ borderLeft: 1, borderColor: "divider", pl: 3 }}>
                        <Typography variant="caption" display="block">Your Coins After</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: user.coins >= 100 ? "success.main" : "error.main" }}>
                          {(user.coins - 100).toFixed(2)} Coins
                        </Typography>
                      </Box>
                    </Paper>

                    <Button
                      variant="contained"
                      color="warning"
                      size="large"
                      disabled={user.coins < 100}
                      onClick={handleLaunchIpo}
                      startIcon={<Icon icon="lucide:coins" />}
                      sx={{ px: 4, py: 1.5, fontWeight: "bold" }}
                    >
                      Launch IPO for 100 Coins
                    </Button>
                    {user.coins < 100 && (
                      <Typography variant="caption" color="error">
                        You need {(100 - user.coins).toFixed(2)} more coins to start your IPO.
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
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", height: "100%", backgroundColor: "background.paper" }}>
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

                    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 3, backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)" }}>
                      <Box>
                        <Typography variant="caption" display="block">IPO Fee</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>-200 Coins</Typography>
                      </Box>
                      <Box sx={{ borderLeft: 1, borderColor: "divider", pl: 3 }}>
                        <Typography variant="caption" display="block">Your Coins After</Typography>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: user.coins >= 200 ? "success.main" : "error.main" }}>
                          {(user.coins - 200).toFixed(2)} Coins
                        </Typography>
                      </Box>
                    </Paper>

                    <Button
                      variant="contained"
                      color="info"
                      size="large"
                      disabled={user.coins < 200 || !selectedFamilyId}
                      onClick={handleLaunchFamilyIpo}
                      startIcon={<Icon icon="lucide:coins" />}
                      sx={{ px: 4, py: 1.5, fontWeight: "bold", color: "white" }}
                    >
                      Launch ETF for 200 Coins
                    </Button>
                    {user.coins < 200 && (
                      <Typography variant="caption" color="error">
                        You need {(200 - user.coins).toFixed(2)} more coins to launch a Family ETF.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab Content: Transactions */}
      {currentTabLabel === "Transactions" && (
        <Stack spacing={3}>
          {/* Filters Row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search trader or stock..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              InputProps={{
                startAdornment: <Icon icon="lucide:search" style={{ marginRight: 8, color: "gray" }} />,
              }}
              sx={{ flexGrow: 1 }}
            />

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
              <Typography variant="body2" color="text.secondary">
                Type:
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={txTypeFilter}
                exclusive
                onChange={(e, val) => {
                  if (val !== null) {
                    setTxTypeFilter(val);
                    setTxPage(1);
                  }
                }}
                aria-label="transaction type filter"
              >
                <ToggleButton value="all" sx={{ textTransform: "none", fontWeight: "bold" }}>
                  All
                </ToggleButton>
                <ToggleButton value="buy" sx={{ textTransform: "none", fontWeight: "bold" }}>
                  Buys
                </ToggleButton>
                <ToggleButton value="sell" sx={{ textTransform: "none", fontWeight: "bold" }}>
                  Sells
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          {txLoading && transactions.length === 0 ? (
            <Loading small />
          ) : isMobile ? (
            <Stack spacing={2}>
              {transactions.length === 0 ? (
                <Typography color="text.secondary" align="center">No transactions found.</Typography>
              ) : (
                transactions.map((tx) => {
                  const isBuy = tx.type === "buy";
                  const targetName = marketMode === "player" ? tx.subjectName : tx.familyName;
                  const targetId = marketMode === "player" ? tx.subjectId : tx.familyId;
                  const targetAvatar = marketMode === "player" ? tx.subjectAvatar : tx.familyAvatar;
                  
                  return (
                    <Card key={tx.id} variant="outlined" sx={{ backgroundColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.02)" : "rgba(0, 0, 0, 0.2)" }}>
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <StockAvatar
                              targetType={marketMode}
                              id={targetId}
                              name={targetName}
                              avatar={targetAvatar}
                              siteInfo={siteInfo}
                            />
                            <Box>
                              {marketMode === "player" ? (
                                <Typography
                                  component="a"
                                  href={tx.subjectVanityUrl ? `/user/${tx.subjectVanityUrl}` : `/user/${tx.subjectId}`}
                                  sx={{
                                    color: resolveDisplayNameColor({
                                      accessibleNameColors: user.settings?.accessibleNameColors,
                                      rawNameColor: tx.subjectNameColor,
                                      autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                      theme
                                    }) || "text.primary",
                                    textDecoration: "none",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {targetName}
                                </Typography>
                              ) : (
                                <Typography
                                  component="a"
                                  href={`/user/family/${tx.familyId}`}
                                  sx={{
                                    color: "text.primary",
                                    textDecoration: "none",
                                    fontWeight: "bold",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {targetName}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                          <Chip
                            size="small"
                            label={isBuy ? "BUY" : "SELL"}
                            color={isBuy ? "success" : "error"}
                            variant="filled"
                            sx={{ fontWeight: "bold" }}
                          />
                        </Stack>
                        <Grid container spacing={1} mb={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Trader</Typography>
                            <Typography
                              component="a"
                              href={tx.buyerVanityUrl ? `/user/${tx.buyerVanityUrl}` : `/user/${tx.userId}`}
                              sx={{
                                color: resolveDisplayNameColor({
                                  accessibleNameColors: user.settings?.accessibleNameColors,
                                  rawNameColor: tx.buyerNameColor,
                                  autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                  theme
                                }) || "text.primary",
                                textDecoration: "none",
                                fontWeight: "bold",
                                fontSize: "0.875rem",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {tx.buyerName}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Date</Typography>
                            <Typography variant="body2" color="text.primary">
                              {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" display="block">Shares</Typography>
                            <Typography variant="body2" fontWeight="bold">{tx.shares}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" display="block">Price/Share</Typography>
                            <Typography variant="body2" color="text.primary" fontWeight="bold">
                              {(tx.price / tx.shares).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" display="block">{isBuy ? "Total Cost" : "Total Payout"}</Typography>
                            <Typography variant="body2" color={isBuy ? "success.main" : "error.main"} fontWeight="bold">
                              {(isBuy ? tx.price + tx.fee : tx.price - tx.fee).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "10px" }} />
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                width: '100%',
                overflowX: 'auto',
                backgroundColor: "background.paper",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Date/Time</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Trader</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{marketMode === "player" ? "Player Stock" : "Family ETF"}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>Shares</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>Price/Share</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>
                          No transactions recorded.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const isBuy = tx.type === "buy";
                      const targetName = marketMode === "player" ? tx.subjectName : tx.familyName;
                      const targetId = marketMode === "player" ? tx.subjectId : tx.familyId;
                      const targetAvatar = marketMode === "player" ? tx.subjectAvatar : tx.familyAvatar;

                      return (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar
                                hasImage={tx.buyerAvatar}
                                id={tx.userId}
                                name={tx.buyerName}
                              />
                              <Typography
                                component="a"
                                href={tx.buyerVanityUrl ? `/user/${tx.buyerVanityUrl}` : `/user/${tx.userId}`}
                                sx={{
                                  color: resolveDisplayNameColor({
                                    accessibleNameColors: user.settings?.accessibleNameColors,
                                    rawNameColor: tx.buyerNameColor,
                                    autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                    theme
                                  }) || "text.primary",
                                  textDecoration: "none",
                                  fontWeight: "bold",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {tx.buyerName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={isBuy ? "BUY" : "SELL"}
                              color={isBuy ? "success" : "error"}
                              variant="outlined"
                              sx={{ fontWeight: "bold" }}
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <StockAvatar
                                targetType={marketMode}
                                id={targetId}
                                name={targetName}
                                avatar={targetAvatar}
                                siteInfo={siteInfo}
                              />
                              {marketMode === "player" ? (
                                <Typography
                                  component="a"
                                  href={tx.subjectVanityUrl ? `/user/${tx.subjectVanityUrl}` : `/user/${tx.subjectId}`}
                                  sx={{
                                    color: resolveDisplayNameColor({
                                      accessibleNameColors: user.settings?.accessibleNameColors,
                                      rawNameColor: tx.subjectNameColor,
                                      autoContrastColor: user.autoContrastColor ? user.autoContrastColor.bind(user) : (c => c),
                                      theme
                                    }) || "text.primary",
                                    textDecoration: "none",
                                    fontWeight: "bold",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {targetName}
                                </Typography>
                              ) : (
                                <Typography
                                  component="a"
                                  href={`/user/family/${tx.familyId}`}
                                  sx={{
                                    color: "text.primary",
                                    textDecoration: "none",
                                    fontWeight: "bold",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {targetName}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>{tx.shares}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {(tx.price / tx.shares).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold", color: isBuy ? "success.main" : "error.main", whiteSpace: "nowrap" }}>
                            {(isBuy ? tx.price + tx.fee : tx.price - tx.fee).toFixed(2)} <Icon icon="lucide:coins" style={{ fontSize: "12px", verticalAlign: "middle" }} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {txTotal > 0 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={Math.ceil(txTotal / 20)}
                page={txPage}
                onChange={(e, val) => setTxPage(val)}
                color="primary"
              />
            </Box>
          )}
        </Stack>
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
