const mongoose = require("mongoose");
const { Schema } = mongoose;
const User = require("./usersSchema");

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  orderItem: [
    {
      product: { type: Schema.Types.ObjectId, ref: "product", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, default: 0 },
      variantid: {
        type: Schema.Types.ObjectId,
        ref: "variant",
        required: true,
      },
      status: {
        type: String,
        required: true,
        enum: [
          "processing",
          "shipped",
          "Delivered",
          "Cancelled",
          "Return Request",
          "Returned",
        ],
        default: "processing",
      },

      returnRequest: {
        reason: { type: String, default: null },
        requestDate: { type: Date, default: null },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
        adminResponse: { type: String, default: null },
        returnDate: { type: Date, default: null },
        refundStatus: {
          type: String,
          enum: ["Pending", "Completed", "Failed", "Amount Refunded"],
          default: "Pending",
        },
      },
      refundedAmount: { type: Number, default: 0 },
    },
  ],
  totalPrice: { type: Number, required: true },
  address: { type: Schema.Types.ObjectId, ref: "user", required: true },
  invoiceDate: { type: Date },
  createdOn: { type: Date, default: Date.now, required: true },
  couponApplied: { type: Boolean, default: false },
  paymentMethod: {
    type: String,
    enum: ["cod", "razorpay", "wallet"],
    required: true,
  },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ["pending", "Paid", "failed"],
    default: "pending",
  },
});

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
