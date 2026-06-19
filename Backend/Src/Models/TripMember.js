import mongoose from "mongoose";

const tripMemberSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member"
    },

    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

tripMemberSchema.index(
  {
    tripId: 1,
    userId: 1
  },
  {
    unique: true
  }
);

export default mongoose.models.TripMember ||
  mongoose.model(
    "TripMember",
    tripMemberSchema
  );