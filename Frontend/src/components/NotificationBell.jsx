import { useEffect, useRef, useState } from "react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from "../api/notificationApi";

import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const getIcon = (type) => {
    switch (type) {
      case "invite_received":
        return "📩";
      case "invite_accepted":
        return "👥";
      case "expense_added":
        return "💰";
      case "expense_settled":
        return "💸";
      case "trip_update":
        return "✈️";
      case "trip_reminder":
        return "⏰";
      case "itinerary_updated":
        return "🗺️";
      case "removed_from_trip":
        return "🚫";
      default:
        return "🔔";
    }
  };

  // Maps each notification type to one of 5 accent themes so the
  // colored rail + icon chip stay visually distinct and meaningful.
  const getAccent = (type) => {
    switch (type) {
      case "invite_received":
      case "invite_accepted":
        return "accent-teal";
      case "expense_added":
      case "expense_settled":
        return "accent-sand";
      case "trip_update":
      case "itinerary_updated":
        return "accent-coral";
      case "trip_reminder":
        return "accent-berry";
      case "removed_from_trip":
        return "accent-slate";
      default:
        return "accent-teal";
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Fetch notifications error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRead = async (notificationId) => {
    try {
      const notification = notifications.find(
        (n) => n._id === notificationId
      );

      if (!notification) return;

      if (!notification.isRead) {
        await markNotificationRead(notificationId);
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Mark notification error:", error);
    }
  };

  const handleReadAll = async (e) => {
    e.stopPropagation();

    try {
      await markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications error:", error);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();

    try {
      await deleteNotification(notificationId);

      const deleted = notifications.find((n) => n._id === notificationId);

      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  return (
    <div ref={dropdownRef} className="notification-container">
      <button
        className={`notification-btn ${open ? "is-open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div className="header-title-group">
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <span className="unread-pill">{unreadCount} new</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-btn"
                onClick={handleReadAll}
              >
                ✓ Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-emoji">🌤️</span>
                <p>You're all caught up</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${getAccent(
                    notification.type
                  )} ${notification.isRead ? "" : "unread"}`}
                  onClick={() => handleRead(notification._id)}
                >
                  <div className="notification-icon-chip">
                    {getIcon(notification.type)}
                  </div>

                  <div className="notification-body">
                    <div className="notification-top">
                      <p className="notification-message">
                        {notification.message}
                      </p>

                      <button
                        className="notification-delete"
                        onClick={(e) => handleDelete(e, notification._id)}
                        aria-label="Delete notification"
                      >
                        ✕
                      </button>
                    </div>

                    <small className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>

                  {!notification.isRead && (
                    <span className="unread-dot"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}