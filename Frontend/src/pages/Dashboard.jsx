import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import './Dashboard.css';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  // Grab the user details we saved during Login/Register
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Traveler' };

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      // Hit the backend route that returns all trips for the logged-in user
      const response = await api.get('/trips'); 
      setTrips(response.data.trips || response.data); // Adjust based on your exact backend JSON response
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError('Failed to load your trips. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>TripMitra</h2>
        </div>
        <div className="nav-actions">
          <span className="user-greeting">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Your Trips</h1>
          <Link to="/create-trip" className="create-trip-btn">
            + Create New Trip
          </Link>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {isLoading ? (
          <div className="loading-state">Loading your adventures...</div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h3>No trips planned yet</h3>
            <p>Your itinerary is empty. Time to start planning your next big adventure!</p>
          </div>
        ) : (
          <div className="trip-grid">
            {trips.map((trip) => (
              <div key={trip._id} className="trip-card">
                <div className="trip-card-header">
                  <span className={`role-badge ${trip.owner === user.id || trip.owner === user._id ? 'owner' : 'member'}`}>
                    {trip.owner === user.id || trip.owner === user._id ? 'Owner' : 'Guest'}
                  </span>
                </div>
                
               <div className="trip-card-body">
                  {/* Added the Origin -> Destination visual */}
                  <p className="route-text">
                    <span className="origin">{trip.origin}</span> 
                    <span className="arrow"> &rarr; </span> 
                    <span className="destination">{trip.destination}</span>
                  </p>
                  <p><strong>Dates:</strong> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                  <p><strong>Budget:</strong> ₹{trip.budget}</p>
                </div>
                
                <div className="trip-card-footer">
                  <Link to={`/trip/${trip._id}`} className="view-trip-btn">
                    View Itinerary &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}