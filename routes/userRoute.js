const express = require("express");
const routes = express.Router();
const usercontroller = require("../controller/user/usercontroller");
routes.get("/pageNotfound",usercontroller.pageNotfound)
routes.get("/home",usercontroller.loadHomepage);
routes.get("/login",usercontroller.login)
routes.get('/signup',usercontroller.signup)

module.exports = routes;
