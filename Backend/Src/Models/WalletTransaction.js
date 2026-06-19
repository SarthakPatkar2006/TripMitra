import mongoose from "mongoose";

const walletTransactionSchema =
  new mongoose.Schema(
    {
      tripId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true
      },

      type: {
        type: String,
        enum: [
          "contribution",
          "expense",
          "refund",
          "adjustment"
        ],
        required: true
      },

      amount: {
        type: Number,
        required: true
      },

      userId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User"
      },

      expenseId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Expense"
      },

      description: {
        type: String,
        default: ""
      }
    },
    {
      timestamps: true
    }
  );

const WalletTransaction =
  mongoose.models
    .WalletTransaction ||
  mongoose.model(
    "WalletTransaction",
    walletTransactionSchema
  );

export default WalletTransaction;