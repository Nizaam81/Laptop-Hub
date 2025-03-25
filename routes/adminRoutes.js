const express = require("express");
const routes = express.Router();
const multer = require("multer");
const admincontroller = require("../controller/admin/adminController");
const coupon = require("../controller/admin/couponController");

const customerController = require("../controller/admin/customerController");
const categoryController = require("../controller/admin/categoryController");
const brandController = require("../controller/admin/brandController");
const productController = require("../controller/admin/productController");
const addProductController = require("../controller/admin/addProductController");
const orderController = require("../controller/admin/orderManagmentController");
const varientController = require("../controller/admin/variantController");
const upload = require("../utils/multer/uploads");
const sales = require("../controller/admin/salesReport");
const { isSessionAdmin } = require("../middlware/adminAuth.js");

// admin login home logout
routes.get("/login", admincontroller.loadlogin);
routes.post("/login", admincontroller.login);
routes.get("/home", isSessionAdmin, admincontroller.loadhome);
routes.get("/logout", admincontroller.logout);

// user manegement
routes.get("/users", isSessionAdmin, customerController.customerInfo);
routes.post(
  "/block-user/:userId",
  isSessionAdmin,
  customerController.blockUser
);
routes.post(
  "/unblock-user/:userId",
  isSessionAdmin,
  customerController.unblockUser
);

//category management
routes.get("/category", isSessionAdmin, categoryController.categoryInfo);
routes.post("/category/add", isSessionAdmin, categoryController.addCategory);
routes.post("/addOfferCategory", isSessionAdmin, categoryController.addOffer);
routes.post(
  "/category/update",
  isSessionAdmin,
  categoryController.updateCategory
);
routes.post(
  "/category/toggle-status",
  isSessionAdmin,
  categoryController.toggleStatus
);
routes.post(
  "/category/delete",
  isSessionAdmin,
  categoryController.deleteCategory
);

// brand management
routes.get("/brands", isSessionAdmin, brandController.loadBrand);
routes.post("/brand/add", isSessionAdmin, brandController.addBrand);
routes.put("/brand/update", isSessionAdmin, brandController.updateBrand);
routes.put(
  "/brand/toggle-block",
  isSessionAdmin,
  brandController.toggleBlockBrand
);
routes.delete("/brand/delete", isSessionAdmin, brandController.deleteBrand);

//addProduct route
routes.get("/addproduct", isSessionAdmin, addProductController.loadpage);
routes.post(
  "/add-product",
  upload.array("images", 3),
  addProductController.addProduct
);

//products list route
routes.get("/products", isSessionAdmin, productController.loadproduct);

routes.get("/products", isSessionAdmin, productController.loadproduct);
routes.get("/edit-product", isSessionAdmin, productController.editProduct);
routes.post(
  "/updateProduct",
  upload.array("images", 3),
  productController.updateProduct
);

routes.post("/addoffer", isSessionAdmin, addProductController.addoffer);
routes.put(
  "/products/toggleProductBlock",
  isSessionAdmin,
  productController.toggleProductBlock
);

//Order Managment Route
routes.get("/OrderManagment", isSessionAdmin, orderController.loadOrder);
routes.post("/OrderStatus", isSessionAdmin, orderController.updateOrderStatus);
routes.get(
  "/OrderDetails/:id",
  isSessionAdmin,
  orderController.loadFulldetailsOrder
);
// varient
routes.get("/varient/:id", isSessionAdmin, varientController.loadvarient);
routes.post("/add-varient", isSessionAdmin, varientController.addVarient);
routes.post(
  "/variant/toggle-status",
  isSessionAdmin,
  varientController.toggleStatus
);
routes.post("/edit-variant", isSessionAdmin, varientController.updatevariant);

//coupon mangment
routes.get("/coupon", isSessionAdmin, coupon.loadcoupon);
routes.post("/add-coupon", isSessionAdmin, coupon.addCoupon);
routes.put("/coupon/toggle-block", isSessionAdmin, coupon.toggleBlockCoupon);
routes.post("/EditCoupon", isSessionAdmin, coupon.editCoupon);

//sales Report

// Load sales report page
routes.get("/SalesReport", isSessionAdmin, sales.loadSaleReportPage);

// Generate PDF with filter support
routes.get("/SalesReport/pdf", isSessionAdmin, sales.generatePDF);

// Generate Excel with filter support
routes.get("/SalesReport/excel", isSessionAdmin, sales.generateExcel);

// Filter sales report data
routes.post("/SalesReport/filter", isSessionAdmin, sales.filterSalesReport);

// dashbord
routes.get("/dashboard", isSessionAdmin, admincontroller.loadDashboard);

//page not founded
routes.get("/pageNotFounded", isSessionAdmin, admincontroller.pageNot);

//approve requested
routes.post("/approveReturn", isSessionAdmin, orderController.approveRequest);

module.exports = routes;
