import axios from "axios";
import Attraction from "../Models/Attraction.js";

const tripTypeCategoryMap = {
    adventure: [
        "Adventure",
        "Trekking",
        "Hiking",
        "Camping",
        "Water Sports"
    ],

    historical: [
        "Historical",
        "Fort",
        "Palace",
        "Museum",
        "Heritage"
    ],

    nature: [
        "Nature",
        "Park",
        "Garden",
        "Lake",
        "Waterfall"
    ],

    beach: [
        "Beach"
    ],

    religious: [
        "Religious",
        "Temple",
        "Church",
        "Mosque",
        "Shrine"
    ],

    food: [
        "Food",
        "Restaurant",
        "Cafe",
        "Street Food"
    ],

    wildlife: [
        "Wildlife",
        "National Park",
        "Zoo",
        "Safari"
    ],

    romantic: [
        "Romantic",
        "View Point",
        "Garden",
        "Lake"
    ],

    family: [
        "Family",
        "Park",
        "Museum",
        "Zoo"
    ],

    luxury: [
        "Luxury",
        "Resort",
        "Fine Dining"
    ],

    solo: []
};

export const generateOptimizedPlan = async (tripData) => {
    const {
        destination,
        maxBudget,
        interests,
        totalDays,
        hotelLatitude,
        hotelLongitude,
        tripType
    } = tripData;

    const categories = tripTypeCategoryMap[tripType] || [];

    const query = {
        city: destination
    };

    if (categories.length > 0) {
        query.category = {
            $in: categories
        };
    }

    const rawAttractions = await Attraction.find(query);

    if (!rawAttractions.length) {
        throw new Error(
            `No ${tripType} attractions found in ${destination}.`
        );
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

        attractions: rawAttractions.map((attr) => ({
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
        const pythonResponse = await axios.post(
            "http://127.0.0.1:8000/generate-plan",
            pythonPayload
        );

        return pythonResponse.data;
    } catch (error) {
        console.error("Python Engine Error:", error.message);

        throw new Error(
            "Optimization engine communication failure. Ensure the Python server is running."
        );
    }
};