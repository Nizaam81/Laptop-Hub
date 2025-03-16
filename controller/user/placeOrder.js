const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const order = require("../../model/orderSchema");
const ObjectId = mongoose.Types.ObjectId;
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Wallet = require("../../model/walletSchema");

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

    res.render("user/placeOrder", {
      carts,
      totalPrice,
      firstLetter: "",
      users: "",
    });
  } catch (error) {
    console.error(error);
    console.log("Error in place order GET function");
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { orderItems, totalPrice, address, paymentMethod } = req.body;
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
        amount: totalPrice * 100,
        currency: "INR",
        receipt: `order_rcptid_${userId}`,
        payment_capture: 1,
      };

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
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

// Verify Payment Controller (Updated)
// Update your existing verifyPayment controller
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    console.log("Verification attempt for order:", razorpayOrderId);

    // Find the order first to make sure it exists
    const orderExists = await order.findOne({ razorpayOrderId });
    if (!orderExists) {
      console.log("Order not found:", razorpayOrderId);
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Validate signature
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

      console.log("Update result:", updateResult ? "Success" : "Failed");

      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // Update successful payment
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

    // Find the order first to make sure it exists
    const orderExists = await order.findOne({ razorpayOrderId });
    if (!orderExists) {
      console.log("Order not found:", razorpayOrderId);
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Update order with failed payment status
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

// Update your existing retryPayment controller
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

module.exports = {
  loadPlaceOrder,
  placeOrder,
  verifyPayment,
  walletPayment,
  retryPayment,
  paymentFailed,
};
