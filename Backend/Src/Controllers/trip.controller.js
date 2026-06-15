import Trip from "../Models/Trip.js";
import TripMember from "../Models/TripMember.js";
import Itinerary from "../Models/Itinerary.js";
import Activity from "../Models/Activity.js";

// 1. Create a new trip
export const createTrip = async (req, res) => {
  try {
    const { title, origin, destination, startDate, endDate, budget, travelStyle } = req.body;

    if (!origin || !destination || !startDate || !endDate) {
      return res.status(400).json({ message: "Origin, destination, and dates are required" });
    }

    const newTrip = await Trip.create({
      title: title || `${destination} Adventure`,
      origin,
      destination,
      startDate,
      endDate,
      budget,
      travelStyle: travelStyle || 'balanced',
      owner: req.user._id // <--- FIXED: Changed from ownerId to owner
    });

    await TripMember.create({
      tripId: newTrip._id,
      userId: req.user._id,
      role: 'owner',
      status: 'accepted'
    });

    res.status(201).json({ success: true, message: "Trip created successfully", trip: newTrip });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ message: "Server error creating trip" });
  }
};

// 2. Get all trips for the logged-in user
// 2. Get all trips for the logged-in user
export const getTrips = async (req, res) => {
  try {
    // Safely get the user ID regardless of how your Auth middleware formats it
    const userId = req.user._id || req.user.id;

    // Fetch the trips directly from the Trip collection where you are the owner!
    const trips = await Trip.find({ owner: userId }).sort({ startDate: 1 });

    res.status(200).json({ success: true, count: trips.length, trips });
  } catch (error) {
    console.error("Error fetching user trips:", error);
    res.status(500).json({ message: "Server error fetching trips" });
  }
};

// 3. Get a single trip's details
// 3. Get a single trip's details
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id; // Safely get user ID

    // 1. Find the trip first
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    let userRole = 'none';

    // 2. Check if the logged-in user is the Owner
    if (trip.owner.toString() === userId.toString()) {
      userRole = 'owner';
    } else {
      // 3. If not the owner, check if they are an invited guest
      const membership = await TripMember.findOne({ 
        tripId: id, 
        userId: userId, 
        status: 'accepted' 
      });
      
      if (membership) {
        userRole = membership.role;
      }
    }

    // 4. If they are neither the owner nor a guest, block them
    if (userRole === 'none') {
      return res.status(403).json({ message: "You are not authorized to view this trip" });
    }

    // 5. Success! Send the data back to React
    res.status(200).json({ success: true, trip, userRole });

  } catch (error) {
    console.error("Error fetching trip details:", error);
    res.status(500).json({ message: "Server error fetching trip details" });
  }
};

// 4. Delete a trip
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id);

    if (!trip) return res.status(404).json({ message: "Trip not found" });
    
    // <--- FIXED: Changed from trip.ownerId to trip.owner
    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the trip owner can delete this trip" });
    }

    await TripMember.deleteMany({ tripId: id });
    const itineraries = await Itinerary.find({ tripId: id });
    const itineraryIds = itineraries.map(it => it._id);
    await Activity.deleteMany({ itineraryId: { $in: itineraryIds } });
    await Itinerary.deleteMany({ tripId: id });
    await trip.deleteOne();

    res.status(200).json({ success: true, message: "Trip completely deleted" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ message: "Server error deleting trip" });
  }
};

// 5. Get trip members
export const getTripMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const members = await TripMember.find({ tripId: id }).populate('userId', 'name email');
    res.status(200).json({ success: true, count: members.length, members });
  } catch (error) {
    console.error("Error fetching trip members:", error);
    res.status(500).json({ message: "Server error fetching trip members" });
  }
};
// 6. Update a trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id);
    
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    
    // Security check: only the owner can update the trip parameters
    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the owner can edit this trip" });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ message: "Server error updating trip" });
  }
};