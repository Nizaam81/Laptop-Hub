const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["Deposit", "Withdrawal", "Purchase", "Refund", "Referal"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },

        status: {
          type: String,
          enum: ["Completed", "Failed", "Pending"],
          default: "Completed",
        },
        description: {
          type: String,
          required: false,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);
walletSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
