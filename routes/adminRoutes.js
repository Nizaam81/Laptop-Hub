const express = require("express");
const routes = express.Router();
const admincontroller = require('../controller/admin/adminController')


routes.get("/login",admincontroller.loadlogin)
routes.post('/login',admincontroller.login)
routes.get('/home',admincontroller.loadhome)



module.exports = routes;