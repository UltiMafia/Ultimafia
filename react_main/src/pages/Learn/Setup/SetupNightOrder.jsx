import React, { useState, useEffect, useContext } from "react";
import {
  Route,
  Switch,
  Redirect,
  useParams,
  useHistory,
} from "react-router-dom";
import "../../../css/play.css";
import axios from "axios";
import { UserContext, SiteInfoContext } from "../../../Contexts";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { NewLoading } from "../../Welcome/NewLoading";
import { useErrorAlert } from "../../../components/Alerts";

//import { AchievementList } from "../../../../data/Achievements";
import Setup from "../../../components/Setup";
import { RoleCount } from "../../../components/Roles";
//import { RoleSearch } from "../../components/Roles";

export default function SetupsNightOrder() {
  return (
    <>
      <div className="inner-content">
        <Switch>
          <Route
            exact
            path= {`/learn/setup/:setupId/nightorder`}
            render={() => <NightOrder />}
          />
        </Switch>
      </div>
    </>
  );
}

export function NightOrder() {
  const [setup, setSetup] = useState();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { setupId } = useParams();
  const [gameType, setGameType] = useState("");
 // const [roleData, setRoleData] = useState(null);
  const theme = useTheme();

    useEffect(() => {
    if (setupId) {
      axios
        .get(`/setup/${setupId}`, { headers: { includeStats: true } })
        .then((res) => {
          let setup = res.data;
          setup.roles = JSON.parse(setup.roles);
          setSetup(res.data);
          setGameType(setup.gameType);

          document.title = `Setup | ${res.data.name} | UltiMafia`;

        })
        .catch((e) => {
          console.error(e);
          errorAlert(e);
        });
    }
  }, [setupId]);

    if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;
    // TODO if setupId not set, redirect to a setup page
  
    if (!setup || !user.loaded) return <NewLoading small />;

/*
  setRoleData(roleName, modifiers){
      ...siteInfo.rolesRaw[gameType][roleName],
      modifiers: siteInfo.modifiers[gameType].filter((m) =>
        modifiers?.split("/").includes(m.name)
      ),
    });
  }, [siteInfo, roleName]);
*/

  
  const roles = Object.keys(setup.roles[0]).map((key) => [key, siteInfo.rolesRaw[setup.gameType][key.split(":")[0]]]);
  const hasMafia = (roles.filter((r) => r[1].alignment == "Mafia").length > 0);
  const nightRoles = roles.filter((r) => r[1].nightOrder != null);
let nightActions = [];
//let hasMafia = false;
  for(let role of nightRoles){
    for(let item of role[1].nightOrder){
      nightActions.push([role[0], item]);
    }
  }

if(hasMafia == true){
  nightActions.push(["Mafia", ["Mafia Kill", -1]]);
}

  let min = 100;
  for(let j = 0; j < nightActions.length; j++){
    for(let u = 0; u < nightActions.length; u++){
      if(nightActions[u][1][1] > nightActions[j][1][1]){
        let temp = nightActions[j];
        nightActions[j] = nightActions[u];
        nightActions[u] = temp;
      }
    }
  }

  const commandTableRows = nightActions.map((key) => {
    

    return {
      roleIcon: (<RoleCount
                  key={0}
                  scheme="vivid"
                  role={key[0]}
                  gameType={"Mafia"}
                />),
      roleName: key[0],
      actionName: key[1][0],
      nightOrder: key[1][1],
    };
  });

  const commandTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Priority</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {commandTableRows.map((row) => (
            <TableRow
              key={row.name}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row" align="center">
                {row.roleIcon}{row.roleName}
              </TableCell>
              <TableCell align="center">{row.actionName}</TableCell>
              <TableCell align="center">{row.nightOrder}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Setup Night Order
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h6"> Order of how night actions occur</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Below is the Night Order.
          </Typography>
          <Box className="paragraph">{commandTable}</Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
