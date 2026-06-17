import Trip from "../Models/Trip.js";
import Invitation from "../Models/Invitation.js";
import TripMember from "../Models/TripMember.js";
import Notification from "../Models/Notification.js";
import { sendEmail } from "../Utils/sendEmail.js";

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

    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only trip owner can invite members" });
    }

    const acceptedMember = await TripMember.findOne({
      tripId,
      email: normalizedEmail,
      status: "accepted"
    });

    if (acceptedMember) {
      return res.status(409).json({ message: "User is already a member of this trip" });
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

    await TripMember.findOneAndUpdate(
      { tripId, email: normalizedEmail },
      {
        tripId,
        email: normalizedEmail,
        role: "member",
        status: "pending",
        joinedAt: null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const acceptUrl = `${clientUrl}/invite/accept/${invitation._id}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>TripMitra Invitation</h2>
        <p><strong>${req.user.name || "A friend"}</strong> invited you to join a trip to <strong>${trip.destination}</strong>.</p>
        <p>
          <a href="${acceptUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;">
            View Invitation
          </a>
        </p>
        <p>This invitation expires in 7 days.</p>
      </div>
    `;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendEmail({
        email: normalizedEmail,
        subject: `TripMitra Invite: Join the trip to ${trip.destination}`,
        html,
        message: `${req.user.name || "A friend"} invited you to join a TripMitra trip. Open: ${acceptUrl}`
      });
    } else {
      console.warn("SMTP_USER/SMTP_PASS not configured. Invitation saved, email skipped.");
    }

    res.status(201).json({
      success: true,
      message: "Invitation created successfully",
      invitation
    });
  } catch (error) {
    console.error("Invite member error:", error);
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
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation expired" });
    }

    if (invitation.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "This invitation belongs to another email address" });
    }

    invitation.status = "accepted";
    await invitation.save();

    await TripMember.findOneAndUpdate(
      { tripId: invitation.tripId, email: invitation.email },
      {
        tripId: invitation.tripId,
        userId: req.user._id,
        email: invitation.email,
        role: "member",
        status: "accepted",
        joinedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Notification.create({
      userId: invitation.invitedBy,
      type: "invite_accepted",
      message: `${req.user.name || "A user"} accepted your trip invitation.`,
      tripId: invitation.tripId
    });

    res.status(200).json({
      success: true,
      message: "Invitation accepted"
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
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

    if (invitation.status !== "pending") {
      return res.status(400).json({ message: "Invitation already processed" });
    }

    if (invitation.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "This invitation belongs to another email address" });
    }

    invitation.status = "rejected";
    await invitation.save();

    await TripMember.findOneAndUpdate(
      { tripId: invitation.tripId, email: invitation.email },
      { status: "declined" },
      { new: true }
    );

    await Notification.create({
      userId: invitation.invitedBy,
      type: "trip_update",
      message: `${req.user.name || "A user"} declined your trip invitation.`,
      tripId: invitation.tripId
    });

    res.status(200).json({
      success: true,
      message: "Invitation rejected"
    });
  } catch (error) {
    console.error("Reject invitation error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
