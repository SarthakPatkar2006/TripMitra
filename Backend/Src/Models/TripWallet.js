import mongoose from "mongoose";

const tripWalletSchema =
  new mongoose.Schema(
    {
      tripId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true,
        unique: true
      },

      totalContributed: {
        type: Number,
        default: 0
      },

      totalExpenses: {
        type: Number,
        default: 0
      },

      currentBalance: {
        type: Number,
        default: 0
      }
    },
    {
      timestamps: true
    }
  );

const TripWallet =
  mongoose.models.TripWallet ||
  mongoose.model(
    "TripWallet",
    tripWalletSchema
  );

export default TripWallet;