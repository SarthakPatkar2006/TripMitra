import TripMap from "../../pages/TripMap";
import "./TripOverview.css";

export default function TripOverview({
  trip,
  itinerary,
  userRole
}) {
  const totalDays = itinerary.length;

  const totalActivities =
    itinerary.reduce(
      (count, day) =>
        count +
        (day.activities?.length || 0),
      0
    );

  const tripDuration =
    Math.ceil(
      (
        new Date(trip.endDate) -
        new Date(trip.startDate)
      ) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (
        new Date(trip.startDate) -
        new Date()
      ) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="trip-overview">

      {/* ===== Summary ===== */}

      <section className="overview-hero">
        <h2>{trip.destination}</h2>

        <p>
          {trip.origin} →{" "}
          {trip.destination}
        </p>

        <p>
          {new Date(
            trip.startDate
          ).toLocaleDateString()}
          {" - "}
          {new Date(
            trip.endDate
          ).toLocaleDateString()}
        </p>
      </section>

      {/* ===== Stats ===== */}

      <section className="stats-grid">

        <div className="stat-card">
          <h4>Budget</h4>
          <h2>
            ₹
            {Number(
              trip.budget
            ).toLocaleString()}
          </h2>
        </div>

        <div className="stat-card">
          <h4>Duration</h4>
          <h2>
            {tripDuration} Days
          </h2>
        </div>

        <div className="stat-card">
          <h4>Planned Days</h4>
          <h2>{totalDays}</h2>
        </div>

        <div className="stat-card">
          <h4>Activities</h4>
          <h2>
            {totalActivities}
          </h2>
        </div>

        <div className="stat-card">
          <h4>Days Left</h4>
          <h2>{daysLeft}</h2>
        </div>

        <div className="stat-card">
          <h4>Your Role</h4>
          <h2>
            {userRole.toUpperCase()}
          </h2>
        </div>

      </section>

      {/* ===== Preferences ===== */}

      <section className="preferences-card">

        <h3>
          Trip Preferences
        </h3>

        <div className="preferences-grid">

          <div>
            <span>
              Travel Style
            </span>

            <p>
              {trip.travelStyle ||
                "Not specified"}
            </p>
          </div>

          <div>
            <span>
              Transport
            </span>

            <p>
              {trip.transportPreference ||
                "Not specified"}
            </p>
          </div>

          <div>
            <span>
              Accommodation
            </span>

            <p>
              {trip.accommodationType ||
                "Not specified"}
            </p>
          </div>

          <div>
            <span>
              Travelers
            </span>

            <p>
              {trip.numberOfTravelers ||
                1}
            </p>
          </div>

        </div>

      </section>

      {/* ===== Map ===== */}

      <section className="overview-map">
        <h3>Trip Map</h3>

        <TripMap
          days={itinerary}
        />
      </section>

    </div>
  );
}