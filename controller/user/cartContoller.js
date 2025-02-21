const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const loadCart = async (req, res) => {
    try {
        const userid = req.session.user;

        if (!userid) {
            return res.redirect("/login");
        }

        const Cart = await cart.aggregate([
            { $match: { userId: new ObjectId(userid) } },
            { $unwind: "$items" }, // If cart has an items array
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "productDetails.brand",
                    foreignField: "_id",
                    as: "brandDetails"
                }
            },
            {
                $lookup: {
                    from: "variants", // Corrected collection name
                    localField: "productDetails.variant",
                    foreignField: "_id",
                    as: "variantDetails"
                }
            }
        ]);

        console.log(Cart);

        const users = await user.findById(userid);

        res.render("user/cart", {
            firstLetter: users ? users.name.charAt(0).toUpperCase() : "",
            users,
            Cart
        });
    } catch (error) {
        console.error("Error in loadCart controller:", error);
        res.status(500).send("Internal Server Error");
    }
};



 const  AddCart = async(req,res)=>{
      try {
        console.log("haaiiiiiiii addcart is woking ")
        const {productId,varientId }=req.body
       const  varientDetails = await variant.find({_id:varientId})
        
        console.log("add cart controller ",varientDetails)
        const userid=req.session.user
      
      const Newcart = new cart({
        userId:userid,
        productId:productId,
       

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