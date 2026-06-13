import axios from "axios";
import Attraction from "../Models/Attraction.js"; // Note the .js extension!

export const generateOptimizedPlan = async (tripData) => {
    const { 
        destination, 
        maxBudget, 
        interests, 
        totalDays, 
        hotelLatitude, 
        hotelLongitude 
    } = tripData;

    const rawAttractions = await Attraction.find({ city: destination });

    if (!rawAttractions || rawAttractions.length === 0) {
        throw new Error(`No attractions found in the database for the city: ${destination}.`);
    }

    const pythonPayload = {
        preferences: {
            max_budget: maxBudget || 5000,
            interests: interests || []
        },
        start_latitude: hotelLatitude || 0,
        start_longitude: hotelLongitude || 0,
        total_days: totalDays,
        daily_time_limit: 480, 
        
        attractions: rawAttractions.map(attr => ({
            name: attr.name,
            categories: attr.category, 
            average_cost: attr.averageCost,
            estimated_duration: attr.estimatedDuration,
            rating: attr.rating,
            popularity_score: attr.popularityScore,
            latitude: attr.location.coordinates[1], 
            longitude: attr.location.coordinates[0]
        }))
    };

    try {
        const pythonResponse = await axios.post('http://127.0.0.1:8000/generate-plan', pythonPayload);
        return pythonResponse.data; 
    } catch (error) {
        console.error("Python Engine Error:", error.message);
        throw new Error("Optimization engine communication failure. Ensure the Python server is running.");
    }
};