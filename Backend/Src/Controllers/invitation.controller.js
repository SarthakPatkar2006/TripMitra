import Trip from "../Models/Trip.js";
import User from "../Models/User.js";
import Invitation from "../Models/Invitation.js";
import TripMember from "../Models/TripMember.js";
import Notification from "../Models/Notification.js";
import { sendEmail } from "../Utils/sendEmail.js";
import { randomBytes } from "crypto";
export async function inviteMember(req, res) {
  try {
    const token=randomBytes(32).toString("hex");
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

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const existingMember = await TripMember.findOne({ tripId, userId: user._id });
      if (existingMember) {
        return res.status(409).json({ message: "User is already a member of this trip" });
      }
    }

    const existingInvitation = await Invitation.findOne({
      tripId,
      email: normalizedEmail,
      status: "pending"
    });

    if (existingInvitation) {
      return res.status(409).json({ message: "Invitation already exists" });
    }

    const invitation =
  await Invitation.create({
    tripId,
    email: normalizedEmail,
    invitedBy: req.user._id,
    token,
    expiresAt:
      new Date(
        Date.now() +
        7 *
        24 *
        60 *
        60 *
        1000
      )
  });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const acceptUrl =
`${clientUrl}/invite/${token}`;

   const html = `
<div style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px;">
  <div
    style="
      max-width:600px;
      margin:auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,0.08);
    "
  >

    <div
      style="
        background:#2563eb;
        padding:30px;
        text-align:center;
      "
    >
      <h1
        style="
          color:#ffffff;
          margin:0;
          font-size:30px;
        "
      >
        ✈️ TripMitra
      </h1>

      <p
        style="
          color:#dbeafe;
          margin-top:10px;
          font-size:16px;
        "
      >
        Collaborative Trip Planning Made Easy
      </p>
    </div>

    <div style="padding:40px;">

      <h2
        style="
          color:#0f172a;
          margin-bottom:20px;
        "
      >
        You're Invited 🎉
      </h2>

      <p
        style="
          color:#475569;
          font-size:16px;
          line-height:28px;
        "
      >
        <strong>${req.user.name}</strong>
        invited you to join a trip on
        <strong>TripMitra</strong>.
      </p>

      <div
        style="
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:12px;
          padding:20px;
          margin:30px 0;
        "
      >
        <p
          style="
            margin:0;
            color:#64748b;
            font-size:14px;
          "
        >
          Destination
        </p>

        <h3
          style="
            margin-top:8px;
            color:#0f172a;
          "
        >
          ${trip.destination}
        </h3>

        <p
          style="
            margin-top:20px;
            color:#64748b;
            font-size:14px;
          "
        >
          Dates
        </p>

        <h4
          style="
            margin-top:8px;
            color:#0f172a;
          "
        >
          ${new Date(
            trip.startDate
          ).toLocaleDateString()}
          -
          ${new Date(
            trip.endDate
          ).toLocaleDateString()}
        </h4>
      </div>

      <div style="text-align:center;">
        <a
          href="${acceptUrl}"
          style="
            display:inline-block;
            background:#2563eb;
            color:#ffffff;
            text-decoration:none;
            padding:14px 28px;
            border-radius:12px;
            font-size:16px;
            font-weight:600;
          "
        >
          View Invitation
        </a>
      </div>

      <p
        style="
          margin-top:35px;
          color:#64748b;
          font-size:14px;
          line-height:24px;
        "
      >
        If you don't have a TripMitra account,
        you can create one and then accept
        this invitation.
      </p>

      <p
        style="
          color:#64748b;
          font-size:14px;
          line-height:24px;
        "
      >
        This invitation will expire in
        <strong>7 days</strong>.
      </p>

    </div>

    <div
      style="
        background:#f8fafc;
        padding:20px;
        text-align:center;
        color:#94a3b8;
        font-size:13px;
      "
    >
      © ${new Date().getFullYear()}
      TripMitra · Plan together, travel better.
    </div>

  </div>
</div>
`;

await sendEmail({
  email: normalizedEmail,
  subject: `✈️ ${req.user.name} invited you to join a trip to ${trip.destination}`,
  html,
  message: `${req.user.name} invited you to join a trip to ${trip.destination}.`
});    

    res.status(201).json({ success: true, message: "Invitation created successfully", invitation });
  } catch (error) {
    console.error("Invite member error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptInvitation(req, res) {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id);

    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    if (invitation.status !== "pending") return res.status(400).json({ message: "Invitation already processed" });

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation expired" });
    }

    if (invitation.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "This invitation belongs to another email address" });
    }

    const existingMember = await TripMember.findOne({ tripId: invitation.tripId, userId: req.user._id });
    if (existingMember) return res.status(409).json({ message: "You are already a member of this trip" });

    invitation.status = "accepted";
    await invitation.save();

    await TripMember.create({ tripId: invitation.tripId, userId: req.user._id, role: "member" });
    await Notification.create({
      userId: invitation.invitedBy,
      type: "invite_accepted",
      message: `${req.user.name || "A user"} accepted your trip invitation.`,
      tripId: invitation.tripId
    });

    res.status(200).json({ success: true, message: "Invitation accepted" });
  } catch (error) {
    console.error("Accept invitation error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectInvitation(req, res) {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id);

    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    if (invitation.status !== "pending") return res.status(400).json({ message: "Invitation already processed" });

    if (invitation.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "This invitation belongs to another email address" });
    }

    invitation.status = "declined";
    await invitation.save();

    await Notification.create({
      userId: invitation.invitedBy,
      type: "trip_update",
      message: `${req.user.name || "A user"} declined your trip invitation.`,
      tripId: invitation.tripId
    });

    res.status(200).json({ success: true, message: "Invitation declined" });
  } catch (error) {
    console.error("Reject invitation error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyInvitations(req, res) {
  try {
    const email = req.user.email.toLowerCase();

    // Mark expired invitations as 'expired' before fetching valid ones
    await Invitation.updateMany(
      { email, status: "pending", expiresAt: { $lte: new Date() } },
      { status: "expired" }
    );

    const invitations = await Invitation.find({
      email,
      status: "pending",
      expiresAt: { $gt: new Date() }
    })
      .populate("invitedBy", "name email profileImage")
      .populate("tripId", "title destination startDate endDate")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: invitations.length, invitations });
  } catch (error) {
    console.error("Get invitations error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function removeMember(req, res) {
  try {
    const { tripId, memberId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) return res.status(404).json({ message: "Trip not found" });
    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can remove members" });
    }

    const member = await TripMember.findOne({ tripId, userId: memberId });
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (member.role === "owner") return res.status(400).json({ message: "Owner cannot be removed" });

    await member.deleteOne();
    await Notification.create({
      userId: memberId,
      tripId,
      type: "removed_from_trip",
      message: `You have been removed from ${trip.title}`
    });

    res.status(200).json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getPendingInvitations(
  req,
  res
) {
  try {
    const { tripId } =
      req.params;

    const trip =
      await Trip.findById(
        tripId
      );

    if (!trip) {
      return res.status(404).json({
        message:
          "Trip not found"
      });
    }

    if (
      trip.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only owner can view pending invitations"
      });
    }

    const invitations =
      await Invitation.find({
        tripId,
        status: "pending"
      })
        .select(
          "email createdAt"
        )
        .sort({
          createdAt: -1
        });

    res.status(200).json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error(
      "Get pending invitations error:",
      error
    );

    res.status(500).json({
      message:
        "Internal Server Error"
    });
  }
}
export async function getInvitationByToken(
  req,
  res
) {
  try {
    const { token } = req.params;

    const invitation =
      await Invitation.findOne({
        token
      })
        .populate(
          "tripId",
          "title destination startDate endDate"
        )
        .populate(
          "invitedBy",
          "name email"
        );

    if (!invitation) {
      return res.status(404).json({
        message:
          "Invitation not found"
      });
    }

    if (
      invitation.status !==
      "pending"
    ) {
      return res.status(400).json({
        message:
          "Invitation already processed"
      });
    }

    if (
      new Date() >
      invitation.expiresAt
    ) {
      invitation.status =
        "expired";

      await invitation.save();

      return res.status(400).json({
        message:
          "Invitation expired"
      });
    }

    res.status(200).json({
      success: true,
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