const user = require("../../model/usersSchema")


const loadPlaceOrder = async (req, res) => {
    try {
        res.render("user/placeOrder");
    } catch (error) {
        console.error(error);
        console.log("Error in place order GET function");
    }
};

module.exports={
    loadPlaceOrder
}