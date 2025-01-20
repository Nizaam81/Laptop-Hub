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

const login = async(req,res)=>{
    try {
       
        res.render("user/login")
    } catch (error) {
        res.send("eroor")
     console.log("user login is error")
    }
}
const signup=async(req,res)=>{
    try {
        res.render('user/signup')
        
    } catch (error) {
        res.status(500).send("Internal server error")
        console.log("signup page is not founded");
    }
}
module.exports = {loadHomepage,login,signup,pageNotfound}