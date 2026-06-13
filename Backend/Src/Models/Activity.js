import mongoose from "mongoose";

const activitySchema =
  new mongoose.Schema(
    {
      itineraryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Itinerary",
        required: true
      },

      title: {
        type: String,
        required: true
      },

      description: {
        type: String,
        default: ""
      },

      location: {
        type: String,
        default: ""
      },

      startTime: {
        type: String
      },

      endTime: {
        type: String
      },

      estimatedCost: {
        type: Number,
        default: 0
      }
    },
    {
      timestamps: true
    }
  );

export default mongoose.model(
  "Activity",
  activitySchema
);