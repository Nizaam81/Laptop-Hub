const express = require("express");
const passport = require("passport");
const routes = express.Router();
const usercontroller = require("../controller/user/usercontroller");
const userProfileController= require("../controller/user/userProfileController")
const addressController = require("../controller/user/addressController")
const cartController = require("../controller/user/cartContoller")


routes.get("/pageNotfound", usercontroller.pageNotfound);
routes.get("/home", usercontroller.loadHomepage);
routes.get("/login", usercontroller.loadlogin);
routes.get("/signup", usercontroller.loadsignup);
routes.post("/signup", usercontroller.signup);
routes.get("/verifyOtp", usercontroller.loadverifyOtp);
routes.post("/verifyOTP", usercontroller.verifyOTP);
routes.post("/resend-otp", usercontroller.resendOTP);
routes.get('/welcome',usercontroller.welcome)

routes.get('/logout',usercontroller.logout);


routes.get("/productsDetails",usercontroller.loadproductDetails)
routes.get("/productView",usercontroller.loadproductView)

routes.post('/login',usercontroller.login)
// Google OAuth routes
routes.get("/auth/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"]
  })
);

routes.get(
  "/googleCallback",
  (req, res, next) => {
    console.log("Google callback triggered");
    next();
  },
  passport.authenticate("google", {
    failureRedirect: "/user/signup",
    failureFlash: true,
  }),
  (req, res) => {
    console.log("User authenticated:", req.user);
    res.redirect("/user/home");
  }
);


//forgort password
routes.get("/forgotPassword",usercontroller.loadForgotpassword)
routes.post('/forgotpassword',usercontroller.forgotPassword);
routes.post('/verifyreset-otp',usercontroller.verifyForgotPasswordOTP);
routes.post('/resetpassword',usercontroller.resetPassword);
routes.get("/setPassword",usercontroller.newPassword)
routes.get("/fVerifyOtp",usercontroller.loadOtp)


//profile route
routes.get("/profile",usercontroller.profile)

//user profile 
routes.get("/userprofile",userProfileController.userprofile)


//address route
routes.get("/address",addressController.loadAddress)
routes.get("/addAddress",addressController.addAddres)
routes.post("/addAddress",userProfileController.Addaddress)



//cart route
routes.get("/cart",cartController.loadCart)
routes.post("/add-Cart",cartController.AddCart)


//chnage email in userProfile  and password 

routes.post("/updatemail",userProfileController.updateEmail)
routes.post("/changePassword", userProfileController.updatePassword);


//editAddress
routes.get("/editAddress/:id", addressController.editAddress);
routes.post("/updateAddress", addressController.updateAddress);




module.exports = routes; 