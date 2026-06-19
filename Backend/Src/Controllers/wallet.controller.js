import TripWallet from "../Models/TripWallet.js";
import WalletTransaction from "../Models/WalletTransaction.js";
export const contribute =
  async (req, res) => {
    try {
      const { tripId } =
        req.params;

      const {
        amount
      } = req.body;

      let wallet =
        await TripWallet.findOne(
          {
            tripId
          }
        );

      if (!wallet) {
        wallet =
          await TripWallet.create(
            {
              tripId
            }
          );
      }

      wallet.totalContributed +=
        Number(
          amount
        );

      wallet.currentBalance +=
        Number(
          amount
        );

      await wallet.save();

      await WalletTransaction.create(
        {
          tripId,
          type:
            "contribution",
          amount,
          userId:
            req.user._id,
          description:
            `${req.user.name} contributed ₹${amount}`
        }
      );

      res.status(200).json({
        success: true,
        wallet
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
  export const getWallet =
  async (req, res) => {
    try {
      let wallet =
        await TripWallet.findOne(
          {
            tripId:
              req.params
                .tripId
          }
        );

      if (!wallet) {
        wallet =
          await TripWallet.create(
            {
              tripId:
                req.params
                  .tripId
            }
          );
      }

      res.status(200).json({
        success: true,
        wallet
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
  export const getTransactions =
  async (req, res) => {
    try {
      const transactions =
        await WalletTransaction.find(
          {
            tripId:
              req.params
                .tripId
          }
        )
          .populate(
            "userId",
            "name"
          )
          .sort({
            createdAt: -1
          });

      res.status(200).json({
        success: true,
        transactions
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