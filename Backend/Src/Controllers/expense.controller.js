import Expense from "../Models/Expense.js";
import { calculateSettlements }
from "../Services/expense.service.js";

// ==============================
// Create Expense
// ==============================

export async function createExpense(
  req,
  res
) {
  try {
    const {
      tripId,
      title,
      description,
      category,
      amount,
      splitBetween,
      expenseDate
    } = req.body;

    const paidBy =
      req.user._id;

    if (
      !tripId ||
      !title ||
      !amount ||
      !splitBetween ||
      splitBetween.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All expense fields are required."
      });
    }

    const newExpense =
      await Expense.create({
        tripId,
        title,
        description,
        category,
        amount,
        paidBy,
        splitBetween,
        expenseDate
      });

    res.status(201).json({
      success: true,
      message:
        "Expense logged successfully!",
      expense: newExpense
    });
  } catch (error) {
    console.error(
      "Error creating expense:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error"
    });
  }
}

// ==============================
// Get All Expenses Of Trip
// ==============================

export async function getTripExpenses(
  req,
  res
) {
  try {
    const { tripId } =
      req.params;

    const expenses =
      await Expense.find({
        tripId
      })
        .populate(
          "paidBy",
          "name email"
        )
        .populate(
          "splitBetween.userId",
          "name email"
        )
        .sort({
          expenseDate: -1
        });

    res.status(200).json({
      success: true,
      expenses
    });
  } catch (error) {
    console.error(
      "Error fetching expenses:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error"
    });
  }
}

// ==============================
// Delete Expense
// ==============================

export async function deleteExpense(
  req,
  res
) {
  try {
    const expense =
      await Expense.findByIdAndDelete(
        req.params.id
      );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message:
          "Expense not found"
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Expense deleted successfully"
    });
  } catch (error) {
    console.error(
      "Error deleting expense:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error"
    });
  }
}

// ==============================
// Get Settlements
// ==============================

export async function getTripSettlements(
  req,
  res
) {
  try {
    const { tripId } =
      req.params;

    const settlementData =
      await calculateSettlements(
        tripId
      );

    res.status(200).json({
      success: true,
      message:
        "Settlements calculated optimally!",
      balances:
        settlementData.balances,
      settlements:
        settlementData.settlements
    });
  } catch (error) {
    console.error(
      "Error calculating settlements:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error"
    });
  }
}