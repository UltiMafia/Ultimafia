import React, { useState, useEffect, useContext } from "react";
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
} from "@mui/material";

import { UserContext, SiteInfoContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { filterProfanity } from "components/Basic";
import { TextEditor } from "components/Form";
import { Avatar, NameWithAvatar } from "./User";
import Comments from "../Community/Comments";
import { NewLoading } from "../Welcome/NewLoading";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import CustomMarkdown from "components/CustomMarkdown";
import { TROPHY_ICON } from "./Profile";

export default function Family() {
  const { familyId } = useParams();
  const [familyLoaded, setFamilyLoaded] = useState(false);
  const [family, setFamily] = useState(null);
  const [bio, setBio] = useState("");
  const [oldBio, setOldBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    if (familyId) {
      setFamilyLoaded(false);
      axios
        .get(`/api/family/${familyId}/profile`)
        .then((res) => {
          setFamily(res.data);
          setBio(res.data.bio || "");
          setFamilyLoaded(true);
          document.title = `${res.data.name} | UltiMafia`;
          // Debug: log trophies to console
          if (res.data.trophies && res.data.trophies.length > 0) {
            console.log("Family trophies:", res.data.trophies);
          }
        })
        .catch((e) => {
          errorAlert(e);
          setFamilyLoaded(true);
        });

      // Check for pending invite
      if (user.loggedIn) {
        axios
          .get(`/api/family/${familyId}/pendingInvite`)
          .then((res) => {
            if (res.data.hasPendingInvite) {
              setPendingInvite(res.data.family);
            }
          })
          .catch(() => {
            // Ignore errors
          });
      }
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
        // Reload the page to show updated member list
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
        // Reload the page to show updated member list
        window.location.reload();
      })
      .catch(errorAlert);
  }

  if (!familyLoaded) return <NewLoading small />;
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
            {family.trophies && family.trophies.length > 0 && (
              <Paper sx={panelStyle}>
                <Typography variant="h3" sx={headingStyle}>
                  Trophy Case
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {family.trophies.map((trophy) => {
                    const createdAt = trophy.createdAt
                      ? new Date(trophy.createdAt)
                      : null;
                    const formattedDate = createdAt
                      ? createdAt.toLocaleDateString()
                      : "Date unknown";

                    return (
                      <Tooltip
                        arrow
                        placement="top"
                        title={
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2">
                              {trophy.name}
                            </Typography>
                            {trophy.owner && (
                              <Typography variant="caption">
                                Owner: {trophy.owner.name}
                              </Typography>
                            )}
                            <Typography variant="caption">
                              Awarded {formattedDate}
                            </Typography>
                          </Stack>
                        }
                        key={trophy.id}
                      >
                        <Box className="trophy-item">
                          <img
                            src={TROPHY_ICON}
                            alt={`${trophy.name} trophy`}
                            className="trophy-icon"
                          />
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Paper>
            )}
            {!isPhoneDevice && (
              <Box
                sx={{
                  mt: "16px !important",
                  px: 2,
                }}
              >
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
                        family && family.members && family.members.length >= 20
                      }
                      sx={{ flex: 1 }}
                      title={
                        family && family.members && family.members.length >= 20
                          ? "This family has reached the maximum of 20 members."
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
            <Paper sx={panelStyle}>
              <Typography variant="h3" sx={headingStyle}>
                Members
              </Typography>
              <Stack direction="column" spacing={1}>
                {membersList}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
        {isPhoneDevice && (
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Comments fullWidth location={`family/${familyId}`} />
          </Grid>
        )}
      </Grid>
    </>
  );
}
