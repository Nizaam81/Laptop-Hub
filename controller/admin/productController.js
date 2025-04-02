const Category = require("../../model/categorySchema");
const Brand = require("../../model/brandschema");
const Product = require("../../model/productSchema");
const Path = require("path");
const fs = require("fs");
const { log } = require("console");

const loadproduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search || "";

    let matchCondition = {};
    if (searchQuery && searchQuery.trim() !== "") {
      matchCondition.name = { $regex: searchQuery.trim(), $options: "i" };
    }

    const totalProducts = await Product.countDocuments(matchCondition);
    const totalPages = Math.ceil(totalProducts / limit) || 1;

    const products = await Product.aggregate([
      { $match: matchCondition },

      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
    ]);

    return res.render("admin/products", {
      products,
      currentPage: page,
      totalPages,
      searchQuery,
    });
  } catch (error) {
    console.log(error);
    res.status(500).render("admin/products", {
      products: [],
      currentPage: 1,
      totalPages: 0,
      searchQuery: "",
      error: "Failed to load products",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      productId,
      product,
      description,
      brand,
      category,
      regularPrice,
      salePrice,
      quantity,
      indexes,
    } = req.body;

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (indexes && indexes.length > 0 && req.files && req.files.length > 0) {
      for (let i = 0; i < indexes.length; i++) {
        const oldImagePath = existingProduct.images[indexes[i]];

        if (oldImagePath) {
          const fullPath = Path.join(
            __dirname,
            "../../public/uploads",
            Path.basename(oldImagePath)
          );

          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
              console.log(`Deleted old image: ${fullPath}`);
            } catch (err) {
              console.error(`Failed to delete image at ${fullPath}:`, err);
            }
          } else {
            console.log(`File not found at ${fullPath}`);
          }
        }

        await Product.updateOne(
          { _id: productId },
          {
            $set: {
              [`images.${indexes[i]}`]: `/uploads/${req.files[i].filename}`,
            },
          }
        );
      }
    }

    await Product.findByIdAndUpdate(
      { _id: productId },
      {
        name: product,
        description: description,
        brand: brand,
        category: category,
        regularPrice: regularPrice,
        salePrice: salePrice,
        quantity: quantity,
      }
    );

    return res.status(200).json({ success: "Product edited successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "Failed to update product" });
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
      brandCollection,
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
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productsId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.isBlocked = !product.isBlocked;
    await product.save();

    res.json({ success: true, isBlocked: product.isBlocked });
  } catch (error) {
    console.error("Error toggling product block:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  loadproduct,
  editProduct,
  toggleProductBlock,
  updateProduct,
};
