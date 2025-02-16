const Category = require("../../model/categorySchema");
const Brand = require("../../model/brandschema");
const Product = require("../../model/productSchema");
const Path = require("path");
const fs = require("fs");
const { log } = require("console");





 const loadproduct = async (req, res) => {
     try {
      
         const products = await Product.aggregate([
            {
               $lookup: {
                 from:"brands",      
                 localField:'brand',  
                 foreignField:'_id',  
                 as:"brandDetails"    
               }
             },
             {
               $lookup: {
                 from: "categories",
                 localField: "category",
                 foreignField: "_id",
                 as: "categoryDetails"
               }
             },
            
            
           ]);
          
           
         
          
          
       
         return res.render("admin/products", { products});
     } catch (error) {
       
         console.log(error);
         res.status(500).render("admin/products", { 
             products: [], 
             error: "Failed to load products" 
        });
     }
 };




const updateProduct = async (req, res) => {
    try {
       

 
        const {productId,product,description,brand,category,regularPrice,salePrice,quantity}=req.body
        const existproduct=await Product.findOne({name:product})
        if(existproduct){
            return res.json({existError:"This productname Already Exist"})
        }
        
       

        await Product.findByIdAndUpdate({_id:productId},{name:product,description:description,brand:brand,category:category,regularPrice:regularPrice,salePrice:salePrice,quantity:quantity})
         return res.status(200).json({success : "Product edited successfully"})
       
    
      
        
    } catch (error) {
        console.error("Error updating product:", error);
        
       
       
       
    }
};

const editProduct = async (req, res) => {
  try {
    const products = await Product.findOne({ _id: req.query.id });
    const brands = await Brand.findOne({ _id: products.brand });
    const categories = await Category.findOne({ _id: products.category });
    const brandCollection = await Brand.find();
    const categoryCollection = await Category.find();
    
    res.render("admin/editProducts", {
      products,
      brands,
      categories,
      categoryCollection,
      brandCollection
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const toggleProductBlock = async (req, res) => {
  try {
    

      const { productsId } = req.body;  
      if (!productsId) {
          return res.status(400).json({ success: false, message: "Product ID is required" });
      }

      const product = await Product.findById(productsId);
      if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
      }

      product.isBlocked = !product.isBlocked;
      await product.save();

      res.json({ success: true, isBlocked: product.isBlocked });
  } catch (error) {
      console.error("Error toggling product block:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};







module.exports={
  loadproduct,
  editProduct,
  toggleProductBlock,
  updateProduct

}


