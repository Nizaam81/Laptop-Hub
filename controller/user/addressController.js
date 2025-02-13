const address=require("../../model/addressSchema")

const loadAddress= async(req,res)=>{
    try {
        res.render("user/address",{firstLetter:"",users:""})
    } catch (error) {
        console.log("dress function error ");
        
    }
}

const addAddres=async(req,res)=>{
    try {
        res.render("user/addAddress",{firstLetter:"",users:""})
    } catch (error) {
        console.log("error in addAddress route ")
    }
}

module.exports={
    loadAddress,
    addAddres
}