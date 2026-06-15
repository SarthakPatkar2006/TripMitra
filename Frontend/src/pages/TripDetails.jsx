import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import './TripDetails.css';
import TripMap from '../pages/TripMap'; // Perfectly imported!

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [userRole, setUserRole] = useState('member');
  const [activeDay, setActiveDay] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTripData();
  }, [id]);

  const fetchTripData = async () => {
    try {
      const tripRes = await api.get(`/trips/${id}`);
      setTrip(tripRes.data.trip || tripRes.data);
      setUserRole(tripRes.data.userRole);

      const planRes = await api.get(`/planner/${id}`);
      setItinerary(planRes.data.days || []);
    } catch (err) {
      console.error("Failed to load trip data:", err);
      setError("Could not load itinerary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this trip and all its data?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/trips/${id}`);
      alert("Trip successfully deleted.");
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete trip.");
    }
  };

  if (isLoading) return <div className="loading-screen">Loading Itinerary...</div>;
  if (error) return <div className="error-screen">{error}</div>;
  if (!trip) return <div className="error-screen">Trip not found.</div>;

  const currentDayData = itinerary.find(day => day.dayNumber === activeDay);

  return (
    <div className="trip-details-layout">
      <header className="details-header">
        <div className="details-nav">
          <Link to="/dashboard" className="back-link">&larr; Dashboard</Link>
          <div className="nav-actions">
            {userRole === 'owner' && (
              <button onClick={handleDeleteTrip} className="delete-trip-btn">
                🗑️ Delete Trip
              </button>
            )}
          </div>
        </div>
        
        <div className="trip-hero-content">
          <h1>{trip.destination}</h1>
          <p className="trip-route">Starting from {trip.origin} • {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()}</p>
          <div className="trip-badges">
            <span className="badge budget">Budget: ₹{trip.budget}</span>
            <span className="badge group">Role: {userRole.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* NEW: The Map is officially mounted here, passing the AI-generated days as props! */}
      <div className="map-section" style={{ margin: '20px 0', zIndex: 1 }}>
        <TripMap days={itinerary} />
      </div>

      <main className="itinerary-container">
        <aside className="day-tabs">
          <h3>Your Itinerary</h3>
          {itinerary.length === 0 ? (
            <p className="no-days">No days planned yet.</p>
          ) : (
            itinerary.map((day) => (
              <button 
                key={day._id}
                className={`tab-btn ${activeDay === day.dayNumber ? 'active' : ''}`}
                onClick={() => setActiveDay(day.dayNumber)}
              >
                <div className="tab-title">Day {day.dayNumber}</div>
                <div className="tab-date">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</div>
              </button>
            ))
          )}
        </aside>

        <section className="activities-feed">
          {currentDayData ? (
            <>
              <div className="feed-header">
                <h2>Day {currentDayData.dayNumber} Plan</h2>
                <button className="add-activity-btn">+ Add Stop</button>
              </div>

              {currentDayData.activities && currentDayData.activities.length > 0 ? (
                <div className="timeline">
                  {currentDayData.activities.map((activity, index) => (
                    <div key={activity._id || index} className="activity-card">
                      <div className="activity-bullet"></div>
                      <div className="activity-content">
                        <h3>{activity.title}</h3>
                        {activity.location && <p className="location">📍 {activity.location}</p>}
                        {activity.description && <p className="description">{activity.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-activities">
                  <p>No activities scheduled for this day yet.</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-activities"><p>Select a day to view details.</p></div>
          )}
        </section>
      </main>
    </div>
  );
}