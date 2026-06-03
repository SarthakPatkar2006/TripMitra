import mongoose from 'mongoose';
const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_UR)
    }
}