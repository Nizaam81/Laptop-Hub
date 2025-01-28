const Brand = require("../../model/brandschema");

const loadBrand = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        
        const search = req.query.search || "";
        const query = {
            brandName: { $regex: search, $options: 'i' }
        };

        const totalBrands = await Brand.countDocuments(query);
        const totalPages = Math.ceil(totalBrands / limit);
        
        const brands = await Brand.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createAt: -1 });

        res.render("admin/brand", {
            brands,
            currentPage: page,
            totalPages,
            search
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};

const addBrand = async (req, res) => {
    try {
        const { brandName } = req.body; 
       

        if (!brandName || brandName.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Brand name is required'
            });
        }

        const newBrand = new Brand({ brandName }); 
        await newBrand.save();

        res.status(201).json({
            success: true,
            brand: newBrand,
            message: 'Brand added successfully'
        });
    } catch (error) {
        console.error('Error in addBrand:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add brand',
            error: error.message
        });
    }
};

const updateBrand = async (req, res) => {
    try {
        const { brandId, brandName } = req.body;
        const updatedBrand = await Brand.findByIdAndUpdate(
            brandId,
            { brandName },
            { new: true }
        );
        res.json({ success: true, brand: updatedBrand });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update brand" });
    }
};

const toggleBlockBrand = async (req, res) => {
    try {
        const { brandId } = req.body;
        const brand = await Brand.findById(brandId);
        brand.isBlocked = !brand.isBlocked;
        await brand.save();
        res.json({ success: true, isBlocked: brand.isBlocked });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to toggle brand status" });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const { brandId } = req.body;
        await Brand.findByIdAndDelete(brandId);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete brand" });
    }
};

module.exports = {
    loadBrand,
    addBrand,
    updateBrand,
    toggleBlockBrand,
    deleteBrand
};