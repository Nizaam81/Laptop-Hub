const Category = require("../../model/categorySchema");
const Brand = require("../../model/brandschema");
const Product = require("../../model/productSchema");
const Path = require("path");
const fs = require("fs");


const loadProducts = async (req, res) => {
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
         
          const categories=await Category.find()
          const brands = await Brand.find()
          
       
        return res.render("admin/products", { products, categories,brands});
    } catch (error) {
        console.log("hello")
        console.log(error);
        res.status(500).render("admin/products", { 
            products: [], 
            error: "Failed to load products" 
        });
    }
};



const createProduct = async (req, res) => {
    try {
        console.log("haii pranav etta ")
        const { productName, description, brand, category, regularPrice, salePrice, quantity, color } = req.body; 
        console.log(req.files)
        
        const images = [];
        const brands=await Brand.findOne({brandName:brand})
        // Process and save images
        for(let i=0;i<4;i++){
           images.push(`/uploads/${req.files[i].filename}`)
        }
      
        console.log(images)

        const product = new Product({
            name:productName,
            description,
            brand,
            category,
            regularPrice,
            salePrice,
            quantity,
            images:images,
    
        });
        console.log(product)


        await product.save();
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

const editProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        const categories = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlocked: false });
        res.redirect("/admin/products");
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, brand, category, regularPrice, salePrice, productOffer, quantity, color } = req.body;
        const productId = req.params.id;

        const updateData = {
            name,
            description,
            brand,
            category,
            regularPrice,
            salePrice,
            productOffer,
            quantity,
            variants: [{ color, quantity }]
        };

    
       
        await Product.findByIdAndUpdate(productId, updateData);
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

const toggleProductBlock = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        product.isBlocked = !product.isBlocked;
        await product.save();
        res.json({ success: true, isBlocked: product.isBlocked });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        // Delete associated images
        if (product.images) {
            product.images.forEach(image => {
                fs.unlink(`public/uploads/products/${image}`, (err) => {
                    if (err) console.log(err);
                });
            });
        }
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};


module.exports = {
    loadProducts,
   
    createProduct,
    editProduct,
    updateProduct,
    toggleProductBlock,
    deleteProduct
};