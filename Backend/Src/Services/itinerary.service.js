import Itinerary from "../Models/Itinerary.js";
import Activity from "../Models/Activity.js";

export const createDayService = async (data) => {
  return await Itinerary.create(data);
};

export const getTripDaysService = async (tripId) => {
  const days = await Itinerary.find({
    tripId
  }).sort({
    dayNumber: 1
  });

  const result = [];

  for (const day of days) {
    const activities = await Activity.find({
      itineraryId: day._id
    }).sort({
      startTime: 1
    });

    result.push({
      ...day.toObject(),
      activities
    });
  }

  return result;
};

export const getDayService = async (id) => {
  const day = await Itinerary.findById(id);

  if (!day) return null;

  const activities = await Activity.find({
    itineraryId: id
  });

  return {
    ...day.toObject(),
    activities
  };
};

export const updateDayService = async (
  id,
  data
) => {
  return await Itinerary.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true
    }
  );
};

export const deleteDayService =
  async (id) => {

  const day =
    await Itinerary.findById(id);

  if (!day) {
    return null;
  }

  const tripId =
    day.tripId;

  const deletedDayNumber =
    day.dayNumber;

  await Activity.deleteMany({
    itineraryId: id
  });

  await Itinerary.findByIdAndDelete(
    id
  );

  const remainingDays =
    await Itinerary.find({
      tripId
    }).sort({
      dayNumber: 1
    });

  for (
    let i = 0;
    i < remainingDays.length;
    i++
  ) {
    remainingDays[i].dayNumber =
      i + 1;

    await remainingDays[i].save();
  }

  return day;
};