import TripMember from "../Models/TripMember.js";
import Trip from "../Models/Trip.js";

export async function getTripMembers(
  req,
  res
) {
  try {
    const { tripId } =
      req.params;

    const trip =
      await Trip.findById(
        tripId
      ).populate(
        "owner",
        "name email"
      );

    if (!trip) {
      return res.status(404).json({
        message:
          "Trip not found"
      });
    }

    const members =
      await TripMember.find({
        tripId,
        status:
          "accepted"
      }).populate(
        "userId",
        "name email"
      );

    res.status(200).json({
      success: true,
      owner: trip.owner,
      members
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Internal Server Error"
    });
  }
}