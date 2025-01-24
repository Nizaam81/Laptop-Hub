const mongoose=require("mongoose")
const {Schema}=mongoose;

const bannerSchema=new Schema({
    image:{
        type:String,
        required:true
    },
    title:{
        type:string,
        required:true
    },
    description:{
        type:string,
        required:true
    },
    link:{
        type:string,
    },
    startDate:{
        type:Date,
        required:true,

    },
    endDate:{
        type:Date,
        required:true,
    }
})

const banner=mongoose.model("banner",bannerSchema)
module.exports=banner