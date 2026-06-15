import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to extract [lat, lng] from your "GPS: lat, lon" database strings
const parseCoordinates = (locationString) => {
  if (!locationString || !locationString.startsWith('GPS:')) return null;
  const parts = locationString.replace('GPS: ', '').split(',');
  if (parts.length === 2) {
    return [parseFloat(parts[0]), parseFloat(parts[1])];
  }
  return null;
};

// Colors for different days
const dayColors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFB533', '#33FFF5'];

const TripMap = ({ days }) => {
  // If no days are loaded yet, don't crash
  if (!days || days.length === 0) return <div>Loading Map...</div>;

  // Find the first valid coordinate to center the map
  let initialCenter = [0, 0];
  let foundCenter = false;

  const allRoutes = [];

  days.forEach((day, index) => {
    const dayCoordinates = [];
    day.activities.forEach((activity) => {
      const coords = parseCoordinates(activity.location);
      if (coords) {
        dayCoordinates.push({ coords, activity, dayNumber: day.dayNumber });
        if (!foundCenter) {
          initialCenter = coords;
          foundCenter = true;
        }
      }
    });
    if (dayCoordinates.length > 0) {
      allRoutes.push({ 
        color: dayColors[index % dayColors.length], 
        points: dayCoordinates 
      });
    }
  });

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <MapContainer center={initialCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
        {/* The Base Map (OpenStreetMap is free and doesn't require an API key!) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Plot the Routes and Markers */}
        {allRoutes.map((route, i) => (
          <React.Fragment key={i}>
            {/* Draw the connecting line for the day */}
            <Polyline positions={route.points.map(p => p.coords)} color={route.color} weight={4} opacity={0.7} />
            
            {/* Drop a pin for every activity */}
            {route.points.map((point, j) => (
              <Marker key={j} position={point.coords}>
                <Popup>
                  <strong>Day {point.dayNumber}</strong><br/>
                  {point.activity.title}<br/>
                  <em>Cost: ₹{point.activity.costEstimate}</em>
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default TripMap;