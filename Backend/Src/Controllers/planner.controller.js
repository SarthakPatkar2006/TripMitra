import Trip from "../Models/Trip.js";
import { generateOptimizedPlan } from "../Services/planner.service.js"; // Updated Import
import Itinerary from "../Models/Itinerary.js";
import Activity from "../Models/Activity.js";

export async function generatePlan(req, res) {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found"
      });
    }

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    const totalDays = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    ) + 1;

    // ======================
    // DELETE OLD PLAN HERE
    // ======================
    const existingItineraries = await Itinerary.find({
      tripId: trip._id
    });

    for (const itinerary of existingItineraries) {
      await Activity.deleteMany({
        itineraryId: itinerary._id
      });
    }

    await Itinerary.deleteMany({
      tripId: trip._id
    });

    // ======================
    // GENERATE NEW PLAN
    // ======================
    
    // Construct the payload for our Python engine
    // Assuming budget/interests are either saved on the Trip model or passed in req.body
    const tripData = {
        destination: trip.destination,
        totalDays: totalDays,
        maxBudget: trip.budget || req.body.budget || 5000, 
        interests: trip.interests || req.body.interests || [],
        
        // Ensure you have a starting point (hotel coordinates). 
        // Fallback to city center coordinates if not provided.
        hotelLatitude: trip.hotelLatitude || req.body.hotelLatitude || 0,
        hotelLongitude: trip.hotelLongitude || req.body.hotelLongitude || 0
    };

    // Call the new Python-backed service (Don't forget the 'await'!)
    const optimizedResponse = await generateOptimizedPlan(tripData);
    
    // The Python engine returns { tripSummary: {}, days: [...] }
    const planDays = optimizedResponse.days;

    // ======================
    // SAVE NEW PLAN
    // ======================

    for (const day of planDays) {
      const itinerary = await Itinerary.create({
        tripId: trip._id,
        dayNumber: day.dayNumber,
        date: new Date(
          startDate.getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000
        )
      });

      // NOTE: Our Python engine returns 'route' instead of 'activities'
      for (const activityName of day.route) {
        await Activity.create({
          itineraryId: itinerary._id,
          title: activityName
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Optimized itinerary generated successfully!",
      tripSummary: optimizedResponse.tripSummary,
      plan: planDays
    });

  } catch (error) {
    console.error("Generate Plan Error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error"
    });
  }
}

export async function getTripItinerary(req, res) {
  try {
    const { id } = req.params;

    const itineraries = await Itinerary.find({
      tripId: id
    }).sort({
      dayNumber: 1
    });

    const result = [];

    for (const itinerary of itineraries) {
      const activities = await Activity.find({
        itineraryId: itinerary._id
      });

      result.push({
        dayNumber: itinerary.dayNumber,
        date: itinerary.date,
        activities
      });
    }

    res.status(200).json({
      success: true,
      days: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}