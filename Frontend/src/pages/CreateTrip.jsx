import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import './CreateTrip.css';

export default function CreateTrip() {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    tripType: 'historical',
    travelStyle: 'balanced'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (fieldErrors[id]) {
      setFieldErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (!formData.origin.trim()) {
      errors.origin = "Starting location is required";
    }

    if (!formData.destination.trim()) {
      errors.destination = "Destination is required";
    } else if (formData.destination.trim().toLowerCase() === formData.origin.trim().toLowerCase()) {
      errors.destination = "Destination cannot be the same as your starting location";
    }

    if (!formData.startDate) {
      errors.startDate = "Select a start date";
    } else if (start < today) {
      errors.startDate = "You cannot plan trips in the past";
    }

    if (!formData.endDate) {
      errors.endDate = "Select an end date";
    } else if (end < start) {
      errors.endDate = "End date must be after or on the start date";
    }

    if (!formData.budget) {
      errors.budget = "Enter a budget";
    } else if (isNaN(formData.budget) || Number(formData.budget) <= 0) {
      errors.budget = "Please enter a valid positive budget amount";
    }

    if (!formData.tripType) {
      errors.tripType = "Select a trip type";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await api.post('/trips', {
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: Number(formData.budget),
        tripType: formData.tripType,
        travelStyle: formData.travelStyle
      });

      navigate('/dashboard');
    } catch (err) {
      console.error("Trip Creation Error:", err);
      setGeneralError(err.response?.data?.message || 'Server connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-trip-layout">
      <div className="create-trip-header-bg">
        <div className="nav-bar">
          <Link to="/dashboard" className="back-link">&larr; Back to Dashboard</Link>
          <h2>TripMitra AI</h2>
        </div>
      </div>

      <div className="create-trip-container">
        <div className="create-trip-card">
          <div className="form-header">
            <h1>Design Your Adventure</h1>
            <p>Set your travel boundaries. Our optimization algorithm will organize the details.</p>
          </div>

          {generalError && <div className="error-banner">{generalError}</div>}

          <form onSubmit={handleSubmit} className="trip-form">
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="origin">🏠 Starting From</label>
                <input
                  type="text"
                  id="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="Your current city"
                  className={fieldErrors.origin ? 'input-error' : ''}
                />
                {fieldErrors.origin && <span className="inline-error">{fieldErrors.origin}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="destination">📍 Destination</label>
                <input
                  type="text"
                  id="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Where are you heading?"
                  className={fieldErrors.destination ? 'input-error' : ''}
                />
                {fieldErrors.destination && <span className="inline-error">{fieldErrors.destination}</span>}
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="startDate">🗓️ Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={fieldErrors.startDate ? 'input-error' : ''}
                />
                {fieldErrors.startDate && <span className="inline-error">{fieldErrors.startDate}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="endDate">🏁 End Date</label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={fieldErrors.endDate ? 'input-error' : ''}
                />
                {fieldErrors.endDate && <span className="inline-error">{fieldErrors.endDate}</span>}
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="budget">💰 Group Budget (₹)</label>
                <input
                  type="number"
                  id="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  className={fieldErrors.budget ? 'input-error' : ''}
                />
                {fieldErrors.budget && <span className="inline-error">{fieldErrors.budget}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="tripType">🧭 Trip Type</label>
                <select
                  id="tripType"
                  value={formData.tripType}
                  onChange={handleChange}
                  className={fieldErrors.tripType ? "input-error" : ""}
                >
                  <option value="historical">Historical</option>
                  <option value="adventure">Adventure</option>
                  <option value="nature">Nature</option>
                  <option value="beach">Beach</option>
                  <option value="religious">Religious</option>
                  <option value="food">Food</option>
                  <option value="wildlife">Wildlife</option>
                  <option value="romantic">Romantic</option>
                  <option value="family">Family</option>
                  <option value="luxury">Luxury</option>
                  <option value="solo">Solo</option>
                </select>
                {fieldErrors.tripType && (
                  <span className="inline-error">{fieldErrors.tripType}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="travelStyle">⚡ Pace of Travel</label>
                <select
                  id="travelStyle"
                  value={formData.travelStyle}
                  onChange={handleChange}
                >
                  <option value="relaxed">Relaxed (More downtime)</option>
                  <option value="balanced">Balanced (Standard pace)</option>
                  <option value="packed">Packed (Maximize sights)</option>
                </select>
              </div>
              <div className="input-group input-group-spacer" />
            </div>

            <button type="submit" className="generate-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-text">⚙️ Processing Optimization Routing...</span>
              ) : (
                'Generate Smart Itinerary'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}