import Trip from "../Models/Trip.js";
import TripMember from "../Models/TripMember.js";
export async function createTrip(req, res) {
  try {

    const {
      title,
      destination,
      startDate,
      endDate,
      budget,
      description,
      tripType
    } = req.body;

    if (
      !title ||
      !destination ||
      !startDate ||
      !endDate ||
      !budget
    ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }
    if (budget <= 0) {
  return res.status(400).json({
    message: "Budget must be greater than 0"
  });
}

if (new Date(startDate) > new Date(endDate)) {
  return res.status(400).json({
    message: "Start date cannot be after end date"
  });
}

    const trip = await Trip.create({
      title,
      destination,
      startDate,
      endDate,
      budget,
      description,
      tripType,
      owner: req.user._id
    });
    await TripMember.create({
  tripId: trip._id,
  userId: req.user._id,
  role: "owner"
});

    res.status(201).json({
      success: true,
      trip
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}
export async function getTrips(req, res) {
  try {

    const trips = await Trip.find({
      owner: req.user._id
    }).sort({
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}
export async function getTripById(req, res) {
  try {

    const trip = await Trip.findById(
      req.params.id
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found"
      });
    }

    if (
      trip.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    res.status(200).json({
      success: true,
      trip
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}
export async function updateTrip(req, res) {
  try {

    const trip = await Trip.findById(
      req.params.id
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found"
      });
    }

    if (
      trip.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const updatedTrip =
      await Trip.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    res.status(200).json({
      success: true,
      trip: updatedTrip
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}
export async function deleteTrip(req, res) {
  try {

    const trip = await Trip.findById(
      req.params.id
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found"
      });
    }

    if (
      trip.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}

import User from "../Models/User.js";

export async function getTripMembers(req, res) {
  try {

    const { tripId } = req.params;

    const members =
      await TripMember.find({
        tripId
      }).populate(
        "userId",
        "name email profileImage"
      );

    res.status(200).json({
      success: true,
      count: members.length,
      members
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}