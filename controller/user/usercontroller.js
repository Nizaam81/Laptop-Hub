const user=require('../../model/usersSchema')
const nodemailer = require('nodemailer')
const env=require('dotenv').config()
const bcrypt = require('bcryptjs');
const product = require("../../model/productSchema");



const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your email",
            text: `Dear User, your One-Time Password (OTP) is ${otp}. Please use this code to complete your verification process. For security reasons, do not share this code with anyone. This OTP will expire in 2 minutes. Thank you..`,
            html: `Dear User, your One-Time Password (OTP) is <b> ${otp}</b><br>Please use this code to complete your verification process. For security reasons, do not share this code with anyone. This OTP will expire in 2 minutes. Thank you..`,
        });

        return info.accepted.length > 0;

    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

const resendOTP = async (req, res) => {
    try {
        const userData = req.session.userData;
        
        if (!userData || !userData.email) {
            return res.status(400).json({
                status: 'error',
                message: 'No user data found. Please start registration again.'
            });
        }

        const newOTP = generateOtp();
        const emailSent = await sendVerificationEmail(userData.email, newOTP);
        
        if (!emailSent) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to send new OTP'
            });
        }

        // Store new OTP and timestamp
        req.session.userOtp = newOTP;  // Fixed: using newOTP instead of otp
        req.session.otpTimestamp = Date.now();
        
        return res.status(200).json({
            status: 'success',
            message: 'New OTP sent successfully'
        });

    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to resend OTP'
        });
    }
};
const pageNotfound = async(req,res)=>{
    try {
        res.render("user/pageNotfound")
    } catch (error) {
        res.redirect("/views/user/home.ejs")
    }
}


const loadHomepage = async (req, res) => {
    try {
        const User=await user.findOne({_id:req.session.user})
      const Products = await product.find({ isBlocked: false });
        res.render('user/home', {User,Products});
        
    } catch (error) {
        console.error("Home page error:", error);
        res.status(500).send("Internal Server Error");
    }
}

const loadlogin = async(req,res)=>{
    try {
       if(!req.session.user){
        res.render("user/login")
       }else{
        res.redirect("/user/home")
       }
       
    } catch (error) {
        res.redirect("user/pageNotfound")
     console.log("user login is error")
    }
}
const loadsignup=async(req,res)=>{
    try {
        res.render('user/signup')
        
    } catch (error) {
        res.status(500).send("Internal server error")
        console.log("signup page is not founded");
    }
}


const signup = async (req, res) => {
    const { Fname, Lname, phone, email, password, cpassword } = req.body;
    console.log(req.body);

    try {
        // Validation checks
        if (!Fname || !Lname || !phone || !email || !password || !cpassword) {
            return res.status(400).json({ 
                status: 'error',
                title: 'Validation Error',
                message: 'All fields are required'
            });
        }

        if (password !== cpassword) {
            return res.status(400).json({ 
                status: 'error',
                title: 'Password Mismatch',
                message: 'Passwords do not match'
            });
        }

        // Email format validation
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                status: 'error',
                title: 'Invalid Email',
                message: 'Please enter a valid email address'
            });
        }

        // Phone number validation
        const phoneRegex = /^[1-9][0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ 
                status: 'error',
                title: 'Invalid Phone',
                message: 'Please enter a valid 10-digit phone number'
            });
        }

        // Check if user already exists
        const existingUser = await user.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ 
                    status: 'error',
                    title: 'Email Exists',
                    message: 'This email is already registered'
                });
            }
            if (existingUser.phone === phone) {
                return res.status(400).json({ 
                    status: 'error',
                    title: 'Phone Exists',
                    message: 'This phone number is already registered'
                });
            }
        }


const otp = generateOtp();
const emailSent = await sendVerificationEmail(email, otp);
        
        if (!emailSent) {
            return res.status(500).json({ 
                status: 'error',
                title: 'Email Error',
                message: 'Failed to send verification email'
            });
        }

        // Store user data and OTP in session
        req.session.userOtp = otp;
        req.session.userData = {
            Fname,
            Lname,
            phone,
            email,
            password: password // Will be hashed after OTP verification
        };

        // Log OTP for development purposes only
        console.log("OTP sent", otp);
        
        // Redirect to OTP verification page
        return res.render("user/verifyOtp");

    } catch (error) {
        console.error("Detailed error:", error);

        if (error.code === 11000) {
            return res.status(400).json({ 
                status: 'error',
                title: 'Duplicate Entry',
                message: 'This email or phone number is already registered'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                status: 'error',
                title: 'Validation Error',
                message: messages.join(', ')
            });
        }

        return res.status(500).json({ 
            status: 'error',
            title: 'Server Error',
            message: 'An unexpected error occurred. Please try again.'
        });
    }
};
const verifyOTP = async (req, res) => {
    try {
        
        const { otp } = req.body;
        const storedOTP = req.session.userOtp;
        const userData = req.session.userData;
        const otpTimestamp = req.session.otpTimestamp;


        if (otp !== storedOTP) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid OTP. Please try again.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const newUser = new user({
            FirstName: userData.Fname,
            LastName: userData.Lname,
            phone: userData.phone,
            email: userData.email,
            password: hashedPassword,
            isVerified: true
        });

        await newUser.save();

        // Clear session data
        req.session.userOtp = null;
        req.session.userData = null;
        req.session.otpTimestamp = null;

        return res.status(200).json({
            status: 'success',
            message: 'Account verified successfully!',
            redirect: '/user/login'
        });

    } catch (error) {
        console.error("OTP verification error:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to verify OTP.'
        });
    }
};

const loadverifyOtp =async(req,res)=>{
    try {

         res.render('user/verifyOtp')
    } catch (error) {
          res.status(500).send("Internal server error")
        console.log("verification  page is not founded");
    }
}

const login = async (req, res) => {
    try {
       
        
        const {  email, password } = req.body;
       
      
        
        const findUser = await user.findOne({ isVerified: true,  email:  email });
        if (!findUser) {
            return res.render("user/login", { message: "User not found"  });
        }
        
        if (findUser.isBlocked) {
            return res.render("user/login", { message: "User is blocked by admin" });
        }
        
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        console.log(passwordMatch)
        
        if (!passwordMatch) {
            console.log("haii this function is working")
            return res.render("user/login", { message: "Incorrect password" });
        }
        
        req.session.user = findUser._id;
        res.redirect("/user/home");  // Note the leading slash
        
    } catch (error) {
        console.error("/user/login error", error);
        res.render("user/login", { message: "Login failed. Please try again" });
    }
};

const welcome = async (req, res) => {
    try {
      return res.render('user/welcome'); 
    } catch (error) {
      console.error('Error rendering /user/welcome:', error);
      res.render("user/pageNotfound"); 
    }
  };
  const logout = async(req,res)=>{
    try {
        req.session.destroy((err)=>{
           if(err){
       
            res.redirect("user/pageNotfound");
           }
           return res.redirect('/user/login')
        })
    } catch (error) {
        console.log("logout error",error );
        res.redirect("user/pageNotfound")
    }
  }

  const loadproductDetails = async(req,res)=>{
    try {
        const Products=await product.find({isBlocked:false})
        const User=req.session.user
       
        res.render("user/ProductsDetails",{User,Products})
    } catch (error) {
        console.log("erro")
    }
  }

  const loadproductView = async(req,res)=>{
    try {
        const productId=req.query.productId
        const User = req.session.user 
        const products = await product.findOne({ _id: productId });
        
        res.render("user/productView",{products})
    } catch (error) {
        console.error(error.message)
        res.render("user/pageNotfound")
    }
  } 

  const  loadForgotpassword = async(req,res)=>{
    try {
        res.render("user/forgotpassword")
    } catch (error) {
        
    }
  }

  const forgotPassword = async (req, res) => {
    try {
        console.log("haai")
        const { email } = req.body;
        console.log(req.body)
        
        // Check if email exists
        const existingUser = await user.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({
                status: 'error',
                message: 'No account found with this email'
            });
        }

        // Generate OTP
        const otp = generateOtp();
        
        // Send OTP email
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to send verification email'
            });
        }

        // Store OTP in session
        req.session.resetPasswordOtp = otp;
        req.session.resetPasswordEmail = email;
        req.session.otpTimestamp = Date.now();
        console.log("OTP sent", otp);

        return res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while processing your request'
        });
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        
        // Check if OTP exists in session
        if (!req.session.resetPasswordOtp || !req.session.otpTimestamp) {
            return res.status(400).json({
                status: 'error',
                message: 'No OTP found or OTP has expired'
            });
        }

        // Verify OTP
        if (otp !== req.session.resetPasswordOtp) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid OTP'
            });
        }

        // Check OTP expiry (1 minute)
        const otpAge = Date.now() - req.session.otpTimestamp;
        if (otpAge > 60000) { // 1 minute in milliseconds
            // Clear expired OTP
            req.session.resetPasswordOtp = null;
            req.session.otpTimestamp = null;
            
            return res.status(400).json({
                status: 'error',
                message: 'OTP has expired'
            });
        }

        // Clear OTP from session but keep email for password reset
        req.session.resetPasswordOtp = null;
        req.session.otpTimestamp = null;

        return res.status(200).json({
            status: 'success',
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while verifying OTP'
        });
    }
} 
const newPassword = async(req,res)=>{
    try {
        res.render("user/newPassword")
    } catch (error) {
        console.error(error)
    }
}

const resetPassword = async (req, res) => {
    try {
        console.log("haii rest paswword function is working")
        const { newPassword, confirmPassword } = req.body;
        console.log(req.body)
        const email = req.session.resetPasswordEmail;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Password reset session expired'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Passwords do not match'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        await user.findOneAndUpdate(
            { email },
            { password: hashedPassword }
        );

        // Clear session data
        req.session.resetPasswordEmail = null;

        return res.status(200).json({
            status: 'success',
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while resetting password'
        });
    }
};

 const  loadOtp = async(req,res)=>{
    try {
        res.render("user/fVerifyOtp")
    } catch (error) {
        console.error(error)
    }
 }

  const profile =async(req,res)=>{
    try {

        const userid =req.session.user
        
        const users= await user.findOne({_id:userid});
        const firstLetter = users.FirstName.charAt(0)
 
        res.render("user/profile",{users,firstLetter})
    } catch (error) {
        res.render("user/pageNotfound.ejs")
        console.log("profile error");
        console.error(error);
        
        
    }
  }


module.exports = {loadHomepage,loadlogin,loadsignup,pageNotfound,signup,loadverifyOtp, resendOTP,
    verifyOTP,login,welcome,logout,loadproductDetails,loadproductView,forgotPassword, profile,resetPassword,verifyForgotPasswordOTP,loadForgotpassword,loadOtp,newPassword}