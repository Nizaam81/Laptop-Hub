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

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales_report.pdf"'
    );

    doc.pipe(res);

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Sales Report", { align: "center" });
    doc.moveDown(1);

    const reportDate = new Date().toLocaleDateString();
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#555555")
      .text(`Generated on: ${reportDate}`, { align: "center" });
    doc.moveDown(2);

    const headers = [
      "Date",
      "Order ID",
      "Customer",
      "Amount",
      "Payment",
      "Status",
    ];
    const tableTop = 120;
    const rowHeight = 30;
    const colWidths = [80, 120, 120, 80, 80, 80];
    const startX = 40;
    let startY = tableTop;

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff");
    doc
      .rect(
        startX,
        startY,
        colWidths.reduce((a, b) => a + b),
        rowHeight
      )
      .fill("#007bff")
      .stroke();
    headers.forEach((header, i) => {
      doc
        .fillColor("#ffffff")
        .text(
          header,
          startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5,
          startY + 8,
          {
            width: colWidths[i] - 10,
            align: "left",
          }
        );
    });

    startY += rowHeight;
    doc.font("Helvetica").fontSize(10).fillColor("#000000");

    orders.forEach((order, index) => {
      const row = [
        order.createdOn.toLocaleDateString(),
        `#${order._id}`,
        `${order.userId.FirstName} ${order.userId.LastName}`,
        `$${order.totalPrice.toFixed(2)}`,
        order.paymentMethod,
        order.paymentStatus,
      ];

      if (index % 2 === 0) {
        doc
          .rect(
            startX,
            startY,
            colWidths.reduce((a, b) => a + b),
            rowHeight
          )
          .fill("#f2f2f2")
          .stroke();
      }

      row.forEach((cell, i) => {
        doc
          .fillColor("#000000")
          .text(
            cell,
            startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5,
            startY + 8,
            {
              width: colWidths[i] - 10,
              align: "left",
            }
          );
      });
      startY += rowHeight;
    });

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

    res.json(filteredOrders);
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
