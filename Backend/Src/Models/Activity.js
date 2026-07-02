import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Itinerary",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    coordinates: {
      latitude: Number,
      longitude: Number,
    },

    category: {
      type: String,
      default: "",
    },

    startTime: {
      type: String,
      default: "",
    },

    endTime: {
      type: String,
      default: "",
    },

    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    estimatedDuration: {
      type: Number, // minutes
      default: 60,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      enum: ["Geoapify", "User"],
      default: "Geoapify",
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Activity", activitySchema);