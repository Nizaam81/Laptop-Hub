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
      status: {
        type: String,
        required: true,
        enum: [
          "pending",
          "processing",
          "shipped",
          "Delivered",
          "Cancelled",
          "Return Request",
          "Returned",
        ],
        default: "processing",
      },
    },
  ],
  totalPrice: { type: Number, required: true },
  address: { type: Schema.Types.ObjectId, ref: "user", required: true },
  invoiceDate: { type: Date },
  createdOn: { type: Date, default: Date.now, required: true },
  couponApplied: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ["cod", "razorpay"], required: true },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
});

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
