const user = require("../../model/usersSchema");
const address = require("../../model/addressSchema");
const order = require("../../model/orderSchema");

const loadOrder = async (req, res) => {
  try {
    const Order = await order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$orderItem",
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

    const status = [
      "pending",
      "processing",
      "shipped",
      "Delivered",
      "Cancelled",
      "Return Request",
      "Returned",
    ];

    res.render("admin/orderManagment", { Order, status });
  } catch (error) {
    console.error(error);
    console.log("error in loadOrder Controller");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    console.log("Received Update Request:", req.body);

    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const updatedOrder = await order.findOneAndUpdate(
      { _id: orderId, "orderItem.product": { $exists: true } },
      { $set: { "orderItem.$.status": status } },
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

module.exports = {
  loadOrder,
  updateOrderStatus,
};
