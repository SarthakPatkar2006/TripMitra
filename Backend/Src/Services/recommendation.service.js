export function buildRecommendations(
  trip
) {
  const recommendations = {
    attractions: [],
    restaurants: [],
    hotels: [],
    transport: [],
    tips: []
  };

  const destination =
    trip.destination.toLowerCase();

  /*
  GOA
  */

  if (
    destination.includes("goa")
  ) {
    recommendations.attractions =
      [
        {
          name:
            "Fort Aguada",
          duration:
            "2 hours",
          cost: 200
        },
        {
          name:
            "Baga Beach",
          duration:
            "3 hours",
          cost: 0
        },
        {
          name:
            "Dudhsagar Falls",
          duration:
            "Full Day",
          cost: 500
        }
      ];

    recommendations.restaurants =
      [
        {
          name:
            "Fisherman's Wharf",
          cuisine:
            "Seafood"
        },
        {
          name:
            "Martin's Corner",
          cuisine:
            "Goan"
        }
      ];
  }

  /*
  HOTELS
  */

  if (
    trip.budget <= 15000
  ) {
    recommendations.hotels =
      [
        {
          name:
            "Zostel Goa",
          price: 1200
        },
        {
          name:
            "Whoopers Hostel",
          price: 1500
        }
      ];
  } else if (
    trip.budget <= 50000
  ) {
    recommendations.hotels =
      [
        {
          name:
            "Radisson Blu",
          price: 5000
        },
        {
          name:
            "Holiday Inn",
          price: 4500
        }
      ];
  } else {
    recommendations.hotels =
      [
        {
          name:
            "Taj Exotica",
          price: 7000
        },
        {
          name:
            "ITC Grand Goa",
          price: 8500
        }
      ];
  }

  /*
  TRANSPORT
  */

  if (
    trip.transportPreference ===
    "flight"
  ) {
    recommendations.transport =
      [
        {
          type:
            "Flight",
          note:
            "Fastest option"
        },
        {
          type:
            "Bike Rental",
          note:
            "Best for local travel"
        }
      ];
  } else {
    recommendations.transport =
      [
        {
          type:
            "Train",
          note:
            "Budget friendly"
        },
        {
          type:
            "Taxi",
          note:
            "Convenient for groups"
        }
      ];
  }

  /*
  TIPS
  */

  recommendations.tips =
    [
      "Visit beaches during sunset.",
      "Reserve one full day for major attractions.",
      "Book activities in advance."
    ];

  return recommendations;
}