import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Stack,
  TextField,
  Box,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { SiteInfoContext } from "Contexts";
import { Loading } from "components/Loading";
import Setup from "components/Setup";

import { COMMAND_COLOR } from "./commands";

export default function CompetitiveManagement() {
  const [seasonData, setSeasonData] = useState(null);
  const [controlsSaving, setControlsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addSetupDialogOpen, setAddSetupDialogOpen] = useState(false);
  const [addSetupRoundIndex, setAddSetupRoundIndex] = useState(null);
  const [setupIdToAdd, setSetupIdToAdd] = useState("");
  const [addingSetup, setAddingSetup] = useState(false);
  const errorAlert = useErrorAlert();
  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    axios
      .get("/api/competitive/current")
      .then((response) => {
        if (cancelled) return;

        if (
          response.data &&
          response.data.setups &&
          response.data.setupOrder
        ) {
          if (
            !Array.isArray(response.data.setups) ||
            response.data.setups.length === 0
          ) {
            errorAlert("Season has no setups configured.");
            setLoading(false);
            return;
          }
          setSeasonData(response.data);
          setLoading(false);
        } else {
          errorAlert("Invalid season data received.");
          setLoading(false);
        }
      })
      .catch((error) => {
        if (cancelled) return;

        const errorMessage =
          error.response?.data ||
          error.message ||
          "Failed to load current season data.";
        errorAlert(
          typeof errorMessage === "string"
            ? errorMessage
            : "Failed to load current season data."
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveControls = async (changes) => {
    if (!seasonData || controlsSaving) return;
    setControlsSaving(true);
    try {
      const response = await axios.post("/api/competitive/controls", {
        seasonNumber: seasonData.seasonNumber, ...changes,
      });
      setSeasonData((current) => ({ ...current, paused: response.data.paused,
        settings: changes.settings ? response.data.settings : current.settings }));
      siteInfo.showAlert("Competitive controls saved.", "success");
    } catch (error) {
      errorAlert(error.response?.data || "Could not save competitive controls.");
    } finally {
      setControlsSaving(false);
    }
  };

  const moveSetup = (roundIndex, setupIndex, direction) => {
    if (!seasonData) return;

    const newSetupOrder = seasonData.setupOrder.map((round) => [...round]);
    const setupNumber = newSetupOrder[roundIndex][setupIndex];

    if (direction === "up") {
      if (roundIndex > 0) {
        newSetupOrder[roundIndex].splice(setupIndex, 1);
        newSetupOrder[roundIndex - 1].push(setupNumber);
        setSeasonData({ ...seasonData, setupOrder: newSetupOrder });
      }
    } else if (direction === "down") {
      if (roundIndex < newSetupOrder.length - 1) {
        newSetupOrder[roundIndex].splice(setupIndex, 1);
        newSetupOrder[roundIndex + 1].push(setupNumber);
        setSeasonData({ ...seasonData, setupOrder: newSetupOrder });
      }
    }
  };

  const handleSave = () => {
    if (!seasonData) return;

    setSaving(true);

    axios
      .post("/api/competitive/updateSetupOrder", {
        setupOrder: seasonData.setupOrder,
      })
      .then(() => {
        siteInfo.showAlert("Changes saved successfully.", "success");
        setSaving(false);
      })
      .catch((error) => {
        errorAlert(error.response?.data || "Failed to save changes.");
        setSaving(false);
      });
  };

  const handleRemoveSetup = (roundIndex, setupIndex) => {
    if (!seasonData) return;

    const newSetupOrder = seasonData.setupOrder.map((round) => [...round]);
    newSetupOrder[roundIndex].splice(setupIndex, 1);
    setSeasonData({ ...seasonData, setupOrder: newSetupOrder });
  };

  const handleAddSetup = (roundIndex) => {
    setAddSetupRoundIndex(roundIndex);
    setSetupIdToAdd("");
    setAddSetupDialogOpen(true);
  };

  const handleConfirmAddSetup = () => {
    if (!seasonData || !setupIdToAdd.trim()) return;

    setAddingSetup(true);
    axios
      .post("/api/competitive/addSetup", {
        setupId: setupIdToAdd.trim(),
        roundIndex: addSetupRoundIndex,
      })
      .then(() => {
        axios
          .get("/api/competitive/current")
          .then((response) => {
            if (
              response.data &&
              response.data.setups &&
              response.data.setupOrder
            ) {
              setSeasonData(response.data);
              setAddSetupDialogOpen(false);
              setSetupIdToAdd("");
              setAddingSetup(false);
              siteInfo.showAlert("Setup added successfully.", "success");
            } else {
              errorAlert("Failed to reload season data.");
              setAddingSetup(false);
            }
          })
          .catch(() => {
            errorAlert("Failed to reload season data.");
            setAddingSetup(false);
          });
      })
      .catch((error) => {
        const errorMessage =
          error.response?.data || error.message || "Failed to add setup.";
        errorAlert(
          typeof errorMessage === "string" ? errorMessage : "Failed to add setup."
        );
        setAddingSetup(false);
      });
  };

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Competitive Management
      </Typography>

      <Stack direction="column" spacing={2}>
        <Typography
          sx={{
            fontFamily: "RobotoMono",
            fontSize: "18px",
            backgroundColor: COMMAND_COLOR,
            textAlign: "center",
            px: 2,
            py: 1,
          }}
        >
          {"Manage Competitive Season "}
          {seasonData ? `#${seasonData.seasonNumber}` : ""}
          {" Setups "}
        </Typography>

        {loading ? (
          <Loading />
        ) : seasonData ? (
          <>
            {seasonData.settings && (
              <Stack spacing={2}>
                <Typography>Season {seasonData.paused ? "paused" : "playing"}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button disabled={controlsSaving || !seasonData.paused} onClick={() => saveControls({ paused: false })}>Play</Button>
                  <Button disabled={controlsSaving || seasonData.paused} onClick={() => saveControls({ paused: true })}>Pause</Button>
                </Stack>
                <Typography variant="body2">
                  Open and review days apply to newly created rounds. Daily hearts apply to future allocations;
                  zero stops new allocation without removing existing hearts. The fortune limit and grace period
                  apply to the current round as well. Saving does not reset scores or heart balances.
                  Play permits new starts; an existing full lobby cancelled by Pause needs a player
                  to leave and rejoin to restart its ready check/countdown.
                </Typography>
                {[
                  ["openDays", "Open days per new round"],
                  ["reviewDays", "Review days per new round"],
                  ["dailyHearts", "Gold hearts per allocation"],
                  ["fortuneLimit", "Fortune finish limit"],
                  ["graceHours", "Heart-spending grace hours"],
                ].map(([name, label]) => (
                  <TextField key={name} label={label} type="number"
                    disabled={controlsSaving || (name === "fortuneLimit" && seasonData.settings.fortuneLimit === null)}
                    value={seasonData.settings[name] ?? ""}
                    onChange={(event) => {
                      const value = event.target.value === "" ? "" : Number(event.target.value);
                      setSeasonData((current) => ({ ...current, settings: { ...current.settings, [name]: value } }));
                    }} />
                ))}
                <FormControlLabel label="No fortune-triggered finish"
                  control={<Checkbox disabled={controlsSaving} checked={seasonData.settings.fortuneLimit === null}
                    onChange={(event) => setSeasonData((current) => ({ ...current,
                      settings: { ...current.settings, fortuneLimit: event.target.checked ? null : "" },
                    }))} />} />
                <Button disabled={controlsSaving} onClick={() => saveControls({ settings: seasonData.settings })}>Save settings</Button>
              </Stack>
            )}
            <Box
              sx={{
                border: "1px solid var(--scheme-color-border)",
                p: 2,
              }}
            >
              <Stack direction="column" spacing={2}>
                {seasonData.setupOrder && seasonData.setupOrder.length > 0 ? (
                  seasonData.setupOrder.map((roundSetups, roundIndex) => (
                    <Box
                      key={roundIndex}
                      sx={{
                        border: "1px solid var(--scheme-color-border)",
                        borderRadius: 1,
                        p: 2,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: "RobotoMono", flex: 1 }}
                        >
                          Round {roundIndex + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleAddSetup(roundIndex)}
                          sx={{ color: "primary.main" }}
                          title="Add setup to this round"
                        >
                          <i className="fas fa-plus" />
                        </IconButton>
                      </Stack>
                      <Stack direction="column" spacing={1}>
                        {roundSetups && roundSetups.length > 0 ? (
                          roundSetups.map((setupNumber, setupIndex) => {
                            const setup =
                              seasonData.setups &&
                              seasonData.setups[setupNumber];
                            if (!setup) {
                              return (
                                <Typography
                                  key={`${roundIndex}-${setupIndex}`}
                                  color="error"
                                >
                                  Setup {setupNumber} not found (index out of
                                  bounds)
                                </Typography>
                              );
                            }
                            if (!setup.id) {
                              return (
                                <Typography
                                  key={`${roundIndex}-${setupIndex}`}
                                  color="error"
                                >
                                  Setup at index {setupNumber} is missing id
                                  field
                                </Typography>
                              );
                            }
                            return (
                              <Box
                                key={setup.id || `${roundIndex}-${setupIndex}`}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  p: 1,
                                  backgroundColor: "var(--scheme-color)",
                                  borderRadius: 1,
                                }}
                              >
                                <Stack direction="column" spacing={0.5}>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      moveSetup(roundIndex, setupIndex, "up")
                                    }
                                    disabled={roundIndex === 0}
                                    sx={{
                                      width: "24px",
                                      height: "24px",
                                      fontSize: "16px",
                                    }}
                                  >
                                    ↑
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      moveSetup(
                                        roundIndex,
                                        setupIndex,
                                        "down"
                                      )
                                    }
                                    disabled={
                                      roundIndex ===
                                      seasonData.setupOrder.length - 1
                                    }
                                    sx={{
                                      width: "24px",
                                      height: "24px",
                                      fontSize: "16px",
                                    }}
                                  >
                                    ↓
                                  </IconButton>
                                </Stack>
                                <Box sx={{ flex: 1 }}>
                                  {setup.id ? (
                                    <Setup setup={setup} />
                                  ) : (
                                    <Typography color="error">
                                      Setup missing id:{" "}
                                      {JSON.stringify(setup)}
                                    </Typography>
                                  )}
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleRemoveSetup(roundIndex, setupIndex)
                                  }
                                  sx={{ color: "error.main" }}
                                  title="Remove setup from this round"
                                >
                                  <i className="fas fa-times" />
                                </IconButton>
                              </Box>
                            );
                          })
                        ) : (
                          <Typography color="text.secondary">
                            No setups in this round
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">
                    No rounds configured
                  </Typography>
                )}
              </Stack>
            </Box>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="contained"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          </>
        ) : null}
      </Stack>

      <Dialog
        open={addSetupDialogOpen}
        onClose={() => setAddSetupDialogOpen(false)}
      >
        <DialogTitle>
          Add Setup to Round{" "}
          {addSetupRoundIndex !== null ? addSetupRoundIndex + 1 : ""}
        </DialogTitle>
        <DialogContent>
          <Stack direction="column" spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Setup ID"
              value={setupIdToAdd}
              onChange={(e) => setSetupIdToAdd(e.target.value)}
              placeholder="Enter competitive setup ID"
              fullWidth
              disabled={addingSetup}
              onKeyPress={(e) => {
                if (
                  e.key === "Enter" &&
                  !addingSetup &&
                  setupIdToAdd.trim()
                ) {
                  handleConfirmAddSetup();
                }
              }}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                onClick={() => setAddSetupDialogOpen(false)}
                disabled={addingSetup}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAddSetup}
                disabled={addingSetup || !setupIdToAdd.trim()}
                variant="contained"
              >
                {addingSetup ? "Adding..." : "Add Setup"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
