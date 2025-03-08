const user = require("../../model/usersSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const order = require("../../model/orderSchema");
const category = require("../../model/categorySchema");
const brand = require("../../model/brandschema");
const product = require("../../model/productSchema");

const loadlogin = async (req, res) => {
  try {
    if (req.session.admin) {
      return res.redirect("/admin/home");
    }

    return res.render("admin/AdminLogin");
  } catch (error) {
    console.error("Error loading admin login page:", error.message);
    res.status(500).send("Internal server error");
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await user.findOne({ isAdmin: true, email: email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid email or admin access" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    req.session.admin = admin;
    res.status(200).json({
      message: "Login successful",
      redirectUrl: "/admin/home",
    });
  } catch (error) {
    console.error("admin/login error", error);
    res.status(500).json({ message: "Login failed. Please try again" });
  }
};

const loadhome = async (req, res) => {
  try {
    return res.render("admin/Adminhome");
  } catch (error) {
    console.error("error loading admin home page", error.message);
    res.status(500).send("internal server error");
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("session destruction error", err.message);
        res.redirect("user/pageNotfound");
      }
      return res.redirect("/admin/login");
    });
  } catch (error) {
    console.log("logout error", error);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const currentDate = new Date();

    const totalCustomers = await user.countDocuments({ is_blocked: false });

    const totalOrders = await order.countDocuments();
    const completedOrders = await order.countDocuments({ status: "Delivered" });
    const processingOrders = await order.countDocuments({
      status: "Processing",
    });
    const cancelledOrders = await order.countDocuments({ status: "Cancelled" });

    const orders = await order.find();
    let totalRevenue = 0;
    orders.forEach((order) => {
      totalRevenue += order.totalPrice || 0;
    });

    const conversionRate = ((totalOrders / totalCustomers) * 100).toFixed(1);

    const monthlyRevenue = await order.aggregate([
      {
        $match: {
          createdOn: { $gte: new Date(currentDate.getFullYear(), 0, 1) },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdOn" } },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const revenueData = Array(12).fill(0);
    monthlyRevenue.forEach((item) => {
      revenueData[item._id.month - 1] = item.total;
    });

    const bestProducts = await product.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "orderItem.product",
          as: "orderData",
        },
      },
      { $unwind: "$orderData" },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          totalSold: { $sum: "$orderData.orderItem.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const bestCategories = await order.aggregate([
      { $unwind: "$orderItem" },
      {
        $lookup: {
          from: "products",
          localField: "orderItem.product",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $lookup: {
          from: "categories",
          localField: "productData.category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: "$categoryData" },
      {
        $group: {
          _id: "$productData.category",
          categoryName: { $first: "$categoryData.name" },
          totalSold: { $sum: "$orderItem.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const bestBrands = await order.aggregate([
      { $unwind: "$orderItem" },
      {
        $lookup: {
          from: "products",
          localField: "orderItem.product",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $lookup: {
          from: "brands",
          let: { brandId: { $toObjectId: "$productData.brand" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$brandId"] } } }],
          as: "brandData",
        },
      },
      { $unwind: { path: "$brandData", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$productData.brand",
          brandName: {
            $first: { $ifNull: ["$brandData.brandName", "Unknown Brand"] },
          },
          totalSold: { $sum: "$orderItem.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const recentOrders = await order
      .find()
      .sort({ createdOn: -1 })
      .limit(5)
      .populate("userId", "FirstName LastName");

    const formattedOrders = recentOrders.map((order) => ({
      orderId: order._id.toString().slice(-5).padStart(5, "0"),
      customerName: order.userId
        ? `${order.userId.FirstName} ${order.userId.LastName}`
        : "Guest User",
      date: order.createdOn.toLocaleDateString(),
      amount: order.totalPrice,
      status: order.paymentStatus,
    }));

    const salesByCategory = await order.aggregate([
      { $unwind: "$orderItem" },
      {
        $lookup: {
          from: "products",
          localField: "orderItem.product",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $lookup: {
          from: "categories",
          localField: "productData.category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$productData.category",
          categoryName: {
            $first: { $ifNull: ["$categoryData.name", "Unknown"] },
          },
          totalRevenue: {
            $sum: { $multiply: ["$orderItem.quantity", "$orderItem.price"] },
          },
          totalSold: { $sum: "$orderItem.quantity" },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const totalRevenueByCategory = salesByCategory.reduce(
      (acc, curr) => acc + curr.totalRevenue,
      0
    );
    const salesByCategoryWithPercentage = salesByCategory.map((category) => ({
      ...category,
      percentage: (
        (category.totalRevenue / totalRevenueByCategory) *
        100
      ).toFixed(2),
    }));

    const dashboardData = {
      totalRevenue,
      totalOrders,
      totalCustomers,
      conversionRate,
      revenueData,
      months,
      bestProducts,
      bestCategories,
      bestBrands,
      formattedOrders,
      salesByCategory: salesByCategoryWithPercentage,
    };

    res.render("admin/dashboard", { dashboardData });
  } catch (error) {
    console.log("Error in dashboard controller:", error);
    res
      .status(500)
      .render("admin/pageNotFound", { error: "Failed to load dashboard" });
  }
};

const pageNot = async (req, res) => {
  try {
    res.render("admin/pageNot founded");
  } catch (error) {
    console.log("error in page not founded controller");
    res.redirect("/admin/pageNot founded");
  }
};

module.exports = { loadlogin, loadhome, login, logout, loadDashboard, pageNot };
