import React, { useContext } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from "@mui/material";
import { hyphenDelimit } from "../../utils";
import { RoleDetails } from "../Roles";
import { UserContext, GameContext } from "../../Contexts";

const RoleRevealModal = ({ open, onClose, roleData, gameType = "Mafia", otherRoles = null }) => {
  const user = useContext(UserContext);
  const gameContext = useContext(GameContext);
  
  if (!roleData) return null;

  const { roleName, modifiers } = roleData;

  // Get other roles from setup data for special interactions
  let otherRolesForSpecialInteractions = otherRoles;
  if (gameContext?.setup?.roles) {
    // Convert setup roles to the format expected by RoleDetails
    const roleSet = {};
    for (const roleGroup of gameContext.setup.roles) {
      for (const role in roleGroup) {
        roleSet[role] = roleGroup[role];
      }
    }
    otherRolesForSpecialInteractions = [roleSet];
  }

  // Determine role skin (same precedence as RoleDetails)
  let roleSkin = null;
  if (user.settings && typeof user.settings.roleSkins == "string") {
    const userRoleSkins = user.settings.roleSkins.split(",");
    const userRoleSkinsMatched = userRoleSkins.filter((s) => s.split(":")[0] == roleName);
    if (userRoleSkinsMatched.length > 0) {
      roleSkin = userRoleSkinsMatched[0].split(":")[1];
    }
  }
  if (roleSkin === null) {
    roleSkin = "vivid";
  }

  const roleClass = `${hyphenDelimit(gameType)}-${hyphenDelimit(roleName)}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          flexWrap: "wrap",
        }}
      >
        <div
          className={`role role-icon-${roleSkin}-${roleClass}`}
          style={{ width: "60px", height: "60px", flexShrink: 0 }}
        />
        <DialogTitle
          sx={{
            p: 0,
            flex: 1,
            fontSize: "1.25rem",
            lineHeight: 1.3,
            fontWeight: 600,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          Your role is {roleName}
        </DialogTitle>
      </Box>

      <DialogContent sx={{ px: 2 }}>
        <RoleDetails
          gameType={gameType}
          roleName={roleName}
          showHeader={false}
          modifiersOverride={modifiers}
          otherRoles={otherRolesForSpecialInteractions}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} color="primary" fullWidth>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleRevealModal;
