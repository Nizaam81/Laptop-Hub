const user= require("../../model/usersSchema")

const userprofile=async(req,res)=>{
    try {
        const userid =req.session.user
        const users= await user.findOne({_id:userid});

      res.render("user/userProfile",{users,firstLetter:""})  
    } catch (error) {
        console.log("error in userprofile")
        console.error(error)
    }
}

module.exports={
    userprofile
}