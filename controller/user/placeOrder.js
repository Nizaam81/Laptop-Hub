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

    // Create a new order instance (Before deducting wallet balance)
    const newOrder = new order({
      orderItem: orderItems,
      totalPrice: totalPrice,
      address: address,
      paymentMethod: paymentMethod,
      userId: userId,
      status: paymentMethod === "wallet" ? "Paid" : "Pending", // Mark as Paid if wallet is used
    });

    await newOrder.save();

    // Fetch the user's wallet
    const wallet = await Wallet.findOne({ userId });

    if (paymentMethod === "wallet") {
      // Check if the wallet exists and has sufficient balance
      if (!wallet || wallet.totalBalance < totalPrice) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      // Deduct the order amount from the wallet balance
      wallet.totalBalance -= totalPrice;

      // Add a transaction record for the purchase
      wallet.transactions.push({
        type: "Purchase",
        amount: totalPrice,
        orderId: newOrder._id, // Use the actual order ID
        status: "Completed",
        description: "Order purchase",
      });

      // Save the updated wallet
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

      newOrder.razorpayOrderId = response.id; // Save Razorpay order ID
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

const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature === razorpaySignature) {
      await order.findOneAndUpdate(
        { razorpayOrderId: razorpayOrderId },
        { paymentStatus: "Paid" }
      );
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

module.exports = {
  loadPlaceOrder,
  placeOrder,
  verifyPayment,
};
