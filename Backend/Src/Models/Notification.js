import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who receives this?
    type: {
  type: String,
  enum: [
    'invite_received',
    'invite_accepted',
    'expense_added',
    'expense_settled',
    'trip_update',
    'itinerary_updated',
    'note_added',
    'removed_from_trip',
    'expense_updated',
    'expense_deleted',
  ],
  required: true
},
    message: { type: String, required: true },
    
    // Optional link to the specific trip so the user can click the notification and go there
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }, 
    
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    notificationSchema
  );