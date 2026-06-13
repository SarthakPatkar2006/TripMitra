import Expense from "../Models/Expense.js";
import { calculateSettlements } from "../Services/expense.service.js";

// 1. Create a new expense (e.g., Rahul paid ₹1500 for dinner split between 3 people)
export async function createExpense(req, res) {
  try {
    const { tripId, title, amount, splitBetween } = req.body;
    
    // The authenticated user from your 'protect' middleware is the one who paid
    const paidBy = req.user._id; 

    if (!tripId || !title || !amount || !splitBetween || splitBetween.length === 0) {
      return res.status(400).json({ message: "All expense fields are required." });
    }

    const newExpense = await Expense.create({
      tripId,
      title,
      amount,
      paidBy,
      splitBetween
    });

    res.status(201).json({
      success: true,
      message: "Expense logged successfully!",
      expense: newExpense
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// 2. Fetch all expenses logged for a single trip
export async function getTripExpenses(req, res) {
  try {
    const { tripId } = req.params;
    const expenses = await Expense.find({ tripId }).populate("paidBy", "name email");

    res.status(200).json({
      success: true,
      expenses
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// 3. Get the optimized settlement transactions to clear all debts
export async function getTripSettlements(req, res) {
  try {
    const { tripId } = req.params;
    
    // Call the greedy matching algorithm we wrote in step 2
    const settlementData = await calculateSettlements(tripId);

    res.status(200).json({
      success: true,
      message: "Settlements calculated optimally!",
      balances: settlementData.balances,
      settlements: settlementData.settlements // Array of who owes who how much
    });
  } catch (error) {
    console.error("Error calculating settlements:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}