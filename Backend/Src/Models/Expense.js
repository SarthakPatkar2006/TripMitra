import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      enum: [
        "Food",
        "Transport",
        "Hotel",
        "Activity",
        "Shopping",
        "Other"
      ],
      default: "Other"
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    splitBetween: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },

        share: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],

    expenseDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);
const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;