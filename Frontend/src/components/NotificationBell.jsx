import {
  useEffect,
  useState
} from "react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../api/notificationApi";

import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [open, setOpen] =
    useState(false);

  const getIcon = (type) => {
    switch (type) {
      case "invite_received":
        return "📩";

      case "invite_accepted":
        return "👥";

      case "expense_added":
        return "💰";

      case "removed_from_trip":
        return "🚫";

      case "trip_update":
        return "✈️";

      default:
        return "🔔";
    }
  };

  const fetchNotifications =
    async () => {
      try {
        const res =
          await getNotifications();

        setNotifications(
          res.data.notifications
        );

        setUnreadCount(
          res.data.unreadCount
        );
      } catch (error) {
        console.error(
          "Fetch notifications error:",
          error
        );
      }
    };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRead =
    async (notificationId) => {
      try {
        const clickedNotification =
          notifications.find(
            (n) =>
              n._id ===
              notificationId
          );

        if (
          !clickedNotification
        ) {
          return;
        }

        if (
          !clickedNotification.isRead
        ) {
          await markNotificationRead(
            notificationId
          );

          setUnreadCount(
            (prev) =>
              Math.max(
                prev - 1,
                0
              )
          );
        }

        setNotifications(
          (prev) =>
            prev.map((n) =>
              n._id ===
              notificationId
                ? {
                    ...n,
                    isRead: true
                  }
                : n
            )
        );
      } catch (error) {
        console.error(
          "Mark notification error:",
          error
        );
      }
    };

  const handleReadAll =
    async (e) => {
      if (e) {
        e.stopPropagation();
      }

      try {
        await markAllNotificationsRead();

        setNotifications(
          (prev) =>
            prev.map(
              (
                notification
              ) => ({
                ...notification,
                isRead: true
              })
            )
        );

        setUnreadCount(0);
      } catch (error) {
        console.error(
          "Mark all notifications error:",
          error
        );
      }
    };

  return (
    <div className="notification-container">
      <button
        className="notification-btn"
        onClick={() =>
          setOpen(
            !open
          )
        }
      >
        🔔

        {unreadCount >
          0 && (
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>
              Notifications
            </h4>

            {unreadCount >
              0 && (
              <button
                type="button"
                onClick={
                  handleReadAll
                }
              >
                Mark All Read
              </button>
            )}
          </div>

          {notifications.length ===
          0 ? (
            <p>
              No notifications
            </p>
          ) : (
            notifications.map(
              (
                notification
              ) => (
                <div
                  key={
                    notification._id
                  }
                  className={`notification-item ${
                    notification.isRead
                      ? ""
                      : "unread"
                  }`}
                  onClick={() =>
                    handleRead(
                      notification._id
                    )
                  }
                >
                  <p className="notification-message">
                    <span className="notification-icon">
                      {getIcon(
                        notification.type
                      )}
                    </span>

                    {
                      notification.message
                    }
                  </p>

                  <small>
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </small>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}