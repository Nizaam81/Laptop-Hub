const express = require("express");
const routes = express.Router();
const multer = require('multer');
const admincontroller = require('../controller/admin/adminController')

const customerController=require('../controller/admin/customerController')
const categoryController =require("../controller/admin/categoryController")
const brandController = require("../controller/admin/brandController")
const productController = require("../controller/admin/productController")
const addProductController = require("../controller/admin/addProductController")
const orderController = require("../controller/admin/orderManagmentController")
const varientController = require("../controller/admin/variantController")
const upload = require("../utils/multer/uploads");




// admin login home logout 
routes.get("/login",admincontroller.loadlogin)
routes.post('/login',admincontroller.login)
routes.get('/home',admincontroller.loadhome)
routes.get('/logout',admincontroller.logout);

// user manegement 
routes.get("/users",customerController.customerInfo)
routes.post('/block-user/:userId', customerController.blockUser);
routes.post('/unblock-user/:userId',customerController.unblockUser);


//category management
routes.get("/category", categoryController.categoryInfo);
routes.post("/category/add", categoryController.addCategory);
routes.post("/category/update", categoryController.updateCategory);
routes.post("/category/toggle-status", categoryController.toggleStatus);
routes.post("/category/delete", categoryController.deleteCategory);

// brand management
routes.get('/brands', brandController.loadBrand);
routes.post('/brand/add', brandController.addBrand);
routes.put('/brand/update', brandController.updateBrand);
routes.put('/brand/toggle-block', brandController.toggleBlockBrand);
routes.delete('/brand/delete', brandController.deleteBrand);

//addProduct route 
routes.get("/addproduct",addProductController.loadpage)
routes.post("/add-product",upload.array('images', 3),addProductController.addProduct)

//products list route
routes.get("/products", productController.loadproduct);
routes.get("/edit-product", productController.editProduct);
routes.post("/updateProduct",upload.array('images', 3), productController.updateProduct);
routes.put('/products/toggleProductBlock',productController.toggleProductBlock);

//Order Managment Route
routes.get("/OrderManagment",orderController.loadOrder)

// varient 
routes.get("/varient/:id",varientController.loadvarient)
routes.post("/add-varient",varientController.addVarient)
routes.post("/variant/toggle-status",varientController.toggleStatus);
routes.post("/edit-variant",varientController.updatevariant)






module.exports = routes;