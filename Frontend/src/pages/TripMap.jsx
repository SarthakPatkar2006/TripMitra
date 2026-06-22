import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './TripMap.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DAY_PALETTE = [
  { stroke: '#185FA5', light: '#E6F1FB', text: '#0C447C' },
  { stroke: '#0F6E56', light: '#E1F5EE', text: '#085041' },
  { stroke: '#993C1D', light: '#FAECE7', text: '#712B13' },
  { stroke: '#854F0B', light: '#FAEEDA', text: '#633806' },
  { stroke: '#993556', light: '#FBEAF0', text: '#72243E' },
  { stroke: '#534AB7', light: '#EEEDFE', text: '#3C3489' },
];

const parseCoordinates = (locationString) => {
  if (!locationString?.startsWith('GPS:')) return null;
  const parts = locationString.replace('GPS: ', '').split(',');
  if (parts.length === 2) return [parseFloat(parts[0]), parseFloat(parts[1])];
  return null;
};

const createPinIcon = (color, label) =>
  L.divIcon({
    className: '',
    html: `
      <div class="trip-pin" style="--pin-color:${color}">
        <span class="trip-pin__label">${label}</span>
      </div>`,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -40],
  });

function FitBounds({ allCoords }) {
  const map = useMap();
  useEffect(() => {
    if (allCoords.length > 1) map.fitBounds(allCoords, { padding: [40, 40] });
  }, [map, allCoords]);
  return null;
}

const TripMap = ({ days }) => {
  if (!days?.length) {
    return (
      <div className="trip-map-shell trip-map-shell--loading">
        <div className="trip-map-spinner" />
        <p>Loading map…</p>
      </div>
    );
  }

  let totalCost = 0;
  let totalStops = 0;
  const allCoords = [];
  const routes = [];

  days.forEach((day, i) => {
    const palette = DAY_PALETTE[i % DAY_PALETTE.length];
    const points = [];

    day.activities.forEach((activity, j) => {
      const coords = parseCoordinates(activity.location);
      if (!coords) return;
      points.push({ coords, activity, dayNumber: day.dayNumber, stopIndex: j + 1 });
      allCoords.push(coords);
      totalCost += Number(activity.costEstimate ?? 0);
      totalStops++;
    });

    if (points.length) routes.push({ palette, points, dayNumber: day.dayNumber });
  });

  const center = allCoords[0] ?? [20.5937, 78.9629];

  return (
    <div className="trip-map-wrap">
      <div className="trip-map-shell">

        {/* ── Toolbar ── */}
        <div className="trip-map-toolbar">
          <div className="trip-map-title">
            <div className="trip-map-title__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div>
              <h2 className="trip-map-title__heading">Trip Route</h2>
              <p className="trip-map-title__sub">{days.length} days · {totalStops} stops</p>
            </div>
          </div>
          <div className="trip-map-actions">
            <button className="trip-map-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
              Layers
            </button>
            <button className="trip-map-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              Expand
            </button>
          </div>
        </div>

        {/* ── Map ── */}
        <div className="trip-map-frame">
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}
            zoomControl={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {allCoords.length > 1 && <FitBounds allCoords={allCoords} />}

            {routes.map((route, ri) => (
              <React.Fragment key={ri}>
                <Polyline
                  positions={route.points.map(p => p.coords)}
                  color={route.palette.stroke}
                  weight={4}
                  opacity={0.85}
                  dashArray={ri > 0 ? '8 5' : undefined}
                />
                {route.points.map((point, pi) => (
                  <Marker
                    key={pi}
                    position={point.coords}
                    icon={createPinIcon(route.palette.stroke, point.stopIndex)}
                  >
                    <Popup className="trip-popup">
                      <div className="trip-popup__day"
                        style={{ background: route.palette.light, color: route.palette.text }}>
                        Day {point.dayNumber}
                      </div>
                      <p className="trip-popup__title">{point.activity.title}</p>
                      {point.activity.costEstimate != null && (
                        <p className="trip-popup__cost">
                          ₹{Number(point.activity.costEstimate).toLocaleString('en-IN')}
                        </p>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        {/* ── Footer ── */}
        <div className="trip-map-footer">
          <div className="trip-map-legend">
            {routes.map((route, i) => (
              <div key={i} className="trip-map-legend__item">
                <span className="trip-map-legend__dot"
                  style={{ background: route.palette.stroke }} />
                Day {route.dayNumber}
              </div>
            ))}
          </div>
          <div className="trip-map-stats">
            <div className="trip-map-stat">
              <span className="trip-map-stat__val">{totalStops}</span>
              <span className="trip-map-stat__lbl">Stops</span>
            </div>
            <div className="trip-map-stat">
              <span className="trip-map-stat__val">
                ₹{totalCost.toLocaleString('en-IN')}
              </span>
              <span className="trip-map-stat__lbl">Est. cost</span>
            </div>
            <div className="trip-map-stat">
              <span className="trip-map-stat__val">{days.length}</span>
              <span className="trip-map-stat__lbl">Days</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TripMap;