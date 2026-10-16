import React, { useRef, useCallback, useMemo } from "react";
import { usePopover, InfoPopover } from "components/Popover";
import { getKeyboardActivationProps } from "utils/keyboard";
import { roleMarkerSetupSource, roleMarkerRoles } from "lib/roleMarkerSetup";

export default function RoleMarkerToggle({
  playerId,
  setup,
  toggleRolePrediction,
}) {
  const roleMarkerRef = useRef();

  const makeRolePrediction = useCallback(
    (prediction) => {
      toggleRolePrediction(playerId, prediction);
      closePopover();
    },
    [playerId, toggleRolePrediction]
  );

  // Tutorial (and any in-memory) setups are not in the DB, so prefer the
  // setup object already on the game. Fall back to the API for normal games.
  const setupPath = useMemo(() => roleMarkerSetupSource(setup), [setup]);

  const popoverProps = usePopover({
    path: setupPath,
    type: "rolePrediction",
    boundingEl: roleMarkerRef.current,
    postprocessData: (data) => {
      data.roles = roleMarkerRoles(data.roles);
      data.makeRolePrediction = makeRolePrediction;
    },
  });
  const { handleClick, closePopover } = popoverProps;

  return (
    <>
      <InfoPopover {...popoverProps} title={"Mark Role as"} />
      <div
        className="role-marker"
        ref={roleMarkerRef}
        onClick={handleClick}
        {...getKeyboardActivationProps(handleClick, {
          ariaLabel: "Mark player role",
          ariaHaspopup: true,
        })}
        style={{
          cursor: "pointer",
        }}
      >
        <i className="fas fa-user-edit" />
      </div>
    </>
  );
}
