import React, { useState, useEffect, useContext } from "react";
import { Redirect, useHistory } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import { UserContext, SiteInfoContext } from "../../Contexts";
import Form, { useForm } from "../../components/Form";
import { useErrorAlert } from "../../components/Alerts";

import "../../css/settings.css";
import { setCaptchaVisible } from "../../utils";
import { NewLoading } from "../Welcome/NewLoading";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

export default function Settings() {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accounts, setAccounts] = useState({});
  const history = useHistory();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [accessibilityTheme, setAccessibilityTheme] = useState(
    user?.settings?.accessibilityTheme ?? ""
  );

  const [siteFields, updateSiteFields] = useForm([
    {
      label: "Referral URL",
      ref: "referralURL",
      type: "text",
      value: (deps) =>
        `${process.env.REACT_APP_URL}/auth/login?ref=${deps.user.id}`,
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
      label: "Role Icon Scheme",
      ref: "roleIconScheme",
      type: "select",
      options: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    {
      label: "Site Color Scheme",
      ref: "siteColorScheme",
      type: "select",
      options: [
        {
          label: "Light",
          value: "light",
        },
        {
          label: "Dark",
          value: "dark",
        },
      ],
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
        label: "Show Discord",
        ref: "showDiscord",
        type: "boolean",
        showIf: (deps) => deps.accounts.discord && deps.accounts.discord.id,
      },
      {
        label: "Show Twitch",
        ref: "showTwitch",
        type: "boolean",
        showIf: (deps) => deps.accounts.twitch && deps.accounts.twitch.id,
      },
      // {
      // 	label: "Show Google",
      // 	ref: "showGoogle",
      // 	type: "boolean",
      // 	showIf: (deps) => deps.accounts.google && deps.accounts.google.id
      // },
      {
        label: "Show Steam",
        ref: "showSteam",
        type: "boolean",
        showIf: (deps) => deps.accounts.steam && deps.accounts.steam.id,
      },
      {
        label: "Background Color",
        ref: "backgroundColor",
        type: "color",
        default: "#535353",
        disabled: (deps) => !deps.user.itemsOwned.customProfile,
      },
      {
        label: "Media video",
        ref: "youtube",
        type: "text",
        saveBtn: "Change",
        saveBtnDiffer: "youtube",
        saveBtnOnClick: onYoutubeSave,
        default: "",
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
        label: "Hide Statistics",
        ref: "hideStatistics",
        type: "boolean",
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
        "Note: You may only use colors with nice contrast. (dark text on the dark background won't do)",
    },
    {
      label: "Text Color",
      ref: "textColor",
      type: "color",
      default: "#FFF",
      disabled: (deps) => !deps.user.itemsOwned.textColors,
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
  ]);

  useEffect(() => {
    document.title = "Settings | UltiMafia";
  }, []);

  useEffect(() => {
    if (user.loaded && user.loggedIn) {
      if (!settingsLoaded) {
        axios
          .get("/user/settings/data")
          .then((res) => {
            let siteFormFieldChanges = [];
            let profileFormFieldChanges = [];
            let gameFormFieldChanges = [];

            for (let ref in res.data) {
              if (!res.data[ref]) continue;

              siteFormFieldChanges.push({
                ref: ref,
                prop: "value",
                value: res.data[ref],
              });
              profileFormFieldChanges.push({
                ref: ref,
                prop: "value",
                value: res.data[ref],
              });
              gameFormFieldChanges.push({
                ref: ref,
                prop: "value",
                value: res.data[ref],
              });
            }

            updateSiteFields(siteFormFieldChanges);
            updateProfileFields(profileFormFieldChanges);
            updateGameFields(gameFormFieldChanges);
            setSettingsLoaded(true);
          })
          .catch(errorAlert);
      }

      if (!accountsLoaded) {
        axios
          .get("/user/accounts")
          .then((res) => {
            setAccounts(res.data);
            setAccountsLoaded(true);
          })
          .catch(errorAlert);
      }
    }
  }, [user]);

  function onSettingChange(action, update) {
    if (action.prop === "value" && !action.localOnly) {
      axios
        .post("/user/settings/update", {
          prop: action.ref,
          value: action.value,
        })
        .then(() => {
          user.updateSetting(action.ref, action.value);
        })
        .catch(errorAlert);
    }

    update(action);
  }

  function onBirthdaySave(date, deps) {
    axios
      .post("/user/birthday", { date })
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
      .post("/user/name", { name, code })
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

  function onYoutubeSave(link, deps) {
    axios
      .post("/user/youtube", { link })
      .then((res) => {
        deps.siteInfo.showAlert("Profile video changed", "success");

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
      .post("/user/deathMessage", { deathMessage })
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

  function onLogoutClick() {
    axios
      .post("/user/logout")
      .then((res) => {
        user.clear();
        setCaptchaVisible(true);
        history.push("/");
        window.location.reload();
      })
      .catch(errorAlert);
  }

  function onDeleteClick() {
    const shouldDelete = window.confirm(
      "Are you sure you wish to delete your account? This is irreversible."
    );

    if (!shouldDelete) return;

    axios
      .post("/user/delete")
      .then((res) => {
        user.clear();
        history.push("/");
      })
      .catch(errorAlert);
  }

  const handleAccessibilityThemeChange = async (e) => {
    const value = e.target.value;
    try {
      await axios.post("/user/settings/update", {
        prop: "accessibilityTheme",
        value,
      });
      user.updateSetting("accessibilityTheme", value);
    } catch (err) {
      console.log(err);
      errorAlert();
    }
    setAccessibilityTheme(e.target.value);
  };

  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;

  if (!settingsLoaded || !accountsLoaded || !user.loaded)
    return <NewLoading small />;

  return (
    <>
      <div className="span-panel main settings">
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Accessibility</Typography>
          <FormControl variant="standard" sx={{ minWidth: 240 }} size="small">
            <InputLabel>Accessiblity theme</InputLabel>
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

        <div className="heading">Site</div>
        <Form
          fields={siteFields}
          deps={{ user }}
          onChange={(action) => onSettingChange(action, updateSiteFields)}
        />
        <div className="heading">Profile</div>
        <Form
          fields={profileFields}
          deps={{ name: user.name, user, accounts, siteInfo, errorAlert }}
          onChange={(action) => onSettingChange(action, updateProfileFields)}
        />
        <div className="heading">Game</div>
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
        <div className="heading">Accounts</div>
        <div className="accounts-row">
          <div className="accounts-column">
            <div className="btn btn-theme-sec logout" onClick={onLogoutClick}>
              Sign Out
            </div>
            <div className="btn delete-account" onClick={onDeleteClick}>
              Delete Account
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
