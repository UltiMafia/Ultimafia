import React, { useState, useEffect, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  LinearProgress,
  Paper,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import { UserContext, SiteInfoContext } from "Contexts";
import Form, { useForm } from "components/Form";
import { useErrorAlert } from "components/Alerts";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

import "css/settings.css";
import { setCaptchaVisible } from "utils";
import { NewLoading } from "../Welcome/NewLoading";

export default function Settings() {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accounts, setAccounts] = useState({});
  const [accessibilityTheme, setAccessibilityTheme] = useState("");
  const [emailForPasswordReset, setEmailForPasswordReset] = useState("");
  const [loading, setLoading] = useState(false);
  const { mode, setMode } = useColorScheme();

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const navigate = useNavigate();

  const [siteFields, updateSiteFields] = useForm([
    {
      label: "Referral URL",
      ref: "referralURL",
      type: "text",
      value: (deps) =>
        `${import.meta.env.REACT_APP_URL}/auth/login?ref=${deps.user.id}`,
      fixed: true,
      highlight: true,
    },
    {
      label: "DMs from Friends Only",
      ref: "onlyFriendDMs",
      type: "boolean",
    },
    {
      label: "Disable PG-13 Censor",
      ref: "disablePg13Censor",
      type: "boolean",
      showIf: "!disableAllCensors",
    },
    {
      label: "Disable All Censors",
      ref: "disableAllCensors",
      type: "boolean",
      showIf: (deps) => deps.user.perms.disableAllCensors,
    },
    {
      label: "Hide Deleted Posts",
      ref: "hideDeleted",
      type: "boolean",
      showIf: (deps) => deps.user.perms.viewDeleted,
    },
    {
      label: "Site Color Scheme",
      ref: "siteColorScheme",
      type: "select",
      onChange: (event) => {
        setMode(event.target.value);
      },
      options: [
        {
          label: "System",
          value: "system",
        },
        {
          label: "Light",
          value: "light",
        },
        {
          label: "Dark",
          value: "dark",
        },
      ],
      value: mode,
    },
    {
      label: "Disable Protips",
      ref: "disableProTips",
      type: "boolean",
    },
    {
      label: "Experimental High DPI Correction",
      ref: "expHighDpiCorrection",
      type: "boolean",
    },
  ]);

  const [profileFields, updateProfileFields] = useForm(
    [
      {
        label: "Name",
        ref: "username",
        type: "text",
        saveBtn: "Change",
        saveBtnDiffer: "name",
        saveBtnOnClick: onUsernameSave,
        confirm: "Are you sure you wish to change your username?",
      },
      {
        label: "Pronouns",
        ref: "pronouns",
        type: "text",
        saveBtn: "Change",
        saveBtnDiffer: "pronouns",
        saveBtnOnClick: onPronounsSave,
      },
      {
        label: "Birthday",
        ref: "birthday",
        type: "date",
        saveBtn: "Change",
        saveBtnDiffer: "bdayChanged",
        default: Date.now(),
        saveBtnOnClick: onBirthdaySave,
        confirm:
          "Are you sure you wish to change your birthday? Your birthday can only be changed ONCE per account.",
      },
      {
        label: "Background Color",
        ref: "backgroundColor",
        type: "color",
        default: "#535353",
        disabled: (deps) => !deps.user.itemsOwned.customProfile,
      },
      {
        label: "Media URL",
        ref: "youtube",
        type: "text",
        saveBtn: "Change",
        saveBtnDiffer: "youtube",
        saveBtnOnClick: onMediaSave,
        default: "",
        extraInfo:
          "Supports YouTube, SoundCloud, Spotify, Bandcamp, Vimeo, Invidious, and direct media files (mp3, mp4, webm, ogg)",
      },
      {
        label: "Autoplay Media",
        ref: "autoplay",
        type: "boolean",
        showIf: (deps) => deps.user.settings.youtube != null,
      },
      {
        label: "Banner Format",
        ref: "bannerFormat",
        type: "select",
        options: [
          {
            label: "Tile",
            value: "tile",
          },
          {
            label: "Stretch",
            value: "stretch",
          },
        ],
        disabled: (deps) => !deps.user.itemsOwned.customProfile,
      },
      {
        label: "Avatar shape",
        ref: "avatarShape",
        type: "select",
        options: [
          {
            label: "Circle",
            value: "circle",
          },
          {
            label: "Square",
            value: "square",
          },
        ],
        disabled: (deps) => !deps.user.itemsOwned.avatarShape,
      },
      {
        label: "Hide Statistics",
        ref: "hideStatistics",
        type: "boolean",
      },
      {
        label: "Hide Karma",
        ref: "hideKarma",
        type: "boolean",
      },
      {
        label: "Hide Misfortune",
        ref: "hidePointsNegative",
        type: "boolean",
      },
      {
        label: "Vanity URL",
        ref: "vanityUrl",
        type: "text",
        saveBtn: "Change",
        saveBtnDiffer: "vanityUrl",
        saveBtnOnClick: onVanityUrlSave,
        clearBtn: "Clear",
        clearBtnOnClick: onVanityUrlClear,
        disabled: (deps) => !deps.user.itemsOwned.vanityUrl,
        extraInfo:
          "Set a custom URL for your profile (1-20 characters, letters, numbers, and hyphens only)",
      },
    ],
    [accounts]
  );

  const [gameFields, updateGameFields] = useForm([
    {
      label: "Name Color",
      ref: "nameColor",
      type: "color",
      default: "#68a9dc",
      disabled: (deps) => !deps.user.itemsOwned.textColors,
      extraInfo:
        "Note: Colors must have good contrast in both light and dark themes (minimum 3:1 ratio). Choose colors that are readable on both white and dark backgrounds.",
    },
    {
      label: "Text Color",
      ref: "textColor",
      type: "color",
      default: "#FFF",
      disabled: (deps) => !deps.user.itemsOwned.textColors,
      extraInfo:
        "Note: Colors must have good contrast in both light and dark themes (minimum 3:1 ratio). Choose colors that are readable on both white and dark backgrounds.",
    },
    {
      label: "Ignore Custom Text Color",
      ref: "ignoreTextColor",
      type: "boolean",
    },
    {
      label: "Death Message (max 150 chars)",
      ref: "deathMessage",
      type: "text",
      textStyle: "large",
      saveBtn: "Change",
      saveBtnDiffer: "deathMessage",
      saveBtnOnClick: onCustomDeathMessageSave,
      disabled: (deps) => !deps.user.itemsOwned.deathMessageEnabled,
    },
    {
      label: "Upload Custom Emote",
      ref: "customEmotes",
      type: "emoteUpload",
      onCustomEmoteUpload: onCustomEmoteUpload,
      onCustomEmoteDelete: onCustomEmoteDelete,
      disabled: (deps) =>
        deps.user.itemsOwned.customEmotes !== undefined &&
        deps.user.itemsOwned.customEmotes.length > 0,
    },
  ]);

  useEffect(() => {
    document.title = "Settings | UltiMafia";
    if (user.loaded && user.loggedIn) {
      if (!settingsLoaded) loadSettings();
      if (!accountsLoaded) loadAccounts();
    }
  }, [user]);

  const loadSettings = () => {
    axios
      .get("/api/user/settings/data")
      .then((res) => {
        updateFieldsFromData(res.data);
        setSettingsLoaded(true);
      })
      .catch(errorAlert);
  };

  const loadAccounts = () => {
    axios
      .get("/api/user/accounts")
      .then((res) => {
        setAccounts(res.data);
        setAccountsLoaded(true);
      })
      .catch(errorAlert);
  };

  const updateFieldsFromData = (data) => {
    let changes = Object.keys(data).map((ref) => ({
      ref,
      prop: "value",
      value: data[ref],
    }));
    updateSiteFields(changes);
    updateProfileFields(changes);
    updateGameFields(changes);
  };

  const handleAccessibilityThemeChange = async (e) => {
    const value = e.target.value;
    try {
      await axios.post("/api/user/settings/update", {
        prop: "accessibilityTheme",
        value,
      });
      user.updateSetting("accessibilityTheme", value);
      setAccessibilityTheme(value);
    } catch (err) {
      errorAlert();
    }
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, emailForPasswordReset);
      siteInfo.showAlert("Password reset email has been sent.", "success");
      setEmailForPasswordReset("");
    } catch (err) {
      siteInfo.showAlert("Failed to send password reset email.", "error");
      console.error(err);
    }
    setLoading(false);
  };

  if (user.loaded && !user.loggedIn) return <Navigate to="/play" />;
  if (!settingsLoaded || !accountsLoaded || !user.loaded)
    return <NewLoading small />;

  return (
    <Paper
      className="settings"
      sx={{
        p: 1,
      }}
    >
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Accessibility</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: 1 / 2 }}>
            <FormControl variant="standard" sx={{ minWidth: 240 }} size="small">
              <InputLabel>Accessibility Theme</InputLabel>
              <Select
                value={accessibilityTheme}
                onChange={handleAccessibilityThemeChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={"Higher Contrast"}>Higher Contrast</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Site</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: 1 / 2 }}>
            <Form
              fields={siteFields}
              deps={{ user }}
              onChange={(action) => onSettingChange(action, updateSiteFields)}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Profile</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: 1 / 2 }}>
            <Form
              fields={profileFields}
              deps={{
                name: user.name,
                pronouns: user.pronouns,
                user,
                accounts,
                siteInfo,
                errorAlert,
              }}
              onChange={(action) =>
                onSettingChange(action, updateProfileFields)
              }
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Game</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: 1 / 2 }}>
            <Form
              fields={gameFields}
              deps={{ user, siteInfo, errorAlert }}
              onChange={(action) => onSettingChange(action, updateGameFields)}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Account</Typography>
        </AccordionSummary>
        <Box sx={{ width: "50%", mx: "auto" }}>
          <AccordionDetails>
            <div className="accounts-row">
              <div className="accounts-column">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <TextField
                    sx={{ minWidth: "240px" }}
                    label="Email Address"
                    value={emailForPasswordReset}
                    onChange={(e) => setEmailForPasswordReset(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    sx={{ minWidth: "240px" }}
                    onClick={handlePasswordReset}
                    disabled={loading || !emailForPasswordReset}
                  >
                    Reset Password
                  </Button>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-evenly",
                    mt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    sx={{ minWidth: "120px" }}
                    onClick={onLogoutClick}
                  >
                    Sign Out
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ minWidth: "120px" }}
                    onClick={onDeleteClick}
                  >
                    Delete Account
                  </Button>
                </Box>
              </div>
            </div>
          </AccordionDetails>
        </Box>
      </Accordion>
    </Paper>
  );

  function onSettingChange(action, update) {
    if (action.prop === "value" && !action.localOnly) {
      axios
        .post("/api/user/settings/update", {
          prop: action.ref,
          value: action.value,
        })
        .then(() => user.updateSetting(action.ref, action.value))
        .catch(errorAlert);
    }
    update(action);
  }

  function onBirthdaySave(date, deps) {
    axios
      .post("/api/user/birthday", { date })
      .then((res) => {
        deps.siteInfo.showAlert("Birthday set", "success");

        deps.user.set(
          update(deps.user, {
            birthday: { $set: date },
            bdayChanged: { $set: true },
          })
        );
      })
      .catch(deps.errorAlert);
  }

  function onUsernameSave(name, deps) {
    var code = "";

    axios
      .post("/api/user/name", { name, code })
      .then((res) => {
        deps.siteInfo.showAlert("Username changed", "success");

        deps.user.set(
          update(deps.user, {
            name: { $set: name },
            itemsOwned: {
              nameChange: {
                $set: deps.user.itemsOwned.nameChange - 1,
              },
            },
          })
        );
      })
      .catch(deps.errorAlert);
  }

  function onPronounsSave(pronouns, deps) {
    axios
      .post("/api/user/pronouns", { pronouns })
      .then((res) => {
        deps.siteInfo.showAlert("Pronouns changed", "success");

        deps.user.set(
          update(deps.user, {
            pronouns: { $set: pronouns },
          })
        );
      })
      .catch(deps.errorAlert);
  }

  function onMediaSave(link, deps) {
    axios
      .post("/api/user/youtube", { link })
      .then((res) => {
        deps.siteInfo.showAlert("Profile media changed", "success");

        deps.user.set(
          update(deps.user, {
            youtube: { $set: link },
          })
        );
      })
      .catch(deps.errorAlert);
  }

  function onCustomDeathMessageSave(deathMessage, deps) {
    axios
      .post("/api/user/deathMessage", { deathMessage })
      .then((res) => {
        deps.siteInfo.showAlert("Death message changed", "success");

        deps.user.set(
          update(deps.user, {
            deathMessage: { $set: deathMessage },
          })
        );
      })
      .catch(deps.errorAlert);
  }

  function onVanityUrlSave(vanityUrl, deps) {
    axios
      .post("/api/vanityUrl", { vanityUrl })
      .then((res) => {
        deps.siteInfo.showAlert("Vanity URL changed", "success");

        deps.user.set(
          update(deps.user, {
            settings: {
              vanityUrl: { $set: vanityUrl },
            },
          })
        );
      })
      .catch(deps.errorAlert);
  }

  function onVanityUrlClear(deps) {
    if (!window.confirm("Are you sure you want to clear your vanity URL?")) {
      return;
    }

    axios
      .delete("/api/vanityUrl")
      .then((res) => {
        deps.siteInfo.showAlert("Vanity URL cleared", "success");

        deps.user.set(
          update(deps.user, {
            settings: {
              vanityUrl: { $set: undefined },
            },
          })
        );

        // Update the form field to empty
        updateProfileFields({
          ref: "vanityUrl",
          prop: "value",
          value: "",
        });
      })
      .catch(deps.errorAlert);
  }

  function onCustomEmoteUpload(
    emoteText,
    imageFilename,
    imageMimeType,
    blob,
    deps
  ) {
    const formData = new FormData();
    const file = new File([blob], imageFilename);
    formData.append("file", file);
    formData.append("emoteText", emoteText);

    axios
      .post("/api/user/customEmote/create", formData, {})
      .then((res) => {
        deps.siteInfo.showAlert("Uploaded custom emote", "success");
      })
      .catch(deps.errorAlert);
  }

  function onCustomEmoteDelete(id, deps) {
    axios
      .post("/api/user/customEmote/delete", { id: id }, {})
      .then((res) => {
        deps.siteInfo.showAlert("Deleted custom emote", "success");
      })
      .catch(deps.errorAlert);
  }

  function onLogoutClick() {
    axios
      .post("/api/user/logout")
      .then(() => {
        user.clear();
        setCaptchaVisible(true);
        navigate("/");
        window.location.reload();
      })
      .catch(errorAlert);
  }

  function onDeleteClick() {
    if (window.confirm("Are you sure you wish to **DELETE** your account?")) {
      axios
        .post("/api/user/delete")
        .then(() => {
          user.clear();
          navigate("/");
        })
        .catch(errorAlert);
    }
  }
}
