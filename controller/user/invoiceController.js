const PDFDocument = require("pdfkit");
const Order = require("../../model/orderSchema");
const mongoose = require("mongoose");

const invoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    console.log("orderId:", orderId);

    const orderData = await Order.aggregate([
      { $match: { _id: orderObjectId } },
      {
        $lookup: {
          from: "addresses",
          localField: "userId",
          foreignField: "userId",
          as: "addressDetails",
        },
      },
      { $unwind: "$addressDetails" },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
    ]);
    console.log("orderdata:", orderData);

    if (!orderData || orderData.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderData[0];
    const address = order.addressDetails || {};
    const user = order.userDetails || {};
    const orderItems = order.orderItem || [];
    console.log("adress:", address);

    // Debugging Logs
    console.log("Fetched Order Items:", orderItems);
    console.log("Fetched Address:", user);

    // Generate PDF
    const doc = new PDFDocument();
    const filename = `invoice-${orderId}.pdf`;

    res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(25).text("Laptop Hub", { align: "center" });
    doc.moveDown();
    doc.fontSize(18).text("Invoice", { align: "center" });
    doc.moveDown();

    // Order Metadata
    doc
      .fontSize(12)
      .text(`Order ID: ${order._id}`, 50, 150)
      .text(`Date: ${new Date(order.createdOn).toLocaleDateString()}`, 50, 170)
      .text(`Customer: ${user.FirstName || "N/A"}`, 50, 190)
      .text(`Email: ${user.email || "N/A"}`, 300, 190);

    // Line Separator
    doc.moveTo(50, 220).lineTo(550, 220).stroke();

    // Order Items Table
    doc.fontSize(14).text("Order Details", 50, 240);
    doc
      .fontSize(12)
      .text("Item", 50, 270)
      .text("Quantity", 250, 270)
      .text("Price", 350, 270)
      .text("Total", 450, 270);
    doc.moveTo(50, 290).lineTo(550, 290).stroke();

    // Populate Order Items
    let yPosition = 310;
    let grandTotal = 0;

    if (orderItems.length > 0) {
      orderItems.forEach((item) => {
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const total = quantity * price;

        doc
          .text(item.name || "Dell G15-5530", 50, yPosition)
          .text(`${quantity}`, 250, yPosition)
          .text(`₹ ${price}`, 350, yPosition)
          .text(`₹ ${total}`, 450, yPosition);

        grandTotal += total;
        yPosition += 20;
      });
    } else {
      doc.text("No order items found", 50, yPosition);
      yPosition += 20;
    }

    // Total Section
    doc
      .moveTo(50, yPosition + 10)
      .lineTo(550, yPosition + 10)
      .stroke();
    doc
      .fontSize(14)
      .text("Grand Total:", 350, yPosition + 30)
      .text(`₹ ${order.totalPrice || grandTotal}`, 450, yPosition + 30);

    // Shipping Information
    const shippingY = yPosition + 70;
    doc.fontSize(14).text("Shipping Information", 50, shippingY);

    if (address && Object.keys(address).length > 0) {
      doc
        .fontSize(12)
        .text(
          `Recipient: ${address.address[0].name || "N/A"}`,
          50,
          shippingY + 30
        )
        .text(
          `Street: address${address.address[0].landMark || "N/A"}`,
          50,
          shippingY + 50
        )
        .text(`City: ${address.address[0].city || "N/A"}`, 50, shippingY + 70)
        .text(`State: ${address.address[0].state || "N/A"}`, 50, shippingY + 90)
        .text(
          `ZIP: ${address.address[0].pincode || "N/A"}`,
          50,
          shippingY + 110
        )
        .text(
          `Phone: ${address.address[0].phone || "N/A"}`,
          50,
          shippingY + 130
        );
    } else {
      doc.text("Shipping Address: Not provided", 50, shippingY + 30);
    }

    // Footer
    doc
      .fontSize(10)
      .text("Thank you for your purchase!", 50, 700, { align: "center" })
      .text("Computer-generated invoice. No signature needed.", 50, 720, {
        align: "center",
      });

    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res
      .status(500)
      .json({ message: "Invoice generation failed", error: error.message });
  }
};

module.exports = { invoice };
