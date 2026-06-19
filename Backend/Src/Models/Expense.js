import mongoose from "mongoose";

const expenseSchema =
  new mongoose.Schema(
    {
      tripId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true
      },

      title: {
        type: String,
        required: true,
        trim: true
      },

      description: {
        type: String,
        trim: true,
        default: ""
      },

      category: {
        type: String,
        enum: [
          "food",
          "hotel",
          "transport",
          "activity",
          "shopping",
          "emergency",
          "misc"
        ],
        default: "misc"
      },

      amount: {
        type: Number,
        required: true,
        min: 0
      },

      paidBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      splitType: {
        type: String,
        enum: [
          "equal",
          "custom"
        ],
        default: "equal"
      },

      splitAmong: [
        {
          userId: {
            type:
              mongoose.Schema.Types.ObjectId,
            ref: "User"
          },

          amount: {
            type: Number,
            default: 0
          }
        }
      ],

      expenseDate: {
        type: Date,
        default: Date.now
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    },
    {
      timestamps: true
    }
  );

const Expense =
  mongoose.models.Expense ||
  mongoose.model(
    "Expense",
    expenseSchema
  );

export default Expense;