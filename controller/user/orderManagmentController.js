const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const address = require("../../model/addressSchema");
const order = require("../../model/orderSchema");
const wallet = require("../../model/walletSchema");
const { status } = require("init");
const ObjectId = mongoose.Types.ObjectId;

const loadOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await user.findById(userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const orders = await order.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      { $unwind: "$orderItem" },
      {
        $lookup: {
          from: "products",
          localField: "orderItem.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          orderItem: { $push: "$orderItem" },
          productDetails: { $push: { $arrayElemAt: ["$productDetails", 0] } },
          totalPrice: { $first: "$totalPrice" },
          createdOn: { $first: "$createdOn" },

          paymentStatus: { $first: "$paymentStatus" },
        },
      },
      { $sort: { createdOn: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalOrders = await order.countDocuments({
      userId: new ObjectId(userId),
    });
    const totalPages = Math.ceil(totalOrders / limit);
    const userid = req.session.user;

    const users = await user.findOne({ _id: userid });
    const firstLetter = users.FirstName.charAt(0);

    res.render("user/orderDetails", {
      orders,
      currentPage: page,
      totalPages,
      limit,
      firstLetter,
      users,
      user: userData,
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

const loadorderFullDetails = async (req, res) => {
  try {
    const userId = req.session.user;
    const orderId = req.params.id;
    const productId = req.query.product;

    const orders = await order.aggregate([
      {
        $match: { _id: new ObjectId(orderId), userId: new ObjectId(userId) },
      },
      {
        $unwind: "$orderItem",
      },

      {
        $match: { "orderItem._id": new ObjectId(productId) },
      },
      {
        $lookup: {
          from: "products",
          localField: "orderItem.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "address",
          foreignField: "_id",
          as: "addressDetails",
        },
      },
    ]);

    if (orders.length === 0) {
      return res.status(404).send("Product not found in this order.");
    }

    const Addres = await address.find({ userId: userId });

    const totalPrice = orders[0].orderItem.price * orders[0].orderItem.quantity;

    res.render("user/orderFullDetails", {
      orders,
      totalPrice,
      firstLetter: "",
      users: "",
      Addres,
    });
  } catch (error) {
    console.log(error);
    console.error("Error in loadorderFullDetails controller", error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const result = await order.updateOne(
      { _id: orderId },
      { $set: { "orderItem.$[].status": "cancel", status: "cancelled" } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({
        success: true,
        message: "Order and all products cancelled successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found or already cancelled",
      });
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const cancelItem = async (req, res) => {
  try {
    const { orderId, specificItemId } = req.body;

    if (!orderId || !specificItemId) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const result = await order.updateOne(
      { _id: orderId, "orderItem._id": specificItemId },
      { $set: { "orderItem.$.status": "cancel", status: "cancelled" } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({
        success: true,
        message: "Order and specific product cancelled successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order or specific item not found",
      });
    }

    //wallet
    const refund = await order.findById(orderId);
    const itemFind = refund.orderItem.id(specificItemId);
    const refundAmount = itemFind.price;

    const user = req.session.user;

    const walletUpdate = await wallet.updateOne(
      { userId: req.session.user },
      {
        $push: {
          transactions: {
            description: `refund for the order ${orderId}`,
            type: "Refund",
            status: "Completed",
            date: new Date(),
            amount: refundAmount,
          },
        },
        $inc: { totalBalance: refundAmount },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while cancelling the order",
    });
  }
};

const returnItem = async (req, res) => {
  try {
    const { orderId, itemId, reason } = req.body;
    console.log("nizam", req.body);

    if (!orderId || !itemId || !reason) {
      return res.status(400).json({
        message: "Missing required fields: orderId, itemId, or reason",
      });
    }

    // Find the order
    const Order = await order.findById(orderId);
    if (!Order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the specific item in the order
    const item = Order.orderItem.find((item) => item._id.toString() === itemId);
    console.log("item", item);
    if (!item) {
      return res.status(404).json({ message: "Item not found in the order" });
    }

    // Check if the item is already delivered
    if (item.status !== "Delivered") {
      return res
        .status(400)
        .json({ message: "Item is not delivered and cannot be returned" });
    }

    // Update the item status
    item.status = "Return Request";
    item.returnRequest = {
      reason: reason,
      requestDate: new Date(),
      status: "Pending",
      adminResponse: null,
      returnDate: null,
      refundStatus: "Pending",
    };
    console.log("aai pranav");

    // Save the updated order
    await Order.save();
    console.log("haai nizam", Order);
    res.status(200).json({
      message: "Return request submitted successfully",
      order: Order, // Fixed variable reference
    });
  } catch (error) {
    console.error("Error in returnItem:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const noOrder = async (req, res) => {
  try {
    const userid = req.session.user;

    if (!userid) {
      return res.status(400).send("User not logged in");
    }

    const users = await user.findOne({ _id: userid });

    if (!users) {
      return res.status(404).send("User not found");
    }

    const firstLetter = users.FirstName ? users.FirstName.charAt(0) : "";

    res.render("user/noOrder", { users, firstLetter });
  } catch (error) {
    console.error("Error in noOrder Controller:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadorderFullDetails,
  loadOrder,
  cancelOrder,
  cancelItem,
  returnItem,
  noOrder,
};
