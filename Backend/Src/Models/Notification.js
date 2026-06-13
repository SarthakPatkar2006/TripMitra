import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who receives this?
    type: { 
        type: String, 
        enum: ['invite_received', 'invite_accepted', 'expense_added', 'trip_update'], 
        required: true 
    },
    message: { type: String, required: true },
    
    // Optional link to the specific trip so the user can click the notification and go there
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }, 
    
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);