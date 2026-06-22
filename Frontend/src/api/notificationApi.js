import api from "./axiosInstance";

export const getNotifications =
  () =>
    api.get(
      "/notifications"
    );

export const markNotificationRead =
  (
    notificationId
  ) =>
    api.patch(
      `/notifications/${notificationId}/read`
    );

export const markAllNotificationsRead =
  () =>
    api.patch(
      "/notifications/read-all"
    );

export const deleteNotification =
  (
    notificationId
  ) =>
    api.delete(
      `/notifications/${notificationId}`
    );