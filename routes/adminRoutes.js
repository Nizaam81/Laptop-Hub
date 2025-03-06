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

// admin login home logout
routes.get("/login", admincontroller.loadlogin);
routes.post("/login", admincontroller.login);
routes.get("/home", admincontroller.loadhome);
routes.get("/logout", admincontroller.logout);

// user manegement
routes.get("/users", customerController.customerInfo);
routes.post("/block-user/:userId", customerController.blockUser);
routes.post("/unblock-user/:userId", customerController.unblockUser);

//category management
routes.get("/category", categoryController.categoryInfo);
routes.post("/category/add", categoryController.addCategory);
routes.post("/category/update", categoryController.updateCategory);
routes.post("/category/toggle-status", categoryController.toggleStatus);
routes.post("/category/delete", categoryController.deleteCategory);

// brand management
routes.get("/brands", brandController.loadBrand);
routes.post("/brand/add", brandController.addBrand);
routes.put("/brand/update", brandController.updateBrand);
routes.put("/brand/toggle-block", brandController.toggleBlockBrand);
routes.delete("/brand/delete", brandController.deleteBrand);

//addProduct route
routes.get("/addproduct", addProductController.loadpage);
routes.post(
  "/add-product",
  upload.array("images", 3),
  addProductController.addProduct
);

//products list route
routes.get("/products", productController.loadproduct);
routes.get("/edit-product", productController.editProduct);
routes.post(
  "/updateProduct",
  upload.array("images", 3),
  productController.updateProduct
);
routes.put(
  "/products/toggleProductBlock",
  productController.toggleProductBlock
);

//Order Managment Route
routes.get("/OrderManagment", orderController.loadOrder);
routes.post("/OrderManagment", orderController.updateOrderStatus);

// varient
routes.get("/varient/:id", varientController.loadvarient);
routes.post("/add-varient", varientController.addVarient);
routes.post("/variant/toggle-status", varientController.toggleStatus);
routes.post("/edit-variant", varientController.updatevariant);

//coupon mangment
routes.get("/coupon", coupon.loadcoupon);
routes.post("/add-coupon", coupon.addCoupon);
routes.put("/coupon/toggle-block", coupon.toggleBlockCoupon);

//sales Report

routes.get("/SalesReport", sales.loadSaleReportPage);
routes.get("/SalesReport/pdf", sales.generatePDF);
routes.get("/SalesReport/excel", sales.generateExcel);

module.exports = routes;
