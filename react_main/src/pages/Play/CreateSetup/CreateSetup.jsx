import React, { useState, useEffect, useReducer, useContext } from "react";
import { Redirect, useLocation } from "react-router-dom";
import axios from "axios";

import { Container, Paper, Typography, IconButton, Select, MenuItem, InputLabel, FormControl, } from "@mui/material";
import { useTheme } from "@mui/styles";
import { UserContext, SiteInfoContext } from "../../../Contexts";
import { RoleCount, RoleSearch } from "../../../components/Roles";
import Form from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

import "../../../css/createSetup.css";
import { NewLoading } from "../../Welcome/NewLoading";

export default function CreateSetup(props) {
  const {
    gameType,
    formFields,
    updateFormFields,
    closedField,
    useRoleGroupsField = { value: false },
    resetFormFields,
    formFieldValueMods,
    onCreateSetup,
  } = props;

  const theme = useTheme();
  const errorAlert = useErrorAlert();
  const [selRoleSet, setSelRoleSet] = useState(0);
  const [redirect, setRedirect] = useState("");
  const [editing, setEditing] = useState(false);
  const [modifiers, setModifiers] = useState([]);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const siteInfo = useContext(SiteInfoContext);

  const [roleData, updateRoleData] = useReducer(
    (roleData, action) => {
      const newRoleData = { ...roleData };

      if (action.type !== "reset" && action.type !== "setClosed") {
        newRoleData.roles = roleData.roles.slice();
        newRoleData.role = roleData.roleGroupSizes.slice();

        for (let i in roleData.roles)
          newRoleData.roles[i] = { ...roleData.roles[i] };
      }

      switch (action.type) {
        case "reset":
          newRoleData.roles = [{}];
          newRoleData.roleGroupSizes = [1];
          break;
        case "setClosed":
          newRoleData.closed = action.closed;

          if (action.closed && !newRoleData.useRoleGroups) {
            newRoleData.roles = newRoleData.roles.slice(0, 1);
            newRoleData.roleGroupSizes = newRoleData.roleGroupSizes.slice(0, 1);
          }
          break;
        case "setUseRoleGroups":
          newRoleData.useRoleGroups = action.useRoleGroups;

          if (!action.useRoleGroups) {
            newRoleData.roles = newRoleData.roles.slice(0, 1);
            newRoleData.roleGroupSizes = newRoleData.roleGroupSizes.slice(0, 1);
          }
          break;
        case "addRole":
          const roleSetAdd = newRoleData.roles[selRoleSet];

          if (!roleSetAdd[action.role]) roleSetAdd[action.role] = 0;

          roleSetAdd[action.role]++;
          break;
        case "removeRole":
          const roleSetRemove = newRoleData.roles[selRoleSet];

          if (roleSetRemove[action.role]) roleSetRemove[action.role]--;

          if (roleSetRemove[action.role] < 1) delete roleSetRemove[action.role];
          break;
        case "addRoleSet":
          newRoleData.roles.push({});
          newRoleData.roleGroupSizes.push(1);
          break;
        case "removeRoleSet":
          newRoleData.roles.splice(action.index, 1);
          newRoleData.roleGroupSizes.splice(action.index, 1);

          if (action.index === selRoleSet) setSelRoleSet(0);
          break;
        case "increaseRolesetSize":
          newRoleData.roleGroupSizes[action.index] += 1;
          break;
        case "decreaseRolesetSize":
          newRoleData.roleGroupSizes[action.index] = Math.max(
            newRoleData.roleGroupSizes[action.index] - 1,
            1
          );
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
        .get(`/setup/${editSetup || copySetup}`)
        .then((res) => {
          const setup = res.data;

          setEditing(true);

          updateRoleData({
            type: "setFromSetup",
            roles: JSON.parse(setup.roles),
            closed: setup.closed,
            useRoleGroups: setup.useRoleGroups,
            roleGroupSizes: setup.roleGroupSizes,
          });

          const formFieldChanges = [];

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
          ? modifiers.filter((e) => e).join("/")
          : ""
      }`,
      alignment: role.alignment,
    });
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

  const usingRoleGroups = roleData.closed && roleData.useRoleGroups;
  const showAddRoleSet =
    (!roleData.closed && roleData.roles.length < 10) || usingRoleGroups;

  const roleSets = roleData.roles.map((roleSet, i) => {
    const roles = [];

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
        />
      );
    }

    return (
      <>
        {usingRoleGroups && (
          <div className="roleset-size">
            Size:
            <IconButton
              onClick={() => {
                updateRoleData({
                  type: "decreaseRolesetSize",
                  index: i,
                });
              }}
            >
              <i className="fas fa-caret-left" />
            </IconButton>
            <span> {roleData.roleGroupSizes[i]} </span>
            <IconButton
              onClick={() => {
                updateRoleData({
                  type: "increaseRolesetSize",
                  index: i,
                });
              }}
            >
              <i className="fas fa-caret-right" />
            </IconButton>
          </div>
        )}
        <RoleSetRow
          roles={roles}
          index={i}
          sel={selRoleSet}
          onClick={() => setSelRoleSet(i)}
          onDelete={() => {
            updateRoleData({
              type: "removeRoleSet",
              index: i,
            });
          }}
          key={i}
        />
      </>
    );
  });

  const gameModifiers = siteInfo.modifiers ? siteInfo.modifiers[gameType] : [];

  function getCompatibleModifiers(...selectedModifiers) {
    const mappedMods = selectedModifiers.map((e) =>
      gameModifiers.find((x) => x.name === e)
    );
    const incompatibles = mappedMods.map((e) => e.incompatible).flat();
    const modifierOptions = gameModifiers
      .filter((e) => !e.hidden)
      .filter((e) => e.allowDuplicate || !selectedModifiers.includes(e.name))
      .filter((e) => !incompatibles.includes(e.name))
      .map((modifier) => (
        <MenuItem value={modifier.name} key={modifier.name}>
          {modifier.name}
        </MenuItem>
      ));

    modifierOptions.unshift(
      <MenuItem value="" key={"None"}>
        None
      </MenuItem>
    );
    return modifierOptions;
  }

  if (params.get("edit") && !editing) return <NewLoading small />;

  return (
    <Container component={Paper} className="span-panel main create-setup">
      <RoleSearch onAddClick={onAddRole} gameType={gameType} />
      {user.loggedIn && (
        <div className="creation-options">
          <Form
            fields={formFields}
            onChange={updateFormFields}
            submitText={editing ? "Edit" : "Create"}
            onSubmit={() => onCreateSetup(roleData, editing, setRedirect)}
          />
          <div className="rolesets-wrapper">
            <div className="form">
              <div className="modifiers-select">
                <FormControl fullWidth variant="outlined" margin="normal">
                  <InputLabel>Modifier 1</InputLabel>
                  <Select
                    value={modifiers[0] || ""}
                    onChange={(e) => onModifierChange(e, 0)}
                  >
                    {getCompatibleModifiers()}
                  </Select>
                </FormControl>
                {modifiers[0] && (
                  <FormControl fullWidth variant="outlined" margin="normal">
                    <InputLabel>Modifier 2</InputLabel>
                    <Select
                      value={modifiers[1] || ""}
                      onChange={(e) => onModifierChange(e, 1)}
                    >
                      {getCompatibleModifiers(modifiers[0])}
                    </Select>
                  </FormControl>
                )}
                {modifiers[1] && (
                  <FormControl fullWidth variant="outlined" margin="normal">
                    <InputLabel>Modifier 3</InputLabel>
                    <Select
                      value={modifiers[2] || ""}
                      onChange={(e) => onModifierChange(e, 2)}
                    >
                      {getCompatibleModifiers(modifiers[0], modifiers[1])}
                    </Select>
                  </FormControl>
                )}
              </div>
            </div>
            <div className="rolesets">
              {roleSets}
              {showAddRoleSet && (
                <IconButton
                  className="add-roleset"
                  onClick={() => updateRoleData({ type: "addRoleSet" })}
                >
                  <i className="fas fa-plus-circle" />
                </IconButton>
              )}
              {usingRoleGroups && (
                <Typography className="roleset-group-total-size">
                  Total Size:{" "}
                  <span>
                    {" "}
                    {roleData.roleGroupSizes.reduce((a, b) => a + b)}{" "}
                  </span>
                </Typography>
              )}
            </div>
          </div>
        </div>
      )}
      {redirect && <Redirect to={`/play/host/?setup=${redirect}`} />}
    </Container>
  );
}

function RoleSetRow(props) {
  return (
    <div
      className={`roleset ${props.sel === props.index ? "sel" : ""}`}
      onClick={props.onClick}
    >
      {props.roles}
      {props.index > 0 && (
        <IconButton
          className="del-roleset"
          onClick={props.onDelete}
        >
          <i className="fas fa-times-circle" />
        </IconButton>
      )}
      {props.roles.length > 0 && (
        <Typography className={`roleset-counts`}>
          Total: {props.roles.reduce((acc, e) => acc + e.props.count, 0)}
        </Typography>
      )}
    </div>
  );
}