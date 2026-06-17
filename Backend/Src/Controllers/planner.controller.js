import axios from "axios";
import Trip from "../Models/Trip.js";
import TripMember from "../Models/TripMember.js";
import Itinerary from "../Models/Itinerary.js";
import Activity from "../Models/Activity.js";

const getUserId = (req) => req.user._id || req.user.id;

const getDailyTimeLimit = (travelStyle) => {
  if (travelStyle === "packed") return 600;
  if (travelStyle === "relaxed") return 300;
  return 480;
};

const userCanAccessTrip = async (trip, userId) => {
  if (trip.owner.toString() === userId.toString()) {
    return true;
  }

  const membership = await TripMember.findOne({
    tripId: trip._id,
    userId,
    status: "accepted"
  });

  return Boolean(membership);
};

const buildFallbackItinerary = (attractions, totalDays) => {
  const days = [];
  let cursor = 0;

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
    const route = attractions.slice(cursor, cursor + 3).map((attraction) => attraction.name);
    days.push({ dayNumber, route });
    cursor += 3;
  }

  return { days };
};

export const getTripItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const existingDays = await Itinerary.find({ tripId: id }).sort({ dayNumber: 1 });
    if (existingDays.length > 0) {
      const fullItinerary = await Promise.all(
        existingDays.map(async (day) => {
          const activities = await Activity.find({ itineraryId: day._id }).sort({ createdAt: 1 });
          return { ...day.toObject(), activities };
        })
      );

      return res.status(200).json({
        success: true,
        days: fullItinerary
      });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const hasAccess = await userCanAccessTrip(trip, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "You are not authorized to generate this itinerary" });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Server missing Geoapify API key" });
    }

    const geoResponse = await axios.get("https://api.geoapify.com/v1/geocode/search", {
      params: {
        text: trip.destination,
        format: "json",
        apiKey
      }
    });

    if (!geoResponse.data.results?.length) {
      return res.status(400).json({ message: "Could not find that destination on the map" });
    }

    const cityLat = geoResponse.data.results[0].lat;
    const cityLon = geoResponse.data.results[0].lon;

    const placesResponse = await axios.get("https://api.geoapify.com/v2/places", {
      params: {
        categories: "tourism,entertainment,catering.restaurant",
        filter: `circle:${cityLon},${cityLat},10000`,
        limit: 25,
        apiKey
      }
    });

    const realAttractions = (placesResponse.data.features || [])
      .filter((feature) => feature.properties?.name && feature.properties?.lat && feature.properties?.lon)
      .map((feature) => ({
        name: feature.properties.name,
        categories: feature.properties.categories || ["tourism"],
        average_cost: Math.floor(Math.random() * 2000) + 200,
        estimated_duration: Math.floor(Math.random() * 120) + 60,
        rating: Number((Math.random() * 1.5 + 3.5).toFixed(1)),
        popularity_score: Math.floor(Math.random() * 40) + 60,
        latitude: feature.properties.lat,
        longitude: feature.properties.lon
      }));

    if (realAttractions.length === 0) {
      return res.status(400).json({ message: "No attractions found near this destination" });
    }

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const pythonPayload = {
      preferences: {
        max_budget: trip.budget,
        interests: ["tourism", "entertainment", "nature", "history", "restaurant"]
      },
      attractions: realAttractions,
      start_latitude: cityLat,
      start_longitude: cityLon,
      total_days: totalDays,
      daily_time_limit: getDailyTimeLimit(trip.travelStyle)
    };

    let generatedPlan;

    try {
      const engineUrl = process.env.OPTIMIZER_URL || "http://localhost:8000/generate-plan";
      const pythonResponse = await axios.post(engineUrl, pythonPayload, { timeout: 15000 });
      generatedPlan = pythonResponse.data;
    } catch (engineError) {
      console.warn("Python optimizer unavailable, using fallback itinerary:", engineError.message);
      generatedPlan = buildFallbackItinerary(realAttractions, totalDays);
    }

    const finalItinerary = [];

    for (const dayData of generatedPlan.days || []) {
      const currentDayDate = new Date(trip.startDate);
      currentDayDate.setDate(currentDayDate.getDate() + (dayData.dayNumber - 1));

      const newDay = await Itinerary.create({
        tripId: trip._id,
        dayNumber: dayData.dayNumber,
        date: currentDayDate
      });

      const dayActivities = [];

      for (const placeName of dayData.route || []) {
        const placeDetails = realAttractions.find((attraction) => attraction.name === placeName);

        if (placeDetails) {
          const newActivity = await Activity.create({
            itineraryId: newDay._id,
            title: placeDetails.name,
            location: `GPS: ${placeDetails.latitude.toFixed(4)}, ${placeDetails.longitude.toFixed(4)}`,
            description: `Estimated ${placeDetails.estimated_duration} min visit. Categories: ${placeDetails.categories[0].replace(/\./g, " > ")}.`,
            estimatedCost: placeDetails.average_cost
          });

          dayActivities.push(newActivity);
        }
      }

      finalItinerary.push({
        ...newDay.toObject(),
        activities: dayActivities
      });
    }

    res.status(200).json({
      success: true,
      days: finalItinerary
    });
  } catch (error) {
    console.error("Planner Engine Error:", error);
    res.status(500).json({ message: "Itinerary generation failed" });
  }
};

export const generatePlan = getTripItinerary;
