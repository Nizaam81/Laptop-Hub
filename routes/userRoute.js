const express = require("express");
const passport = require("passport");
const routes = express.Router();
const usercontroller = require("../controller/user/usercontroller");
const userProfileController = require("../controller/user/userProfileController");
const addressController = require("../controller/user/addressController");
const cartController = require("../controller/user/cartContoller");
const checkout = require("../controller/user/checkoutController");
const userAuth = require("../middlware/userAuth");
const orderController = require("../controller/user/orderManagmentController");
const placeOrder = require("../controller/user/placeOrder");
const wishlist = require("../controller/user/wishlistController");
const wallet = require("../controller/user/walletController");
const coupon = require("../controller/user/couponController");
const invoiceController = require("../controller/user/invoiceController");

routes.get("/pageNotfound", usercontroller.pageNotfound);
routes.get("/home", userAuth.userAuth, usercontroller.loadHomepage);
routes.get("/login", usercontroller.loadlogin);
routes.get("/signup", usercontroller.loadsignup);
routes.post("/signup", usercontroller.signup);
routes.get("/verifyOtp", usercontroller.loadverifyOtp);
routes.post("/verifyOTP", usercontroller.verifyOTP);
routes.post("/resend-otp", usercontroller.resendOTP);
routes.get("/welcome", usercontroller.welcome);

routes.get("/logout", userAuth.userAuth, usercontroller.logout);

routes.get(
  "/productsDetails",
  userAuth.userAuth,
  usercontroller.loadproductDetails
);
routes.get("/productView", userAuth.userAuth, usercontroller.loadproductView);

routes.post("/login", usercontroller.login);
// Google OAuth routes
routes.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
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
    req.session.user = req.user._id;
    res.redirect("/user/home");
  }
);

//forgort password
routes.get("/forgotPassword", usercontroller.loadForgotpassword);
routes.post("/forgotpassword", usercontroller.forgotPassword);
routes.post("/verifyreset-otp", usercontroller.verifyForgotPasswordOTP);
routes.post("/resetpassword", usercontroller.resetPassword);
routes.get("/setPassword", usercontroller.newPassword);
routes.get("/fVerifyOtp", usercontroller.loadOtp);

//profile route
routes.get("/profile", userAuth.userAuth, usercontroller.profile);

//user profile
routes.get(
  "/userprofile",
  userAuth.userAuth,
  userProfileController.userprofile
);

//address route &&  editAddress && addressDelete
routes.get("/address", userAuth.userAuth, addressController.loadAddress);
routes.get("/addAddress", userAuth.userAuth, addressController.addAddres);
routes.post("/addAddress", userAuth.userAuth, userProfileController.Addaddress);
routes.get(
  "/editAddress/:id",
  userAuth.userAuth,
  addressController.editAddress
);
routes.post(
  "/updateAddress",
  userAuth.userAuth,
  addressController.updateAddress
);
routes.post(
  "/address/delete",
  userAuth.userAuth,
  addressController.deleteAddress
);

//cart route
routes.get("/cart", userAuth.userAuth, cartController.loadCart);
routes.post("/add-Cart", userAuth.userAuth, cartController.AddCart);
routes.post("/cart-delete", userAuth.userAuth, cartController.deleteCart);

//chnage email in userProfile  and password

routes.post(
  "/updateProfile",
  userAuth.userAuth,
  userProfileController.changeProfile
);

//checkout routes
routes.get("/checkout", userAuth.userAuth, checkout.loadcheckout);

// order details
routes.get("/order", userAuth.userAuth, orderController.loadOrder);
routes.get(
  "/orderDetailss/:id",
  userAuth.userAuth,
  orderController.loadorderFullDetails
);
routes.post("/cancelOrder", orderController.cancelOrder);
routes.post("/cancelItem", orderController.cancelItem);

//place order
routes.get("/PlaceOrderr", userAuth.userAuth, placeOrder.loadPlaceOrder);
routes.post("/placeOrder", userAuth.userAuth, placeOrder.placeOrder);
routes.post("/verifyPayment", userAuth.userAuth, placeOrder.verifyPayment);
routes.post("/retryPayment", placeOrder.retryPayment);

routes.post("/getWalletBalance", userAuth.userAuth, placeOrder.walletPayment);

//wishlist
routes.get("/wishlist", wishlist.loadWishlist);
routes.post("/Wishlist", wishlist.Wishlist);
routes.delete("/Wishlist/delete", wishlist.deleteWishlist);
routes.get("/empty", wishlist.empty);

//wallet
routes.get("/wallet", wallet.loadWallet);

//coupon

routes.post("/availableCoupons", coupon.getAvailableCoupons);
routes.post("/couponApplied", coupon.applyCoupon);

//invoice

routes.get("/download-invoice/:id", invoiceController.invoice);
routes.post("/paymentFailed", placeOrder.paymentFailed);
//return
routes.post("/returnItem", orderController.returnItem);
routes.post(
  "/retryPayments",
  (req, res, next) => {
    next();
  },
  async (req, res, next) => {
    try {
      await placeOrder.retryPaymentOrderDetails(req, res);
    } catch (error) {
      console.error("🚨 ERROR in retryPayment route:", error);
      res
        .status(500)
        .json({ error: "Something went wrong", details: error.message });
    }
  }
);

//referal
routes.get("/referal", usercontroller.referal);

routes.post("/paymentFailed", placeOrder.paymentFailedorderdetails);
module.exports = routes;
