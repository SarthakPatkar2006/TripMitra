from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
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
    popularity_score: float
    latitude: float
    longitude: float

class EngineRequest(BaseModel):
    preferences: UserPreferences
    attractions: List[Attraction]
    start_latitude: float   
    start_longitude: float  
    total_days: int         
    daily_time_limit: int   

# --- 2. HELPER FUNCTIONS ---
def normalize(value, min_val, max_val):
    if max_val == min_val:
        return 0
    return (value - min_val) / (max_val - min_val)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculates the distance in kilometers between two GPS points."""
    R = 6371.0 
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

# --- 3. ENDPOINTS ---
@app.get("/")
async def root():
    return {"message": "TripMitra Optimization Engine is running!"}

@app.post("/generate-plan")
async def generate_plan(payload: EngineRequest):
    # STEP A: Rank the attractions using the formula
    scored_results = []
    max_cost = max([a.average_cost for a in payload.attractions] or [1])
    max_time = max([a.estimated_duration for a in payload.attractions] or [1])
    
    for attr in payload.attractions:
        pop_score = normalize(attr.popularity_score, 0, 100)
        rating_score = normalize(attr.rating, 1, 5)
        cost_penalty = normalize(attr.average_cost, 0, max_cost)
        time_penalty = normalize(attr.estimated_duration, 0, max_time)
        pref_match = 1.0 if set(attr.categories).intersection(set(payload.preferences.interests)) else 0.0
        
        final_score = (pop_score * 0.25) + (pref_match * 0.3) + (rating_score * 0.25) - (cost_penalty * 0.4) - (time_penalty * 0.3)
        scored_results.append({"score": final_score, "data": attr})
        
    scored_results.sort(key=lambda x: x["score"], reverse=True)
    
    # STEP B: Route Optimization (Greedy Algorithm)
    unvisited = [item["data"] for item in scored_results]
    itinerary = []
    
    for day in range(1, payload.total_days + 1):
        daily_route = []
        time_spent_today = 0
        current_lat = payload.start_latitude
        current_lon = payload.start_longitude
        
        while unvisited and time_spent_today < payload.daily_time_limit:
            closest_attr = None
            shortest_dist = float('inf')
            
            for attr in unvisited:
                dist = calculate_distance(current_lat, current_lon, attr.latitude, attr.longitude)
                if dist < shortest_dist:
                    shortest_dist = dist
                    closest_attr = attr
            
            # Estimate travel time (assuming city speed of ~25 km/h)
            travel_time_mins = (shortest_dist / 25.0) * 60
            total_leg_time = travel_time_mins + closest_attr.estimated_duration
            
            if time_spent_today + total_leg_time > payload.daily_time_limit:
                break
                
            daily_route.append(closest_attr.name)
            time_spent_today += total_leg_time
            
            current_lat = closest_attr.latitude
            current_lon = closest_attr.longitude
            
            unvisited.remove(closest_attr)
            
        itinerary.append({
            "dayNumber": day,
            "route": daily_route
        })
        
    return {
        "tripSummary": {
            "totalDays": payload.total_days,
            "attractionsCovered": sum([len(day["route"]) for day in itinerary])
        },
        "days": itinerary
    }