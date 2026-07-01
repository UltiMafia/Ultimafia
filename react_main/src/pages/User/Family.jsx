import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "axios";
import {
  Grid,
  Stack,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  Tooltip,
  TextField,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Icon } from "@iconify/react";

import { UserContext, SiteInfoContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { filterProfanity } from "components/Basic";
import { TextEditor } from "components/Form";
import { NameWithAvatar } from "./User";
import Comments from "../Community/Comments";
import { Loading } from "components/Loading";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import CustomMarkdown from "components/CustomMarkdown";
import TrophyCase from "components/TrophyCase";

function CoinAmount({ amount, variant = "body2", sx = {} }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={sx}>
      <Typography variant={variant} component="span">
        {Number(amount || 0).toLocaleString()}
      </Typography>
      <Icon icon="lucide:coins" style={{ fontSize: "14px", color: "gold" }} />
    </Stack>
  );
}

export default function Family() {
  const { familyId } = useParams();
  const [familyLoaded, setFamilyLoaded] = useState(false);
  const [family, setFamily] = useState(null);
  const [bio, setBio] = useState("");
  const [oldBio, setOldBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [applications, setApplications] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [applyMessage, setApplyMessage] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [coinConfirmAction, setCoinConfirmAction] = useState(null);
  const [coinConfirmLoading, setCoinConfirmLoading] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const errorAlertRef = useRef(errorAlert);
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    errorAlertRef.current = errorAlert;
  }, [errorAlert]);

  const loadFamilyApplications = useCallback(() => {
    axios
      .get(`/api/family/${familyId}/applications`)
      .then((res) => {
        setApplications(res.data.applications || []);
      })
      .catch(() => {
        setApplications([]);
      });
  }, [familyId]);

  const loadFamilyProfile = useCallback(() => {
    setFamilyLoaded(false);
    axios
      .get(`/api/family/${familyId}/profile`)
      .then((res) => {
        setFamily(res.data);
        setBio(res.data.bio || "");
        setFamilyLoaded(true);
        document.title = `${res.data.name} | UltiMafia`;

        if (res.data.canManageApplications) {
          loadFamilyApplications();
        } else {
          setApplications([]);
        }
      })
      .catch((e) => {
        errorAlertRef.current(e);
        setFamilyLoaded(true);
      });
  }, [familyId, loadFamilyApplications]);

  const loadFamilyLedger = useCallback(() => {
    axios
      .get(`/api/family/${familyId}/ledger`)
      .then((res) => {
        setLedger(res.data.ledger || []);
      })
      .catch(() => {
        setLedger([]);
      });
  }, [familyId]);

  const loadFamilyLeaderboard = useCallback(() => {
    axios
      .get("/api/family/leaderboard")
      .then((res) => {
        setLeaderboard(res.data.leaderboard || []);
      })
      .catch(() => {
        setLeaderboard([]);
      });
  }, []);

  useEffect(() => {
    if (familyId) {
      loadFamilyProfile();
      loadFamilyLedger();
      loadFamilyLeaderboard();

      if (user.loggedIn) {
        axios
          .get(`/api/family/${familyId}/pendingInvite`)
          .then((res) => {
            if (res.data.hasPendingInvite) {
              setPendingInvite(res.data.family);
            }
          })
          .catch(() => {});
      }
    }
  }, [
    familyId,
    loadFamilyLedger,
    loadFamilyLeaderboard,
    loadFamilyProfile,
    user.loggedIn,
  ]);

  useEffect(() => {
    const siteWrapper = document.querySelector(".site-wrapper");
    if (!siteWrapper) return;

    if (family?.background && family?.backgroundRepeatMode) {
      const backgroundUrl = `/uploads/${familyId}_familyBackground.webp?t=${
        siteInfo?.cacheVal || Date.now()
      }`;
      const repeatMode = family.backgroundRepeatMode || "checker";

      let backgroundSize, backgroundRepeat, backgroundPosition;

      if (repeatMode === "stretch") {
        backgroundSize = "cover";
        backgroundRepeat = "no-repeat";
        backgroundPosition = "center";
      } else {
        backgroundSize = "auto";
        backgroundRepeat = "repeat";
      }

      siteWrapper.style.backgroundImage = `url(${backgroundUrl})`;
      siteWrapper.style.backgroundSize = backgroundSize;
      siteWrapper.style.backgroundRepeat = backgroundRepeat;
      siteWrapper.style.backgroundPosition = backgroundPosition || "top left";
      siteWrapper.style.backgroundAttachment = "fixed";
    } else {
      siteWrapper.style.backgroundImage = "";
      siteWrapper.style.backgroundSize = "";
      siteWrapper.style.backgroundRepeat = "";
      siteWrapper.style.backgroundPosition = "";
      siteWrapper.style.backgroundAttachment = "";
    }

    return () => {
      if (siteWrapper) {
        siteWrapper.style.backgroundImage = "";
        siteWrapper.style.backgroundSize = "";
        siteWrapper.style.backgroundRepeat = "";
        siteWrapper.style.backgroundPosition = "";
        siteWrapper.style.backgroundAttachment = "";
      }
    };
  }, [
    family?.background,
    family?.backgroundRepeatMode,
    familyId,
    siteInfo?.cacheVal,
  ]);

  function refreshFamilyTools() {
    loadFamilyProfile();
    loadFamilyLedger();
    loadFamilyLeaderboard();
    if (family?.canManageApplications) loadFamilyApplications();
  }

  function onBioClick() {
    if (!family.isLeader) return;
    setEditingBio(true);
    setOldBio(bio);
  }

  function onEditBio() {
    if (bio.length > 20000) {
      siteInfo.showAlert(
        "Family bio must be 20,000 characters or less.",
        "error"
      );
      return;
    }

    axios
      .post(`/api/family/${familyId}/bio`, { bio: bio })
      .then(() => {
        setEditingBio(false);
        setBio(filterProfanity(bio, user.settings, "\\*"));
      })
      .catch(errorAlert);
  }

  function onCancelEditBio() {
    setEditingBio(false);
    setBio(oldBio);
  }

  function onAcceptJoin() {
    axios
      .post(`/api/family/${familyId}/acceptJoin`)
      .then(() => {
        siteInfo.showAlert("You have joined the family!", "success");
        setPendingInvite(null);
        window.location.reload();
      })
      .catch(errorAlert);
  }

  function onRejectJoin() {
    if (!window.confirm("Are you sure you want to reject this invitation?")) {
      return;
    }

    axios
      .post(`/api/family/${familyId}/rejectJoin`)
      .then(() => {
        siteInfo.showAlert("Invitation rejected", "success");
        setPendingInvite(null);
      })
      .catch(errorAlert);
  }

  function onRemoveMember(memberId, memberName) {
    if (
      !window.confirm(
        `Are you sure you want to remove ${memberName} from the family?`
      )
    ) {
      return;
    }

    axios
      .delete(`/api/family/${familyId}/member/${memberId}`)
      .then(() => {
        siteInfo.showAlert("Member removed from family", "success");
        window.location.reload();
      })
      .catch(errorAlert);
  }

  function onApplyToFamily() {
    axios
      .post(`/api/family/${familyId}/apply`, { message: applyMessage })
      .then(() => {
        siteInfo.showAlert("Application submitted", "success");
        setApplyMessage("");
      })
      .catch(errorAlert);
  }

  function onApplicationAction(applicationId, action) {
    axios
      .post(`/api/family/${familyId}/applications/${applicationId}/${action}`)
      .then(() => {
        siteInfo.showAlert(
          action === "accept" ? "Application accepted" : "Application rejected",
          "success"
        );
        refreshFamilyTools();
      })
      .catch(errorAlert);
  }

  function onDeposit() {
    const amount = Math.floor(Number(depositAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      siteInfo.showAlert("Enter a positive coin amount", "error");
      return;
    }

    setCoinConfirmAction({
      type: "deposit",
      amount,
      title: "Confirm Deposit",
      description:
        "This will move the selected amount from your balance into the family treasury.",
    });
  }

  function depositToTreasury(amount) {
    axios
      .post(`/api/family/${familyId}/treasury/deposit`, { amount })
      .then((res) => {
        siteInfo.showAlert("Coins deposited", "success");
        setDepositAmount("");
        user.set((prev) => ({
          ...prev,
          coins: Number(res.data.coins ?? prev.coins ?? 0),
        }));
        refreshFamilyTools();
      })
      .finally(() => {
        setCoinConfirmLoading(false);
        setCoinConfirmAction(null);
      })
      .catch(errorAlert);
  }

  function onBuyPerk(perk) {
    setCoinConfirmAction({
      type: "perk",
      perkKey: perk.key,
      amount: Number(perk.cost || 0),
      title: "Confirm Perk Purchase",
      description: `This will spend family treasury funds on ${perk.name}.`,
    });
  }

  function buyPerk(perkKey) {
    axios
      .post(`/api/family/${familyId}/perks/${perkKey}/buy`)
      .then(() => {
        siteInfo.showAlert("Family perk bought", "success");
        refreshFamilyTools();
      })
      .finally(() => {
        setCoinConfirmLoading(false);
        setCoinConfirmAction(null);
      })
      .catch(errorAlert);
  }

  function closeCoinConfirmDialog() {
    if (coinConfirmLoading) return;
    setCoinConfirmAction(null);
  }

  function confirmCoinAction() {
    if (!coinConfirmAction) return;

    setCoinConfirmLoading(true);

    if (coinConfirmAction.type === "deposit") {
      depositToTreasury(coinConfirmAction.amount);
      return;
    }

    if (coinConfirmAction.type === "perk") {
      buyPerk(coinConfirmAction.perkKey);
    }
  }

  function onChangeMemberRole(memberId, role) {
    axios
      .post(`/api/family/${familyId}/member/${memberId}/role`, { role })
      .then(() => {
        siteInfo.showAlert("Family role updated", "success");
        refreshFamilyTools();
      })
      .catch(errorAlert);
  }

  if (!familyLoaded) return <Loading small />;
  if (!family) return <Navigate to="/play" />;

  const panelStyle = {
    backgroundColor: "var(--scheme-color)",
    padding: "16px",
    borderRadius: "4px",
  };

  const headingStyle = {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "8px",
  };

  const isFamilyMember = Boolean(family.userRole);
  const canApply =
    user.loggedIn &&
    !isFamilyMember &&
    family.applicationsOpen &&
    family.members.length < family.memberLimit;
  const ownedPerks = (family.perks || []).filter((perk) => perk.owned);
  const treasuryAmount = family.treasuryCoins ?? family.treasury ?? 0;

  const membersList = family.members.map((member) => (
    <Box
      key={member.id}
      sx={{
        mb: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <NameWithAvatar
        id={member.id}
        name={member.name}
        avatar={member.avatar}
        vanityUrl={member.vanityUrl}
      />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {member.role === "officer" && (
          <Chip label="Officer" size="small" color="primary" variant="outlined" />
        )}
        {member.isLeader && (
          <i
            className="fas fa-crown"
            style={{ color: "#FFD700", fontSize: "16px" }}
            title="Leader"
          />
        )}
        {member.isFounder && (
          <i
            className="fas fa-flag"
            style={{ color: "#4CAF50", fontSize: "16px" }}
            title="Founder"
          />
        )}
        {family.isLeader &&
          user.loggedIn &&
          member.id !== user.id &&
          !member.isLeader && (
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                onChangeMemberRole(
                  member.id,
                  member.role === "officer" ? "member" : "officer"
                )
              }
            >
              {member.role === "officer" ? "Demote" : "Promote"}
            </Button>
          )}
        {family.isLeader && user.loggedIn && member.id !== user.id && (
          <Tooltip title="Remove member">
            <IconButton
              size="small"
              onClick={() => onRemoveMember(member.id, member.name)}
              sx={{ color: "error.main" }}
            >
              <i className="fas fa-trash" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  ));

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Stack direction="column" spacing={1}>
            <Paper sx={panelStyle}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                {family.avatar && (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      backgroundImage: `url(/uploads/${family.id}_family_avatar.webp?t=${siteInfo.cacheVal})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}
                <Box>
                  <Typography variant="h2">{family.name}</Typography>
                  {(family.perks || []).some((p) => p.key === "familyBadge" && p.owned) && (
                    <Chip
                      label="Supporter"
                      size="small"
                      color="secondary"
                      sx={{ mb: 0.5 }}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Founded by{" "}
                    <NameWithAvatar
                      id={family.founder.id}
                      name={family.founder.name}
                      avatar={family.founder.avatar}
                      vanityUrl={family.founder.vanityUrl}
                    />
                  </Typography>
                </Box>
              </Stack>
              <div
                className={`bio${
                  family.isLeader && !editingBio ? " edit" : ""
                }`}
                onClick={onBioClick}
              >
                {!editingBio && (
                  <div className="md-content">
                    <CustomMarkdown>
                      {bio || "Click to edit your family's bio"}
                    </CustomMarkdown>
                  </div>
                )}
                {editingBio && (
                  <>
                    <TextEditor value={bio} onChange={setBio} />
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 1,
                        alignSelf: "flex-end",
                        color:
                          bio.length > 20000 ? "error.main" : "text.secondary",
                      }}
                    >
                      {bio.length}/20,000 characters
                    </Typography>
                    <div className="buttons">
                      <div
                        className="btn btn-theme"
                        onClick={onEditBio}
                        style={{
                          opacity: bio.length > 20000 ? 0.5 : 1,
                          cursor:
                            bio.length > 20000 ? "not-allowed" : "pointer",
                        }}
                      >
                        Submit
                      </div>
                      <div
                        className="btn btn-theme-sec"
                        onClick={onCancelEditBio}
                      >
                        Cancel
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Paper>

            <Paper sx={panelStyle}>
              <Typography variant="h3" sx={headingStyle}>
                Family Progress
              </Typography>
              <Stack spacing={2}>
                {(family.quests || []).map((quest) => (
                  <Box key={quest.id}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {quest.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {quest.current}/{quest.target}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        100,
                        (quest.current / quest.target) * 100
                      )}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {quest.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {family.trophies && family.trophies.length > 0 && (
              <Paper sx={panelStyle}>
                <TrophyCase
                  trophies={family.trophies}
                  headingStyle={headingStyle}
                  wrapInPanel={false}
                />
              </Paper>
            )}
            {!isPhoneDevice && (
              <Box sx={{ mt: "16px !important", px: 2 }}>
                <Comments fullWidth location={`family/${familyId}`} />
              </Box>
            )}
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack direction="column" spacing={2}>
            {pendingInvite && (
              <Paper sx={panelStyle}>
                <Typography variant="h3" sx={headingStyle}>
                  Pending Invite
                </Typography>
                <Stack direction="column" spacing={2}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={onAcceptJoin}
                      disabled={
                        family &&
                        family.members &&
                        family.members.length >= family.memberLimit
                      }
                      sx={{ flex: 1 }}
                      title={
                        family &&
                        family.members &&
                        family.members.length >= family.memberLimit
                          ? "This family has reached its member limit."
                          : ""
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={onRejectJoin}
                      sx={{ flex: 1 }}
                    >
                      Reject
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )}

            {canApply && (
              <Paper sx={panelStyle}>
                <Typography variant="h3" sx={headingStyle}>
                  Apply
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="Optional message"
                    inputProps={{ maxLength: 500 }}
                    helperText={`${applyMessage.length}/500 characters`}
                  />
                  <Button variant="contained" onClick={onApplyToFamily}>
                    Submit Application
                  </Button>
                </Stack>
              </Paper>
            )}

            {family.canManageApplications && applications.length > 0 && (
              <Paper sx={panelStyle}>
                <Typography variant="h3" sx={headingStyle}>
                  Applications
                </Typography>
                <Stack spacing={2}>
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
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() =>
                            onApplicationAction(application.id, "accept")
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            onApplicationAction(application.id, "reject")
                          }
                        >
                          Reject
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            <Paper sx={panelStyle}>
              <Typography variant="h3" sx={headingStyle}>
                Treasury
              </Typography>
              <CoinAmount amount={treasuryAmount} variant="h6" sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Shared with the Family ETF on the Stock Market.
              </Typography>
              {isFamilyMember && (
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount"
                    inputProps={{ min: 1 }}
                  />
                  <Button variant="contained" onClick={onDeposit}>
                    Deposit
                  </Button>
                </Stack>
              )}

              <Typography variant="h3" sx={{ ...headingStyle, mt: 2 }}>
                Perks
              </Typography>
              <Stack spacing={1.5}>
                {(family.perks || []).map((perk) => (
                  <Box key={perk.key}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {perk.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {perk.description}
                        </Typography>
                      </Box>
                      {perk.owned ? (
                        <Chip label="Owned" size="small" color="success" />
                      ) : (
                        family.canManageApplications && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onBuyPerk(perk)}
                            startIcon={
                              <Icon
                                icon="lucide:coins"
                                style={{ fontSize: "14px", color: "gold" }}
                              />
                            }
                          >
                            {perk.cost}
                          </Button>
                        )
                      )}
                    </Stack>
                  </Box>
                ))}
                {ownedPerks.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No perks bought yet.
                  </Typography>
                )}
              </Stack>

              {ledger.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h3" sx={headingStyle}>
                    History
                  </Typography>
                  <Stack spacing={1}>
                    {ledger.slice(0, 5).map((entry) => (
                      <Box key={entry.id}>
                        <Typography variant="body2">
                          {entry.description}
                        </Typography>
                        {entry.user && (
                          <Typography variant="caption" color="text.secondary">
                            by {entry.user.name}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>

            <Paper sx={panelStyle}>
              <Typography variant="h3" sx={headingStyle}>
                Members
              </Typography>
              <Stack direction="column" spacing={1}>
                {membersList}
              </Stack>
            </Paper>

            {leaderboard.length > 0 && (
              <Paper sx={panelStyle}>
                <Typography variant="h3" sx={headingStyle}>
                  Leaderboard
                </Typography>
                <Stack spacing={1}>
                  {leaderboard.slice(0, 5).map((entry) => (
                    <Stack
                      key={entry.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2">
                        {entry.rank}. {entry.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.score} pts
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
        {isPhoneDevice && (
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Comments fullWidth location={`family/${familyId}`} />
          </Grid>
        )}
      </Grid>

      <Dialog open={Boolean(coinConfirmAction)} onClose={closeCoinConfirmDialog}>
        <DialogTitle>{coinConfirmAction?.title || "Confirm"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {coinConfirmAction?.description}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Amount
          </Typography>
          <CoinAmount amount={coinConfirmAction?.amount} variant="h6" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCoinConfirmDialog} disabled={coinConfirmLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmCoinAction}
            disabled={coinConfirmLoading}
          >
            {coinConfirmLoading ? "Processing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
