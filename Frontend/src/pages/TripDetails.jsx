import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import "./TripDetails.css";
import TripMap from "./TripMap";

import TripTabs from "../components/trip/TripTabs";
import TripOverview from "../components/trip/TripOverview";
import TripMembers from "../components/trip/TripMembers";
import TripRecommendations from "../components/trip/TripRecommendations";
import TripExpenses from "../components/trip/TripExpenses/TripExpenses";
import TripNotes from "../components/trip/TripNotes";

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [userRole, setUserRole] = useState("member");
  const [activeDay, setActiveDay] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);

  // Day Modal
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDay, setNewDay] = useState({ date: "", notes: "" });

  // Activity Modal
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    estimatedCost: ""
  });

  useEffect(() => {
    fetchTripData();
    fetchMembers();
  }, [id]);

  const fetchTripData = async () => {
    try {
      setIsLoading(true);

      const tripRes = await api.get(`/trips/${id}`);
      setTrip(tripRes.data.trip || tripRes.data);
      setUserRole(tripRes.data.userRole || "member");

      const planRes = await api.get(`/planner/${id}`);
      const days = planRes.data.days || [];
      setItinerary(days);

      if (days.length > 0 && !days.find((d) => d.dayNumber === activeDay)) {
        setActiveDay(days[0].dayNumber);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load itinerary.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/trips/${id}/members`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Members fetch error:", err);
      setMembers([]);
    }
  };

  const handleDeleteTrip = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this trip?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/trips/${id}`);
      alert("Trip deleted successfully.");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete trip.");
    }
  };

  // ==========================
  // Day CRUD
  // ==========================

  const handleCreateDay = async () => {
    if (!newDay.date) {
      return alert("Please select date.");
    }

    try {
      await api.post("/itineraries", {
        tripId: id,
        dayNumber: itinerary.length + 1,
        date: newDay.date,
        notes: newDay.notes
      });

      setShowAddDayModal(false);
      setNewDay({ date: "", notes: "" });
      fetchTripData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create day.");
    }
  };

  const handleDeleteDay = async (dayId) => {
    const confirmDelete = window.confirm("Delete this day and all activities?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/itineraries/${dayId}`);
      setActiveDay(1);
      fetchTripData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete day.");
    }
  };

  // ==========================
  // Activity CRUD
  // ==========================

  const currentDayData = itinerary.find((day) => day.dayNumber === activeDay);

  const handleCreateActivity = async () => {
    if (!currentDayData) return;
    if (!newActivity.title) {
      return alert("Title is required.");
    }

    try {
      await api.post("/activities", {
        itineraryId: currentDayData._id,
        title: newActivity.title,
        description: newActivity.description,
        location: newActivity.location,
        startTime: newActivity.startTime,
        endTime: newActivity.endTime,
        estimatedCost: Number(newActivity.estimatedCost) || 0
      });

      setShowActivityModal(false);
      setNewActivity({
        title: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        estimatedCost: ""
      });
      fetchTripData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add activity.");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    const confirmDelete = window.confirm("Delete activity?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/activities/${activityId}`);
      fetchTripData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete activity.");
    }
  };

  // ==========================
  // Loading / Error states
  // ==========================

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-compass">🧭</div>
        <p>Plotting your route...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-emoji">🗺️💥</div>
        <p>{error}</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="error-screen">
        <div className="error-emoji">🧐</div>
        <p>Trip not found.</p>
      </div>
    );
  }

  const totalDays = itinerary.length;
  const totalStops = itinerary.reduce(
    (sum, d) => sum + (d.activities?.length || 0),
    0
  );

  return (
    <div className="trip-details-layout">
      {/* ================= HEADER ================= */}
      <header className="details-header">
        <div className="header-blob blob-1"></div>
        <div className="header-blob blob-2"></div>

        <div className="details-nav">
          <Link to="/dashboard" className="back-link">
            <span className="back-arrow">←</span> Dashboard
          </Link>

          <div className="nav-actions">
            {userRole === "owner" && (
              <button onClick={handleDeleteTrip} className="delete-trip-btn">
                🗑️ Delete Trip
              </button>
            )}
          </div>
        </div>

        <div className="trip-hero-content">
          <span className="hero-eyebrow">✈️ Trip Plan</span>
          <h1>{trip.destination}</h1>

          <p className="trip-route">
            <span className="route-pin">📍</span> From {trip.origin}{" "}
            <span className="route-dot">•</span>{" "}
            {new Date(trip.startDate).toLocaleDateString()} →{" "}
            {new Date(trip.endDate).toLocaleDateString()}
          </p>

          <div className="trip-badges">
            <span className="badge badge-budget">
              💰 Budget ₹{trip.budget}
            </span>
            <span className="badge badge-role">
              {userRole === "owner" ? "👑" : "🙋"} {userRole.toUpperCase()}
            </span>
            <span className="badge badge-days">📅 {totalDays} Days</span>
            <span className="badge badge-stops">🎯 {totalStops} Stops</span>
          </div>
        </div>
      </header>

      <TripTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="trip-tab-content">
        {activeTab === "overview" && (
          <TripOverview trip={trip} itinerary={itinerary} userRole={userRole} />
        )}

        {activeTab === "members" && (
          <TripMembers tripId={id} userRole={userRole} />
        )}

        {activeTab === "planner" && (
          <>
            {/* ================= MAP ================= */}
            <div className="map-section">
              <TripMap days={itinerary} />
            </div>

            {/* ================= BODY ================= */}
            <main className="itinerary-container">
              {/* ========= LEFT SIDEBAR ========= */}
              <aside className="day-tabs">
                <div className="sidebar-header">
                  <h3>🗓️ Your Itinerary</h3>

                  {userRole === "owner" && (
                    <button
                      className="add-day-btn"
                      onClick={() => setShowAddDayModal(true)}
                    >
                      + Day
                    </button>
                  )}
                </div>

                {itinerary.length === 0 ? (
                  <div className="no-days">
                    <span className="no-days-emoji">🌴</span>
                    <p>No days planned yet.</p>
                  </div>
                ) : (
                  itinerary.map((day, idx) => (
                    <div
                      key={day._id}
                      className={`tab-btn ${
                        activeDay === day.dayNumber ? "active" : ""
                      }`}
                      style={{ "--accent-index": idx % 5 }}
                      onClick={() => setActiveDay(day.dayNumber)}
                    >
                      <div className="tab-day-number">{day.dayNumber}</div>

                      <div className="tab-info">
                        <div className="tab-title">Day {day.dayNumber}</div>
                        <div className="tab-date">
                          {new Date(day.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric"
                          })}
                        </div>
                      </div>

                      {userRole === "owner" && (
                        <button
                          className="delete-day-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDay(day._id);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </aside>

              {/* ========= ACTIVITIES ========= */}
              <section className="activities-feed">
                {currentDayData ? (
                  <>
                    <div className="feed-header">
                      <div>
                        <h2>
                          🌟 Day {currentDayData.dayNumber} Plan
                        </h2>

                        {currentDayData.notes && (
                          <p className="day-notes">
                            📝 {currentDayData.notes}
                          </p>
                        )}
                      </div>

                      {userRole === "owner" && (
                        <button
                          className="add-activity-btn"
                          onClick={() => setShowActivityModal(true)}
                        >
                          ✨ Add Stop
                        </button>
                      )}
                    </div>

                    {currentDayData.activities?.length > 0 ? (
                      <div className="timeline">
                        {currentDayData.activities.map((activity, idx) => (
                          <div
                            key={activity._id}
                            className="activity-card"
                            style={{ "--accent-index": idx % 5 }}
                          >
                            <div className="activity-bullet"></div>

                            <div className="activity-content">
                              <h3>{activity.title}</h3>

                              {activity.location && (
                                <p className="location">
                                  📍 {activity.location}
                                </p>
                              )}

                              {activity.description && (
                                <p className="description">
                                  {activity.description}
                                </p>
                              )}

                              <div className="activity-meta">
                                {activity.startTime && activity.endTime && (
                                  <span className="meta-chip time-chip">
                                    🕒 {activity.startTime} - {activity.endTime}
                                  </span>
                                )}

                                {activity.estimatedCost > 0 && (
                                  <span className="meta-chip cost-chip">
                                    💰 ₹{activity.estimatedCost}
                                  </span>
                                )}
                              </div>

                              {userRole === "owner" && (
                                <button
                                  className="delete-activity-btn"
                                  onClick={() =>
                                    handleDeleteActivity(activity._id)
                                  }
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-activities">
                        <span className="empty-emoji">🏖️</span>
                        <p>No activities scheduled for this day yet.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-activities">
                    <span className="empty-emoji">👆</span>
                    <p>Select a day to view details.</p>
                  </div>
                )}
              </section>
            </main>
          </>
        )}

        {activeTab === "recommendations" && (
          <TripRecommendations trip={trip} itinerary={itinerary} />
        )}

        {activeTab === "expenses" && (
          <TripExpenses tripId={id} members={members} />
        )}

        {activeTab === "notes" && <TripNotes trip={trip} tripId={id} />}
      </div>

      {/* ================= ADD DAY MODAL ================= */}
      {showAddDayModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>🗓️ Add Day</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddDayModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <label>Date</label>
              <input
                type="date"
                value={newDay.date}
                onChange={(e) =>
                  setNewDay({ ...newDay, date: e.target.value })
                }
              />

              <label>Notes</label>
              <textarea
                placeholder="Optional notes..."
                value={newDay.notes}
                onChange={(e) =>
                  setNewDay({ ...newDay, notes: e.target.value })
                }
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowAddDayModal(false)}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleCreateDay}>
                Create Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD ACTIVITY MODAL ================= */}
      {showActivityModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>✨ Add Stop</h2>
              <button
                className="close-btn"
                onClick={() => setShowActivityModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <label>Title</label>
              <input
                type="text"
                placeholder="Eiffel Tower"
                value={newActivity.title}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, title: e.target.value })
                }
              />

              <label>Description</label>
              <textarea
                placeholder="Optional description..."
                value={newActivity.description}
                onChange={(e) =>
                  setNewActivity({
                    ...newActivity,
                    description: e.target.value
                  })
                }
              />

              <label>Location</label>
              <input
                type="text"
                placeholder="Eiffel Tower, Paris"
                value={newActivity.location}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, location: e.target.value })
                }
              />

              <div className="form-row">
                <div className="form-col">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newActivity.startTime}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        startTime: e.target.value
                      })
                    }
                  />
                </div>

                <div className="form-col">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newActivity.endTime}
                    onChange={(e) =>
                      setNewActivity({
                        ...newActivity,
                        endTime: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <label>Estimated Cost</label>
              <input
                type="number"
                placeholder="500"
                value={newActivity.estimatedCost}
                onChange={(e) =>
                  setNewActivity({
                    ...newActivity,
                    estimatedCost: e.target.value
                  })
                }
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowActivityModal(false)}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleCreateActivity}>
                Add Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}