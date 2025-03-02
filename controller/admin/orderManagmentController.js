const user = require("../../model/usersSchema")
const address = require("../../model/addressSchema")
const order = require("../../model/orderSchema")

const loadOrder =async(req,res)=>{
    try {
         const Order = await order.aggregate([{
            $lookup:{
                from:"users",
                localField:"userId",
                foreignField:"_id",
                as:"userDetails",
            },
         },{
            $unwind:"$orderItem"
         },{
            $lookup:{
                from:"products",
                localField:"orderItem.product",
                foreignField:"_id",
                as:"productDetails"
            }
         }])
         console.log(Order)
         const status= ["pending", "processing", "shipped", "Delivered", "Cancelled", "Return Request", "Returned"]
        
        res.render("admin/orderManagment",{Order,status})
    } catch (error) {
        console.error(error)
        console.log("error in loadOrder Controller")
    }
}

module.exports={
    loadOrder
}