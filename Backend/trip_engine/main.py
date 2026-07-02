from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import math

app = FastAPI()

# --- 1. DATA MODELS ---
class UserPreferences(BaseModel):
    max_budget: float
    interests: List[str]

class Attraction(BaseModel):
    name: str
    categories: List[str]
    average_cost: float
    estimated_duration: int
    rating: float
    has_wiki_link: bool = False
    popularity_score: int = 0   # ✅ Wikidata sitelink count from Node (graded fame signal)
    latitude: float
    longitude: float

class EngineRequest(BaseModel):
    preferences: UserPreferences
    attractions: List[Attraction]
    start_latitude: float
    start_longitude: float
    total_days: int
    daily_time_limit: int

# --- 2. TRIP TYPE -> RELEVANT GEOAPIFY CATEGORY PREFIXES ---
# NOTE: this must stay in sync with CATEGORY_MAP in the Node controller.
TRIP_TYPE_CATEGORIES = {
    "adventure": [
        "sport", "natural.mountain", "entertainment.activity_park",
        "camping", "commercial.outdoor_and_sport", "leisure.park"
    ],
    "historical": [
        "tourism.sights", "entertainment.museum", "heritage"
    ],
    "nature": [
        "natural", "leisure.park", "national_park"
    ],
    "beach": [
        "beach", "natural.coastal"
    ],
    "religious": [
        "religion", "tourism.sights.place_of_worship"
    ],
    "food": [
        "catering.restaurant", "catering.cafe"
    ],
    "wildlife": [
        "entertainment.zoo", "national_park", "natural.protected_area"
    ],
    "romantic": [
        "tourism.sights", "leisure.park", "leisure.spa"
    ],
    "family": [
        "tourism.sights", "leisure.park", "entertainment.zoo",
        "entertainment.aquarium", "entertainment.water_park", "entertainment.theme_park"
    ],
    "luxury": [
        "accommodation.hotel", "catering.restaurant", "leisure.spa"
    ],
    "solo": [
        "tourism.sights", "catering.cafe"
    ]
}

# ✅ Subcategories that are minor sights, even when they technically match
# a trip type at the "exact subcategory" tier. Without this, a war memorial
# scores identically to a fort under "historical" since both are
# tourism.sights.* subcategories - this caps how high a minor sight's
# category-match tier can go, so popularity/rating end up doing the
# tie-breaking instead of category depth alone.
MINOR_SUBCATEGORIES = ("memorial", "artwork", "clock", "fountain")

def match_tier(attraction_categories: List[str], trip_type: str) -> float:
    """
    Tiered preference match instead of binary 1.0/0.0:
      1.0  - exact subcategory match on a primary sight (e.g. "tourism.sights.castle")
      0.7  - exact subcategory match but on a minor sight (e.g. "tourism.sights.memorial")
      0.6  - parent-level match (e.g. "tourism.sights" for historical)
      0.0  - no relevant category at all
    """
    relevant_prefixes = TRIP_TYPE_CATEGORIES.get(trip_type, [])
    if not relevant_prefixes:
        return 0.0

    is_minor = any(
        any(part in cat for part in MINOR_SUBCATEGORIES)
        for cat in attraction_categories
    )

    best = 0.0
    for cat in attraction_categories:
        for prefix in relevant_prefixes:
            if cat == prefix:
                best = max(best, 0.6)
            elif cat.startswith(prefix + "."):
                tier = 0.7 if is_minor else 1.0
                best = max(best, tier)
    return best

# --- 3. HELPER FUNCTIONS ---
def normalize(value, min_val, max_val):
    if max_val == min_val:
        return 0
    return (value - min_val) / (max_val - min_val)

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def attraction_to_dict(attr: Attraction):
    return {
        "name": attr.name,
        "latitude": attr.latitude,
        "longitude": attr.longitude,
        "cost": attr.average_cost,
        "duration": attr.estimated_duration,
        "rating": attr.rating,
        "categories": attr.categories,
        "has_wiki_link": attr.has_wiki_link,
        "popularity_score": attr.popularity_score
    }

# --- 4. ENDPOINTS ---
@app.get("/")
async def root():
    return {"message": "TripMitra Optimization Engine is running!"}

@app.post("/generate-plan")
async def generate_plan(payload: EngineRequest):
    max_cost = max([a.average_cost for a in payload.attractions] or [1])
    max_time = max([a.estimated_duration for a in payload.attractions] or [1])
    # ✅ Normalize popularity within this batch, so a famous fort scores
    # near 1.0 and an unlinked statue scores 0.0, instead of a flat
    # 1.0/0.0 split based on merely having any Wikidata link at all.
    max_popularity = max([a.popularity_score for a in payload.attractions] or [1])

    trip_type = payload.preferences.interests[0] if payload.preferences.interests else None

    scored_results = []
    for attr in payload.attractions:
        pop_score = normalize(attr.popularity_score, 0, max_popularity)
        rating_score = normalize(attr.rating, 1, 5)
        cost_penalty = normalize(attr.average_cost, 0, max_cost)
        time_penalty = normalize(attr.estimated_duration, 0, max_time)
        pref_match = match_tier(attr.categories, trip_type) if trip_type else 0.0

        final_score = (
            (pop_score * 0.30)      # raised - now a real graded fame signal
            + (pref_match * 0.40)   # slightly reduced so popularity can tip ties
            + (rating_score * 0.10)
            - (cost_penalty * 0.30)
            - (time_penalty * 0.20)
        )
        scored_results.append({
            "attraction": attr,
            "score": final_score,
            "pref_match": pref_match
        })

    feasible = [
        item for item in scored_results
        if item["attraction"].estimated_duration <= payload.daily_time_limit
    ]

    preferred = [item for item in feasible if item["pref_match"] > 0]
    other = [item for item in feasible if item["pref_match"] == 0]

    preferred.sort(key=lambda x: x["score"], reverse=True)
    other.sort(key=lambda x: x["score"], reverse=True)

    min_needed = payload.total_days * 4
    shortfall = max(0, min_needed - len(preferred))

    unvisited = preferred + (other[:shortfall] if shortfall > 0 else [])

    print(f"Trip type: {trip_type} | Preferred: {len(preferred)} | Backfilled: {min(shortfall, len(other))} | min_needed: {min_needed}")

    # ✅ DIAGNOSTIC: confirm whether forts/palaces are even present among the
    # "preferred" pool before the greedy loop runs. Remove this once confirmed.
    print(
        "Top 10 preferred by score:",
        [(p["attraction"].name, round(p["score"], 3), p["attraction"].estimated_duration) for p in preferred[:10]]
    )

    itinerary = []
    trip_total_cost = 0

    AVG_SPEED_KMH = 25.0
    SCORE_WEIGHT = 1.0
    # ✅ Normalizes leg_time as a fraction of the day's time budget (0-1
    # scale) instead of raw minutes, so a 120-min fort isn't penalized ~7x
    # harder than a 20-min memorial purely because of absolute duration.
    TIME_COST_WEIGHT = 0.5
    # ✅ Soft cap on stops per day so the greedy loop doesn't keep stuffing
    # in cheap, fast minor sights just because they're time-efficient -
    # this is what was causing 15-20 memorials to fill a single day.
    MAX_STOPS_PER_DAY = 6

    for day in range(1, payload.total_days + 1):
        daily_route = []
        time_spent_today = 0
        current_lat = payload.start_latitude
        current_lon = payload.start_longitude

        while unvisited and len(daily_route) < MAX_STOPS_PER_DAY:
            remaining_time = payload.daily_time_limit - time_spent_today
            if remaining_time <= 0:
                break

            best_item = None
            best_value = float("-inf")
            best_leg_time = 0

            for item in unvisited:
                attr = item["attraction"]
                score = item["score"]

                dist = calculate_distance(current_lat, current_lon, attr.latitude, attr.longitude)
                travel_time_mins = (dist / AVG_SPEED_KMH) * 60
                total_leg_time = travel_time_mins + attr.estimated_duration

                if total_leg_time > remaining_time:
                    continue

                if trip_total_cost + attr.average_cost > payload.preferences.max_budget:
                    continue

                time_fraction = total_leg_time / payload.daily_time_limit
                value = (score * SCORE_WEIGHT) - (time_fraction * TIME_COST_WEIGHT)

                if value > best_value:
                    best_value = value
                    best_item = item
                    best_leg_time = total_leg_time

            if best_item is None:
                break

            best_attr = best_item["attraction"]

            daily_route.append(attraction_to_dict(best_attr))
            time_spent_today += best_leg_time
            trip_total_cost += best_attr.average_cost

            current_lat = best_attr.latitude
            current_lon = best_attr.longitude

            unvisited.remove(best_item)

        itinerary.append({
            "dayNumber": day,
            "route": daily_route
        })

    return {
        "tripSummary": {
            "totalDays": payload.total_days,
            "attractionsCovered": sum([len(day["route"]) for day in itinerary]),
            "totalEstimatedCost": trip_total_cost,
            "tripType": trip_type
        },
        "days": itinerary
    }