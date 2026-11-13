import React, { useState, useEffect, useContext, useRef } from "react";
import { UiPage, UiList, UiListItem } from "components/ui";
import { Link } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import axios from "axios";

import {
  Box,
  Typography,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { PageNav } from "components/Nav";

import { UserContext, SiteInfoContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { PageSkeleton } from "components/Skeletons";
import UiAction from "../../components/ui/UiAction";
import UiIcon from "../../components/ui/UiIcon";

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

  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (user.loaded && user.loggedIn) {
      loadNotifications(1);
    }
  }, [user.loaded, user.loggedIn]);

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      const unreadIds = (notificationsRef.current || [])
        .filter((n) => !n.read)
        .map((n) => n.id);
      if (unreadIds.length === 0) return;

      try {
        await axios.post("/api/notifs/read", { ids: unreadIds });
        setNotifications((prev) =>
          (prev || []).map((notif) =>
            unreadIds.includes(notif.id) ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - unreadIds.length));
        siteInfo.refreshNotifs();
      } catch (err) {
        errorAlert(err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentPage, loading]);

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
      siteInfo.refreshNotifs();
      siteInfo.showAlert("Marked as read", "success");
    } catch (err) {
      errorAlert(err);
    }
  };

  const handleDelete = async (notifId) => {
    try {
      await axios.delete(`/api/notifs/${notifId}`);
      // Remove from local state
      setNotifications((prev) =>
        (prev || []).filter((notif) => notif.id !== notifId)
      );
      setTotalNotifications((prev) => Math.max(0, prev - 1));
      siteInfo.refreshNotifs();
      siteInfo.showAlert("Notification deleted", "success");

      // Reload if we're now on an empty page and it's not page 1
      if (notifications && notifications.length === 1 && currentPage > 1) {
        loadNotifications(currentPage - 1);
      } else if (
        notifications &&
        notifications.length === 1 &&
        currentPage === 1
      ) {
        loadNotifications(1);
      }
    } catch (err) {
      errorAlert(err);
    }
  };

  if (user.loaded && !user.loggedIn) {
    return <Navigate to="/play" />;
  }

  if (!user.loaded || loading) {
    return <PageSkeleton />;
  }

  return (
    <UiPage title="Notifications" className="inbox" width="reading">
      <Stack direction="column" spacing={2}>
        <Stack direction="row" spacing={2}>
          <Chip label={`Total: ${totalNotifications}`} variant="outlined" />
          <Chip
            label={`Unread: ${unreadCount}`}
            color={unreadCount > 0 ? "primary" : "default"}
            variant="outlined"
          />
        </Stack>

        <Divider />

        {!notifications || notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <UiList aria-label="Notifications">
            {notifications &&
              notifications.map((notif) => (
                <UiListItem
                  key={notif.id}
                  className="notification-row"
                  data-unread={!notif.read || undefined}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    {/* Icon and Content */}
                    <Stack
                      component={notif.link ? Link : "div"} to={notif.link || undefined}
                      onClick={() => { if (notif.link && !notif.read) handleMarkAsRead(notif.id); }}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      flex={1}
                      sx={{ minWidth: 0, color: "inherit", textDecoration: "none" }}
                    >
                      {notif.icon && (
                          <UiIcon name="notification" size={20} />
                      )}
                      <Stack direction="column" spacing={0.5} flex={1}>
                        {!notif.read && <span className="notification-unread">Unread</span>}
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: notif.read ? "normal" : "bold",
                          }}
                        >
                          {notif.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notif.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={0}>
                      {!notif.read && (
                        <UiAction iconOnly variant="ghost" aria-label="Mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          title="Mark as read"
                        >
                          <UiIcon name="check" size={18} />
                        </UiAction>
                      )}
                      <UiAction iconOnly variant="ghost" aria-label="Delete notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif.id);
                        }}
                        title="Delete notification"
                      >
                        <UiIcon name="delete" size={18} />
                      </UiAction>
                    </Stack>
                  </Stack>
                </UiListItem>
              ))}
          </UiList>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <PageNav
              maxPage={totalPages}
              page={currentPage}
              onNav={(newPage) => setCurrentPage(newPage)}
            />
          </Box>
        )}
      </Stack>
    </UiPage>
  );
}
