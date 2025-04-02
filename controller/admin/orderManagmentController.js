const mongoose = require("mongoose");
const user = require("../../model/usersSchema");
const address = require("../../model/addressSchema");
const order = require("../../model/orderSchema");
const Wallet = require("../../model/walletSchema");

const loadOrder = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
    let skip = (page - 1) * limit;
    let searchQuery = req.query.search || "";
    let dateFilter = req.query.dateFilter || "";

    // Base query conditions
    let matchConditions = {};

    // Add search conditions if search query exists
    if (searchQuery) {
      matchConditions.$or = [
        { "userDetails.FirstName": { $regex: searchQuery, $options: "i" } },
        { "userDetails.email": { $regex: searchQuery, $options: "i" } },
        { "userDetails.phone": { $regex: searchQuery, $options: "i" } },
        { paymentMethod: { $regex: searchQuery, $options: "i" } },
        { _id: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Add date filter conditions if date filter exists
    if (dateFilter) {
      let dateRange = new Date();
      switch (dateFilter) {
        case "7days":
          dateRange.setDate(dateRange.getDate() - 7);
          break;
        case "30days":
          dateRange.setDate(dateRange.getDate() - 30);
          break;
        case "3months":
          dateRange.setMonth(dateRange.getMonth() - 3);
          break;
        case "1year":
          dateRange.setFullYear(dateRange.getFullYear() - 1);
          break;
      }
      matchConditions.createdOn = { $gte: dateRange };
    }

    // Count total orders (with search and date filters if applicable)
    const totalOrders = await order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      { $match: matchConditions },
      { $count: "total" },
    ]);

    const totalCount = totalOrders.length > 0 ? totalOrders[0].total : 0;

    // Main query to get orders
    const Order = await order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      { $match: matchConditions },
      {
        $unwind: {
          path: "$orderItem",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          userDetails: { $first: "$userDetails" },
          orderItems: {
            $push: {
              productDetails: "$productDetails",
              quantity: "$orderItem.quantity",
              price: "$orderItem.price",
              status: "$orderItem.status",
            },
          },
          totalPrice: { $first: "$totalPrice" },
          address: { $first: "$address" },
          invoiceDate: { $first: "$invoiceDate" },
          createdOn: { $first: "$createdOn" },
          couponApplied: { $first: "$couponApplied" },
          paymentMethod: { $first: "$paymentMethod" },
          razorpayOrderId: { $first: "$razorpayOrderId" },
          razorpayPaymentId: { $first: "$razorpayPaymentId" },
          razorpaySignature: { $first: "$razorpaySignature" },
          paymentStatus: { $first: "$paymentStatus" },
        },
      },
      { $sort: { createdOn: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const status = [
      "pending",
      "processing",
      "shipped",
      "Delivered",
      "Cancelled",
      "Return Request",
      "Returned",
    ];

    res.render("admin/orderManagment", {
      Order,
      status,
      page,
      totalPages,
      searchQuery,
      dateFilter,
    });
  } catch (error) {
    console.error(error);
    console.log("Error in loadOrder Controller");
  }
};

const loadFulldetailsOrder = async (req, res) => {
  try {
    const Orderr = await order.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) },
      },
      {
        $unwind: "$orderItem",
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "addresses",
          localField: "userId",
          foreignField: "userId",
          as: "addressDetails",
        },
      },
      {
        $unwind: {
          path: "$addressDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    const status = [
      "pending",
      "processing",
      "shipped",
      "Delivered",
      "Cancelled",
      "Return Request",
      "Returnedd",
    ];

    res.render("admin/OrderManagmentFullDetails", {
      status,
      Orderr: Orderr,
    });
  } catch (error) {
    console.log("error in loadFulldetailsOrder");
    console.error(error);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, specificId, orderId } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const updatedOrder = await order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(orderId),
        "orderItem._id": new mongoose.Types.ObjectId(specificId),
      },
      {
        $set: { "orderItem.$.status": status },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order status updated", updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { orderId, specificId } = req.body;
    console.log("naviyaaaaaaaaa", req.body);

    if (!orderId || !specificId) {
      return res.status(400).json({ message: "Missing orderId or specificId" });
    }

    const Order = await order.findById(orderId);
    if (!Order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = Order.orderItem.find(
      (item) => item._id.toString() === specificId
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found in the order" });
    }
    console.log("pranav nithya", item);

    if (
      item.status !== "Return Request" ||
      item.returnRequest.status !== "Pending"
    ) {
      return res
        .status(400)
        .json({ message: "No pending return request for this item" });
    }

    const refundAmount = item.price * item.quantity;

    let wallet = await Wallet.findOne({ userId: Order.userId });
    if (!wallet) {
      wallet = new Wallet({
        userId: Order.userId,
        totalBalance: 0,
        transactions: [],
      });
    }

    wallet.totalBalance += refundAmount;
    wallet.transactions.push({
      type: "Refund",
      amount: refundAmount,
      status: "Completed",
      description: `Refund for order ${orderId}, item ${specificId}`,
    });

    await wallet.save();

    item.returnRequest.status = "Approved";
    item.returnRequest.returnDate = new Date();
    item.returnRequest.refundStatus = "Amount Refunded";

    await Order.save();

    res.status(200).json({
      message: "Return request approved and amount refunded to wallet",
    });
  } catch (error) {
    console.error("Error in approveRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  loadOrder,
  updateOrderStatus,
  loadFulldetailsOrder,
  approveRequest,
};
