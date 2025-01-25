const express = require("express");
const passport = require("passport");
const routes = express.Router();
const usercontroller = require("../controller/user/usercontroller");

// Regular authentication routes
routes.get("/pageNotfound", usercontroller.pageNotfound);
routes.get("/home", usercontroller.loadHomepage);
routes.get("/login", usercontroller.loadlogin);
routes.get("/signup", usercontroller.loadsignup);
routes.post("/signup", usercontroller.signup);
routes.get("/verifyOtp", usercontroller.loadverifyOtp);
routes.post("/verifyOTP", usercontroller.verifyOTP);
routes.post("/resend-otp", usercontroller.resendOTP);
routes.get('/welcome',usercontroller.welcome)
// routes.get('/logout',usercontroller.logout)
routes.post('/logout',usercontroller.logout);

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
module.exports = routes;