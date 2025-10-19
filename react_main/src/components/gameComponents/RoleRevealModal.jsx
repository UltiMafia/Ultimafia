import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { hyphenDelimit } from "../../utils";
import { RoleDetails } from "../Roles";

const RoleRevealModal = ({
  open,
  onClose,
  roleData,
  gameType = "Mafia",
  otherRoles = null,
}) => {
  if (!roleData) return null;

  const { roleName, modifiers } = roleData;

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
          className={`role role-icon-vivid-${roleClass}`}
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
          otherRoles={otherRoles}
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
