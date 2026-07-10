import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Stack,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Grid,
  useTheme,
} from "@mui/material";
import { NameWithAvatar } from "./User";
import { SiteInfoContext, UserContext } from "Contexts";
import { Icon } from "@iconify/react";
import Sparkline from "components/Sparkline";

export const panelStyle = {
  backgroundColor: "var(--scheme-color)",
  padding: "16px",
  borderRadius: "4px",
};

export const headingStyle = {
  fontSize: "1.25rem",
  fontWeight: 600,
  marginBottom: "8px",
};

export function CoinAmount({ amount, variant = "body2", sx = {} }) {
  return (
    <Stack
      component="span"
      direction="row"
      spacing={0.5}
      sx={{ display: "inline-flex", alignItems: "center", ...sx }}
    >
      <Typography component="span" variant={variant}>
        {Number(amount || 0).toFixed(2)}
      </Typography>
      <Icon icon="lucide:coins" style={{ fontSize: "0.95em" }} />
    </Stack>
  );
}

export function FamilyTreasury({ family, familyId, refreshFamilyTools }) {
  const [amount, setAmount] = useState("");
  const siteInfo = useContext(SiteInfoContext);
  const user = useContext(UserContext);
  const isFamilyMember = Boolean(family.userRole);
  const canWithdraw = family.userRole === "leader" || family.userRole === "founder";

  function onAction(type) {
    const amountNum = Math.floor(Number(amount));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      siteInfo.showAlert("Enter a positive coin amount", "error");
      return;
    }
    const actionWord = type === "deposit" ? "deposit" : "withdraw";
    if (!window.confirm(`Are you sure you want to ${actionWord} ${amountNum} coins ${type === "deposit" ? "into" : "from"} the family treasury?`)) {
      return;
    }
    axios
      .post(`/api/family/${familyId}/treasury/${type}`, { amount: amountNum })
      .then((res) => {
        siteInfo.showAlert(`Coins ${type === "deposit" ? "deposited" : "withdrawn"}`, "success");
        setAmount("");
        user.set((prev) => ({
          ...prev,
          coins: Number(res.data.coins ?? prev.coins ?? 0),
          balanceDollar: Number(res.data.balanceDollar ?? prev.balanceDollar ?? 0),
        }));
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"));
  }

  return (
    <Paper sx={panelStyle}>
      <Typography variant="h3" sx={headingStyle}>
        Treasury
      </Typography>
      <CoinAmount amount={family.treasury} variant="h4" sx={{ mt: 0.5 }} />
      {Number(family.pendingJoinFees || 0) > 0 && (
        <Typography variant="caption" color="text.secondary" display="block">
          <CoinAmount amount={Number(family.pendingJoinFees)} /> reserved for pending join fee refunds.
        </Typography>
      )}
      {isFamilyMember && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField
            size="small"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
          />
          <Button variant="outlined" onClick={() => onAction("deposit")}>
            Deposit
          </Button>
          {canWithdraw && (
            <Button variant="outlined" color="secondary" onClick={() => onAction("withdraw")}>
              Withdraw
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}

export function FamilyLedger({ familyId, refreshKey }) {
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    axios
      .get(`/api/family/${familyId}/ledger`)
      .then((res) => setLedger(res.data.ledger || []))
      .catch(() => setLedger([]));
  }, [familyId, refreshKey]);

  if (ledger.length === 0) return null;

  return (
    <Paper sx={panelStyle}>
      <Typography variant="h3" sx={headingStyle}>
        History
      </Typography>
      <Stack direction="column" spacing={1}>
        {ledger.slice(0, 5).map((entry) => (
          <Box key={entry.id}>
            <Typography variant="body2">{entry.description}</Typography>
            {entry.user && (
              <Typography variant="caption" color="text.secondary">
                by {entry.user.name}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export function FamilyApplications({ familyId, family, refreshFamilyTools }) {
  const [applications, setApplications] = useState([]);
  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    if (family.canManageApplications) {
      axios
        .get(`/api/family/${familyId}/applications`)
        .then((res) => setApplications(res.data.applications || []))
        .catch(() => setApplications([]));
    }
  }, [familyId, family.canManageApplications]);

  function onApplicationAction(applicationId, action) {
    if (!window.confirm(`Are you sure you want to ${action} this application?`)) return;
    axios
      .post(`/api/family/${familyId}/applications/${applicationId}/${action}`)
      .then(() => {
        siteInfo.showAlert(action === "accept" ? "Application accepted" : "Application rejected", "success");
        refreshFamilyTools();
        // Remove from list locally to update UI quickly
        setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"));
  }

  function toggleApplicationsOpen() {
    axios
      .post(`/api/family/${familyId}/applicationsOpen`, {
        applicationsOpen: !family.applicationsOpen,
      })
      .then(() => {
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"));
  }

  if (!family.canManageApplications) return null;

  return (
    <Paper sx={panelStyle}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" sx={headingStyle}>
          Applications
        </Typography>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={family.applicationsOpen}
              onChange={toggleApplicationsOpen}
            />
          }
          label={<Typography variant="caption">{family.applicationsOpen ? "Open" : "Closed"}</Typography>}
          sx={{ mr: 0 }}
        />
      </Stack>
      <Stack direction="column" spacing={1}>
        {applications.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No pending applications.
          </Typography>
        )}
        {applications.map((application) => (
          <Box key={application.id}>
            <NameWithAvatar
              id={application.applicant.id}
              name={application.applicant.name}
              avatar={application.applicant.avatar}
              vanityUrl={application.applicant.vanityUrl}
            />
            {application.message && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {application.message}
              </Typography>
            )}
            {Number(application.joinFee || 0) > 0 && (
              <Typography component="div" variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Paid join fee: <CoinAmount amount={application.joinFee} />
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button size="small" variant="contained" color="success" onClick={() => onApplicationAction(application.id, "accept")}>
                Accept
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => onApplicationAction(application.id, "reject")}>
                Reject
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export function FamilyPerks({ family, familyId, refreshFamilyTools }) {
  const siteInfo = useContext(SiteInfoContext);
  const ownedPerks = (family.perks || []).filter((perk) => perk.owned);

  function onBuyPerk(perk) {
    if (!window.confirm(`Are you sure you want to spend family treasury funds on ${perk.name}?`)) return;
    axios
      .post(`/api/family/${familyId}/perks/${perk.key}/buy`)
      .then(() => {
        siteInfo.showAlert("Family perk bought", "success");
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"));
  }

  return (
    <Paper sx={panelStyle}>
      <Typography variant="h3" sx={headingStyle}>
        Perks
      </Typography>
      <Stack direction="column" spacing={1}>
        {(family.perks || []).map((perk) => (
          <Box key={perk.key}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="body2">{perk.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {perk.description}
                </Typography>
              </Box>
              {perk.owned ? (
                <Chip size="small" label="Owned" color="success" />
              ) : (
                family.canManageApplications && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onBuyPerk(perk)}
                  startIcon={<Icon icon="lucide:coins" />}
                  >
                    {Number(perk.cost).toFixed(2)}
                  </Button>
                )
              )}
            </Stack>
          </Box>
        ))}
        {ownedPerks.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            No perks bought yet.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

export function FamilyJoinFee({ family, familyId, refreshFamilyTools }) {
  const [joinFeeInput, setJoinFeeInput] = useState(String(Number(family.joinFee || 0)));
  const siteInfo = useContext(SiteInfoContext);

  if (!family.isLeader) return null;

  function onSaveJoinFee() {
    const joinFee = Math.floor(Number(joinFeeInput));
    if (!Number.isFinite(joinFee) || joinFee < 0) {
      siteInfo.showAlert("Join fee must be a positive number or 0", "error");
      return;
    }
    axios
      .post(`/api/family/${familyId}/joinFee`, { joinFee })
      .then((res) => {
        setJoinFeeInput(String(Number(res.data.joinFee || 0)));
        siteInfo.showAlert("Join fee updated", "success");
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"));
  }

  return (
    <Paper sx={panelStyle}>
      <Typography variant="h3" sx={headingStyle}>
        Join Fee
      </Typography>
      <Stack direction="column" spacing={1}>
        <TextField
          size="small"
          type="number"
          value={joinFeeInput}
          onChange={(e) => setJoinFeeInput(e.target.value)}
          inputProps={{ min: 0, step: 1 }}
          placeholder="0"
        />
        <Button variant="outlined" onClick={onSaveJoinFee}>
          Save Join Fee
        </Button>
        <Typography variant="caption" color="text.secondary">
          Applicants pay this fee when requesting to join. Rejected applications are refunded.
        </Typography>
      </Stack>
    </Paper>
  );
}

export function FamilyApply({ family, familyId, refreshFamilyTools }) {
  const [applyMessage, setApplyMessage] = useState("");
  const siteInfo = useContext(SiteInfoContext);
  const user = useContext(UserContext);

  const isFamilyMember = Boolean(family.userRole);
  const canApply =
    user.loggedIn &&
    !isFamilyMember &&
    !family.hasPendingApplication &&
    family.applicationsOpen &&
    family.members.length < (family.memberLimit || 20);

  function onCancelApplication() {
    const joinFee = Number(family?.joinFee || 0);
    const msg = joinFee > 0 
      ? `Are you sure you want to cancel your application? Your ${joinFee.toLocaleString()} coin join fee will be refunded.` 
      : "Are you sure you want to cancel your application?";
      
    if (!window.confirm(msg)) return;

    axios
      .delete(`/api/family/${familyId}/applications/mine`)
      .then((res) => {
        siteInfo.showAlert("Application cancelled", "success");
        if (res.data?.coins !== undefined) {
          user.set((prev) => ({
            ...prev,
            coins: Number(res.data.coins ?? prev.coins ?? 0),
            balanceDollar: Number(res.data.balanceDollar ?? prev.balanceDollar ?? 0),
          }));
        }
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"));
  }

  function onApplyToFamily() {
    const joinFee = Number(family?.joinFee || 0);
    if (joinFee > 0) {
      if (!window.confirm(`This family requires a join fee of ${joinFee.toLocaleString()} coins. It will be refunded if rejected. Proceed?`)) {
        return;
      }
    }

    axios
      .post(`/api/family/${familyId}/apply`, { message: applyMessage })
      .then((res) => {
        siteInfo.showAlert("Application submitted", "success");
        setApplyMessage("");
        if (res.data?.coins !== undefined) {
          user.set((prev) => ({
            ...prev,
            coins: Number(res.data.coins ?? prev.coins ?? 0),
            balanceDollar: Number(res.data.balanceDollar ?? prev.balanceDollar ?? 0),
          }));
        }
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"));
  }

  return (
    <>
      {!isFamilyMember && family.hasPendingApplication && (
        <Paper sx={panelStyle}>
          <Typography variant="h3" sx={headingStyle}>
            Pending Application
          </Typography>
          <Stack direction="column" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Your application is awaiting review by the family leader.
            </Typography>
            {Number(family.joinFee || 0) > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1.5, py: 1 }}>
                <Typography variant="body2" color="text.secondary">Paid join fee (refunded if cancelled)</Typography>
                <CoinAmount amount={family.joinFee} variant="body1" sx={{ fontWeight: 700 }} />
              </Box>
            )}
            <Button variant="outlined" color="error" onClick={onCancelApplication}>
              Cancel Application
            </Button>
          </Stack>
        </Paper>
      )}
      {canApply && (
        <Paper sx={panelStyle}>
          <Typography variant="h3" sx={headingStyle}>
            Apply
          </Typography>
          <Stack direction="column" spacing={1}>
            {Number(family.joinFee || 0) > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1.5, py: 1 }}>
                <Typography variant="body2" color="text.secondary">Join fee</Typography>
                <CoinAmount amount={family.joinFee} variant="body1" sx={{ fontWeight: 700 }} />
              </Box>
            )}
            <TextField
              multiline
              minRows={3}
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Optional message"
              inputProps={{ maxLength: 500 }}
              helperText={`${applyMessage.length}/500 characters`}
            />
            <Button variant="contained" onClick={onApplyToFamily}>
              {Number(family.joinFee || 0) > 0 ? "Pay Fee and Apply" : "Submit Application"}
            </Button>
          </Stack>
        </Paper>
      )}
    </>
  );
}


export function FamilyProgress({ family }) {
  if (!family.quests || family.quests.length === 0) return null;
  return (
    <Paper sx={panelStyle}>
      <Typography variant="h3" sx={headingStyle}>
        Family Progress
      </Typography>
      <Stack direction="column" spacing={2}>
        {family.quests.map((quest) => (
          <Box key={quest.id}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Typography variant="body2">{quest.name}</Typography>
              <Typography variant="caption">
                {quest.current}/{quest.target}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(
                100,
                (Number(quest.current || 0) / Number(quest.target || 1)) * 100
              )}
            />
            <Typography variant="caption" color="text.secondary">
              {quest.description}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export function FamilyStockCard({ stockInfo, familyId }) {
  const theme = useTheme();
  const goldColor = theme.palette.mode === "light" ? "#b8860b" : "gold";

  if (!stockInfo) return null;

  return (
    <Paper sx={panelStyle}>
      <Typography variant="h3" sx={headingStyle}>
        Stock &amp; Equity
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", mt: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Current Price
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: goldColor, display: "flex", alignItems: "center", gap: 0.5 }}
            >
              {stockInfo.buyPrice.toFixed(2)}{" "}
              <Icon icon="lucide:coins" style={{ fontSize: "24px", verticalAlign: "middle" }} />
            </Typography>
          </Box>
          <Box>
            <Sparkline history={stockInfo.priceHistory} />
          </Box>
        </Stack>
        <Box sx={{ borderTop: "1px solid rgba(128,128,128,0.2)", mt: -0.5, mb: -1 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Supply
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {stockInfo.shareSupply} Shares
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Market Cap
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", color: goldColor, display: "flex", alignItems: "center", gap: 0.5 }}
            >
              {stockInfo.marketCap.toFixed(2)}{" "}
              <Icon icon="lucide:coins" style={{ fontSize: "14px", verticalAlign: "middle" }} />
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Your Holdings
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", color: stockInfo.sharesOwned > 0 ? "success.main" : "text.secondary" }}
            >
              {stockInfo.sharesOwned} Shares
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Dividends Paid
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", color: goldColor, display: "flex", alignItems: "center", gap: 0.5 }}
            >
              {(stockInfo.dividendsPaidOut || 0).toFixed(2)}{" "}
              <Icon icon="lucide:coins" style={{ fontSize: "14px", verticalAlign: "middle" }} />
            </Typography>
          </Grid>
        </Grid>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          component="a"
          href={`/fame/stocks?family=${familyId}`}
          sx={{ mt: 1, fontWeight: "bold" }}
          startIcon={<i className="fas fa-chart-line" />}
        >
          Trade Shares
        </Button>
      </Box>
    </Paper>
  );
}
