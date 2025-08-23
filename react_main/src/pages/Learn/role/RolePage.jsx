import React, { useState, useEffect, useContext } from "react";
import {
  Route,
  Switch,
  Redirect,
  useParams,
  useHistory,
  Link,
} from "react-router-dom";
import { NameWithAvatar } from "../../User/User";
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
  Stack,
} from "@mui/material";

import Form, { useForm } from "../../../components/Form";
import axios from "axios";

import { UserContext, SiteInfoContext } from "../../../Contexts";
import Comments from "../../Community/Comments";

import "css/setupPage.css";

import { useErrorAlert } from "../../../components/Alerts";
import { NewLoading } from "../../Welcome/NewLoading";
import { RoleCount } from "../../../components/Roles";

export default function RolePage() {
  return (
    <>
      <div className="inner-content">
        <Switch>
          <Route
            exact
            path="/learn/role/:RoleName"
            render={() => <RoleThings />}
          />
        </Switch>
      </div>
    </>
  );
}

export function RoleThings() {
  const { RoleName } = useParams();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [achievements, setAchievements] = useState(null);
  const [tempSkins, setTempSkins] = useState([
    { label: "Vivid", value: "vivid" },
  ]);
  const [siteFields, updateSiteFields] = useForm([
    {
      label: "Role Skin",
      ref: "roleSkins",
      type: "select",
      options: [{ label: "Vivid", value: "vivid" }],
    },
  ]);

  const role =
    RoleName && siteInfo.rolesRaw?.["Mafia"]?.[RoleName]
      ? [RoleName, siteInfo.rolesRaw["Mafia"][RoleName]]
      : null;

  useEffect(() => {
    document.title = "Contributors | UltiMafia";

    axios
      .get("/api/site/contributors")
      .then((res) => {
        setContributors(res.data);
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(true);
        errorAlert(e);
      });
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    axios
      .get(`/api/user/${user.id}/profile`)
      .then((res) => setAchievements(res.data.achievements))
      .catch((e) => {
        errorAlert(e);
        history.push("/play");
      });
  }, [user?.id]);

  useEffect(() => {
    if (!role || !achievements) return;

    const skins = role[1].skins || [];
    const filtered = skins.filter((skin) => {
      if (skin.value === "vivid") return false;
      if (!skin.achCount && !skin.achReq) return true;
      if (skin.achReq && achievements.includes(skin.achReq)) return true;
      if (skin.achCount && parseInt(skin.achCount) <= achievements.length)
        return true;
      return false;
    });

    const finalOptions = [
      { label: "Vivid", value: "vivid" },
      ...filtered.map((skin) => ({
        label: skin.label || skin.value,
        value: skin.value,
      })),
    ];

    setTempSkins(finalOptions);
    updateSiteFields([
      {
        ref: "roleSkins",
        prop: "options",
        value: finalOptions,
      },
    ]);
  }, [achievements, role]);
  /*
  const updateFieldsFromData = (data) => {
    let changes = Object.keys(data).map((ref) => ({
      ref,
      prop: "value",
      value: data[ref],
    }));
    updateSiteFields(changes);
  };
  */
  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;
  // TODO if setupId not set, redirect to a setup page

  if (!role || !user.loaded) return <NewLoading small />;

  let commentLocation = `role/${RoleName}`;
  let temproleSkins;
  if (user.settings.roleSkins) {
    temproleSkins = user.settings.roleSkins.split(",");
  } else {
    temproleSkins = null;
  }

  const roleSkins = temproleSkins;

  let tempArtists = contributors["art"]?.filter(
    (item, index) =>
      item.roles.filter((r) => r.split(":") == RoleName).length > 0
  );
  const artists = tempArtists.map((item, index) => {
    return (
      <div>
        {
          <NameWithAvatar
            small
            id={item.user.id}
            name={item.user.name}
            avatar={item.user.avatar}
          />
        }{" "}
        {item.roles
          .filter((r) => r.split(":") == RoleName)
          .map((roleToUse) => (
            <RoleCount
              key={0}
              scheme={roleToUse.split(":")[1]}
              role={roleToUse.split(":")[0]}
              gameType={"Mafia"}
            />
          ))}
      </div>
    );
  });

  // favourites <SetupRowInfo title="Current Skins" content={roleSkins} />

  // TODO add button to host it

  return (
    <Stack direction="column" spacing={1}>
      <RoleCount key={0} scheme="vivid" role={role[0]} gameType={"Mafia"} />
      <div className="setup-page">
        <div className="span-panel main">
          <div className="heading">Role Info</div>
          <div className="meta">
            <SetupRowInfo title="Name" content={RoleName} />
            <SetupRowInfo
              title="Tags"
              content={role[1].tags.sort().join(", ")}
            />
            <Form
              fields={siteFields}
              deps={{ user }}
              onChange={(action) =>
                onRoleSkinChange(action, RoleName, null, user, roleSkins)
              }
            />
            {artists}
          </div>
        </div>
      </div>
      <Comments location={commentLocation} />
    </Stack>
  );
}

function SetupRowInfo(props) {
  return (
    <div className="setup-row-info">
      <div className="title">{props.title}</div>
      <div className="content">{props.content}</div>
    </div>
  );
}

function onRoleSkinChange(action, role, update, user, roleSkins) {
  if (action.prop === "value" && !action.localOnly) {
    let roleformated = `${role}:${action.value}`;
    if (roleSkins == null) {
      roleSkins = [];
    }
    let array = roleSkins.filter((s) => s);
    let temp = roleSkins.filter((s) => s.split(":")[0] == role);
    if (temp.length > 0) {
      let index = roleSkins.indexOf(temp[0]);
      array[index] = roleformated;
    } else {
      array = array.concat([roleformated]);
    }
    let strArray = array.join(",");
    axios
      .post("/api/user/settings/update", {
        prop: action.ref,
        value: strArray,
      })
      .then(() => user.updateSetting(action.ref, strArray));
  }
  //update(action);

  /*
   role.skin = selection;
        await models.User.updateOne(
           { id: user.id },
          {
            $set: {
              roleSkins: user.roleSkins,
            },
          }
        ).exec();
*/
}
