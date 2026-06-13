import mongoose from "mongoose";

const itinerarySchema =
  new mongoose.Schema(
    {
      tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true
      },

      dayNumber: {
        type: Number,
        required: true
      },

      date: {
        type: Date,
        required: true
      },

      notes: {
        type: String,
        default: ""
      }
    },
    {
      timestamps: true
    }
  );

export default mongoose.model(
  "Itinerary",
  itinerarySchema
);