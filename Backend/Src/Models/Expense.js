import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true }, // Total money spent
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The person who paid
    
    // Array of users sharing this specific expense and their share amount
    splitBetween: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        share: { type: Number, required: true } // How much this specific person owes
    }]
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;