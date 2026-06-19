import Expense from "../Models/Expense.js";
import Trip from "../Models/Trip.js";
import Notification
from "../Models/Notification.js";

export const addExpense =
  async (req, res) => {
    try {
      const { tripId } =
        req.params;

      const {
        title,
        description,
        category,
        amount,
        paidBy,
        splitType,
        splitAmong,
        expenseDate
      } = req.body;

      const trip =
        await Trip.findById(
          tripId
        );

      if (!trip) {
        return res
          .status(404)
          .json({
            message:
              "Trip not found"
          });
      }

      const expense =
        await Expense.create({
          tripId,
          title,
          description,
          category,
          amount,
          paidBy,
          splitType,
          splitAmong,
          expenseDate,
          createdBy:
            req.user._id
        });

      await Notification.create({
        userId:
          trip.owner,
        type:
          "expense_added",
        message:
          `${req.user.name} added ${title} expense (₹${amount}).`,
        tripId
      });

      res.status(201).json({
        success: true,
        expense
      });
    } catch (error) {
      console.error(
        "Add expense error:",
        error
      );

      res.status(500).json({
        message:
          "Internal Server Error"
      });
    }
  };
  export const getExpenses =
  async (req, res) => {
    try {
      const expenses =
        await Expense.find({
          tripId:
            req.params.tripId
        })
          .populate(
            "paidBy",
            "name email"
          )
          .populate(
            "createdBy",
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
      console.error(error);

      res.status(500).json({
        message:
          "Internal Server Error"
      });
    }
  };
export const updateExpense =
  async (req, res) => {
    try {
      const {
        expenseId
      } = req.params;

      const expense =
        await Expense.findById(
          expenseId
        );

      if (!expense) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Expense not found"
          });
      }

      const {
        title,
        description,
        category,
        amount,
        paidBy,
        expenseDate
      } = req.body;

      expense.title =
        title ??
        expense.title;

      expense.description =
        description ??
        expense.description;

      expense.category =
        category ??
        expense.category;

      expense.amount =
        amount ??
        expense.amount;

      expense.paidBy =
        paidBy ??
        expense.paidBy;

      expense.expenseDate =
        expenseDate ??
        expense.expenseDate;

      await expense.save();

      res.status(200).json({
        success: true,
        expense
      });
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Internal Server Error"
      });
    }
  };
  export const deleteExpense =
  async (req, res) => {
    try {
      const expense =
        await Expense.findByIdAndDelete(
          req.params
            .expenseId
        );

      if (!expense) {
        return res
          .status(404)
          .json({
            message:
              "Expense not found"
          });
      }

      res.status(200).json({
        success: true,
        message:
          "Expense deleted"
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Internal Server Error"
      });
    }
  };