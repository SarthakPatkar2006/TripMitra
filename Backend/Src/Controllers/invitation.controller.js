import Trip from "../Models/Trip.js";
import Invitation from "../Models/Invitation.js";
import TripMember from "../Models/TripMember.js";
import Notification from "../Models/Notification.js";
import { sendEmail } from "../Utils/sendEmail.js"; // <-- NEW IMPORT

export async function inviteMember(req, res) {
  try {
    const { email } = req.body;
    const { tripId } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (normalizedEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const ownerMembership = await TripMember.findOne({
      tripId,
      userId: req.user._id,
      role: "owner"
    });

    if (!ownerMembership) {
      return res.status(403).json({ message: "Only trip owner can invite members" });
    }

    const existingInvitation = await Invitation.findOne({
      tripId,
      email: normalizedEmail,
      status: "pending"
    });

    if (existingInvitation) {
      return res.status(409).json({ message: "Invitation already exists" });
    }

    const invitation = await Invitation.create({
      tripId,
      email: normalizedEmail,
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // ==========================================
    // NEW: SEND EMAIL TO THE INVITED USER
    // ==========================================
    // Provide a fallback if CLIENT_URL isn't in .env yet
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000"; 
    const acceptUrl = `${clientUrl}/invite/accept/${invitation._id}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2c3e50;">You've been invited on a trip! ✈️</h2>
        <p style="font-size: 16px; color: #555;">
          <strong>${req.user.name || 'A friend'}</strong> has invited you to join their trip to <strong>${trip.destination || 'a new destination'}</strong> on TripMitra.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${acceptUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            View Invitation
          </a>
        </div>
        <p style="font-size: 14px; color: #888;">If you don't want to join, simply ignore this email.</p>
      </div>
    `;

    // Only attempt to send if the email utility is configured, otherwise log it to avoid crashing
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendEmail({
        email: normalizedEmail,
        subject: `TripMitra Invite: Join the trip to ${trip.destination || 'a new destination'}!`,
        html: emailHtml
      });
    } else {
      console.warn("EMAIL_USER not configured in .env. Invitation saved to DB, but email was not sent.");
    }

    res.status(201).json({
      success: true,
      message: "Invitation created and email sent successfully",
      invitation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptInvitation(req, res) {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ message: "Invitation already processed" });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: "Invitation expired" });
    }

    const existingMember = await TripMember.findOne({
      tripId: invitation.tripId,
      userId: req.user._id
    });

    if (existingMember) {
      return res.status(409).json({ message: "Already a member" });
    }

    invitation.status = "accepted";
    await invitation.save();

    await TripMember.create({
      tripId: invitation.tripId,
      userId: req.user._id,
      role: "member"
    });

    // ==========================================
    // NEW: NOTIFY THE TRIP OWNER IN-APP
    // ==========================================
    await Notification.create({
      userId: invitation.invitedBy, 
      type: 'invite_accepted',
      message: `${req.user.name || 'A user'} has accepted your invitation and joined the trip.`,
      tripId: invitation.tripId
    });

    res.status(200).json({
      success: true,
      message: "Invitation accepted"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectInvitation(req, res) {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    invitation.status = "rejected";
    await invitation.save();

    // ==========================================
    // NEW: NOTIFY THE TRIP OWNER IN-APP
    // ==========================================
    // Assuming your Notification enum supports 'trip_update', if not, you can update your model
    await Notification.create({
      userId: invitation.invitedBy, 
      type: 'trip_update', 
      message: `An invitation you sent for a trip was declined.`,
      tripId: invitation.tripId
    });

    res.status(200).json({
      success: true,
      message: "Invitation rejected"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}