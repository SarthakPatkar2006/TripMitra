import Notification from "../Models/Notification.js";

// 1. Get all notifications for the logged-in user
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch them sorted by newest first
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 2. Mark a specific notification as Read
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};