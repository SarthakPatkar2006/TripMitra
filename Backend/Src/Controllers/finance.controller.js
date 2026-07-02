import mongoose from "mongoose";
import Trip from "../Models/Trip.js";
import Expense from "../Models/Expense.js";
import TripMember from "../Models/TripMember.js";
import { calculateSettlements } from "../Services/expense.service.js";

const round = (num) => Math.round(num * 100) / 100;

const capitalize = (str) =>
  typeof str === "string" && str.length > 0
    ? str.charAt(0).toUpperCase() + str.slice(1)
    : str;

const getBudgetStatus = (budgetUsage) => {
  if (budgetUsage >= 100) return "over_budget";
  if (budgetUsage >= 85) return "near_limit";
  return "safe";
};

export const getFinanceSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid Trip" });
    }

    const [trip, totalSpentResult, totalPeople] = await Promise.all([
      Trip.findById(tripId).lean(),
      Expense.aggregate([
        { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
      ]),
      // totalPeople is derived directly from TripMember. This assumes the
      // trip owner is always inserted into TripMember like every other
      // participant. If that invariant ever changes (owner not stored as
      // a member), this count must be adjusted accordingly.
      TripMember.countDocuments({ tripId, userId: { $ne: null } })
    ]);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const [{ totalSpent = 0 } = {}] = totalSpentResult;

    const budget = trip.budget || 0;
    const remaining = round(budget - totalSpent);

    const costPerPerson = totalPeople > 0 ? round(totalSpent / totalPeople) : 0;

    const budgetUsage = budget > 0 ? round((totalSpent / budget) * 100) : 0;
    const budgetStatus = getBudgetStatus(budgetUsage);

    res.status(200).json({
      success: true,
      summary: {
        budget,
        totalSpent: round(totalSpent),
        remaining,
        totalPeople,
        costPerPerson,
        budgetUsage,
        budgetStatus
      }
    });
  } catch (error) {
    console.error("Finance Summary Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getCategoryAnalytics = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid Trip" });
    }

    const categories = await Expense.aggregate([
      { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    const formatted = categories.map((entry) => ({
      name: capitalize(entry._id),
      value: entry._id,
      amount: round(entry.amount),
      count: entry.count
    }));

    res.status(200).json({
      success: true,
      categories: formatted
    });
  } catch (error) {
    console.error("Category Analytics Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getTimeline = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid Trip" });
    }

    // Group by calendar day (not full timestamp) so multiple expenses
    // on the same day roll up into a single point on the timeline.
    const timeline = await Expense.aggregate([
      { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" }
          },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formatted = timeline.map((entry) => ({
      date: entry._id,
      amount: round(entry.amount)
    }));

    res.status(200).json({
      success: true,
      timeline: formatted
    });
  } catch (error) {
    console.error("Timeline Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getBudgetPrediction = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid Trip" });
    }

    const [trip, expenseResult] = await Promise.all([
      Trip.findById(tripId).lean(),
      Expense.aggregate([
        { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
      ])
    ]);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const [{ totalSpent: spent = 0 } = {}] = expenseResult;
    const budget = trip.budget || 0;
    const remaining = Math.max(budget - spent, 0);

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const today = new Date();

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / MS_PER_DAY) + 1);

    let daysElapsed = Math.ceil((today - startDate) / MS_PER_DAY) + 1;
    daysElapsed = Math.max(1, Math.min(daysElapsed, totalDays));

    const daysRemaining = Math.max(totalDays - daysElapsed, 0);

    const averagePerDay = daysElapsed ? Math.round(spent / daysElapsed) : 0;
    const predictedTotal = Math.round(averagePerDay * totalDays);
    const recommendedPerDay = daysRemaining ? Math.round(remaining / daysRemaining) : 0;
    const budgetUsage = budget ? Math.round((spent / budget) * 100) : 0;

    // Unified with getFinanceSummary's naming: safe / near_limit / over_budget.
    let status = "safe";
    if (predictedTotal > budget) {
      status = "over_budget";
    } else if (budgetUsage >= 85) {
      status = "near_limit";
    }

    const excess = Math.max(predictedTotal - budget, 0);

    res.status(200).json({
      success: true,
      prediction: {
        budget,
        spent: round(spent),
        remaining: round(remaining),
        daysElapsed,
        daysRemaining,
        averagePerDay,
        recommendedPerDay,
        predictedTotal,
        budgetUsage,
        status,
        excess
      }
    });
  } catch (error) {
    console.error("Prediction Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getSettlements = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid Trip" });
    }

    const settlementData = await calculateSettlements(tripId);

    const message =
      settlementData.settlements.length === 0
        ? "No settlements required."
        : undefined;

    res.status(200).json({
      success: true,
      ...(message ? { message } : {}),
      ...settlementData
    });
  } catch (error) {
    console.error("Settlement Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getMyWallet = async (req, res) => {
    try {

        const { tripId } = req.params;
        const userId = req.user.id;

        const { settlements } =
            await calculateSettlements(tripId);

        const receivable = [];
        const payable = [];

        let totalReceivable = 0;
        let totalPayable = 0;

        settlements.forEach((item) => {

            if (
                item.to.toString() === userId
            ) {

                receivable.push({
                    user: {
                        _id: item.from,
                        name: item.fromName
                    },
                    amount: item.amount
                });

                totalReceivable += item.amount;

            }

            if (
                item.from.toString() === userId
            ) {

                payable.push({
                    user: {
                        _id: item.to,
                        name: item.toName
                    },
                    amount: item.amount
                });

                totalPayable += item.amount;

            }

        });

        return res.json({

            success: true,

            wallet: {

    receivable,

    payable,

    totalReceivable: round(totalReceivable),

    totalPayable: round(totalPayable),

    netBalance: round(
        totalReceivable -
        totalPayable
    )

}

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success:false,

            message:"Internal Server Error"

        });

    }
};