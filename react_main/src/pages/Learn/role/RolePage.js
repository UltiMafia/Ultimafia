import React, { useState, useEffect, useContext } from "react";
import {
  Route,
  Switch,
  Redirect,
  useParams,
  useHistory,
  Link,
} from "react-router-dom";
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

import "../../../css/setupPage.css";

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
  const [setup, setSetup] = useState();
  const user = useContext(UserContext);
  const [achievements, setAchievements] = useState([]);
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { RoleName } = useParams();
  const [gameType, setGameType] = useState("");
  const [diff, setDiff] = useState([]); // Changelog diff

      axios
        .get(`/user/${user.id}/profile`)
        .then((res) => {
          setAchievements(res.data.achievements);
        })
        .catch((e) => {
          errorAlert(e);
          history.push("/play");
        });



let role = [RoleName, siteInfo.rolesRaw["Mafia"][RoleName]];
let tempSkins = [
        {
          label: "Vivid",
          value: "vivid",
        },
      ];
      /*
if(role[1].skins){
//role[1].skins = role[1].skins.filter((s)=> (s.achCount ? parseInt(s.achCount) <= achCount : true) && (s.achReq ? achievements.includes(s.achReq) : true));
//role[1].skins = role[1].skins.filter((s)=> (s.achReq != null ? achievements.includes(s.achReq) : true));


}
*/
for(let skin of role[1].skins){
  if(skin.value == "vivid"){
    continue;
  }
  if(skin.achCount == null && skin.achReq == null ){
    tempSkins.push(skin);
  }
  else if(skin.achReq == null){
    if(parseInt(skin.achCount) <= achievements.length){
      tempSkins.push(skin);
    }
  }
  else if(achievements.includes(skin.achReq)){
      tempSkins.push(skin);
    }
}

    let [siteFields, updateSiteFields] = useForm([
    {
      label: "Role Skin",
      ref: "roleSkins",
      type: "select",
      options: tempSkins,
    },
  ]);

  const updateFieldsFromData = (data) => {
    let changes = Object.keys(data).map((ref) => ({
      ref,
      prop: "value",
      value: data[ref],
    }));
    updateSiteFields(changes);
  };
  
  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;
  // TODO if setupId not set, redirect to a setup page

  if (!role || !user.loaded) return <NewLoading small />;

  let commentLocation = `role/${RoleName}`;
  let temproleSkins;
  if(user.settings.roleSkins){
    temproleSkins = user.settings.roleSkins.split(",");
}
else{
   temproleSkins = null;
}

  const roleSkins = temproleSkins;

  // favourites <SetupRowInfo title="Current Skins" content={roleSkins} />

  // TODO add button to host it
  
  return (
    <Stack direction="column" spacing={1}>
    <RoleCount
      key={0}
      scheme="vivid"
      role={role[0]}
      gameType={"Mafia"}
                />
      <div className="setup-page">
        <div className="span-panel main">
          <div className="heading">Role Info</div>
          <div className="meta">
            <SetupRowInfo title="Name" content={RoleName} />
            <SetupRowInfo title="Tags" content={role[1].tags.sort().join(", ")} />
            <SetupRowInfo title="Achievements" content={achievements.join(", ")} />
            <SetupRowInfo title="Achievements has mafia8" content={achievements.includes("Mafia8") ? "Yes" : "No"} />
            <SetupRowInfo title="Skins mapped to achReq" content={role[1].skins.map((s) => s.achReq)} />
              <Form
              fields={siteFields}
              deps={{ user }}
              onChange={(action) => onRoleSkinChange(action, RoleName, updateSiteFields, user, roleSkins)}
            />
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
    if(roleSkins == null){
      roleSkins = [];
    }
   let array = roleSkins.filter((s) => s);
  let temp = roleSkins.filter((s) => s.split(":")[0] == role);
   if(temp.length > 0){
     let index = roleSkins.indexOf(temp[0]);
     array[index] = roleformated;
   }
   else{
     array = array.concat([roleformated]);
   }
   let strArray = array.join(",");
      axios
        .post("/user/settings/update", {
          prop: action.ref,
          value: strArray,
        })
        .then(() => user.updateSetting(action.ref, strArray));
    }
    update(action);

   
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
