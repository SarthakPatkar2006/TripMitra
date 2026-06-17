import Trip from "../Models/Trip.js";
import TripMember from "../Models/TripMember.js";
import Itinerary from "../Models/Itinerary.js";
import Activity from "../Models/Activity.js";
import Invitation from "../Models/Invitation.js";
import Expense from "../Models/Expense.js";
import Notification from "../Models/Notification.js";

const getUserId = (req) => req.user._id || req.user.id;

const isTripOwner = (trip, userId) => trip.owner.toString() === userId.toString();

const canAccessTrip = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);

  if (!trip) {
    return { trip: null, role: "none" };
  }

  if (isTripOwner(trip, userId)) {
    return { trip, role: "owner" };
  }

  const membership = await TripMember.findOne({
    tripId,
    userId,
    status: "accepted"
  });

  return {
    trip,
    role: membership ? membership.role : "none"
  };
};

export const createTrip = async (req, res) => {
  try {
    const {
      title,
      origin,
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      transportPreference,
      accommodationType,
      numberOfTravelers
    } = req.body;

    if (!origin || !destination || !startDate || !endDate || !budget) {
      return res.status(400).json({
        message: "Origin, destination, dates, and budget are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid trip dates" });
    }

    if (end < start) {
      return res.status(400).json({ message: "End date cannot be before start date" });
    }

    const newTrip = await Trip.create({
      title: title?.trim() || `${destination.trim()} Adventure`,
      origin: origin.trim(),
      destination: destination.trim(),
      startDate: start,
      endDate: end,
      budget: Number(budget),
      travelStyle: travelStyle || "balanced",
      transportPreference,
      accommodationType,
      numberOfTravelers,
      owner: req.user._id
    });

    await TripMember.create({
      tripId: newTrip._id,
      userId: req.user._id,
      email: req.user.email,
      role: "owner",
      status: "accepted",
      joinedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip: newTrip
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ message: "Server error creating trip" });
  }
};

export const getTrips = async (req, res) => {
  try {
    const userId = getUserId(req);

    const memberships = await TripMember.find({
      userId,
      status: "accepted"
    }).select("tripId");

    const memberTripIds = memberships.map((member) => member.tripId);

    const trips = await Trip.find({
      $or: [{ owner: userId }, { _id: { $in: memberTripIds } }]
    }).sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    console.error("Error fetching user trips:", error);
    res.status(500).json({ message: "Server error fetching trips" });
  }
};

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { trip, role } = await canAccessTrip(id, userId);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (role === "none") {
      return res.status(403).json({ message: "You are not authorized to view this trip" });
    }

    res.status(200).json({
      success: true,
      trip,
      userRole: role
    });
  } catch (error) {
    console.error("Error fetching trip details:", error);
    res.status(500).json({ message: "Server error fetching trip details" });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!isTripOwner(trip, userId)) {
      return res.status(403).json({ message: "Only the owner can edit this trip" });
    }

    const allowedFields = [
      "title",
      "origin",
      "destination",
      "startDate",
      "endDate",
      "budget",
      "description",
      "tripType",
      "status",
      "travelStyle",
      "transportPreference",
      "accommodationType",
      "numberOfTravelers"
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      trip: updatedTrip
    });
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ message: "Server error updating trip" });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!isTripOwner(trip, userId)) {
      return res.status(403).json({ message: "Only the trip owner can delete this trip" });
    }

    const itineraries = await Itinerary.find({ tripId: id });
    const itineraryIds = itineraries.map((itinerary) => itinerary._id);

    await Activity.deleteMany({ itineraryId: { $in: itineraryIds } });
    await Itinerary.deleteMany({ tripId: id });
    await TripMember.deleteMany({ tripId: id });
    await Invitation.deleteMany({ tripId: id });
    await Expense.deleteMany({ tripId: id });
    await Notification.deleteMany({ tripId: id });
    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: "Trip completely deleted"
    });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ message: "Server error deleting trip" });
  }
};

export const getTripMembers = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = getUserId(req);
    const { trip, role } = await canAccessTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (role === "none") {
      return res.status(403).json({ message: "You are not authorized to view members" });
    }

    const members = await TripMember.find({ tripId })
      .populate("userId", "name email")
      .sort({ role: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    console.error("Error fetching trip members:", error);
    res.status(500).json({ message: "Server error fetching trip members" });
  }
};
