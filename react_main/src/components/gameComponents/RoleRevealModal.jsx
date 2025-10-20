import React, { useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { hyphenDelimit } from "../../utils";
import { RoleDetails } from "../Roles";
import { UserContext, GameContext } from "../../Contexts";

const RoleRevealModal = ({
  open,
  onClose,
  roleData,
  gameType = "Mafia",
  otherRoles = null,
}) => {
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
    const userRoleSkinsMatched = userRoleSkins.filter(
      (s) => s.split(":")[0] == roleName
    );
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
          pb: 1, // Reduced bottom padding
          flexWrap: "wrap",
        }}
      >
        <div
          className={`role role-icon-${roleSkin}-${roleClass}`}
          style={{ width: "60px", height: "60px", flexShrink: 0 }}
        />
        <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            fontStyle="italic"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 2,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              fontWeight: 400, // Removed bold
            }}
          >
            Your role is
          </Typography>
          <DialogTitle
            sx={{
              p: 0,
              width: "100%",
              fontSize: "1.25rem",
              lineHeight: 1.3,
              fontWeight: 600,
              whiteSpace: "normal",
              wordBreak: "break-word",
              pt: "1.6rem",
            }}
          >
            {roleName}
          </DialogTitle>
        </Box>
      </Box>

      <DialogContent sx={{ px: 2, py: 1 }}>
        <RoleDetails
          gameType={gameType}
          roleName={roleName}
          showHeader={false}
          modifiersOverride={modifiers}
          otherRoles={otherRolesForSpecialInteractions}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 1 }}>
        <Button onClick={onClose} color="primary" fullWidth>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleRevealModal;
