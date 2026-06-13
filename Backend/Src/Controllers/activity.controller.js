import Activity from "../Models/Activity.js";

export async function addActivity(req, res) {
  try {

    const {
      itineraryId,
      title,
      description,
      location,
      startTime,
      endTime,
      estimatedCost
    } = req.body;

    if (!itineraryId || !title) {
      return res.status(400).json({
        message: "Itinerary ID and title are required"
      });
    }

    const activity =
      await Activity.create({
        itineraryId,
        title,
        description,
        location,
        startTime,
        endTime,
        estimatedCost
      });

    res.status(201).json({
      success: true,
      activity
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}

export async function updateActivity(req, res) {
  try {

    const { id } = req.params;

    const activity =
      await Activity.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!activity) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    res.status(200).json({
      success: true,
      activity
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}

export async function deleteActivity(req, res) {
  try {

    const { id } = req.params;

    const activity =
      await Activity.findByIdAndDelete(id);

    if (!activity) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error"
    });

  }
}