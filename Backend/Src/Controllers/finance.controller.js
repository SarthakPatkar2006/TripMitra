import Trip from "../Models/Trip.js";
import Expense from "../Models/Expense.js";
import TripMember from "../Models/TripMember.js";
import mongoose from "mongoose";
export const getFinanceSummary =
  async (req, res) => {
    try {
      const { tripId } =
        req.params;

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

      const expenses =
        await Expense.find({
          tripId
        });

      const totalSpent =
        expenses.reduce(
          (
            sum,
            expense
          ) =>
            sum +
            expense.amount,
          0
        );

      const budget =
        trip.budget || 0;

      const remaining =
        budget -
        totalSpent;

      const members =
        await TripMember.countDocuments(
          {
            tripId,
            status:
              "accepted"
          }
        );

      const totalPeople =
        members + 1;

      const costPerPerson =
        totalPeople > 0
          ? totalSpent /
            totalPeople
          : 0;

      const usage =
        budget > 0
          ? (
              (totalSpent /
                budget) *
              100
            ).toFixed(1)
          : 0;

      res.status(200).json({
        success: true,
        summary: {
          budget,
          totalSpent,
          remaining,
          costPerPerson,
          totalPeople,
          budgetUsage:
            Number(
              usage
            )
        }
      });
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        message:
          "Internal Server Error"
      });
    }
  };
  export const getCategoryAnalytics =
  async (req, res) => {
    try {
      const { tripId } =
        req.params;

      const categories =
        await Expense.aggregate([
          {
            $match: {
              tripId:
                new mongoose.Types.ObjectId(
                  tripId
                )
            }
          },
          {
            $group: {
              _id:
                "$category",
              amount: {
                $sum:
                  "$amount"
              }
            }
          },
          {
            $sort: {
              amount: -1
            }
          }
        ]);

      res.status(200).json({
        success: true,
        categories
      });
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        message:
          "Internal Server Error"
      });
    }
  };
  export const getTimeline =
  async (req, res) => {
    try {
      const { tripId } =
        req.params;

      const timeline =
        await Expense.aggregate([
          {
            $match: {
              tripId:
                new mongoose.Types.ObjectId(
                  tripId
                )
            }
          },
          {
            $group: {
              _id:
                "$expenseDate",
              amount: {
                $sum:
                  "$amount"
              }
            }
          },
          {
            $sort: {
              _id: 1
            }
          }
        ]);

      res.status(200).json({
        success: true,
        timeline
      });
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        message:
          "Internal Server Error"
      });
    }
  };
  export const getBudgetPrediction =
  async (req, res) => {
    try {
      const { tripId } =
        req.params;

      const trip =
        await Trip.findById(
          tripId
        );

      if (!trip) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip not found"
          });
      }

      const expenseResult =
        await Expense.aggregate([
          {
            $match: {
              tripId:
                new mongoose.Types.ObjectId(
                  tripId
                )
            }
          },
          {
            $group: {
              _id: null,
              totalSpent:
                {
                  $sum:
                    "$amount"
                }
            }
          }
        ]);

      const spent =
        expenseResult[0]
          ?.totalSpent || 0;

      const budget =
        trip.budget || 0;

      const remaining =
        Math.max(
          budget - spent,
          0
        );

      const startDate =
        new Date(
          trip.startDate
        );

      const endDate =
        new Date(
          trip.endDate
        );

      const today =
        new Date();

      const totalDays =
        Math.max(
          1,
          Math.ceil(
            (endDate -
              startDate) /
              (1000 *
                60 *
                60 *
                24)
          ) + 1
        );

      let daysElapsed =
        Math.ceil(
          (today -
            startDate) /
            (1000 *
              60 *
              60 *
              24)
        ) + 1;

      daysElapsed =
        Math.max(
          1,
          Math.min(
            daysElapsed,
            totalDays
          )
        );

      const daysRemaining =
        Math.max(
          totalDays -
            daysElapsed,
          0
        );

      const averagePerDay =
        daysElapsed
          ? Math.round(
              spent /
                daysElapsed
            )
          : 0;

      const predictedTotal =
        Math.round(
          averagePerDay *
            totalDays
        );

      const recommendedPerDay =
        daysRemaining
          ? Math.round(
              remaining /
                daysRemaining
            )
          : 0;

      const budgetUsage =
        budget
          ? Math.round(
              (spent /
                budget) *
                100
            )
          : 0;

      let status =
        "on_budget";

      if (
        predictedTotal >
        budget
      ) {
        status =
          "over_budget";
      } else if (
        budgetUsage >=
        85
      ) {
        status =
          "near_limit";
      }

      const excess =
        Math.max(
          predictedTotal -
            budget,
          0
        );

      res.status(200).json({
        success: true,
        prediction: {
          budget,
          spent,
          remaining,
          totalDays,
          daysElapsed,
          daysRemaining,
          averagePerDay,
          predictedTotal,
          recommendedPerDay,
          budgetUsage,
          excess,
          status
        }
      });
    } catch (error) {
      console.error(
        "Prediction error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Internal Server Error"
      });
    }
  };
  export const getSettlements =
  async (req, res) => {
    try {
      const { tripId } =
        req.params;

      const members =
        await TripMember.find({
          tripId
        }).populate(
          "userId",
          "name email"
        );

      if (
        members.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "No members found"
          });
      }

      const expenses =
        await Expense.find({
          tripId
        }).populate(
          "paidBy",
          "name"
        );

      const totalExpenses =
        expenses.reduce(
          (
            sum,
            expense
          ) =>
            sum +
            expense.amount,
          0
        );

      const perPerson =
        totalExpenses /
        members.length;

      const paidMap =
        new Map();

      members.forEach(
        (member) => {
          paidMap.set(
            member.userId._id.toString(),
            {
              userId:
                member
                  .userId
                  ._id,
              name:
                member
                  .userId
                  .name,
              paid: 0
            }
          );
        }
      );

      expenses.forEach(
        (expense) => {
          const userId =
            expense.paidBy._id.toString();

          const person =
            paidMap.get(
              userId
            );

          if (
            person
          ) {
            person.paid +=
              expense.amount;
          }
        }
      );

      const balances =
        [];

      paidMap.forEach(
        (
          person
        ) => {
          balances.push({
            ...person,
            shouldPay:
              Math.round(
                perPerson
              ),
            balance:
              Math.round(
                person.paid -
                  perPerson
              )
          });
        }
      );

      const creditors =
        balances
          .filter(
            (m) =>
              m.balance >
              0
          )
          .sort(
            (
              a,
              b
            ) =>
              b.balance -
              a.balance
          );

      const debtors =
        balances
          .filter(
            (m) =>
              m.balance <
              0
          )
          .sort(
            (
              a,
              b
            ) =>
              a.balance -
              b.balance
          );

      const transactions =
        [];

      let i = 0;
      let j = 0;

      while (
        i <
          debtors.length &&
        j <
          creditors.length
      ) {
        const debtor =
          debtors[i];

        const creditor =
          creditors[j];

        const amount =
          Math.min(
            -debtor.balance,
            creditor.balance
          );

        transactions.push(
          {
            from:
              debtor.name,
            fromId:
              debtor.userId,
            to:
              creditor.name,
            toId:
              creditor.userId,
            amount:
              Math.round(
                amount
              )
          }
        );

        debtor.balance +=
          amount;

        creditor.balance -=
          amount;

        if (
          debtor.balance ===
          0
        ) {
          i++;
        }

        if (
          creditor.balance ===
          0
        ) {
          j++;
        }
      }

      res.status(200).json({
        success: true,
        totalExpenses,
        perPerson:
          Math.round(
            perPerson
          ),
        balances,
        transactions
      });
    } catch (error) {
      console.error(
        "Settlement Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Internal Server Error"
      });
    }
  };