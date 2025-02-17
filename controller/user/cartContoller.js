const cart = require("../../model/cartSchema")
const user = require("../../model/usersSchema")
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId; 


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


 const deleteCart = async (req, res) => {
    const { id } = req.body;
    try {
        const cartItem = await cart.findById(id);
        if (!cartItem) {
            return res.status(404).json({ error: "Cart item not found" });
        }

        await cart.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Cart item deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


module.exports={
    loadCart,
    AddCart,
    deleteCart
}