
const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
 const address = require("../../model/addressSchema")
 const order = require("../../model/orderSchema")
const ObjectId = mongoose.Types.ObjectId;

const loadOrder = async(req,res)=>{
    try {
        const userId = req.session.user;

        const orders = await order.aggregate([
            {
                $match: { userId: new ObjectId(userId) } // Filter carts by userId
            },
           {
             $unwind:"$orderItem"
           },{
            $lookup:{
                from:"products",
                localField:"orderItem.product",
                foreignField:"_id",
                as:"productDetails"
            }
           }
        ]);
       
        const totalPrice=orders.reduce((sum,num)=>{
            return sum+=num.orderItem.quantity*num.orderItem.price},0)
        res.render("user/orderDetails", { orders,totalPrice ,firstLetter:"",users:""});
       
    } catch (error) {
        console.log("error in loadorder controller")
        console.error(error)
    }
}

const loadorderFullDetails = async(req,res)=>{
    try {
        const userId = req.session.user;

        const orders = await order.aggregate([
            {
                $match: { userId: new ObjectId(userId) } 
            },
           {
             $unwind:"$orderItem"
           },{
            $lookup:{
                from:"products",
                localField:"orderItem.product",
                foreignField:"_id",
                as:"productDetails"
            }
           }
        ]);
        console.log("user side user side",orders)
        const Addres= await address.findOne({userId:userId})
        console.log(Addres)
        const totalPrice=orders.reduce((sum,num)=>{
            return sum+=num.orderItem.quantity*num.orderItem.price},0)
        res.render("user/orderFullDetails", { orders,totalPrice ,firstLetter:"",users:"",Addres});
     
    } catch (error) {
        console.log("error in loadorderFullDetails controller")
        console.error(error)
    }
}
const cancelOrder=async(req,res)=>{
    try {
        const {orderId,materialId}=req.body
        console.log(req.body)
        await order.updateOne(
            { _id: orderId, "orderItem._id": materialId },
            { $set: { "orderItem.$.status": "Cancelled" } }
        );
        return res.json({success:"Order Cancel SuccessFully"})
            } catch (error) {
        console.log(error)
    }
}
module.exports={
    loadorderFullDetails,
    loadOrder,cancelOrder
}