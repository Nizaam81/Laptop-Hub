
const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const address = require("../../model/addressSchema")
const ObjectId = mongoose.Types.ObjectId;




const loadcheckout = async(req,res)=>{
   try {
        const userId = req.session.user;
     

        const carts = await cart.aggregate([
            {
                $match: { userId: new ObjectId(userId) } 
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productId", 
                    foreignField: "_id",
                    as: "productDetails",
                }
            },
            {
                $lookup: {
                    from: "variants",
                    localField: "VariantId",
                    foreignField: "_id",
                    as: "variantDetails",
                }
            },

        ]);
     
        
const Adress = await  address.findOne({userId:userId})
   
        const totalPrice=carts.reduce((sum,num)=>{
            return sum+=num.totalPrice},0)
        res.render("user/checkout", { carts,totalPrice ,firstLetter:"",users:"",Adress});
    } catch (error) {
        console.log("Error in loadCart");
        console.error(error);
    }
}



 
module.exports={
    loadcheckout
}