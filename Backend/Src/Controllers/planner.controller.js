import axios from 'axios';
import Trip from '../Models/Trip.js';
import Itinerary from '../Models/Itinerary.js';
import Activity from '../Models/Activity.js';

export const getTripItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if itinerary already exists in MongoDB
    let days = await Itinerary.find({ tripId: id }).sort({ dayNumber: 1 });
    if (days.length > 0) {
      const fullItinerary = await Promise.all(days.map(async (day) => {
        const activities = await Activity.find({ itineraryId: day._id }).sort({ createdAt: 1 });
        return { ...day.toObject(), activities };
      }));
      return res.status(200).json({ success: true, days: fullItinerary });
    }

    // 2. Fetch the trip constraints
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const API_KEY = process.env.GEOAPIFY_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ message: "Server missing Geoapify API Key in .env file" });
    }

    console.log(`[1/3] Fetching coordinates for ${trip.destination}...`);
    
    // 3. GEOAPIFY STEP A: Get the Latitude and Longitude of the Destination City
    const geoResponse = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${trip.destination}&format=json&apiKey=${API_KEY}`);
    if (geoResponse.data.results.length === 0) {
      return res.status(400).json({ message: "Could not find that destination on the map." });
    }
    const cityLat = geoResponse.data.results[0].lat;
    const cityLon = geoResponse.data.results[0].lon;

    console.log(`[2/3] Fetching tourist attractions near ${cityLat}, ${cityLon}...`);

    // 4. GEOAPIFY STEP B: Search for Tourism & Entertainment within a 10km radius (10000 meters)
    const placesResponse = await axios.get(`https://api.geoapify.com/v2/places?categories=tourism,entertainment&filter=circle:${cityLon},${cityLat},10000&limit=25&apiKey=${API_KEY}`);
    
    // 5. Data Enrichment: Map Geoapify data to fit the Python Engine's strict "Attraction" model
    const realAttractions = placesResponse.data.features
      .filter(feature => feature.properties.name) // Only keep places that actually have a name
      .map(feature => {
        return {
          name: feature.properties.name,
          categories: feature.properties.categories || ["tourism"],
          // We simulate prices, duration, and ratings since free APIs don't provide them
          average_cost: Math.floor(Math.random() * 2000) + 200, // ₹200 to ₹2200
          estimated_duration: Math.floor(Math.random() * 120) + 60, // 60 to 180 mins
          rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0 rating
          popularity_score: Math.floor(Math.random() * 40) + 60, // 60 to 100 score
          latitude: feature.properties.lat,
          longitude: feature.properties.lon
        };
      });

    // Calculate constraints for Python
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    let dailyTimeLimit = 480; // 8 hours default
    if (trip.travelStyle === 'packed') dailyTimeLimit = 600; // 10 hours
    if (trip.travelStyle === 'relaxed') dailyTimeLimit = 300; // 5 hours

    // 6. Construct the payload for the Python Mathematical Engine
    const pythonPayload = {
      preferences: {
        max_budget: trip.budget,
        interests: ["tourism", "entertainment", "nature", "history"] 
      },
      attractions: realAttractions,
      start_latitude: cityLat,
      start_longitude: cityLon,
      total_days: totalDays,
      daily_time_limit: dailyTimeLimit
    };

    console.log(`[3/3] Sending ${realAttractions.length} real locations to Python Engine...`);
    
    // 7. Hit the Python FastAPI server
    const pythonResponse = await axios.post('http://localhost:8000/generate-plan', pythonPayload);
    const pythonItinerary = pythonResponse.data.days; 
    const finalItinerary = [];

    // 8. Save the Python mathematical results into Node.js MongoDB
    for (const dayData of pythonItinerary) {
      const currentDayDate = new Date(trip.startDate);
      currentDayDate.setDate(currentDayDate.getDate() + (dayData.dayNumber - 1));

      const newDay = await Itinerary.create({
        tripId: trip._id,
        dayNumber: dayData.dayNumber,
        date: currentDayDate
      });

      const dayActivities = [];
      for (const placeName of dayData.route) {
        const placeDetails = realAttractions.find(a => a.name === placeName);
        
        if (placeDetails) {
          const newAct = await Activity.create({
            itineraryId: newDay._id,
            title: placeDetails.name,
            location: `GPS: ${placeDetails.latitude.toFixed(4)}, ${placeDetails.longitude.toFixed(4)}`,
            description: `Estimated ${placeDetails.estimated_duration} min visit. Categories: ${placeDetails.categories[0].replace(/\./g, ' > ')}.`,
            costEstimate: placeDetails.average_cost
          });
          dayActivities.push(newAct);
        }
      }

      finalItinerary.push({ ...newDay.toObject(), activities: dayActivities });
    }

    res.status(200).json({ success: true, days: finalItinerary });

  } catch (error) {
    console.error("Planner Engine Error:", error.message);
    res.status(500).json({ message: "Optimization Engine Failed. Make sure Python is running and the API key is correct." });
  }
};
// Alias to support the route file importing generatePlan
export const generatePlan = getTripItinerary;