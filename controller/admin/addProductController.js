const Category = require( "../../model/categorySchema");
const Brand = require("../../model/brandschema");
const Product = require("../../model/productSchema");
const Path = require("path");
const fs = require("fs");

const loadpage=async(req,res)=>{
    try {
        const brands=await Brand.find({isBlocked:false})
        const categories = await Category.find({isListed:true})
        res.render("admin/addProduct",{brands,categories})
    } catch (error) {
        console.log("error in addproduct page controller")
    }
}


const addProduct=async(req,res)=>{
    try {
        const {product,description,brand,category,regularPrice,salePrice,quantity}=req.body;
        const [file1,file2,file3]=req.files;
        if(!product || !description || !brand || !category || !regularPrice || !salePrice || !quantity){
            return res.json({error:"Please Fill All The Field"})
        }
        if(req.files.length!=3){
            return res.json({imageError:"Please Upload 3 Images"})
        }
        const existproduct=await Product.findOne({name:product})
        if(existproduct){
            return res.json({existError:"This productname Already Exist"})
        }
        if(quantity < 0){
            return res.json({minusQty:"Quantity Less than 0 Is Not Possible"})
        }
        let images=[]
       
        for(let i=0;i<3;i++){
           images.push(`/uploads/${req.files[i].filename}`)
        }
        const newProduct = new Product({
            name:product,
            description,
            brand,
            category,
            regularPrice,
            salePrice,
            quantity,
            images
        })
        await newProduct.save()
        
      
        return res.json({success:"Product Addedd Successfully"})
    } catch (error) {
        console.log(error)
    }
}
module.exports={
    loadpage,addProduct
}