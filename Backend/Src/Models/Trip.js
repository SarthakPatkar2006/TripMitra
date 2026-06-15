import mongoose  from "mongoose";
const tripSchema=new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            trim:true
        },
        origin: {
    type: String,
    required: [true, "Please provide a starting location"]
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
    },
    travelStyle: {
  type: String,
  enum: [
    "budget",
    "balanced",
    "luxury"
  ],
  default: "balanced"
},

transportPreference: {
  type: String,
  enum: [
    "public",
    "cab",
    "rental"
  ],
  default: "public"
},

accommodationType: {
  type: String,
  enum: [
    "hostel",
    "hotel",
    "resort"
  ],
  default: "hotel"
},

numberOfTravelers: {
  type: Number,
  default: 1
}
    },
    {
        timestamps:true
    }
);
export default mongoose.model("Trip",tripSchema);