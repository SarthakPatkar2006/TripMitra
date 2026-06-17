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
      default: null
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },
    joinedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

tripMemberSchema.index({ tripId: 1, email: 1 }, { unique: true });

export default mongoose.model("TripMember", tripMemberSchema);
