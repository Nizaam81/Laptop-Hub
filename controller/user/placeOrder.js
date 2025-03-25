const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const order = require("../../model/orderSchema");
const ObjectId = mongoose.Types.ObjectId;
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Wallet = require("../../model/walletSchema");
require("dotenv").config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const loadPlaceOrder = async (req, res) => {
  try {
    const userId = req.session.user;

    const carts = await cart.aggregate([
      {
        $match: { userId: new ObjectId(userId) },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $lookup: {
          from: "variants",
          localField: "VariantId",
          foreignField: "_id",
          as: "variantDetails",
        },
      },
    ]);

    const totalPrice = carts.reduce((sum, num) => {
      return (sum += num.totalPrice);
    }, 0);
    const userid = req.session.user;

    const users = await user.findOne({ _id: userid });
    const firstLetter = users.FirstName.charAt(0);
    res.render("user/placeOrder", {
      carts,
      totalPrice,
      firstLetter,
      users,
    });
  } catch (error) {
    console.error(error);
    console.log("Error in place order GET function");
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { orderItems, totalPrice, address, paymentMethod, variantid } =
      req.body;
    console.log("nizaaaaaaaaaaaam", orderItems);
    if (paymentMethod === "cod" && totalPrice > 1000) {
      return res.json({
        alert: "Cash On  delivery is Not available for Order above Rs 1000",
      });
    }

    const newOrder = new order({
      orderItem: orderItems,
      totalPrice: totalPrice,
      address: address,
      paymentMethod: paymentMethod,
      userId: userId,

      status: paymentMethod === "wallet" ? "Paid" : "Pending",
    });

    await newOrder.save();
    for (let char of orderItems) {
      await variant.findOneAndUpdate(
        { _id: char.variantid },
        { $inc: { quantity: -char.quantity } }
      );
    }

    const wallet = await Wallet.findOne({ userId });

    if (paymentMethod === "wallet") {
      if (!wallet || wallet.totalBalance < totalPrice) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      wallet.totalBalance -= totalPrice;

      wallet.transactions.push({
        type: "Purchase",
        amount: totalPrice,
        orderId: newOrder._id,
        status: "Completed",
        description: "Order purchase",
      });

      await wallet.save();
    }

    if (paymentMethod === "razorpay") {
      const options = {
        amount: Math.round(totalPrice * 100),
        currency: "INR",
        receipt: `order_rcptid_${userId}`,
        payment_capture: 1,
      };
      console.log(options);
      console.log(razorpay);
      const response = await razorpay.orders.create(options);

      newOrder.razorpayOrderId = response.id;
      await newOrder.save();

      await cart.deleteMany({ userId: userId });

      return res.json({
        success: true,
        orderId: response.id,
        amount: response.amount,
        currency: response.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    await cart.deleteMany({ userId: userId });

    return res.json({ success: "Order Placed successfully" });
  } catch (error) {
    console.log(error);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    console.log("Verification attempt for order:", razorpayOrderId);

    const orderExists = await order.findOne({ razorpayOrderId });
    if (!orderExists) {
      console.log("Order not found:", razorpayOrderId);
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    console.log("Signature comparison:");
    console.log("Generated:", generatedSignature);
    console.log("Received:", razorpaySignature);

    if (generatedSignature !== razorpaySignature) {
      console.log("Invalid signature detected, marking payment as failed");

      const updateResult = await order.findOneAndUpdate(
        { razorpayOrderId },
        {
          $set: {
            paymentStatus: "failed",
            status: "Payment Failed",
            "orderItem.$[].status": "Cancelled",
          },
        },
        { new: true }
      );

      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    console.log("Signature valid, marking payment as paid");

    const updateResult = await order.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: {
          paymentStatus: "Paid",
          razorpayPaymentId,
          razorpaySignature,
          status: "Processing",
          "orderItem.$[].status": "processing",
        },
      },
      { new: true }
    );

    console.log(
      "Update result:",
      updateResult ? "Success" : "Failed",
      updateResult
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
    });
  }
};
const paymentFailed = async (req, res) => {
  try {
    const { razorpayOrderId, errorMessage } = req.body;

    console.log("Payment failed for order:", razorpayOrderId);
    console.log("Error message:", errorMessage);

    const orderExists = await order.findOne({ razorpayOrderId });
    if (!orderExists) {
      console.log("Order not found:", razorpayOrderId);
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const updateResult = await order.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: {
          paymentStatus: "failed",
          status: "Payment Failed",
          "orderItem.$[].status": "processing",
        },
      },
      { new: true }
    );

    console.log(
      "Payment failure update result:",
      updateResult ? "Success" : "Failed"
    );

    res.json({
      success: true,
      message: "Payment failure recorded",
    });
  } catch (error) {
    console.error("Payment failure handling error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update payment status",
    });
  }
};
const walletPayment = async (req, res) => {
  try {
    const userId = req.session.user;
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.json({ balance: 0 });
    }
    return res.json({ balance: wallet.totalBalance });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const Order = await order.findById(orderId);

    const razorpayOrder = await razorpay.orders.create({
      amount: Order.totalPrice * 100,
      currency: "INR",
      receipt: `retry_${orderId}`,
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
    });
  } catch (error) {
    res.status(500).json({ error: "Payment retry failed" });
  }
};
const retryPaymentOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.user;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const orderDetails = await order
      .findOne({
        _id: orderId,
        userId,
      })
      .select(
        "totalPrice paymentMethod status razorpayOrderId paymentAttempts"
      );

    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (orderDetails.status === "Paid") {
      return res.status(400).json({ error: "This order is already paid" });
    }

    if (orderDetails.paymentMethod !== "razorpay") {
      return res
        .status(400)
        .json({ error: "Payment retry only available for Razorpay orders" });
    }

    if (!orderDetails.totalPrice || orderDetails.totalPrice <= 0) {
      return res.status(400).json({ error: "Invalid order amount" });
    }

    const options = {
      amount: Math.round(orderDetails.totalPrice * 100),
      currency: "INR",
      receipt: `RTRY_${orderId.slice(-6)}_${Date.now().toString().slice(-4)}`,

      payment_capture: 1,
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);

      await order.findByIdAndUpdate(orderId, {
        $set: {
          razorpayOrderId: razorpayOrder.id,
          status: "Pending",
          paymentStatus: "Pending",
        },
        $inc: { paymentAttempts: 1 },
        $push: {
          paymentHistory: {
            attemptDate: new Date(),
            amount: orderDetails.totalPrice,
            status: "Pending",
          },
        },
      });

      res.json({
        key: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to create Razorpay order",
        details: error.message,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Payment initialization failed", details: error.message });
  }
};

const paymentFailedorderdetails = async (req, res) => {
  try {
    const { razorpayOrderId, errorMessage } = req.body;

    if (!razorpayOrderId) {
      return res.status(400).json({ error: "Missing Razorpay Order ID" });
    }

    if (!razorpayOrderId || typeof razorpayOrderId !== "string") {
      return res.status(400).json({ error: "Invalid Razorpay Order ID" });
    }

    try {
      const updatedOrder = await Order.findOneAndUpdate(
        { razorpayOrderId },
        {
          $set: {
            paymentStatus: "Failed",
            paymentErrorMessage: errorMessage?.substring(0, 255),
            status: "Payment Failed",
          },
          $push: {
            paymentHistory: {
              attemptDate: new Date(),
              status: "Failed",
              errorMessage: errorMessage?.substring(0, 255),
            },
          },
        },
        { new: true, select: "-__v -paymentHistory._id" }
      );
      console.log("🛠️ Creating Razorpay order with options:", options);

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({
        success: true,
        orderId: updatedOrder._id,
        status: updatedOrder.status,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({
        error: "Failed to update order",
        details: error.message,
      });
    }
  } catch (error) {
    console.error("Payment failure recording error:", error);
    res.status(500).json({
      error: "Failed to record payment failure",
      details: error.message,
    });
  }
};

module.exports = {
  loadPlaceOrder,
  placeOrder,
  verifyPayment,
  walletPayment,
  retryPayment,
  paymentFailed,
  paymentFailedorderdetails,
  retryPaymentOrderDetails,
};
