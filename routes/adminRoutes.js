const express = require("express");
const routes = express.Router();
const admincontroller = require('../controller/admin/adminController')
const adminMiddleware=require("../middlware/auth")
const customerController=require('../controller/admin/customerController')
const categoryController =require("../controller/admin/categoryController")
const brandController = require("../controller/admin/brandController")


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

module.exports = routes;