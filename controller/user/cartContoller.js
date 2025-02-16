const cart = require("../../model/cartSchema")
const user = require("../../model/usersSchema")
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId; // ✅ Correct way to get ObjectId


const loadCart = async(req,res)=>{
    try {
        const userid = req.session.user
       
    
        const Cart=await cart.aggregate([{$match:{userId:new ObjectId(userid)}},{
            $lookup:{
                from:"products",
                localField:"productId",
                foreignField:"_id",
                as:"productDetails"
            }
        }
    ,{
        $lookup:{
            from:"categories",
            localField:"productDetails.category",
            foreignField:"_id",
            as:"categoryDetails"
        }
    },{
        $lookup:{
            from:"brands",
            localField:"productDetails.brand",
            foreignField:"_id",
            as:"brandDetails"
        }
    }])
        console.log(Cart)
        
       
        res.render("user/cart",{firstLetter:"",users:"",Cart})
    } catch (error) {
        console.log("error in loadcart contoller");
        
    }
}

 const  AddCart = async(req,res)=>{
      try {
        const userid=req.session.user
       const {productId, quantity, price, totalPrice}=req.body
      const Newcart = new cart({
        userId:userid,
        productId:productId,
        quantity:quantity,
        price:price,
        totalPrice:totalPrice,

      })
      await Newcart.save()
      return res.json({message:"Addedd SuccessFully"})
      } catch (error) {
         console.error(error)
         console.log("error in AddCart post request path controller l userl CartController")
      }
 }


module.exports={
    loadCart,
    AddCart
}