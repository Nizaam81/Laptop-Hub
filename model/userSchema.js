const mongoose=require('mongoose')
const {schema}=mongoose;

const userSchema = new schema({
 
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    phone :{
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:string,
        unique:true,

    },
    password:{
        type:string,
        require:false,
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    isAdmin:{
        type:Boolean,
        defult:false
    },
    cart:[{
        type:schema.Types.objectId,
        ref:"cart"
        
    }],
    wallet:{
        type:Number,
        default:0
    },
    wishlist:[{
        type:schema.Types.objectId,
        ref:"wishlist"
    }],
    orderHistoty:[{
        type:schhema.Types.objectId,
        ref:"order"
    }],
    createdOn:{
        type:Date,
        default:Date.now,
    },
    referalcode:{
        type:String
    },
    redeemed:{
        type:Boolean,
    },
    redeemedUsers:[{
        type:schema.Types.objectId,
        ref:"User"
    }],
    searchHistory:[{
        category:{
            type:schema.Types.objectId,
            ref:"category",
        },
        brand:{
            type:string
        },
        searchOne:{
            type:Date,
            default:Date.now
        }
    }]
})

const user=mongoose.model("user",userSchema);

module.exports=user;







