const cart = require("../../model/cartSchema")

const loadCart = async(req,res)=>{
    try {
        res.render("user/cart")
    } catch (error) {
        console.log("error in loadcart contoller");
        
    }
}

module.exports={
    loadCart
}