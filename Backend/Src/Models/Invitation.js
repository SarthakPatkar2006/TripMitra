import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    token: {
      type: String,
      required: true,
      unique: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "expired"
      ],
      default: "pending"
    },
    

    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);
export default mongoose.model(
  "Invitation",
  invitationSchema
);