const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const address = require("../../model/addressSchema");
const order = require("../../model/orderSchema");

const ObjectId = mongoose.Types.ObjectId;

const loadOrder = async (req, res) => {
  try {
    const userId = req.session.user;
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
          status: { $first: "$orderItem.status" },
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

    res.render("user/orderDetails", {
      orders,
      currentPage: page,
      totalPages,
      limit,
      firstLetter: "",
      users: "",
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
    ]);

    if (orders.length === 0) {
      return res.status(404).send("Product not found in this order.");
    }

    const Addres = await address.findOne({ userId: userId });

    const totalPrice = orders[0].orderItem.price * orders[0].orderItem.quantity;

    res.render("user/orderFullDetails", {
      orders,
      totalPrice,
      firstLetter: "",
      users: "",
      Addres,
    });
  } catch (error) {
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
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while cancelling the order",
    });
  }
};

module.exports = {
  loadorderFullDetails,
  loadOrder,
  cancelOrder,
  cancelItem,
};
