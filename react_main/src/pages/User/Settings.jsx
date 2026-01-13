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
import Form, { useForm, HiddenUpload, UserSearchSelect } from "components/Form";
import { useErrorAlert } from "components/Alerts";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import AvatarUpload from "components/AvatarUpload";

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
  const [familyName, setFamilyName] = useState("");
  const [familyAvatarUploaded, setFamilyAvatarUploaded] = useState(false);
  const [userFamily, setUserFamily] = useState(null);
  const [familyLoaded, setFamilyLoaded] = useState(false);
  const [transferLeaderUserId, setTransferLeaderUserId] = useState("");
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
    {
      label: "Disable Snowstorm",
      ref: "disableSnowstorm",
      type: "boolean",
      extraInfo: "Turn off the snow effect during December (holiday season)",
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
      if (!familyLoaded) loadFamily();
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

  const loadFamily = () => {
    axios
      .get("/api/family/user/family")
      .then((res) => {
        if (res.data.family) {
          setUserFamily(res.data.family);
          setFamilyLoaded(true);
        } else {
          setUserFamily(null);
          setFamilyLoaded(true);
        }
      })
      .catch(() => {
        setUserFamily(null);
        setFamilyLoaded(true);
      });
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
  if (!settingsLoaded || !accountsLoaded || !user.loaded || !familyLoaded)
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
    {
      title: "Family",
      path: "family",
      content: (
        <Stack direction="column" spacing={3}>
          {/* No Family Section */}
          {!userFamily && !user.itemsOwned?.createFamily && (
            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Family
              </Typography>
              <Typography>No family.</Typography>
            </Box>
          )}

          {/* Create Family Section */}
          {user.itemsOwned?.createFamily && (
            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Create Family
              </Typography>
              <Stack
                direction="column"
                spacing={2}
                sx={{
                  opacity: userFamily ? 0.5 : 1,
                  pointerEvents: userFamily ? "none" : "auto",
                }}
              >
                <TextField
                  label="Family Name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Enter family name"
                  sx={{ minWidth: "240px" }}
                  disabled={!!userFamily}
                  inputProps={{ maxLength: 20 }}
                  helperText={`${familyName.length}/20 characters`}
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography>Family Avatar:</Typography>
                  <AvatarUpload
                    onFileUpload={onFamilyAvatarUpload}
                    name="familyAvatar"
                  >
                    <Button variant="outlined" disabled={!!userFamily}>
                      Upload Avatar
                    </Button>
                  </AvatarUpload>
                  {familyAvatarUploaded && (
                    <Typography
                      variant="caption"
                      sx={{ color: "success.main" }}
                    >
                      Avatar uploaded
                    </Typography>
                  )}
                </Stack>
                <Button
                  variant="contained"
                  onClick={onCreateFamily}
                  disabled={!familyName.trim() || !!userFamily}
                  sx={{ minWidth: "240px" }}
                >
                  Create Family
                </Button>
              </Stack>
            </Box>
          )}

          {/* Manage Family Section - Leader */}
          {userFamily && userFamily.isLeader && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h4" sx={{ mb: 2 }}>
                Manage Family
              </Typography>
              <Stack direction="column" spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography>You are the leader of </Typography>
                  {userFamily.avatar && (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundImage: `url(/uploads/${userFamily.id}_family_avatar.webp?t=${siteInfo.cacheVal})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Link
                    to={`/user/family/${userFamily.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: "bold",
                        color: "primary.main",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {userFamily.name}
                    </Typography>
                  </Link>
                </Stack>

                {/* Upload Family Avatar */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Family Avatar
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <AvatarUpload
                      onFileUpload={onFamilyAvatarUploadExisting}
                      name="familyAvatarExisting"
                    >
                      <Button variant="outlined">Upload New Avatar</Button>
                    </AvatarUpload>
                    {userFamily.avatar && (
                      <Typography
                        variant="caption"
                        sx={{ color: "success.main" }}
                      >
                        Avatar uploaded
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* Upload Family Background */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Family Background
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ mb: 1, display: "block" }}
                  >
                    Upload a custom background image to replace the default
                    pattern on the family page (max 5 MB)
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <HiddenUpload
                      name="familyBackground"
                      onClick={onFamilyBackgroundEdit}
                      onFileUpload={onFamilyBackgroundUpload}
                    >
                      <Button variant="outlined">
                        Upload Background Image
                      </Button>
                    </HiddenUpload>
                    {userFamily.background && (
                      <>
                        <Typography
                          variant="caption"
                          sx={{ color: "success.main" }}
                        >
                          Background uploaded
                        </Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={onFamilyBackgroundRemove}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>

                {/* Background Display Mode */}
                {userFamily.background && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Background Display Mode
                    </Typography>
                    <FormControl sx={{ minWidth: "240px" }}>
                      <InputLabel>Display Mode</InputLabel>
                      <Select
                        value={userFamily.backgroundRepeatMode || "checker"}
                        label="Display Mode"
                        onChange={(e) =>
                          onFamilyBackgroundRepeatModeChange(e.target.value)
                        }
                      >
                        <MenuItem value="checker">Checker</MenuItem>
                        <MenuItem value="stretch">Stretch</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Choose how the background image should be displayed:
                      Checker (pattern) or Stretch (full screen)
                    </Typography>
                  </Box>
                )}

                {/* Transfer Leadership */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Transfer Leadership
                  </Typography>
                  <Stack direction="column" spacing={2}>
                    <UserSearchSelect
                      placeholder="Search for a family member..."
                      onChange={(userId) => setTransferLeaderUserId(userId)}
                    />
                    <Button
                      variant="outlined"
                      onClick={onTransferLeadership}
                      disabled={!transferLeaderUserId}
                      sx={{ minWidth: "240px" }}
                    >
                      Transfer Leadership
                    </Button>
                  </Stack>
                </Box>

                {/* Delete Family */}
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={onDeleteFamily}
                    sx={{ minWidth: "240px" }}
                    startIcon={
                      <i
                        className="fas fa-exclamation-triangle"
                        aria-hidden="true"
                      />
                    }
                  >
                    Delete Family
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Manage Family Section - Member */}
          {userFamily && !userFamily.isLeader && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h4" sx={{ mb: 2 }}>
                Manage Family
              </Typography>
              <Stack direction="column" spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography>You are a member of </Typography>
                  {userFamily.avatar && (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundImage: `url(/uploads/${userFamily.id}_family_avatar.webp?t=${siteInfo.cacheVal})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Link
                    to={`/user/family/${userFamily.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: "bold",
                        color: "primary.main",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {userFamily.name}
                    </Typography>
                  </Link>
                </Stack>

                {/* Leave Family */}
                <Box>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={onLeaveFamily}
                    sx={{ minWidth: "240px" }}
                  >
                    Leave Family
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}
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
        <Route path="*" element={<Navigate to={sections[0].path} replace />} />
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

  function onFamilyAvatarUpload(files, type) {
    if (files.length) {
      const formData = new FormData();
      formData.append("image", files[0]);

      axios
        .post("/api/family/avatar", formData)
        .then(() => {
          setFamilyAvatarUploaded(true);
          siteInfo.showAlert("Family avatar uploaded", "success");
        })
        .catch((e) => {
          if (e.response == null || e.response.status === 413)
            errorAlert("File too large, must be less than 1 MB.");
          else errorAlert(e);
        });
    }
  }

  function onFamilyAvatarUploadExisting(files, type) {
    if (files.length) {
      const formData = new FormData();
      formData.append("image", files[0]);

      axios
        .post("/api/family/avatar", formData)
        .then(() => {
          siteInfo.showAlert("Family avatar uploaded", "success");
          loadFamily(); // Reload to update avatar status
        })
        .catch((e) => {
          if (e.response == null || e.response.status === 413)
            errorAlert("File too large, must be less than 1 MB.");
          else errorAlert(e);
        });
    }
  }

  function onCreateFamily() {
    if (!familyName.trim()) {
      siteInfo.showAlert("Please enter a family name", "error");
      return;
    }

    if (familyName.trim().length > 20) {
      siteInfo.showAlert("Family name must be 20 characters or less.", "error");
      return;
    }

    axios
      .post("/api/family/create", { name: familyName.trim() })
      .then((res) => {
        siteInfo.showAlert("Family created successfully!", "success");
        loadFamily(); // Reload family info
        navigate(`/user/family/${res.data.familyId}`);
      })
      .catch(errorAlert);
  }

  function onTransferLeadership() {
    if (!transferLeaderUserId) {
      siteInfo.showAlert("Please select a family member", "error");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to transfer leadership? You will lose the ability to manage the family."
      )
    ) {
      return;
    }

    axios
      .post(`/api/family/${userFamily.id}/transferLeadership`, {
        newLeaderId: transferLeaderUserId,
      })
      .then(() => {
        siteInfo.showAlert("Leadership transferred successfully", "success");
        setTransferLeaderUserId("");
        loadFamily(); // Reload to update family info
      })
      .catch(errorAlert);
  }

  function onDeleteFamily() {
    if (
      !window.confirm(
        "Are you sure you want to delete your family? This will remove all members and cannot be undone."
      )
    ) {
      return;
    }

    axios
      .delete(`/api/family/${userFamily.id}`)
      .then(() => {
        siteInfo.showAlert("Family deleted successfully", "success");
        setUserFamily(null);
        setFamilyName("");
        setFamilyAvatarUploaded(false);
        loadFamily(); // Reload to clear family info
      })
      .catch(errorAlert);
  }

  function onLeaveFamily() {
    if (
      !window.confirm(
        "Are you sure you want to leave this family? You will need to be re-invited to rejoin."
      )
    ) {
      return;
    }

    axios
      .post(`/api/family/${userFamily.id}/leave`)
      .then(() => {
        siteInfo.showAlert("You have left the family", "success");
        setUserFamily(null);
        setFamilyName("");
        setFamilyAvatarUploaded(false);
        loadFamily(); // Reload to clear family info
      })
      .catch(errorAlert);
  }

  function onFamilyBackgroundEdit(files, type) {
    // Always allow editing if user is a leader
    return true;
  }

  function onFamilyBackgroundRemove() {
    if (
      !window.confirm("Are you sure you wish to remove the family background?")
    ) {
      return;
    }

    axios
      .delete(`/api/family/${userFamily.id}/background`)
      .then(() => {
        siteInfo.showAlert("Family background removed", "success");
        siteInfo.clearCache();
        loadFamily(); // Reload to update background status
      })
      .catch(errorAlert);
  }

  function onFamilyBackgroundUpload(files, type) {
    if (!files.length) return;

    const formData = new FormData();
    formData.append("image", files[0]);

    for (let el of document.getElementsByClassName("hidden-upload"))
      el.value = "";

    axios
      .post(`/api/family/${userFamily.id}/background`, formData)
      .then(() => {
        siteInfo.showAlert("Family background uploaded", "success");
        siteInfo.clearCache();
        loadFamily(); // Reload to update background status
      })
      .catch((e) => {
        if (e.response == null || e.response.status === 413)
          errorAlert("File too large, must be less than 5 MB.");
        else errorAlert(e);
      });
  }

  function onFamilyBackgroundRepeatModeChange(mode) {
    axios
      .post(`/api/family/${userFamily.id}/backgroundRepeatMode`, {
        backgroundRepeatMode: mode,
      })
      .then(() => {
        siteInfo.showAlert("Background display mode updated", "success");
        loadFamily(); // Reload to update background repeat mode
      })
      .catch(errorAlert);
  }
}
