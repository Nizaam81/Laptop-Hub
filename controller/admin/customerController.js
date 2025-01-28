const user = require("../../model/usersSchema.js")


const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        let limit = 3;

        const userData = await user.find({
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }  // Added phone search
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await user.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }  // Added phone search
            ]
        });

        res.render("admin/customers", {
            users: userData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            search: search
        });
    } catch (error) {
        console.error("Error in customerInfo:", error);
        res.status(500).render("admin/customers", {
            error: "An error occurred while fetching customer information"
        });
    }
};

// Add block user controller
const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        await user.findByIdAndUpdate(userId, { isBlocked: true });
        res.redirect('/admin/users');
    } catch (error) {
        console.error("Error in blockUser:", error);
        res.status(500).redirect('/admin/users');
    }
};

// Add unblock user controller
const unblockUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        await user.findByIdAndUpdate(userId, { isBlocked: false });
        res.redirect('/admin/users');
    } catch (error) {
        console.error("Error in unblockUser:", error);
        res.status(500).redirect('/admin/users');
    }
};

module.exports = {
    customerInfo,
    blockUser,
    unblockUser
};