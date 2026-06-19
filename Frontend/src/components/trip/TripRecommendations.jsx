import {
  useEffect,
  useState
} from "react";

import {
  getRecommendations
} from "../../api/recommendationApi";

import "./TripRecommendations.css";

export default function TripRecommendations({
  trip
}) {
  const [loading,
    setLoading] =
    useState(true);

 const [data,
  setData] =
  useState({
    attractions: [],
    restaurants: [],
    hotels: [],
    transport: [],
    tips: []
  });

  useEffect(() => {
    fetchRecommendations();
  }, [trip._id]);

  const fetchRecommendations =
    async () => {
      try {
        setLoading(true);

        const res =
          await getRecommendations(
            trip._id
          );

        setData(
          res.data
            .recommendations
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  if (loading) {
    return (
      <p>
        Loading
        recommendations...
      </p>
    );
  }

  return (
    <div className="recommendations">

      {/* Attractions */}

      <section>
        <h2>
          🏛️ Attractions
        </h2>

        <div className="card-grid">
          {data.attractions.map(
            (item, index) => (
              <div
                key={index}
                className="recommendation-card"
              >
                <h3>
                  {item.name}
                </h3>

                <p>
                  Duration:
                  {" "}
                  {
                    item.duration
                  }
                </p>

                <p>
                  Cost: ₹
                  {
                    item.cost
                  }
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Restaurants */}

      <section>
        <h2>
          🍽️ Restaurants
        </h2>

        <div className="card-grid">
          {data.restaurants.map(
            (item, index) => (
              <div
                key={index}
                className="recommendation-card"
              >
                <h3>
                  {item.name}
                </h3>

                <p>
                  {
                    item.cuisine
                  }
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Hotels */}

      <section>
        <h2>🏨 Hotels</h2>

        <div className="card-grid">
          {data.hotels.map(
            (item, index) => (
              <div
                key={index}
                className="recommendation-card"
              >
                <h3>
                  {item.name}
                </h3>

                <p>
                  ₹
                  {
                    item.price
                  }
                  /night
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Transport */}

      <section>
        <h2>
          🚕 Transport
        </h2>

        <div className="card-grid">
          {data.transport.map(
            (item, index) => (
              <div
                key={index}
                className="recommendation-card"
              >
                <h3>
                  {item.type}
                </h3>

                <p>
                  ₹
                  {
                    item.price
                  }
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Tips */}

      <section>
        <h2>
          ✨ AI Suggestions
        </h2>

        <div className="tips">
          {data.tips.map(
            (tip, index) => (
              <p
                key={index}
              >
                • {tip}
              </p>
            )
          )}
        </div>
      </section>

    </div>
  );
}