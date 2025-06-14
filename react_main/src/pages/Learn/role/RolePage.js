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
} from "@mui/material";

import Form, { useForm } from "../../components/Form";
import axios from "axios";

import { UserContext, SiteInfoContext } from "../../../Contexts";
import Comments from "../../Community/Comments";

import "../../../css/setupPage.css";

import { useErrorAlert } from "../../../components/Alerts";
import { NewLoading } from "../../Welcome/NewLoading";
import { Stack, Typography } from "@mui/material";

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
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { RoleName } = useParams();
  const [gameType, setGameType] = useState("");
  const [diff, setDiff] = useState([]); // Changelog diff
/*
  useEffect(() => {
    if (setupId) {
      axios
        .get(`/setup/${setupId}`, { headers: { includeStats: true } })
        .then((res) => {
          let setup = res.data;
          setup.roles = JSON.parse(setup.roles);
          setSetup(res.data);
          setGameType(setup.gameType);
          setCurrentVersionNum(setup.version);
          setSelectedVersionNum(setup.version);
          setVersionTimestamp(setup.setupVersion.timestamp);

          document.title = `Setup | ${res.data.name} | UltiMafia`;

          if (setup.gameType === "Mafia") {
            setPieData(
              getBasicPieStats(
                setup.stats.alignmentWinrate,
                setup.stats.roleWinrate,
                siteInfo.rolesRaw["Mafia"]
              )
            );

            const changelog = setup.setupVersion.changelog;
            if (changelog) {
              setDiff(JSON.parse(changelog));
            }
          }
        })
        .catch((e) => {
          console.error(e);
          errorAlert(e);
        });
    }
  }, [setupId]);
*/



let role = [RoleName, siteInfo.rolesRaw["Mafia"][RoleName]];


    const [siteFields, updateSiteFields] = useForm([
    {
      label: "Role Skin",
      ref: "roleIconScheme",
      type: "select",
      options: role[1].skins || [
        {
          label: "Vivid",
          value: "vivid",
        },
      ],
        /*
        [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
      */
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

  if (!setup || !user.loaded) return <NewLoading small />;

  let commentLocation = `role/${RoleName}`;

  // favourites

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
          <div className="heading">Setup Info</div>

          <div className="meta">
            <SetupRowInfo title="Name" content={RoleName} />
            //<SetupRowInfo title="Tags" content={role[1].tags} />
              <Form
              fields={siteFields}
              deps={{ user }}
              onChange={(action) => onSettingChange(action, updateSiteFields)}
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

 async function onRoleSkinChange(role, selection) {
      const user = useContext(UserContext);
   
   let roleformated = `${role}:${selection}`;
   
  let temp = user.roleSkins.filter((s) => s.split(":")[0] == role);
   if(temp.length > 0){
     let index = user.roleSkins.indexOf(temp[0]);
     user.roleSkins[index] = roleformated;
   }
   else{
     user.roleSkins.push(roleformated);
   }
   
   role.skin = selection;
        await models.User.updateOne(
           { id: user.id },
          {
            $set: {
              roleSkins: user.roleSkins,
            },
          }
        ).exec();

  }
