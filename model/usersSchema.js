const mongoose=require('mongoose')
const {Schema}=mongoose;

const userSchema = new Schema({
 
    FirstName:{
        type:String,
        required:true,
    },
    LastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    phone :{
        type:String,
        required:false,
        sparse:true,
        default:null,
    
    },
    googleId:{
        type: String,
        sparse: true,  
        unique: true
      },
    password:{
        type:String,
        require:false,
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
},{ minimize: false }); // ensure all fields are entered database
const user=mongoose.model("user",userSchema);

module.exports=user;







