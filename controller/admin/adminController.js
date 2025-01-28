const user = require('../../model/usersSchema')
const mongoose= require('mongoose')
const bcrypt = require('bcryptjs');

const loadlogin = async (req, res) => {
    try {
        if (req.session.admin) {
            // Redirect to admin dashboard if admin is already logged in
            return res.redirect('/admin/home');
        }
        // Render the Admin Login page if no session exists
        return res.render('admin/AdminLogin');
    } catch (error) {
        console.error("Error loading admin login page:", error.message);
        res.status(500).send("Internal server error");
    }
};
const login = async (req, res) => {     
    try {         
        const { email, password } = req.body;
        
        const admin = await user.findOne({ isAdmin: true, email: email });
        
        if (!admin) {
            return res.status(400).json({ message: "Invalid email or admin access" });
        }
        
        const passwordMatch = await bcrypt.compare(password, admin.password);
        
        if (!passwordMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }
        
        req.session.admin = admin;
        res.status(200).json({ 
            message: "Login successful", 
            redirectUrl: "/admin/home"  // Add redirect URL to JSON response
        });
        
    } catch (error) {
        console.error("admin/login error", error);
        res.status(500).json({ message: "Login failed. Please try again" });
    } 
};

const loadhome = async(req,res)=>{
   
        try {
            return res.render("admin/Adminhome");
        } catch (error) {
            console.error("error loading admin home page",error.message)
            res.status(500).send("internal server error")
        }
    
   
}
const logout = async(req,res)=>{
    try {
        req.session.destroy((err)=>{
           if(err){
            console.log("session destruction error",err.message)
            res.redirect("user/pageNotfound");
           }
           return res.redirect('/admin/login')
        })
    } catch (error) {
        console.log("logout error",error );
        res.redirect("user/pageNotfound")
    }
  }
  


module.exports={loadlogin,loadhome,login,logout};