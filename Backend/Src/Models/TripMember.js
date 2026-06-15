import mongoose from 'mongoose';

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
      default: null // Allowed to be null while the invite is pending!
    },
    email: { 
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member"
    },
    status: { 
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
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

// Changed the index to track unique emails per trip, rather than userIds
tripMemberSchema.index(
  { tripId: 1, email: 1 },
  { unique: true }
);

export default mongoose.model("TripMember", tripMemberSchema);