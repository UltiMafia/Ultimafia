import React, { useState, useEffect, useReducer, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import update from "immutability-helper";
import axios from "axios";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  Paper,
  Box,
  Divider,
  useMediaQuery,
  useTheme,
  Grid2,
  Button,
  IconButton,
} from "@mui/material";

import { MaxModifiersPerRole } from "Constants";
import { UserContext, SiteInfoContext } from "Contexts";
import {
  RoleCount,
  RoleSearch,
  ModifierSearch,
  ModifierCount,
  GameSettingSearch,
  GameSettingCount,
  RoleCell,
} from "components/Roles";
import Form from "components/Form";
import { useErrorAlert } from "components/Alerts";

import "css/createSetup.css";
import { NewLoading } from "pages/Welcome/NewLoading";

function StickyStateViewer(props) {
  const isSticky = props.isSticky;
  const title = props.title;
  const isVertical = props.isVertical;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Stack
      direction="row"
      sx={{
        position: isSticky ? "sticky" : "relative",
        bottom: isSticky ? "var(--mui-spacing)" : undefined,
        mt: 1,
      }}
    >
      <Paper
        variant="outline"
        sx={{
          p: 1,
          maxWidth: "80%",
          flex: "1",
          mx: "auto",
        }}
      >
        <Stack
          direction={isVertical ? "column" : "row"}
          spacing={isSmallScreen ? 0.5 : 1}
          sx={{
            justifyContent: isVertical ? "stretch" : "center",
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <Stack
            direction="column"
            sx={{
              justifyContent: "center",
              flex: "0 0",
              bgcolor: isSticky
                ? "var(--scheme-color-sec)"
                : "var(--scheme-color-background)",
              borderRadius: "var(--mui-shape-borderRadius)",
              p: 1,
            }}
          >
            <Typography variant="h4" textAlign="center">
              {title}
            </Typography>
          </Stack>
          <Divider
            orientation={isVertical ? "horizontal" : "vertical"}
            flexItem
          />
          {props.children}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function CreateSetup(props) {
  const gameType = props.gameType;
  const formFields = props.formFields;
  const updateFormFields = props.updateFormFields;
  const closedField = props.closedField;
  const useRoleGroupsField = props.useRoleGroupsField || { value: false };
  const resetFormFields = props.resetFormFields;
  const formFieldValueMods = props.formFieldValueMods;
  const onCreateSetup = props.onCreateSetup;

  const errorAlert = useErrorAlert();
  const [selRoleSet, setSelRoleSet] = useState(0);
  const [redirect, setRedirect] = useState("");
  const [editing, setEditing] = useState(false);
  const [modifiers, setModifiers] = useState([]);
  const [gameSettings, setGameSettings] = useState([]);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const siteInfo = useContext(SiteInfoContext);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [roleData, updateRoleData] = useReducer(
    (roleData, action) => {
      var newRoleData = { ...roleData };

      switch (action.type) {
        case "reset":
          newRoleData = update(newRoleData, {
            roles: { $set: [{}] },
            roleGroupSizes: { $set: [1] },
          });
          break;
        case "setClosed":
          newRoleData.closed = action.closed;

          if (action.closed && !newRoleData.useRoleGroups) {
            if (newRoleData.roles.length > 1) {
              newRoleData = update(newRoleData, {
                roles: { $splice: [[1, newRoleData.roles.length - 1]] },
              });
            }
            if (newRoleData.roleGroupSizes.length > 1) {
              newRoleData = update(newRoleData, {
                roleGroupSizes: {
                  $splice: [[1, newRoleData.roleGroupSizes.length - 1]],
                },
              });
            }
          }
          break;
        case "setUseRoleGroups":
          newRoleData.useRoleGroups = action.useRoleGroups;

          if (!action.useRoleGroups) {
            if (newRoleData.roles.length > 1) {
              newRoleData = update(newRoleData, {
                roles: { $splice: [[1, newRoleData.roles.length - 1]] },
              });
            }
            if (newRoleData.roleGroupSizes.length > 1) {
              newRoleData = update(newRoleData, {
                roleGroupSizes: {
                  $splice: [[1, newRoleData.roleGroupSizes.length - 1]],
                },
              });
            }
          }
          break;
        case "addRole":
          if (newRoleData.roles[selRoleSet][action.role] === undefined) {
            newRoleData = update(newRoleData, {
              roles: { [selRoleSet]: { $merge: { [action.role]: 1 } } },
            });
          } else {
            newRoleData = update(newRoleData, {
              roles: {
                [selRoleSet]: {
                  [action.role]: {
                    $set: newRoleData.roles[selRoleSet][action.role] + 1,
                  },
                },
              },
            });
          }
          /* var roleSet = newRoleData.roles[selRoleSet];

          if (!roleSet[action.role]) roleSet[action.role] = 0;

          roleSet[action.role]++; */
          break;
        case "removeRole":
          if (newRoleData.roles[selRoleSet][action.role] === 1) {
            newRoleData = update(newRoleData, {
              roles: { [selRoleSet]: { $unset: [action.role] } },
            });
          } else {
            newRoleData = update(newRoleData, {
              roles: {
                [selRoleSet]: {
                  [action.role]: {
                    $set: newRoleData.roles[selRoleSet][action.role] - 1,
                  },
                },
              },
            });
          }
          /* var roleSet = newRoleData.roles[selRoleSet];

          if (roleSet[action.role]) roleSet[action.role]--;

          if (roleSet[action.role] < 1) delete roleSet[action.role]; */
          break;
        case "addRoleSet":
          newRoleData = update(newRoleData, {
            roles: { $push: [{}] },
            roleGroupSizes: { $push: [1] },
          });
          break;
        case "removeRoleSet":
          newRoleData = update(newRoleData, {
            roles: { $splice: [[action.index, 1]] },
            roleGroupSizes: { $splice: [[action.index, 1]] },
          });

          if (action.index === selRoleSet) setSelRoleSet(0);
          break;
        case "increaseRolesetSize":
          newRoleData = update(newRoleData, {
            roleGroupSizes: {
              [action.index]: {
                $set: newRoleData.roleGroupSizes[action.index] + 1,
              },
            },
          });
          break;
        case "decreaseRolesetSize":
          newRoleData = update(newRoleData, {
            roleGroupSizes: {
              [action.index]: {
                $set: newRoleData.roleGroupSizes[action.index] - 1,
              },
            },
          });
          break;
        case "setFromSetup":
          newRoleData.closed = action.closed;
          newRoleData.roles = action.roles;
          newRoleData.useRoleGroups = action.useRoleGroups;

          let sizes = action.roleGroupSizes;
          if (sizes.length === 0) {
            sizes = Array(newRoleData.roles.length).fill(1);
          }
          newRoleData.roleGroupSizes = sizes;
          break;
      }

      return newRoleData;
    },
    { roles: [{}], roleGroupSizes: [1], closed: false }
  );

  const user = useContext(UserContext);

  useEffect(() => {
    updateRoleData({
      type: "setUseRoleGroups",
      useRoleGroups: useRoleGroupsField.value,
    });
  }, [useRoleGroupsField.value]);

  useEffect(() => {
    updateRoleData({ type: "setClosed", closed: closedField.value });
  }, [closedField.value]);

  useEffect(() => {
    const editSetup = params.get("edit");
    const copySetup = params.get("copy");

    if (editSetup || copySetup) {
      axios
        .get(`/api/setup/${editSetup || copySetup}`)
        .then((res) => {
          var setup = res.data;

          setEditing(true);

          updateRoleData({
            type: "setFromSetup",
            roles: JSON.parse(setup.roles),
            closed: setup.closed,
            useRoleGroups: setup.useRoleGroups,
            roleGroupSizes: setup.roleGroupSizes,
          });
          setGameSettings(setup.gameSettings[0]);
          var formFieldChanges = [];

          for (let field of formFields) {
            if (setup[field.ref]) {
              let value = setup[field.ref];

              if (formFieldValueMods[field.ref])
                for (let valueMod of formFieldValueMods[field.ref])
                  value = valueMod(value);

              formFieldChanges.push({
                ref: field.ref,
                prop: "value",
                value: value,
              });
            }
          }

          if (setup.closed) {
            for (let alignment in setup.count) {
              formFieldChanges.push({
                ref: `count-${alignment}`,
                prop: "value",
                value: setup.count[alignment],
              });
            }
          }

          updateFormFields(formFieldChanges);
        })
        .catch(errorAlert);
    }
  }, []);

  function onAddRole(role) {
    updateRoleData({
      type: "addRole",
      role: `${role.name}:${
        modifiers.filter((e) => e).length > 0
          ? modifiers
              .filter((e) => e)
              .map((e) => e.name)
              .join("/")
          : ""
      }`,
      alignment: role.alignment,
    });
  }

  function onAddModifier(mod) {
    let index = modifiers.length;
    if (index > 2) {
      return;
    }
    let tmpModifiers = modifiers.filter((m) => m);
    tmpModifiers.push(mod);
    setModifiers(tmpModifiers);
    /*
    const tmpModifiers = [...modifiers];
    const modifier = mod;
    if (modifier) {
      tmpModifiers[index] = modifier;
    } else {
      delete tmpModifiers[index];
    }
    setModifiers(tmpModifiers);
    */
  }

  function onAddGameSetting(mod) {
    let index = gameSettings.length;

    var tmpGameSettings = gameSettings.filter((m) => m);
    if (mod.name && mod.name.includes(" x10")) {
      let tempMod = {
        name: mod.name.split(" x10")[0],
      };
      //mod.name = mod.name.split(" x10")[0];
      var p = 0;
      let tempArray = [
        tempMod.name,
        tempMod.name,
        tempMod.name,
        tempMod.name,
        tempMod.name,
        tempMod.name,
        tempMod.name,
        tempMod.name,
        tempMod.name,
        tempMod.name,
      ];
      for (let x = 0; x < tmpGameSettings.length; x++) {
        if (tmpGameSettings[x] == tempMod.name) {
          tmpGameSettings[x] = [tempMod.name];
          tmpGameSettings[x].push(...tempArray);
          setGameSettings(tmpGameSettings);
          return;
        } else if (tmpGameSettings[x].includes(tempMod.name)) {
          if (tmpGameSettings[x].length > 99) {
            return;
          }
          tmpGameSettings[x].push(...tempArray);
          while (tmpGameSettings[x].length > 100) {
            tmpGameSettings[x].pop();
          }
          setGameSettings(tmpGameSettings);
          return;
        }
      }
      tmpGameSettings.push(tempArray);
      setGameSettings(tmpGameSettings);
      return;
    }
    for (let x = 0; x < tmpGameSettings.length; x++) {
      if (tmpGameSettings[x] == mod.name) {
        tmpGameSettings[x] = [mod.name];
        tmpGameSettings[x].push(mod.name);
        setGameSettings(tmpGameSettings);
        return;
      } else if (tmpGameSettings[x].includes(mod.name)) {
        if (tmpGameSettings[x].length > 99) {
          return;
        }
        tmpGameSettings[x].push(mod.name);
        setGameSettings(tmpGameSettings);
        return;
      }
    }
    tmpGameSettings.push(mod.name);
    setGameSettings(tmpGameSettings);
    return;
    /*
    const tmpModifiers = [...modifiers];
    const modifier = mod;
    if (modifier) {
      tmpModifiers[index] = modifier;
    } else {
      delete tmpModifiers[index];
    }
    setModifiers(tmpModifiers);
    */
  }

  function onRemoveModifier(mod) {
    let index = modifiers.indexOf(mod);
    if (index == -1) {
      return;
    }
    let tmpModifiers = modifiers.filter((m) => m);
    tmpModifiers.splice(index, 1);
    setModifiers(tmpModifiers);
    /*
    const tmpModifiers = [...modifiers];
    delete tmpModifiers[index];
    
    setModifiers(tmpModifiers);
    */
  }

  function onRemoveGameSetting(mod) {
    let index = gameSettings.indexOf(mod);
    if (index == -1) {
      return;
    }
    let tmpGameSettings = gameSettings.filter((m) => m);
    /*
    if (Array.isArray(mod)) {
      tmpGameSettings[index].pop();
      if (tmpGameSettings[index].length <= 1) {
        tmpGameSettings[index] = mod[0];
      }
      setGameSettings(tmpGameSettings);
      return;
    }
    */
    tmpGameSettings.splice(index, 1);
    setGameSettings(tmpGameSettings);
    /*
    const tmpModifiers = [...modifiers];
    delete tmpModifiers[index];
    
    setModifiers(tmpModifiers);
    */
  }

  function onModifierChange(e, index) {
    const tmpModifiers = [...modifiers];
    const modifier = e.target.value;
    if (modifier) {
      tmpModifiers[index] = modifier;
    } else {
      delete tmpModifiers[index];
    }
    setModifiers(tmpModifiers);
  }

  if (editing && !params.get("edit")) {
    setEditing(false);
    resetFormFields();
    updateRoleData({ type: "reset" });
  }

  let usingRoleGroups = roleData.closed && roleData.useRoleGroups;
  let showAddRoleSet =
    (!roleData.closed && roleData.roles.length < 10) || usingRoleGroups;

  var roleSets;

  roleSets = roleData.roles.map((roleSet, i) => {
    let roles = [];

    for (let role in roleSet) {
      roles.push(
        <RoleCount
          role={role}
          count={roleSet[role]}
          gameType={gameType}
          onClick={() => {
            updateRoleData({
              type: "removeRole",
              role: role,
            });
          }}
          key={role}
          showPopover
          otherRoles={roleData.roles}
        />
      );
    }

    const isSelected = selRoleSet == i;

    return (
      <StickyStateViewer
        isSticky={modifiers.length == 0 && isSelected}
        title={`Roleset ${i}`}
        key={i}
      >
        <Box
          onClick={() => setSelRoleSet(i)}
          className="roleset"
          sx={{
            p: 1,
            width: "100%",
            bgcolor: isSelected
              ? "var(--scheme-color-sec)"
              : "var(--scheme-color-background)",
            maxHeight: "calc(8em + 4 * var(--mui-spacing))", // 8em = max 4 rows of icons before scrolling
            overflowY: "auto",
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              minHeight: "100%",
            }}
          >
            <Stack direction="column" sx={{ width: "100%" }}>
              {usingRoleGroups && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>Size:</Typography>
                  <IconButton
                    aria-label="decrease roleset size"
                    onClick={() => {
                      updateRoleData({
                        type: "decreaseRolesetSize",
                        index: i,
                      });
                    }}
                  >
                    <i className="fas fa-minus-circle" />
                  </IconButton>
                  <Typography>{roleData.roleGroupSizes[i]}</Typography>
                  <IconButton
                    aria-label="increase roleset size"
                    onClick={() => {
                      updateRoleData({
                        type: "increaseRolesetSize",
                        index: i,
                      });
                    }}
                  >
                    <i className="fas fa-plus-circle" />
                  </IconButton>
                </Stack>
              )}
              <Stack direction="column" spacing={0.5} sx={{ width: "100%" }}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ width: "100%", alignItems: "center", flexWrap: "wrap" }}
                >
                  {roles}
                  {roles.length > 0 && (
                    <Typography
                      sx={{
                        ml: "auto !important",
                        flex: "0 0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Total: {roles.reduce((acc, e) => acc + e.props.count, 0)}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>
            {i > 0 && (
              <Button
                onClick={() => {
                  updateRoleData({
                    type: "removeRoleSet",
                    index: i,
                  });
                }}
                sx={{
                  padding: 1,
                  bgcolor: "#e45050",
                  alignSelf: "stretch",
                  minWidth: "0px",
                  ml: 1,
                }}
              >
                <i
                  className="fa-times fas"
                  aria-hidden="true"
                  style={{ fontSize: isSmallScreen ? "0.5em" : "1em" }}
                />
              </Button>
            )}
          </Stack>
        </Box>
      </StickyStateViewer>
    );
  });

  const gameModifiers = siteInfo.modifiers ? siteInfo.modifiers[gameType] : [];

  function getCompatibleModifiers(...selectedModifiers) {
    const mappedMods = selectedModifiers.map((e) =>
      gameModifiers.find((x) => x.name === e)
    );
    let temp;
    if (mappedMods && mappedMods.length <= 0) {
      temp = [];
    } else {
      temp = mappedMods
        .filter((k) => k)
        .map((e) => e.incompatible)
        .flat();
    }
    const incompatibles = temp;
    const modifierOptions = gameModifiers
      .filter((e) => !e.hidden)
      .filter((e) => e.allowDuplicate || !selectedModifiers.includes(e.name))
      .filter((e) => !incompatibles.includes(e.name))
      .map((modifier) => (
        <option value={modifier.name} key={modifier.name}>
          {modifier.name}
        </option>
      ));

    modifierOptions.unshift(
      <option value="" key={"None"}>
        None
      </option>
    );
    return modifierOptions;
  }

  if (params.get("edit") && !editing) return <NewLoading small />;

  const innerContentHeight = "calc(1.2 * 2em)";
  const iconLength = isSmallScreen ? "1em" : innerContentHeight;

  const selectedModifiers = [
    ...Array(isSmallScreen ? modifiers.length : MaxModifiersPerRole).keys(),
  ].map((i) => {
    const m = modifiers[i];
    return (
      <Grid2
        size={1}
        sx={{ width: isSmallScreen ? "100%" : undefined }}
        key={i}
      >
        <RoleCell
          iconLength={iconLength}
          role={m}
          onDelClick={() => onRemoveModifier(m)}
          icon={
            <ModifierCount
              iconLength={iconLength}
              role={m}
              gameType={gameType}
            />
          }
        />
      </Grid2>
    );
  });

  return (
    <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
      <RoleSearch onAddClick={onAddRole} gameType={gameType} />
      {siteInfo.modifiers[props.gameType].length > 0 && (
        <Paper sx={{ p: 1 }}>
          <Accordion>
            <AccordionSummary>
              <Typography variant="h3">Modifiers</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ModifierSearch
                onAddClick={onAddModifier}
                gameType={gameType}
                curMods={modifiers}
              />
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
      {siteInfo.modifiers[props.gameType].length > 0 && (
        <StickyStateViewer
          isSticky={modifiers.length > 0}
          title="Selected Modifiers"
          isVertical={isSmallScreen}
        >
          <Grid2
            container
            columns={MaxModifiersPerRole}
            direction={isSmallScreen ? "column" : "row"}
            spacing={1}
            sx={{ flexGrow: "1", width: "100%" }}
          >
            {selectedModifiers}
          </Grid2>
        </StickyStateViewer>
      )}
      <Divider
        orientation="horizontal"
        flexItem
        sx={{ width: "80%", mx: "auto !important" }}
      />
      {roleSets}
      <Paper
        sx={{
          p: 1,
          width: "80%",
          mx: "auto !important",
        }}
      >
        <Grid2 container columns={3} spacing={1}>
          <Grid2 size={{ xs: 1 }}></Grid2>
          <Grid2 size={{ xs: 1 }}>
            {showAddRoleSet && (
              <Stack
                direction="row"
                sx={{
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Button
                  onClick={() => updateRoleData({ type: "addRoleSet" })}
                  sx={{
                    padding: 1,
                    bgcolor: "#62a0db",
                    alignSelf: "stretch",
                    minWidth: "0px",
                    ml: 1,
                  }}
                >
                  <i className="fa-plus fas" aria-hidden="true" />
                </Button>
              </Stack>
            )}
          </Grid2>
          <Grid2 size={{ xs: 1 }}>
            {usingRoleGroups && (
              <Stack
                direction="row"
                sx={{
                  justifyContent: "right",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography>
                  {"Total Size: "}
                  {roleData.roleGroupSizes.reduce((a, b) => a + b)}
                </Typography>
              </Stack>
            )}
          </Grid2>
        </Grid2>
      </Paper>
      <GameSettingSearch
        onAddClick={onAddGameSetting}
        gameType={gameType}
        curMods={gameSettings}
      />
      <mod>
        Selected Game Settings
        <Stack
          display="flex"
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
            width: "100%",
            overflowY: "auto",
            flexWrap: "wrap",
          }}
        >
          {gameSettings.map((m) => (
            <div>
              <RoleCell
                iconLength={iconLength}
                role={Array.isArray(m) ? m[0] : m}
                onDelClick={() => onRemoveGameSetting(m)}
                icon={
                  <GameSettingCount
                    iconLength={iconLength}
                    role={Array.isArray(m) ? m[0] : m}
                    count={gameSettings[m]}
                    gameType={gameType}
                    sx={{ fontSize: "14px" }}
                  />
                }
              />
              {Array.isArray(m) ? `${m[0]} x${m.length}` : m}
            </div>
          ))}
        </Stack>
      </mod>
      <Paper sx={{ p: 1 }}>
        {user.loggedIn && (
          <Stack direction={isSmallScreen ? "column" : "row"}>
            <Form
              fields={formFields}
              onChange={updateFormFields}
              submitText={editing ? "Edit" : "Create"}
              onSubmit={() =>
                onCreateSetup(roleData, editing, setRedirect, gameSettings)
              }
            />
          </Stack>
        )}
        {redirect && <Navigate to={`/play/host/?setup=${redirect}`} />}
      </Paper>
    </Stack>
  );
}
