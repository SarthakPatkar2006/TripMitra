import Notification from "../Models/Notification.js";

// Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id
    })
      .populate("tripId", "title")
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Mark single notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        isRead: true
      },
      {
        new: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Mark notification error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Mark all notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};