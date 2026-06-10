import mongoose  from "mongoose";
const tripSchema=new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            trim:true
        },
        destination:{
            type:String,
            required:true,
            trim:true,
        },
        tripType:{
   type:String,
   enum:[
      "solo",
      "group"
   ],
   default:"solo"
},
        startDate:{
            type:Date,
            required:true
        },
        endDate:{
            type:Date,
            required:true
        },
        budget:{
            type:Number,
            required:true,
            min:0,
        },
        description: {
      type: String,
      default: ""
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:[
            "planning","active","completed","cancelled"
        ],
        default:"planning"
    }

    },
    {
        timestamps:true
    }
);
export default mongoose.model("Trip",tripSchema);