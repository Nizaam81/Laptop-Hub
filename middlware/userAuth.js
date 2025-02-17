const user= require("../model/usersSchema")

const userAuth=(req,res,next)=>{
    if(req.session.user){
       user.findById(req.session.user)
       .then(data=>{
        if(data && !data.isBlocked){
            next()
        }else{
            return res.redirect('/user/login')
        }
       })
       .catch(error=>{
        console.log("error in user Auth middlware !!!")
         res.status(500).send("internal server error")   
    })

    }else{
        res.redirect('/user/login')
    }
   
}


module.exports={userAuth}