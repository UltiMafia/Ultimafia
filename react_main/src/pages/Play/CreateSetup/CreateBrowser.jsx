import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
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
  Grid2,
  Stepper,
  Step,
  StepButton,
  Chip,
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
} from "components/Roles";
import { Cell } from "components/CellSearch";
import Form from "components/Form";
import { UiAction, UiCard, UiField, UiIcon, UiSection, UiDialog, UiStepNavigation } from "components/ui";
import { useErrorAlert } from "components/Alerts";
import "css/createSetup.css";
import { Loading } from "components/Loading";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

function setupHasEvent(roles, rolesRaw) {
  if (!Array.isArray(roles) || !rolesRaw) return false;
  for (const roleSet of roles) {
    if (!roleSet) continue;
    for (const key of Object.keys(roleSet)) {
      const name = key.split(":")[0];
      if (rolesRaw[name]?.alignment === "Event") return true;
    }
  }
  return false;
}

function StickyStateViewer(props) {
  return <UiSection title={props.title} className="setup-role-set" style={{ position: props.isSticky ? "sticky" : "relative", bottom: props.isSticky ? "8px" : undefined }}>{props.children}</UiSection>;
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
  const fixedRoles = props.fixedRoles;
  const fixedPlayerTotal = props.fixedPlayerTotal;
  const useFixedRoles = Boolean(fixedRoles?.length);

  const errorAlert = useErrorAlert();
  const [selRoleSet, setSelRoleSet] = useState(0);
  const [redirect, setRedirect] = useState("");
  const [editing, setEditing] = useState(false);
  const [modifiers, setModifiers] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);
  const [presetConfirm, setPresetConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const savePending = useRef(false);
  async function saveSetup() {
    if (savePending.current) return;
    savePending.current = true; setSaving(true);
    try { await onCreateSetup(roleData, editing, setRedirect, gameSettings); }
    finally { savePending.current = false; setSaving(false); }
  }
  const wizardRef = useRef(null);
  const setupFormRef = useRef(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

  const gameTypeSettings = siteInfo.gamesettings[gameType];
  const isMafiaSetup = gameType === "Mafia";

  const [roleData, updateRoleData] = useReducer(
    (roleData, action) => {
      var newRoleData = { ...roleData };

      switch (action.type) {
        case "modifyRole": {
          const roleSet = { ...newRoleData.roles[action.index] };
          if (!roleSet[action.role] || action.role === action.nextRole) break;
          if ((roleSet[action.nextRole] || 0) >= 99) break;
          roleSet[action.role]--;
          if (!roleSet[action.role]) delete roleSet[action.role];
          roleSet[action.nextRole] = (roleSet[action.nextRole] || 0) + 1;
          newRoleData = update(newRoleData, {
            roles: { [action.index]: { $set: roleSet } },
          });
          break;
        }
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

          // Open multi-setups keep their role sets without using role groups.
          if (newRoleData.closed && !action.useRoleGroups) {
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
          } else if (newRoleData.roles[selRoleSet][action.role] >= 99) {
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
        case "removeRole": {
          const roleSetIndex = action.index ?? selRoleSet;
          if (newRoleData.roles[roleSetIndex][action.role] === 1) {
            newRoleData = update(newRoleData, {
              roles: { [roleSetIndex]: { $unset: [action.role] } },
            });
          } else {
            newRoleData = update(newRoleData, {
              roles: {
                [roleSetIndex]: {
                  [action.role]: {
                    $set: newRoleData.roles[roleSetIndex][action.role] - 1,
                  },
                },
              },
            });
          }
          /* var roleSet = newRoleData.roles[selRoleSet];

          if (roleSet[action.role]) roleSet[action.role]--;

          if (roleSet[action.role] < 1) delete roleSet[action.role]; */
          break;
        }
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

          if (action.index <= selRoleSet) setSelRoleSet(Math.max(0, selRoleSet - 1));
          break;
        case "copyRoleSet":
          newRoleData = update(newRoleData, {
            roles: { $push: [newRoleData.roles[action.index]] },
            roleGroupSizes: {
              $push: [newRoleData.roleGroupSizes[action.index]],
            },
          });
          break;
        case "moveRoleSetUp":
          let index1 = action.index;
          let index2 = action.index - 1;
          if (action.index == 0) {
            index2 = newRoleData.roles.length - 1;
          }
          let tempRoles = newRoleData.roles[index1];
          let tempGroupSize = newRoleData.roleGroupSizes[index1];
          let tempRoles2 = newRoleData.roles[index2];
          let tempGroupSize2 = newRoleData.roleGroupSizes[index2];
          newRoleData = update(newRoleData, {
            roles: {
              [index2]: {
                $set: tempRoles,
              },
              [index1]: {
                $set: tempRoles2,
              },
            },
            roleGroupSizes: {
              [index2]: {
                $set: tempGroupSize,
              },
              [index1]: {
                $set: tempGroupSize2,
              },
            },
          });
          break;
        case "moveRoleSetDown":
          let index3 = action.index;
          let index4 = action.index + 1;
          if (action.index == newRoleData.roles.length - 1) {
            index4 = 0;
          }
          let tempRoles3 = newRoleData.roles[index3];
          let tempGroupSize3 = newRoleData.roleGroupSizes[index3];
          let tempRoles4 = newRoleData.roles[index4];
          let tempGroupSize4 = newRoleData.roleGroupSizes[index4];
          newRoleData = update(newRoleData, {
            roles: {
              [index4]: {
                $set: tempRoles3,
              },
              [index3]: {
                $set: tempRoles4,
              },
            },
            roleGroupSizes: {
              [index4]: {
                $set: tempGroupSize3,
              },
              [index3]: {
                $set: tempGroupSize4,
              },
            },
          });
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
    useFixedRoles
      ? {
          roles: fixedRoles.map((roleSet) => ({ ...roleSet })),
          roleGroupSizes: fixedRoles.map((roleSet) =>
            Object.values(roleSet).reduce((sum, n) => sum + n, 0)
          ),
          closed: false,
        }
      : { roles: [{}], roleGroupSizes: [1], closed: false }
  );

  const [gameSettings, updateGameSettings] = useReducer(
    (gameSettings, action) => {
      switch (action.type) {
        case "add":
          let actualKey = action.gameSetting.name;
          let increment = 1;
          let intitialCount = 0;

          if (actualKey.includes(" x10")) {
            increment = 10;
            actualKey = actualKey.split(" x10")[0];
          }

          if (!action.gameSetting.allowDuplicate) {
            // Set the value to true and short circuit if no duplicates allowed
            return update(gameSettings, {
              [actualKey]: { $set: true },
            });
          }

          if (actualKey in gameSettings) {
            intitialCount = gameSettings[actualKey];
          }

          if (
            intitialCount + increment >= action.gameSetting.maxCount &&
            action.gameSetting.allowDuplicate
          ) {
            return update(gameSettings, {
              [actualKey]: { $set: action.gameSetting.maxCount },
            });
          }

          return update(gameSettings, {
            [actualKey]: { $set: intitialCount + increment },
          });
        case "remove":
          return update(gameSettings, {
            $unset: [action.key],
          });
        case "setFromSetup":
          return action.gameSettings;
        case "setAll":
          return action.gameSettings;
        default:
          throw new Error();
      }
    },
    {}
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

          setEditing(Boolean(editSetup));

          updateRoleData({
            type: "setFromSetup",
            roles: JSON.parse(setup.roles),
            closed: setup.closed,
            useRoleGroups: setup.useRoleGroups,
            roleGroupSizes: setup.roleGroupSizes,
          });
          updateGameSettings({
            type: "setFromSetup",
            gameSettings: setup.gameSettings,
          });
          var formFieldChanges = [];

          for (let field of formFields) {
            if (setup[field.ref] !== undefined) {
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

  const onAddRole = useCallback(
    function (role) {
      updateRoleData({
        type: "addRole",
        role: `${role.name}:${
          !isMafiaSetup && modifiers.filter((e) => e).length > 0
            ? modifiers
                .filter((e) => e)
                .map((e) => e.name)
                .join("/")
            : ""
        }`,
        alignment: role.alignment,
      });
    },
    [modifiers, isMafiaSetup]
  );

  const selectedRoleExists =
    selectedRole && roleData.roles[selectedRole.index]?.[selectedRole.role];
  const roleModifiers = selectedRoleExists
    ? (selectedRole.role.split(":")[1] || "")
        .split("/")
        .filter(Boolean)
        .map((name) => siteInfo.modifiers?.[gameType]?.find((m) => m.name === name) || { name })
    : [];

  function changeRoleModifiers(nextModifiers) {
    if (!selectedRoleExists) return;
    const nextRole = `${selectedRole.role.split(":")[0]}:${nextModifiers
      .map((m) => m.name)
      .sort((a, b) => a.localeCompare(b))
      .join("/")}`;
    if ((roleData.roles[selectedRole.index][nextRole] || 0) >= 99) {
      siteInfo.showAlert("This role variant already has 99 copies.", "error");
      return;
    }
    updateRoleData({ type: "modifyRole", ...selectedRole, nextRole });
    setSelectedRole({ ...selectedRole, role: nextRole });
  }

  function changeStep(step) {
    setActiveStep(step);
    if (step === 0) setSelectedRole(null);
    wizardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  useEffect(() => {
    setSelectedRole(null);
    setSelRoleSet((index) => index >= roleData.roles.length ? 0 : index);
  }, [roleData.roles.length, roleData.closed, roleData.useRoleGroups]);

  function onAddModifier(mod) {
    if (isMafiaSetup) {
      if (roleModifiers.length < MaxModifiersPerRole) {
        changeRoleModifiers([...roleModifiers, mod]);
      }
      return;
    }
    let tmpModifiers = modifiers.filter((m) => m);
    if (tmpModifiers.length >= MaxModifiersPerRole) {
      return;
    }
    tmpModifiers.push(mod);
    tmpModifiers = tmpModifiers.sort((a, b) => a.name.localeCompare(b.name));
    tmpModifiers = setModifiers(tmpModifiers);
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
    if (isMafiaSetup) {
      const next = [...roleModifiers];
      next.splice(next.indexOf(mod), 1);
      changeRoleModifiers(next);
      return;
    }
    let index = modifiers.indexOf(mod);
    if (index == -1) {
      return;
    }
    let tmpModifiers = modifiers.filter((m) => m);
    tmpModifiers.splice(index, 1);
    tmpModifiers = tmpModifiers.sort((a, b) => a.name.localeCompare(b.name));
    setModifiers(tmpModifiers);
    /*
    const tmpModifiers = [...modifiers];
    delete tmpModifiers[index];
    
    setModifiers(tmpModifiers);
    */
  }

  function applyMafiaSpeedRoundsPreset() {
    updateRoleData({
      type: "setFromSetup",
      roles: [{ "Villager:": 2, "Mafioso:": 1 }],
      closed: true,
      useRoleGroups: false,
      roleGroupSizes: [1],
    });
    setSelRoleSet(0);
    setSelectedRole(null);
    if (isMafiaSetup) changeStep(2);

    updateGameSettings({
      type: "setAll",
      gameSettings: {
        "Speed Rounds": true,
        "Must Condemn": true,
        "Alignment Only Reveal": true,
      },
    });

    updateFormFields([
      { ref: "closed", prop: "value", value: true },
      { ref: "useRoleGroups", prop: "value", value: false },
      { ref: "count-Village", prop: "value", value: 2 },
      { ref: "count-Mafia", prop: "value", value: 1 },
      { ref: "count-Cult", prop: "value", value: 0 },
      { ref: "count-Independent", prop: "value", value: 0 },
    ]);

    setTimeout(() => {
      if (setupFormRef.current) {
        setupFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 0);
  }

  if (editing && !params.get("edit")) {
    setEditing(false);
    resetFormFields();
    updateRoleData({ type: "reset" });
  }

  let usingRoleGroups = roleData.closed && roleData.useRoleGroups;
  let showAddRoleSet =
    (!roleData.closed && roleData.roles.length < 10) || usingRoleGroups;
  let showMoveOptions = roleData.roles.length > 1;

  const roleSets = roleData.roles.map((roleSet, i) => {
    let roles = [];

    for (let role in roleSet) {
      roles.push(
        <UiAction variant="ghost"
          key={role}
          aria-label={isMafiaSetup && activeStep === 1 ? `Edit modifiers for ${role.replace(":", " ")}` : `Remove one ${role.replace(":", " ")}`}
          aria-pressed={isMafiaSetup && activeStep === 1 ? selectedRole?.index === i && selectedRole?.role === role : undefined}
          onClick={() => {
            if (isMafiaSetup && activeStep === 1) {
              setSelRoleSet(i);
              setSelectedRole({ index: i, role });
            } else updateRoleData({ type: "removeRole", role, index: i });
          }}
        >
        <RoleCount
          role={role}
          count={1}
          gameType={gameType}
          showPopover={false}
          key={role}
          otherRoles={roleData.roles}
        />
        <span>{role.split(":")[0]} × {roleSet[role]}</span>
        </UiAction>
      );
    }

    const isSelected = selRoleSet == i;

    return (
      <StickyStateViewer
        compact={isMafiaSetup}
        isVertical={isMafiaSetup && isPhoneDevice}
        isSticky={!isMafiaSetup && modifiers.length == 0 && isSelected}
        title={`Roleset ${i + 1}`}
        key={i}
      >
        <Paper
          onClick={() => setSelRoleSet(i)}
          className="roleset"
          sx={{
            p: 1,
            width: "100%",
            background: "transparent", boxShadow: "none",
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
                  <UiAction iconOnly
                    aria-label="decrease roleset size"
                    onClick={() => {
                      updateRoleData({
                        type: "decreaseRolesetSize",
                        index: i,
                      });
                    }}
                  >
                    <UiIcon name="remove" />
                  </UiAction>
                  <Typography>{roleData.roleGroupSizes[i]}</Typography>
                  <UiAction iconOnly
                    aria-label="increase roleset size"
                    onClick={() => {
                      updateRoleData({
                        type: "increaseRolesetSize",
                        index: i,
                      });
                    }}
                  >
                    <UiIcon name="add" />
                  </UiAction>
                </Stack>
              )}
              <Stack direction="column" spacing={0.5} sx={{ width: "100%" }}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ width: "100%", alignItems: "center", flexWrap: "wrap" }}
                >
                  {roles}
                  {isMafiaSetup && roles.length === 0 && (
                    <Typography color="text.secondary">No roles yet. Add roles or events below.</Typography>
                  )}
                  {roles.length > 0 && (
                    <Typography
                      sx={{
                        ml: "auto !important",
                        flex: "0 0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Total: {Object.values(roleSet).reduce((acc, count) => acc + count, 0)}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>
            {showMoveOptions && (!isMafiaSetup || activeStep === 0) && (
              <UiAction
                aria-label={`Move role set ${i + 1} up`}
                onClick={() => {
                  updateRoleData({
                    type: "moveRoleSetUp",
                    index: i,
                  });
                }}
              >
                <UiIcon name="up" />Move up
              </UiAction>
            )}
            {showMoveOptions && (!isMafiaSetup || activeStep === 0) && (
              <UiAction
                aria-label={`Move role set ${i + 1} down`}
                onClick={() => {
                  updateRoleData({
                    type: "moveRoleSetDown",
                    index: i,
                  });
                }}
              >
                <UiIcon name="down" />Move down
              </UiAction>
            )}
            {showAddRoleSet && (!isMafiaSetup || activeStep === 0) && (
              <UiAction
                aria-label={`Copy role set ${i + 1}`}
                onClick={() => {
                  updateRoleData({
                    type: "copyRoleSet",
                    index: i,
                  });
                }}
              >
                <UiIcon name="copy" />Copy set
              </UiAction>
            )}
            {isMafiaSetup && activeStep === 0 && (
              <UiAction
                onClick={() => setPresetConfirm(true)}
                aria-label="Apply Speed Rounds preset"
                title="Apply Speed Rounds preset"
              >
                Speed Rounds preset
              </UiAction>
            )}
            {i > 0 && (!isMafiaSetup || activeStep === 0) && (
              <UiAction variant="danger-quiet"
                aria-label={`Remove role set ${i + 1}`}
                onClick={() => {
                  updateRoleData({
                    type: "removeRoleSet",
                    index: i,
                  });
                }}
              >
                <UiIcon name="delete" />Remove set
              </UiAction>
            )}
          </Stack>
        </Paper>
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

  if (params.get("edit") && !editing) return <Loading small />;

  const innerContentHeight = "calc(1.2 * 2em)";
  const iconLength = isPhoneDevice ? "1em" : innerContentHeight;
  const stepLabels = ["Roles & events", "Role modifiers", "Game settings"];

  const selectedModifiers = [
    ...Array(isPhoneDevice ? modifiers.length : MaxModifiersPerRole).keys(),
  ].map((i) => {
    const m = modifiers[i];
    return (
      <Grid2
        size={1}
        sx={{ width: isPhoneDevice ? "100%" : undefined }}
        key={i}
      >
        <Cell
          iconLength={iconLength}
          item={m}
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

  const selectedRolesPanel = isMafiaSetup && activeStep < 2 ? (
    <UiCard className="setup-selected-roles">
      <div className="setup-selected-roles-header">
        <Typography variant="h3">Your roles & events</Typography>
        <div className="setup-selected-roles-actions">
          {usingRoleGroups && <span>Total size: {roleData.roleGroupSizes.reduce((a, b) => a + b, 0)}</span>}
          {showAddRoleSet && (
            <UiAction onClick={() => updateRoleData({ type: "addRoleSet" })} aria-label="Add role set">
              <UiIcon name="add" />Add role set
            </UiAction>
          )}
        </div>
      </div>
      <Typography color="text.secondary">
        {activeStep === 0
          ? "Click a role below to add a copy. Click a role in this set to remove one."
          : "Select an icon in your set to edit its modifiers. Each change applies to one copy of that role."}
      </Typography>
      <Box>{roleSets}</Box>
    </UiCard>
  ) : null;

  return (
    <Stack direction="column" spacing={1} ref={wizardRef} className={isMafiaSetup ? "setup-wizard" : "setup-editor"} data-step={activeStep}>
      {isMafiaSetup && <div className="setup-name-field"><UiField fullWidth label="Setup Name" value={formFields.find(field => field.ref === "name")?.value || ""} onChange={event => updateFormFields({ ref: "name", prop: "value", value: event.target.value })} /></div>}
      {isMafiaSetup && (
        <Box className="setup-step-list" sx={{ py: 1 }}>
          <Stepper nonLinear activeStep={activeStep} alternativeLabel={isPhoneDevice}>
            {stepLabels.map((label, index) => (
              <Step key={label}>
                <StepButton onClick={() => changeStep(index)}>{label}</StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}
      {isMafiaSetup && !isPhoneDevice && selectedRolesPanel}
      {useFixedRoles && (
        <Paper sx={{ p: 1 }}>
          <Typography variant="body1">
            Battleship is a {fixedPlayerTotal}-player game. Each setup uses{" "}
            {fixedPlayerTotal} Admirals (one per player).
          </Typography>
        </Paper>
      )}
      {isMafiaSetup && isPhoneDevice && activeStep === 0 && (
        <div className="setup-current-summary">
          <span>{roleData.roles.reduce((total, set) => total + Object.values(set).reduce((sum, count) => sum + count, 0), 0)} roles · {roleData.roles.length} role set{roleData.roles.length === 1 ? "" : "s"}</span>
          <div className="setup-current-actions">
            {showAddRoleSet && <UiAction onClick={() => updateRoleData({ type: "addRoleSet" })} aria-label="Add role set"><UiIcon name="add" size={16} />Add set</UiAction>}
            <UiAction variant="ghost" onClick={() => wizardRef.current?.querySelector(".setup-selected-roles")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Review roles</UiAction>
          </div>
        </div>
      )}
      {!useFixedRoles && (!isMafiaSetup || activeStep === 0) && (
        <UiCard className={isMafiaSetup ? "setup-catalog" : undefined}>
          {isMafiaSetup && <h2 className="setup-catalog-heading">Add roles and events</h2>}
          <RoleSearch onAddClick={onAddRole} gameType={gameType} />
        </UiCard>
      )}
      {isMafiaSetup && isPhoneDevice && selectedRolesPanel}
      {!isMafiaSetup && !useFixedRoles && siteInfo.modifiers[props.gameType].length > 0 && (
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
      {isMafiaSetup && activeStep === 1 && (
        <Box className="setup-modifier-options">
          <Typography variant="h3">
            {selectedRoleExists ? `Modifiers for ${selectedRole.role.split(":")[0]}` : "Select a role to add modifiers"}
          </Typography>
          <Typography color="text.secondary" aria-live="polite">
            {selectedRoleExists
              ? `${roleModifiers.length} of ${MaxModifiersPerRole} modifiers. Changes are applied to your set immediately.`
              : "Choose a role from the box above, or go back to add roles first."}
          </Typography>
          {selectedRoleExists && (
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mt: 1 }}>
              {roleModifiers.map((modifier, index) => (
                <Chip
                  key={`${modifier.name}-${index}`}
                  label={modifier.name}
                  onDelete={() => onRemoveModifier(modifier)}
                />
              ))}
              {roleModifiers.length === 0 && <Typography>No modifiers applied.</Typography>}
            </Stack>
          )}
        </Box>
      )}
      {!isMafiaSetup && !useFixedRoles && siteInfo.modifiers[props.gameType].length > 0 && (
        <StickyStateViewer
          compact={isMafiaSetup}
          isSticky={!isMafiaSetup && modifiers.length > 0}
          title="Selected Modifiers"
          isVertical={isPhoneDevice}
        >
          <Grid2
            container
            columns={MaxModifiersPerRole}
            direction={isPhoneDevice ? "column" : "row"}
            spacing={1}
            sx={{ flexGrow: "1", width: "100%" }}
          >
            {selectedModifiers}
          </Grid2>
        </StickyStateViewer>
      )}
      {isMafiaSetup && activeStep === 1 && selectedRoleExists && (
        roleModifiers.length < MaxModifiersPerRole ? (
          <Box className="setup-catalog">
            <ModifierSearch
              onAddClick={onAddModifier}
              gameType={gameType}
              curMods={roleModifiers}
              roleName={selectedRole.role.split(":")[0]}
            />
          </Box>
        ) : <Typography>Modifier limit reached. Remove a modifier to add another.</Typography>
      )}
      {!isMafiaSetup && !useFixedRoles && roleSets}
      {!useFixedRoles && !isMafiaSetup && (
      <Paper
        className="setup-role-set-actions"
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
                <UiAction
                  onClick={() => updateRoleData({ type: "addRoleSet" })}
                  aria-label="Add role set"
                >
                  <UiIcon name="add" />Add role set
                </UiAction>
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
      )}
      <Box className="setup-settings-step" hidden={isMafiaSetup && activeStep !== 2}>
      <Stack spacing={1} sx={isMafiaSetup ? {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
        gap: 2,
        alignItems: "start",
      } : undefined}>
      <Stack spacing={1} sx={{ minWidth: 0 }}>
      <Box className={isMafiaSetup ? "setup-catalog" : undefined}>
      <GameSettingSearch
        onAddClick={(gameSetting) =>
          updateGameSettings({ type: "add", gameSetting: gameSetting })
        }
        gameType={gameType}
        curMods={gameSettings}
      />
      </Box>
      <Paper
        sx={{
          p: 1,
        }}
      >
        <Stack direction="column" spacing={1}>
          <Typography variant="h3">Enabled Game Settings</Typography>
          {Object.keys(gameSettings).length === 0 && (
            <Typography>No game settings enabled</Typography>
          )}
          {Object.keys(gameSettings).length > 0 && (
            <Grid2
              container
              columns={4}
              spacing={1}
              sx={{
                width: "100%",
              }}
            >
              {Object.keys(gameSettings).map((gameSetting) => {
                const value = gameSettings[gameSetting];
                const count = typeof value === "number" ? value : 1;

                return (
                  <Grid2
                    size={1}
                    sx={{ width: isPhoneDevice ? "100%" : undefined }}
                    key={gameSetting}
                  >
                    <Cell
                      iconLength={iconLength}
                      item={{ name: gameSetting }}
                      onDelClick={() =>
                        updateGameSettings({ type: "remove", key: gameSetting })
                      }
                      icon={
                        <GameSettingCount
                          iconLength={iconLength}
                          role={gameSetting}
                          count={count}
                          gameType={gameType}
                          sx={{ fontSize: "14px" }}
                        />
                      }
                    />
                  </Grid2>
                );
              })}
            </Grid2>
          )}
        </Stack>
      </Paper>
      </Stack>
       <Box
         ref={setupFormRef}
        sx={{
          p: 1,
          width: isMafiaSetup || isPhoneDevice ? undefined : "50%",
          alignSelf: isMafiaSetup || isPhoneDevice ? undefined : "center",
        }}
      >
        {user.loggedIn && (
          <Stack direction={isPhoneDevice ? "column" : "row"}>
            <Form
              fields={isMafiaSetup ? formFields.filter(field => field.ref !== "name") : formFields}
              deps={{
                hasEvent: setupHasEvent(
                  roleData.roles,
                  siteInfo.rolesRaw?.[gameType]
                ),
              }}
              onChange={updateFormFields}
              submitText={isMafiaSetup ? undefined : editing ? "Edit" : "Create"}
              submitBusy={saving}
              onSubmit={saveSetup}
            />
          </Stack>
        )}
      </Box>
      </Stack>
      </Box>
      {isMafiaSetup && (
        <UiStepNavigation label="Setup steps" sticky currentStep={activeStep} stepCount={stepLabels.length}
          onBack={() => changeStep(activeStep - 1)} onNext={() => changeStep(activeStep + 1)}
          nextLabel={stepLabels[activeStep + 1]} onComplete={saveSetup} busy={saving}
          completeLabel={editing ? "Save changes" : "Create setup"}
          completionMessage={!user.loggedIn ? "Log in to save your setup" : undefined} />
      )}
      {redirect && <Navigate to={`/play/host/?setup=${redirect}`} />}
      <UiDialog open={presetConfirm} title="Replace roles with Speed Rounds?" onClose={() => setPresetConfirm(false)} actions={<><UiAction onClick={() => setPresetConfirm(false)}>Cancel</UiAction><UiAction variant="primary" onClick={() => { setPresetConfirm(false); applyMafiaSpeedRoundsPreset(); }}>Apply preset</UiAction></>}><p>This replaces your current role sets and game settings. Your setup name is kept.</p></UiDialog>
    </Stack>
  );
}
