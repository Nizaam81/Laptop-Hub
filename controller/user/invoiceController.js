const PDFDocument = require("pdfkit");
const Order = require("../../model/orderSchema");
const mongoose = require("mongoose");

const invoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderObjectId = new mongoose.Types.ObjectId(orderId);

    const orderData = await Order.aggregate([
      { $match: { _id: orderObjectId } },
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
        $lookup: {
          from: "addresses",
          localField: "address",
          foreignField: "_id",
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

    if (!orderData || orderData.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderData[0];
    const address = order.addressDetails || {};
    const user = order.userDetails || {};
    const orderItems = order.orderItem || [];
    const products = order.productDetails || [];

    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: "A4",
    });
    const filename = `invoice-fgbtth.pdf`;

    res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    const primaryColor = "#333333";
    const secondaryColor = "#f8f8f8";
    const accentColor = "#2c3e50";
    const borderColor = "#cccccc";

    doc
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(0.5)
      .stroke(borderColor);

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("Laptop Hub", 50, 50, { width: 300 });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(primaryColor)
      .text("Professional Tech Solutions || mnizamudheen81@gmail.com", 50, 75, {
        width: 300,
      });

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("INVOICE", 450, 50, { align: "right" });

    doc.moveTo(50, 110).lineTo(550, 110).lineWidth(1).stroke(borderColor);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("Order ID:", 50, 120)
      .text("Date:", 50, 135)
      .text("Payment Method:", 50, 150);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(order.orderId, 150, 120)
      .text(new Date(order.createdOn).toLocaleDateString(), 150, 135)
      .text(order.paymentMethod || "Online Payment", 150, 150);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Customer:", 350, 120)
      .text("Email:", 350, 135)
      .text("Phone:", 350, 150);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`${user.FirstName || "N/A"} ${user.LastName || ""}`, 420, 120)
      .text(user.email || "N/A", 420, 135)
      .text(user.phone || address.phone || "N/A", 420, 150);

    doc.moveTo(50, 175).lineTo(550, 175).lineWidth(1).stroke(borderColor);

    doc.rect(50, 190, 500, 25).fillAndStroke(accentColor, accentColor);

    doc
      .fillColor("white")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Item", 60, 198)
      .text("Description", 200, 198)
      .text("Qty", 350, 198)
      .text("Unit Price", 400, 198)
      .text("Amount", 480, 198);

    let yPosition = 215;
    let grandTotal = 0;

    if (orderData.length > 0) {
      orderData.forEach((item, index) => {
        const productName = item.productDetails[0]?.name || "Dell G15-5530";
        const productDesc =
          item.productDetails[0]?.description?.substring(0, 25) ||
          "Gaming Laptop";
        const quantity = item.orderItem.quantity || 1;
        const price = item.orderItem.price || 0;
        const total = quantity * price;

        if (index % 2 === 0) {
          doc.rect(50, yPosition, 500, 20).fill(secondaryColor);
        }

        doc
          .fillColor(primaryColor)
          .fontSize(9)
          .font("Helvetica")
          .text(productName, 60, yPosition + 5, { width: 130 })
          .text(productDesc, 200, yPosition + 5, { width: 140 })
          .text(quantity.toString(), 350, yPosition + 5, { width: 30 })
          .text(` ${price.toLocaleString("en-IN")}`, 400, yPosition + 5, {
            width: 70,
          })
          .text(` ${total.toLocaleString("en-IN")}`, 480, yPosition + 5, {
            width: 70,
          });

        grandTotal += total;
        yPosition += 20;
      });
    } else {
      doc
        .fillColor(primaryColor)
        .text("No order items found", 60, yPosition + 5);
      yPosition += 20;
    }

    doc
      .moveTo(50, yPosition + 10)
      .lineTo(550, yPosition + 10)
      .lineWidth(0.5)
      .stroke(borderColor);

    yPosition += 20;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("TOTAL:", 400, yPosition)
      .font("Helvetica")
      .text(` ${grandTotal.toLocaleString("en-IN")}`, 480, yPosition);

    doc
      .moveTo(50, yPosition + 45)
      .lineTo(550, yPosition + 45)
      .lineWidth(0.5)
      .stroke(borderColor);

    yPosition += 65;
    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("BILLING & SHIPPING INFORMATION", 50, yPosition);

    yPosition += 20;
    doc.rect(50, yPosition, 500, 180).lineWidth(0.5).stroke(borderColor);

    // Seller Address
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Seller:", 60, yPosition + 10)
      .font("Helvetica")
      .text("Laptop Hub Pvt Ltd", 60, yPosition + 25)
      .text("123, Tech Park, Electronic City", 60, yPosition + 40)
      .text("Bangalore, Karnataka - 560100", 60, yPosition + 55)
      .text("Phone: +91 8943136698", 60, yPosition + 70)
      .text("GSTIN: 07AAPCA1234C1Z5", 60, yPosition + 85);

    // Customer Address
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Bill To:", 350, yPosition + 10)
      .font("Helvetica")
      .text(
        `${user.FirstName || "N/A"} ${user.LastName || "N/A"}`,
        350,
        yPosition + 25
      )
      .text(`${address.landMark || "N/A"}`, 350, yPosition + 40)
      .text(
        `${address.city || "N/A"}, ${address.state || "N/A"}`,
        350,
        yPosition + 55
      )
      .text(
        `${address.pincode ? `PIN: ${address.pincode}` : ""}`,
        350,
        yPosition + 70
      )
      .text(
        `Phone: ${address.phone || user.phone || "N/A"}`,
        350,
        yPosition + 85
      );

    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res
      .status(500)
      .json({ message: "Invoice generation failed", error: error.message });
  }
};

module.exports = { invoice };
