import React, { useState, useEffect, useReducer, useContext } from "react";
import { Redirect, useLocation } from "react-router-dom";
import axios from "axios";

import { UserContext, SiteInfoContext } from "../../../Contexts";
import { RoleCount, RoleSearch } from "../../../components/Roles";
import Form from "../../../components/Form";
import LoadingPage from "../../Loading";
import { useErrorAlert } from "../../../components/Alerts";

import "../../../css/createSetup.css";

export default function CreateSetup(props) {
  const { gameType } = props;
  const { formFields } = props;
  const { updateFormFields } = props;
  const { closedField } = props;
  const useRoleGroupsField = props.useRoleGroupsField || { value: false };
  const { resetFormFields } = props;
  const { formFieldValueMods } = props;
  const { onCreateSetup } = props;

  const errorAlert = useErrorAlert();
  const [selRoleSet, setSelRoleSet] = useState(0);
  const [redirect, setRedirect] = useState("");
  const [editing, setEditing] = useState(false);
  const [modifier, setModifier] = useState("None");

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const siteInfo = useContext(SiteInfoContext);

  const [roleData, updateRoleData] = useReducer(
    (roleData, action) => {
      console.log(action);
      const newRoleData = { ...roleData };

      if (action.type != "reset" && action.type != "setClosed") {
        newRoleData.roles = roleData.roles.slice();

        for (const i in roleData.roles)
          newRoleData.roles[i] = { ...roleData.roles[i] };
      }

      switch (action.type) {
        case "reset":
          newRoleData.roles = [{}];
          newRoleData.roleGroupSizes = [[]];
          break;
        case "setClosed":
          newRoleData.closed = action.closed;

          // change in closed state
          if (action.closed != !roleData.closed) {
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
          // TODO if using rolesets, each roleset must have only one alignment type
          var roleSet = newRoleData.roles[selRoleSet];

          if (!roleSet[action.role]) roleSet[action.role] = 0;

          roleSet[action.role]++;
          break;
        case "removeRole":
          var roleSet = newRoleData.roles[selRoleSet];

          if (roleSet[action.role]) roleSet[action.role]--;

          if (roleSet[action.role] < 1) delete roleSet[action.role];
          break;
        case "addRoleSet":
          newRoleData.roles.push({});
          newRoleData.roleGroupSizes.push(1);
          break;
        case "removeRoleSet":
          newRoleData.roles.splice(action.index, 1);
          newRoleData.roleGroupSizes.splice(action.index, 1);

          if (action.index == selRoleSet) setSelRoleSet(0);
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
          newRoleData.roleGroupSizes = action.roleGroupSizes;
          break;
      }

      return newRoleData;
    },
    { roles: [{}], roleGroupSizes: [1], closed: false }
  );

  const user = useContext(UserContext);

  useEffect(() => {
    updateRoleData({ type: "setClosed", closed: closedField.value });
  }, [closedField.value]);

  useEffect(() => {
    updateRoleData({
      type: "setUseRoleGroups",
      useRoleGroups: useRoleGroupsField.value,
    });
  }, [useRoleGroupsField.value]);

  useEffect(() => {
    if (params.get("edit")) {
      axios
        .get(`/setup/${params.get("edit")}`)
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

          for (const field of formFields) {
            if (setup[field.ref]) {
              let value = setup[field.ref];

              if (formFieldValueMods[field.ref])
                for (const valueMod of formFieldValueMods[field.ref])
                  value = valueMod(value);

              formFieldChanges.push({
                ref: field.ref,
                prop: "value",
                value,
              });
            }
          }

          if (setup.closed) {
            for (const alignment in setup.count) {
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
      role: `${role.name}:${modifier != "None" ? modifier : ""}`,
      alignment: role.alignment,
    });
  }

  function onModifierChange(e) {
    const modifier = e.target.value;
    setModifier(modifier);
  }

  if (editing && !params.get("edit")) {
    setEditing(false);
    resetFormFields();
    updateRoleData({ type: "reset" });
  }

  const usingRoleGroups = roleData.closed && roleData.useRoleGroups;
  const showAddRoleSet =
    (!roleData.closed && roleData.roles.length < 10) || usingRoleGroups;

  let roleSets;

  roleSets = roleData.roles.map((roleSet, i) => {
    const roles = [];

    for (const role in roleSet) {
      roles.push(
        <RoleCount
          role={role}
          count={roleSet[role]}
          gameType={gameType}
          onClick={() => {
            updateRoleData({
              type: "removeRole",
              role,
            });
          }}
          key={role}
        />
      );
    }

    return (
      <>
        {usingRoleGroups && (
          <div className="roleset-size">
            Size:
            <i
              className="fas fa-caret-left"
              onClick={() => {
                updateRoleData({
                  type: "decreaseRolesetSize",
                  index: i,
                });
              }}
            />
            <span> {roleData.roleGroupSizes[i]} </span>
            <i
              className="fas fa-caret-right"
              onClick={() => {
                updateRoleData({
                  type: "increaseRolesetSize",
                  index: i,
                });
              }}
            />
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

  let modifiers = siteInfo.roles ? siteInfo.roles.Modifiers[gameType] : [];

  modifiers = modifiers.map((modifier) => (
    <option value={modifier} key={modifier}>
      {modifier}
    </option>
  ));

  modifiers.unshift(
    <option value="None" key="None">
      None
    </option>
  );

  if (params.get("edit") && !editing) return <LoadingPage />;

  return (
    <div className="span-panel main create-setup">
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
              <div className="field-wrapper">
                <div className="label">Role Modifier</div>
                <select value={modifier} onChange={onModifierChange}>
                  {modifiers}
                </select>
              </div>
            </div>
            <div className="rolesets">
              {roleSets}
              {showAddRoleSet && (
                <i
                  className="add-roleset fa-plus-circle fas"
                  onClick={() => updateRoleData({ type: "addRoleSet" })}
                />
              )}
              {usingRoleGroups && (
                <div className="roleset-group-total-size">
                  Total Size:{" "}
                  <span>
                    {" "}
                    {roleData.roleGroupSizes.reduce((a, b) => a + b)}{" "}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {redirect && <Redirect to={`/play/host/?setup=${redirect}`} />}
    </div>
  );
}

function RoleSetRow(props) {
  return (
    <div
      className={`roleset ${props.sel == props.index ? "sel" : ""}`}
      onClick={props.onClick}
    >
      {props.roles}
      {props.index > 0 && (
        <i
          className="del-roleset fa-times-circle fas"
          onClick={props.onDelete}
        />
      )}
    </div>
  );
}
