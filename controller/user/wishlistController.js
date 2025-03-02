const wishhlist = require("../../model/wishlistSchema")
const user = require("../../model/usersSchema")
const variant= require("../../model/varient")
const products = require("../../model/productSchema")



const loadWishlist = async (req, res) => {
  try {

     
    res.render("user/wishlist")
  } catch (error) {
    console.log("error in wiahlist get route")
    console.error(error)
  }
};



const Wishlist = async (req, res) => {
    try {
        const userId = req.session.user;  
        const { productId, action } = req.body;
        console.log(req.body)
        const productss=await variant.findOne({_id:productId})
        const productDetails=await products.findOne({_id:productss.product})
       
          
        if (action === "add") {
            
            const wishlists=await wishhlist({
                userId,
                products:[{
                    productId:productss.product,
                    productImage:productDetails.images[0],
                    productName:productDetails.name
                }]
            })
            await wishlists.save();
            return res.json({ success: true, action: "added" });
        } else if (action === "remove") {
            const Wishlist = await wishhlist.findOne({ userId }); // Fixed typo
            console.log(Wishlist)


    let X= Wishlist.products.filter(
        item => item.productId.toString() !== productId
    );
    console.log(X)


    await Wishlist.save(); // Save the updated Wishlist document


            return res.json({ success: true, action: "removed" });
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }
    } catch (error) {
        console.error("Error updating wishlist:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports={
    loadWishlist,
    Wishlist
}