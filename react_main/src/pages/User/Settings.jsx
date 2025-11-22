import React, { useState, useEffect, useContext } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import {
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
  ButtonGroup,
  Stack,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import { UserContext, SiteInfoContext } from "Contexts";
import Form, { useForm, HiddenUpload } from "components/Form";
import { useErrorAlert } from "components/Alerts";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

import "css/settings.css";
import { setCaptchaVisible } from "utils";
import { NewLoading } from "../Welcome/NewLoading";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

function SettingsSection({ sections, activeSection }) {
  const isPhoneDevice = useIsPhoneDevice();
  return (
    <Stack direction="column" spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tabs value={activeSection.path} aria-label="Settings Sections">
          {sections.map((section) => (
            <Tab
              label={section.title}
              key={section.path}
              value={section.path}
              color="inherit"
              component={Link}
              to={`../${section.path}`}
              endIcon={<i className="fas fa-chevron-right" />}
              sx={{
                minWidth: isPhoneDevice ? 0 : undefined,
              }}
            />
          ))}
        </Tabs>
      </Stack>
      <Box
        sx={{
          maxWidth: isPhoneDevice ? undefined : "50%",
        }}
      >
        {activeSection.content}
      </Box>
    </Stack>
  );
}

export default function Settings() {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accounts, setAccounts] = useState({});
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
      groupName: "Censors",
      showIf: "!disableAllCensors",
    },
    {
      label: "Disable All Censors",
      ref: "disableAllCensors",
      type: "boolean",
      groupName: "Censors",
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
      groupName: "Appearance",
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
      label: "Font size",
      ref: "fontSize",
      type: "select",
      groupName: "Appearance",
      options: [
        {
          label: "System",
          value: "system",
        },
        {
          label: "16 pixels",
          value: "16",
        },
        {
          label: "18 pixels",
          value: "18",
        },
        {
          label: "20 pixels",
          value: "20",
        },
        {
          label: "24 pixels",
          value: "24",
        },
      ],
      value: mode,
    },
    {
      label: "Custom Site Primary Color",
      ref: "customPrimaryColor",
      type: "color",
      groupName: "Appearance",
      default: "none",
      disabled: (deps) => !deps.user.itemsOwned.customPrimaryColor,
    },
    {
      label: "Icon Filter",
      ref: "iconFilter",
      type: "select",
      groupName: "Appearance",
      options: [
        {
          label: "None",
          value: "none",
        },
        {
          label: "High Contrast",
          value: "highContrast",
        },
        {
          label: "Elevated",
          value: "elevated",
        },
        {
          label: "Sepia",
          value: "sepia",
        },
        {
          label: "Green",
          value: "green",
        },
        {
          label: "Inverted",
          value: "inverted",
        },
        {
          label: "Grayscale",
          value: "grayscale",
        },
        {
          label: "Colorful",
          value: "colorful",
        },
        {
          label: "Upside Down",
          value: "upsideDown",
        },
        {
          label: "Hallucination",
          value: "hallucination",
        },
        {
          label: "Chromatic Aberration",
          value: "chromaticAberration",
        },
        {
          label: "Vaporwave",
          value: "vaporwave",
        },
      ],
      disabled: (deps) => !deps.user.itemsOwned.iconFilter,
    },
    {
      label: "Experimental High DPI Correction",
      ref: "expHighDpiCorrection",
      type: "boolean",
      groupName: "Appearance",
    },
  ]);

  const [profileFields, updateProfileFields] = useForm(
    [
      {
        label: "Name",
        ref: "username",
        type: "text",
        saveBtn: "Save",
        saveBtnDiffer: "name",
        saveBtnOnClick: onUsernameSave,
        confirm: "Are you sure you wish to change your username?",
      },
      {
        label: "Pronouns",
        ref: "pronouns",
        type: "text",
        saveBtn: "Save",
        saveBtnDiffer: "pronouns",
        saveBtnOnClick: onPronounsSave,
      },
      {
        label: "Birthday",
        ref: "birthday",
        type: "date",
        saveBtn: "Save",
        saveBtnDiffer: "bdayChanged",
        default: Date.now(),
        saveBtnOnClick: onBirthdaySave,
        clearBtn: "Clear",
        clearBtnOnClick: onBirthdayClear,
        confirm: "Are you sure you wish to change your birthday?",
        extraInfo:
          "Other users will know when it's your birthday because your text will be rainbow colored.",
      },
      {
        label: "Background Color",
        ref: "backgroundColor",
        type: "color",
        groupName: "Profile",
        default: "#535353",
        disabled: (deps) => !deps.user.itemsOwned.customProfile,
      },
      {
        label: "Media URL",
        ref: "youtube",
        type: "text",
        groupName: "Profile",
        saveBtn: "Save",
        saveBtnDiffer: "youtube",
        saveBtnOnClick: onMediaSave,
        default: "",
        extraInfo:
          "Supports YouTube, SoundCloud, Spotify, Vimeo, Invidious, and direct media files (mp3, mp4, webm, ogg)",
      },
      {
        label: "Autoplay Media",
        ref: "autoplay",
        type: "boolean",
        groupName: "Profile",
        showIf: (deps) => deps.user.settings.youtube != null,
      },
      {
        label: "Banner Format",
        ref: "bannerFormat",
        type: "select",
        groupName: "Profile",
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
        groupName: "Profile",
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
        label: "Vanity URL",
        ref: "vanityUrl",
        type: "text",
        groupName: "Profile",
        saveBtn: "Save",
        saveBtnDiffer: "vanityUrl",
        saveBtnOnClick: onVanityUrlSave,
        clearBtn: "Clear",
        clearBtnOnClick: onVanityUrlClear,
        disabled: (deps) => !deps.user.itemsOwned.vanityUrl,
        extraInfo:
          "Set a custom URL for your profile (1-20 characters, letters, numbers, and hyphens only)",
      },
      {
        label: "Upload Profile Background",
        ref: "profileBackgroundUpload",
        type: "custom",
        groupName: "Profile",
        showIf: (deps) =>
          deps.user.itemsOwned && deps.user.itemsOwned.profileBackground,
        extraInfo:
          "Upload a custom background image to replace the default diamond pattern on your profile page (max 5 MB)",
        render: (deps) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <HiddenUpload
              name="profileBackground"
              onClick={deps.onProfileBackgroundEdit}
              onFileUpload={deps.onProfileBackgroundUpload}
            >
              <Button variant="outlined">Upload Background Image</Button>
            </HiddenUpload>
            {deps.user.profileBackground && (
              <>
                <Typography variant="caption" sx={{ color: "success.main" }}>
                  Background uploaded
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={deps.onProfileBackgroundRemove}
                >
                  Remove
                </Button>
              </>
            )}
          </Stack>
        ),
      },
      {
        label: "Background Display Mode",
        ref: "backgroundRepeatMode",
        type: "select",
        groupName: "Profile",
        options: [
          {
            label: "Checker",
            value: "checker",
          },
          {
            label: "Stretch",
            value: "stretch",
          },
        ],
        showIf: (deps) =>
          deps.user.itemsOwned && deps.user.itemsOwned.profileBackground,
        default: "checker",
        extraInfo:
          "Choose how the background image should be displayed: Checker (pattern) or Stretch (full screen)",
      },
      {
        label: "Hide Statistics",
        ref: "hideStatistics",
        type: "boolean",
        groupName: "Stat Hiding",
      },
      {
        label: "Hide Karma",
        ref: "hideKarma",
        type: "boolean",
        groupName: "Stat Hiding",
      },
      {
        label: "Hide Misfortune",
        ref: "hidePointsNegative",
        type: "boolean",
        groupName: "Stat Hiding",
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
      label: "Disable Protips",
      ref: "disableProTips",
      type: "boolean",
    },
    {
      label: "Death Message (max 150 chars)",
      ref: "deathMessage",
      type: "text",
      textStyle: "large",
      saveBtn: "Save",
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

  const sections = [
    {
      title: "Site",
      path: "site",
      content: (
        <Form
          fields={siteFields}
          deps={{ user }}
          onChange={(action) => onSettingChange(action, updateSiteFields)}
        />
      ),
    },
    {
      title: "User",
      path: "profile",
      content: (
        <>
          <Form
            fields={profileFields}
            deps={{
              name: user.name,
              pronouns: user.pronouns,
              youtube: user.settings.youtube,
              vanityUrl: user.settings.vanityUrl,
              backgroundRepeatMode:
                user.settings.backgroundRepeatMode || "repeat",
              user,
              accounts,
              siteInfo,
              errorAlert,
              onProfileBackgroundEdit,
              onProfileBackgroundUpload,
              onProfileBackgroundRemove,
            }}
            onChange={(action) => onSettingChange(action, updateProfileFields)}
          />
        </>
      ),
    },
    {
      title: "Game",
      path: "game",
      content: (
        <Form
          fields={gameFields}
          deps={{
            deathMessage: user.settings.deathMessage,
            user,
            siteInfo,
            errorAlert,
          }}
          onChange={(action) => onSettingChange(action, updateGameFields)}
        />
      ),
    },
    {
      title: "Account",
      path: "account",
      content: (
        <Stack direction="column" spacing={1}>
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
          <Button
            variant="outlined"
            sx={{ minWidth: "120px" }}
            onClick={onDeleteClick}
            startIcon={
              <i className="fas fa-exclamation-triangle" aria-hidden="true" />
            }
            endIcon={
              <i className="fas fa-exclamation-triangle" aria-hidden="true" />
            }
          >
            Delete Account
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Routes>
        {sections.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={
              <SettingsSection sections={sections} activeSection={section} />
            }
          />
        ))}
        <Route path="*" element={<Navigate to={sections[0].path} />} />
      </Routes>
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

  function onBirthdayClear(deps) {
    if (!window.confirm("Are you sure you want to clear your birthday?")) {
      return;
    }

    axios
      .delete("/api/user/birthday")
      .then((res) => {
        deps.siteInfo.showAlert("Birthday cleared", "success");

        deps.user.set(
          update(deps.user, {
            birthday: { $set: undefined },
            bdayChanged: { $set: false },
          })
        );

        // Update the form field to empty
        updateProfileFields({
          ref: "birthday",
          prop: "value",
          value: undefined,
          localOnly: true,
        });
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

  function onProfileBackgroundEdit(files, type) {
    if (!user.itemsOwned || !user.itemsOwned.profileBackground) {
      errorAlert(
        "You must purchase Profile Background with coins from the Shop."
      );
      return false;
    }

    return true;
  }

  function onProfileBackgroundRemove() {
    if (
      !window.confirm(
        "Are you sure you wish to remove your profile background?"
      )
    ) {
      return;
    }

    axios
      .delete("/api/user/profileBackground")
      .then(() => {
        siteInfo.showAlert("Profile background removed", "success");
        siteInfo.clearCache();
        window.location.reload();
      })
      .catch(errorAlert);
  }

  function onProfileBackgroundUpload(files, type) {
    if (!files.length) return;

    if (!user.itemsOwned || !user.itemsOwned.profileBackground) {
      errorAlert(
        "You must purchase Profile Background with coins from the Shop."
      );
      return;
    }

    const formData = new FormData();
    formData.append("image", files[0]);

    for (let el of document.getElementsByClassName("hidden-upload"))
      el.value = "";

    axios
      .post(`/api/user/${type}`, formData)
      .then((res) => {
        siteInfo.showAlert("Profile background uploaded", "success");

        // Update user state to reflect the uploaded background
        user.set(
          update(user.state, {
            profileBackground: { $set: true },
          })
        );

        siteInfo.clearCache();
        // Refresh the page to show the new background
        window.location.reload();
      })
      .catch((e) => {
        if (e.response == null || e.response.status === 413)
          errorAlert("File too large, must be less than 5 MB.");
        else errorAlert(e);
      });
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
