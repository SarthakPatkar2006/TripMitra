import {
  createDayService,
  getTripDaysService,
  getDayService,
  updateDayService,
  deleteDayService
} from "../Services/itinerary.service.js";

export const createDay = async (
  req,
  res
) => {
  try {
    const {
      tripId,
      dayNumber,
      date,
      notes
    } = req.body;

    const day =
      await createDayService({
        tripId,
        dayNumber,
        date,
        notes
      });

    res.status(201).json({
      success: true,
      day
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTripDays = async (
  req,
  res
) => {
  try {
    const days =
      await getTripDaysService(
        req.params.tripId
      );

    res.json({
      success: true,
      days
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDay = async (
  req,
  res
) => {
  try {
    const day =
      await getDayService(
        req.params.id
      );

    if (!day) {
      return res.status(404).json({
        message: "Day not found"
      });
    }

    res.json({
      success: true,
      day
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const updateDay = async (
  req,
  res
) => {
  try {
    const day =
      await updateDayService(
        req.params.id,
        req.body
      );

    if (!day) {
      return res.status(404).json({
        message: "Day not found"
      });
    }

    res.json({
      success: true,
      day
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const deleteDay = async (
  req,
  res
) => {
  try {
    const day =
      await deleteDayService(
        req.params.id
      );

    if (!day) {
      return res.status(404).json({
        message: "Day not found"
      });
    }

    res.json({
      success: true,
      message:
        "Day deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};