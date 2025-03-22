const order = require("../../model/orderSchema");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const loadSaleReportPage = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    const isValidDate = (dateString) => {
      const date = new Date(dateString);
      return !isNaN(date.valueOf());
    };

    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7);
    const defaultEndDate = new Date();

    const parsedStartDate = isValidDate(startDate)
      ? new Date(startDate)
      : defaultStartDate;
    const parsedEndDate = isValidDate(endDate)
      ? new Date(endDate)
      : defaultEndDate;

    const orderData = await order
      .find({
        createdOn: {
          $gte: parsedStartDate,
          $lte: parsedEndDate,
        },
      })
      .sort({ createdOn: -1 })
      .populate("userId", "FirstName LastName");
    console.log("total order", orderData);
    const totalSale = orderData.reduce((sum, num) => {
      return (sum += num.totalPrice);
    }, 0);
    res.render("admin/salesReport", {
      dateRange: dateRange || "last7days",
      startDate: parsedStartDate.toISOString().split("T")[0],
      endDate: parsedEndDate.toISOString().split("T")[0],
      orderData: orderData,
      totalSale,
      totalOrder: orderData.length,
    });
  } catch (error) {
    console.error("Error loading sales report page:", error);
    res.status(500).send("Internal Server Error");
  }
};

const generatePDF = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    let query = {};

    if (dateRange === "1day") {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      query.createdOn = { $gte: oneDayAgo };
    } else if (dateRange === "1week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query.createdOn = { $gte: oneWeekAgo };
    } else if (dateRange === "1month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query.createdOn = { $gte: oneMonthAgo };
    } else if (dateRange === "custom" && startDate && endDate) {
      query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const orders = await order
      .find(query)
      .populate("userId", "FirstName LastName");

    if (!orders || orders.length === 0) {
      return res.status(404).send("No orders found");
    }

    // Calculate totals for the filtered orders
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Define minimal color scheme
    const colors = {
      primary: "#000000", // Black
      secondary: "#f5f5f5", // Light gray
      border: "#e0e0e0", // Lighter gray
      text: "#333333", // Dark gray
    };

    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales_report.pdf"'
    );

    doc.pipe(res);

    // Add header - clean and minimal
    doc
      .fontSize(18)
      .font("Helvetica")
      .fillColor(colors.primary)
      .text("Sales Report", 50, 50);

    // Thin line under the title
    doc.moveTo(50, 80).lineTo(550, 80).lineWidth(0.5).stroke(colors.border);

    const reportDate = new Date().toLocaleDateString();
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(colors.text)
      .text(`Generated: ${reportDate}`, 50, 90);

    // Add report period
    let periodText = "Period: ";
    if (dateRange === "1day") {
      periodText += "Last 24 hours";
    } else if (dateRange === "1week") {
      periodText += "Last 7 days";
    } else if (dateRange === "1month") {
      periodText += "Last 30 days";
    } else if (dateRange === "custom") {
      periodText += `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    }

    doc.text(periodText, 50, 110);
    doc.moveDown(1);

    // Summary section - minimal boxes with thin borders
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(colors.primary)
      .text("Summary", 50, 140);

    // Total Orders Box
    doc.rect(50, 160, 240, 50).lineWidth(0.5).stroke(colors.border);

    doc.fontSize(10).fillColor(colors.text).text("Total Orders", 60, 170);

    doc.fontSize(16).fillColor(colors.primary).text(`${totalOrders}`, 60, 185);

    // Total Sales Box
    doc.rect(300, 160, 240, 50).lineWidth(0.5).stroke(colors.border);

    doc.fontSize(10).fillColor(colors.text).text("Total Sales", 310, 170);

    doc
      .fontSize(16)
      .fillColor(colors.primary)
      .text(`$${totalSales.toFixed(2)}`, 310, 185);

    doc.moveDown(5);

    // Order Details Section with minimal table
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(colors.primary)
      .text("Order Details", 50, 230);

    // Simple table headers with thin border
    const headers = [
      "Date",
      "Order ID",
      "Customer",
      "Amount",
      "Payment",
      "Status",
    ];

    const tableTop = 250;
    const rowHeight = 25;
    const colWidths = [70, 80, 130, 70, 80, 60];
    const tableWidth = colWidths.reduce((a, b) => a + b);
    let startY = tableTop;

    // Draw table header - minimal with thin border
    doc
      .rect(50, startY, tableWidth, rowHeight)
      .lineWidth(0.5)
      .fillAndStroke(colors.secondary, colors.border);

    // Add header text
    doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.primary);

    let currentX = 50;
    headers.forEach((header, i) => {
      doc.text(header, currentX + 5, startY + 8, {
        width: colWidths[i] - 10,
        align: "left",
      });
      currentX += colWidths[i];
    });

    startY += rowHeight;
    doc.font("Helvetica").fontSize(9).fillColor(colors.text);

    // Draw table rows - minimal styling
    orders.forEach((order, index) => {
      // Check if we need a new page
      if (startY > doc.page.height - 100) {
        doc.addPage();

        // Minimal header on new page
        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor(colors.primary)
          .text("Sales Report (continued)", 50, 50);

        doc.moveDown(1);
        startY = 80;

        // Redraw table header on new page - minimal style
        doc
          .rect(50, startY, tableWidth, rowHeight)
          .lineWidth(0.5)
          .fillAndStroke(colors.secondary, colors.border);

        currentX = 50;
        doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.primary);

        headers.forEach((header, i) => {
          doc.text(header, currentX + 5, startY + 8, {
            width: colWidths[i] - 10,
            align: "left",
          });
          currentX += colWidths[i];
        });

        startY += rowHeight;
        doc.font("Helvetica").fontSize(9).fillColor(colors.text);
      }

      // Thin line between rows
      doc
        .moveTo(50, startY)
        .lineTo(50 + tableWidth, startY)
        .lineWidth(0.5)
        .stroke(colors.border);

      // Prepare row data
      const row = [
        new Date(order.createdOn).toLocaleDateString(),
        order._id.toString().slice(-6),
        `${order.userId.FirstName} ${order.userId.LastName}`,
        `$${order.totalPrice.toFixed(2)}`,
        order.paymentMethod,
        order.paymentStatus,
      ];

      // Draw row content
      currentX = 50;
      row.forEach((cell, i) => {
        doc.text(cell, currentX + 5, startY + 8, {
          width: colWidths[i] - 10,
          align: i === 3 ? "right" : "left", // Right-align amounts
        });
        currentX += colWidths[i];
      });

      startY += rowHeight;
    });

    // Add thin border around the table
    doc
      .rect(50, tableTop, tableWidth, startY - tableTop)
      .lineWidth(0.5)
      .stroke(colors.border);

    // Add page numbers - minimal style
    const pageCount = doc.bufferedPageCount;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Simple page numbers at bottom
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(colors.text)
        .text(`Page ${i + 1} of ${pageCount}`, 0, doc.page.height - 50, {
          align: "center",
        });

      // Simple footer
      doc
        .fontSize(8)
        .fillColor(colors.text)
        .text("© 2023 Your Company Name", 0, doc.page.height - 30, {
          align: "center",
        });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
};
const generateExcel = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    let query = {};

    if (dateRange === "1day") {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      query.createdOn = { $gte: oneDayAgo };
    } else if (dateRange === "1week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query.createdOn = { $gte: oneWeekAgo };
    } else if (dateRange === "1month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query.createdOn = { $gte: oneMonthAgo };
    } else if (dateRange === "custom" && startDate && endDate) {
      query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const orders = await order
      .find(query)
      .populate("userId", "FirstName LastName");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 20 },
      { header: "Status", key: "status", width: 15 },
    ];

    orders.forEach((order) => {
      worksheet.addRow({
        date: order.createdOn.toLocaleDateString(),
        orderId: `#${order._id}`,
        customerName: `${order.userId.FirstName} ${order.userId.LastName}`,
        amount: `$${order.totalPrice.toFixed(2)}`,
        paymentMethod: order.paymentMethod,
        status: order.paymentStatus,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales_report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("error in generating Excel");
    console.error(error);
    res.status(500).send("Error generating Excel");
  }
};
const filterSalesReport = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.body;

    let query = {};

    if (dateRange === "1day") {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      query.createdOn = { $gte: oneDayAgo };
    } else if (dateRange === "1week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query.createdOn = { $gte: oneWeekAgo };
    } else if (dateRange === "1month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query.createdOn = { $gte: oneMonthAgo };
    } else if (dateRange === "custom" && startDate && endDate) {
      query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const filteredOrders = await order
      .find(query)
      .populate("userId", "FirstName LastName");

    // Calculate total sales for filtered orders
    const totalSale = filteredOrders.reduce((sum, order) => {
      return sum + order.totalPrice;
    }, 0);

    // Return more data with the response
    res.json({
      orders: filteredOrders,
      totalSale: totalSale,
      totalOrder: filteredOrders.length,
    });
  } catch (error) {
    console.error("Error filtering sales report:", error);
    res.status(500).send("Error filtering sales report");
  }
};

module.exports = {
  loadSaleReportPage,
  generatePDF,
  generateExcel,
  filterSalesReport,
};
