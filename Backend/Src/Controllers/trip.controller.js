import Trip from "../Models/Trip.js";
import TripMember from "../Models/TripMember.js";
import User from "../Models/User.js"; // Moved to the top for clean imports

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

    if (!title || !destination || !startDate || !endDate || !budget) {
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

    // Automatically make the creator the owner in the TripMember table
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
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getTrips(req, res) {
  try {
    // 1. Find ALL memberships for this user (both owner and member roles)
    const memberships = await TripMember.find({ userId: req.user._id });

    // 2. Extract just the trip IDs into an array
    const tripIds = memberships.map((membership) => membership.tripId);

    // 3. Find all trips that match those IDs
    const trips = await Trip.find({
      _id: { $in: tripIds }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getTripById(req, res) {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Check if they are in the TripMember table (allows both owners and invited friends)
    const isMember = await TripMember.findOne({
      tripId: trip._id,
      userId: req.user._id
    });

    if (!isMember) {
      return res.status(403).json({
        message: "Access denied. You are not a member of this trip."
      });
    }

    res.status(200).json({
      success: true,
      trip
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateTrip(req, res) {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Only the owner should be allowed to edit the trip details
    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Only the trip owner can update." });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
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
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteTrip(req, res) {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Only the owner should be allowed to delete the trip
    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Only the trip owner can delete." });
    }

    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getTripMembers(req, res) {
  try {
    const { tripId } = req.params;

    const members = await TripMember.find({ tripId }).populate(
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
    res.status(500).json({ message: "Internal Server Error" });
  }
}