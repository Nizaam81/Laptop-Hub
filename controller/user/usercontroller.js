const user=require('../../model/usersSchema')
const nodemailer = require('nodemailer')
const env=require('dotenv').config()
const bcrypt = require('bcryptjs');



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
            text: `Your OTP is ${otp}. This OTP will expire in 2 minutes.`,
            html: `<b>Your OTP: ${otp}</b><br>This OTP will expire in 2 minutes.`,
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



const  loadHomepage = async(req,res)=>{
    try {
       
       return res.render('user/home')
    } catch (error) {
        console.log("home page is not founded");
        res.status(500).send("Internal server error")
        
    }
}

const loadlogin = async(req,res)=>{
    try {
       if(!req.session.user){
        res.render("user/login")
       }else{
        res.redirect("user/home")
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
        console.log(req.body)
        
        const findUser = await user.findOne({ isVerified: true,  email:  email });
        if (!findUser) {
            return res.render("user/login", { message: "User not found" });
        }
        
        if (findUser.isBlocked) {
            return res.render("user/login", { message: "User is blocked by admin" });
        }
        
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        
        if (!passwordMatch) {
            return res.render("user/login", { message: "Incorrect password" });
        }
        
        req.session.user = findUser._id;
        res.redirect("/user/home");  // Note the leading slash
        
    } catch (error) {
        console.error("/user/login error", error);
        res.render("user/login", { message: "Login failed. Please try again" });
    }
};


module.exports = {loadHomepage,loadlogin,loadsignup,pageNotfound,signup,loadverifyOtp, resendOTP,
    verifyOTP,login}