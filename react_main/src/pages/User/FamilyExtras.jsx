import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import {
  Stack,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Grid,
  useTheme,
  Tooltip,
} from "@mui/material";
import { NameWithAvatar } from "./UserWidgets";
import { SiteInfoContext, UserContext } from "Contexts";
import Sparkline from "components/Sparkline";
import TradeDialog from "components/TradeDialog";
import { PageNav } from "components/Nav";
import { UiAction, UiDialog, UiField, UiIcon } from "components/ui";
import CoinIcon from "components/CoinIcon";
import { LatestRequest } from "../../lib/latestRequest";

function useFamilyConfirmation() {
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  function open(value) { setError(""); setConfirmation(value); }
  async function confirm() {
    if (pending.current || !confirmation) return;
    pending.current = true; setBusy(true); setError("");
    try { await confirmation.run(); setConfirmation(null); }
    catch (failure) { setError(typeof failure.response?.data === "string" && failure.response.data.length <= 200 ? failure.response.data : "Could not complete this action. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  }
  const dialog = <UiDialog open={!!confirmation} title={confirmation?.title} onClose={busy ? undefined : () => setConfirmation(null)} actions={<><UiAction disabled={busy} onClick={() => setConfirmation(null)}>Cancel</UiAction><UiAction variant={confirmation?.destructive ? "danger" : "primary"} busy={busy} onClick={confirm}>{confirmation?.label || "Confirm"}</UiAction></>}><p>{confirmation?.description}</p>{error && <p role="alert">{error}</p>}</UiDialog>;
  return { open, dialog, busy };
}

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
      <CoinIcon size={16} alt="Coins" />
    </Stack>
  );
}

export function FamilyTreasury({ family, familyId, refreshFamilyTools }) {
  const [amount, setAmount] = useState("");
  const siteInfo = useContext(SiteInfoContext);
  const user = useContext(UserContext);
  const isFamilyMember = Boolean(family.userRole);
  const canWithdraw = family.userRole === "leader" || family.userRole === "founder";
  const confirmation = useFamilyConfirmation();

  function onAction(type) {
    const amountNum = Math.floor(Number(amount));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      siteInfo.showAlert("Enter a positive coin amount", "error");
      return;
    }
    if (!isFamilyMember || (type === "withdraw" && !canWithdraw)) return;
    confirmation.open({ title: type === "deposit" ? "Deposit coins?" : "Withdraw coins?", description: `${type === "deposit" ? "Deposit" : "Withdraw"} ${amountNum} coins ${type === "deposit" ? "into" : "from"} the treasury of ${family.name}?`, label: type === "deposit" ? "Deposit" : "Withdraw", run: () => axios
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
    });
  }

  return (
    <Paper className="ui-card family-treasury">
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
        <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
          <UiField label="Treasury amount"
            size="small"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            sx={{ flex: "1 1 100%", minWidth: 0 }}
          />
          <UiAction disabled={confirmation.busy} onClick={() => onAction("deposit")}>
            Deposit
          </UiAction>
          {canWithdraw && (
            <UiAction disabled={confirmation.busy} onClick={() => onAction("withdraw")}>
              Withdraw
            </UiAction>
          )}
        </Stack>
      )}
      {confirmation.dialog}
    </Paper>
  );
}

export function FamilyLedger({ familyId, refreshKey }) {
  const [ledger, setLedger] = useState([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [error, setError] = useState(false);
  const reads = useRef(new LatestRequest());

  const loadLedger = (pageToLoad) => {
    const request = reads.current.begin();
    setError(false);
    axios
      .get(`/api/family/${familyId}/ledger?page=${pageToLoad}`, { signal: request.signal })
      .then((res) => {
        if (!request.isCurrent()) return;
        setLedger(res.data.ledger || []);
        setMaxPage(res.data.maxPage || 1);
        setPage(pageToLoad);
      })
      .catch(() => {
        if (request.isCurrent()) setError(true);
      });
  };

  useEffect(() => {
    const owner = reads.current;
    loadLedger(1);
    return () => owner.invalidate();
  }, [familyId, refreshKey]);

  if (error) return <div role="alert"><p>Could not load family history.</p><UiAction onClick={() => loadLedger(page)}>Retry</UiAction></div>;
  if (ledger.length === 0) return null;

  return (
    <Paper className="ui-card">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h3" sx={{ ...headingStyle, mb: 0 }}>
          History
        </Typography>
        {maxPage > 1 && (
          <PageNav inverted page={page} maxPage={maxPage} onNav={(p) => loadLedger(p)} />
        )}
      </Stack>
      <Stack direction="column" spacing={1.5}>
        {ledger.map((entry) => {
          const isNegative = ["withdraw", "joinFeeRefund", "perk"].includes(entry.type);
          return (
            <Box
              key={entry.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                "&:not(:last-child)": {
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  pb: 1,
                },
              }}
            >
              <Box>
                <Typography variant="body2">{entry.description}</Typography>
                {entry.user && (
                  <Typography variant="caption" color="text.secondary">
                    by {entry.user.name}
                  </Typography>
                )}
              </Box>
              <Box sx={{ ml: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: isNegative ? "error.main" : "success.main",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {isNegative ? "-" : "+"}
                  {Math.abs(entry.amount).toFixed(2)}
                  <CoinIcon size={16} />
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

export function FamilyApplications({ familyId, family, refreshFamilyTools }) {
  const [applications, setApplications] = useState([]);
  const siteInfo = useContext(SiteInfoContext);
  const confirmation = useFamilyConfirmation();
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const reads = useRef(new LatestRequest());
  const [toggling, setToggling] = useState(false);
  const togglePending = useRef(false);

  useEffect(() => {
    if (family.canManageApplications) {
      const owner = reads.current, request = owner.begin();
      setReadError(false); setLoading(true);
      axios
        .get(`/api/family/${familyId}/applications`, { signal: request.signal })
        .then((res) => { if (request.isCurrent()) setApplications(res.data.applications || []); })
        .catch(() => { if (request.isCurrent()) setReadError(true); })
        .finally(() => { if (request.isCurrent()) setLoading(false); });
      return () => owner.invalidate();
    }
  }, [familyId, family.canManageApplications, retry]);

  function onApplicationAction(applicationId, action) {
    if (!family.canManageApplications) return;
    confirmation.open({ title: action === "accept" ? "Accept application?" : "Reject application?", description: `${action === "accept" ? "Accept" : "Reject"} this application to ${family.name}?`, label: action === "accept" ? "Accept application" : "Reject application", destructive: action === "reject", run: () => axios
      .post(`/api/family/${familyId}/applications/${applicationId}/${action}`)
      .then(() => {
        siteInfo.showAlert(action === "accept" ? "Application accepted" : "Application rejected", "success");
        refreshFamilyTools();
        // Remove from list locally to update UI quickly
        setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      })
    });
  }

  function toggleApplicationsOpen() {
    if (togglePending.current || !family.isLeader) return;
    togglePending.current = true; setToggling(true);
    axios
      .post(`/api/family/${familyId}/applicationsOpen`, {
        applicationsOpen: !family.applicationsOpen,
      })
      .then(() => {
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"))
      .finally(() => { togglePending.current = false; setToggling(false); });
  }

  if (!family.canManageApplications) return null;

  return (
    <Paper className="ui-card family-applications">
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
              disabled={!family.isLeader || toggling}
            />
          }
          label={<Typography variant="caption">{family.applicationsOpen ? "Open" : "Closed"}</Typography>}
          sx={{ mr: 0 }}
        />
      </Stack>
      <Stack direction="column" spacing={1}>
        {readError && <div role="alert"><p>Could not load family applications.</p><UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>}
        {loading && <p role="status">Loading applications…</p>}
        {!loading && !readError && applications.length === 0 && (
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
              <UiAction variant="primary" onClick={() => onApplicationAction(application.id, "accept")}>
                Accept
              </UiAction>
              <UiAction variant="danger-quiet" onClick={() => onApplicationAction(application.id, "reject")}>
                Reject
              </UiAction>
            </Stack>
          </Box>
        ))}
      </Stack>
      {confirmation.dialog}
    </Paper>
  );
}

export function FamilyPerks({ family, familyId, refreshFamilyTools }) {
  const siteInfo = useContext(SiteInfoContext);
  const ownedPerks = (family.perks || []).filter((perk) => perk.owned);
  const confirmation = useFamilyConfirmation();

  function onBuyPerk(perk) {
    if (!family.canManageApplications) return;
    confirmation.open({ title: "Buy family perk?", description: `Spend ${Number(perk.cost).toFixed(2)} treasury coins on ${perk.name}?`, label: "Buy perk", run: () => axios
      .post(`/api/family/${familyId}/perks/${perk.key}/buy`)
      .then(() => {
        siteInfo.showAlert("Family perk bought", "success");
        refreshFamilyTools();
      })
    });
  }

  return (
    <Paper className="ui-card family-perks">
      <Typography variant="h3" sx={headingStyle}>
        Perks
      </Typography>
      <Stack direction="column" spacing={1}>
        {(family.perks || []).map((perk) => (
          <Box key={perk.key}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant="body2">{perk.name}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 0.25,
                  }}
                >
                  {perk.description}
                  {perk.details ? (
                    <Tooltip
                      title={
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{ display: "block", maxWidth: 280, lineHeight: 1.4 }}
                        >
                          {perk.details}
                        </Typography>
                      }
                      arrow
                      placement="top"
                      enterTouchDelay={0}
                    >
                      <UiAction iconOnly variant="ghost"
                        aria-label={`More info about ${perk.name}`}
                        onClick={(e) => e.preventDefault()}
                      >
                        <UiIcon name="info" size={16} />
                      </UiAction>
                    </Tooltip>
                  ) : null}
                </Typography>
              </Box>
              {perk.owned ? (
                <Chip size="small" label="Owned" color="success" />
              ) : (
                family.canManageApplications && (
                  <UiAction
                    aria-label={`Buy ${perk.name}`}
                    onClick={() => onBuyPerk(perk)}
                  >
                    <CoinIcon size={16} />
                    {Number(perk.cost).toFixed(2)}
                  </UiAction>
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
      {confirmation.dialog}
    </Paper>
  );
}

export function FamilyJoinFee({ family, familyId, refreshFamilyTools }) {
  const [joinFeeInput, setJoinFeeInput] = useState(String(Number(family.joinFee || 0)));
  const siteInfo = useContext(SiteInfoContext);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  useEffect(() => setJoinFeeInput(String(Number(family.joinFee || 0))), [family.joinFee]);

  if (!family.isLeader) return null;

  function onSaveJoinFee() {
    if (pending.current || !family.isLeader) return;
    const joinFee = Math.floor(Number(joinFeeInput));
    if (!Number.isFinite(joinFee) || joinFee < 0) {
      siteInfo.showAlert("Join fee must be a positive number or 0", "error");
      return;
    }
    pending.current = true; setSaving(true);
    axios
      .post(`/api/family/${familyId}/joinFee`, { joinFee })
      .then((res) => {
        setJoinFeeInput(String(Number(res.data.joinFee || 0)));
        siteInfo.showAlert("Join fee updated", "success");
        refreshFamilyTools();
      })
      .catch((e) => siteInfo.showAlert(e.response?.data || "Error", "error"))
      .finally(() => { pending.current = false; setSaving(false); });
  }

  return (
    <Paper className="ui-card">
      <Typography variant="h3" sx={headingStyle}>
        Join Fee
      </Typography>
      <Stack direction="column" spacing={1}>
        <UiField label="Join fee in coins" disabled={saving}
          size="small"
          type="number"
          value={joinFeeInput}
          onChange={(e) => setJoinFeeInput(e.target.value)}
          inputProps={{ min: 0, step: 1 }}
          placeholder="0"
          fullWidth
        />
        <UiAction busy={saving} onClick={onSaveJoinFee}>
          Save Join Fee
        </UiAction>
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
  const confirmation = useFamilyConfirmation();

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
      
    if (!family.hasPendingApplication || !user.loggedIn) return;
    confirmation.open({ title: "Cancel application?", description: msg, label: "Cancel application", destructive: true, run: () => axios
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
    });
  }

  function onApplyToFamily() {
    if (!canApply) return;
    const joinFee = Number(family?.joinFee || 0);
    confirmation.open({ title: "Apply to family?", description: joinFee > 0 ? `Pay ${joinFee.toLocaleString()} coins to apply to ${family.name}? The fee is refunded if your application is rejected.` : `Send your application to ${family.name}?`, label: joinFee > 0 ? "Pay fee and apply" : "Submit application", run: () => axios
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
    });
  }

  return (
    <>
      {!isFamilyMember && family.hasPendingApplication && (
        <Paper className="ui-card">
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
            <UiAction variant="danger-quiet" onClick={onCancelApplication}>
              Cancel Application
            </UiAction>
          </Stack>
        </Paper>
      )}
      {canApply && (
        <Paper className="ui-card family-apply">
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
            <UiField label="Application message" disabled={confirmation.busy}
              multiline
              minRows={3}
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Optional message"
              inputProps={{ maxLength: 500 }}
              helperText={`${applyMessage.length}/500 characters`}
            />
            <UiAction variant="primary" disabled={confirmation.busy} onClick={onApplyToFamily}>
              {Number(family.joinFee || 0) > 0 ? "Pay Fee and Apply" : "Submit Application"}
            </UiAction>
          </Stack>
        </Paper>
      )}
      {confirmation.dialog}
    </>
  );
}


export function FamilyProgress({ family }) {
  if (!family.quests || family.quests.length === 0) return null;
  return (
    <Paper className="ui-card">
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

export function FamilyStockCard({ stockInfo, family, familyId, refreshFamilyTools }) {
  const theme = useTheme();
  const siteInfo = useContext(SiteInfoContext);
  const goldColor = theme.palette.mode === "light" ? "#b8860b" : "gold";
  const [tradeModalOpen, setTradeModalOpen] = useState(false);

  if (!stockInfo) return null;

  return (
    <>
      <TradeDialog
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        stock={
          stockInfo
            ? {
                targetType: "family",
                id: familyId,
                name: family.name,
                avatar: family.avatar,
                shareSupply: stockInfo.shareSupply,
                sharesOwned: stockInfo.sharesOwned,
              }
            : null
        }
        onSuccess={refreshFamilyTools}
      />
      <Paper className="ui-card">
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
              <CoinIcon size={16} />
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
              <CoinIcon size={16} />
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
              <CoinIcon size={16} />
            </Typography>
          </Grid>
        </Grid>
          <UiAction variant="primary"
            onClick={() => setTradeModalOpen(true)}
            style={{ marginTop: 8, width: "100%" }}
          >
            Trade Shares
          </UiAction>
        </Box>
      </Paper>
    </>
  );
}
