import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import "./TripDetails.css";
import TripMap from "./TripMap";
import ExpenseDashboard from "../components/ExpenseDashboard";
export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [userRole, setUserRole] = useState("member");
  const [activeDay, setActiveDay] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Day Modal
  const [showAddDayModal, setShowAddDayModal] =
    useState(false);

  const [newDay, setNewDay] = useState({
    date: "",
    notes: ""
  });

  // Activity Modal
  const [showActivityModal,
    setShowActivityModal] =
    useState(false);

  const [newActivity,
    setNewActivity] =
    useState({
      title: "",
      description: "",
      location: "",
      startTime: "",
      endTime: "",
      estimatedCost: ""
    });

  useEffect(() => {
    fetchTripData();
  }, [id]);

  const fetchTripData = async () => {
    try {
      setIsLoading(true);

      const tripRes =
        await api.get(`/trips/${id}`);

      setTrip(
        tripRes.data.trip ||
        tripRes.data
      );

      setUserRole(
        tripRes.data.userRole ||
        "member"
      );

      const planRes =
        await api.get(`/planner/${id}`);

      const days =
        planRes.data.days || [];

      setItinerary(days);

      if (
        days.length > 0 &&
        !days.find(
          (d) =>
            d.dayNumber ===
            activeDay
        )
      ) {
        setActiveDay(
          days[0].dayNumber
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Could not load itinerary."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================
  // Trip
  // ==========================

  const handleDeleteTrip =
    async () => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to permanently delete this trip?"
        );

      if (!confirmDelete) return;

      try {
        await api.delete(
          `/trips/${id}`
        );

        alert(
          "Trip deleted successfully."
        );

        navigate(
          "/dashboard"
        );
      } catch (err) {
        alert(
          err.response?.data
            ?.message ||
            "Failed to delete trip."
        );
      }
    };

  // ==========================
  // Day CRUD
  // ==========================

  const handleCreateDay =
    async () => {
      if (!newDay.date) {
        return alert(
          "Please select date."
        );
      }

      try {
        await api.post(
          "/itineraries",
          {
            tripId: id,
            dayNumber:
              itinerary.length + 1,
            date:
              newDay.date,
            notes:
              newDay.notes
          }
        );

        setShowAddDayModal(
          false
        );

        setNewDay({
          date: "",
          notes: ""
        });

        fetchTripData();
      } catch (err) {
        alert(
          err.response?.data
            ?.message ||
            "Failed to create day."
        );
      }
    };

  const handleDeleteDay =
    async (dayId) => {
      const confirmDelete =
        window.confirm(
          "Delete this day and all activities?"
        );

      if (!confirmDelete)
        return;

      try {
        await api.delete(
          `/itineraries/${dayId}`
        );

        setActiveDay(1);


        fetchTripData();
      } catch (err) {
        alert(
          err.response?.data
            ?.message ||
            "Failed to delete day."
        );
      }
    };

  // ==========================
  // Activity CRUD
  // ==========================

  const currentDayData =
    itinerary.find(
      (day) =>
        day.dayNumber ===
        activeDay
    );

  const handleCreateActivity =
    async () => {
      if (!currentDayData) {
        return;
      }

      if (
        !newActivity.title
      ) {
        return alert(
          "Title is required."
        );
      }

      try {
        await api.post(
          "/activities",
          {
            itineraryId:
              currentDayData._id,

            title:
              newActivity.title,

            description:
              newActivity.description,

            location:
              newActivity.location,

            startTime:
              newActivity.startTime,

            endTime:
              newActivity.endTime,

            estimatedCost:
              Number(
                newActivity
                  .estimatedCost
              ) || 0
          }
        );

        setShowActivityModal(
          false
        );

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
        alert(
          err.response?.data
            ?.message ||
            "Failed to add activity."
        );
      }
    };

  const handleDeleteActivity =
    async (activityId) => {
      const confirmDelete =
        window.confirm(
          "Delete activity?"
        );

      if (!confirmDelete)
        return;

      try {
        await api.delete(
          `/activities/${activityId}`
        );

        fetchTripData();
      } catch (err) {
        alert(
          err.response?.data
            ?.message ||
            "Failed to delete activity."
        );
      }
    };

  // Loading Screens

  if (isLoading) {
    return (
      <div className="loading-screen">
        Loading Itinerary...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        {error}
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="error-screen">
        Trip not found.
      </div>
    );
  }

  // PART 2 STARTS BELOW
  return (
    <div className="trip-details-layout">
  {/* ================= HEADER ================= */}

  <header className="details-header">
    <div className="details-nav">
      <Link
        to="/dashboard"
        className="back-link"
      >
        &larr; Dashboard
      </Link>

      <div className="nav-actions">
        {userRole === "owner" && (
          <button
            onClick={handleDeleteTrip}
            className="delete-trip-btn"
          >
            🗑️ Delete Trip
          </button>
        )}
      </div>
    </div>

    <div className="trip-hero-content">
      <h1>{trip.destination}</h1>

      <p className="trip-route">
        Starting from {trip.origin} •{" "}
        {new Date(
          trip.startDate
        ).toLocaleDateString()}
        {" "}to{" "}
        {new Date(
          trip.endDate
        ).toLocaleDateString()}
      </p>

      <div className="trip-badges">
        <span className="badge budget">
          Budget: ₹{trip.budget}
        </span>

        <span className="badge group">
          Role:
          {" "}
          {userRole.toUpperCase()}
        </span>
      </div>
    </div>
  </header>

  {/* ================= MAP ================= */}

  <div
    className="map-section"
    style={{
      margin: "20px 0",
      zIndex: 1
    }}
  >
    <TripMap days={itinerary} />
  </div>

  {/* ================= BODY ================= */}

  <main className="itinerary-container">

    {/* ========= LEFT SIDEBAR ========= */}

    <aside className="day-tabs">

      <div className="sidebar-header">
        <h3>Your Itinerary</h3>

        {userRole === "owner" && (
          <button
            className="add-day-btn"
            onClick={() =>
              setShowAddDayModal(true)
            }
          >
            + Day
          </button>
        )}
      </div>

      {itinerary.length === 0 ? (
        <p className="no-days">
          No days planned yet.
        </p>
      ) : (
        itinerary.map((day) => (
          <div
            key={day._id}
            className={`tab-btn ${
              activeDay === day.dayNumber
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveDay(
                day.dayNumber
              )
            }
          >
            <div className="tab-title">
              Day {day.dayNumber}
            </div>

            <div className="tab-date">
              {new Date(
                day.date
              ).toLocaleDateString(
                undefined,
                {
                  weekday:
                    "short",
                  month:
                    "short",
                  day: "numeric"
                }
              )}
            </div>

            {userRole ===
              "owner" && (
              <button
                className="delete-day-btn"
                onClick={(e) => {
                  e.stopPropagation();

                  handleDeleteDay(
                    day._id
                  );
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
                Day{" "}
                {
                  currentDayData.dayNumber
                }{" "}
                Plan
              </h2>

              {currentDayData.notes && (
                <p className="day-notes">
                  📝{" "}
                  {
                    currentDayData.notes
                  }
                </p>
              )}
            </div>

            {userRole ===
              "owner" && (
              <button
                className="add-activity-btn"
                onClick={() =>
                  setShowActivityModal(
                    true
                  )
                }
              >
                + Add Stop
              </button>
            )}
          </div>

          {currentDayData.activities &&
          currentDayData.activities
            .length > 0 ? (
            <div className="timeline">

              {currentDayData.activities.map(
                (activity) => (
                  <div
                    key={
                      activity._id
                    }
                    className="activity-card"
                  >
                    <div className="activity-bullet"></div>

                    <div className="activity-content">

                      <h3>
                        {
                          activity.title
                        }
                      </h3>

                      {activity.location && (
                        <p className="location">
                          📍{" "}
                          {
                            activity.location
                          }
                        </p>
                      )}

                      {activity.description && (
                        <p className="description">
                          {
                            activity.description
                          }
                        </p>
                      )}

                      {activity.startTime &&
                        activity.endTime && (
                          <p>
                            🕒{" "}
                            {
                              activity.startTime
                            }
                            {" "}
                            -
                            {" "}
                            {
                              activity.endTime
                            }
                          </p>
                        )}

                      {activity.estimatedCost >
                        0 && (
                        <p>
                          💰 ₹
                          {
                            activity.estimatedCost
                          }
                        </p>
                      )}

                      {userRole ===
                        "owner" && (
                        <button
                          className="delete-activity-btn"
                          onClick={() =>
                            handleDeleteActivity(
                              activity._id
                            )
                          }
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="empty-activities">
              <p>
                No activities
                scheduled for this
                day yet.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="empty-activities">
          <p>
            Select a day to
            view details.
          </p>
        </div>
      )}
    </section>
  </main>

  {/* ================= ADD DAY MODAL ================= */}

  {showAddDayModal && (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Day</h2>

        <input
          type="date"
          value={newDay.date}
          onChange={(e) =>
            setNewDay({
              ...newDay,
              date:
                e.target.value
            })
          }
        />

        <textarea
          rows={4}
          placeholder="Notes"
          value={newDay.notes}
          onChange={(e) =>
            setNewDay({
              ...newDay,
              notes:
                e.target.value
            })
          }
        />

        <div className="modal-actions">
          <button
            onClick={
              handleCreateDay
            }
          >
            Save
          </button>

          <button
            onClick={() =>
              setShowAddDayModal(
                false
              )
            }
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ================= ADD ACTIVITY MODAL ================= */}

  {showActivityModal && (
    <div className="modal-overlay">
      <div className="modal-content">

        <h2>Add Activity</h2>

        <input
          placeholder="Title"
          value={
            newActivity.title
          }
          onChange={(e) =>
            setNewActivity({
              ...newActivity,
              title:
                e.target.value
            })
          }
        />

        <input
          placeholder="Location"
          value={
            newActivity.location
          }
          onChange={(e) =>
            setNewActivity({
              ...newActivity,
              location:
                e.target.value
            })
          }
        />

        <textarea
          rows={4}
          placeholder="Description"
          value={
            newActivity.description
          }
          onChange={(e) =>
            setNewActivity({
              ...newActivity,
              description:
                e.target.value
            })
          }
        />

        <input
          type="time"
          value={
            newActivity.startTime
          }
          onChange={(e) =>
            setNewActivity({
              ...newActivity,
              startTime:
                e.target.value
            })
          }
        />

        <input
          type="time"
          value={
            newActivity.endTime
          }
          onChange={(e) =>
            setNewActivity({
              ...newActivity,
              endTime:
                e.target.value
            })
          }
        />

        <input
          type="number"
          placeholder="Estimated Cost"
          value={
            newActivity.estimatedCost
          }
          onChange={(e) =>
            setNewActivity({
              ...newActivity,
              estimatedCost:
                e.target.value
            })
          }
        />

        <div className="modal-actions">
          <button
            onClick={
              handleCreateActivity
            }
          >
            Save
          </button>

          <button
            onClick={() =>
              setShowActivityModal(
                false
              )
            }
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}
  <ExpenseDashboard
  trip={trip}
  tripId={id}
/>
</div>
);
}