import React from "react";
import { Button } from "@mui/material";
import { AppleLogo } from "./SignInWithAppleButton";
import GoogleIcon from "../images/welcome_page/GoogleIcon.png";

// Sign-in buttons in the Apple button's shape (40px tall, 6px corners,
// system font, logo on the left), each in its provider's colors: Google
// white with the standard G and a light border, Discord blurple.
export const PROVIDER_STYLES = {
  apple: { bg: "#000", fg: "#fff", border: "#000", hover: "#1a1a1a" },
  discord: { bg: "#5865F2", fg: "#fff", border: "#5865F2", hover: "#4752C4" },
  google: { bg: "#fff", fg: "#1f1f1f", border: "#dadce0", hover: "#f2f2f2" },
};

function Logo({ provider }) {
  if (provider === "apple") return <AppleLogo />;
  if (provider === "google")
    return (
      <img
        src={GoogleIcon}
        alt=""
        aria-hidden="true"
        width={18}
        height={18}
        style={{ marginRight: 8, flex: "none" }}
      />
    );
  if (provider === "discord")
    return (
      <i
        className="fab fa-discord"
        aria-hidden="true"
        style={{ marginRight: 8, fontSize: 18, flex: "none" }}
      />
    );
  return null;
}

export default function ProviderButton({
  provider,
  onClick,
  disabled,
  children,
  sx,
}) {
  const c = PROVIDER_STYLES[provider] || PROVIDER_STYLES.google;
  return (
    <Button
      fullWidth
      onClick={onClick}
      disabled={disabled}
      data-provider={provider}
      sx={{
        height: 40,
        px: 2,
        backgroundColor: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        borderRadius: "6px",
        textTransform: "none",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: "16px",
        fontWeight: 500,
        letterSpacing: 0,
        "&:hover": { backgroundColor: c.hover },
        "&.Mui-disabled": { backgroundColor: c.bg, color: c.fg, opacity: 0.5 },
        ...sx,
      }}
    >
      <Logo provider={provider} />
      {children}
    </Button>
  );
}
