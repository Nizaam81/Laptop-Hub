const Category = require("../../model/categorySchema");
const Brand = require("../../model/brandschema");
const Product = require("../../model/productSchema");
const Path = require("path");
const fs = require("fs");

const loadpage = async (req, res) => {
  try {
    const brands = await Brand.find({ isBlocked: false });
    const categories = await Category.find({ isListed: true });
    res.render("admin/addProduct", { brands, categories });
  } catch (error) {
    console.log("error in addproduct page controller");
  }
};

const addoffer = async (req, res) => {
  try {
    const { offerName, description, discount, productId } = req.body;

    if (!offerName || !description || !discount || !productId) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.offerName = offerName;
    product.offerDescription = description;
    product.offerPercentage = discount;

    await product.save();

    return res.json({ success: "Product offer added successfully" });
  } catch (error) {
    console.error("Error in addoffer:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const addProduct = async (req, res) => {
  try {
    const { product, description, brand, category } = req.body;

    const [file1, file2, file3] = req.files;
    if (!product || !description || !brand || !category) {
      return res.json({ error: "Please Fill All The Fields" });
    }

    if (req.files.length != 3) {
      return res.json({ imageError: "Please Upload 3 Images" });
    }
    const existproduct = await Product.findOne({ name: product });
    if (existproduct) {
      return res.json({ existError: "This productname Already Exist" });
    }

    let images = [];

    for (let i = 0; i < 3; i++) {
      images.push(`/uploads/${req.files[i].filename}`);
    }
    const newProduct = new Product({
      name: product,
      description,
      brand,
      category,
      images,
    });

    await newProduct.save();

    return res.json({ success: "Product Addedd Successfully" });
  } catch (error) {
    console.log("error adding product backend", error.message);
  }
};
module.exports = {
  loadpage,
  addProduct,
  addoffer,
};
