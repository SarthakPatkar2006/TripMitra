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

const getSearchRadius = (totalDays) => {
  if (totalDays <= 1) return 25000;
  if (totalDays <= 3) return 20000;
  if (totalDays <= 6) return 30000;
  return 45000;
};

// ✅ Mirrors Python's TRIP_TYPE_CATEGORIES exactly — Node fetches what
// Python is able to score. Keep these two lists in sync; consider moving
// this to a shared JSON/config file both services read from, to avoid drift.
const CATEGORY_MAP = {
  adventure: "sport,natural.mountain,entertainment.activity_park,camping,commercial.outdoor_and_sport,leisure.park",
  historical: "tourism.sights,entertainment.museum,heritage",
  nature: "natural,leisure.park,national_park",
  beach: "beach,natural.coastal",
  religious: "religion,tourism.sights.place_of_worship",
  food: "catering.restaurant,catering.cafe",
  wildlife: "entertainment.zoo,national_park,natural.protected_area",
  romantic: "tourism.sights,leisure.park,leisure.spa",
  family: "tourism.sights,leisure.park,entertainment.zoo,entertainment.aquarium,entertainment.water_park,entertainment.theme_park",
  luxury: "accommodation.hotel,catering.restaurant,leisure.spa",
  solo: "tourism.sights,catering.cafe"
};

// ✅ Deliberately excludes tourism.sights.memorial/.artwork/.clock/.fountain
// (and anything generic). These categories are real but rare in any given
// city, so a small, separate, low-limit fetch against ONLY this list can't
// get crowded out the way a broad "tourism.sights" fetch can — a fort 1.5km
// from center won't lose a 40-result race against 30 nearby statues if
// statues were never eligible for this query in the first place.
const LANDMARK_CATEGORIES =
  "tourism.sights.castle,tourism.sights.fort,tourism.sights.manor,tourism.sights.archaeological_site,tourism.sights.monastery,tourism.sights.battlefield,heritage,tourism.sights.place_of_worship.temple,tourism.sights.place_of_worship.cathedral,tourism.sights.place_of_worship.mosque";

// Trip types where pulling in major landmarks regardless of the primary
// category match is worth the extra API call. Skip it for trip types where
// "fort/palace/cathedral" wouldn't be a relevant addition anyway.
const LANDMARK_BOOST_TRIP_TYPES = new Set([
  "historical", "religious", "romantic", "family", "solo", "luxury"
]);

const KNOWN_CITY_OVERRIDES = {
  pune: { lat: 18.5204303, lon: 73.8567437, formatted: "Pune, Maharashtra, India" },
  mumbai: { lat: 19.0759837, lon: 72.8776559, formatted: "Mumbai, Maharashtra, India" },
  bangalore: { lat: 12.9715987, lon: 77.5945627, formatted: "Bangalore, Karnataka, India" },
  bengaluru: { lat: 12.9715987, lon: 77.5945627, formatted: "Bengaluru, Karnataka, India" },
  delhi: { lat: 28.7040592, lon: 77.1024902, formatted: "Delhi, India" },
  hyderabad: { lat: 17.3850440, lon: 78.4866730, formatted: "Hyderabad, Telangana, India" },
  chennai: { lat: 13.0826802, lon: 80.2707184, formatted: "Chennai, Tamil Nadu, India" },
  kolkata: { lat: 22.5726459, lon: 88.3638953, formatted: "Kolkata, West Bengal, India" },
  jaipur: { lat: 26.9124336, lon: 75.7872709, formatted: "Jaipur, Rajasthan, India" },
  ahmedabad: { lat: 23.0224778, lon: 72.5713621, formatted: "Ahmedabad, Gujarat, India" }
};

const PREFERRED_RESULT_TYPES = ["city", "administrative"];

const resolveDestination = async (destinationText, apiKey) => {
  const normalized = destinationText.trim().toLowerCase();

  if (KNOWN_CITY_OVERRIDES[normalized]) {
    const override = KNOWN_CITY_OVERRIDES[normalized];
    console.log(`Using known-city override for "${destinationText}":`, override);
    return {
      lat: override.lat,
      lon: override.lon,
      formatted: override.formatted,
      result_type: "override"
    };
  }

  const geoResponse = await axios.get("https://api.geoapify.com/v1/geocode/search", {
    params: {
      text: destinationText,
      format: "json",
      type: "city",
      filter: "countrycode:in",
      limit: 5,
      apiKey
    }
  });

  const results = geoResponse.data.results || [];
  if (results.length === 0) {
    return null;
  }

  const bestMatch =
    results.find((r) => PREFERRED_RESULT_TYPES.includes(r.result_type)) || results[0];

  if (!PREFERRED_RESULT_TYPES.includes(bestMatch.result_type)) {
    console.warn(
      `No city/administrative-level match found for "${destinationText}" among ${results.length} results. Using best available: result_type="${bestMatch.result_type}". Consider adding a KNOWN_CITY_OVERRIDES entry if this is a major city.`
    );
  }

  return {
    lat: bestMatch.lat,
    lon: bestMatch.lon,
    formatted: bestMatch.formatted,
    result_type: bestMatch.result_type
  };
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
    const route = attractions.slice(cursor, cursor + 3).map((attraction) => ({
      name: attraction.name,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      cost: attraction.average_cost,
      duration: attraction.estimated_duration,
      rating: attraction.rating,
      categories: attraction.categories,
      has_wiki_link: attraction.has_wiki_link
    }));
    days.push({ dayNumber, route });
    cursor += 3;
  }

  return { days };
};

const hasWikiLink = (properties) => {
  const wiki = properties?.wiki_and_media;
  return Boolean(wiki?.wikidata || wiki?.wikipedia);
};

// ✅ In-memory cache so repeat trips to the same city don't re-fetch
// Wikidata for the same landmarks every time. Swap for Redis if you run
// multiple server instances.
const wikidataPopularityCache = new Map();

const getWikidataId = (properties) => properties?.wiki_and_media?.wikidata || null;

// ✅ Graded fame score (0+) based on how many language Wikipedias have an
// article on this place. A fort with 20 sitelinks clearly outranks a
// statue with 0-1.
// ✅ Graded fame score (0+) based on how many language Wikipedias have an
// article on this place. A fort with 20 sitelinks clearly outranks a
// statue with 0-1.
const getWikidataPopularity = async (wikidataId) => {
  if (!wikidataId) return 0;

  if (wikidataPopularityCache.has(wikidataId)) {
    return wikidataPopularityCache.get(wikidataId);
  }

  try {
    const res = await axios.get(
      `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`,
      {
        timeout: 4000,
        headers: {
          "User-Agent": "TripMitra/1.0 (contact: sarthakpatkar047@gmail.com)"
        }
      }
    );
    const entity = res.data?.entities?.[wikidataId];
    const sitelinks = entity?.sitelinks || {};
    const score = Object.keys(sitelinks).length;

    wikidataPopularityCache.set(wikidataId, score);
    return score;
  } catch (err) {
    console.warn(`Wikidata lookup failed for ${wikidataId}:`, err.message);
    wikidataPopularityCache.set(wikidataId, 0);
    return 0;
  }
};

const isAccommodationCategory = (categories) =>
  (categories || []).some((c) => c.startsWith("accommodation"));

// ✅ Returns the most specific (longest) category string in the array.
// Geoapify returns categories parent-to-child, e.g.
// ["tourism", "tourism.sights", "tourism.sights.memorial"] — the last/
// longest entry is the one that actually describes what the place is.
const getMostSpecificCategory = (categories) => {
  if (!categories || categories.length === 0) return "tourism";
  return categories.reduce((longest, c) => (c.length > longest.length ? c : longest), categories[0]);
};

// ✅ Rule-based cost/duration estimates, replacing Math.random() placeholders.
// Keyed off real Geoapify category strings (verified against live API
// output, not guessed), most specific entries first so a memorial doesn't
// fall through to a generic "tourism.sights" bucket.
const PLACE_TYPE_ESTIMATES = [
  { keywords: ["entertainment.museum"], cost: 100, duration: 90 },
  { keywords: ["tourism.sights.fort"], cost: 50, duration: 120 },
  { keywords: ["tourism.sights.castle", "tourism.sights.manor"], cost: 150, duration: 90 },
  { keywords: ["tourism.sights.archaeological_site"], cost: 25, duration: 60 },
  // War memorials, statues, monuments are quick stops, not full visits
  { keywords: ["tourism.sights.memorial.tank", "tourism.sights.memorial.ship", "tourism.sights.memorial.aircraft"], cost: 0, duration: 30 },
  { keywords: ["tourism.sights.memorial.monument", "tourism.sights.memorial"], cost: 0, duration: 20 },
  { keywords: ["tourism.attraction.artwork.statue", "tourism.attraction.artwork"], cost: 0, duration: 15 },
  { keywords: ["religion.place_of_worship", "tourism.sights.place_of_worship"], cost: 0, duration: 45 },
  { keywords: ["heritage"], cost: 50, duration: 75 },
  { keywords: ["national_park", "entertainment.zoo", "entertainment.aquarium"], cost: 300, duration: 180 },
  { keywords: ["leisure.park", "natural"], cost: 20, duration: 60 },
  { keywords: ["beach", "natural.coastal"], cost: 0, duration: 120 },
  { keywords: ["catering.restaurant"], cost: 400, duration: 75 },
  { keywords: ["catering.cafe"], cost: 200, duration: 45 },
  { keywords: ["accommodation.hotel"], cost: 3000, duration: 0 },
  { keywords: ["camping"], cost: 500, duration: 180 },
  { keywords: ["leisure.spa"], cost: 800, duration: 90 },
  { keywords: ["entertainment.activity_park", "sport", "commercial.outdoor_and_sport"], cost: 250, duration: 120 },
  { keywords: ["entertainment.water_park", "entertainment.theme_park"], cost: 600, duration: 180 }
];

const DEFAULT_ESTIMATE = { cost: 150, duration: 75 };

const estimatePlaceDetails = (name, categories) => {
  const lowerCats = (categories || []).map((c) => c.toLowerCase());
  const haystack = [name?.toLowerCase() || "", ...lowerCats].join(" ");

  const match = PLACE_TYPE_ESTIMATES.find(({ keywords }) =>
    keywords.some((keyword) => haystack.includes(keyword))
  );

  const { cost, duration } = match || DEFAULT_ESTIMATE;
  const rating = Number((Math.random() * 0.8 + 3.8).toFixed(1));

  return { cost, duration, rating };
};

// ✅ Real haversine distance, mirroring Python optimizer's calculate_distance
// so Node's travel-time estimates match the route Python actually chose.
const AVG_SPEED_KMH = 25.0;

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371.0;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ✅ Builds the 08:00 → dinner schedule for a day's route, using real
// distance-based travel time between consecutive stops instead of a flat
// buffer, so tightly clustered stops don't get padded as if far apart.
const applyTimeSlots = (route, startLat, startLon) => {
  const slots = [];
  let cursor = 8 * 60; // 08:00 in minutes
  let currentLat = startLat;
  let currentLon = startLon;

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  slots.push({ time: formatTime(cursor), label: "Breakfast", isMeal: true });
  cursor += 60;

  route.forEach((place, idx) => {
    const distKm = haversineDistanceKm(currentLat, currentLon, place.latitude, place.longitude);
    const travelMinutes = Math.round((distKm / AVG_SPEED_KMH) * 60);

    cursor += travelMinutes;
    slots.push({ time: formatTime(cursor), label: place.name, place, isMeal: false });
    cursor += place.duration || 60;

    currentLat = place.latitude;
    currentLon = place.longitude;

    if (idx === Math.min(1, route.length - 1)) {
      if (cursor < 13 * 60) cursor = 13 * 60;
      slots.push({ time: formatTime(cursor), label: "Lunch", isMeal: true });
      cursor += 60;
    }
  });

  if (cursor < 18 * 60) cursor = 18 * 60;
  slots.push({ time: formatTime(cursor), label: "Tea", isMeal: true });
  cursor += 30;

  if (cursor < 19 * 60 + 30) cursor = 19 * 60 + 30;
  slots.push({ time: formatTime(cursor), label: "Dinner", isMeal: true });

  return slots;
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

    console.log("Geocoding destination:", trip.destination);

    const resolved = await resolveDestination(trip.destination, apiKey);
    if (!resolved) {
      return res.status(400).json({ message: "Could not find that destination on the map" });
    }

    const cityLat = resolved.lat;
    const cityLon = resolved.lon;

    console.log("Geocode match:", {
      query: trip.destination,
      matched: resolved.formatted,
      result_type: resolved.result_type,
      lat: cityLat,
      lon: cityLon
    });

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const placeLimit = Math.min(totalDays * 40, 200);
    const searchRadius = getSearchRadius(totalDays);
    const categoriesForTrip = CATEGORY_MAP[trip.tripType] || "tourism";

    const placesResponse = await axios.get("https://api.geoapify.com/v2/places", {
      params: {
        categories: categoriesForTrip,
        filter: `circle:${cityLon},${cityLat},${searchRadius}`,
        bias: `proximity:${cityLon},${cityLat}`,
        limit: placeLimit,
        apiKey
      }
    });

    const features = placesResponse.data.features || [];

    console.log("Trip Type:", trip.tripType, "| Categories used:", categoriesForTrip);
    console.log("Search radius (m):", searchRadius, "| Place limit:", placeLimit);
    console.log("Total features fetched:", features.length);

    // ✅ Dedicated landmark fetch. Runs alongside the broad category fetch
    // above so forts/palaces/heritage sites can't lose a proximity-sorted,
    // limit-capped race against a city's dense cluster of minor sights
    // (memorials, statues, etc.) — those categories are excluded from this
    // query entirely, so they have zero chance of crowding it out.
    let landmarkFeatures = [];
    if (LANDMARK_BOOST_TRIP_TYPES.has(trip.tripType)) {
      try {
        const landmarkResponse = await axios.get("https://api.geoapify.com/v2/places", {
          params: {
            categories: LANDMARK_CATEGORIES,
            filter: `circle:${cityLon},${cityLat},${searchRadius}`,
            bias: `proximity:${cityLon},${cityLat}`,
            limit: 30,
            apiKey
          }
        });
        landmarkFeatures = landmarkResponse.data.features || [];
        console.log(
          "Landmark boost fetched:",
          landmarkFeatures.length,
          "—",
          landmarkFeatures.map((f) => f.properties?.name).filter(Boolean)
        );
      } catch (landmarkError) {
        console.warn("Landmark boost fetch failed, continuing without it:", landmarkError.message);
      }
    }

    const isLuxuryTrip = trip.tripType === "luxury";

    // ✅ Merge landmark results ahead of the broad fetch, deduping by name+
    // coordinates so the same fort doesn't appear twice if both queries
    // happened to return it.
    const seenKeys = new Set();
    const dedupeKey = (f) =>
      `${(f.properties?.name || "").toLowerCase()}|${f.properties?.lat}|${f.properties?.lon}`;

    const mergedFeatures = [];
    for (const f of landmarkFeatures) {
      const key = dedupeKey(f);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        mergedFeatures.push(f);
      }
    }
    for (const f of features) {
      const key = dedupeKey(f);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        mergedFeatures.push(f);
      }
    }

    // No relevance filtering here — Geoapify already narrows by category,
    // and the Python optimizer's match_tier() + preferred/backfill logic
    // handles fine-grained relevance scoring against trip.tripType. Node's
    // job is just: fetch candidates, attach cost/duration/rating estimates.
    const candidateFeatures = mergedFeatures
      .filter((feature) => feature.properties?.name && feature.properties?.lat && feature.properties?.lon)
      .filter((feature) => {
        const categories = feature.properties.categories || [];
        if (isAccommodationCategory(categories) && !isLuxuryTrip) {
          return false;
        }
        return true;
      });

    // ✅ Categories where popularity is more likely to reflect the fame of a
// depicted PERSON/EVENT than the fame of the site itself — Wikidata's
// instance-of (P31) data proved too inconsistent to detect this reliably
// (see diagnostic logs), so we cap based on Geoapify's own category tag
// instead, which we already trust for MINOR_SUBCATEGORIES logic in Python.
const MINOR_SIGHT_KEYWORDS = ["memorial", "artwork", "clock", "fountain"];

const realAttractions = await Promise.all(
  candidateFeatures.map(async (feature) => {
    const name = feature.properties.name;
    const categories = feature.properties.categories || ["tourism"];
    const { cost, duration, rating } = estimatePlaceDetails(name, categories);
    const wikidataId = getWikidataId(feature.properties);
    const rawPopularity = await getWikidataPopularity(wikidataId);

    const isMinorSight = categories.some((c) =>
      MINOR_SIGHT_KEYWORDS.some((keyword) => c.includes(keyword))
    );
    const popularityScore = isMinorSight ? Math.min(rawPopularity, 2) : rawPopularity;

    return {
      name,
      categories,
      average_cost: cost,
      estimated_duration: duration,
      rating,
      has_wiki_link: Boolean(wikidataId),
      popularity_score: popularityScore,
      latitude: feature.properties.lat,
      longitude: feature.properties.lon
    };
  })
);

    console.log(
      "Sample attraction estimates:",
      realAttractions
        .slice(0, 8)
        .map((a) => ({
          name: a.name,
          category: getMostSpecificCategory(a.categories),
          cost: a.average_cost,
          duration: a.estimated_duration,
          popularity: a.popularity_score
        }))
    );

    if (realAttractions.length === 0) {
      return res.status(400).json({ message: "No attractions found near this destination" });
    }

    const pythonPayload = {
      preferences: {
        max_budget: trip.budget,
        interests: [trip.tripType]
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
      const timeSlots = applyTimeSlots(dayData.route || [], cityLat, cityLon);

      for (const slot of timeSlots) {
        if (slot.isMeal) {
          const newActivity = await Activity.create({
            itineraryId: newDay._id,
            title: slot.label,
            category: "meal",
            location: "TBD",
            description: `Scheduled ${slot.label.toLowerCase()} break at ${slot.time}.`,
            estimatedCost: slot.label === "Breakfast" || slot.label === "Tea" ? 100 : 300
          });
          dayActivities.push(newActivity);
          continue;
        }

        const place = slot.place;
        const specificCategory = getMostSpecificCategory(place.categories);
        const newActivity = await Activity.create({
          itineraryId: newDay._id,
          title: place.name,
          category: specificCategory,
          location: `GPS: ${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`,
          description: `Scheduled at ${slot.time}. Estimated ${place.duration} min visit. Category: ${specificCategory.replace(/\./g, " > ")}.`,
          estimatedCost: place.cost
        });

        dayActivities.push(newActivity);
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