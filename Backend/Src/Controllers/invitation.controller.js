import Trip from "../Models/Trip.js";
import Invitation from "../Models/Invitation.js";
import TripMember from "../Models/TripMember.js";

export async function inviteMember(req, res) {
  try {

    const { email } = req.body;
    const { tripId } = req.params;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    if (
      normalizedEmail ===
      req.user.email.toLowerCase()
    ) {
      return res.status(400).json({
        message: "You cannot invite yourself"
      });
    }

    const trip = await Trip.findById(
      tripId
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found"
      });
    }

    const ownerMembership =
      await TripMember.findOne({
        tripId,
        userId: req.user._id,
        role: "owner"
      });

    if (!ownerMembership) {
      return res.status(403).json({
        message:
          "Only trip owner can invite members"
      });
    }

    const existingInvitation =
      await Invitation.findOne({
        tripId,
        email: normalizedEmail,
        status: "pending"
      });

    if (existingInvitation) {
      return res.status(409).json({
        message:
          "Invitation already exists"
      });
    }

    const invitation =
      await Invitation.create({
        tripId,
        email: normalizedEmail,
        invitedBy: req.user._id,
        expiresAt: new Date(
          Date.now() +
          7 * 24 * 60 * 60 * 1000
        )
      });

    res.status(201).json({
      success: true,
      message:
        "Invitation created successfully",
      invitation
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message:
        "Internal Server Error"
    });

  }
}
export async function acceptInvitation(req, res) {
  try {

    const { id } = req.params;

    const invitation =
      await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found"
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        message: "Invitation already processed"
      });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({
        message: "Invitation expired"
      });
    }

    const existingMember =
      await TripMember.findOne({
        tripId: invitation.tripId,
        userId: req.user._id
      });

    if (existingMember) {
      return res.status(409).json({
        message: "Already a member"
      });
    }

    invitation.status = "accepted";
    await invitation.save();

    await TripMember.create({
      tripId: invitation.tripId,
      userId: req.user._id,
      role: "member"
    });

    res.status(200).json({
      success: true,
      message: "Invitation accepted"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}
export async function rejectInvitation(req, res) {
  try {

    const { id } = req.params;

    const invitation =
      await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found"
      });
    }

    invitation.status = "rejected";

    await invitation.save();

    res.status(200).json({
      success: true,
      message: "Invitation rejected"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}