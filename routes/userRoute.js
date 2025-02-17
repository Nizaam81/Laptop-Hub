const express = require("express");
const passport = require("passport");
const routes = express.Router();
const usercontroller = require("../controller/user/usercontroller");
const userProfileController= require("../controller/user/userProfileController")
const addressController = require("../controller/user/addressController")
const cartController = require("../controller/user/cartContoller")
const checkout = require("../controller/user/checkoutController")
const userAuth = require("../middlware/userAuth")

routes.get("/pageNotfound", usercontroller.pageNotfound);
routes.get("/home", userAuth.userAuth, usercontroller.loadHomepage);
routes.get("/login", usercontroller.loadlogin);
routes.get("/signup", usercontroller.loadsignup);
routes.post("/signup", usercontroller.signup);
routes.get("/verifyOtp", usercontroller.loadverifyOtp);
routes.post("/verifyOTP", usercontroller.verifyOTP);
routes.post("/resend-otp", usercontroller.resendOTP);
routes.get('/welcome',usercontroller.welcome)

routes.get('/logout',usercontroller.logout);


routes.get("/productsDetails",userAuth.userAuth,usercontroller.loadproductDetails)
routes.get("/productView",userAuth.userAuth,usercontroller.loadproductView)

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
routes.get("/profile",userAuth.userAuth,usercontroller.profile)

//user profile 
routes.get("/userprofile",userAuth.userAuth,userProfileController.userprofile)


//address route &&  editAddress && addressDelete
routes.get("/address",userAuth.userAuth,addressController.loadAddress)
routes.get("/addAddress",userAuth.userAuth,addressController.addAddres)
routes.post("/addAddress",userAuth.userAuth,userProfileController.Addaddress)
routes.get("/editAddress/:id",userAuth.userAuth,addressController.editAddress);
routes.post("/updateAddress",userAuth.userAuth,addressController.updateAddress);
routes.post("/address/delete",userAuth.userAuth,addressController.deleteAddress);


//cart route
routes.get("/cart",userAuth.userAuth,cartController.loadCart)
routes.post("/add-Cart",userAuth.userAuth,cartController.AddCart)
routes.post("/Cart/remove",userAuth.userAuth,cartController.deleteCart)


//chnage email in userProfile  and password 

routes.post("/updatPhone",userAuth.userAuth,userProfileController.updatePhone)
routes.post("/changePassword",userAuth.userAuth,userProfileController.updatePassword);


//checkout routes
routes.get("/checkout",userAuth.userAuth,checkout.loadcheckout)








module.exports = routes; 