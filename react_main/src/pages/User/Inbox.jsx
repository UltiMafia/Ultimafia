import React, { useState, useEffect, useContext } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  IconButton,
  Divider,
  Pagination,
  Chip,
} from "@mui/material";
import unicorn from "images/emotes/unicorn.webp";

import { UserContext, SiteInfoContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { Time } from "components/Basic";
import { NewLoading } from "../Welcome/NewLoading";

import "css/inbox.css";

export default function Inbox() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const navigate = useNavigate();

  useEffect(() => {
    if (user.loaded && user.loggedIn) {
      loadNotifications(1);
    }
  }, [user.loaded, user.loggedIn]);

  const loadNotifications = async (page) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/notifs/inbox?page=${page}`);
      setNotifications(res.data.notifications || []);
      setCurrentPage(res.data.currentPage || 1);
      setTotalPages(res.data.totalPages || 1);
      setTotalNotifications(res.data.totalNotifications || 0);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      errorAlert(err);
      // Set default values on error
      setNotifications([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalNotifications(0);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    loadNotifications(value);
    window.scrollTo(0, 0);
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await axios.post(`/api/notifs/read/${notifId}`);
      // Update local state
      setNotifications((prev) =>
        (prev || []).map((notif) =>
          notif.id === notifId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      siteInfo.showAlert("Marked as read", "success");
    } catch (err) {
      errorAlert(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post("/api/notifs/viewed");
      // Update local state
      setNotifications((prev) =>
        (prev || []).map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      siteInfo.showAlert("All notifications marked as read", "success");
    } catch (err) {
      errorAlert(err);
    }
  };

  const handleDelete = async (notifId) => {
    try {
      await axios.delete(`/api/notifs/${notifId}`);
      // Remove from local state
      setNotifications((prev) => (prev || []).filter((notif) => notif.id !== notifId));
      setTotalNotifications((prev) => Math.max(0, prev - 1));
      siteInfo.showAlert("Notification deleted", "success");
      
      // Reload if we're now on an empty page and it's not page 1
      if (notifications && notifications.length === 1 && currentPage > 1) {
        loadNotifications(currentPage - 1);
      } else if (notifications && notifications.length === 1 && currentPage === 1) {
        loadNotifications(1);
      }
    } catch (err) {
      errorAlert(err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  if (user.loaded && !user.loggedIn) {
    return <Navigate to="/play" />;
  }

  if (!user.loaded || loading) {
    return <NewLoading small />;
  }

  return (
    <Paper
      className="inbox"
      sx={{
        p: 2,
        maxWidth: "900px",
        mx: "auto",
        mt: 2,
      }}
    >
      <Stack direction="column" spacing={2}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h2">Inbox</Typography>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2}>
          <Chip label={`Total: ${totalNotifications}`} variant="outlined" />
          <Chip
            label={`Unread: ${unreadCount}`}
            color={unreadCount > 0 ? "primary" : "default"}
            variant="outlined"
          />
        </Stack>

        <Divider />

        {/* Notifications List */}
        {!notifications || notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <Stack direction="column" spacing={1}>
            {notifications && notifications.map((notif) => (
              <Paper
                key={notif.id}
                sx={{
                  p: 2,
                  backgroundColor: notif.read
                    ? "background.paper"
                    : "action.hover",
                  border: notif.read ? "1px solid" : "2px solid",
                  borderColor: notif.read
                    ? "divider"
                    : "primary.main",
                  cursor: notif.link ? "pointer" : "default",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "action.selected",
                  },
                }}
                onClick={() => handleNotificationClick(notif)}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {/* Icon and Content */}
                  <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                    {notif.icon && (
                      <i
                        className={`fas fa-${notif.icon}`}
                        style={{ fontSize: "20px", minWidth: "20px" }}
                      />
                    )}
                    <Stack direction="column" spacing={0.5} flex={1}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: notif.read ? "normal" : "bold",
                        }}
                      >
                        {notif.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <Time millisec={Date.now() - notif.date} suffix=" ago" />
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={1}>
                    {!notif.read && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        title="Mark as read"
                      >
                        <img src={unicorn} alt="Change Setup" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      title="Delete notification"
                    >
                      <img src={unicorn} alt="Change Setup" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}