const user = require("../../model/usersSchema")




const loadcheckout = async(req,res)=>{
    try {
       res.render("user/checkout",{firstLetter:"",users:""}) 
    } catch (error) {
        console.error(error)
        console.log("error in checkout get")
    }
}

module.exports={
    loadcheckout
}