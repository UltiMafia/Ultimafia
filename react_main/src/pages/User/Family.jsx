import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  Stack,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from "@mui/material";

import { UserContext, SiteInfoContext } from "Contexts";
import { FamilyAvatarImage } from "utils/avatarUrl";
import { useErrorAlert } from "components/Alerts";
import { filterProfanity } from "components/Basic";
import { TextEditor } from "components/Form";
import { Avatar, NameWithAvatar, MediaEmbed } from "./UserWidgets";
import Comments from "../Community/Comments";
import { PageSkeleton } from "components/Skeletons";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import CustomMarkdown from "components/CustomMarkdown";
import TrophyCase from "components/TrophyCase";
import { capitalize } from "utils";
import { UiAction, UiDialog, UiIcon, UiMenu, UiMenuItem, UiPage, UiPageHeader } from "components/ui";
import { LatestRequest } from "../../lib/latestRequest";
import "css/family.css";
import { 
  FamilyTreasury, 
  FamilyLedger, 
  FamilyApplications, 
  FamilyPerks, 
  FamilyJoinFee, 
  FamilyApply,
  CoinAmount,
  FamilyProgress,
  FamilyStockCard,
  headingStyle,
} from "./FamilyExtras";

export default function Family() {
  const { familyId } = useParams();
  const [familyLoaded, setFamilyLoaded] = useState(false);
  const [family, setFamily] = useState(null);
  const [bio, setBio] = useState("");
  const [oldBio, setOldBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [ledgerRefreshKey, setLedgerRefreshKey] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuMember, setMenuMember] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [bioBusy, setBioBusy] = useState(false);
  const profileRequests = useRef(new LatestRequest());
  const actionPending = useRef(false);
  const bioPending = useRef(false);
  const editingBioRef = useRef(editingBio);
  editingBioRef.current = editingBio;

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  function loadFamilyProfile(signal) {
    const request = profileRequests.current.begin();
    setProfileError("");
    axios
      .get(`/api/family/${familyId}/profile`, { signal: signal || request.signal })
      .then((res) => {
        if (!request.isCurrent()) return;
        setFamily(res.data);
        if (!editingBioRef.current) setBio(res.data.bio || "");
        setFamilyLoaded(true);
        document.title = `${res.data.name} | UltiMafia`;
      })
      .catch((e) => {
        if (!request.isCurrent()) return;
        if (
          e.code === "ERR_CANCELED" ||
          e.name === "CanceledError" ||
          e.name === "AbortError"
        ) {
          return;
        }
        setProfileError("Could not load this family. Please try again.");
        setFamilyLoaded(true);
      });
  }

  function refreshFamilyTools() {
    loadFamilyProfile();
    setLedgerRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    if (familyId) {
      setFamilyLoaded(false);
      setFamily(null);
      setPendingInvite(null);
      setConfirmation(null);
      const controller = new AbortController();
      loadFamilyProfile(controller.signal);

      // Check for pending invite
      if (user.loggedIn) {
        axios
          .get(`/api/family/${familyId}/pendingInvite`, {
            signal: controller.signal,
          })
          .then((res) => {
            if (res.data.hasPendingInvite) {
              setPendingInvite(res.data.family);
            }
          })
          .catch(() => {
            // Ignore errors
          });
      }

      return () => { controller.abort(); profileRequests.current.invalidate(); };
    }
  }, [familyId]);

  // Apply family background to site-wrapper when viewing a family page with custom background
  // This replaces the default diamond pattern background ONLY on the Family page
  useEffect(() => {
    const siteWrapper = document.querySelector(".site-wrapper");
    if (!siteWrapper || !family) return;

    if (family.background && family.backgroundRepeatMode) {
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
        // Default: checker (tiled pattern)
        backgroundSize = "auto";
        backgroundRepeat = "repeat";
      }

      // Apply custom background to site-wrapper, replacing the default diamond pattern
      siteWrapper.style.backgroundImage = `url(${backgroundUrl})`;
      siteWrapper.style.backgroundSize = backgroundSize;
      siteWrapper.style.backgroundRepeat = backgroundRepeat;
      siteWrapper.style.backgroundPosition = backgroundPosition || "top left";
      siteWrapper.style.backgroundAttachment = "fixed";
    } else {
      // Remove inline styles to restore CSS default (white-diamond-dark.png)
      siteWrapper.style.backgroundImage = "";
      siteWrapper.style.backgroundSize = "";
      siteWrapper.style.backgroundRepeat = "";
      siteWrapper.style.backgroundPosition = "";
      siteWrapper.style.backgroundAttachment = "";
    }

    // Cleanup: restore original background when component unmounts
    return () => {
      if (siteWrapper) {
        // Remove inline styles to restore CSS default (white-diamond-dark.png)
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

  function onBioClick() {
    if (!family.isLeader) return;
    setEditingBio(true);
    setOldBio(bio);
  }

  function onEditBio() {
    if (bioPending.current || !family.isLeader) return;
    if (bio.length > 20000) {
      siteInfo.showAlert(
        "Family bio must be 20,000 characters or less.",
        "error"
      );
      return;
    }

    bioPending.current = true; setBioBusy(true);
    axios
      .post(`/api/family/${familyId}/bio`, { bio: bio })
      .then(() => {
        setEditingBio(false);
        setBio(filterProfanity(bio, user.settings, "\\*"));
      })
      .catch(errorAlert)
      .finally(() => { bioPending.current = false; setBioBusy(false); });
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
        loadFamilyProfile();
      })
      .catch(errorAlert);
  }

  function onRejectJoin() {
    setActionError(""); setConfirmation({ type: "reject", title: "Reject invitation?", description: `Reject the invitation to ${family.name}?`, label: "Reject invitation" });
  }

  function onRemoveMember(memberId, memberName) {
    setActionError(""); setConfirmation({ type: "remove", memberId, title: "Remove member?", description: `Remove ${memberName} from ${family.name}?`, label: "Remove member" });
  }

  async function confirmAction() {
    if (!confirmation || actionPending.current || (confirmation.type !== "reject" && !family.isLeader)) return;
    actionPending.current = true; setActionBusy(true); setActionError("");
    try {
      if (confirmation.type === "reject") { await axios.post(`/api/family/${familyId}/rejectJoin`); setPendingInvite(null); }
      else if (confirmation.type === "remove") await axios.delete(`/api/family/${familyId}/member/${confirmation.memberId}`);
      else await axios.post(`/api/family/${familyId}/member/${confirmation.memberId}/role`, { role: confirmation.role });
      setConfirmation(null); refreshFamilyTools();
    } catch (_) { setActionError("Could not update the family. Please try again."); }
    finally { actionPending.current = false; setActionBusy(false); }
  }

  if (!familyLoaded) return <PageSkeleton />;
  if (!family) return <UiPage title="Family unavailable" role="alert"><p>{profileError || "This family could not be found."}</p><UiAction onClick={() => loadFamilyProfile()}>Retry</UiAction><p><Link to="/community/families">Browse families</Link></p></UiPage>;

  const hasTrophySpotlight = family.perks?.some((p) => p.key === "trophySpotlight" && p.owned);

  const rankOrder = { leader: 0, officer: 1, member: 2 };
  const sortedMembers = [...family.members].sort(
    (a, b) => (rankOrder[a.role] ?? 2) - (rankOrder[b.role] ?? 2)
  );
  const membersList = sortedMembers.map((member) => (
    <Box
      key={member.id}
      sx={{
        py: 0.75,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
        "&:not(:last-child)": {
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          pb: 1,
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, flex: "1 1 auto" }}>
        <NameWithAvatar
          id={member.id}
          name={member.name}
          avatar={member.avatar}
          vanityUrl={member.vanityUrl}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexShrink: 0 }}>
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
        <Chip size="small" label={capitalize(member.role || "member")} variant="outlined" />
        {family.isLeader && user.loggedIn && member.id !== user.id && (
          <UiAction iconOnly variant="ghost" aria-label={`Manage ${member.name}`}
            onClick={(e) => {
              setMenuAnchorEl(e.currentTarget);
              setMenuMember(member);
            }}
          >
            <UiIcon name="menu" />
          </UiAction>
        )}
      </Box>
    </Box>
  ));

  return (
    <UiPage width="wide" className="family-page">
      {profileError && <p role="alert">{profileError}</p>}
      <UiMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => {
          setMenuAnchorEl(null);
          setMenuMember(null);
        }}
      >
        {menuMember && (
          <UiMenuItem
            onClick={() => {
              const action = menuMember.role === "officer" ? "demote" : "promote";
              const newRole = menuMember.role === "officer" ? "member" : "officer";
              setActionError("");
              setConfirmation({ type: "role", memberId: menuMember.id, role: newRole, title: "Change member role?", description: `${action === "promote" ? "Promote" : "Demote"} ${menuMember.name} to ${newRole}?`, label: "Change role" });
              setMenuAnchorEl(null); setMenuMember(null);
            }}
          >
            {menuMember.role === "officer" ? "Demote to Member" : "Promote to Officer"}
          </UiMenuItem>
        )}
        {menuMember && (
          <UiMenuItem
            onClick={() => {
              onRemoveMember(menuMember.id, menuMember.name);
              setMenuAnchorEl(null);
              setMenuMember(null);
            }}
            sx={{ color: "error.main" }}
          >
            Remove Member
          </UiMenuItem>
        )}
      </UiMenu>
      <UiDialog open={!!confirmation} title={confirmation?.title} onClose={actionBusy ? undefined : () => setConfirmation(null)} actions={<><UiAction disabled={actionBusy} onClick={() => setConfirmation(null)}>Cancel</UiAction><UiAction variant={confirmation?.type === "role" ? "primary" : "danger"} busy={actionBusy} onClick={confirmAction}>{confirmation?.label}</UiAction></>}><p>{confirmation?.description}</p>{actionError && <p role="alert">{actionError}</p>}</UiDialog>
      <div className="family-page-layout">
        <div className="family-main">
            <Paper className="ui-card family-profile-panel">
              {family.banner && (
                <div className="family-banner">
                  <img
                    className="family-banner-media"
                    src={`/uploads/${family.id}_family_banner.${
                      ["webp", "gif", "png", "jpg", "jpeg"].includes(
                        family.bannerExt
                      )
                        ? family.bannerExt
                        : "webp"
                    }?t=${siteInfo.cacheVal}`}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              )}
              <Stack
                className="family-header"
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  mb: 2,
                  mt: family.banner ? 1.5 : 0,
                }}
              >
                {family.avatar && (
                  <FamilyAvatarImage
                    id={family.id}
                    size={100}
                    cacheVal={siteInfo.cacheVal}
                  />
                )}
                <Box>
                  <UiPageHeader variant="detail" title={family.name} />
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
                      {bio || (family.isLeader ? "Add a family bio." : "No family bio yet.")}
                    </CustomMarkdown>
                  </div>
                )}
                {editingBio && (
                  <>
                    <TextEditor value={bio} onChange={setBio} readOnly={bioBusy} />
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
                      <UiAction variant="primary" busy={bioBusy} disabled={bio.length > 20000}
                        onClick={onEditBio}
                      >
                        Save bio
                      </UiAction>
                      <UiAction disabled={bioBusy}
                        onClick={onCancelEditBio}
                      >
                        Cancel
                      </UiAction>
                    </div>
                  </>
                )}
              </div>
              {family.isLeader && !editingBio && <UiAction onClick={onBioClick}>Edit family bio</UiAction>}
            </Paper>
            {family.trophies && family.trophies.length > 0 && (
              <Paper
                className="ui-card"
                sx={{
                  ...(hasTrophySpotlight && {
                    boxShadow: "0 0 25px 2px rgba(255, 215, 0, 0.4)",
                    border: "1px solid rgba(255, 215, 0, 0.6)",
                  })
                }}
              >
                <TrophyCase
                  trophies={family.trophies}
                  headingStyle={headingStyle}
                  wrapInPanel={false}
                />
              </Paper>
            )}
            <section className="family-comments">
              <h2>Comments</h2>
              <Comments fullWidth location={`family/${familyId}`} canModerateLocation={!!family.isLeader} />
            </section>
        </div>
        <aside className="family-rail">
            {pendingInvite && (
              <Paper className="ui-card">
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
                        family && family.members && family.members.length >= (family.memberLimit || 20)
                      }
                      sx={{ flex: 1 }}
                      title={
                        family && family.members && family.members.length >= (family.memberLimit || 20)
                          ? `This family has reached the maximum of ${family.memberLimit || 20} members.`
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
            
            {family.hasMusicPlayer && family.mediaUrl && (
              <Paper className="ui-card">
                <MediaEmbed
                  key={`${familyId}:${family.mediaUrl}`}
                  mediaUrl={family.mediaUrl}
                  autoplay={!!family.mediaAutoplay}
                  collapsible
                  collapsed={!!family.mediaCollapse}
                />
              </Paper>
            )}

            <Paper className="ui-card">
              <Typography variant="h3" sx={headingStyle}>
                Members
              </Typography>
              <Stack direction="column" spacing={1}>
                {membersList}
              </Stack>
            </Paper>
            
            <FamilyStockCard
              stockInfo={family.stockInfo}
              family={family}
              familyId={familyId}
              refreshFamilyTools={refreshFamilyTools}
            />
            <FamilyProgress family={family} />
            <FamilyApply family={family} familyId={familyId} refreshFamilyTools={refreshFamilyTools} />
            <FamilyApplications family={family} familyId={familyId} refreshFamilyTools={refreshFamilyTools} />
            <FamilyTreasury family={family} familyId={familyId} refreshFamilyTools={refreshFamilyTools} />
            <FamilyJoinFee family={family} familyId={familyId} refreshFamilyTools={refreshFamilyTools} />
            <FamilyPerks family={family} familyId={familyId} refreshFamilyTools={refreshFamilyTools} />
            <FamilyLedger familyId={familyId} refreshKey={ledgerRefreshKey} />
        </aside>
      </div>
    </UiPage>
  );
}
