import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";

import {
  Box,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

export default function AdminVisuals({ profileUserId }) {
  const [isFlagged, setIsFlagged] = useState(false);
  const [altAccountsAnchor, setAltAccountsAnchor] = useState(null);
  const [altAccounts, setAltAccounts] = useState([]);
  const [altAccountsLoading, setAltAccountsLoading] = useState(false);
  const [ipAddressesAnchor, setIpAddressesAnchor] = useState(null);
  const [ipAddresses, setIpAddresses] = useState([]);
  const [ipAddressesLoading, setIpAddressesLoading] = useState(false);
  const [activeBansAnchor, setActiveBansAnchor] = useState(null);
  const [activeBans, setActiveBans] = useState([]);
  const [activeBansLoading, setActiveBansLoading] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const isSelf = profileUserId === user.id;
  const canViewFlagged = user.perms.viewFlagged;
  const canViewAlts = user.perms.viewAlts;
  const canViewIPs = user.perms.viewIPs;
  const canViewBans = user.perms.seeModPanel;

  const shouldRender =
    !isSelf &&
    user.loggedIn &&
    (canViewFlagged || canViewAlts || canViewIPs || canViewBans);

  useEffect(() => {
    if (!user.loggedIn || isSelf || !canViewFlagged || !profileUserId) return;

    let active = true;
    let intervalId = null;
    const fetchFlaggedStatus = () => {
      axios
        .get(`/api/mod/flagged?userId=${profileUserId}`)
        .then((res) => {
          if (!active) return;

          const flagged =
            typeof res.data === "object" && res.data !== null
              ? res.data.flagged === true
              : res.data === true;
          setIsFlagged(flagged);
        })
        .catch((e) => {
          if (active) errorAlert(e);
        });
    };

    fetchFlaggedStatus();
    intervalId = window.setInterval(fetchFlaggedStatus, 15000);

    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [canViewFlagged, errorAlert, isSelf, profileUserId, user.loggedIn]);

  useEffect(() => {
    if (!user.loggedIn || isSelf || !canViewBans || !profileUserId) return;

    let active = true;
    axios
      .get(`/api/mod/bans?userId=${profileUserId}`)
      .then((res) => {
        if (!active) return;
        setActiveBans(res.data || []);
      })
      .catch(() => {
        // Silently fail - bans will be loaded on click if needed
      });

    return () => {
      active = false;
    };
  }, [canViewBans, isSelf, profileUserId, user.loggedIn]);

  function onAltAccountsClick(event) {
    if (!canViewAlts) return;

    setAltAccountsAnchor(event.currentTarget);
    loadAltAccounts();
  }

  function onAltAccountsClose() {
    setAltAccountsAnchor(null);
    setAltAccounts([]);
  }

  function loadAltAccounts() {
    if (!profileUserId || altAccountsLoading) return;

    setAltAccountsLoading(true);
    axios
      .get(`/api/mod/alts?userId=${profileUserId}`)
      .then((res) => {
        setAltAccounts(res.data || []);
        setAltAccountsLoading(false);
      })
      .catch((e) => {
        errorAlert(e);
        setAltAccountsLoading(false);
        setAltAccountsAnchor(null);
      });
  }

  function onIpAddressesClick(event) {
    if (!canViewIPs) return;

    setIpAddressesAnchor(event.currentTarget);
    loadIpAddresses();
  }

  function onIpAddressesClose() {
    setIpAddressesAnchor(null);
    setIpAddresses([]);
  }

  function loadIpAddresses() {
    if (!profileUserId || ipAddressesLoading) return;

    setIpAddressesLoading(true);
    axios
      .get(`/api/mod/ips?userId=${profileUserId}`)
      .then((res) => {
        const seen = new Set();
        const formattedIps = (res.data || [])
          .map((entry) => {
            if (typeof entry !== "string") return null;

            const hrefMatch = entry.match(/href="([^"]+)"/i);
            const labelMatch = entry.match(/>([^<]+)</);
            const rawValue = (labelMatch?.[1] || entry.replace(/<[^>]*>/g, ""))
              .trim()
              .replace(/^"+|"+$/g, "");

            if (!rawValue || seen.has(rawValue)) return null;
            seen.add(rawValue);

            return {
              ip: rawValue,
              href:
                hrefMatch?.[1] ||
                `https://www.ipqualityscore.com/free-ip-lookup-proxy-vpn-test/lookup/${encodeURIComponent(
                  rawValue
                )}`,
            };
          })
          .filter(Boolean);

        setIpAddresses(formattedIps);
        setIpAddressesLoading(false);
      })
      .catch((e) => {
        errorAlert(e);
        setIpAddressesLoading(false);
        setIpAddressesAnchor(null);
      });
  }

  function onActiveBansClick(event) {
    if (!canViewBans) return;

    setActiveBansAnchor(event.currentTarget);
    loadActiveBans();
  }

  function onActiveBansClose() {
    setActiveBansAnchor(null);
    setActiveBans([]);
  }

  function loadActiveBans() {
    if (!profileUserId || activeBansLoading) return;

    setActiveBansLoading(true);
    axios
      .get(`/api/mod/bans?userId=${profileUserId}`)
      .then((res) => {
        setActiveBans(res.data || []);
        setActiveBansLoading(false);
      })
      .catch((e) => {
        errorAlert(e);
        setActiveBansLoading(false);
        setActiveBansAnchor(null);
      });
  }

  if (!shouldRender) return null;

  return (
    <>
      <Stack direction="row" className="options">
        {canViewFlagged && (
          <Tooltip
            title={isFlagged ? "User is flagged" : "User is not flagged"}
          >
            <IconButton size="small" aria-label="user flagged status">
              <i
                className="fas fa-flag"
                style={{
                  color: "#d32f2f",
                  opacity: isFlagged ? 1 : 0.35,
                }}
              />
            </IconButton>
          </Tooltip>
        )}
        {canViewBans && (
          <Tooltip
            title={
              activeBans.length > 0
                ? `User has ${activeBans.length} active ban(s)`
                : "No active bans"
            }
          >
            <IconButton
              size="small"
              aria-label="view active bans"
              onClick={onActiveBansClick}
            >
              <i
                className="fas fa-gavel"
                style={{
                  color: "#ed6c02",
                  opacity: activeBans.length > 0 ? 1 : 0.35,
                }}
              />
            </IconButton>
          </Tooltip>
        )}
        {canViewAlts && (
          <Tooltip title="View linked accounts">
            <IconButton
              size="small"
              aria-label="view linked accounts"
              onClick={onAltAccountsClick}
            >
              <i className="fas fa-users" />
            </IconButton>
          </Tooltip>
        )}
        {canViewIPs && (
          <Tooltip title="View IP addresses">
            <IconButton
              size="small"
              aria-label="view ip addresses"
              onClick={onIpAddressesClick}
            >
              <i className="fas fa-globe" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Popover
        open={Boolean(altAccountsAnchor)}
        anchorEl={altAccountsAnchor}
        onClose={onAltAccountsClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box
          sx={{
            p: 2,
            minWidth: 300,
            maxWidth: 400,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Linked Accounts
          </Typography>
          {altAccountsLoading ? (
            <Typography variant="body2" color="textSecondary">
              Loading...
            </Typography>
          ) : altAccounts.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No linked accounts found.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {altAccounts.map((account) => (
                <Box key={account.id}>
                  <Typography
                    component={Link}
                    to={`/user/${account.id}`}
                    variant="body2"
                    sx={{
                      color: "primary.main",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {account.name} ({account.id})
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>

      <Popover
        open={Boolean(ipAddressesAnchor)}
        anchorEl={ipAddressesAnchor}
        onClose={onIpAddressesClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box
          sx={{
            p: 2,
            minWidth: 300,
            maxWidth: 400,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            IP Addresses
          </Typography>
          {ipAddressesLoading ? (
            <Typography variant="body2" color="textSecondary">
              Loading...
            </Typography>
          ) : ipAddresses.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No IP addresses found.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {ipAddresses.map((entry) => (
                <Box key={entry.ip}>
                  <Typography
                    component="a"
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    variant="body2"
                    sx={{
                      color: "primary.main",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {entry.ip}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>

      <Popover
        open={Boolean(activeBansAnchor)}
        anchorEl={activeBansAnchor}
        onClose={onActiveBansClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box
          sx={{
            p: 2,
            minWidth: 300,
            maxWidth: 400,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Active Bans
          </Typography>
          {activeBansLoading ? (
            <Typography variant="body2" color="textSecondary">
              Loading...
            </Typography>
          ) : activeBans.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No active bans.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {activeBans.map((ban, index) => (
                <Box key={index}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: ban.permanent ? "error.main" : "warning.main",
                    }}
                  >
                    {ban.type} Ban
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {ban.permanent
                      ? "Permanent"
                      : `Expires: ${new Date(ban.expires).toLocaleString()}`}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>
    </>
  );
}
