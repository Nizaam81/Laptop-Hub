const express = require("express");
const routes = express.Router();
const multer = require('multer');
const admincontroller = require('../controller/admin/adminController')
const adminMiddleware=require("../middlware/auth")
const customerController=require('../controller/admin/customerController')
const categoryController =require("../controller/admin/categoryController")
const brandController = require("../controller/admin/brandController")
const productController = require("../controller/admin/productController")
const upload = require("../utils/multer/uploads");





routes.get("/login",admincontroller.loadlogin)
routes.post('/login',admincontroller.login)
routes.get('/home',adminMiddleware.adminAuth,admincontroller.loadhome)
routes.get('/logout',admincontroller.logout);

// customer manegement 
routes.get("/users",adminMiddleware.adminAuth,customerController.customerInfo)
routes.post('/block-user/:userId', customerController.blockUser);
routes.post('/unblock-user/:userId', customerController.unblockUser);


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

//product managements 
routes.get("/products",productController.loadProducts)


// routes.get("/add-product", productController.addProduct);
routes.post("/products", upload.array('images', 4), productController.createProduct);
routes.get("/products/:id/edit", productController.editProduct);
routes.put("/products/:id", upload.array('images', 4), productController.updateProduct);
routes.patch("/products/:id/toggle-block", productController.toggleProductBlock);
routes.delete("/products/:id", productController.deleteProduct);
routes.post('/products-edit', productController.editProduct);


module.exports = routes;