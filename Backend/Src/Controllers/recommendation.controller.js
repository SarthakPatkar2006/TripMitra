import Trip from "../Models/Trip.js";

import {
  buildRecommendations
} from "../Services/recommendation.service.js";

export const getRecommendations =
  async (
    req,
    res
  ) => {
    try {
      const { tripId } =
        req.params;

      const trip =
        await Trip.findById(
          tripId
        );

      if (!trip) {
        return res
          .status(404)
          .json({
            message:
              "Trip not found"
          });
      }

      const recommendations =
        buildRecommendations(
          trip
        );

      res.status(200).json({
        success: true,
        recommendations
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(500).json({
        message:
          "Internal Server Error"
      });
    }
  };