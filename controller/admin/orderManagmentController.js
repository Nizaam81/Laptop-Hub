const user = require("../../model/usersSchema")
const address = require("../../model/addressSchema")

const loadOrder =async(req,res)=>{
    try {
        res.render("admin/orderManagment")
    } catch (error) {
        console.error(error)
        console.log("error in loadOrder Controller")
    }
}

module.exports={
    loadOrder
}