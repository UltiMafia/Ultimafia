import React from "react";
import "../../css/play.css";
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

//import { AchievementList } from "../../../../data/Achievements";
import Setup from "../../../components/Setup";
import { RoleSearch } from "../../components/Roles";

export default function Setups() {
  return (
    <>
      <div className="inner-content">
        <Switch>
          <Route
            exact
            path="/learn/setup/:setupId/nightorder"
            render={() => <NightOrder />}
          />
        </Switch>
      </div>
    </>
  );
}

export default function NightOrder(props) {
  const [setup, setSetup] = useState();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { setupId } = useParams();
  const [gameType, setGameType] = useState("");
  const [roleData, setRoleData] = useState(null);
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

          document.title = `Setup Night Order | ${res.data.name} | UltiMafia`;

        })
        .catch((e) => {
          console.error(e);
          errorAlert(e);
        });
    }
  }, [setupId]);

/*
  setRoleData(roleName, modifiers){
      ...siteInfo.rolesRaw[gameType][roleName],
      modifiers: siteInfo.modifiers[gameType].filter((m) =>
        modifiers?.split("/").includes(m.name)
      ),
    });
  }, [siteInfo, roleName]);
*/
  const roles = Object.keys(setup.roles).map((key) => ...siteInfo.rolesRaw[gameType][key.split(":")[0]], modifiers: siteInfo.modifiers[gameType].filter((m) =>modifiers?.split("/").includes(m.name)));
  const nightRoles = roles.filter((r) => r.nightOrder != null);
let nightActions = [];
  for(let role of nightRoles){
    for(let item of role.nightOrder){
      nightActions.push([role, item]);
    }
  }

  const commandTableRows = Object.keys(roles).map((key) => {
    let { name, description } = AchievementData.Mafia[key];

    return {
      term: key,
      reward,
      description,
    };
  });

  const commandTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Achievement</TableCell>
            <TableCell>Coin Reward</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {commandTableRows.map((row) => (
            <TableRow
              key={row.name}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row" align="center">
                {row.term}
              </TableCell>
              <TableCell align="center">{row.reward}</TableCell>
              <TableCell align="center">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Achievements
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h6"> List of Achievements</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Below is a list of Achievements that can be earned during a game.
          </Typography>
          <Box className="paragraph">{commandTable}</Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
