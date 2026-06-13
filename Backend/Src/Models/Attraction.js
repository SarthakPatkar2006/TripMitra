import mongoose from "mongoose";

const attractionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    category: [{ type: String }], 
    description: { type: String },
    averageCost: { type: Number, required: true },
    estimatedDuration: { type: Number, required: true }, 
    rating: { type: Number, min: 0, max: 5, default: 0 }, 
    popularityScore: { type: Number, min: 0, max: 100, default: 0 }, 
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } 
    }
}, { timestamps: true });

attractionSchema.index({ location: '2dsphere' });

const Attraction = mongoose.model('Attraction', attractionSchema);

export default Attraction;